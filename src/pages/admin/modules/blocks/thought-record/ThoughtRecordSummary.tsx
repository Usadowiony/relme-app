import type { ExerciseThoughtRecordConfig } from '../../../../../types/modules'

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

export function ThoughtRecordSummary({ config, color }: { config: ExerciseThoughtRecordConfig; color: string }) {
  return (
    <div className="flex flex-col gap-1 min-w-0">
      <Row label="Sytuacja" color={color}>{value(config.situation)}</Row>
      {config.steps.map((step, i) => {
        const correct = step.options.find(o => o.is_correct)
        return (
          <Row key={step.id} label={`Krok ${i + 1}`} color={color}>
            {`${value(step.title)}${correct ? ` → ✓ ${value(correct.label)}` : ''}`}
          </Row>
        )
      })}
    </div>
  )
}
