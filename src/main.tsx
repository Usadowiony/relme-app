import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import DesignSandbox from './pages/DesignSandbox.tsx'
import LoginPage from './pages/LoginPage.tsx'

function RootRoute() {
  if (window.location.pathname === '/login') {
    return <LoginPage />
  }

  if (window.location.pathname === '/design') {
    return <DesignSandbox />
  }

  return <App />
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RootRoute />
  </StrictMode>,
)
