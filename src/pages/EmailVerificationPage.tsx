import { useEffect, useRef, useState } from 'react'
import { MailCheck } from 'lucide-react'
import logoLong from '../assets/icons/logo-long.svg'
import Button from '../components/atoms/buttons/Button'
import Toast from '../components/atoms/popups/Toast'
import TopNavigation from '../components/organisms/Navbar/TopNavigation'
import BackgroundBlobs from '../components/templates/BackgroundBlobs'
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient'

const OTP_LENGTH = 6

function clearPendingSignupSession() {
  sessionStorage.removeItem('pending_signup_email')
  sessionStorage.removeItem('pending_signup_password')
  sessionStorage.removeItem('pending_signup_started_at')
  localStorage.removeItem('pending_signup_email')
  localStorage.removeItem('pending_signup_password')
  localStorage.removeItem('pending_signup_started_at')
}

function mapVerifyErrorMessage(message: string) {
  const normalized = message.toLowerCase()

  if (normalized.includes('invalid token') || normalized.includes('token not found')) {
    return 'Kod aktywacyjny jest nieprawidłowy. Sprawdź kod i spróbuj ponownie.'
  }

  if (normalized.includes('expired') || normalized.includes('token has expired')) {
    return 'Kod aktywacyjny jest nieprawidłowy lub wygasł.'
  }

  if (normalized.includes('too many requests') || normalized.includes('rate limit')) {
    return 'Wykonano zbyt wiele prób. Odczekaj chwilę i spróbuj ponownie.'
  }

  return message
}

function mapResendErrorMessage(message: string) {
  const normalized = message.toLowerCase()

  if (normalized.includes('too many requests') || normalized.includes('rate limit')) {
    return 'Kod był wysyłany zbyt często. Poczekaj chwilę i spróbuj ponownie.'
  }

  if (normalized.includes('for security purposes')) {
    return 'Ze względów bezpieczeństwa spróbuj ponownie za moment.'
  }

  return message
}

