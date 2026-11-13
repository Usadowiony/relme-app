import type { ExerciseQuizConfig } from '../../../../../types/modules'

// Compact timeline summary in the same "Label: value" style as other blocks.

function Row({ label, color, children }: { label: string; color: string; children: string }) {
  return (
    <p className="truncate text-[13px] leading-snug text-dark">
      <span className="font-medium" style={{ color }}>{label}: </span>
      {children}
    </p>
  )
}

export function QuizSummary({ config, color }: { config: ExerciseQuizConfig; color: string }) {
  const answers = config.options.map(o => `${o.is_correct ? '✓ ' : ''}${o.text.trim() || '—'}`).join(' / ')
  return (
    <div className="flex flex-col gap-1 min-w-0">
      <Row label="Pytanie" color={color}>{config.question.trim() || '—'}</Row>
      <Row label={`Odpowiedzi (${config.options.length})`} color={color}>{answers || '—'}</Row>
    </div>
  )
}
