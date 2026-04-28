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

export type DraftState = {
  items: LayoutItem[]
  name: string
  lastModified: string
  versionId?: string
}

export type QuizVersion = {
  id: string
  name: string
  status: 'draft' | 'live' | 'archived'
  layout_data: LayoutItem[]
  question_count: number
  created_at: string
  published_at: string | null
  created_by: string | null
}
