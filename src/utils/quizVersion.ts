import type { LayoutItem, QuizVersionContent } from '../types/quiz'

// ============================================================
// Quiz version package — one validation for the whole package
// (layout + questions/answers + tag points). Used for the draft preview in
// "Kontrola wersji" and before publishing. Saving is always allowed.
// ============================================================

/** Tag groups the diagnostic result needs (calculate_diagnostic_result). */
export const REQUIRED_TAG_GROUPS: { label: string; slugs: string[] }[] = [
  { label: 'ścieżka relacji', slugs: ['poznac-siebie', 'poznac-kogos', 'pielegnowac-relacje'] },
  { label: 'styl użytkownika', slugs: ['bezp-styl', 'lek-styl', 'unik-styl'] },
  { label: 'styl partnera', slugs: ['part-bezp-styl', 'part-unik-styl', 'part-lek-styl'] },
]

const SCALE_ANSWERS = 10

/** Unique question ids in layout order (depth-first, like the player walks it). */
export function layoutQuestionIds(items: LayoutItem[]): string[] {
  const seen = new Set<string>()
  const visit = (nodes: LayoutItem[]) => {
    for (const node of nodes) {
      seen.add(node.question_id)
      for (const path of node.paths) visit(path.children)
    }
  }
  visit(items)
  return [...seen]
}

function short(text: string, max = 40): string {
  const t = text.trim()
  return t.length > max ? `${t.slice(0, max)}…` : t || '(bez treści)'
}

/** Problems that block publishing; empty array = complete package. */
export function validateQuizVersion(layout: LayoutItem[], content: QuizVersionContent): string[] {
  const issues: string[] = []
  const ids = layoutQuestionIds(layout)

  if (ids.length === 0) return ['Układ quizu jest pusty.']

  const missing = ids.filter(id => !content.questions[id]).length
  if (missing > 0) {
    issues.push(`Układ zawiera ${missing} ${missing === 1 ? 'pytanie usunięte' : 'pytania usunięte'} z biblioteki.`)
  }

  for (const id of ids) {
    const q = content.questions[id]
    if (!q) continue
    const label = `Pytanie „${short(q.content)}”`

    if (!q.content.trim()) issues.push(`${label}: brak treści.`)

    if (q.question_type === 'scale') {
      if (q.answers.length !== SCALE_ANSWERS) {
        issues.push(`${label}: skala musi mieć ${SCALE_ANSWERS} wartości.`)
      } else {
        try {
          const labels = JSON.parse(q.answers[0].content) as { start?: string; end?: string }
          if (!labels.start?.trim() || !labels.end?.trim()) issues.push(`${label}: brak etykiet skali.`)
        } catch {
          issues.push(`${label}: nieprawidłowe etykiety skali.`)
        }
      }
    } else {
      if (q.answers.length < 2) issues.push(`${label}: potrzebne są co najmniej 2 odpowiedzi.`)
      if (q.answers.some(a => !a.content.trim())) issues.push(`${label}: odpowiedź bez treści.`)
    }

    for (const a of q.answers) {
      for (const t of a.tags) {
        if (t.is_scored && t.points <= 0) {
          issues.push(`${label}: oznaczenie „${t.tag_slug}” jest punktowane, a ma ${t.points} pkt.`)
        }
      }
    }
  }

  // Branches must point to answers that still exist.
  const checkPaths = (nodes: LayoutItem[]) => {
    for (const node of nodes) {
      const q = content.questions[node.question_id]
      for (const path of node.paths) {
        if (q && !q.answers.some(a => a.id === path.answer_id)) {
          issues.push(`Rozgałęzienie „${path.path_name}” wskazuje odpowiedź usuniętą z pytania „${short(q.content)}”.`)
        }
        checkPaths(path.children)
      }
    }
  }
  checkPaths(layout)

  const slugs = new Set(content.tags.map(t => t.slug))
  for (const group of REQUIRED_TAG_GROUPS) {
    if (!group.slugs.some(s => slugs.has(s))) {
      issues.push(`Brak oznaczeń potrzebnych do wyniku: ${group.label} (${group.slugs.join(', ')}).`)
    }
  }

  return issues
}
