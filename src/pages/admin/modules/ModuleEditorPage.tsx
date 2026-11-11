import { useRef, useState } from 'react'
import type { PointerEvent, RefObject } from 'react'
import { Link, useLoaderData } from 'react-router-dom'
import { Reorder, useDragControls } from 'framer-motion'
import {
  Check,
  ChevronRight,
  CircleAlert,
  GitBranch,
  GripVertical,
  Loader2,
  Pencil,
  Play,
  Plus,
  Trash2,
} from 'lucide-react'
import type { BlockConfigMap, BlockType, Module, ModuleStatus, ModuleView } from '../../../types/modules'
import { createDefaultConfig } from '../../../utils/moduleFlow'
import { Toast } from '../../../components/ui/popups/Toast'
import { useModuleFlow } from './hooks/useModuleFlow'
import { useModuleAutosave } from './hooks/useModuleAutosave'
import type { SaveStatus } from './hooks/useModuleAutosave'
import { getBlockDefinition } from './blocks/registry'
import { BlockEditModal } from './components/BlockEditModal'
import { BlockLibrary, BlockPickerModal } from './components/BlockLibrary'
import { ModuleVersionModal } from './components/ModuleVersionModal'

type EditTarget =
  | { mode: 'new'; type: BlockType }
  | { mode: 'edit'; viewId: string }

const STATUS_BADGE: Record<ModuleStatus, { label: string; className: string }> = {
  draft: { label: 'Szkic', className: 'bg-amber-100 text-amber-800' },
  published: { label: 'Opublikowany', className: 'bg-green-100 text-green-800' },
  archived: { label: 'Archiwum', className: 'bg-gray-100 text-gray-600' },
}

/** Route element: keyed by module id so state resets between modules. */
export function ModuleEditorPage() {
  const module = useLoaderData() as Module
  return <ModuleEditor key={module.id} module={module} />
}

