import { useEffect, useState, type FormEvent } from 'react'
import googleLogo from '../assets/icons/google-logo.svg'
import logoLong from '../assets/icons/logo-long.svg'
import Button from '../components/atoms/buttons/Button'
import SegmentedControl from '../components/atoms/buttons/SegmentedControl'
import Input from '../components/atoms/inputs/Input'
import PasswordInput from '../components/atoms/inputs/PasswordInput'
import TopNavigation from '../components/organisms/Navbar/TopNavigation'
import BackgroundBlobs from '../components/templates/BackgroundBlobs'
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient'

type AuthMode = 'login' | 'register'

function LoginPage() {
  const [authMode, setAuthMode] = useState<AuthMode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [otpEmail, setOtpEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isResendingOtp, setIsResendingOtp] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const [errorMessage, setErrorMessage] = useState('')
  const [infoMessage, setInfoMessage] = useState('')
  const isRegisterMode = authMode === 'register'
  const isOtpStep = isRegisterMode && otpEmail.length > 0
  const [showPasswords, setShowPasswords] = useState(false)

  useEffect(() => {
    setShowPasswords(isRegisterMode)
  }, [isRegisterMode])

  useEffect(() => {
    setErrorMessage('')
    setInfoMessage('')

    if (!isRegisterMode) {
      setOtpEmail('')
      setOtpCode('')
      setResendCooldown(0)
    }
  }, [isRegisterMode])

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

  const handleAuthSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    setErrorMessage('')
    setInfoMessage('')

    if (!isSupabaseConfigured) {
      setErrorMessage('Brak konfiguracji Supabase. Uzupełnij VITE_SUPABASE_URL i VITE_SUPABASE_ANON_KEY.')
      return
    }

    const normalizedEmail = email.trim().toLowerCase()
    setIsSubmitting(true)

    try {
      if (isRegisterMode) {
        if (isOtpStep) {
          const token = otpCode.trim()

          if (!token) {
            setErrorMessage('Wpisz kod OTP z maila.')
            return
          }

          const { data, error } = await supabase.auth.verifyOtp({
            email: otpEmail,
            token,
            type: 'signup',
          })

          if (error) {
            setErrorMessage(error.message)
            return
          }

          if (!data.session) {
            const { error: signInError } = await supabase.auth.signInWithPassword({
              email: otpEmail,
              password,
            })

            if (signInError) {
              setErrorMessage(signInError.message)
              return
            }
          }

          setInfoMessage('Konto zostało zweryfikowane poprawnie.')
          return
        }

        if (password !== confirmPassword) {
          setErrorMessage('Hasła muszą być takie same.')
          return
        }

        const { error } = await supabase.auth.signUp({
          email: normalizedEmail,
          password,
        })

        if (error) {
          setErrorMessage(error.message)
          return
        }

        setOtpEmail(normalizedEmail)
        setOtpCode('')
        setResendCooldown(60)
        setInfoMessage('Wysłaliśmy kod OTP na podany email. Wprowadź go, aby dokończyć rejestrację.')
        return
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      })

      if (error) {
        setErrorMessage(error.message)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleResendOtp = async () => {
    setErrorMessage('')
    setInfoMessage('')

    if (!isSupabaseConfigured) {
      setErrorMessage('Brak konfiguracji Supabase. Uzupełnij zmienne środowiskowe.')
      return
    }

    if (!otpEmail || resendCooldown > 0) {
      return
    }

    setIsResendingOtp(true)

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: otpEmail,
      })

      if (error) {
        setErrorMessage(error.message)
        return
      }

      setResendCooldown(60)
      setInfoMessage('Wysłaliśmy nowy kod OTP.')
    } finally {
      setIsResendingOtp(false)
    }
  }

  const handleGoogleAuth = async () => {
    setErrorMessage('')
    setInfoMessage('')

    if (!isSupabaseConfigured) {
      setErrorMessage('Brak konfiguracji Supabase. Uzupełnij zmienne środowiskowe.')
      return
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/login`,
      },
    })

    if (error) {
      setErrorMessage(error.message)
    }
  }

  return (
    <BackgroundBlobs>
      <main className="flex flex-col min-h-screen bg-white sm:bg-transparent text-dark lg:max-w-5xl 2xl:max-w-[1440px] mx-auto w-full">
        <TopNavigation
          className="hidden md:block"
          leftSlot={<img src={logoLong} alt="Relme" className="h-8 w-auto" />}
        />

        <div className="flex-1 flex items-center">
          <div className="mx-auto w-full max-w-[420px] 2sm:max-w-[480px] sm:max-w-[600px] px-6 xs:px-10 ">
            <div className='sm:bg-white sm:shadow-large sm:rounded-[32px] sm:p-14'>
            <h1 className="sm:text-center font-manrope text-[36px] xs:text-[40px] font-semibold tracking-[-0.8px] text-dark">
              {isRegisterMode ? 'Utwórz konto' : 'Witaj ponownie'}
            </h1>
            <p className="sm:text-center mt-2 font-manrope text-[16px] 2xs:text-[18px] font-normal tracking-[-0.4px] text-dark/85">
              {isRegisterMode
                ? 'Dołącz do naszej świadomej społeczności.'
                : 'Zaloguj się do swojego panelu.'}
            </p>

            <div className="mt-6 2xs:mt-10 2sm:mt-14 w-full">
              <SegmentedControl
                value={authMode}
                onChange={(value) => setAuthMode(value as AuthMode)}
                distribution="equal"
                fullWidth
                className={isOtpStep ? 'pointer-events-none opacity-60' : ''}
                options={[
                  { value: 'login', label: 'Zaloguj się' },
                  { value: 'register', label: 'Zarejestruj się' },
                ]}
              />
            </div>

            <div className="mt-6 2xs:mt-8 2sm:mt-10 w-full">
              <Button
                fullWidth
                variant="social"
                onClick={handleGoogleAuth}
                disabled={isSubmitting}
                leftIcon={<img src={googleLogo} alt="" aria-hidden="true" className="size-[18px]" />}
              >
                Kontynuuj przez konto Google
              </Button>
            </div>

            <div className="mt-6 2xs:mt-8 2sm:mt-10 flex items-center gap-4">
              <span className="h-px flex-1 bg-dark/10" />
              <span className="font-manrope text-[10px] font-semibold uppercase tracking-[0.6px] text-dark/50">
                LUB EMAIL
              </span>
              <span className="h-px flex-1 bg-dark/10" />
            </div>
            <form className="mt-6 2xs:mt-8 2sm:mt-10" onSubmit={handleAuthSubmit}>
              {isOtpStep ? (
                <>
                  <Input
                    fullWidth
                    label="Kod OTP"
                    name="otpCode"
                    type="text"
                    placeholder="Wpisz kod z emaila"
                    value={otpCode}
                    onChange={(event) => setOtpCode(event.target.value)}
                    autoComplete="one-time-code"
                    inputMode="numeric"
                    disabled={isSubmitting}
                  />

                  <div className="mt-4 flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={isResendingOtp || resendCooldown > 0}
                      className="font-manrope text-xs font-semibold text-dark/80 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {resendCooldown > 0
                        ? `Wyślij ponownie za ${resendCooldown}s`
                        : 'Wyślij kod ponownie'}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setOtpEmail('')
                        setOtpCode('')
                        setResendCooldown(0)
                        setInfoMessage('')
                        setErrorMessage('')
                      }}
                      className="font-manrope text-xs font-semibold text-dark/80"
                    >
                      Zmień email
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <Input
                    fullWidth
                    label="Adres email"
                    name="email"
                    type="email"
                    placeholder="Podaj adres email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    disabled={isSubmitting}
                    autoComplete="email"
                  />

                  <PasswordInput
                    fullWidth
                    label="Hasło"
                    name="password"
                    placeholder="Podaj hasło"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    isVisible={showPasswords}
                    onVisibilityChange={setShowPasswords}
                    actionLabel={isRegisterMode ? undefined : 'Nie pamiętasz hasła?'}
                    onActionClick={isRegisterMode ? undefined : () => {}}
                    wrapperClassName="mt-8"
                    disabled={isSubmitting}
                    autoComplete={isRegisterMode ? 'new-password' : 'current-password'}
                  />

                  <div
                    className={`grid overflow-hidden origin-top transition-all duration-300 ease-out ${
                      isRegisterMode
                        ? 'mt-8 grid-rows-[1fr] opacity-100 translate-y-0'
                        : 'mt-0 grid-rows-[0fr] opacity-0 -translate-y-2 pointer-events-none'
                    }`}
                    aria-hidden={!isRegisterMode}
                  >
                    <div className="min-h-0 overflow-hidden">
                      <PasswordInput
                        fullWidth
                        label="Powtórz hasło"
                        name="confirmPassword"
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(event) => setConfirmPassword(event.target.value)}
                        isVisible={showPasswords}
                        onVisibilityChange={setShowPasswords}
                        disabled={!isRegisterMode || isSubmitting}
                        autoComplete="new-password"
                      />
                    </div>
                  </div>
                </>
              )}

              {errorMessage ? (
                <p className="mt-4 font-manrope text-sm font-medium text-red-700">{errorMessage}</p>
              ) : null}

              {infoMessage ? (
                <p className="mt-2 font-manrope text-sm font-medium text-primary">{infoMessage}</p>
              ) : null}

              <div className="mt-10 2xs:mt-12 2sm:mt-14 w-full">
                <Button fullWidth type="submit" disabled={isSubmitting || isResendingOtp}>
                  {isRegisterMode ? (isOtpStep ? 'Zweryfikuj kod' : 'Zarejestruj się') : 'Zaloguj się'}
                </Button>
              </div>
            </form>
            </div>
          </div>
        </div>
      </main>
    </BackgroundBlobs>
  )
}

export default LoginPage