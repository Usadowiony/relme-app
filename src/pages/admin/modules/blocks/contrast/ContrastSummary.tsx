import type { ContrastListCard, KnowledgeBehavioralContrastConfig } from '../../../../../types/modules'
import { CONTRAST_NOTE, CONTRAST_TONES } from './theme'
import type { ContrastTone } from './theme'

// Compact timeline summary in the same "Label: value" style as Messenger.
// One record per line, cut with an ellipsis; card points listed below.

const MAX_POINTS = 3

function value(text: string) {
  const trimmed = text.trim()
  return trimmed || '—'
}

function Row({ label, color, children }: { label: string; color: string; children: string }) {
  return (
    <p className="truncate text-[13px] leading-snug text-dark">
      <span className="font-medium" style={{ color }}>{label}: </span>
      {children}
    </p>
  )
}

export function ContrastSummary({ config, color }: { config: KnowledgeBehavioralContrastConfig; color: string }) {
  return (
    <div className="flex flex-col gap-1 min-w-0">
      <Row label="Nadtytuł" color={color}>{value(config.kicker)}</Row>
      <Row label="Nagłówek" color={color}>{value(config.headline)}</Row>
      <CardRows tone="avoid" card={config.avoid} />
      <CardRows tone="focus" card={config.focus} />
      {config.remember && (
        <Row label={value(config.remember.title)} color={CONTRAST_NOTE.color}>{value(config.remember.text)}</Row>
      )}
    </div>
  )
}

function CardRows({ tone, card }: { tone: ContrastTone; card: ContrastListCard }) {
  const t = CONTRAST_TONES[tone]
  const hidden = card.points.length - MAX_POINTS

  return (
    <div className="min-w-0">
      <Row label={value(card.title)} color={t.color}>{value(card.lead)}</Row>
      <ul className="pl-3">
        {card.points.slice(0, MAX_POINTS).map((point, p) => (
          <li key={p} className="flex items-center gap-2 min-w-0 text-[12px] leading-snug text-dark/80">
            <span className="size-1 shrink-0 rounded-full" style={{ backgroundColor: t.color }} />
            <span className="truncate">{value(point)}</span>
          </li>
        ))}
        {hidden > 0 && <li className="pl-3 text-[11px] text-dark/50">+{hidden} więcej</li>}
      </ul>
    </div>
  )
}
