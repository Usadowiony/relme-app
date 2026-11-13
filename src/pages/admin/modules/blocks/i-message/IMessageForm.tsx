import { MessageSquareText, PenLine } from 'lucide-react'
import type { ChoiceStep, ExerciseIMessageConfig, IMessageConclusion } from '../../../../../types/modules'
import { MODULE_LIMITS, composeIMessage } from '../../../../../utils/moduleFlow'
import type { ValidationErrors } from '../../../../../utils/moduleFlow'
import { InlineText } from '../fields'
import type { BlockFormProps } from '../fields'
import { HintCard, StepsCard } from '../steps/StepsEditor'
import { ReasonsEditor, StepInterpretationEditor } from '../steps/InterpretationEditor'
import { StepExerciseTabs } from '../steps/StepExerciseTabs'
import { CARD_CLASS, SCREEN_CLASS, TR } from '../steps/theme'
import { AvatarCircle } from '../messenger/MessengerFrame'
import { CONTACT_BUBBLE } from '../messenger/theme'

// "Kreator Komunikatu JA" (NVC) — mockup "Etap 4 · NVC / Porozumienie bez
// przemocy". Same step mechanics as the thought record, but exactly 4 steps
// (observation, feeling, need, request), a chat context instead of a
// situation, and the message assembled from the picked answers.

const L = MODULE_LIMITS.iMessage

/** Message built from the correct answer of every step (admin preview). */
function correctMessage(steps: ChoiceStep[]): string {
  return composeIMessage(steps.map(s => s.options.find(o => o.is_correct)?.label ?? ''))
}

export function IMessageForm({ config, onChange, errors, readOnly }: BlockFormProps<ExerciseIMessageConfig>) {
  return (
    <StepExerciseTabs
      errors={errors}
      readOnly={readOnly}
      content={
        <div className={SCREEN_CLASS} style={{ backgroundColor: TR.screen }}>
          <ContextCard config={config} errors={errors} onChange={onChange} />
          <div className="mt-3">
            <HintCard hint={config.hint} errors={errors} onChange={hint => onChange({ ...config, hint })} />
          </div>
          <div className="mt-3">
            <StepsCard
              steps={config.steps}
              errors={errors}
              count={{ min: L.steps, max: L.steps }}
              onChange={steps => onChange({ ...config, steps })}
            />
          </div>
          <div className="mt-3">
            <ComposedMessage
              steps={config.steps}
              label="Treść odpowiedzi:"
              hint="Podgląd z prawidłowych odpowiedzi. W aplikacji ta karta składa się na bieżąco z wyborów użytkownika."
            />
          </div>
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
            successIntro: 'Wstęp: co sprawiło, że komunikat użytkownika był dobry',
            failureIntro: 'Wstęp: co w komunikacie użytkownika poszło nie tak',
            successNote:
              'Ten wariant zobaczy użytkownik, który we wszystkich krokach wybrał prawidłowo i chce sprawdzić dlaczego. Wnioski są krótsze — bez gotowej odpowiedzi i „Dlaczego to działa?”. Na dole przycisk „Dalej”.',
            failureNote:
              'Ten wariant zobaczy użytkownik, który pomylił się w co najmniej jednym kroku. Na dole przycisk „Spróbuj ponownie”.',
          }}
          reminder={<ContextReminder config={config} />}
          renderFailureWidgets={(conclusion, set) => (
            <FailureWidgets conclusion={conclusion} steps={config.steps} errors={errors} onChange={set} />
          )}
        />
      }
    />
  )
}

// --- Content: message context + partner's bubble ---

