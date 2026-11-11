import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getModules, createModule, deleteModule } from '../../../api/modules.api'
import type { Module } from '../../../types/modules'

export function ModulesListPage() {
  const navigate = useNavigate()
  const [modules, setModules] = useState<Module[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // --- Create Module State ---
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  useEffect(() => {
    void loadModules()
  }, [])

  async function loadModules() {
    setIsLoading(true)
    setError(null)
    try {
      const data = await getModules()
      setModules(data)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Nie udało się pobrać modułów.'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleCreate() {
    if (!newTitle.trim()) return

    setIsCreating(true)
    try {
      await createModule(newTitle, newDescription || undefined)
      setNewTitle('')
      setNewDescription('')
      setShowCreateForm(false)
      await loadModules()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Nie udało się utworzyć modułu.'
      setError(message)
    } finally {
      setIsCreating(false)
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteModule(id)
      await loadModules()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Nie udało się usunąć modułu.'
      setError(message)
    }
  }

  const statusLabels: Record<string, { label: string; className: string }> = {
    draft: { label: 'Draft', className: 'bg-amber-100 text-amber-800' },
    published: { label: 'Opublikowany', className: 'bg-green-100 text-green-800' },
    archived: { label: 'Archiwum', className: 'bg-gray-100 text-gray-600' },
  }

  return (
    <div className="flex flex-col max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-manrope font-semibold tracking-tight">
            Moduły Wiedzy
          </h1>
          <p className="mt-2 text-dark/70">
            Zarządzanie modułami edukacyjnymi — tworzenie, edycja i publikacja.
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="cursor-pointer px-6 py-3 rounded-xl bg-dark text-white font-manrope font-medium text-sm transition-all hover:bg-dark/90 active:scale-[0.98]"
        >
          {showCreateForm ? 'Anuluj' : '+ Nowy moduł'}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-manrope">
          {error}
        </div>
      )}

      {/* Create Form */}
      {showCreateForm && (
        <div className="mb-8 p-6 rounded-2xl bg-white border border-gray shadow-sm">
          <h2 className="text-lg font-manrope font-semibold mb-4">Nowy moduł</h2>
          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-manrope font-medium text-dark/80 mb-1">
                Tytuł *
              </label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Np. Komunikacja w związku"
                className="w-full px-4 py-3 rounded-xl border border-gray bg-white font-manrope text-sm focus:outline-none focus:ring-2 focus:ring-dark/20 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-manrope font-medium text-dark/80 mb-1">
                Opis (opcjonalny)
              </label>
              <textarea
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Krótki opis modułu..."
                rows={3}
                className="w-full px-4 py-3 rounded-xl border border-gray bg-white font-manrope text-sm focus:outline-none focus:ring-2 focus:ring-dark/20 transition-all resize-none"
              />
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => void handleCreate()}
                disabled={isCreating || !newTitle.trim()}
                className="cursor-pointer px-6 py-3 rounded-xl bg-dark text-white font-manrope font-medium text-sm transition-all hover:bg-dark/90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCreating ? 'Tworzenie...' : 'Utwórz moduł'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <div className="size-8 border-3 border-dark/20 border-t-dark rounded-full animate-spin" />
        </div>
      )}

      {/* Modules List */}
      {!isLoading && modules.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-dark/50">
          <p className="text-lg font-manrope">Brak modułów</p>
          <p className="text-sm mt-1">Kliknij „+ Nowy moduł" aby utworzyć pierwszy.</p>
        </div>
      )}

      {!isLoading && modules.length > 0 && (
        <div className="flex flex-col gap-4">
          {modules.map((mod) => {
            const statusInfo = statusLabels[mod.status] ?? statusLabels.draft
            const viewCount = mod.flow_data.views.length

            return (
              <div
                key={mod.id}
                className="flex items-center justify-between p-6 rounded-2xl bg-white border border-gray shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col gap-1 min-w-0 flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-manrope font-semibold truncate">
                      {mod.title}
                    </h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${statusInfo.className}`}>
                      {statusInfo.label}
                    </span>
                  </div>
                  {mod.description && (
                    <p className="text-sm text-dark/60 truncate">{mod.description}</p>
                  )}
                  <p className="text-xs text-dark/40 mt-1">
                    {viewCount} {viewCount === 1 ? 'widok' : viewCount > 1 && viewCount < 5 ? 'widoki' : 'widoków'}
                    {' · '}
                    {new Date(mod.updated_at).toLocaleDateString('pl-PL', {
                      day: 'numeric', month: 'short', year: 'numeric',
                    })}
                  </p>
                </div>

                <div className="flex items-center gap-3 ml-6">
                  <button
                    onClick={() => navigate(`/admin/modules/${mod.id}`)}
                    className="cursor-pointer px-5 py-2.5 rounded-xl bg-dark text-white font-manrope font-medium text-sm transition-all hover:bg-dark/90 active:scale-[0.98]"
                  >
                    Edytuj
                  </button>
                  {mod.status === 'draft' && (
                    <button
                      onClick={() => void handleDelete(mod.id)}
                      className="cursor-pointer px-4 py-2.5 rounded-xl bg-red-50 text-red-600 font-manrope font-medium text-sm transition-all hover:bg-red-100 active:scale-[0.98]"
                    >
                      Usuń
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
