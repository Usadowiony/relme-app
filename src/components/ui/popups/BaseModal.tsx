import { useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import { X } from 'lucide-react'

export type BaseModalProps = {
  isOpen: boolean
  onClose: () => void
  title: string
  subtitle: string
  children: ReactNode
  footer: ReactNode
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
}

export function BaseModal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  maxWidth = 'lg'
}: BaseModalProps) {
  const [isClosing, setIsClosing] = useState(false)

  // Reset closing state when opened
  useEffect(() => {
    if (isOpen) {
      setIsClosing(false)
    }
  }, [isOpen])

  if (!isOpen && !isClosing) return null

  const handleClose = () => {
    setIsClosing(true)
    setTimeout(() => {
      onClose()
      setIsClosing(false)
    }, 200) // matches animation duration
  }

  const maxWidthClass = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl'
  }[maxWidth]

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-dark/40 backdrop-blur-sm ${isClosing ? 'animate-fade-out' : 'animate-fade-in'}`}
        onClick={handleClose}
      />

      {/* Modal Container */}
      <div
        className={`relative bg-white w-full ${maxWidthClass} rounded-[24px] shadow-2xl flex flex-col max-h-[90vh] ${isClosing ? 'animate-slide-down' : 'animate-slide-up'}`}
      >
        {/* Header */}
        <div className="flex justify-between items-start pt-10 pb-6 px-8 shrink-0">
          <div>
            <div className="text-[10px] font-bold tracking-widest text-dark/70 uppercase mb-2">
              {subtitle}
            </div>
            <h2 className="text-xl font-bold text-dark font-manrope">
              {title}
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-red-500/10 rounded-full transition-colors text-dark/80 hover:text-red-500 cursor-pointer"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Content (Scrollable) */}
        <div className="py-6 px-8 flex flex-col gap-8 overflow-y-auto custom-scrollbar">
          {children}
        </div>

        {/* Footer */}
        <div className="mt-6 py-6 px-8 border-t border-gray/10 flex justify-end gap-3 bg-neutral rounded-b-[24px] shrink-0">
          {footer}
        </div>
      </div>
    </div>
  )
}