function ModuleEditor({ module }: { module: Module }) {
  const [status, setStatus] = useState<ModuleStatus>(module.status)
  const isEditable = status === 'draft'

  const { flow, addView, updateViewConfig, removeView, reorderViews } = useModuleFlow(module.flow_data)
  const { status: saveStatus, error: saveError, flush } = useModuleAutosave(module.id, flow, isEditable)

  const [editTarget, setEditTarget] = useState<EditTarget | null>(null)
  const [isPickerOpen, setIsPickerOpen] = useState(false)
  const [isVersionOpen, setIsVersionOpen] = useState(false)
  const [dismissedError, setDismissedError] = useState<string | null>(null)
  const timelineRef = useRef<HTMLUListElement>(null)

  const handlePickBlock = (type: BlockType) => {
    setIsPickerOpen(false)
    setEditTarget({ mode: 'new', type })
  }

  const handleSaveBlock = (config: BlockConfigMap[BlockType]) => {
    if (!editTarget) return
    if (editTarget.mode === 'new') addView(editTarget.type, config)
    else updateViewConfig(editTarget.viewId, config)
    setEditTarget(null)
  }

  const handleRetrySave = () => {
    flush().catch((err: unknown) => console.warn('[ModuleEditor] retry save failed:', err))
  }

  const editModal = (() => {
    if (!editTarget) return null
    if (editTarget.mode === 'new') {
      return (
        <BlockEditModal
          type={editTarget.type}
          initialConfig={createDefaultConfig(editTarget.type)}
          viewNumber={flow.views.length + 1}
          readOnly={false}
          onSave={handleSaveBlock}
          onClose={() => setEditTarget(null)}
        />
      )
    }
    const index = flow.views.findIndex(v => v.id === editTarget.viewId)
    const view = flow.views[index]
    if (!view) return null
    return (
      <BlockEditModal
        type={view.block_type}
        initialConfig={view.config}
        viewNumber={index + 1}
        readOnly={!isEditable}
        onSave={handleSaveBlock}
        onClose={() => setEditTarget(null)}
      />
    )
  })()

  const badge = STATUS_BADGE[status]

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
        <div className="min-w-0">
          <nav className="flex items-center gap-1 text-[10px] font-bold tracking-widest uppercase text-dark/50">
            <span>Panel admina</span>
            <ChevronRight className="size-3" />
            <Link to="/admin/modules" className="hover:text-dark">Moduły</Link>
            <ChevronRight className="size-3" />
            <span className="text-dark/80">Kreator modułu</span>
          </nav>
          <div className="mt-2 flex items-center gap-3">
            <h1 className="text-3xl font-manrope font-semibold tracking-tight truncate">{module.title}</h1>
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${badge.className}`}>
              {badge.label}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isEditable && <SaveIndicator status={saveStatus} onRetry={handleRetrySave} />}
          <button
            type="button"
            disabled
            title="Podgląd będzie dostępny razem z odtwarzaczem modułów"
            className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-dark/20 text-[13px] font-semibold text-dark/40 cursor-not-allowed"
          >
            <Play className="size-4" /> Rozwiąż moduł <span className="text-[10px] uppercase">wkrótce</span>
          </button>
          <button
            type="button"
            onClick={() => setIsVersionOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#3F5560] text-white text-[13px] font-semibold hover:bg-[#344750] cursor-pointer"
          >
            <GitBranch className="size-4" /> Kontrola wersji
          </button>
        </div>
      </div>

      {!isEditable && (
        <div className="mb-6 rounded-[16px] bg-amber-50 border border-amber-200 px-5 py-4 text-[14px] text-amber-900">
          {status === 'published'
            ? 'Moduł jest opublikowany i działa w trybie tylko do odczytu. Aby go edytować, wycofaj publikację w „Kontroli wersji”.'
            : 'Moduł jest zarchiwizowany i działa w trybie tylko do odczytu.'}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_300px] gap-8 items-start">
        {/* Timeline */}
        <div className="flex flex-col">
          {flow.views.length === 0 ? (
            <div className="rounded-[24px] border border-dashed border-dark/20 py-16 text-center text-dark/50">
              <p className="text-lg font-manrope">Moduł nie ma jeszcze widoków</p>
              <p className="text-sm mt-1">Wybierz blok z biblioteki elementów, aby dodać pierwszy widok.</p>
            </div>
          ) : (
            <Reorder.Group ref={timelineRef} axis="y" values={flow.views} onReorder={reorderViews} className="flex flex-col">
              {flow.views.map((view, index) => (
                <ViewItem
                  key={view.id}
                  view={view}
                  index={index}
                  isEditable={isEditable}
                  boundsRef={timelineRef}
                  onEdit={() => setEditTarget({ mode: 'edit', viewId: view.id })}
                  onRemove={() => removeView(view.id)}
                />
              ))}
            </Reorder.Group>
          )}

          {isEditable && (
            <div className="mt-10 flex flex-col items-center">
              <button
                type="button"
                onClick={() => setIsPickerOpen(true)}
                className="bg-white size-[60px] rounded-full shadow-soft border border-gray/30 flex items-center justify-center cursor-pointer hover:bg-neutral transition-colors"
                title="Dodaj nowy widok"
              >
                <Plus className="size-6 text-dark/70" />
              </button>
              <div className="mt-3 text-[11px] font-bold tracking-widest text-dark/50 uppercase">Nowy element</div>
            </div>
          )}
        </div>

        {/* Library */}
        <div className="xl:sticky xl:top-0">
          <BlockLibrary disabled={!isEditable} onPick={handlePickBlock} />
        </div>
      </div>

      {isPickerOpen && <BlockPickerModal onPick={handlePickBlock} onClose={() => setIsPickerOpen(false)} />}

      {editModal}

      <ModuleVersionModal
        isOpen={isVersionOpen}
        onClose={() => setIsVersionOpen(false)}
        moduleId={module.id}
        status={status}
        flow={flow}
        flushPendingChanges={flush}
        onStatusChange={setStatus}
      />

      <Toast
        open={saveStatus === 'error' && saveError !== null && saveError !== dismissedError}
        type="error"
        title="Nie udało się zapisać zmian"
        message={saveError ?? undefined}
        onClose={() => setDismissedError(saveError)}
      />
    </div>
  )
}

// --- View card in the timeline ---

type ViewItemProps = {
  view: ModuleView
  index: number
  isEditable: boolean
  boundsRef: RefObject<HTMLElement | null>
  onEdit: () => void
  onRemove: () => void
}

function ViewItem({ view, index, isEditable, boundsRef, onEdit, onRemove }: ViewItemProps) {
  const controls = useDragControls()
  const [confirmDelete, setConfirmDelete] = useState(false)
  const def = getBlockDefinition(view.block_type)
  const Icon = def.icon
  const Summary = def.Summary

  // The whole card is the drag handle; buttons inside keep working as clicks.
  const handlePointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (!isEditable || confirmDelete || e.button !== 0) return
    if ((e.target as HTMLElement).closest('button, a, input, textarea')) return
    e.preventDefault() // no text selection while dragging
    controls.start(e)
  }

  return (
    <Reorder.Item
      value={view}
      dragListener={false}
      dragControls={controls}
      dragConstraints={boundsRef}
      dragElastic={0}
      whileDrag={{ scale: 1.02, zIndex: 10 }}
      className="relative flex flex-col"
    >
      <div className="flex items-center gap-3 mb-4 mt-2">
        <span className="text-[10px] font-bold tracking-widest uppercase text-dark/70">Widok #{index + 1}</span>
        <div className="h-px flex-1 bg-dark/20" />
      </div>

      <div
        onPointerDown={handlePointerDown}
        title={isEditable ? 'Przeciągnij, aby zmienić kolejność' : undefined}
        className={`mx-auto w-full max-w-[460px] mb-8 rounded-[20px] bg-white p-3 shadow-soft border-2 select-none ${
          isEditable && !confirmDelete ? 'cursor-grab active:cursor-grabbing' : ''
        }`}
        style={{ borderColor: `${def.color}66` }}
      >
        <div className="flex items-center justify-between rounded-[14px] border border-gray/40 px-3 py-2.5">
          <div className="flex items-center gap-3">
            {isEditable && <GripVertical className="size-4 -mr-1 text-dark/30" />}
            <div className="size-9 rounded-[10px] flex items-center justify-center" style={{ backgroundColor: `${def.color}1A`, color: def.color }}>
              <Icon className="size-[18px]" />
            </div>
            <span className="text-[13px] font-semibold tracking-wider" style={{ color: def.color }}>{def.label}</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              title={isEditable ? 'Edytuj blok' : 'Podgląd bloku'}
              onClick={onEdit}
              className="size-8 rounded-full flex items-center justify-center text-dark/60 hover:bg-neutral cursor-pointer"
            >
              <Pencil className="size-4" />
            </button>
            {isEditable && (
              <button
                type="button"
                title="Usuń widok"
                onClick={() => setConfirmDelete(true)}
                className="size-8 rounded-full flex items-center justify-center text-[#D15F5F] hover:bg-red-50 cursor-pointer"
              >
                <Trash2 className="size-4" />
              </button>
            )}
          </div>
        </div>

        <div className="px-2 pt-3 pb-1">
          {confirmDelete ? (
            <div className="flex items-center justify-between gap-3 text-[13px]">
              <span className="text-dark/80">Usunąć ten widok?</span>
              <div className="flex gap-2">
                <button type="button" onClick={() => setConfirmDelete(false)} className="px-3 py-1.5 rounded-full hover:bg-neutral cursor-pointer">
                  Anuluj
                </button>
                <button type="button" onClick={onRemove} className="px-3 py-1.5 rounded-full bg-red-50 text-red-600 hover:bg-red-100 cursor-pointer">
                  Usuń
                </button>
              </div>
            </div>
          ) : (
            <Summary config={view.config} color={def.color} />
          )}
        </div>
      </div>
    </Reorder.Item>
  )
}

// --- Save status ---

function SaveIndicator({ status, onRetry }: { status: SaveStatus; onRetry: () => void }) {
  if (status === 'error') {
    return (
      <button type="button" onClick={onRetry} className="flex items-center gap-1.5 text-[12px] font-medium text-[#C03448] cursor-pointer hover:underline">
        <CircleAlert className="size-4" /> Błąd zapisu — ponów
      </button>
    )
  }
  if (status === 'saving' || status === 'pending') {
    return (
      <span className="flex items-center gap-1.5 text-[12px] text-dark/50">
        <Loader2 className="size-4 animate-spin" /> Zapisywanie…
      </span>
    )
  }
  return (
    <span className="flex items-center gap-1.5 text-[12px] text-dark/50">
      <Check className="size-4" /> Zapisano
    </span>
  )
}

