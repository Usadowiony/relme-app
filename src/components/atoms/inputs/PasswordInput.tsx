import { useState } from 'react'
import type { InputHTMLAttributes } from 'react'
import { Eye, EyeOff } from 'lucide-react'

type PasswordInputProps = {
  label: string
  actionLabel?: string
  onActionClick?: () => void
  isVisible?: boolean
  onVisibilityChange?: (isVisible: boolean) => void
  fullWidth?: boolean
  inputWidth?: number
  wrapperClassName?: string
  inputClassName?: string
} & Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>

const baseLabelClassName =
  'block pl-[8px] font-manrope text-[11px] font-semibold uppercase tracking-[0.6px] text-dark transition-colors duration-200'

const baseInputClassName =
  'w-full rounded-2xl bg-[#D9DEE2]/30 px-4 px-4 py-3 2xs:py-4 pr-12 font-manrope text-base text-dark placeholder:text-dark/50 ring-1 ring-inset ring-[#EAEAEA] outline-none transition-colors duration-200 focus:ring-[1.5px] focus:ring-primary'

export function PasswordInput({
  label,
  actionLabel,
  onActionClick,
  isVisible: controlledIsVisible,
  onVisibilityChange,
  fullWidth = true,
  inputWidth,
  id,
  name,
  placeholder,
  wrapperClassName = '',
  inputClassName = '',
  onFocus,
  onBlur,
  ...props
}: PasswordInputProps) {
  const [internalIsVisible, setInternalIsVisible] = useState(false)
  const [isInputFocused, setIsInputFocused] = useState(false)
  const isControlled = typeof controlledIsVisible === 'boolean'
  const isVisible = isControlled ? controlledIsVisible : internalIsVisible
  const resolvedId = id ?? name ?? label.toLowerCase().replace(/\s+/g, '-')

  const handleVisibilityToggle = () => {
    const nextValue = !isVisible

    if (!isControlled) {
      setInternalIsVisible(nextValue)
    }

    onVisibilityChange?.(nextValue)
  }

  return (
    <div
      className={`${fullWidth ? 'w-full' : 'w-auto'} group ${wrapperClassName}`.trim()}
      style={!fullWidth && inputWidth ? { width: `${inputWidth}px` } : undefined}
    >
      <div className="mb-2 flex items-center justify-between gap-4">
        <label
          htmlFor={resolvedId}
          className={`${baseLabelClassName} ${isInputFocused ? 'text-primary' : ''}`.trim()}
        >
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
          onFocus={(event) => {
            setIsInputFocused(true)
            onFocus?.(event)
          }}
          onBlur={(event) => {
            setIsInputFocused(false)
            onBlur?.(event)
          }}
          {...props}
        />
        <button
          type="button"
          onClick={handleVisibilityToggle}
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