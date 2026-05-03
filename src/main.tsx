import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, useLocation, useNavigate } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import DesignSandbox from './pages/DesignSandbox.tsx'
import LoginPage from './pages/LoginPage.tsx'
import EmailVerificationPage from './pages/EmailVerificationPage.tsx'
import OnboardingPage from './pages/OnboardingPage.tsx'
import { AuthProvider, useAuth } from './auth/AuthProvider.tsx'
import { ProtectedRoute } from './auth/ProtectedRoute.tsx'
import { ProfileGate } from './auth/ProfileGate.tsx'
import GlobalLoader from './components/ui/Loader/GlobalLoader.tsx'
import { ErrorBoundary } from './components/ui/feedback/ErrorBoundary.tsx'

function RootRoute() {
  const { session, loading } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const pathname = location.pathname

  useEffect(() => {
    if (loading) {
      return
    }

    if (session && (pathname === '/login' || pathname === '/verify-email')) {
      navigate('/', { replace: true })
    }
  }, [loading, navigate, pathname, session])

  let content = null

  if (!loading) {
    if (pathname === '/login') {
      content = <LoginPage />
    } else if (pathname === '/verify-email') {
      content = <EmailVerificationPage />
    } else if (pathname === '/design') {
      content = <DesignSandbox />
    } else if (pathname === '/onboarding') {
      content = (
        <ProtectedRoute>
          <ProfileGate>
            <OnboardingPage />
          </ProfileGate>
        </ProtectedRoute>
      )
    } else {
      content = (
        <ProtectedRoute>
          <ProfileGate>
            <App />
          </ProfileGate>
        </ProtectedRoute>
      )
    }
  }

  return (
    <>
      <GlobalLoader isLoading={loading} />
      {content}
    </>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ErrorBoundary>
          <RootRoute />
        </ErrorBoundary>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
