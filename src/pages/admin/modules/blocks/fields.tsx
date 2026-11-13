import { useLayoutEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { Plus, X } from 'lucide-react'
import type { ValidationErrors } from '../../../../utils/moduleFlow'

// Shared form primitives for block editors (admin only).

export type BlockFormProps<C> = {
  config: C
  onChange: (config: C) => void
  errors: ValidationErrors
  /** Forms wrap their inputs in `<fieldset disabled={readOnly}>`; navigation (tabs, pickers) stays usable. */
  readOnly: boolean
}

// --- Preview-style editing ---
// Text that looks like the mobile UI it edits (font/colour come from
// `className`), but is an auto-growing single-paragraph textarea.

type InlineTextProps = {
  value: string
  onChange: (value: string) => void
  maxLength: number
  placeholder: string
  error?: string
  className?: string
  autoFocus?: boolean
}

export function InlineText({ value, onChange, maxLength, placeholder, error, className = '', autoFocus }: InlineTextProps) {
  const ref = useRef<HTMLTextAreaElement>(null)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [value])

  return (
    <div className="flex flex-col min-w-0">
      <textarea
        ref={ref}
        rows={1}
        autoFocus={autoFocus}
        value={value}
        maxLength={maxLength}
        placeholder={placeholder}
        title={error}
        onKeyDown={e => {
          if (e.key === 'Enter') e.preventDefault()
        }}
        onChange={e => onChange(e.target.value.replace(/\s*\n\s*/g, ' '))}
        className={`block w-full resize-none overflow-hidden bg-transparent outline-none rounded-[8px] px-1.5 -mx-1.5 py-0.5 transition-colors placeholder:text-current placeholder:opacity-35 hover:bg-dark/[0.04] focus:bg-white focus:shadow-[0_0_0_2px_rgba(43,110,120,0.35)] disabled:hover:bg-transparent ${
          error ? 'bg-red-50 shadow-[0_0_0_2px_#E7B2B9]' : ''
        } ${className}`}
      />
      {error && <span className="mt-0.5 text-[11px] font-normal text-[#C03448]">{error}</span>}
    </div>
  )
}

// --- Block popup tabs ("Treść ćwiczenia" / "Interpretacja odpowiedzi") ---

export type BlockTab<T extends string> = { id: T; label: string; errorCount: number }

export function BlockTabs<T extends string>({ tabs, active, onChange }: {
  tabs: BlockTab<T>[]
  active: T
  onChange: (tab: T) => void
}) {
  return (
    <div role="tablist" className="flex gap-1 self-start rounded-full bg-neutral p-1">
      {tabs.map(t => (
        <button
          key={t.id}
          type="button"
          role="tab"
          aria-selected={active === t.id}
          onClick={() => onChange(t.id)}
          className={`flex items-center gap-2 rounded-full px-4 py-2 text-[13px] font-semibold transition-colors cursor-pointer ${
            active === t.id ? 'bg-white text-dark shadow-sm' : 'text-dark/55 hover:text-dark'
          }`}
        >
          {t.label}
          {t.errorCount > 0 && (
            <span className="rounded-full bg-[#C03448] px-1.5 text-[10px] font-bold leading-4 text-white">{t.errorCount}</span>
          )}
        </button>
      ))}
    </div>
  )
}

/** Small "×" shown on hover of a `group` row (list points, answers). Hidden in read-only fieldsets via `disabled:invisible`. */
export function RemoveButton({ title, disabled, onClick }: { title: string; disabled?: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full text-dark/50 opacity-0 transition-opacity hover:bg-white group-hover:opacity-100 focus:opacity-100 cursor-pointer disabled:invisible"
    >
      <X className="size-3.5" />
    </button>
  )
}

/** Subtle "+ Dodaj …" text link under a list. */
export function AddLink({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-2 flex items-center gap-1 text-[12px] font-semibold text-dark/50 hover:text-dark cursor-pointer disabled:hidden"
    >
      <Plus className="size-3.5" /> {children}
    </button>
  )
}
