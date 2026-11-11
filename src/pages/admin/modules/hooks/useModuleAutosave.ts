import { useCallback } from 'react'
import type { ModuleFlowData } from '../../../../types/modules'
import { getModuleDraft, saveModuleDraft } from '../../../../api/modules.api'
import { useDraftAutosave } from '../../../../hooks/useDraftAutosave'

export type { SaveStatus } from '../../../../hooks/useDraftAutosave'

/** Autosave of a module draft (optimistic lock) — see useDraftAutosave. */
export function useModuleAutosave(moduleId: string, flow: ModuleFlowData, initialRevision: number) {
  const save = useCallback(
    (value: ModuleFlowData, expectedRevision: number) => saveModuleDraft(moduleId, value, expectedRevision),
    [moduleId]
  )
  const fetchRevision = useCallback(async () => (await getModuleDraft(moduleId)).revision, [moduleId])

  return useDraftAutosave({ value: flow, initialRevision, save, fetchRevision })
}
