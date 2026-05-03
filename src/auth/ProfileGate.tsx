import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { supabase } from '../api/supabase'
import { getMyProfile, isProfileOnboardingComplete } from '../api/profile.api'
import type { AppRole, Profile } from '../types/auth'
import { useAuth } from './AuthProvider'
import ProfileErrorView from './ProfileErrorView'
import GlobalLoader from '../components/ui/Loader/GlobalLoader'

type ProfileGateProps = {
  children: ReactNode
}

type ProfileGateStatus = 'idle' | 'loading' | 'ready' | 'error'

export function ProfileGate({ children }: ProfileGateProps) {
  const { session, loading } = useAuth()
  const [status, setStatus] = useState<ProfileGateStatus>('idle')
  const [profile, setProfile] = useState<Profile | null>(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [retryKey, setRetryKey] = useState(0)
  const [role, setRole] = useState<AppRole | null>(null)
  const location = useLocation()

  const loadProfile = useCallback(async () => {
    setStatus('loading')
    setErrorMessage('')

    try {
      const fetchedProfile = await getMyProfile()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: roleData } = await supabase.from('user_roles').select('role').eq('user_id', user.id).single()
        setRole((roleData?.role as AppRole | undefined) ?? 'user')
      }
      setProfile(fetchedProfile)
      setStatus('ready')
    } catch (error) {
      setProfile(null)
      const message = error instanceof Error ? error.message : 'Nieznany błąd profilu.'
      setErrorMessage(message)
      setStatus('error')
    }
  }, [])

  useEffect(() => {
    if (loading || !session) {
      setStatus('idle')
      return
    }

    void loadProfile()

    const handleProfileUpdate = () => {
      void loadProfile()
    }
    window.addEventListener('profileUpdated', handleProfileUpdate)
    return () => window.removeEventListener('profileUpdated', handleProfileUpdate)
  }, [loading, loadProfile, retryKey, session])

  const handleRetry = () => {
    setRetryKey((previous) => previous + 1)
  }

  const handleBackToLogin = async () => {
    await supabase.auth.signOut()
    window.history.replaceState({}, '', '/login')
    window.dispatchEvent(new PopStateEvent('popstate'))
  }

  if (status === 'error') {
    return (
      <ProfileErrorView
        errorMessage={errorMessage}
        onRetry={handleRetry}
        onBackToLogin={() => {
          void handleBackToLogin()
        }}
      />
    )
  }

  if (status === 'loading' || status === 'idle') {
    return <GlobalLoader isLoading />
  }

  if (!profile) {
    return <GlobalLoader isLoading />
  }

  const isOnboardingComplete = isProfileOnboardingComplete(profile)

  if (!isOnboardingComplete && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />
  }

  if (isOnboardingComplete && location.pathname === '/onboarding') {
    return <Navigate to={role === 'user' && !profile.quiz_completed ? '/quiz' : '/'} replace />
  }

  if (isOnboardingComplete && role === 'user' && !profile.quiz_completed && location.pathname !== '/quiz') {
    return <Navigate to="/quiz" replace />
  }

  if (location.pathname.startsWith('/admin') && role !== 'admin') {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}

export default ProfileGate
