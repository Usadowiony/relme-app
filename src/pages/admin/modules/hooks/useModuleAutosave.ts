import { useCallback, useEffect, useRef, useState } from 'react'
import type { ModuleFlowData } from '../../../../types/modules'
import { DraftConflictError, getModuleDraft, saveModuleDraft } from '../../../../api/modules.api'

const AUTOSAVE_DELAY_MS = 800

export type SaveStatus = 'saved' | 'pending' | 'saving' | 'error' | 'conflict'

/**
 * Debounced autosave of the module draft with an optimistic lock.
 * Every save sends the revision the editor knows; if the draft changed in the
 * meantime (other tab / other admin) the save is rejected, autosave stops and
 * `status` becomes 'conflict' until the admin resolves it (reload or overwrite).
 */
export function useModuleAutosave(moduleId: string, flow: ModuleFlowData, initialRevision: number) {
  const [savedFlow, setSavedFlow] = useState<ModuleFlowData | null>(flow)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [conflict, setConflict] = useState(false)

  const latestRef = useRef(flow)
  const savedRef = useRef<ModuleFlowData | null>(flow)
  const revisionRef = useRef(initialRevision)
  const conflictRef = useRef(false)
  const inFlightRef = useRef<Promise<void> | null>(null)

  useEffect(() => {
    latestRef.current = flow
  }, [flow])

  const save = useCallback(async () => {
    if (conflictRef.current) throw new DraftConflictError()
    const snapshot = latestRef.current
    if (snapshot === savedRef.current) return

    setIsSaving(true)
    setError(null)
    const request = saveModuleDraft(moduleId, snapshot, revisionRef.current)
      .then(revision => {
        revisionRef.current = revision
        savedRef.current = snapshot
        setSavedFlow(snapshot)
      })
      .catch((err: unknown) => {
        if (err instanceof DraftConflictError) {
          conflictRef.current = true
          setConflict(true)
        } else {
          setError(err instanceof Error ? err.message : 'Nie udało się zapisać modułu.')
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
  }, [moduleId])

  useEffect(() => {
    if (conflict || flow === savedRef.current) return
    const timeout = setTimeout(() => {
      // Failure is already reported via `error` / `conflict` state.
      save().catch((err: unknown) => console.warn('[useModuleAutosave] autosave failed:', err))
    }, AUTOSAVE_DELAY_MS)
    return () => clearTimeout(timeout)
  }, [flow, conflict, save])

  /** Saves immediately (waits for any in-flight save first). Throws on failure / conflict. */
  const flush = useCallback(async () => {
    if (inFlightRef.current) {
      await inFlightRef.current.catch(() => undefined) // its error is already in state; we retry below
    }
    await save()
  }, [save])

  /** Conflict resolution "keep my changes": take the newest revision and save over it. */
  const overwriteRemote = useCallback(async () => {
    const remote = await getModuleDraft(moduleId)
    revisionRef.current = remote.revision
    conflictRef.current = false
    setConflict(false)
    savedRef.current = null // force the next save
    await save()
  }, [moduleId, save])

  /** Revision of the last successful save (used to snapshot exactly this state as a version). */
  const getRevision = useCallback(() => revisionRef.current, [])

  const status: SaveStatus = conflict
    ? 'conflict'
    : isSaving
      ? 'saving'
      : error
        ? 'error'
        : flow !== savedFlow
          ? 'pending'
          : 'saved'

  return { status, error, flush, overwriteRemote, getRevision }
}
