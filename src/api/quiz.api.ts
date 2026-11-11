import { supabase } from './supabase'

import type {
  Tag,
  QuizPath,
  Question,
  QuestionPayload,
  AnswerPayload,
  LayoutItem,
  LegacyLocalDraft,
  QuizContentQuestion,
  QuizDraft,
  QuizVersion,
  QuizVersionContent,
  QuizSubmissionPayload
} from '../types/quiz'
import { validateTagPayload } from '../utils/validation'
import { layoutQuestionIds, validateQuizVersion } from '../utils/quizVersion'
import { rpcError } from './draftConflict'

// --- Stałe walidacyjne ---
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// --- Asercja autoryzacyjna (defense-in-depth) ---
// Odpytuje tabelę user_roles zamiast user_metadata,
// ponieważ user_metadata jest edytowalne z klienta (updateUser).
async function assertAdminRole(): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Brak zalogowanego użytkownika.')

  const { data: roleData } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .single()

  if (roleData?.role !== 'admin') {
    throw new Error('Brak uprawnień administratora.')
  }
}

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
  await assertAdminRole()
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
  await assertAdminRole()
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
  await assertAdminRole()

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
  await assertAdminRole()
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
      if (!first.start?.trim() || !first.end?.trim()) {
        throw new Error('Etykiety skali (początek, koniec) nie mogą być puste.')
      }
      if (first.start.length > 24 || first.end.length > 24) {
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
  await assertAdminRole()

  const { error } = await supabase.from('questions').delete().eq('id', id);
  if (error) throw error;
}

// =============================================
// DRAFT (working layout) — T5.3
// The question / tag library tables are the working copy of the content;
// the layout draft lives in quiz_draft (single row, optimistic lock).
// =============================================

export async function getQuizDraft(): Promise<QuizDraft> {
  const { data, error } = await supabase.from('quiz_draft').select('layout_data, revision, updated_at').single()
  if (error) throw new Error('Nie udało się pobrać szkicu układu quizu.')
  return data as QuizDraft
}

/** Saves the working layout if the DB still has `expectedRevision`. Returns the new revision. */
export async function saveQuizDraft(layout: LayoutItem[], expectedRevision: number): Promise<number> {
  const { data, error } = await supabase.rpc('save_quiz_draft_rpc', {
    p_layout: layout,
    p_expected_revision: expectedRevision,
  })
  if (error) throw rpcError(error, 'Nie udało się zapisać układu quizu.')
  return data as number
}

// --- Legacy browser draft (before T5.3 the layout draft lived in localStorage) ---
const LEGACY_DRAFT_KEY = 'relme_quiz_draft_wip'

/** Reads the old localStorage draft (imported once into the DB, then left as a backup). */
export function readLegacyLocalDraft(): LegacyLocalDraft | null {
  try {
    const data = localStorage.getItem(LEGACY_DRAFT_KEY)
    if (!data) return null
    const parsed = JSON.parse(data) as LegacyLocalDraft
    return Array.isArray(parsed?.items) ? parsed : null
  } catch {
    return null
  }
}

// =============================================
// VERSIONS — one frozen package (layout + questions + answers + tag points)
// =============================================

/** Builds the package for a layout from the current library (same function the DB uses when saving). */
export async function buildQuizContent(layout: LayoutItem[]): Promise<QuizVersionContent> {
  const { data, error } = await supabase.rpc('build_quiz_version_content', { p_layout: layout })
  if (error) throw new Error('Nie udało się porównać szkicu z wersjami.')
  return data as QuizVersionContent
}

export async function getQuizVersions(): Promise<QuizVersion[]> {
  const { data, error } = await supabase
    .from('quiz_versions')
    .select('*')
    .order('version_number', { ascending: false })

  if (error) throw new Error('Nie udało się pobrać wersji quizu.')
  return (data ?? []) as QuizVersion[]
}

/**
 * Saves the whole package (current draft layout + library content) as a new,
 * named version. The content is built on the server.
 */
export async function createQuizVersion(name: string, expectedRevision: number): Promise<string> {
  const trimmed = name.trim()
  if (trimmed.length === 0 || trimmed.length > 50) {
    throw new Error('Nazwa wersji musi mieć od 1 do 50 znaków.')
  }
  const { data, error } = await supabase.rpc('create_quiz_version_rpc', {
    p_name: trimmed,
    p_expected_revision: expectedRevision,
  })
  if (error) throw rpcError(error, 'Nie udało się zapisać wersji quizu.')
  return data as string
}

