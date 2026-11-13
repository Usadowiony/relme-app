import { useState } from 'react'
import { Check, Flag, Image, MessageCircleMore, PenLine, Plus, Sparkles, Trash2 } from 'lucide-react'
import type { ExercisePatternDetectorConfig, PatternFlag } from '../../../../../types/modules'
import { MODULE_LIMITS, PATTERN_INTERPRETATION_KEY, createContrastNote } from '../../../../../utils/moduleFlow'
import type { ValidationErrors } from '../../../../../utils/moduleFlow'
import { flagText } from '../../../../../utils/patternFlags'
import { BlockTabs, InlineText } from '../fields'
import type { BlockFormProps } from '../fields'
import { CARD_CLASS, SCREEN_CLASS } from '../steps/theme'
import { FlagMarker, HighlightedText } from './FlagMarker'
import type { MarkerMode } from './FlagMarker'
import { FLAG_STYLE, PD } from './theme'

// "Detektor Wzorców" — mockups "Etap 4 · Detektor wzorców": the exercise
// (content tab) and "Analiza wykrytych sygnałów" (interpretation tab). The
// user's hit counters ("Twoje trafienia") are app-only and not edited here.

const L = MODULE_LIMITS.patternDetector

type Tab = 'content' | 'interpretation'

export function PatternDetectorForm({ config, onChange, errors, readOnly }: BlockFormProps<ExercisePatternDetectorConfig>) {
  const [tab, setTab] = useState<Tab>('content')
  const errorKeys = Object.keys(errors)
  const interpretationErrors = errorKeys.filter(k => PATTERN_INTERPRETATION_KEY.test(k)).length

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
      <fieldset disabled={readOnly} className="min-w-0">
        <div className={SCREEN_CLASS} style={{ backgroundColor: PD.screen }}>
          {tab === 'content' ? (
            <ContentTab config={config} onChange={onChange} errors={errors} readOnly={readOnly} />
          ) : (
            <InterpretationTab config={config} onChange={onChange} errors={errors} />
          )}
        </div>
      </fieldset>
    </div>
  )
}

// ============================================================
// Content tab
// ============================================================

function ContentTab({ config, onChange, errors, readOnly }: BlockFormProps<ExercisePatternDetectorConfig>) {
  const [mode, setMode] = useState<MarkerMode>(config.text.trim() ? 'red' : 'edit')
  const red = config.flags.filter(f => f.kind === 'red').length
  const green = config.flags.filter(f => f.kind === 'green').length

  return (
    <>
      {/* Header card */}
      <div className={`${CARD_CLASS} px-5 pt-5 pb-6`}>
        <div className="flex items-center gap-2 text-dark/80">
          <Flag className="size-[18px] shrink-0" style={{ color: PD.teal }} />
          <span className="text-[13px] font-semibold">Wychwyć green oraz red flagi w wypowiedzi</span>
        </div>
        <div className="mt-4 flex gap-3">
          <div className="min-w-0 flex-1">
            <InlineText
              value={config.title}
              onChange={title => onChange({ ...config, title })}
              maxLength={L.title}
              placeholder="Nagłówek, np. Detektyw wzorców"
              error={errors.title}
              className="font-manrope text-[19px] font-bold text-dark"
            />
            <div className="mt-1">
              <InlineText
                value={config.subtitle}
                onChange={subtitle => onChange({ ...config, subtitle })}
                maxLength={L.subtitle}
                placeholder="Podtytuł z poleceniem"
                error={errors.subtitle}
                className="text-[14px] leading-snug text-dark/80"
              />
            </div>
          </div>
          <div
            title="Stała grafika — taka sama we wszystkich ćwiczeniach tego typu"
            className="flex h-[96px] w-[84px] shrink-0 flex-col items-center justify-center gap-1 rounded-[14px] bg-[#F7F9FA] text-[10px] font-semibold uppercase tracking-wider text-dark/35"
          >
            <Image className="size-5" />
            Grafika
            <span className="font-normal normal-case tracking-normal">stała</span>
          </div>
        </div>
      </div>

      {/* Message with flags */}
      <div className={`${CARD_CLASS} mt-3 px-5 py-5`}>
        {!readOnly && <ModeSwitch mode={mode} onChange={setMode} />}

        <div className="mt-4">
          <FlagMarker
            text={config.text}
            flags={config.flags}
            mode={mode}
            readOnly={readOnly}
            error={errors.text}
            onChange={(text, flags) => onChange({ ...config, text, flags })}
          />
        </div>

        {errors.flags && <p className="mt-2 text-[11px] text-[#C03448]">{errors.flags}</p>}

        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-dark/10 pt-3 text-[12px]">
          <CountChip kind="red" count={red} />
          <CountChip kind="green" count={green} />
          <span className="text-dark/45">
            {config.flags.length}/{L.maxFlags} fragmentów
          </span>
        </div>
      </div>

      <p className="mt-3 px-1 text-[12px] leading-snug text-dark/55">
        {mode === 'edit'
          ? 'Zaznaczone fragmenty przesuwają się razem z poprawianym tekstem.'
          : 'Kliknij słowo albo przeciągnij kursorem po kilku słowach, aby je zaznaczyć. Kliknięcie zaznaczonego fragmentu w tym samym kolorze usuwa flagę, w drugim — zmienia jej rodzaj. Niezaznaczony tekst będzie w aplikacji fragmentem „pułapką”.'}
      </p>
    </>
  )
}

