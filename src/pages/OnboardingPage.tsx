import { ChevronRight, LogOut } from 'lucide-react'
import logoLong from '../assets/icons/logo-long.svg'
import Button from '../components/ui/buttons/Button'
import SegmentedControl from '../components/ui/buttons/SegmentedControl'
import Input from '../components/ui/inputs/Input'
import TopNavigation from '../components/layout/Navbar/TopNavigation'
import BackgroundBlobs from '../components/layout/BackgroundBlobs'
import { useOnboarding } from '../hooks/useOnboarding'
import { type ProfileGender } from '../api/profile.api'

type GenderOption = {
  value: ProfileGender
  label: string
}

const genderOptions: GenderOption[] = [
  { value: 'male', label: 'Mężczyzna' },
  { value: 'female', label: 'Kobieta' },
  { value: 'other', label: 'Inne' },
]

function OnboardingPage() {
  const {
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
  } = useOnboarding()

  const firstNameInputErrorClassName = showFirstNameError ? 'ring-red-500 focus:ring-red-500' : ''
  const lastNameInputErrorClassName = showLastNameError ? 'ring-red-500 focus:ring-red-500' : ''
  const dateOfBirthInputErrorClassName = showDateOfBirthError ? 'ring-red-500 focus:ring-red-500' : ''

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
