import { Check, ChevronRight, ChevronUp, Plus, Sparkles, Trash2 } from 'lucide-react'
import type { ChoiceOption, ChoiceStep, ContrastNoteCard } from '../../../../../types/modules'
import { MODULE_LIMITS, createChoiceOption, createChoiceStep, createContrastNote } from '../../../../../utils/moduleFlow'
import type { ValidationErrors } from '../../../../../utils/moduleFlow'
import { AddLink, InlineText, RemoveButton } from '../fields'
import { CARD_CLASS, TR } from './theme'

// Content-tab building blocks shared by step exercises: the optional
// "Wskazówka" card and the card with numbered steps + answer lists.

const L = MODULE_LIMITS.steps

// --- Optional hint ---

export function HintCard({ hint, errors, onChange }: {
  hint: ContrastNoteCard | null
  errors: ValidationErrors
  onChange: (hint: ContrastNoteCard | null) => void
}) {
  if (!hint) {
    return (
      <button
        type="button"
        onClick={() => onChange({ ...createContrastNote(), title: 'Wskazówka' })}
        className="flex w-full items-center justify-center gap-2 rounded-[16px] border border-dashed py-3.5 text-[13px] font-semibold transition-colors hover:bg-[#EAF4FD] cursor-pointer disabled:hidden"
        style={{ borderColor: `${TR.hint.color}80`, color: TR.hint.color }}
      >
        <Plus className="size-4" /> Dodaj wskazówkę (opcjonalnie)
      </button>
    )
  }

  return (
    <div className="group relative overflow-hidden rounded-[16px] p-4 shadow-sm" style={{ backgroundColor: TR.hint.bg }}>
      <div className="pointer-events-none absolute -bottom-8 -right-6 size-24 rounded-full bg-white/50" />
      <button
        type="button"
        title="Usuń wskazówkę"
        onClick={() => onChange(null)}
        className="absolute right-2 top-2 z-10 flex size-7 items-center justify-center rounded-full text-[#D15F5F] opacity-0 transition-opacity hover:bg-white group-hover:opacity-100 focus:opacity-100 cursor-pointer disabled:hidden"
      >
        <Trash2 className="size-4" />
      </button>
      <div className="relative flex items-start gap-3">
        <Sparkles className="mt-1 size-5 shrink-0" style={{ color: TR.hint.color }} />
        <div className="flex min-w-0 flex-1 flex-col gap-1 pr-4">
          <div style={{ color: TR.hint.color }}>
            <InlineText
              value={hint.title}
              onChange={title => onChange({ ...hint, title })}
              maxLength={L.hintTitle}
              placeholder="Tytuł wskazówki"
              error={errors['hint.title']}
              className="text-[16px] font-bold"
            />
          </div>
          <InlineText
            value={hint.text}
            onChange={text => onChange({ ...hint, text })}
            maxLength={L.hintText}
            placeholder="Treść wskazówki"
            error={errors['hint.text']}
            className="text-[13px] leading-snug text-dark/85"
          />
        </div>
      </div>
    </div>
  )
}

// --- Steps card ---

type StepsCardProps = {
  steps: ChoiceStep[]
  errors: ValidationErrors
  onChange: (steps: ChoiceStep[]) => void
  /** Fixed count = no add/remove (e.g. NVC: always 4 steps). */
  count: { min: number; max: number }
}

export function StepsCard({ steps, errors, onChange, count }: StepsCardProps) {
  const fixed = count.min === count.max
  const setStep = (step: ChoiceStep) => onChange(steps.map(s => (s.id === step.id ? step : s)))

  return (
    <div className={CARD_CLASS}>
      {steps.map((step, i) => (
        <StepEditor
          key={step.id}
          step={step}
          index={i}
          isLast={i === steps.length - 1}
          canRemove={!fixed && steps.length > count.min}
          errors={errors}
          onChange={setStep}
          onRemove={() => onChange(steps.filter(s => s.id !== step.id))}
        />
      ))}

      <div className="flex flex-col gap-2 border-t border-dark/10 px-5 py-4">
        {errors.steps && <p className="text-center text-[11px] text-[#C03448]">{errors.steps}</p>}
        {!fixed && steps.length < count.max && (
          <button
            type="button"
            onClick={() => onChange([...steps, createChoiceStep()])}
            className="flex items-center justify-center gap-2 rounded-[12px] border border-dashed py-3 text-[13px] font-semibold transition-colors hover:bg-[#EEF6F7] cursor-pointer disabled:hidden"
            style={{ borderColor: `${TR.teal}66`, color: TR.teal }}
          >
            <Plus className="size-4" /> Dodaj krok ({steps.length}/{count.max})
          </button>
        )}
        <div className="flex items-center justify-center gap-2 rounded-[12px] bg-[#ECEDEE] py-3 text-[13px] font-semibold text-dark/35">
          Sprawdź odpowiedzi <ChevronRight className="size-4" />
        </div>
      </div>
    </div>
  )
}

