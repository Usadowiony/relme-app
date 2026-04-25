import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { CircleAlert, CircleCheck, CircleX, X } from 'lucide-react'

type ToastType = 'success' | 'warning' | 'error' | 'info'
type ToastPosition = 'top' | 'bottom'

type ToastProps = {
  open: boolean
  title: string
  message?: string
  type?: ToastType
  durationMs?: number
  position?: ToastPosition
  onClose?: () => void
  className?: string
  icon?: ReactNode
}

type ToastTheme = {
  container: string
  iconWrap: string
  iconColor: string
  titleColor: string
  messageColor: string
  closeColor: string
  progressColor: string
}

const DEFAULT_DURATION_MS = 5000
const TICK_MS = 50
const EXIT_ANIMATION_MS = 260

const toastThemes: Record<ToastType, ToastTheme> = {
  success: {
    container: 'border-[#8ED9BC] bg-white',
    iconWrap: 'bg-[#CDEFE0]',
    iconColor: 'text-[#198754]',
    titleColor: 'text-[#198754]',
    messageColor: 'text-[#2C6B56]',
    closeColor: 'text-[#2C6B56] hover:text-[#198754]',
    progressColor: 'bg-[#34B57A]',
  },
  warning: {
    container: 'border-[#E5C580] bg-white',
    iconWrap: 'bg-[#FCE8BF]',
    iconColor: 'text-[#B37500]',
    titleColor: 'text-[#B37500]',
    messageColor: 'text-[#7B5200]',
    closeColor: 'text-[#7B5200] hover:text-[#B37500]',
    progressColor: 'bg-[#E5A100]',
  },
  error: {
    container: 'border-[#E7B2B9] bg-white',
    iconWrap: 'bg-[#FAD8DC]',
    iconColor: 'text-[#C03448]',
    titleColor: 'text-[#C03448]',
    messageColor: 'text-[#7A2533]',
    closeColor: 'text-[#7A2533] hover:text-[#C03448]',
    progressColor: 'bg-[#D94A5D]',
  },
  info: {
    container: 'border-[#AFC8EE] bg-white',
    iconWrap: 'bg-[#D8E8FF]',
    iconColor: 'text-[#2E6AC6]',
    titleColor: 'text-[#2E6AC6]',
    messageColor: 'text-[#28538E]',
    closeColor: 'text-[#28538E] hover:text-[#2E6AC6]',
    progressColor: 'bg-[#4A84DC]',
  },
}

const fallbackIcons: Record<ToastType, ReactNode> = {
  success: <CircleCheck className="size-4" />,
  warning: <CircleAlert className="size-4" />,
  error: <CircleX className="size-4" />,
  info: <CircleAlert className="size-4" />,
}

