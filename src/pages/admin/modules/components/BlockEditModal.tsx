import { useState } from 'react'
import type { BlockConfigMap, BlockType } from '../../../../types/modules'
import { validateView } from '../../../../utils/moduleFlow'
import type { ValidationErrors } from '../../../../utils/moduleFlow'
import type { ModuleView } from '../../../../types/modules'
import { BaseModal } from '../../../../components/ui/popups/BaseModal'
import { AsyncButton } from '../../../../components/ui/buttons/Button'
import { getBlockDefinition } from '../blocks/registry'

type BlockEditModalProps = {
  type: BlockType
  initialConfig: BlockConfigMap[BlockType]
  viewNumber: number
  readOnly: boolean
  onSave: (config: BlockConfigMap[BlockType]) => void
  onClose: () => void
}

/**
 * Edits one block's config. Mount it only while open (parent renders it
 * conditionally) so the draft resets for each opened view.
 */
export function BlockEditModal({ type, initialConfig, viewNumber, readOnly, onSave, onClose }: BlockEditModalProps) {
  const def = getBlockDefinition(type)
  const [config, setConfig] = useState(initialConfig)
  const [errors, setErrors] = useState<ValidationErrors>({})

  const handleChange = (next: BlockConfigMap[BlockType]) => {
    setConfig(next)
    // Re-validate live only after the first failed save attempt.
    if (Object.keys(errors).length > 0) {
      setErrors(validateView({ id: 'draft', block_type: type, config: next } as ModuleView))
    }
  }

  const handleSave = () => {
    const found = validateView({ id: 'draft', block_type: type, config } as ModuleView)
    setErrors(found)
    if (Object.keys(found).length > 0) return
    onSave(config)
  }

  const errorCount = Object.keys(errors).length
  const Form = def.Form

  return (
    <BaseModal
      isOpen
      onClose={onClose}
      maxWidth={def.modalWidth}
      subtitle={`${readOnly ? 'Podgląd' : 'Edycja'} bloku ${def.label}, widok #${viewNumber}`}
      title={def.label}
      footer={
        readOnly ? (
          <AsyncButton variant="dark" onClick={onClose}>Zamknij</AsyncButton>
        ) : (
          <>
            <AsyncButton variant="cancel" onClick={onClose}>Odrzuć zmiany</AsyncButton>
            <AsyncButton variant="dark" onClick={handleSave}>Zapisz zmiany</AsyncButton>
          </>
        )
      }
    >
      {errorCount > 0 && (
        <div className="rounded-[12px] bg-red-50 border border-red-200 px-4 py-3 text-[13px] text-[#7A2533]">
          Uzupełnij zaznaczone pola ({errorCount}).
        </div>
      )}
      <Form config={config} onChange={handleChange} errors={errors} readOnly={readOnly} />
    </BaseModal>
  )
}
