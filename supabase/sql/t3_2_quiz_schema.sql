-- 1. Create Enums
CREATE TYPE public.question_type_enum AS ENUM ('single', 'multi', 'scale');

-- 2. Create Tables
-- media_assets: Baza grafik
CREATE TABLE public.media_assets (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  file_url text NOT NULL,
  name text,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- quiz_paths: Definicje ścieżek/kategorii
CREATE TABLE public.quiz_paths (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- tags: Słownik oznaczeń
CREATE TABLE public.tags (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  slug text NOT NULL UNIQUE,
  color text,
  is_scored boolean DEFAULT false NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- questions: Pytania
CREATE TABLE public.questions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  content text NOT NULL,
  question_type public.question_type_enum NOT NULL,
  media_id uuid REFERENCES public.media_assets(id) ON DELETE CASCADE,
  path_id uuid REFERENCES public.quiz_paths(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- answers: Odpowiedzi pełniące rolę "zwrotnic" (Branching)
CREATE TABLE public.answers (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  question_id uuid NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  content text NOT NULL,
  target_path_id uuid REFERENCES public.quiz_paths(id) ON DELETE CASCADE,
  next_question_id uuid REFERENCES public.questions(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now() NOT NULL,
  -- Check Constraint: Jeśli target_path_id jest wypełnione, to next_question_id powinno być NULL i vice versa
  CONSTRAINT answers_branching_check CHECK (
    (target_path_id IS NULL AND next_question_id IS NULL) OR
    (target_path_id IS NOT NULL AND next_question_id IS NULL) OR
    (target_path_id IS NULL AND next_question_id IS NOT NULL)
  )
);

-- answer_tags: Tabela łącząca wiele-do-wielu dla Odpowiedzi i Tagów
CREATE TABLE public.answer_tags (
  answer_id uuid NOT NULL REFERENCES public.answers(id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  points integer DEFAULT 0 NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  PRIMARY KEY (answer_id, tag_id)
);


-- 3. Row Level Security (RLS)
-- Enable RLS for all 6 tables
ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.answer_tags ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
-- media_assets
CREATE POLICY "media_assets_select_auth" ON public.media_assets FOR SELECT TO authenticated USING (true);
CREATE POLICY "media_assets_insert_admin" ON public.media_assets FOR INSERT TO authenticated WITH CHECK (public.has_role('admin'));
CREATE POLICY "media_assets_update_admin" ON public.media_assets FOR UPDATE TO authenticated USING (public.has_role('admin'));
CREATE POLICY "media_assets_delete_admin" ON public.media_assets FOR DELETE TO authenticated USING (public.has_role('admin'));

-- quiz_paths
CREATE POLICY "quiz_paths_select_auth" ON public.quiz_paths FOR SELECT TO authenticated USING (true);
CREATE POLICY "quiz_paths_insert_admin" ON public.quiz_paths FOR INSERT TO authenticated WITH CHECK (public.has_role('admin'));
CREATE POLICY "quiz_paths_update_admin" ON public.quiz_paths FOR UPDATE TO authenticated USING (public.has_role('admin'));
CREATE POLICY "quiz_paths_delete_admin" ON public.quiz_paths FOR DELETE TO authenticated USING (public.has_role('admin'));

-- tags
CREATE POLICY "tags_select_auth" ON public.tags FOR SELECT TO authenticated USING (true);
CREATE POLICY "tags_insert_admin" ON public.tags FOR INSERT TO authenticated WITH CHECK (public.has_role('admin'));
CREATE POLICY "tags_update_admin" ON public.tags FOR UPDATE TO authenticated USING (public.has_role('admin'));
CREATE POLICY "tags_delete_admin" ON public.tags FOR DELETE TO authenticated USING (public.has_role('admin'));

-- questions
CREATE POLICY "questions_select_auth" ON public.questions FOR SELECT TO authenticated USING (true);
CREATE POLICY "questions_insert_admin" ON public.questions FOR INSERT TO authenticated WITH CHECK (public.has_role('admin'));
CREATE POLICY "questions_update_admin" ON public.questions FOR UPDATE TO authenticated USING (public.has_role('admin'));
CREATE POLICY "questions_delete_admin" ON public.questions FOR DELETE TO authenticated USING (public.has_role('admin'));

-- answers
CREATE POLICY "answers_select_auth" ON public.answers FOR SELECT TO authenticated USING (true);
CREATE POLICY "answers_insert_admin" ON public.answers FOR INSERT TO authenticated WITH CHECK (public.has_role('admin'));
CREATE POLICY "answers_update_admin" ON public.answers FOR UPDATE TO authenticated USING (public.has_role('admin'));
CREATE POLICY "answers_delete_admin" ON public.answers FOR DELETE TO authenticated USING (public.has_role('admin'));

-- answer_tags
CREATE POLICY "answer_tags_select_auth" ON public.answer_tags FOR SELECT TO authenticated USING (true);
CREATE POLICY "answer_tags_insert_admin" ON public.answer_tags FOR INSERT TO authenticated WITH CHECK (public.has_role('admin'));
CREATE POLICY "answer_tags_update_admin" ON public.answer_tags FOR UPDATE TO authenticated USING (public.has_role('admin'));
CREATE POLICY "answer_tags_delete_admin" ON public.answer_tags FOR DELETE TO authenticated USING (public.has_role('admin'));