const MODES: { id: MarkerMode; label: string; color: string; icon: typeof Flag }[] = [
  { id: 'edit', label: 'Edytuj treść', color: PD.teal, icon: PenLine },
  { id: 'red', label: 'Zaznacz red flag', color: FLAG_STYLE.red.color, icon: Flag },
  { id: 'green', label: 'Zaznacz green flag', color: FLAG_STYLE.green.color, icon: Flag },
]

function ModeSwitch({ mode, onChange }: { mode: MarkerMode; onChange: (m: MarkerMode) => void }) {
  return (
    <div role="tablist" className="grid grid-cols-3 gap-1 rounded-[12px] bg-[#F1F2F2] p-1">
      {MODES.map(m => {
        const active = m.id === mode
        const Icon = m.icon
        return (
          <button
            key={m.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(m.id)}
            className="flex items-center justify-center gap-1.5 rounded-[9px] px-2 py-2 text-[12px] font-semibold transition-colors cursor-pointer"
            style={active ? { backgroundColor: 'white', color: m.color, boxShadow: '0 1px 2px rgba(0,0,0,0.08)' } : { color: '#6B7378' }}
          >
            <Icon className="size-3.5 shrink-0" />
            {m.label}
          </button>
        )
      })}
    </div>
  )
}

function CountChip({ kind, count }: { kind: 'red' | 'green'; count: number }) {
  const s = FLAG_STYLE[kind]
  return (
    <span className="flex items-center gap-1.5 rounded-full px-2.5 py-1 font-semibold" style={{ backgroundColor: s.bg, color: s.color }}>
      <Flag className="size-3" /> {s.label}: {count}
    </span>
  )
}

// ============================================================
// Interpretation tab
// ============================================================

