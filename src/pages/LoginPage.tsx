import { useEffect, useState } from 'react'
import googleLogo from '../assets/icons/google-logo.svg'
import logoLong from '../assets/icons/logo-long.svg'
import Button from '../components/atoms/buttons/Button'
import SegmentedControl from '../components/atoms/buttons/SegmentedControl'
import Input from '../components/atoms/inputs/Input'
import PasswordInput from '../components/atoms/inputs/PasswordInput'
import TopNavigation from '../components/organisms/Navbar/TopNavigation'
import BackgroundBlobs from '../components/templates/BackgroundBlobs'

function LoginPage() {
  const [authMode, setAuthMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const isRegisterMode = authMode === 'register'
  const [showPasswords, setShowPasswords] = useState(false)

  useEffect(() => {
    setShowPasswords(isRegisterMode)
  }, [isRegisterMode])

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
                onChange={setAuthMode}
                distribution="equal"
                fullWidth
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

            <div className="mt-6 2xs:mt-8 2sm:mt-10">
              <Input
                fullWidth
                label="Adres email"
                name="email"
                type="email"
                placeholder="Podaj adres email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
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
                    disabled={!isRegisterMode}
                  />
                </div>
              </div>
            </div>

            <div className="mt-10 2xs:mt-12 2sm:mt-14 w-full">
              <Button fullWidth>{isRegisterMode ? 'Zarejestruj się' : 'Zaloguj się'}</Button>
            </div>
            </div>
          </div>
        </div>
      </main>
    </BackgroundBlobs>
  )
}

export default LoginPage