import type { LayoutItem, QuizVersion, QuizVersionContent } from '../../../../types/quiz'
import { layoutQuestionIds, validateQuizVersion } from '../../../../utils/quizVersion'
import { VersionControlModal } from '../../../../components/admin/VersionControlModal'
import { pluralPl, versionLabel } from '../../../../components/admin/versionLabel'
import type { VersionRowData } from '../../../../components/admin/versionLabel'
import { versionMatchesDraft } from '../hooks/useQuizVersions'

// Quiz adapter for the shared "Kontrola wersji" modal. A quiz version is the
// whole package: layout + questions/answers + tag points.

type QuizVersionModalProps = {
  isOpen: boolean
  onClose: () => void
  draftItems: LayoutItem[]
  /** Package the draft would produce now (null while being built). */
  draftContent: QuizVersionContent | null
  draftReady: boolean
  versions: QuizVersion[]
  liveVersion: QuizVersion | null
  isLoading: boolean
  loadError: string | null
  onSaveVersion: (name: string) => Promise<QuizVersion | undefined>
  onLoadVersion: (v: QuizVersion) => void
  onPublish: (v: QuizVersion) => Promise<void>
  onDelete: (v: QuizVersion) => Promise<void>
}

const questionsLabel = (n: number) => `${n} ${pluralPl(n, 'pytanie', 'pytania', 'pytań')}`

export function QuizVersionModal({
  isOpen,
  onClose,
  draftItems,
  draftContent,
  draftReady,
  versions,
  liveVersion,
  isLoading,
  loadError,
  onSaveVersion,
  onLoadVersion,
  onPublish,
  onDelete,
}: QuizVersionModalProps) {
  const byId = new Map(versions.map(v => [v.id, v]))
  const toRow = (v: QuizVersion): VersionRowData => ({
    id: v.id,
    number: v.version_number,
    name: v.name,
    createdAt: v.created_at,
    publishedAt: v.published_at,
    status: v.status === 'draft' ? 'saved' : v.status,
    summary: questionsLabel(Object.keys(v.content.questions).length),
    issues: validateQuizVersion(v.layout_data, v.content),
  })
  const rows = versions.map(toRow)
  const ready = draftReady && draftContent !== null
  const match = ready ? versions.find(v => versionMatchesDraft(v, draftItems, draftContent)) ?? null : null
  const original = (row: VersionRowData) => byId.get(row.id)!

  return (
    <VersionControlModal
      isOpen={isOpen}
      onClose={onClose}
      subject={{ nom: 'quiz', gen: 'quizu' }}
      nameMaxLength={50}
      versions={rows}
      live={liveVersion ? toRow(liveVersion) : null}
      draftMatch={match ? toRow(match) : null}
      draftSummary={`${questionsLabel(layoutQuestionIds(draftItems).length)} w układzie (wraz z treścią i punktacją)`}
      draftIssues={ready ? validateQuizVersion(draftItems, draftContent) : []}
      draftReady={ready}
      isLoading={isLoading}
      loadError={loadError}
      onSave={async name => {
        const created = await onSaveVersion(name)
        return created ? versionLabel({ number: created.version_number, name: created.name }) : `„${name.trim()}”`
      }}
      onLoad={row => onLoadVersion(original(row))}
      loadNotes={() => [
        'Wczytywany jest tylko układ pytań. Treść pytań, odpowiedzi i punktacja zostają takie, jak w bibliotece — jeśli zmieniły się od zapisania tej wersji, szkic będzie zawierał ich aktualną treść.',
      ]}
      onPublish={row => onPublish(original(row))}
      onDelete={row => onDelete(original(row))}
    />
  )
}