function StepEditor({ step, index, isLast, canRemove, errors, onChange, onRemove }: {
  step: ChoiceStep
  index: number
  isLast: boolean
  canRemove: boolean
  errors: ValidationErrors
  onChange: (step: ChoiceStep) => void
  onRemove: () => void
}) {
  const e = (key: string) => errors[`step.${step.id}.${key}`]
  const setOption = (opt: ChoiceOption) =>
    onChange({ ...step, options: step.options.map(o => (o.id === opt.id ? opt : o)) })
  const markCorrect = (id: string) =>
    onChange({ ...step, options: step.options.map(o => ({ ...o, is_correct: o.id === id })) })

  return (
    <div className={`group/step relative flex gap-3 px-5 py-5 ${index > 0 ? 'border-t border-dark/10' : ''}`}>
      {/* Number + dashed timeline */}
      <div className="flex flex-col items-center">
        <span
          title={index === 0 ? undefined : 'W aplikacji odblokowuje się po poprzednim kroku'}
          className="flex size-8 shrink-0 items-center justify-center rounded-full text-[13px] font-bold text-white"
          style={{ backgroundColor: index === 0 ? TR.teal : `${TR.teal}99` }}
        >
          {index + 1}
        </span>
        {!isLast && <span className="mt-1 w-px flex-1 border-l border-dashed" style={{ borderColor: `${TR.teal}66` }} />}
      </div>

      <div className="min-w-0 flex-1">
        <div className={`flex items-start gap-1 ${canRemove ? 'pr-7' : ''}`}>
          <span className="shrink-0 pt-0.5 text-[14px] font-bold text-dark">KROK {index + 1}:</span>
          <div className="min-w-0 flex-1">
            <InlineText
              value={step.title}
              onChange={title => onChange({ ...step, title })}
              maxLength={L.stepTitle}
              placeholder="Wpisz treść kroku"
              error={e('title')}
              className="text-[14px] font-bold text-dark"
            />
          </div>
        </div>
        <InlineText
          value={step.subtitle}
          onChange={subtitle => onChange({ ...step, subtitle })}
          maxLength={L.stepSubtitle}
          placeholder="Krótki podopis kroku"
          error={e('subtitle')}
          className="text-[13px] text-dark/75"
        />

        {/* Answer list (looks like the opened dropdown) */}
        <div className="mt-3 overflow-hidden rounded-[12px] border border-dark/20">
          <div className="flex items-center justify-between border-b border-dark/10 px-3 py-2.5 text-[13px] text-dark/40">
            Wybierz z listy…
            <ChevronUp className="size-4" />
          </div>
          {step.options.map(opt => (
            <OptionRow
              key={opt.id}
              option={opt}
              errors={errors}
              canRemove={step.options.length > L.minOptions}
              onChange={setOption}
              onMarkCorrect={() => markCorrect(opt.id)}
              onRemove={() => onChange({ ...step, options: step.options.filter(o => o.id !== opt.id) })}
            />
          ))}
        </div>
        {e('options') && <p className="mt-1 text-[11px] text-[#C03448]">{e('options')}</p>}
        {step.options.length < L.maxOptions && (
          <AddLink onClick={() => onChange({ ...step, options: [...step.options, createChoiceOption()] })}>
            Dodaj odpowiedź ({step.options.length}/{L.maxOptions})
          </AddLink>
        )}
      </div>

      {canRemove && (
        <button
          type="button"
          title="Usuń krok"
          onClick={onRemove}
          className="absolute right-3 top-4 flex size-7 items-center justify-center rounded-full text-[#D15F5F] opacity-0 transition-opacity hover:bg-red-50 group-hover/step:opacity-100 focus:opacity-100 cursor-pointer disabled:hidden"
        >
          <Trash2 className="size-4" />
        </button>
      )}
    </div>
  )
}

function OptionRow({ option, errors, canRemove, onChange, onMarkCorrect, onRemove }: {
  option: ChoiceOption
  errors: ValidationErrors
  canRemove: boolean
  onChange: (o: ChoiceOption) => void
  onMarkCorrect: () => void
  onRemove: () => void
}) {
  const e = (key: string) => errors[`option.${option.id}.${key}`]

  return (
    <div
      className="group flex items-start gap-2.5 border-b border-dark/10 px-3 py-2.5 last:border-b-0"
      style={option.is_correct ? { backgroundColor: `${TR.green}0F` } : undefined}
    >
      <button
        type="button"
        title={option.is_correct ? 'Prawidłowa odpowiedź' : 'Oznacz jako prawidłową'}
        onClick={onMarkCorrect}
        className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border-[1.5px] transition-colors cursor-pointer"
        style={
          option.is_correct
            ? { backgroundColor: TR.green, borderColor: TR.green, color: 'white' }
            : { borderColor: '#C5CACD', color: 'transparent' }
        }
      >
        <Check className="size-3" strokeWidth={3} />
      </button>
      <div className="min-w-0 flex-1">
        <InlineText
          value={option.label}
          onChange={label => onChange({ ...option, label })}
          maxLength={L.optionLabel}
          placeholder="Wpisz treść odpowiedzi"
          error={e('label')}
          className="text-[13px] font-semibold text-dark"
        />
        <InlineText
          value={option.description}
          onChange={description => onChange({ ...option, description })}
          maxLength={L.optionDescription}
          placeholder="Krótki opis (opcjonalnie)"
          error={e('description')}
          className="text-[12px] text-dark/55"
        />
      </div>
      <RemoveButton title="Usuń odpowiedź" disabled={!canRemove} onClick={onRemove} />
    </div>
  )
}
