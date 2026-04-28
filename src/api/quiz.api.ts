import { supabase } from './supabase'

import type {
  Tag,
  QuizPath,
  Question,
  QuestionPayload,
  AnswerPayload,
  LayoutItem,
  DraftState,
  QuizVersion
} from '../types/quiz'
import { validateTagPayload } from '../utils/validation'
import { countLayoutQuestions } from '../utils/quizTree'

// Fetching Tags
export async function getTags(): Promise<Tag[]> {
  const { data, error } = await supabase
    .from('tags')
    .select('*')
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching tags:', error.message)
    return []
  }
  return data || []
}

// Create Tag
export async function createTag(tag: Pick<Tag, 'slug' | 'color' | 'is_scored'>): Promise<Tag> {
  validateTagPayload(tag)

  const { data, error } = await supabase
    .from('tags')
    .insert([tag])
    .select()
    .single()

  if (error) throw error
  return data
}

// Update Tag
export async function updateTag(id: string, tag: Partial<Tag>): Promise<Tag> {
  validateTagPayload(tag)

  const { data, error } = await supabase
    .from('tags')
    .update(tag)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

// Delete Tag
export async function deleteTag(id: string): Promise<void> {
  const { error } = await supabase
    .from('tags')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// Fetching Quiz Paths
export async function getQuizPaths(): Promise<QuizPath[]> {
  const { data, error } = await supabase
    .from('quiz_paths')
    .select('*')
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching quiz paths:', error.message)
    return []
  }
  return data || []
}

// Fetching Questions (with answers, tags, and points)
// Optimizing query using JOINs as requested in the architecture
export async function getQuestions(): Promise<Question[]> {
  const { data, error } = await supabase
    .from('questions')
    .select(`
      *,
      media_assets ( file_url ),
      answers!answers_question_id_fkey (
        *,
        answer_tags (
          *,
          tags (*)
        )
      )
    `)
    .order('created_at', { ascending: true })
    .order('created_at', { ascending: true, referencedTable: 'answers' })

  if (error) {
    console.error('Error fetching questions:', error.message)
    return []
  }
  return data || []
}

export async function saveQuestionWithAnswers(
  questionId: string | null,
  question: QuestionPayload,
  answers: AnswerPayload[]
): Promise<void> {
  // --- Backend Validation ---
  if (!question.content || question.content.trim().length === 0) {
    throw new Error('Treść pytania nie może być pusta.')
  }
  if (!['single', 'multi', 'scale'].includes(question.question_type)) {
    throw new Error('Nieprawidłowy typ pytania.')
  }

  if (question.question_type === 'scale') {
    // Scale: must have exactly 10 answers, first must have valid JSON with labels
    if (answers.length !== 10) {
      throw new Error('Pytanie skalowe musi zawierać dokładnie 10 wartości.')
    }
    try {
      const first = JSON.parse(answers[0].content)
      if (!first.start?.trim() || !first.mid?.trim() || !first.end?.trim()) {
        throw new Error('Etykiety skali (początek, środek, koniec) nie mogą być puste.')
      }
      if (first.start.length > 24 || first.mid.length > 24 || first.end.length > 24) {
        throw new Error('Etykiety skali nie mogą przekraczać 24 znaków.')
      }
    } catch (e) {
      if (e instanceof Error && e.message.startsWith('Etykiety')) throw e
      throw new Error('Nieprawidłowy format danych skali.')
    }
  } else {
    // Single / multi: minimum 2 answers, all non-empty
    if (answers.length < 2) {
      throw new Error('Pytanie musi zawierać minimum 2 odpowiedzi.')
    }
    for (const ans of answers) {
      if (!ans.content || ans.content.trim().length === 0) {
        throw new Error('Treść odpowiedzi nie może być pusta.')
      }
    }
  }

  // Validate scored tags have positive points
  // Fetch tag data to know which are scored
  const allTagIds = [...new Set(answers.flatMap(a => a.tags.map(t => t.tag_id)))]
  if (allTagIds.length > 0) {
    const { data: tagData } = await supabase
      .from('tags')
      .select('id, is_scored')
      .in('id', allTagIds)

    const scoredTagIds = new Set(tagData?.filter(t => t.is_scored).map(t => t.id) || [])

    for (const ans of answers) {
      for (const t of ans.tags) {
        if (scoredTagIds.has(t.tag_id) && (t.points === undefined || t.points <= 0)) {
          throw new Error('Punktowane oznaczenia muszą mieć wartość większą od 0.')
        }
      }
    }
  }
  // --- End Validation ---

  const payload = {
    questionId: questionId || null,
    question,
    answers: answers.map(ans => ({
      ...ans,
      id: ans.id || null
    }))
  };

  const { error } = await supabase.rpc('save_question_with_answers_rpc', { payload });
  
  if (error) {
    console.error("RAW SUPABASE ERROR:", error);
    if (error.code === '23503') {
      throw new Error('Jedno z przypisanych oznaczeń zostało usunięte z bazy danych. Odśwież stronę i spróbuj ponownie.');
    }
    throw new Error('Wystąpił błąd podczas zapisywania pytania. Spróbuj ponownie.');
  }
}

export async function deleteQuestion(id: string): Promise<void> {
  const { error } = await supabase.from('questions').delete().eq('id', id);
  if (error) throw error;
}

// =============================================
// LAYOUT & VERSION CONTROL
// =============================================

// --- localStorage Draft Management ---
const DRAFT_STORAGE_KEY = 'relme_quiz_draft_wip'

export function saveDraftToLocal(draft: DraftState): void {
  localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft))
}

export function loadDraftFromLocal(): DraftState | null {
  const data = localStorage.getItem(DRAFT_STORAGE_KEY)
  if (!data) return null
  try { return JSON.parse(data) } catch { return null }
}

export function clearLocalDraft(): void {
  localStorage.removeItem(DRAFT_STORAGE_KEY)
}

// --- Quiz Versions API ---
export async function getQuizVersions(): Promise<QuizVersion[]> {
  const { data, error } = await supabase
    .from('quiz_versions')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching quiz versions:', error.message)
    return []
  }
  return data || []
}

export async function saveQuizDraft(name: string, layoutData: LayoutItem[]): Promise<QuizVersion> {
  if (!name || name.trim().length === 0) {
    throw new Error('Nazwa draftu nie może być pusta.')
  }

  const { data: { user } } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('quiz_versions')
    .insert({
      name: name.trim(),
      status: 'draft',
      layout_data: layoutData,
      question_count: countLayoutQuestions(layoutData),
      created_by: user?.id || null
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateQuizDraft(id: string, name: string, layoutData: LayoutItem[]): Promise<void> {
  const { error } = await supabase
    .from('quiz_versions')
    .update({
      name: name.trim(),
      layout_data: layoutData,
      question_count: countLayoutQuestions(layoutData)
    })
    .eq('id', id)

  if (error) throw error
}

export async function deleteQuizVersion(id: string): Promise<void> {
  const { error } = await supabase
    .from('quiz_versions')
    .delete()
    .eq('id', id)

  if (error) throw error
}

export async function publishQuizVersion(id: string): Promise<void> {
  try {
    const { error } = await supabase.rpc('publish_quiz_version_rpc', { target_version_id: id })
    if (error) throw error
  } catch (error: any) {
    console.error('Error publishing quiz version:', error)
    throw new Error(error.message || 'Nie udało się opublikować wersji quizu. Spróbuj ponownie.')
  }
}
