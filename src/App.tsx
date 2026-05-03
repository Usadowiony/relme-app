import { Routes, Route } from 'react-router-dom'
import DashboardLayout from './components/layout/DashboardLayout'
import { QuizManagementPage } from './pages/admin/quiz/QuizManagementPage'
import QuizPlayerPage from './pages/quiz/QuizPlayerPage'

function App() {
  return (
    <Routes>
      <Route path="/quiz" element={<QuizPlayerPage />} />

      <Route
        path="/*"
        element={
          <DashboardLayout>
            <Routes>
              <Route
                path="/"
                element={
                  <div className="flex flex-col">
                    <h1 className="text-3xl font-manrope font-semibold tracking-tight">Strona główna</h1>
                    <p className="mt-2 text-dark/70">Witaj w panelu głównym Relme. Miejsce na Twoje dane i podsumowania.</p>
                  </div>
                }
              />
              <Route
                path="/dashboard"
                element={
                  <div className="flex flex-col">
                    <h1 className="text-3xl font-manrope font-semibold tracking-tight">Strona główna</h1>
                    <p className="mt-2 text-dark/70">Witaj w panelu głównym Relme. Miejsce na Twoje dane i podsumowania.</p>
                  </div>
                }
              />
              <Route
                path="/modules"
                element={
                  <div className="flex flex-col">
                    <h1 className="text-3xl font-manrope font-semibold tracking-tight">Moduły Wiedzy</h1>
                    <p className="mt-2 text-dark/70">Zarządzanie modułami, warsztatami i materiałami wideo.</p>
                  </div>
                }
              />
              <Route path="/admin/quiz" element={<QuizManagementPage />} />
              <Route
                path="*"
                element={
                  <div className="flex flex-col">
                    <h1 className="text-3xl font-manrope font-semibold tracking-tight">Budowa w toku...</h1>
                    <p className="mt-2 text-dark/70">Ta sekcja nie jest jeszcze zaimplementowana.</p>
                  </div>
                }
              />
            </Routes>
          </DashboardLayout>
        }
      />
    </Routes>
  )
}

export default App
