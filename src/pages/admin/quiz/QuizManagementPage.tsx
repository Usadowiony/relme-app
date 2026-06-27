import { useState, useMemo, useEffect, useCallback } from 'react'
import { Plus, PlayCircle, History, Tag } from 'lucide-react'
import { QuestionsTab } from './QuestionsTab'
import { TagsTab } from './TagsTab'
import { LayoutTab } from './LayoutTab'
import { useQuizData } from '../../../hooks/useQuizData'
import { TagModal } from './components/TagModal'
import { QuestionModal } from './components/QuestionModal'
import { VersionControlModal } from './components/VersionControlModal'
import { createTag, updateTag, deleteTag, saveQuestionWithAnswers, deleteQuestion, loadDraftFromLocal, saveDraftToLocal } from '../../../api/quiz.api'
import type { Tag as TagType, Question as QuestionType, QuestionPayload, AnswerPayload, QuizVersion } from '../../../types/quiz'
import Toast from '../../../components/ui/popups/Toast'

type TabType = 'questions' | 'tags' | 'layout'

export function QuizManagementPage() {
  const [activeTab, setActiveTab] = useState<TabType>('questions')
  const { questions, tags, isLoading, refetch } = useQuizData()

  // Tag Modal State
  const [isTagModalOpen, setIsTagModalOpen] = useState(false)
  const [editingTag, setEditingTag] = useState<TagType | null>(null)

  // Question Modal State
  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState<QuestionType | null>(null)

  const [isVersionControlOpen, setIsVersionControlOpen] = useState(false)
  const [toastMessage, setToastMessage] = useState('')

  // 5.3 FIX: Avoid re-parsing localStorage JSON on every render.
  // Counter increments only on 'draftUpdated' events, causing useMemo to recompute.
  const [draftRevision, setDraftRevision] = useState(0)

  const handleDraftUpdated = useCallback(() => {
    setDraftRevision(prev => prev + 1)
  }, [])

  useEffect(() => {
    window.addEventListener('draftUpdated', handleDraftUpdated)
    return () => window.removeEventListener('draftUpdated', handleDraftUpdated)
  }, [handleDraftUpdated])

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const currentDraft = useMemo(() => loadDraftFromLocal(), [draftRevision])

  const tabLabels: Record<TabType, string> = {
    questions: 'Pytania i odpowiedzi',
    tags: 'Oznaczenia i punktacja',
    layout: 'Układ Quizu',
  }

  // --- TAGS ACTIONS ---
  const handleOpenTagModal = (tag?: TagType) => {
    setEditingTag(tag || null)
    setIsTagModalOpen(true)
  }

  const handleSaveTag = async (tagData: Partial<TagType>) => {
    try {
      if (tagData.id) {
        await updateTag(tagData.id, {
          slug: tagData.slug,
          color: tagData.color,
          is_scored: tagData.is_scored
        })
      } else {
        await createTag({
          slug: tagData.slug!,
          color: tagData.color!,
          is_scored: tagData.is_scored ?? false
        })
      }
      setIsTagModalOpen(false)
      refetch()
    } catch (err) {
      console.error('Failed to save tag', err)
      setToastMessage('Nie udało się zapisać oznaczenia. Sprawdź konsolę.')
      throw err
    }
  }

  const handleDeleteTag = async (id: string) => {
    if (!window.confirm('Czy na pewno chcesz usunąć to oznaczenie? Zmiany będą nieodwracalne.')) return
    try {
      await deleteTag(id)
      refetch()
    } catch (err) {
      console.error('Failed to delete tag', err)
      setToastMessage('Nie udało się usunąć oznaczenia.')
    }
  }

  // --- QUESTIONS ACTIONS ---
  const handleOpenQuestionModal = (q?: QuestionType) => {
    setEditingQuestion(q || null)
    setIsQuestionModalOpen(true)
  }

  const handleSaveQuestion = async (payload: QuestionPayload, answers: AnswerPayload[]) => {
    try {
      await saveQuestionWithAnswers(editingQuestion?.id || null, payload, answers)
      setIsQuestionModalOpen(false)
      refetch()
    } catch (err) {
      console.error('Failed to save question', err)
      setToastMessage(err instanceof Error ? err.message : 'Nie udało się zapisać pytania.')
      throw err
    }
  }

  const handleDeleteQuestion = async (id: string) => {
    if (!window.confirm('Czy na pewno chcesz usunąć to pytanie i wszystkie jego odpowiedzi?')) return
    try {
      await deleteQuestion(id)
      refetch()
    } catch (err) {
      console.error('Failed to delete question', err)
      setToastMessage('Nie udało się usunąć pytania.')
    }
  }

  return (
    <>
      <Toast
        open={Boolean(toastMessage)}
        type="error"
        title="Mamy problem!"
        message={toastMessage}
        position="top"
        durationMs={5000}
        onClose={() => setToastMessage('')}
      />
      <div className="w-full max-w-[1400px] mx-auto pt-12 px-4 md:px-8">
        {/* Header */}
        <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            {/* Breadcrumbs */}
            <div className="text-[11px] xl:text-[12px] font-semibold tracking-wider text-primary/90 mb-1.5 font-manrope">
              Panel Admina &gt; Zarządzanie Quizem &gt; {tabLabels[activeTab]}
            </div>

            <h1 className="text-[36px] xl:text-[42px] font-bold text-dark font-manrope">
              {tabLabels[activeTab]}
            </h1>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-4 xl:gap-6">
            {activeTab === 'questions' && (
              <button
                onClick={() => handleOpenQuestionModal()}
                className="bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-full font-medium text-[14px] xl:text-[15px] transition-colors flex items-center gap-2 shadow-soft cursor-pointer"
              >
                <Plus className="size-4 xl:size-4.5" />
                Dodaj pytanie
              </button>
            )}

            {activeTab === 'tags' && (
              <button
                onClick={() => handleOpenTagModal()}
                className="bg-secondary hover:bg-secondary/90 text-white px-6 py-3 rounded-full font-medium text-[14px] xl:text-[15px] transition-colors flex items-center gap-2 shadow-sm cursor-pointer"
              >
                <Tag className="size-4 xl:size-4.5" />
                Nowe oznaczenie
              </button>
            )}

            {activeTab === 'layout' && (
              <>
                <button
                  onClick={() => setIsVersionControlOpen(true)}
                  className="bg-secondary-2 hover:bg-secondary-2/90 text-white px-6 py-3 rounded-full font-medium text-[14px] xl:text-[15px] transition-colors flex items-center gap-2 shadow-sm cursor-pointer"
                >
                  <History className="size-4 xl:size-4.5" />
                  Kontrola wersji
                </button>
                <button 
                  onClick={() => window.open('/quiz', '_blank')}
                  className="bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-full font-medium text-[14px] xl:text-[15px] transition-colors flex items-center gap-2 shadow-sm cursor-pointer"
                >
                  <PlayCircle className="size-4 xl:size-4.5" />
                  Rozwiąż Quiz
                </button>
              </>
            )}
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="flex items-center gap-8 xl:gap-12 mb-12">
          {(Object.keys(tabLabels) as TabType[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-2 xl:pb-3 text-[14px] xl:text-[16px] font-medium transition-colors relative cursor-pointer ${activeTab === tab ? 'text-primary' : 'text-dark/50 hover:text-dark/80'
                }`}
            >
              {tabLabels[tab]}
              {activeTab === tab && (
                <div className="absolute bottom-[-1px] left-0 right-0 h-[2px] bg-primary" />
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="pb-20 max-w-[1000px] 3xl:max-w-[1200px] mx-auto">
          {isLoading ? (
            <div className="flex justify-center items-center mt-12 text-dark/50">
              Ładowanie danych z bazy...
            </div>
          ) : (
            <>
              {activeTab === 'questions' && <QuestionsTab questions={questions} onEdit={handleOpenQuestionModal} onDelete={handleDeleteQuestion} />}
              {activeTab === 'tags' && <TagsTab tags={tags} onEdit={handleOpenTagModal} onDelete={handleDeleteTag} onRefresh={refetch} />}
              {activeTab === 'layout' && <LayoutTab questions={questions} onOpenVersionControl={() => setIsVersionControlOpen(true)} />}
            </>
          )}
        </div>

        {/* Modals */}
        <TagModal
          isOpen={isTagModalOpen}
          onClose={() => setIsTagModalOpen(false)}
          onSave={handleSaveTag}
          initialData={editingTag}
        />
        <QuestionModal
          isOpen={isQuestionModalOpen}
          onClose={() => setIsQuestionModalOpen(false)}
          onSave={handleSaveQuestion}
          initialData={editingQuestion}
          availableTags={tags}
        />
        <VersionControlModal
          isOpen={isVersionControlOpen}
          onClose={() => setIsVersionControlOpen(false)}
          currentLayoutItems={currentDraft?.items || []}
          currentDraftName={currentDraft?.name || 'Nowy Draft'}
          onLoadDraft={(version: QuizVersion) => {
            saveDraftToLocal({
              items: version.layout_data,
              name: version.name,
              lastModified: new Date().toISOString(),
              versionId: version.id
            })
            window.dispatchEvent(new Event('draftUpdated'))
          }}
          onPublished={() => { }}
        />
      </div>
    </>
  )
}
