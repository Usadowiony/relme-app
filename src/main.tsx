import { StrictMode, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import DesignSandbox from './pages/DesignSandbox.tsx'
import LoginPage from './pages/LoginPage.tsx'
import EmailVerificationPage from './pages/EmailVerificationPage.tsx'
import { AuthProvider, useAuth } from './auth/AuthProvider.tsx'
import { ProtectedRoute } from './auth/ProtectedRoute.tsx'
import { ProfileGate } from './auth/ProfileGate.tsx'

function RootRoute() {
  const { session, loading } = useAuth()
  const [pathname, setPathname] = useState(window.location.pathname)

  useEffect(() => {
    const handlePopState = () => setPathname(window.location.pathname)

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  useEffect(() => {
    if (loading) {
      return
    }

    if (session && (pathname === '/login' || pathname === '/verify-email')) {
      window.history.replaceState({}, '', '/')
      setPathname('/')
    }
  }, [loading, pathname, session])

  if (pathname === '/login') {
    return <LoginPage />
  }

  if (pathname === '/verify-email') {
    return <EmailVerificationPage />
  }

  if (pathname === '/design') {
    return <DesignSandbox />
  }

  return (
    <ProtectedRoute>
      <ProfileGate>
        <App />
      </ProfileGate>
    </ProtectedRoute>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <RootRoute />
    </AuthProvider>
  </StrictMode>,
)
