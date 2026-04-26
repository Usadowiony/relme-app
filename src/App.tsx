import { useState, useEffect } from 'react'
import DashboardLayout from './components/layout/DashboardLayout'
import { useUserProfile } from './hooks/useUserProfile'
import { QuizManagementPage } from './pages/admin/quiz/QuizManagementPage'

function App() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname)
  const { role, isLoading } = useUserProfile()

  useEffect(() => {
    const handlePopState = () => setCurrentPath(window.location.pathname)
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  const renderContent = () => {
    if (isLoading) return null

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
        if (role !== 'admin') {
          return (
            <div className="flex flex-col items-center justify-center h-[50vh] text-center">
              <h1 className="text-3xl font-manrope font-semibold tracking-tight text-[#D15F5F]">Brak dostępu</h1>
              <p className="mt-2 text-dark/70">Ta sekcja jest dostępna tylko dla administratorów.</p>
            </div>
          )
        }
        return <QuizManagementPage />
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
