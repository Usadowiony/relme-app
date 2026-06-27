import { useState, useEffect, type FormEvent } from 'react'
import { useAnimatedFieldError } from './useAnimatedFieldError'
import { useNavigate } from 'react-router-dom'
import { isSupabaseConfigured } from '../api/supabase'
import {
  clearPendingSignupSession,
  mapSignInErrorMessage,
  mapSignUpErrorMessage,
  signInWithEmail,
  signInWithGoogle,
  signUpWithEmail,
  isEmailNotConfirmedError,
} from '../api/auth.api'

export type AuthMode = 'login' | 'register'

export const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
export const uppercasePattern = /[A-Z]/
export const specialCharacterPattern = /[^A-Za-z0-9]/


export function useAuthForms() {
  const navigate = useNavigate()
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
    isRegisterMode && !isPasswordEmpty && !passwordLengthError && !specialCharacterPattern.test(password)
  const confirmPasswordMismatchError = isRegisterMode && !isConfirmPasswordEmpty && password !== confirmPassword

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
    confirmPasswordMismatchError && (touched.confirmPassword || submitAttempted || confirmPassword.length > 0)

  const emailFieldError = useAnimatedFieldError(emailErrorMessage, showEmailErrorMessage)
  const passwordFieldError = useAnimatedFieldError(passwordErrorMessage, showPasswordErrorMessage)
  const confirmPasswordFieldError = useAnimatedFieldError(confirmPasswordErrorMessage, showConfirmPasswordErrorMessage)

  const emailHasError = emailRequiredError || emailFormatError
  const passwordHasError = passwordRequiredError || passwordLengthError || passwordUppercaseError || passwordSpecialCharacterError
  const confirmPasswordHasError = isRegisterMode && (confirmPasswordRequiredError || confirmPasswordMismatchError)

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
    setTouched({ email: false, password: false, confirmPassword: false })
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
    setTouched({ email: true, password: true, confirmPassword: isRegisterMode })

    if (hasValidationErrors) return

    setIsSubmitting(true)

    try {
      if (isRegisterMode) {
        const { data, error } = await signUpWithEmail(normalizedEmail, password)

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

        navigate('/verify-email')
        return
      }

      const { error } = await signInWithEmail(normalizedEmail, password)

      if (error) {
        if (isEmailNotConfirmedError(error.message)) {
          // Ustaw dane oczekującej weryfikacji, żeby EmailVerificationPage zadziałała
          const pendingExpiryAt = String(Date.now() + 15 * 60 * 1000)
          sessionStorage.setItem('pending_signup_email', normalizedEmail)
          sessionStorage.setItem('pending_signup_started_at', pendingExpiryAt)
          
          navigate('/verify-email')
          return
        }
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

    const { error } = await signInWithGoogle()
    if (error) setErrorMessage(error.message)
  }

  return {
    authMode,
    setAuthMode,
    email,
    setEmail,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    isSubmitting,
    errorMessage,
    setErrorMessage,
    infoMessage,
    setInfoMessage,
    setTouched,
    isRegisterMode,
    showPasswords,
    setShowPasswords,
    isDesktopViewport,
    useSoftErrorTitle,
    emailHasError,
    passwordHasError,
    confirmPasswordHasError,
    emailRequiredError,
    passwordRequiredError,
    confirmPasswordRequiredError,
    emailFieldError,
    passwordFieldError,
    confirmPasswordFieldError,
    handleAuthSubmit,
    handleGoogleAuth,
  }
}
