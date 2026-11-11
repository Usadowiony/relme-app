import type { ExerciseMessengerConfig, MessengerNode } from '../../../../types/modules'

// Short read-only summaries shown on view cards in the editor timeline.
// One "Label: value" record per line, cut with an ellipsis.

function Row({ label, color, children }: { label: string; color: string; children: string }) {
  return (
    <p className="truncate text-[13px] leading-snug text-dark">
      <span className="font-medium" style={{ color }}>{label}: </span>
      {children}
    </p>
  )
}

function textOrEmpty(value: string): string {
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : '—'
}

/** Leaves = scenarios that end the conversation; depth = longest chain of choices. */
function treeStats(node: MessengerNode): { endings: number; depth: number } {
  if (node.options.length === 0) return { endings: 1, depth: 0 }
  const children = node.options.map(o => treeStats(o.next))
  return {
    endings: children.reduce((sum, c) => sum + c.endings, 0),
    depth: 1 + Math.max(...children.map(c => c.depth)),
  }
}

const AVATAR_LABELS = { female: 'Kobieta', male: 'Mężczyzna' } as const

export function MessengerSummary({ config, color }: { config: ExerciseMessengerConfig; color: string }) {
  const { endings, depth } = treeStats(config.root)
  const answers = config.root.options.map(o => `${o.is_correct ? '✓ ' : ''}${textOrEmpty(o.text)}`).join(' / ')

  return (
    <div className="flex flex-col gap-1 min-w-0">
      <Row label="Postać" color={color}>{config.avatar ? AVATAR_LABELS[config.avatar] : '—'}</Row>
      <Row label="Wiadomość" color={color}>{textOrEmpty(config.root.message)}</Row>
      <Row label="Odpowiedzi" color={color}>{answers || '—'}</Row>
      <Row label="Scenariusze" color={color}>{`${endings} zakończeń, ${depth} ${depth === 1 ? 'wybór' : 'wybory'} w najdłuższej ścieżce`}</Row>
    </div>
  )
}
