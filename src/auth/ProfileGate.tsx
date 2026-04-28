import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { supabase } from '../api/supabase'
import { getMyProfile, isProfileOnboardingComplete } from '../api/profile.api'
import type { Profile } from '../types/auth'
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

  const loadProfile = useCallback(async () => {
    setStatus('loading')
    setErrorMessage('')

    try {
      const fetchedProfile = await getMyProfile()
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
  }, [loading, loadProfile, retryKey, session])

  useEffect(() => {
    if (status !== 'ready' || !profile) {
      return
    }

    const pathname = window.location.pathname
    const isOnboardingComplete = isProfileOnboardingComplete(profile)

    if (!isOnboardingComplete && pathname !== '/onboarding') {
      window.history.replaceState({}, '', '/onboarding')
      window.dispatchEvent(new PopStateEvent('popstate'))
      return
    }

    if (isOnboardingComplete && pathname === '/onboarding') {
      window.history.replaceState({}, '', '/')
      window.dispatchEvent(new PopStateEvent('popstate'))
    }
  }, [profile, status])

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

  return (
    <>
      {status === 'ready' && children}
      <GlobalLoader isLoading={status === 'loading' || status === 'idle'} />
    </>
  )
}

export default ProfileGate
