import { useState } from 'react'
import googleLogo from '../assets/icons/google-logo.svg'
import Button from '../components/ui/buttons/Button'
import Input from '../components/ui/inputs/Input'
import PasswordInput from '../components/ui/inputs/PasswordInput'
import SegmentedControl from '../components/ui/buttons/SegmentedControl'
import Toast from '../components/ui/popups/Toast'

const colorSwatches = [
  { name: 'Primary', hex: '#245A65', bgClass: 'bg-primary', textClass: 'text-white' },
  { name: 'Primary 2', hex: '#599896', bgClass: 'bg-primary-2', textClass: 'text-white' },
  { name: 'Secondary', hex: '#526798', bgClass: 'bg-secondary', textClass: 'text-white' },
  { name: 'Secondary 2', hex: '#5D4B79', bgClass: 'bg-secondary-2', textClass: 'text-white' },
  { name: 'Black', hex: '#0E0F10', bgClass: 'bg-black', textClass: 'text-white' },
  { name: 'Dark', hex: '#1A1B1E', bgClass: 'bg-dark', textClass: 'text-white' },
  { name: 'Neutral', hex: '#FBFBF8', bgClass: 'bg-neutral', textClass: 'text-dark' },
  { name: 'Gray', hex: '#EEEEEC', bgClass: 'bg-gray', textClass: 'text-dark' },
]

const typographyScale = [
  { token: '2xs', px: '10px', rem: '0.625rem', textClass: 'text-2xs' },
  { token: 'xs', px: '12px', rem: '0.75rem', textClass: 'text-xs' },
  { token: 'sm', px: '14px', rem: '0.875rem', textClass: 'text-sm' },
  { token: 'base', px: '16px', rem: '1.0rem', textClass: 'text-base' },
  { token: 'lg', px: '18px', rem: '1.125rem', textClass: 'text-lg' },
  { token: 'xl', px: '20px', rem: '1.25rem', textClass: 'text-xl' },
  { token: '2xl', px: '24px', rem: '1.5rem', textClass: 'text-2xl' },
  { token: '3xl', px: '30px', rem: '1.875rem', textClass: 'text-3xl' },
  { token: '4xl', px: '36px', rem: '2.25rem', textClass: 'text-4xl' },
  { token: '5xl', px: '48px', rem: '3.0rem', textClass: 'text-5xl' },
  { token: '6xl', px: '60px', rem: '3.75rem', textClass: 'text-6xl' },
]

const typographyWeights = [
  { token: 'extralight', className: 'font-extralight', value: '200' },
  { token: 'light', className: 'font-light', value: '300' },
  { token: 'normal', className: 'font-normal', value: '400' },
  { token: 'medium', className: 'font-medium', value: '500' },
  { token: 'semibold', className: 'font-semibold', value: '600' },
  { token: 'bold', className: 'font-bold', value: '700' },
  { token: 'extrabold', className: 'font-extrabold', value: '800' },
]

const typographyFamilies = [
  { name: 'Manrope', className: 'font-manrope' },
  { name: 'Inter', className: 'font-inter' },
]

