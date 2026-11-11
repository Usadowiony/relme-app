import { useState } from 'react'
import type { BlockConfigMap, BlockType, ModuleView } from '../../../../types/modules'
import { validateView } from '../../../../utils/moduleFlow'
import { BaseModal } from '../../../../components/ui/popups/BaseModal'
import { ConfirmDialog } from '../../../../components/ui/popups/ConfirmDialog'
import { AsyncButton } from '../../../../components/ui/buttons/Button'
import { getBlockDefinition } from '../blocks/registry'

type BlockEditModalProps = {
  type: BlockType
  initialConfig: BlockConfigMap[BlockType]
  viewNumber: number
  /** New block: missing fields are highlighted only after the first save. */
  isNew: boolean
  readOnly: boolean
  onSave: (config: BlockConfigMap[BlockType]) => void
  onClose: () => void
}

/**
 * Edits one block's config. Mount it only while open (parent renders it
 * conditionally) so the draft resets for each opened view.
 * Incomplete blocks CAN be saved (the draft may be unfinished); only
 * publishing a version requires every block to be complete.
 */
export function BlockEditModal({ type, initialConfig, viewNumber, isNew, readOnly, onSave, onClose }: BlockEditModalProps) {
  const def = getBlockDefinition(type)
  const [config, setConfig] = useState(initialConfig)
  const [showMissing, setShowMissing] = useState(!isNew)
  const [confirmDiscard, setConfirmDiscard] = useState(false)

  const errors = showMissing ? validateView({ id: 'draft', block_type: type, config } as ModuleView) : {}
  const errorCount = Object.keys(errors).length
  const isDirty = config !== initialConfig

  const handleSave = () => {
    const missing = Object.keys(validateView({ id: 'draft', block_type: type, config } as ModuleView)).length
    if (missing > 0 && !showMissing) {
      // First save of a new incomplete block: point out the gaps once, save on the next click.
      setShowMissing(true)
      return
    }
    onSave(config)
  }

  const requestClose = () => {
    if (isDirty && !readOnly) setConfirmDiscard(true)
    else onClose()
  }

  const Form = def.Form

  return (
    <>
      <BaseModal
        isOpen
        onClose={requestClose}
        maxWidth={def.modalWidth}
        subtitle={`${readOnly ? 'Podgląd' : 'Edycja'} bloku ${def.label}, widok #${viewNumber}`}
        title={def.label}
        footer={
          readOnly ? (
            <AsyncButton variant="dark" onClick={onClose}>Zamknij</AsyncButton>
          ) : (
            <>
              <AsyncButton variant="cancel" onClick={requestClose}>Odrzuć zmiany</AsyncButton>
              <AsyncButton variant="dark" onClick={handleSave}>
                {errorCount > 0 ? 'Zapisz mimo braków' : 'Zapisz zmiany'}
              </AsyncButton>
            </>
          )
        }
      >
        {errorCount > 0 && (
          <div className="rounded-[12px] bg-amber-50 border border-amber-200 px-4 py-3 text-[13px] text-amber-900">
            Blok jest niekompletny — brakuje {errorCount} {errorCount === 1 ? 'pola' : 'pól'} (zaznaczone na czerwono).
            Możesz go zapisać i dokończyć później, ale wersji z niekompletnym blokiem nie da się opublikować.
          </div>
        )}
        <Form config={config} onChange={setConfig} errors={errors} readOnly={readOnly} />
      </BaseModal>

      <ConfirmDialog
        open={confirmDiscard}
        tone="danger"
        title="Odrzucić zmiany w bloku?"
        description="Zamykasz edycję bloku bez zapisywania."
        consequences={['Wszystko, co zmieniłeś w tym bloku od otwarcia okna, zostanie utracone.']}
        confirmLabel="Tak, odrzuć zmiany"
        cancelLabel="Wróć do edycji"
        onConfirm={() => {
          setConfirmDiscard(false)
          onClose()
        }}
        onCancel={() => setConfirmDiscard(false)}
      />
    </>
  )
}
