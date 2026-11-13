import { useState } from 'react'
import { Check, CircleCheck, CircleX, ClipboardList, Image, Plus, Sparkles, Trash2, X } from 'lucide-react'
import type { ExerciseQuizConfig, QuizOption } from '../../../../../types/modules'
import { MODULE_LIMITS, QUIZ_INTERPRETATION_KEY, createContrastNote, createId, quizSelectionHint } from '../../../../../utils/moduleFlow'
import { BlockTabs, InlineText } from '../fields'
import type { BlockFormProps } from '../fields'
import { POLL_THEME as T } from '../poll/theme'

// "Quiz" — mockup "Etap 4 · Quiz" (same look as the community poll, plus an
// optional illustration and correct answers). No interpretation mockup: it
// follows the other exercises — verdict, the picked answer, its explanation,
// optional "Zapamiętaj".

const L = MODULE_LIMITS.quiz
const GREEN = '#3E8E6B'
const RED = '#E0565B'
const NOTE = { color: '#3B8FD9', bg: '#EAF4FD' }

type Tab = 'content' | 'interpretation'

export function QuizForm({ config, onChange, errors, readOnly }: BlockFormProps<ExerciseQuizConfig>) {
  const [tab, setTab] = useState<Tab>('content')
  const errorKeys = Object.keys(errors)
  const interpretationErrors = errorKeys.filter(k => QUIZ_INTERPRETATION_KEY.test(k)).length

  return (
    <div className="flex flex-col gap-5 min-w-0">
      <BlockTabs
        active={tab}
        onChange={setTab}
        tabs={[
          { id: 'content', label: 'Treść ćwiczenia', errorCount: errorKeys.length - interpretationErrors },
          { id: 'interpretation', label: 'Interpretacja odpowiedzi', errorCount: interpretationErrors },
        ]}
      />
      <div className="w-full rounded-[18px] border border-dark/25 p-3 sm:p-4" style={{ backgroundColor: T.screen }}>
        {tab === 'content' ? (
          <fieldset disabled={readOnly} className="min-w-0">
            <ContentTab config={config} onChange={onChange} errors={errors} />
          </fieldset>
        ) : (
          <InterpretationTab config={config} onChange={onChange} errors={errors} readOnly={readOnly} />
        )}
      </div>
    </div>
  )
}

// ============================================================
// Content tab
// ============================================================

