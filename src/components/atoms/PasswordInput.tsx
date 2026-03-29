import { useState } from 'react'
import type { InputHTMLAttributes } from 'react'
import { Eye, EyeOff } from 'lucide-react'

type PasswordInputProps = {
  label: string
  actionLabel?: string
  onActionClick?: () => void
  fullWidth?: boolean
  inputWidth?: number
  wrapperClassName?: string
  inputClassName?: string
} & Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>

const baseLabelClassName =
  'block pl-[4px] font-manrope text-[10px] font-semibold uppercase tracking-[0.6px] text-dark'

const baseInputClassName =
  'w-full rounded-2xl bg-[rgba(217,222,226,0.3)] px-4 py-4 pr-12 font-manrope text-base text-dark placeholder:text-dark/50 ring-1 ring-inset ring-[#EAEAEA] outline-none transition-colors duration-200 focus:ring-dark/35'

export function PasswordInput({
  label,
  actionLabel,
  onActionClick,
  fullWidth = true,
  inputWidth,
  id,
  name,
  placeholder,
  wrapperClassName = '',
  inputClassName = '',
  ...props
}: PasswordInputProps) {
  const [isVisible, setIsVisible] = useState(false)
  const resolvedId = id ?? name ?? label.toLowerCase().replace(/\s+/g, '-')

  return (
    <div
      className={`${fullWidth ? 'w-full' : 'w-auto'} ${wrapperClassName}`.trim()}
      style={!fullWidth && inputWidth ? { width: `${inputWidth}px` } : undefined}
    >
      <div className="mb-2 flex items-center justify-between gap-4">
        <label htmlFor={resolvedId} className={baseLabelClassName}>
          {label}
        </label>
        {actionLabel ? (
          <button
            type="button"
            onClick={onActionClick}
            className="pr-[4px] cursor-pointer font-manrope text-xs font-semibold tracking-[-0.2px] text-dark/85 transition-colors duration-200 hover:text-black"
          >
            {actionLabel}
          </button>
        ) : null}
      </div>

      <div className="relative">
        <input
          id={resolvedId}
          name={name}
          type={isVisible ? 'text' : 'password'}
          placeholder={placeholder}
          className={`${baseInputClassName} ${inputClassName}`.trim()}
          {...props}
        />
        <button
          type="button"
          onClick={() => setIsVisible((current) => !current)}
          aria-label={isVisible ? 'Ukryj hasło' : 'Pokaż hasło'}
          className="absolute right-4 top-1/2 inline-flex -translate-y-1/2 items-center justify-center text-dark/80 transition-colors duration-200 hover:text-black"
        >
          {isVisible ? <EyeOff className="cursor-pointer size-[18px]" /> : <Eye className="cursor-pointer size-[18px]" />}
        </button>
      </div>
    </div>
  )
}

export default PasswordInput