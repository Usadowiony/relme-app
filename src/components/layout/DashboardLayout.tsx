import { useState, useEffect, type ReactNode } from 'react'
import BackgroundGradient from './BackgroundGradient'
import Sidebar from './Sidebar'
import { useUserProfile } from '../../hooks/useUserProfile'

type DashboardLayoutProps = {
  children: ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { profile, role } = useUserProfile()

  const [currentPath, setCurrentPath] = useState(window.location.pathname)

  useEffect(() => {
    const handlePopState = () => setCurrentPath(window.location.pathname)
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  // Usuwamy stary blok if (isLoading) ze spinnerem, który migał pod splashem.
  // Sidebar i tak obsłuży brak profilu podczas pierwszej sekundy ładowania.

  return (
    <div className="min-h-screen flex font-manrope">
      <Sidebar role={role} profile={profile} currentPath={currentPath} />

      <main className="flex-1 relative overflow-hidden">
        <BackgroundGradient />

        <div className="absolute inset-0 overflow-y-auto">
          <div className="min-h-full p-8">
            {children}
          </div>
        </div>
      </main>
    </div>
  )
}

export default DashboardLayout
