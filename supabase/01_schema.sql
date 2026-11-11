-- =============================================================================
-- RELME — database backup, part 1/3: extensions, types, tables, constraints
-- =============================================================================
-- Snapshot of the LIVE Supabase dev DB (public schema + quiz-media bucket).
-- Run order for a full rebuild: 01_schema.sql -> 02_functions.sql -> 03_policies.sql
--
-- RULE: any change to the database MUST be reflected in these files in the same
-- task (update the relevant statement in place, do not append migrations).
-- Last synced with live DB: 2026-11-08 (T5.1b)
-- =============================================================================

-- ---------- Extensions ----------
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "supabase_vault";

-- ---------- Enum types ----------
CREATE TYPE public.app_role AS ENUM ('user', 'mentor', 'admin');
CREATE TYPE public.question_type_enum AS ENUM ('single', 'multi', 'scale');

-- ---------- Tables ----------
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  first_name text,
  last_name text,
  date_of_birth date,
  gender text,
  avatar_url text,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE public.user_roles (
  user_id uuid NOT NULL,
  role app_role NOT NULL DEFAULT 'user'::app_role,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE public.user_quiz_status (
  user_id uuid NOT NULL,
  quiz_completed boolean NOT NULL DEFAULT false,
  completed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.subscriptions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  tier text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.media_assets (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  file_url text NOT NULL,
  name text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.quiz_paths (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.tags (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  slug text NOT NULL,
  color text,
  is_scored boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.questions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  content text NOT NULL,
  question_type question_type_enum NOT NULL,
  media_id uuid,
  path_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.answers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  question_id uuid NOT NULL,
  content text NOT NULL,
  target_path_id uuid,
  next_question_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.answer_tags (
  answer_id uuid NOT NULL,
  tag_id uuid NOT NULL,
  points integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.quiz_versions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT 'Nowy Draft'::text,
  status text NOT NULL DEFAULT 'draft'::text,
  layout_data jsonb NOT NULL DEFAULT '[]'::jsonb,
  question_count integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  published_at timestamp with time zone,
  created_by uuid
);

CREATE TABLE public.quiz_submissions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  version_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  completed_at timestamp with time zone DEFAULT now(),
  computed_result jsonb DEFAULT '{}'::jsonb,
  payment_status text DEFAULT 'unpaid'::text
);

CREATE TABLE public.submission_answers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  submission_id uuid,
  question_id uuid,
  selected_answer_ids uuid[] NOT NULL,
  snapshot jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.modules (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  cover_media_id uuid,
  status text NOT NULL DEFAULT 'draft'::text,
  flow_data jsonb NOT NULL DEFAULT '{"schema_version": 2, "views": []}'::jsonb,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.modules IS 'Moduły Wiedzy — kontenery bloków edukacyjnych z liniową listą widoków.';
COMMENT ON COLUMN public.modules.flow_data IS 'Linear list of views: {schema_version: 2, views: [{id, block_type, config}]}. No branches — block logic/sub-views live inside config.';

CREATE TABLE public.module_progress (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  module_id uuid NOT NULL,
  current_node_id text NOT NULL,
  completed_at timestamp with time zone,
  collected_tags jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.module_progress IS 'Postęp użytkownika w danym module — bieżący węzeł i zebrane tagi.';
COMMENT ON COLUMN public.module_progress.current_node_id IS 'Id of the current view in modules.flow_data.views.';

-- ---------- Row Level Security (enabled on every table) ----------
ALTER TABLE public.profiles           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_quiz_status   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_assets       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_paths         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.answers            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.answer_tags        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_versions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_submissions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submission_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modules            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.module_progress    ENABLE ROW LEVEL SECURITY;

-- ---------- Primary keys ----------
ALTER TABLE public.answer_tags ADD CONSTRAINT answer_tags_pkey PRIMARY KEY (answer_id, tag_id);
ALTER TABLE public.answers ADD CONSTRAINT answers_pkey PRIMARY KEY (id);
ALTER TABLE public.media_assets ADD CONSTRAINT media_assets_pkey PRIMARY KEY (id);
ALTER TABLE public.module_progress ADD CONSTRAINT module_progress_pkey PRIMARY KEY (id);
ALTER TABLE public.modules ADD CONSTRAINT modules_pkey PRIMARY KEY (id);
ALTER TABLE public.profiles ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);
ALTER TABLE public.questions ADD CONSTRAINT questions_pkey PRIMARY KEY (id);
ALTER TABLE public.quiz_paths ADD CONSTRAINT quiz_paths_pkey PRIMARY KEY (id);
ALTER TABLE public.quiz_submissions ADD CONSTRAINT quiz_submissions_pkey PRIMARY KEY (id);
ALTER TABLE public.quiz_versions ADD CONSTRAINT quiz_versions_pkey PRIMARY KEY (id);
ALTER TABLE public.submission_answers ADD CONSTRAINT submission_answers_pkey PRIMARY KEY (id);
ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_pkey PRIMARY KEY (id);
ALTER TABLE public.tags ADD CONSTRAINT tags_pkey PRIMARY KEY (id);
ALTER TABLE public.user_quiz_status ADD CONSTRAINT user_quiz_status_pkey PRIMARY KEY (user_id);
ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_pkey PRIMARY KEY (user_id);

-- ---------- Unique constraints ----------
ALTER TABLE public.module_progress ADD CONSTRAINT module_progress_user_id_module_id_key UNIQUE (user_id, module_id);
ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_user_id_key UNIQUE (user_id);
ALTER TABLE public.tags ADD CONSTRAINT tags_slug_key UNIQUE (slug);

-- ---------- Check constraints ----------
ALTER TABLE public.answers ADD CONSTRAINT answers_branching_check CHECK ((((target_path_id IS NULL) AND (next_question_id IS NULL)) OR ((target_path_id IS NOT NULL) AND (next_question_id IS NULL)) OR ((target_path_id IS NULL) AND (next_question_id IS NOT NULL))));
ALTER TABLE public.modules ADD CONSTRAINT modules_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'published'::text, 'archived'::text])));
ALTER TABLE public.profiles ADD CONSTRAINT profiles_date_of_birth_adult CHECK (((date_of_birth IS NULL) OR (date_of_birth <= ((CURRENT_DATE - '18 years'::interval))::date))) NOT VALID;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_first_name_valid CHECK (((first_name IS NULL) OR (((char_length(btrim(first_name)) >= 2) AND (char_length(btrim(first_name)) <= 60)) AND (btrim(first_name) ~ '^[[:alpha:]][[:alpha:] ''-]{1,59}$'::text))));
ALTER TABLE public.profiles ADD CONSTRAINT profiles_gender_allowed_values CHECK (((gender IS NULL) OR (gender = ANY (ARRAY['male'::text, 'female'::text, 'other'::text]))));
ALTER TABLE public.profiles ADD CONSTRAINT profiles_last_name_valid CHECK (((last_name IS NULL) OR (((char_length(btrim(last_name)) >= 2) AND (char_length(btrim(last_name)) <= 60)) AND (btrim(last_name) ~ '^[[:alpha:]][[:alpha:] ''-]{1,59}$'::text))));
ALTER TABLE public.quiz_versions ADD CONSTRAINT quiz_versions_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'live'::text, 'archived'::text])));
ALTER TABLE public.tags ADD CONSTRAINT tags_color_check CHECK (((color IS NULL) OR (color ~* '^#[0-9a-f]{6}$'::text)));
ALTER TABLE public.tags ADD CONSTRAINT tags_slug_check CHECK (((length(TRIM(BOTH FROM slug)) > 0) AND (length(slug) <= 20)));

