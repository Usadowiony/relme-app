import { useCallback, useEffect, useState } from 'react'
import type { ModuleVersion, ModuleVersionStatus } from '../../../../types/modules'
import {
  createModuleVersion,
  deleteModuleVersion,
  getModuleVersions,
  publishModuleVersion,
} from '../../../../api/modules.api'

type Options = {
  moduleId: string
  initialLiveVersionId: string | null
  /** Saves pending draft changes first (throws on error / conflict). */
  flushDraft: () => Promise<void>
  /** Draft revision after the flush — the version must snapshot exactly that. */
  getRevision: () => number
}

/** Saved versions of a module + the live pointer and the actions on them. */
export function useModuleVersions({ moduleId, initialLiveVersionId, flushDraft, getRevision }: Options) {
  const [versions, setVersions] = useState<ModuleVersion[]>([])
  const [liveVersionId, setLiveVersionId] = useState(initialLiveVersionId)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    setLoadError(null)
    try {
      setVersions(await getModuleVersions(moduleId))
    } catch (err: unknown) {
      setLoadError(err instanceof Error ? err.message : 'Nie udało się pobrać wersji modułu.')
    } finally {
      setIsLoading(false)
    }
  }, [moduleId])

  useEffect(() => {
    void reload()
  }, [reload])

  /** Snapshots the current draft as a new named version. Returns it. */
  const saveVersion = useCallback(
    async (name: string): Promise<ModuleVersion | undefined> => {
      await flushDraft()
      const id = await createModuleVersion(moduleId, name, getRevision())
      const fresh = await getModuleVersions(moduleId)
      setVersions(fresh)
      return fresh.find(v => v.id === id)
    },
    [moduleId, flushDraft, getRevision]
  )

  const publish = useCallback(
    async (version: ModuleVersion) => {
      await publishModuleVersion(version)
      setLiveVersionId(version.id)
      await reload()
    },
    [reload]
  )

  const remove = useCallback(
    async (version: ModuleVersion) => {
      await deleteModuleVersion(version.id)
      await reload()
    },
    [reload]
  )

  const statusOf = useCallback(
    (version: ModuleVersion): ModuleVersionStatus =>
      version.id === liveVersionId ? 'live' : version.published_at ? 'archived' : 'saved',
    [liveVersionId]
  )

  const liveVersion = versions.find(v => v.id === liveVersionId) ?? null

  return { versions, liveVersion, liveVersionId, isLoading, loadError, saveVersion, publish, remove, statusOf }
}
