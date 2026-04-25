import { supabase } from './supabase'

const PENDING_SIGNUP_TTL_MS = 15 * 60 * 1000

export function resolveOAuthRedirectUrl() {
  const configuredPublicUrl = import.meta.env.VITE_PUBLIC_APP_URL?.trim()
  const normalizedPublicUrl = configuredPublicUrl?.replace(/\/+$/, '')
  const isLocalhost =
    window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  const baseUrl = isLocalhost && normalizedPublicUrl ? normalizedPublicUrl : window.location.origin
  return `${baseUrl}/login`
}

export function clearPendingSignupSession() {
  sessionStorage.removeItem('pending_signup_email')
  sessionStorage.removeItem('pending_signup_password')
  sessionStorage.removeItem('pending_signup_started_at')
  localStorage.removeItem('pending_signup_email')
  localStorage.removeItem('pending_signup_password')
  localStorage.removeItem('pending_signup_started_at')
}

export function mapSignInErrorMessage(message: string) {
  const normalized = message.toLowerCase()
  if (normalized.includes('missing email or phone')) return 'Musisz wypełnić wszystkie wymagane pola.'
  if (normalized.includes('invalid login credentials')) return 'Nieprawidłowy adres email lub hasło.'
  if (normalized.includes('email not confirmed')) return 'Adres email nie został jeszcze potwierdzony. Dokończ aktywację konta.'
  return message
}

export function mapSignUpErrorMessage(message: string) {
  const normalized = message.toLowerCase()
  if (normalized.includes('anonymous sign-ins are disabled')) return 'Musisz wypełnić wszystkie wymagane pola.'
  if (normalized.includes('user already registered') || normalized.includes('already been registered')) {
    return 'Konto dla tego adresu już istnieje. Zaloguj się odpowiednią metodą (Email lub Google).'
  }
  return message
}

export async function signInWithEmail(email: string, password: string) {
  return await supabase.auth.signInWithPassword({ email, password })
}

export async function signUpWithEmail(email: string, password: string) {
  const response = await supabase.auth.signUp({ email, password })
  if (response.data?.user && (response.data.user.identities?.length ?? 0) > 0) {
    const pendingExpiryAt = String(Date.now() + PENDING_SIGNUP_TTL_MS)
    sessionStorage.setItem('pending_signup_email', email)
    sessionStorage.setItem('pending_signup_started_at', pendingExpiryAt)
    localStorage.setItem('pending_signup_email', email)
    localStorage.setItem('pending_signup_started_at', pendingExpiryAt)
  }
  return response
}

export async function signInWithGoogle() {
  return await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: resolveOAuthRedirectUrl(),
    },
  })
}

export async function signOut() {
  return await supabase.auth.signOut()
}
