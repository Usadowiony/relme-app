import { useEffect, useMemo, useState } from 'react'
import { ChevronRight, LogOut } from 'lucide-react'
import logoLong from '../assets/icons/logo-long.svg'
import Button from '../components/atoms/buttons/Button'
import SegmentedControl from '../components/atoms/buttons/SegmentedControl'
import Input from '../components/atoms/inputs/Input'
import TopNavigation from '../components/organisms/Navbar/TopNavigation'
import BackgroundBlobs from '../components/templates/BackgroundBlobs'
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient'
import {
  getMyProfile,
  updateMyProfile,
  type Profile,
  type ProfileGender,
} from '../profile/profileApi'

type GenderOption = {
  value: ProfileGender
  label: string
}

const genderOptions: GenderOption[] = [
  { value: 'male', label: 'Mężczyzna' },
  { value: 'female', label: 'Kobieta' },
  { value: 'other', label: 'Inne' },
]

const NAME_MIN_LENGTH = 2
const NAME_MAX_LENGTH = 60
const namePattern = /^[\p{L}][\p{L}\s'-]*$/u

function mapProfileSaveErrorMessage(message: string) {
  const normalized = message.toLowerCase()

  if (normalized.includes('row-level security') || normalized.includes('permission denied')) {
    return 'Brak uprawnien do zapisu profilu. Sprobuj zalogowac sie ponownie.'
  }

  if (normalized.includes('network') || normalized.includes('failed to fetch')) {
    return 'Problem z polaczeniem. Sprawdz internet i sprobuj ponownie.'
  }

  return 'Nie udalo sie zapisac danych. Sprobuj ponownie.'
}

function normalizePersonName(value: string) {
  return value.trim().replace(/\s{2,}/g, ' ')
}

function getPersonNameError(label: 'Imię' | 'Nazwisko', value: string) {
  const normalized = normalizePersonName(value)

  if (normalized.length === 0) {
    return `${label} jest wymagane.`
  }

  if (normalized.length < NAME_MIN_LENGTH) {
    return `${label} musi mieć minimum ${NAME_MIN_LENGTH} znaki.`
  }

  if (normalized.length > NAME_MAX_LENGTH) {
    return `${label} może mieć maksymalnie ${NAME_MAX_LENGTH} znaków.`
  }

  if (!namePattern.test(normalized)) {
    return `${label} może zawierać tylko litery, spacje, apostrof i myślnik.`
  }

  return ''
}

function isAtLeast18YearsOld(dateOfBirth: string) {
  const birthDate = new Date(dateOfBirth)

  if (Number.isNaN(birthDate.getTime())) {
    return false
  }

  const today = new Date()
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDelta = today.getMonth() - birthDate.getMonth()

  if (monthDelta < 0 || (monthDelta === 0 && today.getDate() < birthDate.getDate())) {
    age -= 1
  }

  return age >= 18
}

function getDateOfBirthError(value: string, todayDate: string) {
  const normalized = value.trim()

  if (normalized.length === 0) {
    return 'Data urodzenia jest wymagana.'
  }

  const birthDate = new Date(normalized)

  if (Number.isNaN(birthDate.getTime()) || normalized > todayDate) {
    return 'Podaj poprawną datę urodzenia.'
  }

  if (!isAtLeast18YearsOld(normalized)) {
    return 'Musisz mieć ukończone 18 lat.'
  }

  return ''
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

function OnboardingPage() {
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

        if (!isMounted) {
          return
        }

        const selectedGender =
          profile.gender === 'male' || profile.gender === 'female' || profile.gender === 'other'
            ? profile.gender
            : 'female'

        setFirstName(profile.first_name ?? '')
        setLastName(profile.last_name ?? '')
        setDateOfBirth(profile.date_of_birth ?? '')
        setGender(selectedGender)
      } catch {
        if (!isMounted) {
          return
        }

        setFormErrorMessage('Nie udalo sie pobrac Twojego profilu. Odswiez strone i sprobuj ponownie.')
      } finally {
        if (isMounted) {
          setIsLoadingProfile(false)
        }
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

  const firstNameInputErrorClassName = showFirstNameError ? 'ring-red-500 focus:ring-red-500' : ''
  const lastNameInputErrorClassName = showLastNameError ? 'ring-red-500 focus:ring-red-500' : ''
  const dateOfBirthInputErrorClassName = showDateOfBirthError ? 'ring-red-500 focus:ring-red-500' : ''

  const hasFirstNameError = Boolean(firstNameErrorMessage)
  const hasLastNameError = Boolean(lastNameErrorMessage)
  const hasDateOfBirthError = Boolean(dateOfBirthErrorMessage)

  const canProceedToMobileStepTwo = !(
    isLoadingProfile ||
    isSubmitting ||
    hasFirstNameError ||
    hasLastNameError
  )

  const canSubmit = useMemo(() => {
    return !(
      isLoadingProfile ||
      isSubmitting ||
      hasFirstNameError ||
      hasLastNameError ||
      hasDateOfBirthError
    )
  }, [
    hasDateOfBirthError,
    hasFirstNameError,
    hasLastNameError,
    isLoadingProfile,
    isSubmitting,
  ])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.history.replaceState({}, '', '/login')
    window.dispatchEvent(new PopStateEvent('popstate'))
  }

  const handleNextMobileStep = () => {
    setFormErrorMessage('')
    setNextStepAttempted(true)
    setTouched((previous) => ({
      ...previous,
      firstName: true,
      lastName: true,
    }))

    if (!canProceedToMobileStepTwo) {
      return
    }

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

    if (!canSubmit) {
      return
    }

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

  const renderFieldError = (content: string, isVisible: boolean) => (
    <div
      className={`mt-2 overflow-hidden transition-[max-height,opacity,transform] duration-200 ease-in-out ${
        isVisible
          ? 'max-h-14 translate-y-0 opacity-100'
          : 'max-h-0 -translate-y-1 opacity-0'
      }`}
    >
      <p className="pl-2 font-manrope text-[12px] sm:text-sm font-medium text-red-700">{content}</p>
    </div>
  )

  return (
    <BackgroundBlobs>
      <main className="flex min-h-svh flex-col bg-neutral px-6 py-8 text-dark sm:bg-transparent lg:max-w-5xl 2xl:max-w-[1440px] mx-auto w-full">
        <TopNavigation
          className="hidden md:block"
          leftSlot={<img src={logoLong} alt="Relme" className="h-8 w-auto" />}
          rightSlot={
            <button
              type="button"
              onClick={() => {
                void handleSignOut()
              }}
              className="inline-flex items-center gap-2 font-manrope text-sm font-semibold text-dark/85 underline-offset-4 hover:underline"
            >
              <LogOut className="size-4" />
              Wyloguj sie
            </button>
          }
        />

        <div className="mx-auto mt-2 w-full max-w-[760px] xs:px-4 2sm:px-14 sm:px-0 sm:max-w-[500px] sm:mx-auto sm:mt-14 md:max-w-[600px] lg:max-w-[700px] flex flex-1 flex-col sm:flex-none">
          <h1 className="mt-10 text-[40px] xs:text-[48px] leading-[1.05] font-semibold tracking-[-1.2px] text-dark sm:text-[60px]">
            Opowiedz nam
            <br className="lg:hidden" />
            <span className="text-primary"> o sobie</span>
          </h1>

          <p className="mt-5 xs:mt-7 max-w-[560px] font-manrope text-[18px] xs:text-[20px] font-normal tracking-[-0.2px] text-dark/80">
            {mobileStep === 1
              ? 'Nie chcesz być chyba dla nas nieznajomym, prawda?'
              : 'Potrzebujemy jeszcze kilku informacji zanim zaczniemy.'}
          </p>

          <div className="mt-8 xs:mt-12 rounded-[28px] p-0 sm:mt-14 sm:rounded-[30px] sm:bg-white sm:p-10 sm:shadow-large flex flex-1 flex-col">
            <form onSubmit={handleSubmit} className="flex flex-1 flex-col">
              <div className="hidden sm:block md:p-2 lg:p-4">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <Input
                      label="Imię"
                      name="firstName"
                      placeholder="Twoje imię"
                      maxLength={NAME_MAX_LENGTH}
                      inputClassName={firstNameInputErrorClassName}
                      value={firstName}
                      onChange={(event) => setFirstName(event.target.value)}
                      onBlur={() => {
                        setTouched((previous) => ({ ...previous, firstName: true }))
                      }}
                      disabled={isLoadingProfile || isSubmitting}
                      autoComplete="given-name"
                    />
                    {renderFieldError(firstNameFieldError.content, firstNameFieldError.isVisible)}
                  </div>

                  <div>
                    <Input
                      label="Nazwisko"
                      name="lastName"
                      placeholder="Kowalski"
                      maxLength={NAME_MAX_LENGTH}
                      inputClassName={lastNameInputErrorClassName}
                      value={lastName}
                      onChange={(event) => setLastName(event.target.value)}
                      onBlur={() => {
                        setTouched((previous) => ({ ...previous, lastName: true }))
                      }}
                      disabled={isLoadingProfile || isSubmitting}
                      autoComplete="family-name"
                    />
                    {renderFieldError(lastNameFieldError.content, lastNameFieldError.isVisible)}
                  </div>
                </div>

                <div className="mt-6 md:mt-10 grid gap-4 ">
                  <div>
                    <Input
                      label="Data urodzenia"
                      name="dateOfBirth"
                      type="date"
                      inputClassName={dateOfBirthInputErrorClassName}
                      value={dateOfBirth}
                      onChange={(event) => setDateOfBirth(event.target.value)}
                      onBlur={() => {
                        setTouched((previous) => ({ ...previous, dateOfBirth: true }))
                      }}
                      disabled={isLoadingProfile || isSubmitting}
                      autoComplete="bday"
                      max={todayDate}
                    />
                    {renderFieldError(dateOfBirthFieldError.content, dateOfBirthFieldError.isVisible)}
                  </div>
                </div>

                <div className="mt-6 md:mt-10">
                  <p className="mb-2 block pl-[8px] font-manrope text-[11px] font-semibold uppercase tracking-[0.6px] text-dark transition-colors duration-200 group-focus-within:text-primary">
                    Płeć
                  </p>
                  <SegmentedControl
                    value={gender}
                    onChange={(nextValue) => setGender(nextValue as ProfileGender)}
                    distribution="equal"
                    fullWidth
                    options={genderOptions}
                  />
                </div>

                <div className="mt-12 md:mt-18 lg:mt-20 mx-auto w-full">
                  {formErrorMessage ? (
                    <p className="mb-4 text-center font-manrope text-[12px] sm:text-sm font-medium text-red-700">
                      {formErrorMessage}
                    </p>
                  ) : null}

                  <Button fullWidth type="submit" disabled={!canSubmit}>
                    <span className="inline-flex items-center gap-2">
                      Rozpocznij Quiz
                      <ChevronRight className="size-4" />
                    </span>
                  </Button>
                </div>
              </div>

              <div className="sm:hidden flex flex-1 flex-col">
                <div className="flex-1 flex items-start justify-center py-2">
                  {mobileStep === 1 ? (
                    <div className="w-full grid grid-cols-1 gap-8">
                      <div>
                        <Input
                          label="Imię"
                          name="firstName"
                          placeholder="Twoje imię"
                          maxLength={NAME_MAX_LENGTH}
                          inputClassName={firstNameInputErrorClassName}
                          value={firstName}
                          onChange={(event) => setFirstName(event.target.value)}
                          onBlur={() => {
                            setTouched((previous) => ({ ...previous, firstName: true }))
                          }}
                          disabled={isLoadingProfile || isSubmitting}
                          autoComplete="given-name"
                        />
                        {renderFieldError(firstNameFieldError.content, firstNameFieldError.isVisible)}
                      </div>

                      <div>
                        <Input
                          label="Nazwisko"
                          name="lastName"
                          placeholder="Twoje nazwisko"
                          maxLength={NAME_MAX_LENGTH}
                          inputClassName={lastNameInputErrorClassName}
                          value={lastName}
                          onChange={(event) => setLastName(event.target.value)}
                          onBlur={() => {
                            setTouched((previous) => ({ ...previous, lastName: true }))
                          }}
                          disabled={isLoadingProfile || isSubmitting}
                          autoComplete="family-name"
                        />
                        {renderFieldError(lastNameFieldError.content, lastNameFieldError.isVisible)}
                      </div>
                    </div>
                  ) : (
                    <div className="w-full space-y-6">
                      <div>
                        <Input
                          label="Data urodzenia"
                          name="dateOfBirth"
                          type="date"
                          inputClassName={dateOfBirthInputErrorClassName}
                          value={dateOfBirth}
                          onChange={(event) => setDateOfBirth(event.target.value)}
                          onBlur={() => {
                            setTouched((previous) => ({ ...previous, dateOfBirth: true }))
                          }}
                          disabled={isLoadingProfile || isSubmitting}
                          autoComplete="bday"
                          max={todayDate}
                        />
                        {renderFieldError(dateOfBirthFieldError.content, dateOfBirthFieldError.isVisible)}
                      </div>

                      <div>
                        <p className="mb-2 block pl-[8px] font-manrope text-[11px] font-semibold uppercase tracking-[0.6px] text-dark transition-colors duration-200 group-focus-within:text-primary">
                          Płeć
                        </p>
                        <SegmentedControl
                          value={gender}
                          onChange={(nextValue) => setGender(nextValue as ProfileGender)}
                          distribution="equal"
                          fullWidth
                          options={genderOptions}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-auto pt-6 pb-[calc(env(safe-area-inset-bottom)+8px)]">
                  {formErrorMessage ? (
                    <p className="mb-4 text-center font-manrope text-[12px] sm:text-sm font-medium text-red-700">
                      {formErrorMessage}
                    </p>
                  ) : null}

                  {mobileStep === 1 ? (
                    <div className="mx-auto w-full">
                      <Button
                        fullWidth
                        type="button"
                        disabled={!canProceedToMobileStepTwo}
                        onClick={handleNextMobileStep}
                      >
                        <span className="inline-flex items-center gap-2">
                          Dalej
                          <ChevronRight className="size-4" />
                        </span>
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="mb-4 xs:mb-6 text-center">
                        <button
                          type="button"
                          onClick={() => setMobileStep(1)}
                          className="font-manrope text-sm font-semibold text-dark/75 underline-offset-4 hover:underline"
                        >
                          Wróć do poprzedniego kroku
                        </button>
                      </div>
                      <div className="mx-auto w-full">
                        <Button fullWidth type="submit" disabled={!canSubmit}>
                          <span className="inline-flex items-center gap-2">
                            Rozpocznij Quiz
                            <ChevronRight className="size-4" />
                          </span>
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>
      </main>
    </BackgroundBlobs>
  )
}

export default OnboardingPage
