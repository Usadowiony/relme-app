import { useCallback, useEffect, useRef, useState } from 'react'
import type { ModuleFlowData } from '../../../../types/modules'
import { saveModuleFlow } from '../../../../api/modules.api'

const AUTOSAVE_DELAY_MS = 800

export type SaveStatus = 'saved' | 'pending' | 'saving' | 'error'

/**
 * Debounced autosave of the module flow to the DB (draft only).
 * Errors are surfaced through `error` / `status`; `flush()` saves pending
 * changes immediately and rethrows (used before publishing).
 */
export function useModuleAutosave(moduleId: string, flow: ModuleFlowData, enabled: boolean) {
  const [savedFlow, setSavedFlow] = useState(flow)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const latestRef = useRef(flow)
  const savedRef = useRef(flow)
  const inFlightRef = useRef<Promise<void> | null>(null)

  useEffect(() => {
    latestRef.current = flow
  }, [flow])

  const save = useCallback(async () => {
    const snapshot = latestRef.current
    if (snapshot === savedRef.current) return

    setIsSaving(true)
    setError(null)
    const request = saveModuleFlow(moduleId, snapshot)
      .then(() => {
        savedRef.current = snapshot
        setSavedFlow(snapshot)
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Nie udało się zapisać modułu.')
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
    if (!enabled || flow === savedRef.current) return
    const timeout = setTimeout(() => {
      // Failure is already reported via `error` state.
      save().catch((err: unknown) => console.warn('[useModuleAutosave] autosave failed:', err))
    }, AUTOSAVE_DELAY_MS)
    return () => clearTimeout(timeout)
  }, [flow, enabled, save])

  /** Saves immediately (waits for any in-flight save first). Throws on failure. */
  const flush = useCallback(async () => {
    if (inFlightRef.current) {
      await inFlightRef.current.catch(() => undefined) // its error is already in state; we retry below
    }
    await save()
  }, [save])

  const status: SaveStatus = isSaving
    ? 'saving'
    : error
      ? 'error'
      : flow !== savedFlow
        ? 'pending'
        : 'saved'

  return { status, error, flush }
}
