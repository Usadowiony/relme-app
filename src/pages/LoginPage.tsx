import googleLogo from '../assets/icons/google-logo.svg'
import logoLong from '../assets/icons/logo-long.svg'
import Button from '../components/ui/buttons/Button'
import SegmentedControl from '../components/ui/buttons/SegmentedControl'
import Input from '../components/ui/inputs/Input'
import PasswordInput from '../components/ui/inputs/PasswordInput'
import Toast from '../components/ui/popups/Toast'
import TopNavigation from '../components/layout/Navbar/TopNavigation'
import BackgroundBlobs from '../components/layout/BackgroundBlobs'
import { useAuthForms, type AuthMode } from '../hooks/useAuthForms'

function LoginPage() {
  const {
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
  } = useAuthForms()

  const emailInputErrorClassName = [
    emailHasError ? 'ring-red-500 focus:ring-red-500' : '',
    emailRequiredError ? 'placeholder:text-red-500/90' : '',
  ].join(' ').trim()

  const passwordInputErrorClassName = [
    passwordHasError ? 'ring-red-500 focus:ring-red-500' : '',
    passwordRequiredError ? 'placeholder:text-red-500/90' : '',
  ].join(' ').trim()

  const confirmPasswordInputErrorClassName = [
    confirmPasswordHasError ? 'ring-red-500 focus:ring-red-500' : '',
    confirmPasswordRequiredError ? 'placeholder:text-red-500/90' : '',
  ].join(' ').trim()

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
