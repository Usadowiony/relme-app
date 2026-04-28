import { useEffect, useState } from 'react'
import logoShort from '../../../assets/icons/logo-short.svg'

type GlobalLoaderProps = {
  isLoading: boolean
}

export function GlobalLoader({ isLoading }: GlobalLoaderProps) {
  const [isRendered, setIsRendered] = useState(isLoading)
  const [isVisible, setIsVisible] = useState(isLoading)

  useEffect(() => {
    let timeoutId: number

    if (isLoading) {
      setIsRendered(true)
      // Minimal opóźnienie dla transition
      requestAnimationFrame(() => setIsVisible(true))
    } else {
      setIsVisible(false)
      // Fade out (300ms)
      timeoutId = window.setTimeout(() => {
        setIsRendered(false)
      }, 300)
    }

    return () => {
      if (timeoutId) window.clearTimeout(timeoutId)
    }
  }, [isLoading])

  if (!isRendered) return null

  return (
    <div
      className={`fixed inset-0 z-[9999] bg-white flex flex-col items-center justify-center transition-opacity duration-300 ease-in-out ${isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
    >
      <div className="relative flex items-center justify-center">
        {/* Animowany pierścień na około */}
        <div className="absolute w-24 h-24 sm:w-28 sm:h-28 lg:w-32 lg:h-32 rounded-full border-[3px] lg:border-[4px] border-gray/20 border-t-primary animate-spin" />

        {/* Logo w środku */}
        <img
          src={logoShort}
          alt="Ładowanie Relme..."
          className="w-10 h-auto sm:w-12 lg:w-18 z-10"
        />
      </div>
    </div>
  )
}

export default GlobalLoader
