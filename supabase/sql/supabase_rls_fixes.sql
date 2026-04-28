-- Poprawa polityk RLS dla tabeli quiz_versions (Błąd K4)
DROP POLICY IF EXISTS "Authenticated users manage quiz_versions" ON public.quiz_versions;

CREATE POLICY "quiz_versions_select_auth" ON public.quiz_versions
FOR SELECT USING (true);

CREATE POLICY "quiz_versions_insert_admin" ON public.quiz_versions
FOR INSERT WITH CHECK (has_role('admin'::app_role));

CREATE POLICY "quiz_versions_update_admin" ON public.quiz_versions
FOR UPDATE USING (has_role('admin'::app_role));

CREATE POLICY "quiz_versions_delete_admin" ON public.quiz_versions
FOR DELETE USING (has_role('admin'::app_role));
