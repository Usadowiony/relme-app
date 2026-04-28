import type { LayoutItem } from '../types/quiz'

export function countLayoutQuestions(items: LayoutItem[]): number {
  let count = 0
  for (const item of items) {
    count++
    for (const path of item.paths) {
      count += countLayoutQuestions(path.children)
    }
  }
  return count
}

export function isQuestionInLayout(items: LayoutItem[], questionId: string): boolean {
  for (const item of items) {
    if (item.question_id === questionId) return true
    for (const path of item.paths) {
      if (isQuestionInLayout(path.children, questionId)) return true
    }
  }
  return false
}
