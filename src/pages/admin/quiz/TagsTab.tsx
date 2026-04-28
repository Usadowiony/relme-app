import { useState } from 'react'
import { Trash2, Tag as TagIcon, Pencil, Loader2 } from 'lucide-react'
import type { Tag } from '../../../types/quiz'
import { updateTag } from '../../../api/quiz.api'

function TagCard({ tag, onEdit, onDelete, onRefresh }: { tag: Tag; onEdit: () => void; onDelete: () => void; onRefresh: () => void }) {
  const [isUpdating, setIsUpdating] = useState(false)
  const [isActive, setIsActive] = useState(tag.is_scored)

  const handleToggleScored = async () => {
    if (isUpdating) return
    setIsUpdating(true)
    try {
      await updateTag(tag.id, { is_scored: !isActive })
      setIsActive(!isActive)
      onRefresh()
    } catch (err) {
      console.error('Failed to update tag scored status:', err)
      alert('Nie udało się zapisać zmiany punktacji tagu.')
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="bg-white rounded-[24px] p-6 shadow-soft border border-gray/20 flex flex-col h-full">
      <div className="flex justify-between items-start mb-6">
        <h3 className="text-lg font-semibold text-dark font-manrope">{tag.slug}</h3>
        <div className="flex items-center gap-3">
          <button onClick={onEdit} className="text-primary-2 opacity-90 hover:opacity-100 transition-opacity cursor-pointer mt-1">
            <Pencil className="size-[18px]" />
          </button>
          <button onClick={onDelete} className="text-[#D15F5F] opacity-90 hover:opacity-100 transition-opacity cursor-pointer mt-1">
            <Trash2 className="size-[18px]" />
          </button>
        </div>
      </div>

      <div className="flex-1 mb-2" />

      <div className="flex items-center justify-between border-t border-gray/30 pt-4 mt-auto">
        <div className="cursor-pointer size-6 rounded-full shadow-sm" style={{ backgroundColor: tag.color || '#DDE9F4' }} />
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-bold tracking-widest text-dark/50 uppercase">Punktowane</span>
          {isUpdating ? (
            <div className="w-[36px] h-[20px] flex items-center justify-center">
              <Loader2 className="size-4 text-dark/40 animate-spin" />
            </div>
          ) : (
            <div
              onClick={handleToggleScored}
              className={`w-[36px] h-[20px] rounded-full flex items-center px-0.5 cursor-pointer transition-colors ${isActive ? 'bg-secondary' : 'bg-dark/30'}`}
            >
              <div className={`size-[16px] bg-white rounded-full transition-transform shadow-sm ${isActive ? 'translate-x-[16px]' : 'translate-x-0'}`} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export function TagsTab({ tags, onEdit, onDelete, onRefresh }: { tags: Tag[]; onEdit: (tag: Tag) => void; onDelete: (id: string) => void; onRefresh: () => void }) {
  if (!tags || tags.length === 0) {
    return (
      <div className="mt-16 flex flex-col items-center justify-center text-center">
        <div className="size-14 bg-secondary/80 rounded-full flex items-center justify-center mb-4">
          <TagIcon className="size-6 text-white" />
        </div>
        <h3 className="text-xl font-semibold text-dark font-manrope">Brak oznaczeń</h3>
        <p className="text-dark/50 mt-2">Użyj przycisku "Nowe oznaczenie", aby utworzyć pierwszy tag.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mt-8">
      {tags.map((tag) => (
        <TagCard key={tag.id} tag={tag} onEdit={() => onEdit(tag)} onDelete={() => onDelete(tag.id)} onRefresh={onRefresh} />
      ))}
    </div>
  )
}
