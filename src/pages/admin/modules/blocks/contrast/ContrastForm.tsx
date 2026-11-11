import { Image, Lightbulb, Plus, Sparkles, Trash2, X } from 'lucide-react'
import type { ContrastListCard, KnowledgeBehavioralContrastConfig } from '../../../../../types/modules'
import { MODULE_LIMITS, createContrastNote } from '../../../../../utils/moduleFlow'
import type { ValidationErrors } from '../../../../../utils/moduleFlow'
import { removeAt, replaceAt } from '../../../../../utils/arrays'
import { InlineText } from '../fields'
import type { BlockFormProps } from '../fields'
import { CONTRAST_KICKER_COLOR as KICKER_COLOR, CONTRAST_NOTE as NOTE, CONTRAST_TONES as TONES } from './theme'
import type { ContrastTone } from './theme'

// Editor that mirrors the mobile screen of this block (mockup: "Lepiej
// wysłuchać partnera niż go dręczyć") with every text replaced by an input.

const L = MODULE_LIMITS.contrast

export function ContrastForm({ config, onChange, errors, readOnly }: BlockFormProps<KnowledgeBehavioralContrastConfig>) {
  const remember = config.remember

  return (
    <fieldset disabled={readOnly} className="min-w-0">
    <div className="relative w-full overflow-hidden rounded-[18px] border border-dark/25 bg-[#FAFAFA] px-5 pt-7 pb-7 sm:px-7 sm:pt-8 sm:pb-8">
      {/* Illustration slot (media blocks come later) */}
      <div
        title="Ilustracje będą dostępne razem z biblioteką mediów"
        className="pointer-events-none absolute -right-8 top-4 flex h-[150px] w-[180px] items-center justify-center rounded-[48%_52%_45%_55%] bg-[#DCE9F2] text-[#6F8FA8]"
      >
        <div className="flex flex-col items-center gap-1 pr-6 text-[10px] font-semibold uppercase tracking-wider">
          <Image className="size-5" />
          Ilustracja
          <span className="font-normal normal-case tracking-normal opacity-70">wkrótce</span>
        </div>
      </div>

      <div className="relative pr-[110px]">
        <div className="flex items-start gap-1.5" style={{ color: KICKER_COLOR }}>
          <Lightbulb className="mt-[5px] size-3.5 shrink-0" />
          <InlineText
            value={config.kicker}
            onChange={kicker => onChange({ ...config, kicker })}
            maxLength={L.kicker}
            placeholder="Nadtytuł"
            error={errors.kicker}
            className="text-[13px] font-medium"
          />
        </div>

        <div className="mt-2">
          <InlineText
            value={config.headline}
            onChange={headline => onChange({ ...config, headline })}
            maxLength={L.headline}
            placeholder="Nagłówek ekranu"
            error={errors.headline}
            className="font-manrope text-[24px] font-bold leading-[1.25] text-dark"
          />
        </div>
      </div>

      <div className="relative mt-8 flex flex-col gap-4">
        <ListCard
          tone="avoid"
          card={config.avoid}
          errors={errors}
          onChange={avoid => onChange({ ...config, avoid })}
        />
        <ListCard
          tone="focus"
          card={config.focus}
          errors={errors}
          onChange={focus => onChange({ ...config, focus })}
        />

        {remember ? (
          <div className="group relative overflow-hidden rounded-[16px] p-5 shadow-sm" style={{ backgroundColor: NOTE.bg }}>
            <div className="pointer-events-none absolute -left-6 -top-6 size-20 rounded-full bg-white/40" />
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
                    maxLength={L.cardTitle}
                    placeholder="Tytuł karty"
                    error={errors['remember.title']}
                    className="text-[17px] font-bold"
                  />
                </div>
                <InlineText
                  value={remember.text}
                  onChange={text => onChange({ ...config, remember: { ...remember, text } })}
                  maxLength={L.noteText}
                  placeholder="Treść, którą użytkownik ma zapamiętać"
                  error={errors['remember.text']}
                  className="text-[14px] leading-snug text-dark/85"
                />
              </div>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => onChange({ ...config, remember: createContrastNote() })}
            className="flex items-center justify-center gap-2 rounded-[16px] border border-dashed py-4 text-[13px] font-semibold transition-colors hover:bg-[#EAF4FD] cursor-pointer disabled:hidden"
            style={{ borderColor: `${NOTE.color}80`, color: NOTE.color }}
          >
            <Plus className="size-4" /> Dodaj kartę „Zapamiętaj” (opcjonalnie)
          </button>
        )}
      </div>
    </div>
    </fieldset>
  )
}

// --- Red / green card with bullet points ---

type ListCardProps = {
  tone: ContrastTone
  card: ContrastListCard
  errors: ValidationErrors
  onChange: (card: ContrastListCard) => void
}

function ListCard({ tone, card, errors, onChange }: ListCardProps) {
  const t = TONES[tone]
  const Icon = t.icon
  const e = (key: string) => errors[`${tone}.${key}`]

  return (
    <div className="rounded-[16px] border p-5 shadow-sm" style={{ backgroundColor: t.bg, borderColor: t.border }}>
      <div className="flex items-start gap-3">
        <Icon className="mt-1 size-5 shrink-0" style={{ color: t.color }} />
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <div style={{ color: t.color }}>
            <InlineText
              value={card.title}
              onChange={title => onChange({ ...card, title })}
              maxLength={L.cardTitle}
              placeholder="Tytuł karty"
              error={e('title')}
              className="text-[17px] font-bold"
            />
          </div>
          <InlineText
            value={card.lead}
            onChange={lead => onChange({ ...card, lead })}
            maxLength={L.lead}
            placeholder="Rozwinięcie"
            error={e('lead')}
            className="text-[14px] text-dark/85"
          />
        </div>
      </div>

      <ul className="mt-3 flex flex-col gap-1 pl-8">
        {card.points.map((point, p) => (
          <li key={p} className="group flex items-start gap-2.5">
            <span className="mt-[9px] size-1.5 shrink-0 rounded-full" style={{ backgroundColor: t.color }} />
            <div className="min-w-0 flex-1">
              <InlineText
                value={point}
                onChange={value => onChange({ ...card, points: replaceAt(card.points, p, value) })}
                maxLength={L.point}
                placeholder={`Punkt ${p + 1}`}
                error={e(`points.${p}`)}
                className="text-[14px] leading-snug text-dark"
              />
            </div>
            <button
              type="button"
              title="Usuń punkt"
              disabled={card.points.length <= L.minPoints}
              onClick={() => onChange({ ...card, points: removeAt(card.points, p) })}
              className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full text-dark/50 opacity-0 transition-opacity hover:bg-white group-hover:opacity-100 focus:opacity-100 cursor-pointer disabled:invisible"
            >
              <X className="size-3.5" />
            </button>
          </li>
        ))}
      </ul>

      {e('points') && <p className="mt-1 pl-8 text-[11px] text-[#C03448]">{e('points')}</p>}

      {card.points.length < L.maxPoints && (
        <button
          type="button"
          onClick={() => onChange({ ...card, points: [...card.points, ''] })}
          className="ml-8 mt-2 flex items-center gap-1 text-[12px] font-semibold opacity-70 hover:opacity-100 cursor-pointer disabled:hidden"
          style={{ color: t.color }}
        >
          <Plus className="size-3.5" /> Dodaj punkt
        </button>
      )}
    </div>
  )
}
