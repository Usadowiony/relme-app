import { useState, useEffect, type ReactNode } from 'react'
import BackgroundGradient from './BackgroundGradient'
import Sidebar from './Sidebar'
import { useUserProfile } from '../../hooks/useUserProfile'

type DashboardLayoutProps = {
  children: ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { profile, role, isLoading } = useUserProfile()

  const [currentPath, setCurrentPath] = useState(window.location.pathname)

  useEffect(() => {
    const handlePopState = () => setCurrentPath(window.location.pathname)
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral flex items-center justify-center">
        <div className="animate-spin size-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }

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
