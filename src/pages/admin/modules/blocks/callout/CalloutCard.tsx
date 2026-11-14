import { Trash2 } from 'lucide-react'
import type { Callout, CalloutVariant } from '../../../../../types/modules'
import { CALLOUT_TITLES, CALLOUT_VARIANTS, createCallout } from '../../../../../utils/moduleFlow'
import { RichTextField } from '../rich/RichTextField'
import { CALLOUTS, CALLOUT_SHADOW, CALLOUT_TYPE } from './theme'

// ============================================================
// The shared widget, edited in place: the card looks exactly like in the
// app; the title comes from the variant (not editable), only the body is
// typed (bold allowed — select text or Ctrl+B; colour fixed by the variant).
// ============================================================

export function CalloutCard({ callout, onChange, placeholder = 'Treść widżetu' }: {
  callout: Callout
  onChange: (callout: Callout) => void
  placeholder?: string
}) {
  const t = CALLOUTS[callout.variant]
  const Icon = t.Icon
  return (
    <div
      className="relative flex flex-col gap-[14px] rounded-[14px] border-[1.5px] p-5"
      style={{ backgroundColor: t.surface, borderColor: t.border, boxShadow: CALLOUT_SHADOW }}
    >
      {/* Blobs clipped in their own layer, so the formatting toolbar may stick out of the card. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden rounded-[13px]">
        <span className="absolute -left-[51px] -top-[61px] h-[150px] w-[152px] rounded-full" style={{ backgroundColor: t.blob }} />
        <span className="absolute -bottom-[29px] right-[25px] h-[117px] w-[113px] rounded-full" style={{ backgroundColor: t.blob }} />
        {callout.variant === 'golden' && (
          <span className="absolute bottom-[11px] right-[7px] h-[93px] w-[96px] rounded-full" style={{ backgroundColor: t.blob }} />
        )}
      </div>
      <div
        className="relative flex items-center gap-2"
        style={{ color: t.accent }}
        title="Nagłówek wynika z rodzaju widżetu"
      >
        <Icon className="size-[18px] shrink-0" strokeWidth={1.5} />
        <span className={CALLOUT_TYPE.title}>{CALLOUT_TITLES[callout.variant]}</span>
      </div>
      <div className="relative">
        <RichTextField
          multiline
          bold
          strongWeight={CALLOUT_TYPE.strongWeight}
          value={callout.text}
          onChange={text => onChange({ ...callout, text })}
          placeholder={placeholder}
          color={t.text}
          className={CALLOUT_TYPE.body}
        />
      </div>
    </div>
  )
}

/** Segmented choice of the 3 variants (colour dot + fixed title). */
export function CalloutVariantChoice({ value, onChange }: { value: CalloutVariant; onChange: (variant: CalloutVariant) => void }) {
  return (
    <div className="flex flex-wrap gap-1 rounded-[12px] bg-neutral p-1">
      {CALLOUT_VARIANTS.map(key => (
        <button
          key={key}
          type="button"
          onClick={() => onChange(key)}
          className={`flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-[9px] px-2.5 py-1.5 text-[12px] font-semibold transition-colors cursor-pointer disabled:cursor-default ${
            key === value ? 'bg-white text-dark shadow-sm' : 'text-dark/55 enabled:hover:text-dark'
          }`}
        >
          <span className="size-3 rounded-full" style={{ backgroundColor: CALLOUTS[key].accent }} />
          {CALLOUT_TITLES[key]}
        </button>
      ))}
    </div>
  )
}

/**
 * Optional widget slot of a block form: "+ Zapamiętaj / Warto wiedzieć /
 * Złota zasada" when empty; otherwise the variant choice, the card and a
 * remove button. Inside `<fieldset disabled>` the buttons lock themselves.
 */
export function CalloutField({ value, onChange, error, placeholder }: {
  value: Callout | null
  onChange: (callout: Callout | null) => void
  error?: string
  placeholder?: string
}) {
  if (!value) {
    return (
      <div className="flex flex-col gap-1.5">
        <span className="px-1 text-[11px] font-semibold text-dark/50">Widżet (opcjonalnie)</span>
        <div className="flex flex-wrap gap-2">
          {CALLOUT_VARIANTS.map(key => {
            const t = CALLOUTS[key]
            return (
              <button
                key={key}
                type="button"
                onClick={() => onChange(createCallout(key))}
                className="flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-[14px] border border-dashed px-3 py-3 text-[12px] font-semibold transition-colors cursor-pointer disabled:hidden"
                style={{ borderColor: `${t.accent}80`, color: t.accent, backgroundColor: `${t.surface}80` }}
              >
                <t.Icon className="size-3.5" strokeWidth={2} /> {CALLOUT_TITLES[key]}
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <div className="min-w-0 flex-1">
          <CalloutVariantChoice value={value.variant} onChange={variant => onChange({ ...value, variant })} />
        </div>
        <button
          type="button"
          title="Usuń widżet"
          onClick={() => onChange(null)}
          className="flex size-8 shrink-0 items-center justify-center rounded-full text-[#D15F5F] transition-colors hover:bg-[#FCEBEB] cursor-pointer disabled:hidden"
        >
          <Trash2 className="size-4" />
        </button>
      </div>
      <CalloutCard callout={value} onChange={onChange} placeholder={placeholder} />
      {error && <span className="px-1 text-[11px] text-[#C03448]">{error}</span>}
    </div>
  )
}
