import { useEffect, useState, type FormEvent } from 'react'
import googleLogo from '../assets/icons/google-logo.svg'
import logoLong from '../assets/icons/logo-long.svg'
import Button from '../components/atoms/buttons/Button'
import SegmentedControl from '../components/atoms/buttons/SegmentedControl'
import Input from '../components/atoms/inputs/Input'
import PasswordInput from '../components/atoms/inputs/PasswordInput'
import Toast from '../components/atoms/popups/Toast'
import TopNavigation from '../components/organisms/Navbar/TopNavigation'
import BackgroundBlobs from '../components/templates/BackgroundBlobs'
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient'

type AuthMode = 'login' | 'register'

const PENDING_SIGNUP_TTL_MS = 15 * 60 * 1000
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const uppercasePattern = /[A-Z]/
const specialCharacterPattern = /[^A-Za-z0-9]/

function resolveOAuthRedirectUrl() {
  const configuredPublicUrl = import.meta.env.VITE_PUBLIC_APP_URL?.trim()
  const normalizedPublicUrl = configuredPublicUrl?.replace(/\/+$/, '')
  const isLocalhost =
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1'

  const baseUrl = isLocalhost && normalizedPublicUrl ? normalizedPublicUrl : window.location.origin

  return `${baseUrl}/login`
}

function clearPendingSignupSession() {
  sessionStorage.removeItem('pending_signup_email')
  sessionStorage.removeItem('pending_signup_password')
  sessionStorage.removeItem('pending_signup_started_at')
  localStorage.removeItem('pending_signup_email')
  localStorage.removeItem('pending_signup_password')
  localStorage.removeItem('pending_signup_started_at')
}

function mapSignInErrorMessage(message: string) {
  const normalized = message.toLowerCase()

  if (normalized.includes('missing email or phone')) {
    return 'Musisz wypełnić wszystkie wymagane pola.'
  }

  if (normalized.includes('invalid login credentials')) {
    return 'Nieprawidłowy adres email lub hasło.'
  }

  if (normalized.includes('email not confirmed')) {
    return 'Adres email nie został jeszcze potwierdzony. Dokończ aktywację konta.'
  }

  return message
}

function mapSignUpErrorMessage(message: string) {
  const normalized = message.toLowerCase()

  if (normalized.includes('anonymous sign-ins are disabled')) {
    return 'Musisz wypełnić wszystkie wymagane pola.'
  }

  if (
    normalized.includes('user already registered') ||
    normalized.includes('already been registered')
  ) {
    return 'Konto dla tego adresu już istnieje. Zaloguj się odpowiednią metodą (Email lub Google).'
  }

  return message
}

function useAnimatedFieldError(errorMessage: string, shouldShow: boolean) {
  const [content, setContent] = useState('')
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    let hideTimer: number | undefined
    let frameId: number | undefined

    if (shouldShow && errorMessage) {
      setContent(errorMessage)
      frameId = window.requestAnimationFrame(() => {
        setIsVisible(true)
      })
    } else {
      setIsVisible(false)
      hideTimer = window.setTimeout(() => {
        setContent('')
      }, 220)
    }

    return () => {
      if (hideTimer) {
        window.clearTimeout(hideTimer)
      }

      if (frameId) {
        window.cancelAnimationFrame(frameId)
      }
    }
  }, [errorMessage, shouldShow])

  return { content, isVisible }
}

