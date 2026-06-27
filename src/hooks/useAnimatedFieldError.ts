import { useEffect, useState } from 'react'

/**
 * Animates the appearance and disappearance of an inline field error message.
 *
 * Returns `content` (the message to render) and `isVisible` (whether to show it).
 * Content is kept alive for 220ms after hide to allow CSS transitions to complete
 * before the DOM node unmounts.
 */
export function useAnimatedFieldError(errorMessage: string, shouldShow: boolean) {
  const [content, setContent] = useState('')
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    let hideTimer: number | undefined
    let frameId: number | undefined

    if (shouldShow && errorMessage) {
      setContent(errorMessage)
      frameId = window.requestAnimationFrame(() => setIsVisible(true))
    } else {
      setIsVisible(false)
      hideTimer = window.setTimeout(() => setContent(''), 220)
    }

    return () => {
      if (hideTimer) window.clearTimeout(hideTimer)
      if (frameId) window.cancelAnimationFrame(frameId)
    }
  }, [errorMessage, shouldShow])

  return { content, isVisible }
}
