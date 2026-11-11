import { useState } from 'react'
import type { ReactNode } from 'react'
import { CircleAlert, CircleCheck, Download, Loader2, Rocket, Save, Trash2 } from 'lucide-react'
import type { ModuleFlowData, ModuleVersion, ModuleVersionStatus } from '../../../../types/modules'
import { flowsEqual, validateFlowContent } from '../../../../utils/moduleFlow'
import { BaseModal } from '../../../../components/ui/popups/BaseModal'
import { ConfirmDialog } from '../../../../components/ui/popups/ConfirmDialog'
import { AsyncButton } from '../../../../components/ui/buttons/Button'

// "Kontrola wersji" of a module — same convention as the quiz:
// save the draft as a named version, then load / publish / delete versions.
// Every action with consequences goes through a confirmation dialog.

const NAME_MAX = 60

type Action = { kind: 'load' | 'publish' | 'delete'; version: ModuleVersion }

type ModuleVersionModalProps = {
  isOpen: boolean
  onClose: () => void
  draftFlow: ModuleFlowData
  versions: ModuleVersion[]
  liveVersion: ModuleVersion | null
  isLoading: boolean
  loadError: string | null
  statusOf: (v: ModuleVersion) => ModuleVersionStatus
  onSaveVersion: (name: string) => Promise<ModuleVersion | undefined>
  onLoadVersion: (v: ModuleVersion) => void
  onPublish: (v: ModuleVersion) => Promise<void>
  onDelete: (v: ModuleVersion) => Promise<void>
}

const label = (v: ModuleVersion) => `v${v.version_number} „${v.name}”`

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('pl-PL', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })

function viewsLabel(n: number) {
  return `${n} ${n === 1 ? 'widok' : n > 1 && n < 5 ? 'widoki' : 'widoków'}`
}