function LoginPage() {
  const [authMode, setAuthMode] = useState<AuthMode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [infoMessage, setInfoMessage] = useState('')
  const [submitAttempted, setSubmitAttempted] = useState(false)
  const [touched, setTouched] = useState({
    email: false,
    password: false,
    confirmPassword: false,
  })
  const isRegisterMode = authMode === 'register'
  const [showPasswords, setShowPasswords] = useState(false)
  const [isDesktopViewport, setIsDesktopViewport] = useState(false)
  const useSoftErrorTitle = errorMessage === 'Musisz wypełnić wszystkie wymagane pola.'

  const isEmailEmpty = email.trim().length === 0
  const isPasswordEmpty = password.length === 0
  const isConfirmPasswordEmpty = confirmPassword.length === 0

  const emailFormatError = !isEmailEmpty && !emailPattern.test(email.trim())
  const passwordLengthError = isRegisterMode && !isPasswordEmpty && password.length < 8
  const passwordUppercaseError =
    isRegisterMode && !isPasswordEmpty && !passwordLengthError && !uppercasePattern.test(password)
  const passwordSpecialCharacterError =
    isRegisterMode &&
    !isPasswordEmpty &&
    !passwordLengthError &&
    !specialCharacterPattern.test(password)
  const confirmPasswordMismatchError =
    isRegisterMode && !isConfirmPasswordEmpty && password !== confirmPassword

  const emailRequiredError = submitAttempted && isEmailEmpty
  const passwordRequiredError = submitAttempted && isPasswordEmpty
  const confirmPasswordRequiredError = submitAttempted && isRegisterMode && isConfirmPasswordEmpty

  const emailErrorMessage = emailFormatError ? 'Podaj poprawny adres email.' : ''
  const passwordErrorMessage = passwordLengthError
    ? 'Hasło musi mieć minimum 8 znaków.'
    : passwordUppercaseError
      ? 'Hasło musi zawierać co najmniej jedną wielką literę.'
      : passwordSpecialCharacterError
        ? 'Hasło musi zawierać co najmniej jeden znak specjalny.'
        : ''
  const confirmPasswordErrorMessage = confirmPasswordMismatchError ? 'Hasła muszą być takie same.' : ''

  const showEmailErrorMessage = emailFormatError && (touched.email || submitAttempted || email.length > 0)
  const showPasswordErrorMessage =
    (passwordLengthError || passwordUppercaseError || passwordSpecialCharacterError) &&
    (touched.password || submitAttempted || password.length > 0)
  const showConfirmPasswordErrorMessage =
    confirmPasswordMismatchError &&
    (touched.confirmPassword || submitAttempted || confirmPassword.length > 0)

  const emailFieldError = useAnimatedFieldError(emailErrorMessage, showEmailErrorMessage)
  const passwordFieldError = useAnimatedFieldError(passwordErrorMessage, showPasswordErrorMessage)
  const confirmPasswordFieldError = useAnimatedFieldError(
    confirmPasswordErrorMessage,
    showConfirmPasswordErrorMessage,
  )

  const emailHasError = emailRequiredError || emailFormatError
  const passwordHasError =
    passwordRequiredError || passwordLengthError || passwordUppercaseError || passwordSpecialCharacterError
  const confirmPasswordHasError =
    isRegisterMode && (confirmPasswordRequiredError || confirmPasswordMismatchError)

  const emailInputErrorClassName = [
    emailHasError ? 'ring-red-500 focus:ring-red-500' : '',
    emailRequiredError ? 'placeholder:text-red-500/90' : '',
  ]
    .join(' ')
    .trim()

  const passwordInputErrorClassName = [
    passwordHasError ? 'ring-red-500 focus:ring-red-500' : '',
    passwordRequiredError ? 'placeholder:text-red-500/90' : '',
  ]
    .join(' ')
    .trim()

  const confirmPasswordInputErrorClassName = [
    confirmPasswordHasError ? 'ring-red-500 focus:ring-red-500' : '',
    confirmPasswordRequiredError ? 'placeholder:text-red-500/90' : '',
  ]
    .join(' ')
    .trim()

  const hasValidationErrors = Boolean(
    emailRequiredError ||
      emailFormatError ||
      passwordRequiredError ||
      passwordLengthError ||
        passwordUppercaseError ||
        passwordSpecialCharacterError ||
      confirmPasswordRequiredError ||
      confirmPasswordMismatchError,
  )

  useEffect(() => {
    setShowPasswords(false)
  }, [isRegisterMode])

  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 768px)')
    const syncViewport = () => setIsDesktopViewport(mediaQuery.matches)

    syncViewport()
    mediaQuery.addEventListener('change', syncViewport)

    return () => mediaQuery.removeEventListener('change', syncViewport)
  }, [])

  useEffect(() => {
    setErrorMessage('')
    setInfoMessage('')
    setSubmitAttempted(false)
    setTouched({
      email: false,
      password: false,
      confirmPassword: false,
    })
  }, [isRegisterMode])

  const handleAuthSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    setErrorMessage('')
    setInfoMessage('')

    if (!isSupabaseConfigured) {
      setErrorMessage('Brak konfiguracji Supabase. Uzupełnij VITE_SUPABASE_URL i VITE_SUPABASE_ANON_KEY.')
      return
    }

    const normalizedEmail = email.trim().toLowerCase()

    setSubmitAttempted(true)

    setTouched({
      email: true,
      password: true,
      confirmPassword: isRegisterMode,
    })

    if (hasValidationErrors) {
      return
    }

    setIsSubmitting(true)

    try {
      if (isRegisterMode) {
        const { data, error } = await supabase.auth.signUp({
          email: normalizedEmail,
          password,
        })

        if (error) {
          setErrorMessage(mapSignUpErrorMessage(error.message))
          clearPendingSignupSession()
          return
        }

        const identitiesCount = data.user?.identities?.length ?? 0

        if (identitiesCount === 0) {
          setErrorMessage('Konto dla tego adresu już istnieje. Zaloguj się odpowiednią metodą (Email lub Google).')
          clearPendingSignupSession()
          return
        }

        const pendingExpiryAt = String(Date.now() + PENDING_SIGNUP_TTL_MS)

        sessionStorage.setItem('pending_signup_email', normalizedEmail)
        sessionStorage.setItem('pending_signup_started_at', pendingExpiryAt)

        localStorage.setItem('pending_signup_email', normalizedEmail)
        localStorage.setItem('pending_signup_started_at', pendingExpiryAt)
        window.history.pushState({}, '', '/verify-email')
        window.dispatchEvent(new PopStateEvent('popstate'))
        return
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      })

      if (error) {
        setErrorMessage(mapSignInErrorMessage(error.message))
      }
    } finally {
      setIsSubmitting(false)
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
        redirectTo: resolveOAuthRedirectUrl(),
      },
    })

    if (error) {
      setErrorMessage(error.message)
    }
  }

  return (
    <BackgroundBlobs>
      <Toast
        open={Boolean(errorMessage || infoMessage)}
        type={errorMessage ? 'error' : 'success'}
        title={errorMessage ? (useSoftErrorTitle ? 'Mamy problem!' : 'Mamy problem!') : 'Pełny sukces!'}
        message={errorMessage || infoMessage}
        position={isDesktopViewport ? 'top' : 'bottom'}
        durationMs={8000}
        onClose={() => {
          setErrorMessage('')
          setInfoMessage('')
        }}
      />

      <main className="flex flex-col min-h-screen bg-neutral sm:bg-transparent text-dark lg:max-w-5xl 2xl:max-w-[1440px] mx-auto w-full">
        <TopNavigation
          className="hidden md:block"
          leftSlot={<img src={logoLong} alt="Relme" className="h-8 w-auto" />}
        />

        <div className="flex-1 flex items-center my-10">
          <div className="mx-auto w-full max-w-[420px] 2sm:max-w-[480px] sm:max-w-[600px] px-6 xs:px-10 ">
            <div className='sm:bg-white sm:shadow-large sm:rounded-[32px] sm:p-14'>
            <h1 className="sm:text-center font-manrope text-[36px] xs:text-[40px] font-semibold tracking-[-0.8px] text-dark">
              {isRegisterMode ? 'Utwórz konto' : 'Witaj ponownie'}
            </h1>
            <p className="sm:text-center sm:mt-2 font-manrope text-[18px] font-normal tracking-[-0.4px] text-dark/85">
              {isRegisterMode
                ? 'Dołącz do naszej świadomej społeczności.'
                : 'Zaloguj się do swojego panelu.'}
            </p>

            <div className="mt-6 2xs:mt-8 2sm:mt-14 w-full">
              <SegmentedControl
                value={authMode}
                onChange={(value) => setAuthMode(value as AuthMode)}
                distribution="equal"
                fullWidth
                options={[
                  { value: 'login', label: 'Zaloguj się' },
                  { value: 'register', label: 'Zarejestruj się' },
                ]}
              />
            </div>

            <div className="mt-4 2xs:mt-6 2sm:mt-10 w-full">
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

            <div className="mt-4 2xs:mt-6 2sm:mt-10 flex items-center gap-4">
              <span className="h-px flex-1 bg-dark/10" />
              <span className="font-manrope text-[11px] font-semibold uppercase tracking-[0.6px] text-dark/50">
                LUB EMAIL
              </span>
              <span className="h-px flex-1 bg-dark/10" />
            </div>
            <form className="mt-4 2xs:mt-6 2sm:mt-10" onSubmit={handleAuthSubmit}>
              <Input
                fullWidth
                label="Adres email"
                name="email"
                type="email"
                placeholder="Podaj adres email"
                inputClassName={emailInputErrorClassName}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                onBlur={() => {
                  setTouched((previous) => ({ ...previous, email: true }))
                }}
                disabled={isSubmitting}
                autoComplete="email"
              />

              <div
                className={`mt-2 overflow-hidden transition-[max-height,opacity,transform] duration-200 ease-in-out ${
                  emailFieldError.isVisible
                    ? 'max-h-12 translate-y-0 opacity-100'
                    : 'max-h-0 -translate-y-1 opacity-0'
                }`}
              >
                <p className="pl-2 font-manrope text-[12px] sm:text-sm font-medium text-red-700">{emailFieldError.content}</p>
              </div>

              <PasswordInput
                fullWidth
                label="Hasło"
                name="password"
                placeholder="Podaj hasło"
                inputClassName={passwordInputErrorClassName}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                onBlur={() => {
                  setTouched((previous) => ({ ...previous, password: true }))
                }}
                isVisible={showPasswords}
                onVisibilityChange={setShowPasswords}
                actionLabel={isRegisterMode ? undefined : 'Nie pamiętasz hasła?'}
                onActionClick={isRegisterMode ? undefined : () => {}}
                wrapperClassName="mt-4 sm:mt-8"
                disabled={isSubmitting}
                autoComplete={isRegisterMode ? 'new-password' : 'current-password'}
              />

              <div
                className={`mt-2 overflow-hidden transition-[max-height,opacity,transform] duration-200 ease-in-out ${
                  passwordFieldError.isVisible
                    ? 'max-h-14 translate-y-0 opacity-100'
                    : 'max-h-0 -translate-y-1 opacity-0'
                }`}
              >
                <p className="pl-2 font-manrope text-[12px] sm:text-sm font-medium text-red-700">{passwordFieldError.content}</p>
              </div>

              <div
                className={`grid overflow-hidden origin-top transition-all duration-300 ease-out ${
                  isRegisterMode
                    ? 'mt-4 sm:mt-8 grid-rows-[1fr] opacity-100 translate-y-0'
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
                    inputClassName={confirmPasswordInputErrorClassName}
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    onBlur={() => {
                      setTouched((previous) => ({ ...previous, confirmPassword: true }))
                    }}
                    isVisible={showPasswords}
                    onVisibilityChange={setShowPasswords}
                    disabled={!isRegisterMode || isSubmitting}
                    autoComplete="new-password"
                  />

                  <div
                    className={`mt-2 overflow-hidden transition-[max-height,opacity,transform] duration-200 ease-in-out ${
                      confirmPasswordFieldError.isVisible
                        ? 'max-h-12 translate-y-0 opacity-100'
                        : 'max-h-0 -translate-y-1 opacity-0'
                    }`}
                  >
                    <p className="pl-2 font-manrope text-[12px] sm:text-sm font-medium text-red-700">{confirmPasswordFieldError.content}</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 2xs:mt-8 2sm:mt-14 w-full">
                <Button fullWidth type="submit" disabled={isSubmitting}>
                  {isRegisterMode ? 'Zarejestruj się' : 'Zaloguj się'}
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