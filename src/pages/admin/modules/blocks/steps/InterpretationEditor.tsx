import { useState } from 'react'
import type { ReactNode } from 'react'
import { Check, CircleCheck, CircleX, Info, Plus, Sparkles, Trash2, X } from 'lucide-react'
import type {
  ChoiceOption,
  ChoiceStep,
  ExerciseOutcome,
  OutcomeVariant,
  ReasonsList,
  RememberWidget,
  ShortConclusion,
  TextBlock,
} from '../../../../../types/modules'
import { MODULE_LIMITS } from '../../../../../utils/moduleFlow'
import type { ValidationErrors } from '../../../../../utils/moduleFlow'
import { removeAt, replaceAt } from '../../../../../utils/arrays'
import { AddLink, InlineText, RemoveButton } from '../fields'
import { CARD_CLASS, SCREEN_CLASS, TR } from './theme'

// Tab "Interpretacja odpowiedzi" shared by step exercises. Two variants
// switched at the top and again at the conclusion (one shared state):
// correct / wrong answers. Each has its own result, explanation and
// conclusion; per-answer explanations in the steps are shared. Block-specific
// parts come in as props: the reminder at the top of the white card and the
// failure-only widgets of the conclusion.

const L = MODULE_LIMITS.steps

export type InterpretationTexts = {
  successIntro: string // placeholder of the success intro
  failureIntro: string
  successNote: string // explanation under the screen
  failureNote: string
}

type Props<F extends ShortConclusion> = {
  steps: ChoiceStep[]
  success: ExerciseOutcome<ShortConclusion>
  failure: ExerciseOutcome<F>
  onSteps: (steps: ChoiceStep[]) => void
  onSuccess: (outcome: ExerciseOutcome<ShortConclusion>) => void
  onFailure: (outcome: ExerciseOutcome<F>) => void
  errors: ValidationErrors
  readOnly: boolean
  /** Read-only reminder of the task at the top of the white card. */
  reminder: ReactNode
  texts: InterpretationTexts
  /** Failure-only widgets between the conclusion header and "Zapamiętaj". */
  renderFailureWidgets: (conclusion: F, onChange: (conclusion: F) => void) => ReactNode
}