function ContentTab({ config, onChange, errors }: Omit<BlockFormProps<ExerciseQuizConfig>, 'readOnly'>) {
  const [focusId, setFocusId] = useState<string | null>(null)
  const correctCount = config.options.filter(o => o.is_correct).length
  const hint = quizSelectionHint(correctCount)

  const setOption = (opt: QuizOption) => onChange({ ...config, options: config.options.map(o => (o.id === opt.id ? opt : o)) })
  const addOption = () => {
    const id = createId()
    setFocusId(id)
    onChange({ ...config, options: [...config.options, { id, text: '', is_correct: false, explanation: '' }] })
  }

  return (
    <div className="rounded-[16px] border border-gray/40 bg-white px-5 pt-5 pb-6 shadow-sm sm:px-6">
      <div className="flex items-start gap-2 text-dark/80">
        <ClipboardList className="mt-0.5 size-[18px] shrink-0" style={{ color: T.accent }} />
        <div className="min-w-0 flex-1">
          <InlineText
            value={config.instruction}
            onChange={instruction => onChange({ ...config, instruction })}
            maxLength={L.instruction}
            placeholder="Zaznacz prawidłową odpowiedź."
            error={errors.instruction}
            className="text-[12px] font-semibold"
          />
        </div>
      </div>

      <div className="mt-4">
        <InlineText
          value={config.question}
          onChange={question => onChange({ ...config, question })}
          maxLength={L.question}
          placeholder="Wpisz treść pytania"
          error={errors.question}
          className="font-manrope text-[22px] font-bold leading-[1.25] text-dark"
        />
      </div>
      {hint && (
        <p className="mt-2 text-[13px]" style={{ color: T.accent }} title="Generowane automatycznie z liczby prawidłowych odpowiedzi">
          {hint}
        </p>
      )}

      {/* Optional illustration */}
      <div className="mt-5">
        {config.image ? (
          <div className="group relative flex h-[150px] flex-col items-center justify-center gap-1 rounded-[14px] border border-dashed border-dark/20 bg-[#F7F9FA] text-[11px] font-semibold uppercase tracking-wider text-dark/40">
            <Image className="size-6" />
            Grafika
            <span className="font-normal normal-case tracking-normal">wybór z biblioteki mediów — wkrótce</span>
            <button
              type="button"
              title="Usuń grafikę"
              onClick={() => onChange({ ...config, image: null })}
              className="absolute right-2 top-2 flex size-7 items-center justify-center rounded-full text-[#D15F5F] opacity-0 transition-opacity hover:bg-white group-hover:opacity-100 focus:opacity-100 cursor-pointer disabled:hidden"
            >
              <Trash2 className="size-4" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => onChange({ ...config, image: { media_id: null } })}
            className="flex w-full items-center justify-center gap-2 rounded-[12px] border border-dashed border-dark/20 py-3 text-[12px] font-semibold text-dark/50 transition-colors hover:bg-[#F7F9FA] hover:text-dark/70 cursor-pointer disabled:hidden"
          >
            <Image className="size-4" /> Dodaj grafikę (opcjonalnie)
          </button>
        )}
      </div>

      {/* Answers */}
      <div className="mt-5 flex flex-col gap-3">
        {config.options.map(option => (
          <div
            key={option.id}
            className="group relative flex items-start gap-3 rounded-[12px] px-4 py-3.5 transition-colors"
            style={
              option.is_correct
                ? { backgroundColor: '#E8F4EC', boxShadow: `0 2px 0 ${GREEN}55, inset 0 0 0 1.5px ${GREEN}` }
                : { backgroundColor: T.option, boxShadow: `0 2px 0 ${T.optionShadow}` }
            }
          >
            <button
              type="button"
              title={option.is_correct ? 'Prawidłowa odpowiedź (kliknij, aby odznaczyć)' : 'Oznacz jako prawidłową'}
              onClick={() => setOption({ ...option, is_correct: !option.is_correct })}
              className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border-[1.5px] transition-colors cursor-pointer"
              style={
                option.is_correct
                  ? { backgroundColor: GREEN, borderColor: GREEN, color: 'white' }
                  : { borderColor: '#B9BEC1', backgroundColor: 'white', color: 'transparent' }
              }
            >
              <Check className="size-3" strokeWidth={3} />
            </button>
            <div className="min-w-0 flex-1 pr-6">
              <InlineText
                value={option.text}
                onChange={text => setOption({ ...option, text })}
                maxLength={L.option}
                placeholder="Wpisz treść odpowiedzi"
                error={errors[`option.${option.id}.text`]}
                autoFocus={option.id === focusId}
                className="text-[15px] font-semibold text-dark"
              />
            </div>
            <button
              type="button"
              title="Usuń odpowiedź"
              onClick={() => onChange({ ...config, options: config.options.filter(o => o.id !== option.id) })}
              className="absolute right-2 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-full text-dark/50 opacity-0 transition-opacity hover:bg-white hover:text-[#D15F5F] group-hover:opacity-100 focus:opacity-100 cursor-pointer disabled:hidden"
            >
              <X className="size-4" />
            </button>
          </div>
        ))}

        {config.options.length < L.maxOptions && (
          <button
            type="button"
            onClick={addOption}
            className="flex items-center justify-center gap-2 rounded-[12px] border border-dashed py-3.5 text-[13px] font-semibold transition-colors hover:bg-[#EEF5F6] cursor-pointer disabled:hidden"
            style={{ borderColor: `${T.accent}66`, color: T.accent }}
          >
            <Plus className="size-4" /> Dodaj odpowiedź
          </button>
        )}

        <p className={`text-center text-[11px] ${errors.options ? 'text-[#C03448]' : 'text-dark/45'}`}>
          {errors.options ??
            `${config.options.length}/${L.maxOptions} odpowiedzi · prawidłowych: ${correctCount} · kółkiem zaznaczasz prawidłowe`}
        </p>
      </div>
    </div>
  )
}

// ============================================================
// Interpretation tab
// ============================================================

