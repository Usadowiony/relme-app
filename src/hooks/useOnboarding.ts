import { useEffect, useMemo, useState } from 'react'
import { isSupabaseConfigured, supabase } from '../api/supabase'
import { getMyProfile, updateMyProfile } from '../api/profile.api'
import type { Profile, ProfileGender } from '../types/auth'

const NAME_MIN_LENGTH = 2
const NAME_MAX_LENGTH = 60
const namePattern = /^[\p{L}][\p{L}\s'-]*$/u

export function mapProfileSaveErrorMessage(message: string) {
  const normalized = message.toLowerCase()
  if (normalized.includes('row-level security') || normalized.includes('permission denied')) {
    return 'Brak uprawnien do zapisu profilu. Sprobuj zalogowac sie ponownie.'
  }
  if (normalized.includes('network') || normalized.includes('failed to fetch')) {
    return 'Problem z polaczeniem. Sprawdz internet i sprobuj ponownie.'
  }
  return 'Nie udalo sie zapisac danych. Sprobuj ponownie.'
}

export function normalizePersonName(value: string) {
  return value.trim().replace(/\s{2,}/g, ' ')
}

export function getPersonNameError(label: 'Imię' | 'Nazwisko', value: string) {
  const normalized = normalizePersonName(value)
  if (normalized.length === 0) return `${label} jest wymagane.`
  if (normalized.length < NAME_MIN_LENGTH) return `${label} musi mieć minimum ${NAME_MIN_LENGTH} znaki.`
  if (normalized.length > NAME_MAX_LENGTH) return `${label} może mieć maksymalnie ${NAME_MAX_LENGTH} znaków.`
  if (!namePattern.test(normalized)) return `${label} może zawierać tylko litery, spacje, apostrof i myślnik.`
  return ''
}

export function isAtLeast18YearsOld(dateOfBirth: string) {
  const birthDate = new Date(dateOfBirth)
  if (Number.isNaN(birthDate.getTime())) return false
  const today = new Date()
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDelta = today.getMonth() - birthDate.getMonth()
  if (monthDelta < 0 || (monthDelta === 0 && today.getDate() < birthDate.getDate())) age -= 1
  return age >= 18
}

export function getDateOfBirthError(value: string, todayDate: string) {
  const normalized = value.trim()
  if (normalized.length === 0) return 'Data urodzenia jest wymagana.'
  const birthDate = new Date(normalized)
  if (Number.isNaN(birthDate.getTime()) || normalized > todayDate) return 'Podaj poprawną datę urodzenia.'
  if (!isAtLeast18YearsOld(normalized)) return 'Musisz mieć ukończone 18 lat.'
  return ''
}

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

export function useOnboarding() {
  const [isLoadingProfile, setIsLoadingProfile] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [mobileStep, setMobileStep] = useState<1 | 2>(1)

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [gender, setGender] = useState<ProfileGender>('female')

  const [formErrorMessage, setFormErrorMessage] = useState('')
  const [submitAttempted, setSubmitAttempted] = useState(false)
  const [nextStepAttempted, setNextStepAttempted] = useState(false)
  const [touched, setTouched] = useState({
    firstName: false,
    lastName: false,
    dateOfBirth: false,
  })

  useEffect(() => {
    let isMounted = true

    const loadProfile = async () => {
      setIsLoadingProfile(true)
      setFormErrorMessage('')

      try {
        const profile = await getMyProfile()
        if (!isMounted) return

        const selectedGender =
          profile.gender === 'male' || profile.gender === 'female' || profile.gender === 'other'
            ? profile.gender
            : 'female'

        setFirstName(profile.first_name ?? '')
        setLastName(profile.last_name ?? '')
        setDateOfBirth(profile.date_of_birth ?? '')
        setGender(selectedGender)
      } catch {
        if (!isMounted) return
        setFormErrorMessage('Nie udalo sie pobrac Twojego profilu. Odswiez strone i sprobuj ponownie.')
      } finally {
        if (isMounted) setIsLoadingProfile(false)
      }
    }

    void loadProfile()

    return () => {
      isMounted = false
    }
  }, [])

  const todayDate = useMemo(() => new Date().toISOString().split('T')[0], [])

  const firstNameErrorMessage = getPersonNameError('Imię', firstName)
  const lastNameErrorMessage = getPersonNameError('Nazwisko', lastName)
  const dateOfBirthErrorMessage = getDateOfBirthError(dateOfBirth, todayDate)

  const showFirstNameError =
    Boolean(firstNameErrorMessage) &&
    (touched.firstName || submitAttempted || nextStepAttempted || firstName.length > 0)
  const showLastNameError =
    Boolean(lastNameErrorMessage) &&
    (touched.lastName || submitAttempted || nextStepAttempted || lastName.length > 0)
  const showDateOfBirthError =
    Boolean(dateOfBirthErrorMessage) &&
    (touched.dateOfBirth || submitAttempted || dateOfBirth.length > 0)

  const firstNameFieldError = useAnimatedFieldError(firstNameErrorMessage, showFirstNameError)
  const lastNameFieldError = useAnimatedFieldError(lastNameErrorMessage, showLastNameError)
  const dateOfBirthFieldError = useAnimatedFieldError(dateOfBirthErrorMessage, showDateOfBirthError)

  const hasFirstNameError = Boolean(firstNameErrorMessage)
  const hasLastNameError = Boolean(lastNameErrorMessage)
  const hasDateOfBirthError = Boolean(dateOfBirthErrorMessage)

  const canProceedToMobileStepTwo = !(isLoadingProfile || isSubmitting || hasFirstNameError || hasLastNameError)

  const canSubmit = useMemo(() => {
    return !(isLoadingProfile || isSubmitting || hasFirstNameError || hasLastNameError || hasDateOfBirthError)
  }, [hasDateOfBirthError, hasFirstNameError, hasLastNameError, isLoadingProfile, isSubmitting])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.history.replaceState({}, '', '/login')
    window.dispatchEvent(new PopStateEvent('popstate'))
  }

  const handleNextMobileStep = () => {
    setFormErrorMessage('')
    setNextStepAttempted(true)
    setTouched((previous) => ({ ...previous, firstName: true, lastName: true }))

    if (!canProceedToMobileStepTwo) return

    setMobileStep(2)
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFormErrorMessage('')
    setSubmitAttempted(true)
    setTouched((previous) => ({
      ...previous,
      firstName: true,
      lastName: true,
      dateOfBirth: true,
    }))

    if (!isSupabaseConfigured) {
      setFormErrorMessage('Brak konfiguracji Supabase. Ustaw zmienne srodowiskowe i sprobuj ponownie.')
      return
    }

    if (!canSubmit) return

    setIsSubmitting(true)

    try {
      const updates: Partial<Profile> = {
        first_name: normalizePersonName(firstName),
        last_name: normalizePersonName(lastName),
        gender,
        date_of_birth: dateOfBirth.trim(),
      }

      await updateMyProfile(updates)

      window.history.replaceState({}, '', '/')
      window.dispatchEvent(new PopStateEvent('popstate'))
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      setFormErrorMessage(mapProfileSaveErrorMessage(message))
    } finally {
      setIsSubmitting(false)
    }
  }

  return {
    isLoadingProfile,
    isSubmitting,
    mobileStep,
    setMobileStep,
    firstName,
    setFirstName,
    lastName,
    setLastName,
    dateOfBirth,
    setDateOfBirth,
    gender,
    setGender,
    formErrorMessage,
    touched,
    setTouched,
    todayDate,
    showFirstNameError,
    showLastNameError,
    showDateOfBirthError,
    firstNameFieldError,
    lastNameFieldError,
    dateOfBirthFieldError,
    canProceedToMobileStepTwo,
    canSubmit,
    handleSignOut,
    handleNextMobileStep,
    handleSubmit,
    NAME_MAX_LENGTH,
  }
}