export function StepInterpretationEditor<F extends ShortConclusion>(props: Props<F>) {
  const { steps, success, failure, onSteps, onSuccess, onFailure, errors, readOnly, reminder, texts } = props
  const [variant, setVariant] = useState<OutcomeVariant>('failure')

  const outcome: ExerciseOutcome<ShortConclusion> = variant === 'success' ? success : failure
  const setOutcome = (patch: Partial<ExerciseOutcome<ShortConclusion>>) =>
    variant === 'success' ? onSuccess({ ...success, ...patch }) : onFailure({ ...failure, ...patch } as ExerciseOutcome<F>)
  const e = (key: string) => errors[`${variant}.${key}`]

  const setText = (key: 'result' | 'explanation', value: TextBlock) => setOutcome({ [key]: value })
  const setStep = (step: ChoiceStep) => onSteps(steps.map(s => (s.id === step.id ? step : s)))

  const variantErrors = (v: OutcomeVariant) => Object.keys(errors).filter(k => k.startsWith(`${v}.`)).length
  const switcher = (
    <VariantSwitch
      value={variant}
      onChange={setVariant}
      errorCount={{ success: variantErrors('success'), failure: variantErrors('failure') }}
    />
  )

  return (
    <div className={SCREEN_CLASS} style={{ backgroundColor: TR.screen }}>
      {switcher}

      <fieldset key={variant} disabled={readOnly} className="mt-4 min-w-0">
        {/* Result header */}
        <div className="px-1">
          <InlineText
            value={outcome.result.title}
            onChange={title => setText('result', { ...outcome.result, title })}
            maxLength={L.resultTitle}
            placeholder="Nagłówek wyniku"
            error={e('result.title')}
            className="font-manrope text-[24px] font-bold leading-[1.2] text-dark"
          />
          <div className="mt-1.5">
            <InlineText
              value={outcome.result.body}
              onChange={body => setText('result', { ...outcome.result, body })}
              maxLength={L.resultBody}
              placeholder={variant === 'success' ? texts.successIntro : texts.failureIntro}
              error={e('result.body')}
              className="text-[14px] leading-snug text-dark/80"
            />
          </div>
        </div>

        {/* Reminder + explanation */}
        <div className={`${CARD_CLASS} mt-4 px-5 py-5`}>
          {reminder}

          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-dark/15" />
            <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-dark/45">Wyjaśnienie</span>
            <div className="h-px flex-1 bg-dark/15" />
          </div>

          <InlineText
            value={outcome.explanation.title}
            onChange={title => setText('explanation', { ...outcome.explanation, title })}
            maxLength={L.explTitle}
            placeholder="Nagłówek wyjaśnienia"
            error={e('explanation.title')}
            className="font-manrope text-[17px] font-bold leading-snug text-dark"
          />
          <div className="mt-1.5">
            <InlineText
              value={outcome.explanation.body}
              onChange={body => setText('explanation', { ...outcome.explanation, body })}
              maxLength={L.explBody}
              placeholder="Wyjaśnij mechanizm, który stoi za tą sytuacją"
              error={e('explanation.body')}
              className="text-[14px] leading-snug text-dark/85"
            />
          </div>
        </div>
      </fieldset>

      {/* Steps: explanation per answer (shared by both variants) */}
      <div className="mt-4 flex flex-col gap-3">
        <p className="flex items-start gap-1.5 px-1 text-[12px] leading-snug text-dark/55">
          <Info className="mt-px size-3.5 shrink-0" />
          Wyjaśnienia odpowiedzi w krokach są wspólne dla obu wariantów.
          {variant === 'success' && ' Przy poprawnych odpowiedziach użytkownik widzi tylko prawidłowe odpowiedzi.'}
        </p>
        {steps.map((step, i) => (
          <StepAnswers
            key={step.id}
            step={step}
            index={i}
            onlyCorrect={variant === 'success'}
            errors={errors}
            readOnly={readOnly}
            onChange={setStep}
          />
        ))}
      </div>

      {/* Conclusion */}
      <div className="mt-6">{switcher}</div>
      <fieldset key={`c-${variant}`} disabled={readOnly} className="min-w-0">
        <ConclusionHeader
          conclusion={outcome.conclusion}
          prefix={`${variant}.conclusion`}
          errors={errors}
          onChange={patch => setOutcome({ conclusion: { ...outcome.conclusion, ...patch } })}
        />
        {variant === 'success' ? (
          <div className="mt-4">
            <RememberCard
              remember={success.conclusion.remember}
              prefix="success.conclusion.remember"
              errors={errors}
              onChange={remember => onSuccess({ ...success, conclusion: { ...success.conclusion, remember } })}
            />
          </div>
        ) : (
          <div className={`${CARD_CLASS} mt-4 px-5 py-5`}>
            {props.renderFailureWidgets(failure.conclusion, conclusion => onFailure({ ...failure, conclusion }))}
            <div className="mt-6">
              <RememberCard
                remember={failure.conclusion.remember}
                prefix="failure.conclusion.remember"
                errors={errors}
                onChange={remember => onFailure({ ...failure, conclusion: { ...failure.conclusion, remember } })}
              />
            </div>
          </div>
        )}
      </fieldset>

      <p className="mt-3 px-1 text-[12px] leading-snug text-dark/55">
        {variant === 'success' ? texts.successNote : texts.failureNote}
      </p>
    </div>
  )
}

// --- Variant switch ---

const VARIANTS: { id: OutcomeVariant; label: string; color: string; icon: typeof CircleCheck }[] = [
  { id: 'success', label: 'Poprawne odpowiedzi', color: TR.green, icon: CircleCheck },
  { id: 'failure', label: 'Błędne odpowiedzi', color: TR.red, icon: CircleX },
]

function VariantSwitch({ value, onChange, errorCount }: {
  value: OutcomeVariant
  onChange: (v: OutcomeVariant) => void
  errorCount: Record<OutcomeVariant, number>
}) {
  return (
    <div role="tablist" className="grid grid-cols-2 gap-1 rounded-[14px] bg-white p-1 shadow-sm">
      {VARIANTS.map(v => {
        const active = v.id === value
        const Icon = v.icon
        return (
          <button
            key={v.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(v.id)}
            className="flex items-center justify-center gap-1.5 rounded-[10px] px-3 py-2 text-[12px] font-semibold transition-colors cursor-pointer"
            style={active ? { backgroundColor: `${v.color}14`, color: v.color } : { color: '#6B7378' }}
          >
            <Icon className="size-4 shrink-0" />
            {v.label}
            {errorCount[v.id] > 0 && (
              <span className="rounded-full bg-[#C03448] px-1.5 text-[10px] font-bold leading-4 text-white">{errorCount[v.id]}</span>
            )}
          </button>
        )
      })}
    </div>
  )
}

// --- One step: pick an answer, edit its explanation ---

