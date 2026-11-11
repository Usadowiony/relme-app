import type { ModuleFlowData, ModuleVersion, ModuleVersionStatus } from '../../../../types/modules'
import { flowsEqual, validateFlowContent } from '../../../../utils/moduleFlow'
import { VersionControlModal } from '../../../../components/admin/VersionControlModal'
import { pluralPl, versionLabel } from '../../../../components/admin/versionLabel'
import type { VersionRowData } from '../../../../components/admin/versionLabel'

// Module adapter for the shared "Kontrola wersji" modal.

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

const viewsLabel = (n: number) => `${n} ${pluralPl(n, 'widok', 'widoki', 'widoków')}`

function flowIssues(flow: ModuleFlowData): string[] {
  if (flow.views.length === 0) return ['Brak widoków.']
  return validateFlowContent(flow).map(i => {
    const n = Object.keys(i.errors).length
    return `Widok #${i.viewIndex + 1}: ${n} ${pluralPl(n, 'pole', 'pola', 'pól')} do uzupełnienia`
  })
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
  const byId = new Map(versions.map(v => [v.id, v]))
  const toRow = (v: ModuleVersion): VersionRowData => ({
    id: v.id,
    number: v.version_number,
    name: v.name,
    createdAt: v.created_at,
    publishedAt: v.published_at,
    status: statusOf(v),
    summary: viewsLabel(v.flow_data.views.length),
    issues: flowIssues(v.flow_data),
  })
  const rows = versions.map(toRow)
  const draftMatchVersion = versions.find(v => flowsEqual(v.flow_data, draftFlow)) ?? null
  const original = (row: VersionRowData) => byId.get(row.id)!

  return (
    <VersionControlModal
      isOpen={isOpen}
      onClose={onClose}
      subject={{ nom: 'moduł', gen: 'modułu' }}
      nameMaxLength={60}
      versions={rows}
      live={liveVersion ? toRow(liveVersion) : null}
      draftMatch={draftMatchVersion ? toRow(draftMatchVersion) : null}
      draftSummary={`${viewsLabel(draftFlow.views.length)} w szkicu`}
      draftIssues={draftFlow.views.length === 0 ? [] : flowIssues(draftFlow)}
      draftReady
      isLoading={isLoading}
      loadError={loadError}
      onSave={async name => {
        const created = await onSaveVersion(name)
        return created ? versionLabel({ number: created.version_number, name: created.name }) : `„${name.trim()}”`
      }}
      onLoad={row => onLoadVersion(original(row))}
      onPublish={row => onPublish(original(row))}
      firstPublishNotes={['Moduł, który był opublikowany, nie może zostać usunięty — można go tylko aktualizować nowymi wersjami.']}
      onDelete={row => onDelete(original(row))}
    />
  )
}