function InterpretationTab({ config, onChange, errors }: Omit<BlockFormProps<ExercisePatternDetectorConfig>, 'readOnly'>) {
  const setFlag = (flag: PatternFlag) => onChange({ ...config, flags: config.flags.map(f => (f.id === flag.id ? flag : f)) })
  const { remember } = config

  return (
    <>
      <div className="px-1">
        <div style={{ color: PD.teal }}>
          <InlineText
            value={config.result.title}
            onChange={title => onChange({ ...config, result: { ...config.result, title } })}
            maxLength={L.resultTitle}
            placeholder="Analiza wykrytych sygnałów"
            error={errors['result.title']}
            className="font-manrope text-[24px] font-bold leading-[1.2]"
          />
        </div>
        <div className="mt-1.5">
          <InlineText
            value={config.result.body}
            onChange={body => onChange({ ...config, result: { ...config.result, body } })}
            maxLength={L.resultBody}
            placeholder="Zobacz, dlaczego wskazane fragmenty wypowiedzi stanowią sygnały ostrzegawcze i jak poprawnie je interpretować."
            error={errors['result.body']}
            className="text-[14px] leading-snug text-dark/80"
          />
        </div>
      </div>

      <div className={`${CARD_CLASS} mt-4 px-5 py-5`}>
        <div className="flex items-center gap-2 text-[12px] font-semibold text-dark/80">
          <MessageCircleMore className="size-4" style={{ color: PD.teal }} /> Przypomnijmy analizowaną wypowiedź
        </div>
        <div className="mt-3" title="Treść i zaznaczenia pochodzą z zakładki „Treść ćwiczenia”">
          <HighlightedText text={config.text} flags={config.flags} />
        </div>

        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-dark/15" />
          <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-dark/45">Wyjaśnienie</span>
          <div className="h-px flex-1 bg-dark/15" />
        </div>

        {config.flags.length === 0 ? (
          <p className="text-[13px] text-dark/50">Najpierw zaznacz red i green flagi w zakładce „Treść ćwiczenia”.</p>
        ) : (
          <div className="flex flex-col divide-y divide-dark/10">
            {config.flags.map((flag, i) => (
              <FlagExplanation key={flag.id} flag={flag} index={i} quote={flagText(config.text, flag)} errors={errors} onChange={setFlag} />
            ))}
          </div>
        )}
      </div>

      {/* Conclusion */}
      <div className="mt-4 rounded-[16px] border px-5 py-5" style={{ backgroundColor: PD.conclusion.bg, borderColor: PD.conclusion.border }}>
        <div className="flex items-start gap-2.5">
          <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-[#DDF0E3]">
            <Check className="size-3.5" style={{ color: PD.conclusion.color }} strokeWidth={3} />
          </span>
          <div className="min-w-0 flex-1">
            <InlineText
              value={config.conclusion.title}
              onChange={title => onChange({ ...config, conclusion: { ...config.conclusion, title } })}
              maxLength={L.conclusionTitle}
              placeholder="Czas na wnioski"
              error={errors['conclusion.title']}
              className="font-manrope text-[18px] font-bold text-dark"
            />
          </div>
        </div>
        <div className="mt-2 pl-8">
          <InlineText
            value={config.conclusion.body}
            onChange={body => onChange({ ...config, conclusion: { ...config.conclusion, body } })}
            maxLength={L.conclusionBody}
            placeholder="Podsumuj, dlaczego warto zauważać te mechanizmy"
            error={errors['conclusion.body']}
            className="text-[13px] leading-snug text-dark/80"
          />
        </div>
      </div>

      {/* Optional "Zapamiętaj" */}
      <div className="mt-3">
        {remember ? (
          <div className="group relative overflow-hidden rounded-[16px] p-4 shadow-sm" style={{ backgroundColor: PD.remember.bg }}>
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
              <Sparkles className="mt-1 size-5 shrink-0" style={{ color: PD.remember.color }} />
              <div className="flex min-w-0 flex-1 flex-col gap-1 pr-4">
                <div style={{ color: PD.remember.color }}>
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
            style={{ borderColor: `${PD.remember.color}80`, color: PD.remember.color }}
          >
            <Plus className="size-4" /> Dodaj kartę „Zapamiętaj” (opcjonalnie)
          </button>
        )}
      </div>

      <p className="mt-3 px-1 text-[12px] leading-snug text-dark/55">
        Ten ekran zobaczy użytkownik dopiero po poprawnym wskazaniu wszystkich flag (przycisk „Sprawdź wyjaśnienie”), dlatego
        nie ma tu wariantów dobrej i złej odpowiedzi. Na dole przycisk „Przejdź dalej”.
      </p>
    </>
  )
}

function FlagExplanation({ flag, index, quote, errors, onChange }: {
  flag: PatternFlag
  index: number
  quote: string
  errors: ValidationErrors
  onChange: (flag: PatternFlag) => void
}) {
  const s = FLAG_STYLE[flag.kind]
  return (
    <div className="py-5 first:pt-0 last:pb-0">
      <div className="flex items-start gap-3">
        <span
          className="flex size-8 shrink-0 items-center justify-center rounded-full text-[13px] font-bold text-white"
          style={{ backgroundColor: s.color }}
        >
          {index + 1}
        </span>
        <div className="min-w-0 flex-1">
          <div style={{ color: s.color }}>
            <InlineText
              value={flag.title}
              onChange={title => onChange({ ...flag, title })}
              maxLength={L.flagTitle}
              placeholder={flag.kind === 'red' ? 'Nazwa sygnału, np. Obwinianie byłych partnerów' : 'Nazwa sygnału, np. Realistyczne budowanie relacji'}
              error={errors[`flag.${flag.id}.title`]}
              className="text-[15px] font-bold"
            />
          </div>
          <p className="mt-0.5 text-[13px] leading-snug text-dark/85">„{quote}”</p>
        </div>
      </div>

      <div className="mt-3 rounded-[14px] border px-4 py-3.5" style={{ borderColor: s.color, backgroundColor: s.boxBg }}>
        <div className="font-manrope text-[15px] font-bold" style={{ color: s.color }}>{s.heading}</div>
        <div className="mt-1">
          <InlineText
            value={flag.explanation}
            onChange={explanation => onChange({ ...flag, explanation })}
            maxLength={L.explanation}
            placeholder="Wyjaśnij, co w tym fragmencie świadczy o takim sygnale"
            error={errors[`flag.${flag.id}.explanation`]}
            className="text-[13px] leading-snug text-dark/85"
          />
        </div>
      </div>
    </div>
  )
}
