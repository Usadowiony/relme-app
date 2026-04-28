import { useState } from 'react'
import { Plus } from 'lucide-react'
import { BaseModal } from './BaseModal'
import { AsyncButton } from '../../../../components/ui/buttons/Button'

type PathModalProps = {
  isOpen: boolean
  onClose: () => void
  onSave: (pathName: string) => void
}

export function PathModal({ isOpen, onClose, onSave }: PathModalProps) {
  const [name, setName] = useState('')

  const handleSave = () => {
    if (!name.trim()) return
    onSave(name.trim())
    setName('')
  }

  const handleClose = () => {
    setName('')
    onClose()
  }

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Nowa ścieżka"
      subtitle="DODAJ ROZGAŁĘZIENIE"
      maxWidth="sm"
      footer={
        <>
          <AsyncButton variant="cancel" onClick={handleClose}>
            Anuluj
          </AsyncButton>
          <AsyncButton
            variant="dark"
            onClick={handleSave}
            disabled={!name.trim()}
            leftIcon={<Plus className="size-4" />}
          >
            Dodaj
          </AsyncButton>
        </>
      }
    >
      <div>
        <label className="block text-[11px] font-bold tracking-widest text-dark/90 uppercase mb-3">
          NAZWA ŚCIEŻKI
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="np. Harmonia, Emocje..."
          maxLength={30}
          className="w-full px-4 py-3 rounded-[12px] bg-neutral border border-gray/30 focus:border-primary/50 text-dark text-[14px] font-medium focus:outline-none transition-colors"
          autoFocus
        />
      </div>
    </BaseModal>
  )
}
