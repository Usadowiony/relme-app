import type { ExerciseIMessageConfig } from '../../../../../types/modules'
import { composeIMessage } from '../../../../../utils/moduleFlow'

// Compact timeline summary in the same "Label: value" style as other blocks.

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

export function IMessageSummary({ config, color }: { config: ExerciseIMessageConfig; color: string }) {
  const message = composeIMessage(config.steps.map(s => s.options.find(o => o.is_correct)?.label ?? ''))
  return (
    <div className="flex flex-col gap-1 min-w-0">
      <Row label="Kontekst" color={color}>{value(config.context.title)}</Row>
      <Row label="Partner" color={color}>{value(config.partner_message)}</Row>
      <Row label="Prawidłowa odpowiedź" color={color}>{value(message)}</Row>
    </div>
  )
}
