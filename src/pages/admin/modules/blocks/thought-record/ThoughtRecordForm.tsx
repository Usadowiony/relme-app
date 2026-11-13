import { CircleHelp, Image, Quote, Shapes } from 'lucide-react'
import type { ExerciseThoughtRecordConfig, ThoughtRecordConclusion } from '../../../../../types/modules'
import { MODULE_LIMITS } from '../../../../../utils/moduleFlow'
import type { ValidationErrors } from '../../../../../utils/moduleFlow'
import { removeAt, replaceAt } from '../../../../../utils/arrays'
import { AddLink, InlineText, RemoveButton } from '../fields'
import type { BlockFormProps } from '../fields'
import { HintCard, StepsCard } from '../steps/StepsEditor'
import { ReasonsEditor, StepInterpretationEditor } from '../steps/InterpretationEditor'
import { StepExerciseTabs } from '../steps/StepExerciseTabs'
import { CARD_CLASS, SCREEN_CLASS, TR } from '../steps/theme'

// "Dziennik Myśli ABC" — mockups "Etap 3 · Dziennik myśli ABC" (content) and
// "To nie była odpowiednia analiza" (interpretation).

const L = MODULE_LIMITS.thoughtRecord

export function ThoughtRecordForm({ config, onChange, errors, readOnly }: BlockFormProps<ExerciseThoughtRecordConfig>) {
  return (
    <StepExerciseTabs
      errors={errors}
      readOnly={readOnly}
      content={
        <div className={SCREEN_CLASS} style={{ backgroundColor: TR.screen }}>
          <SituationCard config={config} errors={errors} onChange={onChange} />
          <div className="mt-3">
            <HintCard hint={config.hint} errors={errors} onChange={hint => onChange({ ...config, hint })} />
          </div>
          <div className="mt-3">
            <StepsCard
              steps={config.steps}
              errors={errors}
              count={{ min: L.minSteps, max: L.maxSteps }}
              onChange={steps => onChange({ ...config, steps })}
            />
          </div>
          <p className="mt-3 px-1 text-[12px] leading-snug text-dark/55">
            W aplikacji kroki odblokowują się po kolei. Odpowiedzi użytkownik wybiera z rozwijanej listy — zaznacz
            jedną prawidłową w każdym kroku.
          </p>
        </div>
      }
      interpretation={
        <StepInterpretationEditor
          steps={config.steps}
          success={config.success}
          failure={config.failure}
          onSteps={steps => onChange({ ...config, steps })}
          onSuccess={success => onChange({ ...config, success })}
          onFailure={failure => onChange({ ...config, failure })}
          errors={errors}
          readOnly={readOnly}
          texts={{
            successIntro: 'Wstęp: co użytkownik zrobił dobrze w swojej analizie',
            failureIntro: 'Wstęp: co poszło nie tak w analizie użytkownika',
            successNote:
              'Ten wariant zobaczy użytkownik, który odpowiedział dobrze we wszystkich krokach i chce sprawdzić dlaczego. Wnioski są krótsze — bez etapów reakcji i „Dlaczego to działa?”. Na dole przycisk „Dalej”.',
            failureNote:
              'Ten wariant zobaczy użytkownik, który pomylił się w co najmniej jednym kroku. Na dole przycisk „Spróbuj ponownie”.',
          }}
          reminder={
            <>
              <div className="flex items-center gap-2 text-[12px] font-semibold" style={{ color: TR.teal }}>
                <Image className="size-4" /> Przypomnijmy obraz sytuacji
              </div>
              <div
                title="Treść pochodzi z zakładki „Treść ćwiczenia”"
                className="mt-3 flex gap-2 rounded-[12px] bg-[#F4F5F6] px-4 py-3 text-[13px] italic leading-snug text-dark/60"
              >
                <Quote className="size-4 shrink-0 opacity-40" />
                <span>{config.situation.trim() || 'Obraz sytuacji uzupełnisz w zakładce „Treść ćwiczenia”.'}</span>
              </div>
            </>
          }
          renderFailureWidgets={(conclusion, set) => <FailureWidgets conclusion={conclusion} errors={errors} onChange={set} />}
        />
      }
    />
  )
}

// --- Content: "Obraz sytuacji" ---

