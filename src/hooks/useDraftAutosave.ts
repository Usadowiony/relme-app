import { useCallback, useEffect, useRef, useState } from 'react'
import { DraftConflictError } from '../api/draftConflict'

const AUTOSAVE_DELAY_MS = 800

export type SaveStatus = 'saved' | 'pending' | 'saving' | 'error' | 'conflict'

type Options<T> = {
  /** Current editor value; a new reference = something changed. */
  value: T
  /** Revision the editor was loaded with. */
  initialRevision: number
  /** Persists `value` if the DB still has `expectedRevision`; returns the new revision. */
  save: (value: T, expectedRevision: number) => Promise<number>
  /** Current revision in the DB (used by "keep my changes" after a conflict). */
  fetchRevision: () => Promise<number>
  /** Pass false to pause autosaving (e.g. before the draft is loaded). */
  enabled?: boolean
}

/**
 * Debounced autosave of a draft with an optimistic lock (shared by modules
 * and the quiz). Every save sends the revision the editor knows; if the draft
 * changed meanwhile (other tab / other admin) the DB rejects it, autosave
 * stops and `status` becomes 'conflict' until the admin reloads or overwrites.
 */
export function useDraftAutosave<T>({ value, initialRevision, save: persist, fetchRevision, enabled = true }: Options<T>) {
  const [savedValue, setSavedValue] = useState<T | null>(value)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [conflict, setConflict] = useState(false)

  const latestRef = useRef(value)
  const savedRef = useRef<T | null>(value)
  const revisionRef = useRef(initialRevision)
  const conflictRef = useRef(false)
  const inFlightRef = useRef<Promise<void> | null>(null)
  const persistRef = useRef(persist)

  useEffect(() => {
    latestRef.current = value
    persistRef.current = persist
  }, [value, persist])

  const save = useCallback(async () => {
    if (conflictRef.current) throw new DraftConflictError()
    const snapshot = latestRef.current
    if (snapshot === savedRef.current) return

    setIsSaving(true)
    setError(null)
    const request = persistRef.current(snapshot, revisionRef.current)
      .then(revision => {
        revisionRef.current = revision
        savedRef.current = snapshot
        setSavedValue(snapshot)
      })
      .catch((err: unknown) => {
        if (err instanceof DraftConflictError) {
          conflictRef.current = true
          setConflict(true)
        } else {
          setError(err instanceof Error ? err.message : 'Nie udało się zapisać zmian.')
        }
        throw err
      })
      .finally(() => setIsSaving(false))

    inFlightRef.current = request
    try {
      await request
    } finally {
      if (inFlightRef.current === request) inFlightRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!enabled || conflict || value === savedRef.current) return
    const timeout = setTimeout(() => {
      // Failure is already reported via `error` / `conflict` state.
      save().catch((err: unknown) => console.warn('[useDraftAutosave] autosave failed:', err))
    }, AUTOSAVE_DELAY_MS)
    return () => clearTimeout(timeout)
  }, [value, enabled, conflict, save])

  /** Saves immediately (waits for any in-flight save first). Throws on failure / conflict. */
  const flush = useCallback(async () => {
    if (inFlightRef.current) {
      await inFlightRef.current.catch(() => undefined) // its error is already in state; we retry below
    }
    await save()
  }, [save])

  /** Conflict resolution "keep my changes": take the newest revision and save over it. */
  const overwriteRemote = useCallback(async () => {
    revisionRef.current = await fetchRevision()
    conflictRef.current = false
    setConflict(false)
    savedRef.current = null // force the next save
    await save()
  }, [fetchRevision, save])

  /** Marks `next` as already persisted at `revision` (e.g. right after loading the draft). */
  const markSaved = useCallback((next: T, revision: number) => {
    revisionRef.current = revision
    savedRef.current = next
    setSavedValue(next)
  }, [])

  /** Revision of the last successful save (used to snapshot exactly this state as a version). */
  const getRevision = useCallback(() => revisionRef.current, [])

  const status: SaveStatus = conflict
    ? 'conflict'
    : isSaving
      ? 'saving'
      : error
        ? 'error'
        : value !== savedValue
          ? 'pending'
          : 'saved'

  return { status, error, flush, overwriteRemote, getRevision, markSaved }
}
