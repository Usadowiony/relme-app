export type QuestionType = 'single' | 'multi' | 'scale'

export type Tag = {
  id: string
  slug: string
  color: string | null
  is_scored: boolean
  created_at: string
}

export type QuizPath = {
  id: string
  name: string
  description: string | null
  created_at: string
}

export type Answer = {
  id: string
  question_id: string
  content: string
  target_path_id: string | null
  next_question_id: string | null
  created_at: string
}

export type AnswerTag = {
  answer_id: string
  tag_id: string
  points: number
  created_at: string
  tags?: Tag
}

export type Question = {
  id: string
  content: string
  question_type: QuestionType
  media_id: string | null
  path_id: string | null
  created_at: string
  media_assets?: { file_url: string } | null
  answers?: (Answer & { answer_tags?: AnswerTag[] })[]
}

// Payload Types for Mutating Data
export type QuestionPayload = {
  content: string
  question_type: QuestionType
  media_url?: string
}

export type AnswerPayload = {
  id?: string
  content: string
  tags: { tag_id: string; points: number }[]
}

// Layout & Version Control
export type LayoutPath = {
  answer_id: string
  path_name: string
  children: LayoutItem[]
}

export type LayoutItem = {
  question_id: string
  paths: LayoutPath[]
}

/** Legacy browser draft (localStorage) — only read once to import it into the DB. */
export type LegacyLocalDraft = {
  items: LayoutItem[]
  name: string
  lastModified: string
  versionId?: string
}

// ============================================================
// Versioning (T5.3) — a version is ONE frozen package: layout + questions
// + answers + tags with points. Users only ever get the live version.
// ============================================================

export type QuizContentTag = {
  tag_id: string
  tag_slug: string
  points: number
  is_scored: boolean
}

export type QuizContentAnswer = {
  id: string
  content: string
  tags: QuizContentTag[]
}

export type QuizContentQuestion = {
  id: string
  content: string
  question_type: QuestionType
  media_url: string | null
  answers: QuizContentAnswer[]
}

/** Frozen package built on the server (build_quiz_version_content). */
export type QuizVersionContent = {
  questions: Record<string, QuizContentQuestion>
  tags: { id: string; slug: string; color: string | null; is_scored: boolean }[]
}

/** DB status: 'draft' = saved, never published; 'archived' = was live before. */
export type QuizVersionStatus = 'draft' | 'live' | 'archived'

export type QuizVersion = {
  id: string
  name: string
  status: QuizVersionStatus
  version_number: number
  layout_data: LayoutItem[]
  content: QuizVersionContent
  question_count: number
  created_at: string
  published_at: string | null
  created_by: string | null
}

/** The admin's working layout (single row, autosaved with an optimistic lock). */
export type QuizDraft = {
  layout_data: LayoutItem[]
  revision: number
  updated_at: string
}

// Snapshot Pattern for Submissions
export type SnapshotTag = {
  tag_slug: string
  points: number
}

export type SnapshotAnswer = {
  answer_id: string
  content: string
  tags: SnapshotTag[]
}

export type SnapshotData = {
  question_content: string
  question_type: QuestionType
  answers: SnapshotAnswer[]
}

export type QuizSubmissionAnswer = {
  question_id: string
  selected_answer_ids: string[]
  snapshot: SnapshotData
}

export type QuizSubmissionPayload = {
  version_id: string
  answers: QuizSubmissionAnswer[]
}

/*
Proposed SQL Schema for Submissions:

CREATE TABLE quiz_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  version_id UUID REFERENCES quiz_versions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

CREATE TABLE submission_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID REFERENCES quiz_submissions(id) ON DELETE CASCADE,
  question_id UUID REFERENCES questions(id) ON DELETE SET NULL,
  selected_answer_ids UUID[] NOT NULL,
  snapshot JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
*/
