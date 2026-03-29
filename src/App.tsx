import { useState } from 'react'
import Button from './components/atoms/Button'
import googleLogo from './assets/icons/google-logo.svg'
import Input from './components/atoms/Input'
import PasswordInput from './components/atoms/PasswordInput'
import SegmentedControl from './components/atoms/SegmentedControl'

function App() {
  const [authMode, setAuthMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  return (
    <main className="min-h-screen bg-neutral text-dark">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl items-center justify-center px-6 py-16">
        <div className="text-center">
          <h1 className="text-4xl font-semibold md:text-5xl">Relme</h1>
          <p className="mt-4 text-base text-primary md:text-lg">
            To jest strona główna
          </p>
          <div className="mt-8 flex justify-center">
            <SegmentedControl
              value={authMode}
              onChange={setAuthMode}
              options={[
                { value: 'login', label: 'Zaloguj się' },
                { value: 'register', label: 'Zarejestruj się' },
              ]}
            />
          </div>
          <div className="mt-8 flex justify-center">
            <Button>Przycisk primary</Button>
          </div>
          <div className="mt-8 flex justify-center">
            <Button
            variant="social"
            leftIcon={<img src={googleLogo} alt="" aria-hidden="true" className="size-[18px]" />}
          >
            Kontynuuj przez konto Google
          </Button>
          </div>

          <div className="mx-auto mt-10 w-full max-w-[420px] text-left">
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
        </div>
      </div>
    </main>
  )
}

export default App
