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
  'mb-2 block font-manrope text-[10px] font-semibold uppercase tracking-[0.6px] text-dark'

const baseInputClassName =
  'w-full rounded-2xl bg-[rgba(217,222,226,0.3)] px-4 py-4 font-manrope text-base text-dark placeholder:text-dark/50 ring-1 ring-inset ring-[#EAEAEA] outline-none transition-colors duration-200 focus:ring-dark/35'

export function Input({
  label,
  fullWidth = true,
  inputWidth,
  id,
  labelClassName = '',
  wrapperClassName = '',
  inputClassName = '',
  type = 'text',
  ...props
}: InputProps) {
  const resolvedId = id ?? props.name ?? label.toLowerCase().replace(/\s+/g, '-')

  return (
    <div
      className={`${fullWidth ? 'w-full' : 'w-auto'} ${wrapperClassName}`.trim()}
      style={!fullWidth && inputWidth ? { width: `${inputWidth}px` } : undefined}
    >
      <label htmlFor={resolvedId} className={`${baseLabelClassName} ${labelClassName} pl-[4px]`.trim()}>
        {label}
      </label>
      <input
        id={resolvedId}
        type={type}
        className={`${baseInputClassName} ${inputClassName}`.trim()}
        {...props}
      />
    </div>
  )
}

export default Input