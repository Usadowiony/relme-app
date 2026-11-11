import { useCallback, useState } from 'react'
import type { BlockConfigMap, BlockType, ModuleFlowData, ModuleView } from '../../../../types/modules'
import { createId } from '../../../../utils/moduleFlow'

/** Editor state for a module's linear list of views. */
export function useModuleFlow(initial: ModuleFlowData) {
  const [flow, setFlow] = useState<ModuleFlowData>(initial)

  const addView = useCallback(<K extends BlockType>(type: K, config: BlockConfigMap[K]) => {
    const view = { id: createId(), block_type: type, config } as ModuleView
    setFlow(f => ({ ...f, views: [...f.views, view] }))
  }, [])

  const updateViewConfig = useCallback((viewId: string, config: ModuleView['config']) => {
    setFlow(f => ({
      ...f,
      views: f.views.map(v => (v.id === viewId ? ({ ...v, config } as ModuleView) : v)),
    }))
  }, [])

  const removeView = useCallback((viewId: string) => {
    setFlow(f => ({ ...f, views: f.views.filter(v => v.id !== viewId) }))
  }, [])

  const reorderViews = useCallback((views: ModuleView[]) => {
    setFlow(f => ({ ...f, views }))
  }, [])

  /** Replaces the whole draft (loading a saved version). */
  const replaceFlow = useCallback((next: ModuleFlowData) => {
    setFlow(next)
  }, [])

  return { flow, addView, updateViewConfig, removeView, reorderViews, replaceFlow }
}
