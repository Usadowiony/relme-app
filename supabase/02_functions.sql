-- =============================================================================
-- RELME — database backup, part 2/3: functions, RPCs and triggers
-- =============================================================================
-- Run after 01_schema.sql. Policies (03_policies.sql) depend on has_role().
-- Includes triggers on auth.users (new-user bootstrap) and the DDL event trigger
-- that auto-enables RLS on new public tables.
-- RULE: update in place whenever a function/trigger changes in the live DB.
-- Last synced with live DB: 2026-11-08 (T5.1b)
-- =============================================================================

-- ---------- Role helper (used by all admin policies) ----------
CREATE OR REPLACE FUNCTION public.has_role(requested_role app_role)
 RETURNS boolean
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = requested_role
  );
$function$;

-- ---------- New-user bootstrap triggers (on auth.users) ----------
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  user_meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  meta_full_name text := nullif(trim(coalesce(user_meta->>'full_name', user_meta->>'name')), '');
  meta_given_name text := nullif(trim(coalesce(user_meta->>'given_name', split_part(meta_full_name, ' ', 1))), '');
  derived_family_name text :=
    case
      when meta_full_name is not null and strpos(meta_full_name, ' ') > 0 then trim(substr(meta_full_name, strpos(meta_full_name, ' ') + 1))
      else null
    end;
  meta_family_name text := nullif(trim(coalesce(user_meta->>'family_name', derived_family_name)), '');
  meta_gender text := nullif(trim(user_meta->>'gender'), '');
  meta_avatar_url text := nullif(trim(coalesce(user_meta->>'avatar_url', user_meta->>'picture')), '');
  meta_birthdate_text text := nullif(trim(coalesce(user_meta->>'birthdate', user_meta->>'date_of_birth')), '');
  meta_birthdate date;
