import { Component, type ErrorInfo, type ReactNode } from 'react'
import logoShort from '../../../assets/icons/logo-short.svg'

interface Props {
  children?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught rendering error:', error, errorInfo)
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 z-[9999] bg-white flex flex-col items-center justify-center p-6 text-center">
          <img src={logoShort} alt="Relme Logo" className="w-16 mb-8 opacity-50" />
          <h2 className="text-2xl font-bold text-dark font-manrope mb-4">
            Mamy problem z wyświetleniem tej strony.
          </h2>
          <p className="text-dark/60 mb-8 max-w-md">
            Wystąpił nieoczekiwany błąd. Spróbuj odświeżyć stronę lub wróć do panelu głównego.
          </p>
          <div className="flex gap-4">
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-dark text-white rounded-xl font-semibold hover:bg-dark/80 transition-colors cursor-pointer"
            >
              Odśwież stronę
            </button>
            <button
              onClick={() => window.location.href = '/'}
              className="px-6 py-3 bg-neutral text-dark border border-gray/50 rounded-xl font-semibold hover:bg-neutral/80 transition-colors cursor-pointer"
            >
              Strona Główna
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
