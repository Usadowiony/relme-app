import { useState, useEffect } from 'react'
import DashboardLayout from './components/layout/DashboardLayout'

function App() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname)

  useEffect(() => {
    const handlePopState = () => setCurrentPath(window.location.pathname)
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  const renderContent = () => {
    switch (currentPath) {
      case '/':
      case '/dashboard':
        return (
          <div className="flex flex-col">
            <h1 className="text-3xl font-manrope font-semibold tracking-tight">Strona główna</h1>
            <p className="mt-2 text-dark/70">Witaj w panelu głównym Relme. Miejsce na Twoje dane i podsumowania.</p>
          </div>
        )
      case '/quiz':
        return (
          <div className="flex flex-col">
            <h1 className="text-3xl font-manrope font-semibold tracking-tight">Zarządzanie Quizem</h1>
            <p className="mt-2 text-dark/70">Tutaj będzie CMS do pytań i logiki algorytmu.</p>
          </div>
        )
      case '/modules':
        return (
          <div className="flex flex-col">
            <h1 className="text-3xl font-manrope font-semibold tracking-tight">Moduły Wiedzy</h1>
            <p className="mt-2 text-dark/70">Zarządzanie modułami, warsztatami i materiałami wideo.</p>
          </div>
        )
      default:
        return (
          <div className="flex flex-col">
            <h1 className="text-3xl font-manrope font-semibold tracking-tight">Budowa w toku...</h1>
            <p className="mt-2 text-dark/70">Ta sekcja nie jest jeszcze zaimplementowana.</p>
          </div>
        )
    }
  }

  return (
    <DashboardLayout>
      {renderContent()}
    </DashboardLayout>
  )
}

export default App