-- ---------- Foreign keys ----------
ALTER TABLE public.answer_tags ADD CONSTRAINT answer_tags_answer_id_fkey FOREIGN KEY (answer_id) REFERENCES public.answers(id) ON DELETE CASCADE;
ALTER TABLE public.answer_tags ADD CONSTRAINT answer_tags_tag_id_fkey FOREIGN KEY (tag_id) REFERENCES public.tags(id) ON DELETE CASCADE;
ALTER TABLE public.answers ADD CONSTRAINT answers_next_question_id_fkey FOREIGN KEY (next_question_id) REFERENCES public.questions(id) ON DELETE CASCADE;
ALTER TABLE public.answers ADD CONSTRAINT answers_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.questions(id) ON DELETE CASCADE;
ALTER TABLE public.answers ADD CONSTRAINT answers_target_path_id_fkey FOREIGN KEY (target_path_id) REFERENCES public.quiz_paths(id) ON DELETE CASCADE;
ALTER TABLE public.module_progress ADD CONSTRAINT module_progress_module_id_fkey FOREIGN KEY (module_id) REFERENCES public.modules(id) ON DELETE CASCADE;
ALTER TABLE public.module_progress ADD CONSTRAINT module_progress_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.modules ADD CONSTRAINT modules_cover_media_id_fkey FOREIGN KEY (cover_media_id) REFERENCES public.media_assets(id) ON DELETE SET NULL;
ALTER TABLE public.modules ADD CONSTRAINT modules_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.questions ADD CONSTRAINT questions_media_id_fkey FOREIGN KEY (media_id) REFERENCES public.media_assets(id) ON DELETE SET NULL;
ALTER TABLE public.questions ADD CONSTRAINT questions_path_id_fkey FOREIGN KEY (path_id) REFERENCES public.quiz_paths(id) ON DELETE CASCADE;
ALTER TABLE public.quiz_submissions ADD CONSTRAINT quiz_submissions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.quiz_submissions ADD CONSTRAINT quiz_submissions_version_id_fkey FOREIGN KEY (version_id) REFERENCES public.quiz_versions(id) ON DELETE CASCADE;
ALTER TABLE public.quiz_versions ADD CONSTRAINT quiz_versions_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);
ALTER TABLE public.submission_answers ADD CONSTRAINT submission_answers_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.questions(id) ON DELETE SET NULL;
ALTER TABLE public.submission_answers ADD CONSTRAINT submission_answers_submission_id_fkey FOREIGN KEY (submission_id) REFERENCES public.quiz_submissions(id) ON DELETE CASCADE;
ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.user_quiz_status ADD CONSTRAINT user_quiz_status_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- ---------- Storage ----------
-- Public bucket for quiz media. (No custom policies exist on storage.objects in the live DB.)
INSERT INTO storage.buckets (id, name, public) VALUES ('quiz-media', 'quiz-media', true)
ON CONFLICT (id) DO NOTHING;
