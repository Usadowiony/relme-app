import { useCallback, useEffect, useRef, useState } from 'react'
import type { LayoutItem } from '../../../../types/quiz'
import { getQuizDraft, readLegacyLocalDraft, saveQuizDraft } from '../../../../api/quiz.api'
import { useDraftAutosave } from '../../../../hooks/useDraftAutosave'
import { jsonEqual } from '../../../../utils/json'

/**
 * The admin's working quiz layout, stored in the DB (quiz_draft) and
 * autosaved with an optimistic lock — same convention as module drafts.
 * On the very first load (revision 0) an older browser draft from
 * localStorage is imported once, so unsaved layout work is not lost.
 */
export function useQuizDraft() {
  const [items, setItems] = useState<LayoutItem[]>([])
  const [isLoaded, setIsLoaded] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [importedFromBrowser, setImportedFromBrowser] = useState(false)
  const startedRef = useRef(false)

  const save = useCallback((value: LayoutItem[], expectedRevision: number) => saveQuizDraft(value, expectedRevision), [])
  const fetchRevision = useCallback(async () => (await getQuizDraft()).revision, [])

  const autosave = useDraftAutosave({ value: items, initialRevision: 0, save, fetchRevision, enabled: isLoaded })
  const { markSaved } = autosave

  useEffect(() => {
    if (startedRef.current) return
    startedRef.current = true

    getQuizDraft()
      .then(draft => {
        markSaved(draft.layout_data, draft.revision)
        setItems(draft.layout_data)

        if (draft.revision === 0) {
          const legacy = readLegacyLocalDraft()
          if (legacy && legacy.items.length > 0 && !jsonEqual(legacy.items, draft.layout_data)) {
            setItems(legacy.items) // autosave stores it as revision 1
            setImportedFromBrowser(true)
          }
        }
        setIsLoaded(true)
      })
      .catch((err: unknown) => {
        setLoadError(err instanceof Error ? err.message : 'Nie udało się pobrać szkicu układu quizu.')
      })
  }, [markSaved])

  return { items, setItems, isLoaded, loadError, importedFromBrowser, ...autosave }
}
