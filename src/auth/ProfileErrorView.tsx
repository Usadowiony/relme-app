type ProfileErrorViewProps = {
  errorMessage: string
  onRetry: () => void
  onBackToLogin: () => void
}

export function ProfileErrorView({
  errorMessage,
  onRetry,
  onBackToLogin,
}: ProfileErrorViewProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral px-6 py-16 text-dark">
      <div className="w-full max-w-[560px] rounded-3xl bg-white p-8 shadow-large">
        <h1 className="font-manrope text-3xl font-semibold tracking-[-0.4px] text-dark">
          Nie udało się przygotować profilu
        </h1>
        <p className="mt-3 font-manrope text-sm font-medium text-dark/80">{errorMessage}</p>

        <div className="mt-8 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={onRetry}
            className="rounded-full bg-primary px-6 py-3 font-inter text-sm font-bold text-white transition-colors duration-200 hover:bg-primary/90"
          >
            Spróbuj ponownie
          </button>

          <button
            type="button"
            onClick={onBackToLogin}
            className="rounded-full border border-gray px-6 py-3 font-manrope text-sm font-semibold text-dark transition-colors duration-200 hover:bg-gray/40"
          >
            Wróć do logowania
          </button>
        </div>
      </div>
    </main>
  )
}

export default ProfileErrorView