export function ModuleVersionModal({
  isOpen,
  onClose,
  draftFlow,
  versions,
  liveVersion,
  isLoading,
  loadError,
  statusOf,
  onSaveVersion,
  onLoadVersion,
  onPublish,
  onDelete,
}: ModuleVersionModalProps) {
  const [name, setName] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [savedInfo, setSavedInfo] = useState<string | null>(null)
  const [action, setAction] = useState<Action | null>(null)

  const draftIssues = validateFlowContent(draftFlow)
  const draftMatch = versions.find(v => flowsEqual(v.flow_data, draftFlow)) ?? null

  const handleSave = async () => {
    setIsSaving(true)
    setSaveError(null)
    setSavedInfo(null)
    try {
      const created = await onSaveVersion(name)
      setName('')
      setSavedInfo(created ? `Zapisano wersję ${label(created)}.` : 'Zapisano nową wersję.')
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : 'Nie udało się zapisać wersji.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleClose = () => {
    setSaveError(null)
    setSavedInfo(null)
    onClose()
  }

  return (
    <>
      <BaseModal
        isOpen={isOpen}
        onClose={handleClose}
        title="Kontrola wersji"
        subtitle="Szkic i wersje modułu"
        maxWidth="xl"
        footer={<AsyncButton variant="cancel" onClick={handleClose}>Zamknij</AsyncButton>}
      >
        {/* Current state */}
        <div className="flex flex-col gap-1.5 text-[13px]">
          <div className="flex items-center gap-2">
            <span className="w-24 shrink-0 text-dark/50">Na żywo:</span>
            {liveVersion ? (
              <span className="font-semibold text-dark">{label(liveVersion)}</span>
            ) : (
              <span className="text-dark/60">moduł nie jest jeszcze opublikowany</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="w-24 shrink-0 text-dark/50">Szkic:</span>
            {draftMatch ? (
              <span className="text-dark/80">zgodny z wersją {label(draftMatch)}</span>
            ) : (
              <span className="font-medium text-[#B26B00]">ma zmiany niezapisane w żadnej wersji</span>
            )}
          </div>
        </div>

        {/* Save draft as a version */}
        <div className="rounded-[16px] border border-dark/20 bg-neutral p-5">
          <label className="mb-3 block text-[10px] font-bold uppercase tracking-widest text-dark/60">
            Zapisz aktualny szkic jako nową wersję
          </label>
          <div className="flex gap-3">
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Nazwa wersji, np. Poprawki po konsultacji"
              maxLength={NAME_MAX}
              className="flex-1 rounded-[12px] border border-dark/20 bg-white px-4 py-2.5 text-[14px] font-medium text-dark transition-colors focus:border-primary/50 focus:outline-none"
            />
            <AsyncButton
              variant="dark"
              onClick={() => void handleSave()}
              disabled={!name.trim() || draftMatch !== null}
              isLoading={isSaving}
              leftIcon={<Save className="size-4" />}
            >
              Zapisz
            </AsyncButton>
          </div>
          <p className="mt-2 text-[11px] font-medium text-dark/50">
            {viewsLabel(draftFlow.views.length)} w szkicu ·{' '}
            {draftMatch ? (
              <>szkic jest już zapisany jako {label(draftMatch)} — nie ma czego zapisywać</>
            ) : draftIssues.length > 0 ? (
              <span className="text-[#B26B00]">
                {draftIssues.length} {draftIssues.length === 1 ? 'blok niekompletny' : 'bloki niekompletne'} — możesz zapisać, ale takiej wersji nie da się opublikować
              </span>
            ) : draftFlow.views.length === 0 ? (
              'pusty szkic'
            ) : (
              'kompletny, gotowy do publikacji po zapisaniu'
            )}
          </p>
          {savedInfo && <p className="mt-2 text-[12px] font-medium text-emerald-700">{savedInfo}</p>}
          {saveError && <p className="mt-2 text-[12px] font-medium text-[#C03448]">{saveError}</p>}
        </div>

        {/* Versions */}
        <div>
          <div className="mb-3 text-[10px] font-bold uppercase tracking-widest text-dark/60">Zapisane wersje</div>
          {loadError && (
            <div className="mb-3 rounded-[12px] border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-[#7A2533]">{loadError}</div>
          )}
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="size-5 animate-spin text-dark/30" />
            </div>
          ) : versions.length === 0 ? (
            <div className="py-8 text-center text-[13px] text-dark/40">
              Brak zapisanych wersji. Zapisz szkic jako pierwszą wersję powyżej.
            </div>
          ) : (
            <div className="custom-scrollbar flex max-h-[360px] flex-col gap-2 overflow-y-auto">
              {versions.map(v => (
                <VersionRow
                  key={v.id}
                  version={v}
                  status={statusOf(v)}
                  matchesDraft={draftMatch?.id === v.id}
                  onAction={kind => setAction({ kind, version: v })}
                />
              ))}
            </div>
          )}
        </div>
      </BaseModal>

      {action && (
        <ActionConfirm
          action={action}
          liveVersion={liveVersion}
          draftMatch={draftMatch}
          onCancel={() => setAction(null)}
          onConfirm={async () => {
            const { kind, version } = action
            if (kind === 'load') {
              onLoadVersion(version)
              setAction(null)
              handleClose()
              return
            }
            if (kind === 'publish') await onPublish(version)
            else await onDelete(version)
            setAction(null)
          }}
        />
      )}
    </>
  )
}

// --- One version in the list ---

const STATUS_BADGE: Record<ModuleVersionStatus, { text: string; className: string }> = {
  live: { text: 'Live', className: 'bg-emerald-100 text-emerald-700' },
  archived: { text: 'Archiwalna', className: 'bg-dark/10 text-dark/55' },
  saved: { text: 'Zapisana', className: 'bg-amber-100 text-amber-700' },
}

function VersionRow({ version, status, matchesDraft, onAction }: {
  version: ModuleVersion
  status: ModuleVersionStatus
  matchesDraft: boolean
  onAction: (kind: Action['kind']) => void
}) {
  const issues = validateFlowContent(version.flow_data)
  const incomplete = issues.length > 0 || version.flow_data.views.length === 0
  const badge = STATUS_BADGE[status]

  return (
    <div className="flex items-center justify-between gap-4 rounded-[14px] border border-dark/20 bg-white p-4">
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-center gap-2">
          <span className="shrink-0 text-[12px] font-bold text-dark/45">v{version.version_number}</span>
          <span className="truncate text-[14px] font-semibold text-dark">{version.name}</span>
          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest ${badge.className}`}>{badge.text}</span>
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] font-medium text-dark/45">
          <span>{viewsLabel(version.flow_data.views.length)}</span>
          <span>•</span>
          <span>{formatDate(version.created_at)}</span>
          {version.published_at && (
            <>
              <span>•</span>
              <span className="text-emerald-600">Opublikowano {formatDate(version.published_at)}</span>
            </>
          )}
          {incomplete ? (
            <span className="flex items-center gap-1 text-[#B26B00]">
              <CircleAlert className="size-3" /> niekompletna
            </span>
          ) : (
            <span className="flex items-center gap-1 text-emerald-600">
              <CircleCheck className="size-3" /> kompletna
            </span>
          )}
          {matchesDraft && <span className="text-dark/60">= aktualny szkic</span>}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        <IconAction title="Wczytaj do szkicu" onClick={() => onAction('load')} className="text-primary/70 hover:bg-primary/10 hover:text-primary">
          <Download className="size-4" />
        </IconAction>
        {status !== 'live' && (
          <IconAction
            title={
              incomplete
                ? 'Nie można opublikować niekompletnej wersji — wczytaj ją do szkicu, uzupełnij bloki i zapisz jako nową wersję'
                : status === 'archived'
                  ? 'Przywróć jako wersję live'
                  : 'Opublikuj'
            }
            disabled={incomplete}
            onClick={() => onAction('publish')}
            className="text-emerald-500/70 hover:bg-emerald-50 hover:text-emerald-600"
          >
            <Rocket className="size-4" />
          </IconAction>
        )}
        {status === 'saved' && (
          <IconAction title="Usuń wersję" onClick={() => onAction('delete')} className="text-dark/30 hover:bg-red-50 hover:text-[#D15F5F]">
            <Trash2 className="size-4" />
          </IconAction>
        )}
      </div>
    </div>
  )
}

function IconAction({ title, disabled, onClick, className, children }: {
  title: string
  disabled?: boolean
  onClick: () => void
  className: string
  children: ReactNode
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={`rounded-full p-2 transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent ${className}`}
    >
      {children}
    </button>
  )
}

// --- Confirmations (what happens + consequences) ---

function ActionConfirm({ action, liveVersion, draftMatch, onConfirm, onCancel }: {
  action: Action
  liveVersion: ModuleVersion | null
  draftMatch: ModuleVersion | null
  onConfirm: () => Promise<void>
  onCancel: () => void
}) {
  const v = action.version

  if (action.kind === 'load') {
    return (
      <ConfirmDialog
        open
        tone={draftMatch ? 'default' : 'danger'}
        title="Wczytać wersję do szkicu?"
        description={<>Szkic zostanie zastąpiony treścią wersji <b>{label(v)}</b>.</>}
        consequences={[
          draftMatch
            ? `Obecny szkic jest zapisany jako ${label(draftMatch)}, więc nic nie stracisz.`
            : 'Obecny szkic ma zmiany, których nie zapisano w żadnej wersji — zostaną utracone. Jeśli chcesz je zachować, najpierw zapisz szkic jako wersję.',
          'Użytkownicy aplikacji niczego nie zauważą — wersja live się nie zmienia.',
        ]}
        confirmLabel="Tak, wczytaj"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    )
  }

  if (action.kind === 'publish') {
    const isRestore = Boolean(v.published_at)
    return (
      <ConfirmDialog
        open
        title={isRestore ? `Przywrócić ${label(v)} jako live?` : `Opublikować ${label(v)}?`}
        description={<>Wersja <b>{label(v)}</b> stanie się wersją live tego modułu.</>}
        consequences={[
          liveVersion
            ? 'Osoby, które zaczną moduł od teraz, dostaną tę wersję.'
            : 'Moduł pojawi się w aplikacji dla użytkowników.',
          ...(liveVersion
            ? [`Dotychczasowa wersja live ${label(liveVersion)} stanie się archiwalna. Osoby, które są w jej trakcie, dokończą ją bez zmian.`]
            : []),
          'Opublikowanej wersji nie można później usunąć — zostaje w historii.',
          ...(!liveVersion ? ['Moduł, który był opublikowany, nie może zostać usunięty — można go tylko aktualizować nowymi wersjami.'] : []),
        ]}
        confirmLabel={isRestore ? 'Tak, przywróć' : 'Tak, opublikuj'}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    )
  }

  return (
    <ConfirmDialog
      open
      tone="danger"
      title="Usunąć wersję?"
      description={<>Wersja <b>{label(v)}</b> zostanie trwale usunięta.</>}
      consequences={['Tej operacji nie można cofnąć.', 'Szkic i pozostałe wersje się nie zmienią.']}
      confirmLabel="Tak, usuń wersję"
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  )
}