function DesignSandbox() {
  const [authMode, setAuthMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [toastState, setToastState] = useState<{
    open: boolean
    type: 'success' | 'warning' | 'error' | 'info'
    title: string
    message: string
    position: 'top' | 'bottom'
    durationMs: number
  }>({
    open: false,
    type: 'info',
    title: '',
    message: '',
    position: 'top',
    durationMs: 5000,
  })

  const showToast = (scenario: {
    type: 'success' | 'warning' | 'error' | 'info'
    title: string
    message: string
    position: 'top' | 'bottom'
    durationMs: number
  }) => {
    setToastState({
      open: true,
      ...scenario,
    })
  }

  return (
    <main className="min-h-screen bg-neutral text-dark">
      <Toast
        open={toastState.open}
        type={toastState.type}
        title={toastState.title}
        message={toastState.message}
        position={toastState.position}
        durationMs={toastState.durationMs}
        onClose={() => {
          setToastState((previous) => ({ ...previous, open: false }))
        }}
      />

      <div className="mx-auto w-full max-w-6xl px-6 py-12 md:py-16">
        <header>
          <p className="font-manrope text-[10px] font-semibold uppercase tracking-[0.6px] text-dark/70">
            Design Sandbox
          </p>
          <h1 className="mt-3 text-3xl font-semibold md:text-4xl">Komponenty atomowe</h1>
          <p className="mt-3 text-base text-primary md:text-lg">
            Miejsce do testowania wariantów i zachowań komponentów UI.
          </p>
        </header>

        <section className="mt-10">
          <h2 className="mb-4 text-left font-manrope text-[10px] font-semibold uppercase tracking-[0.6px] text-dark/70">
            Kolory
          </h2>

          <div className="rounded-[28px] border border-gray/70 bg-white p-6 md:p-8">
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {colorSwatches.map((swatch) => (
                <div
                  key={swatch.name}
                  className={`${swatch.bgClass} ${swatch.textClass} aspect-square rounded-sm p-4`}
                >
                  <div className="flex h-full flex-col items-center justify-center text-center">
                    <p className="font-manrope text-sm font-semibold tracking-[-0.2px]">{swatch.name}</p>
                    <p className="mt-1 font-manrope text-sm">{swatch.hex}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-10">
          <h2 className="mb-4 text-left font-manrope text-[10px] font-semibold uppercase tracking-[0.6px] text-dark/70">
            SegmentedControl
          </h2>
          <SegmentedControl
            value={authMode}
            onChange={setAuthMode}
            options={[
              { value: 'login', label: 'Zaloguj się' },
              { value: 'register', label: 'Zarejestruj się' },
            ]}
          />
        </section>

        <section className="mt-10">
          <h2 className="mb-4 text-left font-manrope text-[10px] font-semibold uppercase tracking-[0.6px] text-dark/70">
            Typografia
          </h2>

          <div className="space-y-8 rounded-[28px] border border-gray/70 bg-white p-6 md:p-8">
            {typographyFamilies.map((family) => (
              <article key={family.name}>
                <h3 className={`text-xl font-semibold ${family.className}`}>{family.name}</h3>

                <div className="mt-5 space-y-3">
                  {typographyScale.map((size) => (
                    <div key={`${family.name}-${size.token}`} className="grid grid-cols-[110px_1fr] items-baseline gap-4">
                      <div className="text-right font-manrope text-xs text-dark/55">
                        <p className="font-semibold">{size.token}: {size.px}</p>
                        <p>{size.rem}</p>
                      </div>
                      <p className={`${family.className} ${size.textClass}`}>
                        The quick brown fox jumps over the lazy dog.
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-8 border-t border-gray pt-6">
                  <p className="font-manrope text-[10px] font-semibold uppercase tracking-[0.6px] text-dark/70">
                    Grubości
                  </p>
                  <div className="mt-4 space-y-2">
                    {typographyWeights.map((weight) => (
                      <div
                        key={`${family.name}-${weight.token}`}
                        className="grid grid-cols-[110px_1fr] items-baseline gap-4"
                      >
                        <p className="text-right font-manrope text-xs text-dark/55">
                          {weight.token}: {weight.value}
                        </p>
                        <p className={`${family.className} ${weight.className} text-base`}>
                          The quick brown fox jumps over the lazy dog.
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-10 grid gap-6 md:max-w-[420px]">
          <div>
            <h2 className="mb-4 text-left font-manrope text-[10px] font-semibold uppercase tracking-[0.6px] text-dark/70">
              Button
            </h2>
            <div className="flex flex-col items-start gap-4">
              <Button>Przycisk primary</Button>
              <Button
                variant="social"
                leftIcon={<img src={googleLogo} alt="" aria-hidden="true" className="size-[18px]" />}
              >
                Kontynuuj przez konto Google
              </Button>
            </div>
          </div>

          <div>
            <h2 className="mb-4 text-left font-manrope text-[10px] font-semibold uppercase tracking-[0.6px] text-dark/70">
              Input
            </h2>
            <Input
              label="Adres email"
              name="email"
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />

            <PasswordInput
              label="Hasło"
              name="password"
              placeholder="••••••••"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              actionLabel="Nie pamiętasz hasła?"
              onActionClick={() => {}}
              wrapperClassName="mt-6"
            />
          </div>
        </section>

        <section className="mt-10">
          <h2 className="mb-4 text-left font-manrope text-[10px] font-semibold uppercase tracking-[0.6px] text-dark/70">
            Toast Scenarios
          </h2>

          <div className="rounded-[28px] border border-gray/70 bg-white p-6 md:p-8">
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={() => {
                  showToast({
                    type: 'success',
                    title: 'Sukces',
                    message: 'Profil został zapisany poprawnie.',
                    position: 'top',
                    durationMs: 15000,
                  })
                }}
              >
                Success Top
              </Button>

              <Button
                variant="social"
                onClick={() => {
                  showToast({
                    type: 'warning',
                    title: 'Mamy problem!',
                    message: 'Zostało mało czasu na weryfikację kodu.',
                    position: 'top',
                    durationMs: 17000,
                  })
                }}
              >
                Warning Top
              </Button>

              <Button
                onClick={() => {
                  showToast({
                    type: 'error',
                    title: 'Błąd',
                    message: 'Nie udało się zapisać zmian. Spróbuj ponownie.',
                    position: 'bottom',
                    durationMs: 16000,
                  })
                }}
              >
                Error Bottom
              </Button>

              <Button
                variant="social"
                onClick={() => {
                  showToast({
                    type: 'info',
                    title: 'Informacja',
                    message: 'Trwa synchronizacja danych konta.',
                    position: 'bottom',
                    durationMs: 13000,
                  })
                }}
              >
                Info Bottom
              </Button>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}

export default DesignSandbox
