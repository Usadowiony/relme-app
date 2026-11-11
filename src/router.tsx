import { createBrowserRouter, redirect, Outlet, useNavigation } from 'react-router-dom'
import type { LoaderFunctionArgs } from 'react-router-dom'
import { supabase } from './api/supabase'
import { getModuleEditorData } from './api/modules.api'
import { getMyProfile, isProfileOnboardingComplete, getQuizCompleted } from './api/profile.api'
import { getUserQuizResult } from './api/quiz.api'
import type { AppRole, Profile } from './types/auth'
import type { Session, User } from '@supabase/supabase-js'

// Components
import { GlobalLoader } from './components/ui/Loader/GlobalLoader'
import { ErrorBoundary } from './components/ui/feedback/ErrorBoundary'
import { AuthProvider } from './auth/AuthProvider'

// Pages
import LoginPage from './pages/LoginPage'
import EmailVerificationPage from './pages/EmailVerificationPage'
import OnboardingPage from './pages/OnboardingPage'
import DesignSandbox from './pages/DesignSandbox'
import QuizPlayerPage from './pages/quiz/QuizPlayerPage'
import QuizResultPage from './pages/quiz/QuizResultPage'
import DashboardLayout from './components/layout/DashboardLayout'
import { QuizManagementPage } from './pages/admin/quiz/QuizManagementPage'
import { ModulesListPage } from './pages/admin/modules/ModulesListPage'
import { ModuleEditorPage } from './pages/admin/modules/ModuleEditorPage'

// =============================================
// TYPY LEJKA AUTORYZACJI
// =============================================

type FunnelStep =
  | 'unauthenticated'
  | 'unconfirmed'
  | 'needs-onboarding'
  | 'needs-quiz'
  | 'needs-payment'
  | 'complete'

export type AuthState = {
  step: FunnelStep
  session: Session | null
  user: User | null
  profile: Profile | null
  role: AppRole
}

// =============================================
// RESOLVER: Wyznacza pozycję użytkownika w lejku
// =============================================

async function resolveAuthState(): Promise<AuthState> {
  const empty: AuthState = { step: 'unauthenticated', session: null, user: null, profile: null, role: 'user' }

  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) return empty

  const user = session.user

  // Krok 2: Email potwierdzony?
  if (!user.email_confirmed_at) {
    return { step: 'unconfirmed', session, user, profile: null, role: 'user' }
  }

  // Krok 3: Profil i rola
  let profile: Profile | null = null
  try { profile = await getMyProfile() } catch { /* profil jeszcze nie istnieje */ }

  const { data: roleData } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .single()
  const role: AppRole = (roleData?.role as AppRole | undefined) ?? 'user'

  if (!profile || !isProfileOnboardingComplete(profile)) {
    return { step: 'needs-onboarding', session, user, profile, role }
  }

  // Admin i mentor pomijają quiz/płatność
  if (role !== 'user') {
    return { step: 'complete', session, user, profile, role }
  }

  // Krok 4: Quiz ukończony? (status z tabeli user_quiz_status)
  const quizDone = await getQuizCompleted()
  if (!quizDone) {
    return { step: 'needs-quiz', session, user, profile, role }
  }

  // Krok 5: Płatność
  try {
    const result = await getUserQuizResult()
    if (result && result.payment_status !== 'paid') {
      return { step: 'needs-payment', session, user, profile, role }
    }
  } catch {
    return { step: 'needs-payment', session, user, profile, role }
  }

  return { step: 'complete', session, user, profile, role }
}

// Mapowanie kroku lejka na ścieżkę
function funnelStepToPath(step: FunnelStep): string {
  switch (step) {
    case 'unauthenticated': return '/login'
    case 'unconfirmed': return '/verify-email'
    case 'needs-onboarding': return '/onboarding'
    case 'needs-quiz': return '/quiz'
    case 'needs-payment': return '/quiz/result'
    case 'complete': return '/dashboard'
  }
}

// =============================================
// LOADERY POSZCZEGÓLNYCH TRAS
// =============================================

// "/" — automatyczny redirect na właściwy krok lejka
async function rootIndexLoader() {
  const state = await resolveAuthState()
  return redirect(funnelStepToPath(state.step))
}

// "/login" — jeśli zalogowany, idź dalej w lejku
async function loginLoader() {
  const { data: { session } } = await supabase.auth.getSession()
  if (session?.user) {
    const state = await resolveAuthState()
    return redirect(funnelStepToPath(state.step))
  }
  return null
}

// "/verify-email" — dostępna bez sesji (po rejestracji) lub z sesją bez potwierdzonego emaila.
// Odrzuca tylko użytkowników, którzy mają sesję Z potwierdzonym emailem — nie ma tu czego szukać.
async function verifyEmailLoader() {
  const { data: { session } } = await supabase.auth.getSession()

  // Jeśli użytkownik ma sesję ORAZ potwierdzony email, pchnij go dalej w lejek
  if (session?.user?.email_confirmed_at) {
    const state = await resolveAuthState()
    return redirect(funnelStepToPath(state.step))
  }

  // Przepuść: nowo zarejestrowani (session: null) oraz użytkownicy z sesją bez potwierdzonego emaila
  return null
}

