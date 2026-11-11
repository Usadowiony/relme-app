import { useLayoutEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import type { ValidationErrors } from '../../../../utils/moduleFlow'

// Shared form primitives for block editors (admin only).

export type BlockFormProps<C> = {
  config: C
  onChange: (config: C) => void
  errors: ValidationErrors
  /** Forms wrap their inputs in `<fieldset disabled={readOnly}>`; navigation (tabs, pickers) stays usable. */
  readOnly: boolean
}

type FieldProps = {
  label: string
  error?: string
  hint?: string
  children: ReactNode
}

export function Field({ label, error, hint, children }: FieldProps) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-[11px] font-semibold tracking-widest uppercase text-dark/70">{label}</label>
      {children}
      {error ? (
        <p className="text-[12px] text-[#C03448]">{error}</p>
      ) : hint ? (
        <p className="text-[12px] text-dark/50">{hint}</p>
      ) : null}
    </div>
  )
}

const baseInput =
  'w-full rounded-[12px] bg-[#F1F3F3] px-4 py-3 text-[14px] text-dark placeholder:text-dark/40 outline-none border transition-colors focus:bg-white focus:border-dark/20 disabled:opacity-70'

function borderClass(invalid?: boolean) {
  return invalid ? 'border-[#E7B2B9]' : 'border-transparent'
}

type TextInputProps = {
  value: string
  onChange: (value: string) => void
  maxLength: number
  placeholder?: string
  invalid?: boolean
}

export function TextInput({ value, onChange, maxLength, placeholder, invalid }: TextInputProps) {
  return (
    <input
      type="text"
      value={value}
      maxLength={maxLength}
      placeholder={placeholder}
      onChange={e => onChange(e.target.value)}
      className={`${baseInput} ${borderClass(invalid)}`}
    />
  )
}

type TextAreaProps = TextInputProps & { rows?: number }

export function TextArea({ value, onChange, maxLength, placeholder, invalid, rows = 3 }: TextAreaProps) {
  return (
    <div className="relative">
      <textarea
        value={value}
        rows={rows}
        maxLength={maxLength}
        placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
        className={`${baseInput} ${borderClass(invalid)} resize-none pb-6`}
      />
      <span className="absolute right-3 bottom-2 text-[10px] text-dark/40">
        {value.length}/{maxLength}
      </span>
    </div>
  )
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
}

export function InlineText({ value, onChange, maxLength, placeholder, error, className = '' }: InlineTextProps) {
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

type IconButtonProps = {
  title: string
  disabled?: boolean
  danger?: boolean
  onClick: () => void
  children: ReactNode
}

export function IconButton({ title, disabled, danger, onClick, children }: IconButtonProps) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={`size-7 rounded-full flex items-center justify-center transition-colors cursor-pointer disabled:opacity-25 disabled:cursor-default ${
        danger ? 'text-[#D15F5F] hover:bg-red-50' : 'text-dark/60 hover:bg-white'
      }`}
    >
      {children}
    </button>
  )
}

type AddButtonProps ={ onClick: () => void; children: ReactNode; disabled?: boolean }

export function AddButton({ onClick, children, disabled }: AddButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="self-start text-[11px] font-bold tracking-widest uppercase text-dark/70 hover:text-dark disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
    >
      ⊕ {children}
    </button>
  )
}