begin
  if meta_birthdate_text ~ '^\d{4}-\d{2}-\d{2}$' then
    meta_birthdate := meta_birthdate_text::date;
  end if;

  insert into public.profiles (id, first_name, last_name, date_of_birth, gender, avatar_url)
  values (new.id, meta_given_name, meta_family_name, meta_birthdate, meta_gender, meta_avatar_url)
  on conflict (id) do update
  set
    first_name = coalesce(public.profiles.first_name, excluded.first_name),
    last_name = coalesce(public.profiles.last_name, excluded.last_name),
    date_of_birth = coalesce(public.profiles.date_of_birth, excluded.date_of_birth),
    gender = coalesce(public.profiles.gender, excluded.gender),
    avatar_url = coalesce(public.profiles.avatar_url, excluded.avatar_url);

  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user_role()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, 'user')
  ON CONFLICT (user_id) DO NOTHING;

  RETURN new;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user_quiz_status()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.user_quiz_status (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.set_profile_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$function$;

-- ---------- User / subscription RPCs ----------
CREATE OR REPLACE FUNCTION public.assign_subscription_tier(selected_tier text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF selected_tier NOT IN ('free', 'premium') THEN
    RAISE EXCEPTION 'Invalid tier: %', selected_tier;
  END IF;

  IF EXISTS (SELECT 1 FROM public.subscriptions WHERE user_id = auth.uid()) THEN
    RAISE EXCEPTION 'Subscription already exists for this user';
  END IF;

  INSERT INTO public.subscriptions (user_id, tier)
  VALUES (auth.uid(), selected_tier);
END;
$function$;

CREATE OR REPLACE FUNCTION public.complete_quiz()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.user_quiz_status
  SET quiz_completed = true,
      completed_at   = now()
  WHERE user_id = auth.uid()
    AND quiz_completed = false;
END;
$function$;

-- ---------- Quiz RPCs ----------
CREATE OR REPLACE FUNCTION public.publish_quiz_version_rpc(target_version_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    UPDATE public.quiz_versions SET status = 'archived' WHERE status = 'live';
    UPDATE public.quiz_versions SET status = 'live', published_at = now() WHERE id = target_version_id;
EXCEPTION
    WHEN OTHERS THEN
        RAISE;
END;
$function$;

CREATE OR REPLACE FUNCTION public.save_question_with_answers_rpc(payload jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_question_id uuid;
    v_media_id uuid;
    v_existing_media_id uuid;
    v_answer jsonb;
    v_tag jsonb;
    v_answer_id uuid;
    v_existing_answers uuid[];
    v_payload_answer_ids uuid[];
BEGIN
    -- Extract or handle media
    IF payload->'question'->>'media_url' IS NOT NULL THEN
        SELECT id INTO v_existing_media_id FROM public.media_assets WHERE file_url = payload->'question'->>'media_url' LIMIT 1;
        IF v_existing_media_id IS NOT NULL THEN
            v_media_id := v_existing_media_id;
        ELSE
            INSERT INTO public.media_assets (file_url) VALUES (payload->'question'->>'media_url') RETURNING id INTO v_media_id;
        END IF;
    END IF;

    -- Upsert question
    IF payload->>'questionId' IS NOT NULL THEN
        v_question_id := (payload->>'questionId')::uuid;
        UPDATE public.questions SET
            content = payload->'question'->>'content',
            -- Explicit cast text -> ENUM
            question_type = (payload->'question'->>'question_type')::public.question_type_enum,
            media_id = v_media_id
        WHERE id = v_question_id;
    ELSE
        INSERT INTO public.questions (content, question_type, media_id)
        VALUES (
            payload->'question'->>'content',
            (payload->'question'->>'question_type')::public.question_type_enum,
            v_media_id
        ) RETURNING id INTO v_question_id;
    END IF;

    -- Handle answers
    -- get existing answer ids
    SELECT array_agg(id) INTO v_existing_answers FROM public.answers WHERE question_id = v_question_id;

    -- extract payload answer ids
    SELECT array_agg((a->>'id')::uuid) INTO v_payload_answer_ids
    FROM jsonb_array_elements(payload->'answers') a
    WHERE a->>'id' IS NOT NULL;

    -- delete answers not in payload
    IF v_existing_answers IS NOT NULL THEN
        DELETE FROM public.answers WHERE question_id = v_question_id AND id = ANY(v_existing_answers) AND (v_payload_answer_ids IS NULL OR NOT (id = ANY(v_payload_answer_ids)));
    END IF;

    -- loop answers
    FOR v_answer IN SELECT * FROM jsonb_array_elements(payload->'answers')
    LOOP
        IF v_answer->>'id' IS NOT NULL THEN
            v_answer_id := (v_answer->>'id')::uuid;
            UPDATE public.answers SET content = v_answer->>'content' WHERE id = v_answer_id;
        ELSE
            INSERT INTO public.answers (question_id, content) VALUES (v_question_id, v_answer->>'content') RETURNING id INTO v_answer_id;
        END IF;

        -- delete existing tags for this answer
        DELETE FROM public.answer_tags WHERE answer_id = v_answer_id;

        -- insert new tags
        IF jsonb_typeof(v_answer->'tags') = 'array' THEN
            FOR v_tag IN SELECT * FROM jsonb_array_elements(v_answer->'tags')
            LOOP
                INSERT INTO public.answer_tags (answer_id, tag_id, points)
                VALUES (v_answer_id, (v_tag->>'tag_id')::uuid, COALESCE((v_tag->>'points')::int, 0));
            END LOOP;
        END IF;
    END LOOP;

    RETURN jsonb_build_object('question_id', v_question_id);
EXCEPTION
    WHEN OTHERS THEN
        RAISE;
END;
$function$;

CREATE OR REPLACE FUNCTION public.submit_quiz_result_rpc(payload jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_user_id UUID;
  v_already_completed BOOLEAN;
  v_is_admin BOOLEAN;
  new_submission_id UUID;
  ans JSONB;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Brak autoryzacji. Użytkownik nie jest zalogowany.';
  END IF;

  -- Role check: admins skip the completion-status check
  v_is_admin := public.has_role('admin');

  IF NOT v_is_admin THEN
    -- Read from user_quiz_status (not profiles)
    SELECT quiz_completed INTO v_already_completed
    FROM public.user_quiz_status
    WHERE user_id = v_user_id;

    IF v_already_completed THEN
      RAISE EXCEPTION 'Użytkownik już ukończył quiz. Nie można wysłać ponownie.';
    END IF;
  END IF;

  INSERT INTO quiz_submissions (user_id, version_id, completed_at, payment_status)
  VALUES (
    v_user_id,
    (payload->>'version_id')::UUID,
    now(),
    'unpaid'
  )
  RETURNING id INTO new_submission_id;

  FOR ans IN SELECT * FROM jsonb_array_elements(payload->'answers')
  LOOP
    INSERT INTO submission_answers (
      submission_id,
      question_id,
      selected_answer_ids,
      snapshot
    )
    VALUES (
      new_submission_id,
      (ans->>'question_id')::UUID,
      (SELECT array_agg(x::text::uuid) FROM jsonb_array_elements_text(ans->'selected_answer_ids') x),
      ans->'snapshot'
    );
  END LOOP;

  -- Compute saturation and result
  UPDATE quiz_submissions
  SET computed_result = calculate_diagnostic_result(new_submission_id)
  WHERE id = new_submission_id;

  -- Write to user_quiz_status (not profiles)
  UPDATE public.user_quiz_status
  SET quiz_completed = true,
      completed_at = now()
  WHERE user_id = v_user_id;

  RETURN new_submission_id;

EXCEPTION
  WHEN OTHERS THEN
    RAISE;
END;
$function$;

CREATE OR REPLACE FUNCTION public.calculate_diagnostic_result(v_submission_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
AS $function$
DECLARE
  v_result JSONB;
BEGIN
  WITH extracted_tags AS (
    SELECT
      tag->>'tag_slug' as tag_slug,
      (tag->>'points')::numeric as points
    FROM submission_answers sa,
    jsonb_array_elements(sa.snapshot->'answers') as ans,
    jsonb_array_elements(ans->'tags') as tag
    WHERE sa.submission_id = v_submission_id
      AND (ans->>'answer_id')::uuid = ANY(sa.selected_answer_ids)
  ),
  aggregated_tags AS (
    SELECT tag_slug, SUM(points) as total_points
    FROM extracted_tags
    GROUP BY tag_slug
  ),
  relation_path AS (
    SELECT tag_slug, total_points
    FROM aggregated_tags
    WHERE tag_slug IN ('poznac-siebie', 'poznac-kogos', 'pielegnowac-relacje')
    ORDER BY total_points DESC
    LIMIT 1
  ),
  user_style AS (
    SELECT tag_slug, total_points
    FROM aggregated_tags
    WHERE tag_slug IN ('bezp-styl', 'lek-styl', 'unik-styl')
    ORDER BY total_points DESC
    LIMIT 1
  ),
  partner_style AS (
    SELECT tag_slug, total_points
    FROM aggregated_tags
    WHERE tag_slug IN ('part-bezp-styl', 'part-unik-styl', 'part-lek-styl')
    ORDER BY total_points DESC
    LIMIT 1
  )
  SELECT jsonb_build_object(
    'relation_path', (SELECT tag_slug FROM relation_path),
    'user_style', (SELECT tag_slug FROM user_style),
    'partner_style', (SELECT tag_slug FROM partner_style)
  ) INTO v_result;

  RETURN COALESCE(v_result, '{}'::jsonb);
END;
$function$;

-- ---------- Module RPCs ----------
-- Modules are independent; flow_data is a linear list of views (schema_version 2).
CREATE OR REPLACE FUNCTION public.save_module_flow_rpc(p_module_id uuid, p_flow_data jsonb)
 RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.has_role('admin') THEN
    RAISE EXCEPTION 'Brak uprawnień administratora.';
  END IF;

  IF (p_flow_data->>'schema_version') IS DISTINCT FROM '2'
     OR jsonb_typeof(p_flow_data->'views') IS DISTINCT FROM 'array' THEN
    RAISE EXCEPTION 'Nieprawidłowa struktura modułu.';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.modules WHERE id = p_module_id AND status = 'draft') THEN
    RAISE EXCEPTION 'Moduł nie istnieje lub nie jest w trybie draft.';
  END IF;

  -- Whole flow is written on every call (fine for MVP).
  UPDATE public.modules SET flow_data = p_flow_data, updated_at = now() WHERE id = p_module_id;
EXCEPTION WHEN OTHERS THEN
  RAISE;
END;
$function$;

CREATE OR REPLACE FUNCTION public.publish_module_rpc(p_module_id uuid)
 RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.has_role('admin') THEN
    RAISE EXCEPTION 'Brak uprawnień administratora.';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.modules WHERE id = p_module_id AND status = 'draft') THEN
    RAISE EXCEPTION 'Moduł nie istnieje lub nie jest w trybie draft.';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.modules
    WHERE id = p_module_id AND jsonb_array_length(COALESCE(flow_data->'views', '[]'::jsonb)) > 0
  ) THEN
    RAISE EXCEPTION 'Moduł musi mieć co najmniej jeden widok.';
  END IF;

  -- Modules are independent: publishing one does not affect others.
  UPDATE public.modules SET status = 'published', updated_at = now() WHERE id = p_module_id;
EXCEPTION WHEN OTHERS THEN
  RAISE;
END;
$function$;

CREATE OR REPLACE FUNCTION public.set_module_status_rpc(p_module_id uuid, p_status text)
 RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  v_current text;
BEGIN
  IF NOT public.has_role('admin') THEN
    RAISE EXCEPTION 'Brak uprawnień administratora.';
  END IF;

  SELECT status INTO v_current FROM public.modules WHERE id = p_module_id;
  IF v_current IS NULL THEN
    RAISE EXCEPTION 'Moduł nie istnieje.';
  END IF;

  -- Allowed: published -> draft (unpublish to edit), draft|published -> archived.
  IF NOT (
    (v_current = 'published' AND p_status = 'draft')
    OR (v_current IN ('draft', 'published') AND p_status = 'archived')
  ) THEN
    RAISE EXCEPTION 'Niedozwolona zmiana statusu: % -> %.', v_current, p_status;
  END IF;

  UPDATE public.modules SET status = p_status, updated_at = now() WHERE id = p_module_id;
EXCEPTION WHEN OTHERS THEN
  RAISE;
END;
$function$;

CREATE OR REPLACE FUNCTION public.upsert_module_progress_rpc(p_module_id uuid, p_current_node_id text, p_tag_updates jsonb DEFAULT '{}'::jsonb)
 RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id UUID := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Brak zalogowanego użytkownika.';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.modules WHERE id = p_module_id AND status = 'published') THEN
    RAISE EXCEPTION 'Moduł nie istnieje lub nie jest opublikowany.';
  END IF;

  INSERT INTO public.module_progress (user_id, module_id, current_node_id, collected_tags)
  VALUES (v_user_id, p_module_id, p_current_node_id, p_tag_updates)
  ON CONFLICT (user_id, module_id) DO UPDATE SET
    current_node_id = EXCLUDED.current_node_id,
    collected_tags = public.module_progress.collected_tags || p_tag_updates,
    updated_at = now();
EXCEPTION WHEN OTHERS THEN
  RAISE;
END;
$function$;

-- ---------- Event trigger function: auto-enable RLS on new public tables ----------
-- (Supabase default; the event trigger itself is created by the platform.)
CREATE OR REPLACE FUNCTION public.rls_auto_enable()
 RETURNS event_trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$function$;

-- ---------- Triggers ----------
CREATE TRIGGER set_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION set_profile_updated_at();
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user_profile();
CREATE TRIGGER on_auth_user_created_assign_role AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user_role();
CREATE TRIGGER on_auth_user_created_quiz_status AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user_quiz_status();