// "/onboarding" — wymaga potwierdzonego emaila, ale profil NIEkompletny
async function onboardingLoader() {
  const state = await resolveAuthState()
  if (state.step === 'needs-onboarding') return state
  return redirect(funnelStepToPath(state.step))
}

// "/quiz" — wymaga kompletnego profilu, quiz NIEukończony
// Admin/Mentor mogą wchodzić dobrowolnie (np. preview z CMS)
async function quizLoader() {
  const state = await resolveAuthState()
  if (state.step === 'needs-quiz') return state
  if (state.role !== 'user') return state // Admin/mentor: pass-through
  return redirect(funnelStepToPath(state.step))
}

// "/quiz/result" — wymaga ukończonego quizu, płatność NIEzrealizowana
// Admin/Mentor mogą przeglądać wynik bez blokady
async function quizResultLoader() {
  const state = await resolveAuthState()
  if (state.step === 'needs-payment') return state
  if (state.role !== 'user') return state // Admin/mentor: pass-through
  return redirect(funnelStepToPath(state.step))
}

// Dashboard i podstrony — wymaga przejścia całego lejka
async function dashboardLoader() {
  const state = await resolveAuthState()
  if (state.step === 'complete') return state
  return redirect(funnelStepToPath(state.step))
}

// Admin — wymaga roli admin
async function adminLoader() {
  const state = await resolveAuthState()
  if (state.step !== 'complete') return redirect(funnelStepToPath(state.step))
  if (state.role !== 'admin') return redirect('/dashboard')
  return state
}

// Admin — edytor modułu (moduł musi istnieć)
async function moduleEditorLoader({ params }: LoaderFunctionArgs) {
  const guard = await adminLoader()
  if (guard instanceof Response) return guard
  const data = params.moduleId ? await getModuleEditorData(params.moduleId) : null
  if (!data) return redirect('/admin/modules')
  return data
}

// =============================================
// ROOT LAYOUT: GlobalLoader + AuthProvider
// =============================================

function RootLayout() {
  const navigation = useNavigation()
  const isNavigating = navigation.state === 'loading'

  return (
    <AuthProvider>
      <ErrorBoundary>
        <GlobalLoader isLoading={isNavigating} />
        <Outlet />
      </ErrorBoundary>
    </AuthProvider>
  )
}

// =============================================
// Placeholder strony dashboard
// =============================================

function DashboardHome() {
  return (
    <div className="flex flex-col">
      <h1 className="text-3xl font-manrope font-semibold tracking-tight">Strona główna</h1>
      <p className="mt-2 text-dark/70">Witaj w panelu głównym Relme. Miejsce na Twoje dane i podsumowania.</p>
    </div>
  )
}

// ModulesPage placeholder usunięte — zastąpione przez ModulesListPage (T5.3a)

function NotFoundPage() {
  return (
    <div className="flex flex-col">
      <h1 className="text-3xl font-manrope font-semibold tracking-tight">Budowa w toku...</h1>
      <p className="mt-2 text-dark/70">Ta sekcja nie jest jeszcze zaimplementowana.</p>
    </div>
  )
}

// =============================================
// DEFINICJA ROUTERA
// =============================================

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      // --- Publiczne ---
      { path: '/', loader: rootIndexLoader, element: null },
      { path: '/login', loader: loginLoader, element: <LoginPage /> },
      { path: '/design', element: <DesignSandbox /> },

      // --- Lejek autoryzacji ---
      { path: '/verify-email', loader: verifyEmailLoader, element: <EmailVerificationPage /> },
      { path: '/onboarding', loader: onboardingLoader, element: <OnboardingPage /> },
      { path: '/quiz', id: 'quiz', loader: quizLoader, element: <QuizPlayerPage /> },
      { path: '/quiz/result', id: 'quiz-result', loader: quizResultLoader, element: <QuizResultPage /> },

      // --- Platforma (chroniona) ---
      {
        element: <DashboardLayout><Outlet /></DashboardLayout>,
        children: [
          { path: '/dashboard', loader: dashboardLoader, element: <DashboardHome /> },

          // --- Strefa admina ---
          { path: '/admin/quiz', loader: adminLoader, element: <QuizManagementPage /> },
          { path: '/admin/modules', loader: adminLoader, element: <ModulesListPage /> },
          { path: '/admin/modules/:moduleId', loader: moduleEditorLoader, element: <ModuleEditorPage /> },

          // --- Catch-all ---
          { path: '*', loader: dashboardLoader, element: <NotFoundPage /> },
        ],
      },
    ],
  },
])
