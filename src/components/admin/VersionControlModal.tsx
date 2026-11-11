import { useState } from 'react'
import type { ReactNode } from 'react'
import { CircleAlert, CircleCheck, Download, Loader2, Rocket, Save, Trash2 } from 'lucide-react'
import { BaseModal } from '../ui/popups/BaseModal'
import { ConfirmDialog } from '../ui/popups/ConfirmDialog'
import { AsyncButton } from '../ui/buttons/Button'
import { versionLabel } from './versionLabel'
import type { VersionRowData, VersionStatus } from './versionLabel'

// "Kontrola wersji" shared by modules and the quiz (one convention):
// save the draft as a named version, then load / publish / delete versions.
// Every action with consequences goes through a confirmation dialog.

type Action = { kind: 'load' | 'publish' | 'delete'; version: VersionRowData }

export type VersionControlModalProps = {
  isOpen: boolean
  onClose: () => void
  /** Grammar for texts: { nom: 'moduł', gen: 'modułu' } / { nom: 'quiz', gen: 'quizu' } */
  subject: { nom: string; gen: string }
  nameMaxLength: number
  versions: VersionRowData[]
  live: VersionRowData | null
  /** Saved version identical to the current draft, if any. */
  draftMatch: VersionRowData | null
  /** e.g. "12 widoków w szkicu" */
  draftSummary: string
  /** Problems of the current draft (save is still allowed). */
  draftIssues: string[]
  /** False while the draft/version comparison is not ready yet. */
  draftReady: boolean
  isLoading: boolean
  loadError: string | null
  /** Saves the draft as a version; resolves to the label shown in the success message. */
  onSave: (name: string) => Promise<string>
  onLoad: (v: VersionRowData) => void | Promise<void>
  /** Extra, subject-specific consequences of loading a version into the draft. */
  loadNotes?: (v: VersionRowData) => string[]
  onPublish: (v: VersionRowData) => Promise<void>
  /** Extra consequences shown when publishing for the very first time. */
  firstPublishNotes?: string[]
  onDelete: (v: VersionRowData) => Promise<void>
}

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('pl-PL', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })

export function VersionControlModal(props: VersionControlModalProps) {
  const {
    isOpen, onClose, subject, nameMaxLength, versions, live, draftMatch, draftSummary, draftIssues, draftReady,
    isLoading, loadError, onSave, onLoad, loadNotes, onPublish, firstPublishNotes, onDelete,
  } = props

  const [name, setName] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [savedInfo, setSavedInfo] = useState<string | null>(null)
  const [action, setAction] = useState<Action | null>(null)

  const handleSave = async () => {
    setIsSaving(true)
    setSaveError(null)
    setSavedInfo(null)
    try {
      const label = await onSave(name)
      setName('')
      setSavedInfo(`Zapisano wersję ${label}.`)
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
        subtitle={`Szkic i wersje ${subject.gen}`}
        maxWidth="xl"
        footer={<AsyncButton variant="cancel" onClick={handleClose}>Zamknij</AsyncButton>}
      >
        {/* Current state */}
        <div className="flex flex-col gap-1.5 text-[13px]">
          <div className="flex items-center gap-2">
            <span className="w-24 shrink-0 text-dark/50">Na żywo:</span>
            {live ? (
              <span className="font-semibold text-dark">{versionLabel(live)}</span>
            ) : (
              <span className="text-dark/60">{subject.nom} nie jest jeszcze opublikowany</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="w-24 shrink-0 text-dark/50">Szkic:</span>
            {!draftReady ? (
              <span className="flex items-center gap-1.5 text-dark/50"><Loader2 className="size-3.5 animate-spin" /> sprawdzanie…</span>
            ) : draftMatch ? (
              <span className="text-dark/80">zgodny z wersją {versionLabel(draftMatch)}</span>
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
              maxLength={nameMaxLength}
              className="flex-1 rounded-[12px] border border-dark/20 bg-white px-4 py-2.5 text-[14px] font-medium text-dark transition-colors focus:border-primary/50 focus:outline-none"
            />
            <AsyncButton
              variant="dark"
              onClick={() => void handleSave()}
              disabled={!name.trim() || !draftReady || draftMatch !== null}
              isLoading={isSaving}
              leftIcon={<Save className="size-4" />}
            >
              Zapisz
            </AsyncButton>
          </div>
          <p className="mt-2 text-[11px] font-medium text-dark/50">
            {draftSummary} ·{' '}
            {draftMatch ? (
              <>szkic jest już zapisany jako {versionLabel(draftMatch)} — nie ma czego zapisywać</>
            ) : draftIssues.length > 0 ? (
              <span className="text-[#B26B00]">
                niekompletny ({draftIssues.length}) — możesz zapisać, ale takiej wersji nie da się opublikować
              </span>
            ) : (
              'kompletny, gotowy do publikacji po zapisaniu'
            )}
          </p>
          {draftIssues.length > 0 && !draftMatch && <IssueList issues={draftIssues} />}
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
          subject={subject}
          live={live}
          draftMatch={draftMatch}
          loadNotes={loadNotes}
          firstPublishNotes={firstPublishNotes}
          onCancel={() => setAction(null)}
          onConfirm={async () => {
            const { kind, version } = action
            if (kind === 'load') {
              await onLoad(version)
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

function IssueList({ issues }: { issues: string[] }) {
  const shown = issues.slice(0, 4)
  return (
    <ul className="mt-1.5 list-disc pl-5 text-[11px] text-[#B26B00]/90">
      {shown.map((issue, i) => <li key={i}>{issue}</li>)}
      {issues.length > shown.length && <li>…i {issues.length - shown.length} więcej</li>}
    </ul>
  )
}

// --- One version in the list ---

const STATUS_BADGE: Record<VersionStatus, { text: string; className: string }> = {
  live: { text: 'Live', className: 'bg-emerald-100 text-emerald-700' },
  archived: { text: 'Archiwalna', className: 'bg-dark/10 text-dark/55' },
  saved: { text: 'Zapisana', className: 'bg-amber-100 text-amber-700' },
}

function VersionRow({ version, matchesDraft, onAction }: {
  version: VersionRowData
  matchesDraft: boolean
  onAction: (kind: Action['kind']) => void
}) {
  const incomplete = version.issues.length > 0
  const badge = STATUS_BADGE[version.status]

  return (
    <div className="flex items-center justify-between gap-4 rounded-[14px] border border-dark/20 bg-white p-4">
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-center gap-2">
          <span className="shrink-0 text-[12px] font-bold text-dark/45">v{version.number}</span>
          <span className="truncate text-[14px] font-semibold text-dark">{version.name}</span>
          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest ${badge.className}`}>{badge.text}</span>
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] font-medium text-dark/45">
          <span>{version.summary}</span>
          <span>•</span>
          <span>{formatDate(version.createdAt)}</span>
          {version.publishedAt && (
            <>
              <span>•</span>
              <span className="text-emerald-600">Opublikowano {formatDate(version.publishedAt)}</span>
            </>
          )}
          {incomplete ? (
            <span className="flex items-center gap-1 text-[#B26B00]" title={version.issues.join('\n')}>
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
        {version.status !== 'live' && (
          <IconAction
            title={
              incomplete
                ? `Nie można opublikować niekompletnej wersji:\n${version.issues.slice(0, 5).join('\n')}`
                : version.status === 'archived'
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
        {version.status === 'saved' && (
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

function ActionConfirm({ action, subject, live, draftMatch, loadNotes, firstPublishNotes, onConfirm, onCancel }: {
  action: Action
  subject: VersionControlModalProps['subject']
  live: VersionRowData | null
  draftMatch: VersionRowData | null
  loadNotes?: (v: VersionRowData) => string[]
  firstPublishNotes?: string[]
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
        description={<>Szkic zostanie zastąpiony wersją <b>{versionLabel(v)}</b>.</>}
        consequences={[
          draftMatch
            ? `Obecny szkic jest zapisany jako ${versionLabel(draftMatch)}, więc nic nie stracisz.`
            : 'Obecny szkic ma zmiany, których nie zapisano w żadnej wersji — zostaną utracone. Jeśli chcesz je zachować, najpierw zapisz szkic jako wersję.',
          ...(loadNotes ? loadNotes(v) : []),
          'Użytkownicy aplikacji niczego nie zauważą — wersja live się nie zmienia.',
        ]}
        confirmLabel="Tak, wczytaj"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    )
  }

  if (action.kind === 'publish') {
    const isRestore = Boolean(v.publishedAt)
    return (
      <ConfirmDialog
        open
        title={isRestore ? `Przywrócić ${versionLabel(v)} jako live?` : `Opublikować ${versionLabel(v)}?`}
        description={<>Wersja <b>{versionLabel(v)}</b> stanie się wersją live tego {subject.gen}.</>}
        consequences={[
          live
            ? `Osoby, które zaczną ${subject.nom} od teraz, dostaną tę wersję.`
            : `${capitalize(subject.nom)} pojawi się w aplikacji dla użytkowników.`,
          ...(live
            ? [`Dotychczasowa wersja live ${versionLabel(live)} stanie się archiwalna. Osoby, które są w jej trakcie, dokończą ją bez zmian.`]
            : []),
          'Opublikowanej wersji nie można później usunąć — zostaje w historii.',
          ...(!live && firstPublishNotes ? firstPublishNotes : []),
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
      description={<>Wersja <b>{versionLabel(v)}</b> zostanie trwale usunięta.</>}
      consequences={['Tej operacji nie można cofnąć.', 'Szkic i pozostałe wersje się nie zmienią.']}
      confirmLabel="Tak, usuń wersję"
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  )
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}