function EmailVerificationPage() {
  const [otpCode, setOtpCode] = useState('')
  const [isOtpFocused, setIsOtpFocused] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const [errorMessage, setErrorMessage] = useState('')
  const [infoMessage, setInfoMessage] = useState('')
  const [isDesktopViewport, setIsDesktopViewport] = useState(false)
  const otpInputRef = useRef<HTMLInputElement>(null)
  const pendingEmail =
    sessionStorage.getItem('pending_signup_email') ?? localStorage.getItem('pending_signup_email') ?? ''
  const pendingSignupExpiryAt = Number(
    sessionStorage.getItem('pending_signup_started_at') ?? localStorage.getItem('pending_signup_started_at') ?? '0',
  )
  const isPendingSignupValid =
    Boolean(pendingEmail) &&
    Number.isFinite(pendingSignupExpiryAt) &&
    pendingSignupExpiryAt > Date.now()

  useEffect(() => {
    if (!isPendingSignupValid) {
      clearPendingSignupSession()
      window.history.replaceState({}, '', '/login')
      window.dispatchEvent(new PopStateEvent('popstate'))
      return
    }

    sessionStorage.setItem('pending_signup_email', pendingEmail)
    sessionStorage.setItem('pending_signup_started_at', String(pendingSignupExpiryAt))

    localStorage.setItem('pending_signup_email', pendingEmail)
    localStorage.setItem('pending_signup_started_at', String(pendingSignupExpiryAt))

    setResendCooldown(60)
  }, [isPendingSignupValid, pendingEmail, pendingSignupExpiryAt])

  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 768px)')
    const syncViewport = () => setIsDesktopViewport(mediaQuery.matches)

    syncViewport()
    mediaQuery.addEventListener('change', syncViewport)

    return () => mediaQuery.removeEventListener('change', syncViewport)
  }, [])

  useEffect(() => {
    if (resendCooldown <= 0) {
      return
    }

    const timer = window.setInterval(() => {
      setResendCooldown((previous) => {
        if (previous <= 1) {
          window.clearInterval(timer)
          return 0
        }

        return previous - 1
      })
    }, 1000)

    return () => window.clearInterval(timer)
  }, [resendCooldown])

  const handleVerify = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErrorMessage('')
    setInfoMessage('')

    if (!isSupabaseConfigured) {
      setErrorMessage('Brak konfiguracji Supabase. Uzupełnij zmienne środowiskowe.')
      return
    }

    const token = otpCode.trim()

    if (!token) {
      setErrorMessage('Wpisz kod aktywacyjny z maila.')
      return
    }

    if (!/^\d{6}$/.test(token)) {
      setErrorMessage('Kod aktywacyjny musi mieć dokładnie 6 cyfr.')
      return
    }

    if (!isPendingSignupValid) {
      setErrorMessage('Brak danych rejestracji. Wróć do logowania.')
      return
    }

    setIsSubmitting(true)

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: pendingEmail,
        token,
        type: 'signup',
      })

      if (error) {
        setErrorMessage(mapVerifyErrorMessage(error.message))
        return
      }

      clearPendingSignupSession()
      if (data.session) {
        setInfoMessage('Konto aktywowane poprawnie.')
        window.history.replaceState({}, '', '/')
      } else {
        setInfoMessage('Konto zweryfikowane! Zaloguj się swoimi danymi.')
        window.setTimeout(() => {
          window.history.replaceState({}, '', '/login')
          window.dispatchEvent(new PopStateEvent('popstate'))
        }, 900)
        return
      }

      window.dispatchEvent(new PopStateEvent('popstate'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleResend = async () => {
    setErrorMessage('')
    setInfoMessage('')

    if (!isSupabaseConfigured) {
      setErrorMessage('Brak konfiguracji Supabase. Uzupełnij zmienne środowiskowe.')
      return
    }

    if (!isPendingSignupValid || resendCooldown > 0) {
      return
    }

    setIsResending(true)

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: pendingEmail,
      })

      if (error) {
        setErrorMessage(mapResendErrorMessage(error.message))
        return
      }

      setResendCooldown(60)
      setInfoMessage('Kod został wysłany ponownie.')
    } finally {
      setIsResending(false)
    }
  }

  const handleOtpChange = (rawValue: string) => {
    const digitsOnly = rawValue.replace(/\D/g, '').slice(0, OTP_LENGTH)
    setOtpCode(digitsOnly)
  }

  const handleOtpGridClick = () => {
    otpInputRef.current?.focus()
    const cursorAtEnd = otpCode.length
    otpInputRef.current?.setSelectionRange(cursorAtEnd, cursorAtEnd)
  }

  return (
    <BackgroundBlobs>
      <Toast
        open={Boolean(errorMessage || infoMessage)}
        type={errorMessage ? 'error' : 'success'}
        title={errorMessage ? 'Mamy problem!' : 'Gotowe!'}
        message={errorMessage || infoMessage}
        position={isDesktopViewport ? 'top' : 'bottom'}
        durationMs={8000}
        onClose={() => {
          setErrorMessage('')
          setInfoMessage('')
        }}
      />

      <main className="flex flex-col min-h-screen bg-white sm:bg-transparent text-dark lg:max-w-5xl 2xl:max-w-[1440px] mx-auto w-full">
        <TopNavigation
          className="hidden md:block"
          leftSlot={<img src={logoLong} alt="Relme" className="h-8 w-auto" />}
        />
      <div className="flex-1 flex items-center">
        <div className="mx-auto mt-2 xs:mt-4 sm:mt-0 w-full 2xs:max-w-[360px] xs:max-w-[480px] sm:max-w-[520px] rounded-[28px] sm:bg-white p-6 sm:shadow-large sm:mt-10 sm:px-10 sm:py-14">
          <div className="mx-auto flex size-24 2xs:size-28 xs:size-32 items-center justify-center rounded-full bg-primary text-white">
            <MailCheck className="size-8 2xs:size-10 xs:size-12" />
          </div>

          <h1 className="mt-6 2xs:mt-7 xs:mt-8 text-center font-manrope text-[32px] 2xs:text-[36px] leading-[1.05] xs:leading-[1.2] font-semibold tracking-[-1px] text-dark">
            Wprowadź kod 
            <br />
            aktywacyjny
          </h1>
          <p className="mt-6 2xs:mt-7 xs:mt-8 text-center font-manrope text-[14px] 2xs:text-base font-normal xs:mx-auto xs:max-w-[420px] tracking-[-0.2px] text-dark/80">
            Wysłaliśmy na Twoją skrzynkę pocztową <span className="font-semibold">{pendingEmail}</span> kod do aktywacji konta. Wprowadź go poniżej aby
            zweryfikować swój adres email.
          </p>

          <form className="mt-6 2xs:mt-7 xs:mt-8" onSubmit={handleVerify}>
            <p className="mb-4 text-center font-manrope text-[15px] font-semibold uppercase tracking-[0.6px] text-dark/90">
              Kod aktywacyjny
            </p>

            <div
              className="relative mx-auto flex w-full max-w-[356px] items-center justify-center gap-2 2xs:gap-3"
              onClick={handleOtpGridClick}
            >
              <input
                ref={otpInputRef}
                name="one-time-code"
                type="text"
                value={otpCode}
                onChange={(event) => {
                  handleOtpChange(event.target.value)
                }}
                onPaste={(event) => {
                  event.preventDefault()
                  handleOtpChange(event.clipboardData.getData('text'))
                }}
                onFocus={() => setIsOtpFocused(true)}
                onBlur={() => setIsOtpFocused(false)}
                autoComplete="one-time-code"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={OTP_LENGTH}
                disabled={isSubmitting}
                className="absolute inset-0 z-10 h-full w-full opacity-0"
                aria-label="Kod aktywacyjny"
              />

              {Array.from({ length: OTP_LENGTH }).map((_, index) => {
                const digit = otpCode[index] ?? ''
                const isActiveCell =
                  isOtpFocused && (index === otpCode.length || (otpCode.length === OTP_LENGTH && index === OTP_LENGTH - 1))

                return (
                  <div
                    key={index}
                    className={`flex h-12 w-12 items-center justify-center rounded-[14px] bg-[#D9DEE2]/45 font-inter text-lg font-bold text-dark ring-1 transition-colors duration-150 ${
                      isActiveCell ? 'ring-primary bg-white' : 'ring-[#D4D9DE]'
                    }`}
                  >
                    {digit}
                  </div>
                )
              })}
            </div>

            <div className="mt-10 xs:max-w-[400px] mx-auto">
              <Button fullWidth type="submit" disabled={isSubmitting || isResending}>
                Aktywuj konto
              </Button>
            </div>
          </form>

          <div className="mt-6 2xs:mt-7 xs:mt-8 text-center">
            <button
              type="button"
              onClick={handleResend}
              disabled={isResending || resendCooldown > 0}
              className="cursor-pointer inline-flex font-manrope text-sm xs:text-base font-semibold text-dark underline disabled:cursor-not-allowed disabled:opacity-60"
            >
              {resendCooldown > 0 ? `Wyślij kod ponownie za ${resendCooldown}s` : 'Wyślij kod ponownie'}
            </button>
          </div>

          <p className="mt-8 xs:mt-10 text-center font-manrope text-[12px] xs:max-w-[320px] xs:mx-auto font-medium text-dark/70">
            Nie dotarło? Sprawdź swój folder spam lub skontaktuj się z naszą pomocą pod adresem
            help@relamy.com
          </p>
        </div>
      </div>
      </main>
    </BackgroundBlobs>
  )
}

export default EmailVerificationPage
