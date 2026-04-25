import { useState } from 'react'
import { supabase } from './api/supabase'

function App() {
  const [isSigningOut, setIsSigningOut] = useState(false)

  const handleSignOut = async () => {
    setIsSigningOut(true)

    try {
      await supabase.auth.signOut()
      window.history.replaceState({}, '', '/login')
      window.dispatchEvent(new PopStateEvent('popstate'))
    } finally {
      setIsSigningOut(false)
    }
  }

  return (
    <main className="min-h-screen bg-neutral text-dark">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl items-center justify-center px-6 py-16 text-center">
        <button
          type="button"
          onClick={() => {
            void handleSignOut()
          }}
          disabled={isSigningOut}
          className="absolute right-6 top-6 rounded-full border border-gray px-4 py-2 font-manrope text-sm font-semibold text-dark transition-colors duration-200 hover:bg-gray/40 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isSigningOut ? 'Wylogowywanie...' : 'Wyloguj się'}
        </button>

        <div className="text-center">
          <h1 className="text-4xl font-semibold md:text-5xl">Relme</h1>
          <p className="mt-4 text-base text-primary md:text-lg">
            To jest czysta strona główna aplikacji.
          </p>
        </div>
      </div>
    </main>
  )
}

export default App
