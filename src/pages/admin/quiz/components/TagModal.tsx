import { useState, useEffect } from 'react'
import type { Tag } from '../../../../types/quiz'
import { BaseModal } from '../../../../components/ui/popups/BaseModal'
import { Save } from 'lucide-react'
import { AsyncButton } from '../../../../components/ui/buttons/Button'

// Predefined colors from the UI reference (vibrant but not too bright/dark)
const COLORS = [
  '#a3b18a', '#588157', '#52b788', '#344e41', // Greens
  '#ade8f4', '#00b4d8', '#0077b6', '#003554', // Blues
  '#ffea00', '#ffd000', '#ffa200', '#ff7b00', // Yellows/Oranges
  '#cdb4db', '#ffc8dd', '#ff5c8a', '#ff0a54', // Pinks
]

type TagModalProps = {
  isOpen: boolean
  onClose: () => void
  onSave: (tagData: Partial<Tag>) => void
  initialData?: Tag | null
}

export function TagModal({ isOpen, onClose, onSave, initialData }: TagModalProps) {
  const [slug, setSlug] = useState('')
  const [color, setColor] = useState(COLORS[0])
  const [isScored, setIsScored] = useState(false)
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setSlug(initialData?.slug || '')
      setColor(initialData?.color || COLORS[0])
      setIsScored(initialData?.is_scored ?? false)
      setError('')
    }
  }, [isOpen, initialData])

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Replace spaces with hyphens, convert to lowercase
    const val = e.target.value.replace(/\s+/g, '-').toLowerCase()
    setSlug(val)
    if (error) setError('')
  }

  const handleSave = async () => {
    if (!slug.trim()) {
      setError('Nazwa tagu nie może być pusta.')
      return
    }
    if (slug.length > 20) {
      setError('Nazwa tagu jest zbyt długa (max 20 znaków).')
      return
    }

    try {
      setIsSaving(true)
      await onSave({
        ...(initialData && { id: initialData.id }),
        slug,
        color,
        is_scored: isScored
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Konfiguracja Tagu"
      subtitle={initialData ? 'EDYCJA OZNACZENIA' : 'NOWE OZNACZENIE'}
      maxWidth="lg"
      footer={
        <>
          <AsyncButton variant="cancel" onClick={onClose}>
            Odrzuć zmiany
          </AsyncButton>
          <AsyncButton
            variant="dark"
            onClick={handleSave}
            leftIcon={<Save className="size-4" />}
            isLoading={isSaving}
          >
            Zapisz zmiany
          </AsyncButton>
        </>
      }
    >
      {/* Slug Input */}
      <div>
        <label className="block text-[11px] font-bold tracking-widest text-black/90 uppercase mb-3">
          NAZWA OZNACZENIA
        </label>
        <input
          type="text"
          value={slug}
          onChange={handleSlugChange}
          maxLength={20}
          placeholder="np. trudna-relacja"
          className={`w-full px-4 py-3 rounded-[12px] bg-neutral border ${error ? 'border-[#D15F5F] focus:border-[#D15F5F]' : 'border-dark/20/30 focus:border-primary/50'} text-dark text-[14px] font-medium focus:outline-none transition-colors`}
        />
        {error && <p className="text-[#D15F5F] text-[12px] mt-2 font-medium">{error}</p>}
        <p className="text-dark/50 text-[11px] mt-3 font-medium">Spacje są automatycznie zamieniane na myślniki. Max 20 znaków.</p>
      </div>

      {/* Color Picker */}
      <div>
        <label className="block text-[11px] font-bold tracking-widest text-black/90 uppercase mb-3">
          KOLOR IDENTYFIKACYJNY
        </label>
        <div className="grid grid-cols-4 gap-4">
          {COLORS.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className={`h-8 w-full rounded-lg cursor-pointer transition-transform ${color === c ? 'ring-2 ring-offset-2 ring-dark' : 'hover:scale-110'}`}
              style={{ backgroundColor: c }}
              aria-label={`Wybierz kolor ${c}`}
            />
          ))}
        </div>
      </div>

      {/* Scored Toggle */}
      <div className="flex items-center justify-between bg-neutral rounded-[16px] p-5 border border-dark/20/20">
        <div>
          <div className="text-[14px] font-semibold text-dark">Punktowane Oznaczenie</div>
          <div className="text-[12px] text-dark/50 mt-1 font-medium">Czy ten tag ma przyznawać punkty w ścieżce?</div>
        </div>
        <div
          onClick={() => setIsScored(!isScored)}
          className={`w-[44px] h-[24px] rounded-full flex items-center px-0.5 cursor-pointer transition-colors ${isScored ? 'bg-secondary' : 'bg-dark/30'}`}
        >
          <div className={`size-[20px] bg-white rounded-full transition-transform shadow-sm ${isScored ? 'translate-x-[20px]' : 'translate-x-0'}`} />
        </div>
      </div>
    </BaseModal>
  )
}
