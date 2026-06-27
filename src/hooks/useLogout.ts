import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { signOut } from '../api/auth.api'

/**
 * Centralized logout hook — the single source of truth for signing out.
 *
 * Calls the `signOut()` API function (which delegates to supabase.auth.signOut)
 * and then navigates to /login with `replace: true` so the browser back button
 * cannot return the user to an authenticated page.
 *
 * Usage:
 *   const logout = useLogout()
 *   <button onClick={() => void logout()}>Wyloguj się</button>
 */
export function useLogout() {
  const navigate = useNavigate()

  const logout = useCallback(async () => {
    await signOut()
    navigate('/login', { replace: true })
  }, [navigate])

  return logout
}