function InterpretationTab({ config, onChange, errors, readOnly }: BlockFormProps<ExerciseQuizConfig>) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const option = config.options.find(o => o.id === selectedId) ?? config.options[0]
  const { remember } = config

  const setOption = (opt: QuizOption) => onChange({ ...config, options: config.options.map(o => (o.id === opt.id ? opt : o)) })

  if (config.options.length === 0) {
    return <p className="px-2 py-6 text-center text-[13px] text-dark/50">Najpierw dodaj odpowiedzi w zakładce „Treść ćwiczenia”.</p>
  }

  const color = option.is_correct ? GREEN : RED
  const Icon = option.is_correct ? CircleCheck : CircleX

  return (
    <>
      <div className="px-1">
        <div className="text-[10px] font-bold uppercase tracking-widest text-dark/50">Wyjaśnienie, gdy użytkownik wybierze:</div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {config.options.map(o => {
            const c = o.is_correct ? GREEN : RED
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
                  style={done ? { backgroundColor: GREEN, color: 'white' } : { backgroundColor: '#ECEDEE', color: '#8A9094' }}
                >
                  {done ? <Check className="size-2.5" strokeWidth={3} /> : <X className="size-2.5" strokeWidth={3} />}
                </span>
                <span className="truncate">{o.text.trim() || '(brak treści)'}</span>
              </button>
            )
          })}
        </div>
      </div>

      <fieldset disabled={readOnly} className="mt-4 min-w-0">
        <div className="rounded-[16px] border border-gray/40 bg-white px-5 py-5 shadow-sm sm:px-6">
          <div className="font-manrope text-[20px] font-bold leading-snug" style={{ color }}>
            {option.is_correct ? 'Dlaczego Twoja odpowiedź była poprawna?' : 'Dlaczego Twoja odpowiedź była niepoprawna?'}
          </div>
          <p className="mt-1 text-[12px] text-dark/50">{config.question.trim() || '(brak treści pytania)'}</p>

          <div
            className="mt-4 flex items-center justify-between gap-2 rounded-[12px] border-[1.5px] px-4 py-3.5 text-[15px] font-semibold"
            style={{ borderColor: color, color, backgroundColor: `${color}0D` }}
          >
            <span className="min-w-0 break-words">{option.text.trim() || '—'}</span>
            <Icon className="size-5 shrink-0" />
          </div>

          <div className="mt-4">
            <InlineText
              key={option.id}
              value={option.explanation}
              onChange={explanation => setOption({ ...option, explanation })}
              maxLength={L.explanation}
              placeholder={option.is_correct ? 'Wyjaśnij, dlaczego ta odpowiedź jest prawidłowa' : 'Wyjaśnij, dlaczego ta odpowiedź jest błędna'}
              error={errors[`option.${option.id}.explanation`]}
              className="text-[14px] leading-snug text-dark/85"
            />
          </div>
        </div>
      </fieldset>

      {/* Optional "Zapamiętaj" (one per quiz, shown under every explanation) */}
      <fieldset disabled={readOnly} className="mt-3 min-w-0">
        {remember ? (
          <div className="group relative overflow-hidden rounded-[16px] p-4 shadow-sm" style={{ backgroundColor: NOTE.bg }}>
            <div className="pointer-events-none absolute -bottom-8 -right-6 size-24 rounded-full bg-white/50" />
            <button
              type="button"
              title="Usuń kartę"
              onClick={() => onChange({ ...config, remember: null })}
              className="absolute right-2 top-2 z-10 flex size-7 items-center justify-center rounded-full text-[#D15F5F] opacity-0 transition-opacity hover:bg-white group-hover:opacity-100 focus:opacity-100 cursor-pointer disabled:hidden"
            >
              <Trash2 className="size-4" />
            </button>
            <div className="relative flex items-start gap-3">
              <Sparkles className="mt-1 size-5 shrink-0" style={{ color: NOTE.color }} />
              <div className="flex min-w-0 flex-1 flex-col gap-1 pr-4">
                <div style={{ color: NOTE.color }}>
                  <InlineText
                    value={remember.title}
                    onChange={title => onChange({ ...config, remember: { ...remember, title } })}
                    maxLength={L.rememberTitle}
                    placeholder="Tytuł karty"
                    error={errors['remember.title']}
                    className="text-[16px] font-bold"
                  />
                </div>
                <InlineText
                  value={remember.text}
                  onChange={text => onChange({ ...config, remember: { ...remember, text } })}
                  maxLength={L.rememberText}
                  placeholder="Treść, którą użytkownik ma zapamiętać"
                  error={errors['remember.text']}
                  className="text-[13px] leading-snug text-dark/85"
                />
              </div>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => onChange({ ...config, remember: createContrastNote() })}
            className="flex w-full items-center justify-center gap-2 rounded-[16px] border border-dashed py-3.5 text-[13px] font-semibold transition-colors hover:bg-[#EAF4FD] cursor-pointer disabled:hidden"
            style={{ borderColor: `${NOTE.color}80`, color: NOTE.color }}
          >
            <Plus className="size-4" /> Dodaj kartę „Zapamiętaj” (opcjonalnie)
          </button>
        )}
      </fieldset>

      <p className="mt-3 px-1 text-[12px] leading-snug text-dark/55">
        Każda odpowiedź ma własne wyjaśnienie. Gdy użytkownik zaznaczy kilka odpowiedzi, zobaczy wyjaśnienie każdej z nich, a pod
        nimi kartę „Zapamiętaj”. Odpowiedź jest poprawna tylko wtedy, gdy zaznaczy dokładnie wszystkie prawidłowe.
      </p>
    </>
  )
}
