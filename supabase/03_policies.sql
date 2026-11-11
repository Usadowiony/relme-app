-- =============================================================================
-- RELME — database backup, part 3/3: Row Level Security policies
-- =============================================================================
-- Run after 01_schema.sql and 02_functions.sql (policies call has_role()).
-- RULE: update in place whenever a policy changes in the live DB.
-- Last synced with live DB: 2026-11-11 (T5.3)
-- =============================================================================

-- ---------- answer_tags ----------
CREATE POLICY "Public read access for answer_tags" ON public.answer_tags AS PERMISSIVE FOR SELECT TO anon, authenticated
  USING (true);
CREATE POLICY "answer_tags_select_auth" ON public.answer_tags AS PERMISSIVE FOR SELECT TO authenticated
  USING (true);
CREATE POLICY "answer_tags_insert_admin" ON public.answer_tags AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK (has_role('admin'::app_role));
CREATE POLICY "answer_tags_update_admin" ON public.answer_tags AS PERMISSIVE FOR UPDATE TO authenticated
  USING (has_role('admin'::app_role));
CREATE POLICY "answer_tags_delete_admin" ON public.answer_tags AS PERMISSIVE FOR DELETE TO authenticated
  USING (has_role('admin'::app_role));

-- ---------- answers ----------
CREATE POLICY "Public read access for answers" ON public.answers AS PERMISSIVE FOR SELECT TO anon, authenticated
  USING (true);
CREATE POLICY "answers_select_auth" ON public.answers AS PERMISSIVE FOR SELECT TO authenticated
  USING (true);
CREATE POLICY "answers_insert_admin" ON public.answers AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK (has_role('admin'::app_role));
CREATE POLICY "answers_update_admin" ON public.answers AS PERMISSIVE FOR UPDATE TO authenticated
  USING (has_role('admin'::app_role));
CREATE POLICY "answers_delete_admin" ON public.answers AS PERMISSIVE FOR DELETE TO authenticated
  USING (has_role('admin'::app_role));

-- ---------- media_assets ----------
CREATE POLICY "media_assets_select_auth" ON public.media_assets AS PERMISSIVE FOR SELECT TO authenticated
  USING (true);
CREATE POLICY "media_assets_insert_admin" ON public.media_assets AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK (has_role('admin'::app_role));
CREATE POLICY "media_assets_update_admin" ON public.media_assets AS PERMISSIVE FOR UPDATE TO authenticated
  USING (has_role('admin'::app_role));
CREATE POLICY "media_assets_delete_admin" ON public.media_assets AS PERMISSIVE FOR DELETE TO authenticated
  USING (has_role('admin'::app_role));

-- ---------- module_drafts ----------
-- Admins read; writes only through save_module_draft_rpc / modules_create_draft trigger.
CREATE POLICY "module_drafts_admin_select" ON public.module_drafts AS PERMISSIVE FOR SELECT TO public
  USING (has_role('admin'::app_role));

-- ---------- module_progress ----------
CREATE POLICY "module_progress_admin_select" ON public.module_progress AS PERMISSIVE FOR SELECT TO public
  USING (has_role('admin'::app_role));
CREATE POLICY "module_progress_owner_select" ON public.module_progress AS PERMISSIVE FOR SELECT TO public
  USING ((user_id = auth.uid()));
CREATE POLICY "module_progress_owner_insert" ON public.module_progress AS PERMISSIVE FOR INSERT TO public
  WITH CHECK ((user_id = auth.uid()));
CREATE POLICY "module_progress_owner_update" ON public.module_progress AS PERMISSIVE FOR UPDATE TO public
  USING ((user_id = auth.uid()))
  WITH CHECK ((user_id = auth.uid()));

-- ---------- module_versions ----------
-- Admins read; writes only through RPCs. Users read the live version and any
-- version they have progress on (to finish an older version).
CREATE POLICY "module_versions_admin_select" ON public.module_versions AS PERMISSIVE FOR SELECT TO public
  USING (has_role('admin'::app_role));
CREATE POLICY "module_versions_user_select" ON public.module_versions AS PERMISSIVE FOR SELECT TO public
  USING (((auth.uid() IS NOT NULL) AND ((EXISTS ( SELECT 1
   FROM modules m
  WHERE (m.live_version_id = module_versions.id))) OR (EXISTS ( SELECT 1
   FROM module_progress p
  WHERE ((p.module_version_id = module_versions.id) AND (p.user_id = auth.uid())))))));

-- ---------- modules ----------
CREATE POLICY "modules_admin_all" ON public.modules AS PERMISSIVE FOR ALL TO public
  USING (has_role('admin'::app_role))
  WITH CHECK (has_role('admin'::app_role));
