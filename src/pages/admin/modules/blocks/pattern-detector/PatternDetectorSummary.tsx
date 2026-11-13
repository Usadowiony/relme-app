import type { ExercisePatternDetectorConfig } from '../../../../../types/modules'

// Compact timeline summary in the same "Label: value" style as other blocks.

function Row({ label, color, children }: { label: string; color: string; children: string }) {
  return (
    <p className="truncate text-[13px] leading-snug text-dark">
      <span className="font-medium" style={{ color }}>{label}: </span>
      {children}
    </p>
  )
}

export function PatternDetectorSummary({ config, color }: { config: ExercisePatternDetectorConfig; color: string }) {
  const red = config.flags.filter(f => f.kind === 'red').length
  const green = config.flags.filter(f => f.kind === 'green').length
  return (
    <div className="flex flex-col gap-1 min-w-0">
      <Row label="Wypowiedź" color={color}>{config.text.trim() || '—'}</Row>
      <Row label="Flagi" color={color}>{`${red} red, ${green} green`}</Row>
    </div>
  )
}