function ContextCard({ config, errors, onChange }: {
  config: ExerciseIMessageConfig
  errors: ValidationErrors
  onChange: (c: ExerciseIMessageConfig) => void
}) {
  const { context } = config
  return (
    <div className={`${CARD_CLASS} px-5 pt-5 pb-6`}>
      <div className="flex items-center gap-2 text-dark/80">
        <PenLine className="size-[18px] shrink-0" style={{ color: TR.teal }} />
        <span className="text-[13px] font-semibold">Stwórz prawidłową odpowiedź</span>
      </div>

      <div className="mt-4">
        <InlineText
          value={context.title}
          onChange={title => onChange({ ...config, context: { ...context, title } })}
          maxLength={L.contextTitle}
          placeholder="Kontekst wiadomości"
          error={errors['context.title']}
          className="font-manrope text-[19px] font-bold text-dark"
        />
        <div className="mt-1">
          <InlineText
            value={context.body}
            onChange={body => onChange({ ...config, context: { ...context, body } })}
            maxLength={L.contextBody}
            placeholder="Rozwinięcie kontekstu, np. Partner w emocjach kieruje do Ciebie pretensję…"
            error={errors['context.body']}
            className="text-[14px] leading-snug text-dark/80"
          />
        </div>
      </div>

      <div className="mt-4 flex items-start gap-2.5">
        <AvatarCircle />
        <div className={`max-w-[78%] ${CONTACT_BUBBLE}`}>
          <InlineText
            value={config.partner_message}
            onChange={partner_message => onChange({ ...config, partner_message })}
            maxLength={L.partnerMessage}
            placeholder="Wiadomość partnera"
            error={errors.partner_message}
          />
        </div>
      </div>
    </div>
  )
}

/** Teal "Treść odpowiedzi" card with the message built from correct answers. */
function ComposedMessage({ steps, label, hint }: { steps: ChoiceStep[]; label: string; hint?: string }) {
  const message = correctMessage(steps)
  return (
    <div>
      <div className="rounded-[14px] px-4 py-3.5 text-white" style={{ backgroundColor: TR.teal }}>
        <div className="text-[14px] font-bold">{label}</div>
        <p className={`mt-1 text-[13px] leading-snug ${message ? '' : 'italic opacity-60'}`}>
          {message || 'Zaznacz prawidłowe odpowiedzi w krokach, a tu złoży się gotowa wypowiedź.'}
        </p>
      </div>
      {hint && <p className="mt-2 px-1 text-[12px] leading-snug text-dark/55">{hint}</p>}
    </div>
  )
}

// --- Interpretation ---

function ContextReminder({ config }: { config: ExerciseIMessageConfig }) {
  return (
    <div title="Treść pochodzi z zakładki „Treść ćwiczenia”">
      <div className="flex items-center gap-2 text-[12px] font-semibold" style={{ color: TR.teal }}>
        <MessageSquareText className="size-4" /> Przypomnijmy kontekst
      </div>
      <div className="mt-3 rounded-[12px] bg-[#F4F5F6] px-4 py-3">
        <p className="text-[13px] italic leading-snug text-dark/60">
          {config.context.body.trim() || 'Kontekst uzupełnisz w zakładce „Treść ćwiczenia”.'}
        </p>
        <div className="mt-3 flex items-start gap-2">
          <AvatarCircle />
          <div className={`max-w-[78%] ${CONTACT_BUBBLE} bg-white`}>{config.partner_message.trim() || '—'}</div>
        </div>
      </div>
    </div>
  )
}

function FailureWidgets({ conclusion: c, steps, errors, onChange }: {
  conclusion: IMessageConclusion
  steps: ChoiceStep[]
  errors: ValidationErrors
  onChange: (c: IMessageConclusion) => void
}) {
  return (
    <>
      <InlineText
        value={c.better_title}
        onChange={better_title => onChange({ ...c, better_title })}
        maxLength={MODULE_LIMITS.steps.widgetTitle}
        placeholder="Nagłówek widżetu"
        error={errors['failure.conclusion.better_title']}
        className="font-manrope text-[16px] font-bold text-dark"
      />
      <div className="mt-3">
        <ComposedMessage steps={steps} label="Treść odpowiedzi:" />
        <p className="mt-2 px-1 text-[11px] text-dark/50">Składa się automatycznie z prawidłowych odpowiedzi w krokach.</p>
      </div>

      <div className="mt-6">
        <ReasonsEditor reasons={c.reasons} errors={errors} onChange={reasons => onChange({ ...c, reasons })} />
      </div>
    </>
  )
}
