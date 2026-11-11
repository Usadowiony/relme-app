import { BookOpen } from 'lucide-react'
import type { BlockType } from '../../../../types/modules'
import { BaseModal } from '../../../../components/ui/popups/BaseModal'
import { AsyncButton } from '../../../../components/ui/buttons/Button'
import { BLOCK_REGISTRY, CATEGORY_LABELS, PLANNED_BLOCKS } from '../blocks/registry'
import type { BlockCategory } from '../blocks/registry'

const CATEGORIES: BlockCategory[] = ['knowledge', 'exercise']

type ListProps = { disabled?: boolean; onPick: (type: BlockType) => void }

/** Available + planned blocks grouped by category. Shared by the side panel and the picker popup. */
function BlockLibraryList({ disabled = false, onPick }: ListProps) {
  const available = Object.values(BLOCK_REGISTRY)

  return (
    <>
      {CATEGORIES.map(category => (
        <div key={category} className="mb-6 last:mb-0">
          <div className="text-[11px] font-bold tracking-widest uppercase text-dark/60 mb-3">{CATEGORY_LABELS[category]}</div>
          <div className="flex flex-col gap-2">
            {available.filter(b => b.category === category).map(block => {
              const Icon = block.icon
              return (
                <button
                  key={block.type}
                  type="button"
                  disabled={disabled}
                  onClick={() => onPick(block.type)}
                  className="flex items-center gap-3 rounded-[14px] border border-gray/50 bg-white px-3 py-2.5 text-left hover:border-dark/30 hover:shadow-sm transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="size-9 shrink-0 rounded-[10px] flex items-center justify-center" style={{ backgroundColor: `${block.color}1A`, color: block.color }}>
                    <Icon className="size-[18px]" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[13px] font-semibold text-dark">{block.label}</div>
                    <div className="text-[11px] text-dark/60 truncate">{block.description}</div>
                  </div>
                </button>
              )
            })}

            {PLANNED_BLOCKS.filter(b => b.category === category).map(block => {
              const Icon = block.icon
              return (
                <div
                  key={block.label}
                  title="Wkrótce"
                  className="flex items-center gap-3 rounded-[14px] border border-dashed border-gray/50 px-3 py-2.5 opacity-50"
                >
                  <div className="size-9 shrink-0 rounded-[10px] flex items-center justify-center bg-dark/5 text-dark/50">
                    <Icon className="size-[18px]" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[13px] font-semibold text-dark">{block.label}</div>
                    <div className="text-[11px] text-dark/60 truncate">Wkrótce · {block.description}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </>
  )
}

/** Side panel next to the timeline. */
export function BlockLibrary({ disabled, onPick }: ListProps) {
  return (
    <div className="rounded-[24px] bg-white/70 border border-gray/40 p-5">
      <h2 className="flex items-center gap-2 text-[18px] font-manrope font-semibold text-dark mb-5">
        <BookOpen className="size-5" /> Biblioteka elementów
      </h2>
      <BlockLibraryList disabled={disabled} onPick={onPick} />
    </div>
  )
}

/** Popup opened by the "Nowy element" button. Mount only while open. */
export function BlockPickerModal({ onPick, onClose }: { onPick: (type: BlockType) => void; onClose: () => void }) {
  return (
    <BaseModal
      isOpen
      onClose={onClose}
      maxWidth="md"
      subtitle="Nowy widok"
      title="Wybierz blok"
      footer={<AsyncButton variant="cancel" onClick={onClose}>Anuluj</AsyncButton>}
    >
      <div>
        <BlockLibraryList onPick={onPick} />
      </div>
    </BaseModal>
  )
}
