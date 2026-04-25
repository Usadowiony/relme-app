import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { supabase } from '../api/supabase'
import { getMyProfile, isProfileOnboardingComplete, type Profile } from '../api/profile.api'
import { useAuth } from './AuthProvider'
import ProfileErrorView from './ProfileErrorView'

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
  const [showPreparingMessage, setShowPreparingMessage] = useState(false)

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

  useEffect(() => {
    if (status !== 'loading') {
      setShowPreparingMessage(false)
      return
    }

    const timer = window.setTimeout(() => {
      setShowPreparingMessage(true)
    }, 2000)

    return () => window.clearTimeout(timer)
  }, [status])

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
    <div className="relative">
      {children}

      {status === 'loading' ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-6 backdrop-blur-[2px]">
          <div className="w-full max-w-[360px] rounded-3xl bg-white p-8 text-center shadow-large">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-primary/25 border-t-primary" />

            {showPreparingMessage ? (
              <p className="mt-5 font-manrope text-sm font-semibold text-dark/85">
                Przygotowujemy Twoją przestrzeń...
              </p>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default ProfileGate