export function Toast({
  open,
  title,
  message,
  type = 'info',
  durationMs = DEFAULT_DURATION_MS,
  position = 'top',
  onClose,
  className = '',
  icon,
}: ToastProps) {
  const [isRendered, setIsRendered] = useState(open)
  const [isActive, setIsActive] = useState(false)
  const [remainingMs, setRemainingMs] = useState(durationMs)
  const [isPinnedAfterHover, setIsPinnedAfterHover] = useState(false)

  useEffect(() => {
    let frameId: number | undefined
    let timeoutId: number | undefined

    if (open) {
      setIsRendered(true)
      setRemainingMs(durationMs)
      setIsPinnedAfterHover(false)

      frameId = window.requestAnimationFrame(() => {
        setIsActive(true)
      })
    } else {
      setIsActive(false)
      timeoutId = window.setTimeout(() => {
        setIsRendered(false)
      }, EXIT_ANIMATION_MS)
    }

    return () => {
      if (frameId) {
        window.cancelAnimationFrame(frameId)
      }

      if (timeoutId) {
        window.clearTimeout(timeoutId)
      }
    }
  }, [durationMs, open])

  useEffect(() => {
    if (!isRendered) {
      return
    }

    if (!open || isPinnedAfterHover || !isActive) {
      return
    }

    if (durationMs <= 0) {
      return
    }

    const intervalId = window.setInterval(() => {
      setRemainingMs((previous) => {
        const next = previous - TICK_MS

        if (next <= 0) {
          window.clearInterval(intervalId)
          onClose?.()
          return 0
        }

        return next
      })
    }, TICK_MS)

    return () => window.clearInterval(intervalId)
  }, [durationMs, isActive, isPinnedAfterHover, onClose, open, isRendered])

  const theme = toastThemes[type]
  const effectiveIcon = icon ?? fallbackIcons[type]
  const progress = useMemo(() => {
    if (durationMs <= 0) {
      return 0
    }

    const normalized = Math.max(remainingMs, 0) / durationMs
    return Math.max(0, Math.min(1, normalized))
  }, [durationMs, remainingMs])

  if (!isRendered) {
    return null
  }

  const hiddenTranslateY = position === 'top' ? '-140%' : '140%'

  return (
    /* Fixed wrapper controls toast position on viewport (top/bottom). */
    <div
      className={`fixed inset-x-0 z-50 flex px-4 ${position === 'top' ? 'top-6' : 'bottom-6'}`}
      aria-live="polite"
      role="status"
      style={{ pointerEvents: isActive ? 'auto' : 'none' }}
    >
      {/* Animated toast panel: fade + slide in/out. */}
      <div
        className={`mx-auto w-full xs:max-w-[380px] 2sm:max-w-[420px] sm:max-w-[500px] md:max-w-[530px] overflow-hidden rounded-2xl border-[2px] shadow-large transition-all duration-300 ease-out will-change-transform ${theme.container} ${className}`.trim()}
        style={{
          opacity: isActive ? 1 : 0,
          transform: isActive ? 'translateY(0)' : `translateY(${hiddenTranslateY})`,
        }}
        onMouseEnter={() => setIsPinnedAfterHover(true)}
      >
        {/* Main content row: icon, text, close action. */}
        <div className="flex items-start gap-3 2sm:gap-4 sm:gap-5 md:gap-6 px-4 py-4 2sm:py-5 2sm:px-5">
          {/* Status icon area with color per toast type. */}
          <div className={`inline-flex self-center size-7 sm:size-8 shrink-0 items-center justify-center rounded-full ${theme.iconWrap}`}>
            <span className={theme.iconColor}>{effectiveIcon}</span>
          </div>

          {/* Title + optional message text block. */}
          <div className="min-w-0 flex-1">
            <p className={`font-manrope text-sm 2sm:text-base font-semibold md:font-bold ${theme.titleColor}`}>{title}</p>
            {message ? (
              <p className={`mt-1 sm:mt-1.5 font-manrope text-xs 2sm:text-[14px] font-medium leading-4 text-dark`}>
                {message}
              </p>
            ) : null}
          </div>

          {/* Manual close button. */}
          <button
            type="button"
            onClick={onClose}
            className={`group cursor-pointer inline-flex size-7 sm:size-8 shrink-0 items-center justify-center rounded-full transition-colors duration-200 ${theme.closeColor}`}
            aria-label="Zamknij toast"
          >
            <X className="size-4 2sm:size-5 origin-center transition-transform duration-200 ease-out group-hover:scale-[0.85]" />
          </button>
        </div>

        {/* Auto-dismiss progress bar. It hides permanently after hover. */}
        {durationMs > 0 ? (
          <div
            className={`overflow-hidden bg-black/7 transition-[max-height,opacity] duration-200 ease-out ${
              isPinnedAfterHover ? 'max-h-0 opacity-0' : 'max-h-2 opacity-100'
            }`}
          >
            {/* Progress width shrinks over time to visualize remaining duration. */}
            <div className="h-0.5 lg:h-1 w-full">
              <div
                className={`h-full transition-[width] duration-75 ease-linear ${theme.progressColor}`}
                style={{ width: `${progress * 100}%` }}
              />
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}

export default Toast
