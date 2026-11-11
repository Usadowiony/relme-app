import { useState, useEffect } from 'react'
import { Save, Download, Rocket, Trash2, Loader2 } from 'lucide-react'
import type { QuizVersion, LayoutItem } from '../../../../types/quiz'
import { getQuizVersions, saveQuizDraft, deleteQuizVersion, publishQuizVersion } from '../../../../api/quiz.api'
import { countLayoutQuestions } from '../../../../utils/quizTree'
import { BaseModal } from '../../../../components/ui/popups/BaseModal'
import { AsyncButton } from '../../../../components/ui/buttons/Button'

type VersionControlModalProps = {
  isOpen: boolean
  onClose: () => void
  currentLayoutItems: LayoutItem[]
  currentDraftName: string
  onLoadDraft: (version: QuizVersion) => void
  onPublished: () => void
}

export function VersionControlModal({
  isOpen,
  onClose,
  currentLayoutItems,
  currentDraftName,
  onLoadDraft,
  onPublished,
}: VersionControlModalProps) {
  const [versions, setVersions] = useState<QuizVersion[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [saveName, setSaveName] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [actionId, setActionId] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    if (isOpen) {
      setSaveName(currentDraftName || '')
      fetchVersions()
    }
  }, [isOpen, currentDraftName])

  const fetchVersions = async () => {
    setIsLoading(true)
    setErrorMessage('')
    try {
      const data = await getQuizVersions()
      setVersions(data)
    } catch (err: unknown) {
      console.error('Failed to fetch quiz versions:', err)
      setErrorMessage(err instanceof Error ? err.message : 'Nie udało się pobrać wersji quizu.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    if (!saveName.trim()) return
    setIsSaving(true)
    try {
      await saveQuizDraft(saveName.trim(), currentLayoutItems)
      await fetchVersions()
      setSaveName('')
    } catch (err: unknown) {
      console.error('Failed to save draft:', err)
      setErrorMessage(err instanceof Error ? err.message : 'Nie udało się zapisać draftu.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Czy na pewno chcesz usunąć tę wersję?')) return
    setActionId(id)
    try {
      await deleteQuizVersion(id)
      await fetchVersions()
    } catch (err: unknown) {
      console.error('Failed to delete version:', err)
      setErrorMessage(err instanceof Error ? err.message : 'Nie udało się usunąć zapisanej wersji. Spróbuj ponownie.')
    } finally {
      setActionId(null)
    }
  }

  const handleLoad = (version: QuizVersion) => {
    onLoadDraft(version)
    onClose()
  }

  const handlePublish = async (id: string) => {
    if (!window.confirm('Czy na pewno chcesz opublikować tę wersję? Poprzednia wersja live zostanie zarchiwizowana.')) return
    setActionId(id)
    try {
      await publishQuizVersion(id)
      await fetchVersions()
      onPublished()
    } catch (err: unknown) {
      console.error('Failed to publish:', err)
      setErrorMessage(err instanceof Error ? err.message : 'Nie udało się opublikować wersji.')
    } finally {
      setActionId(null)
    }
  }

  const statusBadge = (status: string) => {
    switch (status) {
      case 'draft': return <span className="text-[9px] font-bold tracking-widest uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">Draft</span>
      case 'live': return <span className="text-[9px] font-bold tracking-widest uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">Live</span>
      case 'archived': return <span className="text-[9px] font-bold tracking-widest uppercase px-2 py-0.5 rounded-full bg-dark/10 text-dark/50">Archiwum</span>
      default: return null
    }
  }

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Kontrola wersji"
      subtitle="ZARZĄDZANIE DRAFTAMI"
      maxWidth="xl"
      footer={
        <AsyncButton variant="cancel" onClick={onClose}>
          Zamknij
        </AsyncButton>
      }
    >
      {/* Inline error banner — replaces old browser alert() */}
      {errorMessage && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-[13px] font-medium rounded-[12px] px-4 py-3">
          {errorMessage}
        </div>
      )}

      {/* Save current draft */}
      <div className="bg-neutral rounded-[16px] p-5 border border-dark/20">
        <label className="block text-[10px] font-bold tracking-widest text-dark/60 uppercase mb-3">
          Zapisz aktualny układ jako nowy draft
        </label>
        <div className="flex gap-3">
          <input
            type="text"
            value={saveName}
            onChange={(e) => setSaveName(e.target.value)}
            placeholder="Nazwa draftu..."
            maxLength={50}
            className="flex-1 px-4 py-2.5 rounded-[12px] bg-white border border-dark/20 focus:border-primary/50 text-dark text-[14px] font-medium focus:outline-none transition-colors"
          />
          <AsyncButton
            variant="dark"
            onClick={handleSave}
            disabled={!saveName.trim()}
            isLoading={isSaving}
            leftIcon={<Save className="size-4" />}
          >
            Zapisz
          </AsyncButton>
        </div>
        <p className="text-[11px] text-dark/40 mt-2 font-medium">
          {countLayoutQuestions(currentLayoutItems)} pytań w aktualnym układzie
        </p>
      </div>

      {/* Saved versions list */}
      <div>
        <label className="block text-[10px] font-bold tracking-widest text-dark/60 uppercase mb-3">
          Zapisane wersje
        </label>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="size-5 text-dark/30 animate-spin" />
          </div>
        ) : versions.length === 0 ? (
          <div className="text-center text-dark/40 text-[13px] py-8">
            Brak zapisanych wersji. Zapisz swój pierwszy draft powyżej.
          </div>
        ) : (
          <div className="flex flex-col gap-2 max-h-[350px] overflow-y-auto custom-scrollbar">
            {versions.map(v => (
              <div
                key={v.id}
                className="bg-white rounded-[14px] border border-dark/20 p-4 flex items-center justify-between gap-4 hover:border-gray/40 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[14px] font-semibold text-dark truncate">{v.name}</span>
                    {statusBadge(v.status)}
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-dark/40 font-medium">
                    <span>{v.question_count} pytań</span>
                    <span>•</span>
                    <span>{new Date(v.created_at).toLocaleDateString('pl-PL', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                    {v.published_at && (
                      <>
                        <span>•</span>
                        <span className="text-emerald-600">Opublikowano {new Date(v.published_at).toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' })}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {actionId === v.id ? (
                    <Loader2 className="size-4 text-dark/30 animate-spin" />
                  ) : (
                    <>
                      <button
                        onClick={() => handleLoad(v)}
                        title="Wczytaj draft"
                        className="p-2 rounded-full hover:bg-primary/10 text-primary/70 hover:text-primary transition-colors cursor-pointer"
                      >
                        <Download className="size-4" />
                      </button>
                      {v.status === 'draft' && (
                        <button
                          onClick={() => handlePublish(v.id)}
                          title="Opublikuj"
                          className="p-2 rounded-full hover:bg-emerald-50 text-emerald-500/70 hover:text-emerald-600 transition-colors cursor-pointer"
                        >
                          <Rocket className="size-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(v.id)}
                        title="Usuń wersję"
                        className="p-2 rounded-full hover:bg-red-50 text-dark/30 hover:text-[#D15F5F] transition-colors cursor-pointer"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </BaseModal>
  )
}
