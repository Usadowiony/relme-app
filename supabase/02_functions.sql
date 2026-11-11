-- =============================================================================
-- RELME — database backup, part 2/3: functions, RPCs and triggers
-- =============================================================================
-- Run after 01_schema.sql. Policies (03_policies.sql) depend on has_role().
-- Includes triggers on auth.users (new-user bootstrap) and the DDL event trigger
-- that auto-enables RLS on new public tables.
-- RULE: update in place whenever a function/trigger changes in the live DB.
-- Last synced with live DB: 2026-11-11 (T5.3)
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

-- ---------- Quiz versioning (T5.3) ----------
-- A quiz version is ONE frozen package (layout + questions + answers + tag
-- points). Library edits reach users only after a new version is published.

-- Builds the package for a layout from the current library:
-- { questions: { "<id>": { id, content, question_type, media_url,
--                          answers: [ { id, content, tags: [ { tag_id, tag_slug, points, is_scored } ] } ] } },
--   tags: [ { id, slug, color, is_scored } ] }
-- Answers are ordered like in the app (created_at).
CREATE OR REPLACE FUNCTION public.build_quiz_version_content(p_layout jsonb)
 RETURNS jsonb LANGUAGE sql STABLE SET search_path TO 'public'
AS $function$
  WITH qids AS (
    SELECT DISTINCT (q #>> '{}')::uuid AS id
    FROM jsonb_path_query(p_layout, 'lax $.**.question_id') AS q
  ),
  ans AS (
    SELECT a.question_id,
           jsonb_agg(jsonb_build_object(
             'id', a.id,
             'content', a.content,
             'tags', COALESCE((
               SELECT jsonb_agg(jsonb_build_object('tag_id', t.id, 'tag_slug', t.slug, 'points', at.points, 'is_scored', t.is_scored) ORDER BY t.slug)
               FROM public.answer_tags at JOIN public.tags t ON t.id = at.tag_id
               WHERE at.answer_id = a.id
             ), '[]'::jsonb)
           ) ORDER BY a.created_at, a.id) AS answers
    FROM public.answers a JOIN qids ON qids.id = a.question_id
    GROUP BY a.question_id
  ),
  used_tags AS (
    SELECT DISTINCT t.id, t.slug, t.color, t.is_scored
    FROM public.answers a
    JOIN qids ON qids.id = a.question_id
    JOIN public.answer_tags at ON at.answer_id = a.id
    JOIN public.tags t ON t.id = at.tag_id
  )
  SELECT jsonb_build_object(
    'questions', COALESCE((
      SELECT jsonb_object_agg(q.id::text, jsonb_build_object(
        'id', q.id,
        'content', q.content,
        'question_type', q.question_type::text,
        'media_url', ma.file_url,
        'answers', COALESCE(ans.answers, '[]'::jsonb)
      ))
      FROM public.questions q
      JOIN qids ON qids.id = q.id
      LEFT JOIN public.media_assets ma ON ma.id = q.media_id
      LEFT JOIN ans ON ans.question_id = q.id
    ), '{}'::jsonb),
    'tags', COALESCE((
      SELECT jsonb_agg(jsonb_build_object('id', id, 'slug', slug, 'color', color, 'is_scored', is_scored) ORDER BY slug)
      FROM used_tags
    ), '[]'::jsonb)
  );
$function$;

-- Versions are immutable; status moves only draft→live, live→archived, archived→live;
-- a version that was ever live or has results cannot be deleted.
CREATE OR REPLACE FUNCTION public.quiz_versions_guard()
 RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public'
AS $function$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF NEW.name IS DISTINCT FROM OLD.name
       OR NEW.layout_data IS DISTINCT FROM OLD.layout_data
       OR NEW.content IS DISTINCT FROM OLD.content
       OR NEW.version_number IS DISTINCT FROM OLD.version_number
       OR NEW.question_count IS DISTINCT FROM OLD.question_count
       OR NEW.created_at IS DISTINCT FROM OLD.created_at
       OR NEW.created_by IS DISTINCT FROM OLD.created_by THEN
      RAISE EXCEPTION 'Zapisana wersja quizu nie może być zmieniana.';
    END IF;
    IF NEW.status IS DISTINCT FROM OLD.status AND NOT (
         (OLD.status = 'draft' AND NEW.status = 'live')
      OR (OLD.status = 'live' AND NEW.status = 'archived')
      OR (OLD.status = 'archived' AND NEW.status = 'live')
    ) THEN
      RAISE EXCEPTION 'Niedozwolona zmiana statusu wersji: % -> %.', OLD.status, NEW.status;
    END IF;
    IF OLD.published_at IS NOT NULL AND NEW.published_at IS NULL THEN
      RAISE EXCEPTION 'Nie można cofnąć informacji o publikacji wersji.';
    END IF;
    RETURN NEW;
  END IF;

  IF OLD.status <> 'draft' OR OLD.published_at IS NOT NULL THEN
    RAISE EXCEPTION 'Nie można usunąć wersji, która była opublikowana.';
  END IF;
  IF EXISTS (SELECT 1 FROM public.quiz_submissions WHERE version_id = OLD.id) THEN
    RAISE EXCEPTION 'Nie można usunąć wersji, do której są zapisane wyniki użytkowników.';
  END IF;
  RETURN OLD;
END;
$function$;

-- Autosave of the working layout. SQLSTATE RL409 = changed elsewhere meanwhile.
CREATE OR REPLACE FUNCTION public.save_quiz_draft_rpc(p_layout jsonb, p_expected_revision integer)
 RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  v_revision integer;
BEGIN
  IF NOT public.has_role('admin') THEN
    RAISE EXCEPTION 'Brak uprawnień administratora.';
  END IF;
  IF jsonb_typeof(p_layout) IS DISTINCT FROM 'array' THEN
    RAISE EXCEPTION 'Nieprawidłowa struktura układu quizu.';
  END IF;

  UPDATE public.quiz_draft
     SET layout_data = p_layout, revision = revision + 1, updated_by = auth.uid(), updated_at = now()
   WHERE id AND revision = p_expected_revision
  RETURNING revision INTO v_revision;

  IF v_revision IS NULL THEN
    RAISE EXCEPTION 'Szkic quizu został zmieniony w innym oknie lub przez inną osobę.' USING ERRCODE = 'RL409';
  END IF;
  RETURN v_revision;
END;
$function$;

-- Saves the WHOLE package (draft layout + current library content) as a new,
-- named version. The content is built on the server, never sent by the client.
CREATE OR REPLACE FUNCTION public.create_quiz_version_rpc(p_name text, p_expected_revision integer)
 RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  v_draft public.quiz_draft%ROWTYPE;
  v_number integer;
  v_id uuid;
BEGIN
  IF NOT public.has_role('admin') THEN
    RAISE EXCEPTION 'Brak uprawnień administratora.';
  END IF;
  IF p_name IS NULL OR char_length(btrim(p_name)) NOT BETWEEN 1 AND 50 THEN
    RAISE EXCEPTION 'Nazwa wersji musi mieć od 1 do 50 znaków.';
  END IF;

  -- Locks the draft row: one version save at a time, stable numbering.
  SELECT * INTO v_draft FROM public.quiz_draft WHERE id FOR UPDATE;
  IF v_draft.revision IS DISTINCT FROM p_expected_revision THEN
    RAISE EXCEPTION 'Szkic quizu został zmieniony w innym oknie lub przez inną osobę.' USING ERRCODE = 'RL409';
  END IF;

  SELECT COALESCE(MAX(version_number), 0) + 1 INTO v_number FROM public.quiz_versions;

  INSERT INTO public.quiz_versions (name, status, layout_data, content, question_count, version_number, created_by)
  VALUES (
    btrim(p_name),
    'draft',
    v_draft.layout_data,
    public.build_quiz_version_content(v_draft.layout_data),
    (SELECT count(*) FROM jsonb_path_query(v_draft.layout_data, 'lax $.**.question_id')),
    v_number,
    auth.uid()
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$function$;

-- Same name/argument as before (compatibility), now admin-checked and guarded.
-- Makes a saved version live; the previous live version becomes archived.
-- Full content validation runs in the admin panel; the DB checks that the
-- package is not empty and contains the tags the result algorithm needs.
CREATE OR REPLACE FUNCTION public.publish_quiz_version_rpc(target_version_id uuid)
 RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  v_version public.quiz_versions%ROWTYPE;
  v_slugs text[];
BEGIN
  IF NOT public.has_role('admin') THEN
    RAISE EXCEPTION 'Brak uprawnień administratora.';
  END IF;

  SELECT * INTO v_version FROM public.quiz_versions WHERE id = target_version_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Wersja nie istnieje.';
  END IF;
  IF v_version.status = 'live' THEN
    RAISE EXCEPTION 'Ta wersja jest już opublikowana.';
  END IF;
  IF v_version.content->'questions' = '{}'::jsonb THEN
    RAISE EXCEPTION 'Nie można opublikować wersji bez pytań.';
  END IF;

  SELECT array_agg(t->>'slug') INTO v_slugs FROM jsonb_array_elements(v_version.content->'tags') t;
  IF NOT (v_slugs && ARRAY['poznac-siebie', 'poznac-kogos', 'pielegnowac-relacje']
      AND v_slugs && ARRAY['bezp-styl', 'lek-styl', 'unik-styl']
      AND v_slugs && ARRAY['part-bezp-styl', 'part-unik-styl', 'part-lek-styl']) THEN
    RAISE EXCEPTION 'Wersja nie zawiera oznaczeń potrzebnych do wyliczenia wyniku (ścieżka, styl użytkownika, styl partnera).';
  END IF;

  UPDATE public.quiz_versions SET status = 'archived' WHERE status = 'live';
  UPDATE public.quiz_versions
     SET status = 'live', published_at = COALESCE(published_at, now())
   WHERE id = target_version_id;
END;
$function$;

-- Removes a version that was never published and has no results (guard trigger).
CREATE OR REPLACE FUNCTION public.delete_quiz_version_rpc(p_version_id uuid)
 RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.has_role('admin') THEN
    RAISE EXCEPTION 'Brak uprawnień administratora.';
  END IF;
  DELETE FROM public.quiz_versions WHERE id = p_version_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Wersja nie istnieje.';
  END IF;
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

-- ---------- Quiz result submission ----------
-- Same signature/payload as before (web + mobile keep working). The client
-- `snapshot` is IGNORED: the stored snapshot (question, answers, tag points)
-- is rebuilt from quiz_versions.content, and every selected answer is checked
-- against that version.
CREATE OR REPLACE FUNCTION public.submit_quiz_result_rpc(payload jsonb)
 RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id uuid := auth.uid();
  v_already_completed boolean;
  v_version public.quiz_versions%ROWTYPE;
  v_submission_id uuid;
  ans jsonb;
  v_qid uuid;
  v_question jsonb;
  v_selected uuid[];
  v_seen uuid[] := '{}';
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Brak autoryzacji. Użytkownik nie jest zalogowany.';
  END IF;

  -- Admins may submit repeatedly (testing); users only once.
  IF NOT public.has_role('admin') THEN
    SELECT quiz_completed INTO v_already_completed FROM public.user_quiz_status WHERE user_id = v_user_id;
    IF v_already_completed THEN
      RAISE EXCEPTION 'Użytkownik już ukończył quiz. Nie można wysłać ponownie.';
    END IF;
  END IF;

  -- Live or previously live (someone may finish a quiz started before a new publication).
  SELECT * INTO v_version FROM public.quiz_versions
   WHERE id = (payload->>'version_id')::uuid AND status IN ('live', 'archived');
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Nieprawidłowa lub nieopublikowana wersja quizu.';
  END IF;

  IF jsonb_typeof(payload->'answers') IS DISTINCT FROM 'array' OR jsonb_array_length(payload->'answers') = 0 THEN
    RAISE EXCEPTION 'Brak odpowiedzi do zapisania.';
  END IF;

  INSERT INTO public.quiz_submissions (user_id, version_id, completed_at, payment_status)
  VALUES (v_user_id, v_version.id, now(), 'unpaid')
  RETURNING id INTO v_submission_id;

  FOR ans IN SELECT * FROM jsonb_array_elements(payload->'answers')
  LOOP
    v_qid := (ans->>'question_id')::uuid;
    IF v_qid = ANY (v_seen) THEN
      RAISE EXCEPTION 'Pytanie występuje w odpowiedziach więcej niż raz.';
    END IF;
    v_seen := v_seen || v_qid;

    v_question := v_version.content->'questions'->(v_qid::text);
    IF v_question IS NULL THEN
      RAISE EXCEPTION 'Pytanie nie należy do tej wersji quizu.';
    END IF;

    SELECT array_agg(DISTINCT x::uuid) INTO v_selected
      FROM jsonb_array_elements_text(ans->'selected_answer_ids') x;
    IF v_selected IS NULL OR cardinality(v_selected) = 0 THEN
      RAISE EXCEPTION 'Brak zaznaczonej odpowiedzi dla jednego z pytań.';
    END IF;
    IF (v_question->>'question_type') IN ('single', 'scale') AND cardinality(v_selected) <> 1 THEN
      RAISE EXCEPTION 'To pytanie wymaga dokładnie jednej odpowiedzi.';
    END IF;
    IF EXISTS (
      SELECT 1 FROM unnest(v_selected) s
      WHERE NOT EXISTS (
        SELECT 1 FROM jsonb_array_elements(v_question->'answers') a WHERE (a->>'id')::uuid = s
      )
    ) THEN
      RAISE EXCEPTION 'Wybrana odpowiedź nie należy do pytania.';
    END IF;

    INSERT INTO public.submission_answers (submission_id, question_id, selected_answer_ids, snapshot)
    VALUES (
      v_submission_id,
      -- the library question may have been deleted since the version was saved
      CASE WHEN EXISTS (SELECT 1 FROM public.questions WHERE id = v_qid) THEN v_qid END,
      v_selected,
      jsonb_build_object(
        'question_content', v_question->>'content',
        'question_type', v_question->>'question_type',
        'answers', (
          SELECT jsonb_agg(jsonb_build_object(
            'answer_id', a->>'id',
            'content', a->>'content',
            'tags', COALESCE((
              SELECT jsonb_agg(jsonb_build_object('tag_slug', t->>'tag_slug', 'points', (t->>'points')::int))
              FROM jsonb_array_elements(a->'tags') t
            ), '[]'::jsonb)
          ))
          FROM jsonb_array_elements(v_question->'answers') a
        )
      )
    );
  END LOOP;

  UPDATE public.quiz_submissions
     SET computed_result = public.calculate_diagnostic_result(v_submission_id)
   WHERE id = v_submission_id;

  UPDATE public.user_quiz_status
     SET quiz_completed = true, completed_at = now()
   WHERE user_id = v_user_id;

  RETURN v_submission_id;
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

-- ---------- Module trigger functions (guards, draft bootstrap) ----------
-- Versions are immutable; published versions can never be deleted.
CREATE OR REPLACE FUNCTION public.module_versions_guard()
 RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public'
AS $function$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF NEW.flow_data IS DISTINCT FROM OLD.flow_data
       OR NEW.name IS DISTINCT FROM OLD.name
       OR NEW.module_id IS DISTINCT FROM OLD.module_id
       OR NEW.version_number IS DISTINCT FROM OLD.version_number
       OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
      RAISE EXCEPTION 'Zapisana wersja modułu nie może być zmieniana.';
    END IF;
    IF OLD.published_at IS NOT NULL AND NEW.published_at IS NULL THEN
      RAISE EXCEPTION 'Nie można cofnąć informacji o publikacji wersji.';
    END IF;
    RETURN NEW;
  END IF;

  IF OLD.published_at IS NOT NULL THEN
    RAISE EXCEPTION 'Nie można usunąć wersji, która była opublikowana.';
  END IF;
  RETURN OLD;
END;
$function$;

-- A module that was ever published cannot be deleted (users may have used it).
CREATE OR REPLACE FUNCTION public.modules_delete_guard()
 RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public'
AS $function$
BEGIN
  IF OLD.live_version_id IS NOT NULL
     OR EXISTS (SELECT 1 FROM public.module_versions WHERE module_id = OLD.id AND published_at IS NOT NULL) THEN
    RAISE EXCEPTION 'Nie można usunąć modułu, który był opublikowany.';
  END IF;
  RETURN OLD;
END;
$function$;

-- Every new module automatically gets an empty draft.
CREATE OR REPLACE FUNCTION public.modules_create_draft()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.module_drafts (module_id, updated_by) VALUES (NEW.id, auth.uid());
  RETURN NEW;
END;
$function$;

-- ---------- Module RPCs (versioning model, T5.2) ----------
-- Autosave. Fails with SQLSTATE RL409 when the draft changed since the editor
-- loaded it (other tab / other admin). Returns the new revision.
CREATE OR REPLACE FUNCTION public.save_module_draft_rpc(p_module_id uuid, p_flow_data jsonb, p_expected_revision integer)
 RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  v_revision integer;
BEGIN
  IF NOT public.has_role('admin') THEN
    RAISE EXCEPTION 'Brak uprawnień administratora.';
  END IF;

  IF (p_flow_data->>'schema_version') IS DISTINCT FROM '2'
     OR jsonb_typeof(p_flow_data->'views') IS DISTINCT FROM 'array' THEN
    RAISE EXCEPTION 'Nieprawidłowa struktura modułu.';
  END IF;

  UPDATE public.module_drafts
     SET flow_data = p_flow_data, revision = revision + 1, updated_by = auth.uid(), updated_at = now()
   WHERE module_id = p_module_id AND revision = p_expected_revision
  RETURNING revision INTO v_revision;

  IF v_revision IS NULL THEN
    IF NOT EXISTS (SELECT 1 FROM public.module_drafts WHERE module_id = p_module_id) THEN
      RAISE EXCEPTION 'Moduł nie istnieje.';
    END IF;
    RAISE EXCEPTION 'Szkic modułu został zmieniony w innym oknie lub przez inną osobę.' USING ERRCODE = 'RL409';
  END IF;

  UPDATE public.modules SET updated_at = now() WHERE id = p_module_id;
  RETURN v_revision;
END;
$function$;

-- Snapshot of the current draft as a new named version (next number).
-- p_expected_revision makes sure the snapshot is exactly what the admin sees.
CREATE OR REPLACE FUNCTION public.create_module_version_rpc(p_module_id uuid, p_name text, p_expected_revision integer)
 RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  v_draft public.module_drafts%ROWTYPE;
  v_number integer;
  v_id uuid;
BEGIN
  IF NOT public.has_role('admin') THEN
    RAISE EXCEPTION 'Brak uprawnień administratora.';
  END IF;

  IF p_name IS NULL OR char_length(btrim(p_name)) NOT BETWEEN 1 AND 60 THEN
    RAISE EXCEPTION 'Nazwa wersji musi mieć od 1 do 60 znaków.';
  END IF;

  -- Lock the module row so two saves cannot take the same number.
  PERFORM 1 FROM public.modules WHERE id = p_module_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Moduł nie istnieje.';
  END IF;

  SELECT * INTO v_draft FROM public.module_drafts WHERE module_id = p_module_id;
  IF v_draft.revision IS DISTINCT FROM p_expected_revision THEN
    RAISE EXCEPTION 'Szkic modułu został zmieniony w innym oknie lub przez inną osobę.' USING ERRCODE = 'RL409';
  END IF;

  SELECT COALESCE(MAX(version_number), 0) + 1 INTO v_number
    FROM public.module_versions WHERE module_id = p_module_id;

  INSERT INTO public.module_versions (module_id, version_number, name, flow_data, created_by)
  VALUES (p_module_id, v_number, btrim(p_name), v_draft.flow_data, auth.uid())
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$function$;

-- Makes a saved version live (replaces the previous live version, which stays
-- available to users who are in the middle of it).
CREATE OR REPLACE FUNCTION public.publish_module_version_rpc(p_version_id uuid)
 RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  v_version public.module_versions%ROWTYPE;
BEGIN
  IF NOT public.has_role('admin') THEN
    RAISE EXCEPTION 'Brak uprawnień administratora.';
  END IF;

  SELECT * INTO v_version FROM public.module_versions WHERE id = p_version_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Wersja nie istnieje.';
  END IF;

  IF jsonb_array_length(COALESCE(v_version.flow_data->'views', '[]'::jsonb)) = 0 THEN
    RAISE EXCEPTION 'Nie można opublikować wersji bez widoków.';
  END IF;

  UPDATE public.module_versions SET published_at = COALESCE(published_at, now()) WHERE id = p_version_id;
  UPDATE public.modules SET live_version_id = p_version_id, updated_at = now() WHERE id = v_version.module_id;
END;
$function$;

-- Removes a version that was never published.
CREATE OR REPLACE FUNCTION public.delete_module_version_rpc(p_version_id uuid)
 RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.has_role('admin') THEN
    RAISE EXCEPTION 'Brak uprawnień administratora.';
  END IF;
  -- The guard trigger blocks published versions.
  DELETE FROM public.module_versions WHERE id = p_version_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Wersja nie istnieje.';
  END IF;
END;
$function$;

-- User progress: a new attempt starts on the live version; an attempt in
-- progress keeps its version even if a newer one is published meanwhile.
-- (Restarting on the newest version will be handled with the mobile player.)
CREATE OR REPLACE FUNCTION public.upsert_module_progress_rpc(p_module_id uuid, p_current_node_id text, p_tag_updates jsonb DEFAULT '{}'::jsonb)
 RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id uuid := auth.uid();
  v_live uuid;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Brak zalogowanego użytkownika.';
  END IF;

  SELECT live_version_id INTO v_live FROM public.modules WHERE id = p_module_id;
  IF v_live IS NULL THEN
    RAISE EXCEPTION 'Moduł nie istnieje lub nie jest opublikowany.';
  END IF;

  INSERT INTO public.module_progress (user_id, module_id, module_version_id, current_node_id, collected_tags)
  VALUES (v_user_id, p_module_id, v_live, p_current_node_id, p_tag_updates)
  ON CONFLICT (user_id, module_id) DO UPDATE SET
    current_node_id = EXCLUDED.current_node_id,
    collected_tags = public.module_progress.collected_tags || p_tag_updates,
    updated_at = now();
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
CREATE TRIGGER module_versions_guard BEFORE UPDATE OR DELETE ON public.module_versions FOR EACH ROW EXECUTE FUNCTION public.module_versions_guard();
CREATE TRIGGER modules_delete_guard BEFORE DELETE ON public.modules FOR EACH ROW EXECUTE FUNCTION public.modules_delete_guard();
CREATE TRIGGER modules_create_draft AFTER INSERT ON public.modules FOR EACH ROW EXECUTE FUNCTION public.modules_create_draft();
CREATE TRIGGER quiz_versions_guard BEFORE UPDATE OR DELETE ON public.quiz_versions FOR EACH ROW EXECUTE FUNCTION public.quiz_versions_guard();
