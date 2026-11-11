import { useCallback, useEffect, useState } from 'react'
import type { LayoutItem, QuizVersion, QuizVersionContent } from '../../../../types/quiz'
import {
  buildQuizContent,
  createQuizVersion,
  deleteQuizVersion,
  getQuizVersions,
  publishQuizVersion,
} from '../../../../api/quiz.api'
import { jsonEqual } from '../../../../utils/json'

type Options = {
  /** Saves pending layout changes first (throws on error / conflict). */
  flushDraft: () => Promise<void>
  /** Draft revision after the flush — the version must snapshot exactly that. */
  getRevision: () => number
}

/** Saved quiz versions (whole packages) + the live one and the actions on them. */
export function useQuizVersions({ flushDraft, getRevision }: Options) {
  const [versions, setVersions] = useState<QuizVersion[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    setLoadError(null)
    try {
      setVersions(await getQuizVersions())
    } catch (err: unknown) {
      setLoadError(err instanceof Error ? err.message : 'Nie udało się pobrać wersji quizu.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void reload()
  }, [reload])

  const saveVersion = useCallback(
    async (name: string): Promise<QuizVersion | undefined> => {
      await flushDraft()
      const id = await createQuizVersion(name, getRevision())
      const fresh = await getQuizVersions()
      setVersions(fresh)
      return fresh.find(v => v.id === id)
    },
    [flushDraft, getRevision]
  )

  const publish = useCallback(async (version: QuizVersion) => {
    await publishQuizVersion(version)
    await reload()
  }, [reload])

  const remove = useCallback(async (version: QuizVersion) => {
    await deleteQuizVersion(version.id)
    await reload()
  }, [reload])

  const liveVersion = versions.find(v => v.status === 'live') ?? null

  return { versions, liveVersion, isLoading, loadError, saveVersion, publish, remove }
}

const CONTENT_DEBOUNCE_MS = 600

/**
 * The package the current draft WOULD produce if saved now (built by the
 * same DB function as on save). Rebuilt when the layout or the library
 * (questions / tags — pass their latest arrays) change.
 */
export function useDraftContent(items: LayoutItem[], libraryDeps: unknown[], enabled: boolean) {
  const [content, setContent] = useState<QuizVersionContent | null>(null)
  const [builtFor, setBuiltFor] = useState<unknown[] | null>(null)
  const deps = [items, ...libraryDeps]

  useEffect(() => {
    if (!enabled) return
    let cancelled = false
    const timeout = setTimeout(() => {
      buildQuizContent(items)
        .then(c => {
          if (cancelled) return
          setContent(c)
          setBuiltFor(deps)
        })
        .catch((err: unknown) => console.warn('[useDraftContent] build failed:', err))
    }, CONTENT_DEBOUNCE_MS)
    return () => {
      cancelled = true
      clearTimeout(timeout)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, ...deps])

  const isReady = content !== null && builtFor !== null && builtFor.length === deps.length && builtFor.every((d, i) => d === deps[i])
  return { content, isReady }
}

/** True when a saved version contains exactly the draft package. */
export function versionMatchesDraft(version: QuizVersion, items: LayoutItem[], content: QuizVersionContent): boolean {
  return jsonEqual(version.layout_data, items) && jsonEqual(version.content, content)
}
