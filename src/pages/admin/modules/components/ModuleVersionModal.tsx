import { useState } from 'react'
import { Archive, Rocket, Undo2 } from 'lucide-react'
import type { ModuleFlowData, ModuleStatus } from '../../../../types/modules'
import { validateFlowContent } from '../../../../utils/moduleFlow'
import { archiveModule, publishModule, unpublishModule } from '../../../../api/modules.api'
import { BaseModal } from '../../../../components/ui/popups/BaseModal'
import { AsyncButton } from '../../../../components/ui/buttons/Button'

type Action = 'publish' | 'unpublish' | 'archive'

type ModuleVersionModalProps = {
  isOpen: boolean
  onClose: () => void
  moduleId: string
  status: ModuleStatus
  flow: ModuleFlowData
  /** Saves pending editor changes before publishing; throws on failure. */
  flushPendingChanges: () => Promise<void>
  onStatusChange: (status: ModuleStatus) => void
}

const STATUS_INFO: Record<ModuleStatus, { label: string; description: string; className: string }> = {
  draft: {
    label: 'Szkic',
    description: 'Moduł jest niewidoczny dla użytkowników. Zmiany zapisują się automatycznie.',
    className: 'bg-amber-100 text-amber-800',
  },
  published: {
    label: 'Opublikowany',
    description: 'Użytkownicy widzą ten moduł. Aby go edytować, wycofaj publikację.',
    className: 'bg-green-100 text-green-800',
  },
  archived: {
    label: 'Archiwum',
    description: 'Moduł jest wyłączony na stałe i niewidoczny dla użytkowników.',
    className: 'bg-gray-100 text-gray-600',
  },
}

export function ModuleVersionModal({
  isOpen,
  onClose,
  moduleId,
  status,
  flow,
  flushPendingChanges,
  onStatusChange,
}: ModuleVersionModalProps) {
  const [pending, setPending] = useState<Action | null>(null)
  const [error, setError] = useState<string | null>(null)

  const issues = validateFlowContent(flow)
  const canPublish = status === 'draft' && flow.views.length > 0 && issues.length === 0
  const info = STATUS_INFO[status]

  const run = async (action: Action) => {
    setPending(action)
    setError(null)
    try {
      if (action === 'publish') {
        await flushPendingChanges()
        await publishModule(moduleId, flow)
        onStatusChange('published')
      } else if (action === 'unpublish') {
        await unpublishModule(moduleId)
        onStatusChange('draft')
      } else {
        await archiveModule(moduleId)
        onStatusChange('archived')
      }
      onClose()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Nie udało się zmienić statusu modułu.')
    } finally {
      setPending(null)
    }
  }

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Kontrola wersji"
      subtitle="Status i publikacja modułu"
      maxWidth="lg"
      footer={<AsyncButton variant="cancel" onClick={onClose}>Zamknij</AsyncButton>}
    >
      <div className="flex flex-col gap-3">
        <span className={`self-start px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${info.className}`}>
          {info.label}
        </span>
        <p className="text-[14px] text-dark/70">{info.description}</p>
      </div>

      {status === 'draft' && (
        <div className="flex flex-col gap-3">
          {flow.views.length === 0 && (
            <p className="text-[13px] text-dark/60">Dodaj co najmniej jeden widok, aby opublikować moduł.</p>
          )}
          {issues.length > 0 && (
            <div className="rounded-[12px] bg-amber-50 border border-amber-200 px-4 py-3 text-[13px] text-amber-900">
              Przed publikacją uzupełnij widoki:{' '}
              {issues.map(i => `#${i.viewIndex + 1} (${Object.keys(i.errors).length})`).join(', ')}
            </div>
          )}
          <AsyncButton
            variant="dark"
            leftIcon={<Rocket className="size-4" />}
            isLoading={pending === 'publish'}
            disabled={!canPublish || pending !== null}
            onClick={() => void run('publish')}
          >
            Opublikuj moduł
          </AsyncButton>
        </div>
      )}

      {status === 'published' && (
        <AsyncButton
          variant="dark"
          leftIcon={<Undo2 className="size-4" />}
          isLoading={pending === 'unpublish'}
          disabled={pending !== null}
          onClick={() => void run('unpublish')}
        >
          Wycofaj publikację (edytuj)
        </AsyncButton>
      )}

      {status !== 'archived' && (
        <AsyncButton
          variant="cancel"
          leftIcon={<Archive className="size-4" />}
          isLoading={pending === 'archive'}
          disabled={pending !== null}
          onClick={() => void run('archive')}
        >
          Archiwizuj moduł
        </AsyncButton>
      )}

      {error && (
        <div className="rounded-[12px] bg-red-50 border border-red-200 px-4 py-3 text-[13px] text-[#7A2533]">{error}</div>
      )}
    </BaseModal>
  )
}