CREATE POLICY "modules_select_live" ON public.modules AS PERMISSIVE FOR SELECT TO public
  USING (((auth.uid() IS NOT NULL) AND (live_version_id IS NOT NULL)));

-- ---------- profiles ----------
CREATE POLICY "profiles_select_own" ON public.profiles AS PERMISSIVE FOR SELECT TO authenticated
  USING ((auth.uid() = id));
CREATE POLICY "profiles_update_own" ON public.profiles AS PERMISSIVE FOR UPDATE TO authenticated
  USING ((auth.uid() = id))
  WITH CHECK ((auth.uid() = id));

-- ---------- questions ----------
CREATE POLICY "Public read access for questions" ON public.questions AS PERMISSIVE FOR SELECT TO anon, authenticated
  USING (true);
CREATE POLICY "questions_select_auth" ON public.questions AS PERMISSIVE FOR SELECT TO authenticated
  USING (true);
CREATE POLICY "questions_insert_admin" ON public.questions AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK (has_role('admin'::app_role));
CREATE POLICY "questions_update_admin" ON public.questions AS PERMISSIVE FOR UPDATE TO authenticated
  USING (has_role('admin'::app_role));
CREATE POLICY "questions_delete_admin" ON public.questions AS PERMISSIVE FOR DELETE TO authenticated
  USING (has_role('admin'::app_role));

-- ---------- quiz_paths ----------
CREATE POLICY "quiz_paths_select_auth" ON public.quiz_paths AS PERMISSIVE FOR SELECT TO authenticated
  USING (true);
CREATE POLICY "quiz_paths_insert_admin" ON public.quiz_paths AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK (has_role('admin'::app_role));
CREATE POLICY "quiz_paths_update_admin" ON public.quiz_paths AS PERMISSIVE FOR UPDATE TO authenticated
  USING (has_role('admin'::app_role));
CREATE POLICY "quiz_paths_delete_admin" ON public.quiz_paths AS PERMISSIVE FOR DELETE TO authenticated
  USING (has_role('admin'::app_role));

-- ---------- quiz_submissions ----------
CREATE POLICY "Uzytkownik widzi swoje submisje" ON public.quiz_submissions AS PERMISSIVE FOR SELECT TO public
  USING ((auth.uid() = user_id));

-- ---------- quiz_draft ----------
-- Admins read; writes only through save_quiz_draft_rpc.
CREATE POLICY "quiz_draft_admin_select" ON public.quiz_draft AS PERMISSIVE FOR SELECT TO public
  USING (has_role('admin'::app_role));

-- ---------- quiz_versions ----------
-- Read by players (live version) and the admin panel; no direct writes —
-- create / publish / delete only through the quiz versioning RPCs.
CREATE POLICY "quiz_versions_select_auth" ON public.quiz_versions AS PERMISSIVE FOR SELECT TO public
  USING (true);

-- ---------- submission_answers ----------
CREATE POLICY "Uzytkownik widzi odpowiedzi swoich submisji" ON public.submission_answers AS PERMISSIVE FOR SELECT TO public
  USING ((submission_id IN ( SELECT quiz_submissions.id
   FROM quiz_submissions
  WHERE (quiz_submissions.user_id = auth.uid()))));

-- ---------- subscriptions ----------
CREATE POLICY "Users can view own subscription" ON public.subscriptions AS PERMISSIVE FOR SELECT TO public
  USING ((auth.uid() = user_id));

-- ---------- tags ----------
CREATE POLICY "Public read access for tags" ON public.tags AS PERMISSIVE FOR SELECT TO anon, authenticated
  USING (true);
CREATE POLICY "tags_select_auth" ON public.tags AS PERMISSIVE FOR SELECT TO authenticated
  USING (true);
CREATE POLICY "tags_insert_admin" ON public.tags AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK (has_role('admin'::app_role));
CREATE POLICY "tags_update_admin" ON public.tags AS PERMISSIVE FOR UPDATE TO authenticated
  USING (has_role('admin'::app_role));
CREATE POLICY "tags_delete_admin" ON public.tags AS PERMISSIVE FOR DELETE TO authenticated
  USING (has_role('admin'::app_role));

-- ---------- user_quiz_status ----------
CREATE POLICY "users_select_own_quiz_status" ON public.user_quiz_status AS PERMISSIVE FOR SELECT TO public
  USING ((auth.uid() = user_id));

-- ---------- user_roles ----------
CREATE POLICY "Users can read own role" ON public.user_roles AS PERMISSIVE FOR SELECT TO authenticated
  USING ((auth.uid() = user_id));
CREATE POLICY "Admins can manage all roles" ON public.user_roles AS PERMISSIVE FOR ALL TO authenticated
  USING (has_role('admin'::app_role));
