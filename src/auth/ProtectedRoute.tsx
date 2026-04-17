import { useEffect, type ReactNode } from 'react'
import { useAuth } from './AuthProvider'

type ProtectedRouteProps = {
  children: ReactNode
  redirectTo?: string
}

export function ProtectedRoute({
  children,
  redirectTo = '/login',
}: ProtectedRouteProps) {
  const { session, loading } = useAuth()

  useEffect(() => {
    if (loading || session) {
      return
    }

    if (window.location.pathname !== redirectTo) {
      window.history.replaceState({}, '', redirectTo)
      window.dispatchEvent(new PopStateEvent('popstate'))
    }
  }, [loading, redirectTo, session])

  if (loading) {
    return null
  }

  if (!session) {
    return null
  }

  return <>{children}</>
}