function SituationCard({ config, errors, onChange }: {
  config: ExerciseThoughtRecordConfig
  errors: ValidationErrors
  onChange: (c: ExerciseThoughtRecordConfig) => void
}) {
  return (
    <div className={`${CARD_CLASS} relative overflow-hidden px-5 pt-5 pb-6`}>
      <div className="flex items-start gap-2" style={{ color: TR.teal }}>
        <Shapes className="mt-0.5 size-[18px] shrink-0" />
        <span className="text-[14px] font-semibold leading-snug">Jak powinieneś się zachować w podanej sytuacji?</span>
      </div>

      <div className="mt-4 flex gap-3">
        <div className="min-w-0 flex-1">
          <div className="font-manrope text-[19px] font-bold text-dark">Obraz sytuacji</div>
          <div className="mt-1">
            <InlineText
              value={config.situation}
              onChange={situation => onChange({ ...config, situation })}
              maxLength={L.situation}
              placeholder="Opisz krótko, jak wygląda analizowana sytuacja"
              error={errors.situation}
              className="text-[14px] leading-snug text-dark/85"
            />
          </div>
        </div>
        <div
          title="Ilustracje będą dostępne razem z biblioteką mediów"
          className="flex h-[110px] w-[100px] shrink-0 flex-col items-center justify-center gap-1 rounded-[14px] border border-dashed border-dark/20 bg-[#F7F9FA] text-[10px] font-semibold uppercase tracking-wider text-dark/40"
        >
          <Image className="size-5" />
          Ilustracja
          <span className="font-normal normal-case tracking-normal">wkrótce</span>
        </div>
      </div>
    </div>
  )
}

// --- Interpretation: failure-only widgets ("Jak powinna wyglądać reakcja?" + reasons) ---

function FailureWidgets({ conclusion: c, errors, onChange }: {
  conclusion: ThoughtRecordConclusion
  errors: ValidationErrors
  onChange: (c: ThoughtRecordConclusion) => void
}) {
  const e = (key: string) => errors[`failure.conclusion.${key}`]
  const { reaction } = c
  const setReaction = (patch: Partial<typeof reaction>) => onChange({ ...c, reaction: { ...reaction, ...patch } })

  return (
    <>
      <div className="flex items-start gap-2.5">
        <CircleHelp className="mt-0.5 size-5 shrink-0" style={{ color: TR.remember.color }} />
        <div className="min-w-0 flex-1">
          <InlineText
            value={reaction.title}
            onChange={title => setReaction({ title })}
            maxLength={MODULE_LIMITS.steps.widgetTitle}
            placeholder="Nagłówek widżetu"
            error={e('reaction.title')}
            className="font-manrope text-[16px] font-bold text-dark"
          />
        </div>
      </div>

      <ol className="mt-4 flex flex-col">
        {reaction.steps.map((s, i) => (
          <li key={i} className="group flex gap-3">
            <div className="flex flex-col items-center">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#ECEDEE] text-[11px] font-bold text-dark/70">
                {i + 1}
              </span>
              {i < reaction.steps.length - 1 && <span className="w-px flex-1 bg-dark/15" />}
            </div>
            <div className="min-w-0 flex-1 pb-3">
              <InlineText
                value={s.title}
                onChange={title => setReaction({ steps: replaceAt(reaction.steps, i, { ...s, title }) })}
                maxLength={L.reactionStepTitle}
                placeholder="Etap, np. Fakt"
                error={e(`reaction.steps.${i}.title`)}
                className="text-[13px] font-bold text-dark"
              />
              <InlineText
                value={s.text}
                onChange={text => setReaction({ steps: replaceAt(reaction.steps, i, { ...s, text }) })}
                maxLength={L.reactionStepText}
                placeholder="Opis etapu, np. Wiadomość została odczytana."
                error={e(`reaction.steps.${i}.text`)}
                className="text-[12px] leading-snug text-dark/65"
              />
            </div>
            <RemoveButton
              title="Usuń etap"
              disabled={reaction.steps.length <= L.minReactionSteps}
              onClick={() => setReaction({ steps: removeAt(reaction.steps, i) })}
            />
          </li>
        ))}
      </ol>
      {e('reaction.steps') && <p className="text-[11px] text-[#C03448]">{e('reaction.steps')}</p>}
      {reaction.steps.length < L.maxReactionSteps && (
        <AddLink onClick={() => setReaction({ steps: [...reaction.steps, { title: '', text: '' }] })}>Dodaj etap</AddLink>
      )}

      <div className="mt-6">
        <ReasonsEditor reasons={c.reasons} errors={errors} onChange={reasons => onChange({ ...c, reasons })} />
      </div>
    </>
  )
}