function StepAnswers({ step, index, onlyCorrect, errors, readOnly, onChange }: {
  step: ChoiceStep
  index: number
  onlyCorrect: boolean
  errors: ValidationErrors
  readOnly: boolean
  onChange: (step: ChoiceStep) => void
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const visible = onlyCorrect ? step.options.filter(o => o.is_correct) : step.options
  const option = visible.find(o => o.id === selectedId) ?? visible[0]
  const setOption = (opt: ChoiceOption) =>
    onChange({ ...step, options: step.options.map(o => (o.id === opt.id ? opt : o)) })

  const color = option?.is_correct ? TR.green : TR.red
  const Icon = option?.is_correct ? CircleCheck : CircleX

  return (
    <div className={`${CARD_CLASS} px-5 py-5`}>
      <div className="flex items-start gap-3">
        <span
          className="flex size-8 shrink-0 items-center justify-center rounded-full text-[13px] font-bold text-white"
          style={{ backgroundColor: option ? color : '#B5BBBF' }}
        >
          {index + 1}
        </span>
        <div className="min-w-0">
          <div className="text-[14px] font-bold text-dark">
            KROK {index + 1}: {step.title.trim() || <span className="text-dark/35">(brak treści kroku)</span>}
          </div>
          <div className="text-[12px] text-dark/60">{step.subtitle.trim() || '—'}</div>
        </div>
      </div>

      {/* Which picked answer are we explaining? (hidden when only the correct one is shown) */}
      {!onlyCorrect && (
        <div className="mt-4">
          <div className="text-[10px] font-bold uppercase tracking-widest text-dark/50">Wyjaśnienie, gdy użytkownik wybierze:</div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {visible.map(o => {
              const c = o.is_correct ? TR.green : TR.red
              const done = o.explanation.trim().length > 0
              const selected = o === option
              return (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => setSelectedId(o.id)}
                  title={done ? 'Wyjaśnienie uzupełnione' : 'Wyjaśnienie do uzupełnienia'}
                  className="flex max-w-full items-center gap-1.5 rounded-full border-[1.5px] py-1 pl-1 pr-3 text-[12px] text-dark transition-colors cursor-pointer"
                  style={{ borderColor: selected ? c : `${c}55`, backgroundColor: selected ? `${c}12` : 'white' }}
                >
                  <span
                    className="flex size-4 shrink-0 items-center justify-center rounded-full"
                    style={done ? { backgroundColor: TR.green, color: 'white' } : { backgroundColor: '#ECEDEE', color: '#8A9094' }}
                  >
                    {done ? <Check className="size-2.5" strokeWidth={3} /> : <X className="size-2.5" strokeWidth={3} />}
                  </span>
                  <span className="truncate">{o.label.trim() || '(brak treści)'}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {option ? (
        <fieldset disabled={readOnly} className="mt-4 min-w-0">
          <div
            className="flex items-center justify-between gap-2 rounded-[12px] border-[1.5px] px-4 py-3 text-[14px] font-semibold"
            style={{ borderColor: color, color, backgroundColor: `${color}0D` }}
          >
            <span className="min-w-0 break-words">{option.label.trim() || '—'}</span>
            <Icon className="size-5 shrink-0" />
          </div>
          <div className="mt-4 font-manrope text-[17px] font-bold" style={{ color }}>
            {option.is_correct ? 'Prawidłowa odpowiedź!' : 'Dlaczego to zła odpowiedź?'}
          </div>
          <div className="mt-1">
            <InlineText
              key={option.id}
              value={option.explanation}
              onChange={explanation => setOption({ ...option, explanation })}
              maxLength={L.optionExplanation}
              placeholder={option.is_correct ? 'Dlaczego ta odpowiedź jest trafna?' : 'Dlaczego ta odpowiedź jest błędna?'}
              error={errors[`option.${option.id}.explanation`]}
              className="text-[14px] leading-snug text-dark/85"
            />
          </div>
        </fieldset>
      ) : (
        <p className="mt-4 text-[12px] text-dark/50">
          Zaznacz prawidłową odpowiedź w tym kroku (zakładka „Treść ćwiczenia”).
        </p>
      )}
    </div>
  )
}

// --- Conclusion parts ---

function ConclusionHeader({ conclusion: c, prefix, errors, onChange }: {
  conclusion: ShortConclusion
  prefix: string
  errors: ValidationErrors
  onChange: (patch: Partial<ShortConclusion>) => void
}) {
  return (
    <div className="mt-4 px-1">
      <InlineText
        value={c.title}
        onChange={title => onChange({ title })}
        maxLength={L.conclusionTitle}
        placeholder="Nagłówek"
        error={errors[`${prefix}.title`]}
        className="font-manrope text-[22px] font-bold text-dark"
      />
      <div className="mt-1">
        <InlineText
          value={c.body}
          onChange={body => onChange({ body })}
          maxLength={L.conclusionBody}
          placeholder="Podsumuj, jaki wniosek płynie z tej sytuacji"
          error={errors[`${prefix}.body`]}
          className="text-[14px] leading-snug text-dark/80"
        />
      </div>
    </div>
  )
}

/** "Dlaczego to działa?" — a title and 2..5 green-check points (failure conclusion). */
export function ReasonsEditor({ reasons, errors, onChange }: {
  reasons: ReasonsList
  errors: ValidationErrors
  onChange: (reasons: ReasonsList) => void
}) {
  const e = (key: string) => errors[`failure.conclusion.reasons.${key}`]
  return (
    <div>
      <InlineText
        value={reasons.title}
        onChange={title => onChange({ ...reasons, title })}
        maxLength={L.widgetTitle}
        placeholder="Nagłówek"
        error={e('title')}
        className="font-manrope text-[17px] font-bold text-dark"
      />
      <ul className="mt-2 flex flex-col gap-1">
        {reasons.points.map((point, i) => (
          <li key={i} className="group flex items-start gap-2">
            <Check className="mt-1 size-3.5 shrink-0" style={{ color: TR.green }} strokeWidth={3} />
            <div className="min-w-0 flex-1">
              <InlineText
                value={point}
                onChange={v => onChange({ ...reasons, points: replaceAt(reasons.points, i, v) })}
                maxLength={L.reason}
                placeholder={`Podpunkt ${i + 1}`}
                error={e(`points.${i}`)}
                className="text-[13px] leading-snug text-dark"
              />
            </div>
            <RemoveButton
              title="Usuń podpunkt"
              disabled={reasons.points.length <= L.minReasons}
              onClick={() => onChange({ ...reasons, points: removeAt(reasons.points, i) })}
            />
          </li>
        ))}
      </ul>
      {e('points') && <p className="text-[11px] text-[#C03448]">{e('points')}</p>}
      {reasons.points.length < L.maxReasons && (
        <AddLink onClick={() => onChange({ ...reasons, points: [...reasons.points, ''] })}>Dodaj podpunkt</AddLink>
      )}
    </div>
  )
}

/** Optional "Zapamiętaj" widget (both variants). */
function RememberCard({ remember, prefix, errors, onChange }: {
  remember: RememberWidget | null
  prefix: string
  errors: ValidationErrors
  onChange: (r: RememberWidget | null) => void
}) {
  if (!remember) {
    return (
      <button
        type="button"
        onClick={() => onChange({ title: 'Zapamiętaj', lead: '', text: '' })}
        className="flex w-full items-center justify-center gap-2 rounded-[16px] border border-dashed py-3.5 text-[13px] font-semibold transition-colors hover:bg-[#F1EFFC] cursor-pointer disabled:hidden"
        style={{ borderColor: `${TR.remember.color}80`, color: TR.remember.color }}
      >
        <Plus className="size-4" /> Dodaj kartę „Zapamiętaj” (opcjonalnie)
      </button>
    )
  }

  return (
    <div className="group relative overflow-hidden rounded-[16px] p-4" style={{ backgroundColor: TR.remember.bg }}>
      <div className="pointer-events-none absolute -bottom-8 -right-6 size-24 rounded-full bg-white/50" />
      <button
        type="button"
        title="Usuń widżet"
        onClick={() => onChange(null)}
        className="absolute right-2 top-2 z-10 flex size-7 items-center justify-center rounded-full text-[#D15F5F] opacity-0 transition-opacity hover:bg-white group-hover:opacity-100 focus:opacity-100 cursor-pointer disabled:hidden"
      >
        <Trash2 className="size-4" />
      </button>
      <div className="relative flex items-start gap-2.5 pr-4">
        <Sparkles className="mt-1 size-5 shrink-0" style={{ color: TR.remember.color }} />
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <div style={{ color: TR.remember.color }}>
            <InlineText
              value={remember.title}
              onChange={title => onChange({ ...remember, title })}
              maxLength={L.widgetTitle}
              placeholder="Tytuł widżetu"
              error={errors[`${prefix}.title`]}
              className="text-[16px] font-bold"
            />
          </div>
          <div style={{ color: TR.remember.color }}>
            <InlineText
              value={remember.lead}
              onChange={lead => onChange({ ...remember, lead })}
              maxLength={L.rememberLead}
              placeholder="Wyróżnione zdanie (pogrubione)"
              error={errors[`${prefix}.lead`]}
              className="text-[13px] font-bold leading-snug"
            />
          </div>
          <InlineText
            value={remember.text}
            onChange={text => onChange({ ...remember, text })}
            maxLength={L.rememberText}
            placeholder="Rozwinięcie"
            error={errors[`${prefix}.text`]}
            className="text-[13px] leading-snug text-dark/80"
          />
        </div>
      </div>
    </div>
  )
}
