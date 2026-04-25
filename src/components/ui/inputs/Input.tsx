import type { InputHTMLAttributes } from 'react'

type InputProps = {
  label: string
  fullWidth?: boolean
  inputWidth?: number
  labelClassName?: string
  wrapperClassName?: string
  inputClassName?: string
} & InputHTMLAttributes<HTMLInputElement>

const baseLabelClassName =
  'pl-[8px] mb-2 block font-manrope text-[11px] font-semibold uppercase tracking-[0.6px] text-dark transition-colors duration-200 group-focus-within:text-primary'

const baseInputClassName =
  'box-border w-full min-w-0 max-w-full rounded-2xl bg-[#D9DEE2]/30 px-4 py-3 2xs:py-4 font-manrope text-base text-dark placeholder:text-dark/50 ring-1 ring-inset ring-[#EAEAEA] outline-none transition-colors duration-200 focus:ring-[1.5px] focus:ring-primary'

export function Input({
  label,
  fullWidth = true,
  inputWidth,
  id,
  placeholder,
  labelClassName = '',
  wrapperClassName = '',
  inputClassName = '',
  type = 'text',
  ...props
}: InputProps) {
  const resolvedId = id ?? props.name ?? label.toLowerCase().replace(/\s+/g, '-')
  const dateInputClassName =
    type === 'date'
      ? 'date-input-fix [color-scheme:light] appearance-none [&::-webkit-datetime-edit]:w-full [&::-webkit-date-and-time-value]:text-left'
      : ''

  return (
    <div
      className={`${fullWidth ? 'w-full' : 'w-auto'} min-w-0 group ${wrapperClassName}`.trim()}
      style={!fullWidth && inputWidth ? { width: `${inputWidth}px` } : undefined}
    >
      <label htmlFor={resolvedId} className={`${baseLabelClassName} ${labelClassName} pl-[4px]`.trim()}>
        {label}
      </label>
      <input
        id={resolvedId}
        type={type}
        placeholder={placeholder}
        className={`${baseInputClassName} ${dateInputClassName} ${inputClassName}`.trim()}
        {...props}
      />
    </div>
  )
}

export default Input