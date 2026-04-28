import { useState, useEffect, useCallback } from 'react'
import type { LayoutItem, DraftState } from '../../../../types/quiz'
import { saveDraftToLocal, loadDraftFromLocal } from '../../../../api/quiz.api'

function createEmptyDraft(): DraftState {
  return { items: [], name: 'Nowy Draft', lastModified: new Date().toISOString() }
}

export function findSiblingIds(items: LayoutItem[], targetQId: string, targetPathIdx: number): string[] {
  for (const item of items) {
    if (item.question_id === targetQId && item.paths[targetPathIdx]) {
      return item.paths[targetPathIdx].children.map(c => c.question_id)
    }
    for (const path of item.paths) {
      const found = findSiblingIds(path.children, targetQId, targetPathIdx)
      if (found.length > 0) return found
    }
  }
  return []
}

export function useLayoutTree() {
  const [draft, setDraft] = useState<DraftState>(() => loadDraftFromLocal() || createEmptyDraft())

  useEffect(() => {
    const timeout = setTimeout(() => {
      saveDraftToLocal(draft)
    }, 500)
    return () => clearTimeout(timeout)
  }, [draft])

  useEffect(() => {
    const handleDraftUpdated = () => {
      setDraft(loadDraftFromLocal() || createEmptyDraft())
    }
    window.addEventListener('draftUpdated', handleDraftUpdated)
    return () => window.removeEventListener('draftUpdated', handleDraftUpdated)
  }, [])

  const updateDraft = useCallback((updater: (prev: DraftState) => DraftState) => {
    setDraft(prev => {
      const next = updater(prev)
      next.lastModified = new Date().toISOString()
      return next
    })
  }, [])

  const addRootQuestion = (questionId: string) => {
    updateDraft(d => ({
      ...d,
      items: [...d.items, { question_id: questionId, paths: [] }]
    }))
  }

  const addNestedQuestionToPath = (parentQId: string, pathIdx: number, questionId: string) => {
    updateDraft(d => ({
      ...d,
      items: addNestedQuestion(d.items, parentQId, pathIdx, questionId)
    }))
  }

  const removeRootQuestion = (idx: number) => {
    updateDraft(d => ({
      ...d,
      items: d.items.filter((_, i) => i !== idx)
    }))
  }

  const removeNestedQuestionFromPath = (parentQId: string, pathIdx: number, childIdx: number) => {
    updateDraft(d => ({
      ...d,
      items: removeNestedChild(d.items, parentQId, pathIdx, childIdx)
    }))
  }

  const moveRootQuestion = (fromIdx: number, toIdx: number) => {
    updateDraft(d => {
      const newItems = [...d.items]
      const [moved] = newItems.splice(fromIdx, 1)
      newItems.splice(toIdx, 0, moved)
      return { ...d, items: newItems }
    })
  }

  const moveNestedQuestionInPath = (parentQId: string, pathIdx: number, fromIdx: number, toIdx: number) => {
    updateDraft(d => ({
      ...d,
      items: swapNestedChildren(d.items, parentQId, pathIdx, fromIdx, toIdx)
    }))
  }

  const addPath = (questionId: string, answerId: string, pathName: string) => {
    updateDraft(d => ({
      ...d,
      items: addPathToAnswer(d.items, questionId, answerId, pathName)
    }))
  }

  const removePathFromNode = (questionId: string, pathIdx: number) => {
    updateDraft(d => ({
      ...d,
      items: removePathFromQuestion(d.items, questionId, pathIdx)
    }))
  }

  const cleanStaleItems = useCallback((validQuestionIds: Set<string>) => {
    updateDraft(d => ({
      ...d,
      items: d.items.filter(item => validQuestionIds.has(item.question_id))
    }))
  }, [updateDraft])

  return {
    draft,
    setDraft,
    addRootQuestion,
    addNestedQuestionToPath,
    removeRootQuestion,
    removeNestedQuestionFromPath,
    moveRootQuestion,
    moveNestedQuestionInPath,
    addPath,
    removePathFromNode,
    cleanStaleItems
  }
}

// ─── Tree Mutation Helpers ──────────────────────────────────────

function addNestedQuestion(items: LayoutItem[], parentQId: string, pathIdx: number, questionId: string, context = { found: false }): LayoutItem[] {
  return items.map(item => {
    if (context.found) return item
    if (item.question_id === parentQId) {
      context.found = true
      const newPaths = [...item.paths]
      newPaths[pathIdx] = {
        ...newPaths[pathIdx],
        children: [...newPaths[pathIdx].children, { question_id: questionId, paths: [] }]
      }
      return { ...item, paths: newPaths }
    }
    return {
      ...item,
      paths: item.paths.map(p => ({
        ...p,
        children: addNestedQuestion(p.children, parentQId, pathIdx, questionId, context)
      }))
    }
  })
}

function removeNestedChild(items: LayoutItem[], parentQId: string, pathIdx: number, childIdx: number, context = { found: false }): LayoutItem[] {
  return items.map(item => {
    if (context.found) return item
    if (item.question_id === parentQId) {
      context.found = true
      const newPaths = [...item.paths]
      newPaths[pathIdx] = {
        ...newPaths[pathIdx],
        children: newPaths[pathIdx].children.filter((_, i) => i !== childIdx)
      }
      return { ...item, paths: newPaths }
    }
    return {
      ...item,
      paths: item.paths.map(p => ({
        ...p,
        children: removeNestedChild(p.children, parentQId, pathIdx, childIdx, context)
      }))
    }
  })
}

function swapNestedChildren(items: LayoutItem[], parentQId: string, pathIdx: number, fromIdx: number, toIdx: number, context = { found: false }): LayoutItem[] {
  return items.map(item => {
    if (context.found) return item
    if (item.question_id === parentQId) {
      context.found = true
      const newPaths = [...item.paths]
      const children = [...newPaths[pathIdx].children]
      const [moved] = children.splice(fromIdx, 1)
      children.splice(toIdx, 0, moved)
      newPaths[pathIdx] = { ...newPaths[pathIdx], children }
      return { ...item, paths: newPaths }
    }
    return {
      ...item,
      paths: item.paths.map(p => ({
        ...p,
        children: swapNestedChildren(p.children, parentQId, pathIdx, fromIdx, toIdx, context)
      }))
    }
  })
}

function addPathToAnswer(items: LayoutItem[], questionId: string, answerId: string, pathName: string, context = { found: false }): LayoutItem[] {
  return items.map(item => {
    if (context.found) return item
    if (item.question_id === questionId) {
      context.found = true
      return {
        ...item,
        paths: [...item.paths, { answer_id: answerId, path_name: pathName, children: [] }]
      }
    }
    return {
      ...item,
      paths: item.paths.map(p => ({
        ...p,
        children: addPathToAnswer(p.children, questionId, answerId, pathName, context)
      }))
    }
  })
}

function removePathFromQuestion(items: LayoutItem[], questionId: string, pathIdx: number, context = { found: false }): LayoutItem[] {
  return items.map(item => {
    if (context.found) return item
    if (item.question_id === questionId) {
      context.found = true
      return {
        ...item,
        paths: item.paths.filter((_, i) => i !== pathIdx)
      }
    }
    return {
      ...item,
      paths: item.paths.map(p => ({
        ...p,
        children: removePathFromQuestion(p.children, questionId, pathIdx, context)
      }))
    }
  })
}