/** Publishes a version (the previous live one becomes archived). Requires a complete package. */
export async function publishQuizVersion(version: QuizVersion): Promise<void> {
  const issues = validateQuizVersion(version.layout_data, version.content)
  if (issues.length > 0) {
    throw new Error(`Wersja jest niekompletna: ${issues[0]}`)
  }
  const { error } = await supabase.rpc('publish_quiz_version_rpc', { target_version_id: version.id })
  if (error) throw rpcError(error, 'Nie udało się opublikować wersji quizu.')
}

/** Deletes a version that was never published and has no results (the DB blocks the rest). */
export async function deleteQuizVersion(id: string): Promise<void> {
  const { error } = await supabase.rpc('delete_quiz_version_rpc', { p_version_id: id })
  if (error) throw rpcError(error, 'Nie udało się usunąć wersji quizu.')
}

// =============================================
// QUIZ PLAYER (FRONTEND API)
// =============================================

/**
 * The live version with its questions taken from the FROZEN package, so
 * editing the library never changes what users see until a new publication.
 * Questions are returned in layout order (used for image preloading).
 */
export async function getLiveQuiz(): Promise<{ version: QuizVersion, questions: Question[] }> {
  const { data, error } = await supabase
    .from('quiz_versions')
    .select('*')
    .eq('status', 'live')
    .single()

  if (error || !data) {
    throw new Error('Brak opublikowanej wersji quizu.')
  }

  const version = data as QuizVersion
  const ordered = layoutQuestionIds(version.layout_data)
  const questions = ordered
    .map(id => version.content.questions[id])
    .filter((q): q is QuizContentQuestion => q !== undefined)
    .map(contentToQuestion)

  return { version, questions }
}

/** Maps a frozen question to the shape the player components already use. */
function contentToQuestion(q: QuizContentQuestion): Question {
  return {
    id: q.id,
    content: q.content,
    question_type: q.question_type,
    media_id: null,
    path_id: null,
    created_at: '',
    media_assets: q.media_url ? { file_url: q.media_url } : null,
    answers: q.answers.map(a => ({
      id: a.id,
      question_id: q.id,
      content: a.content,
      target_path_id: null,
      next_question_id: null,
      created_at: '',
      answer_tags: a.tags.map(t => ({
        answer_id: a.id,
        tag_id: t.tag_id,
        points: t.points,
        created_at: '',
        tags: { id: t.tag_id, slug: t.tag_slug, color: null, is_scored: t.is_scored, created_at: '' },
      })),
    })),
  }
}

/**
 * Sends the user's answers. The server validates them against the frozen
 * version and computes the result itself — the client snapshot is ignored.
 */
export async function submitQuizResult(payload: QuizSubmissionPayload): Promise<void> {
  // --- Guard Clauses (walidacja strukturalna) ---
  if (!payload.version_id || !UUID_REGEX.test(payload.version_id)) {
    throw new Error('Nieprawidłowy identyfikator wersji quizu.')
  }
  if (!Array.isArray(payload.answers) || payload.answers.length === 0) {
    throw new Error('Brak odpowiedzi do zapisania.')
  }
  for (const answer of payload.answers) {
    if (!answer.question_id || !UUID_REGEX.test(answer.question_id)) {
      throw new Error('Nieprawidłowy identyfikator pytania w odpowiedziach.')
    }
    if (!Array.isArray(answer.selected_answer_ids) || answer.selected_answer_ids.length === 0) {
      throw new Error('Brak zaznaczonych odpowiedzi dla jednego z pytań.')
    }
  }
  // --- Koniec walidacji ---

  const { error } = await supabase.rpc('submit_quiz_result_rpc', {
    payload
  })

  if (error) {
    console.error('Błąd zapisu wyniku:', error)
    if (error.message.includes('Użytkownik już ukończył quiz')) {
      throw new Error('Już wcześniej ukończyłeś ten quiz.');
    }
    throw new Error('Nie udało się zapisać wyniku quizu. Spróbuj ponownie.')
  }
}

/** Diagnostic result computed on the server (calculate_diagnostic_result). */
export type DiagnosticResult = {
  relation_path?: string | null
  user_style?: string | null
  partner_style?: string | null
}

export async function getUserQuizResult(): Promise<{ computed_result: DiagnosticResult, payment_status: string, created_at: string } | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Brak zalogowanego użytkownika')

  const { data, error } = await supabase
    .from('quiz_submissions')
    .select('computed_result, payment_status, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (error && error.code !== 'PGRST116') {
    throw new Error('Błąd pobierania wyników')
  }

  return data || null
}
