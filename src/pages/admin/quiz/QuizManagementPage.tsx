import { useState } from 'react'
import { Plus, PlayCircle, History, Tag } from 'lucide-react'
import { QuestionsTab } from './QuestionsTab'
import { TagsTab } from './TagsTab'
import { LayoutTab } from './LayoutTab'
import { useQuizData } from '../../../hooks/useQuizData'
import { TagModal } from './components/TagModal'
import { QuestionModal } from './components/QuestionModal'
import { QuizVersionModal } from './components/VersionControlModal'
import { createTag, updateTag, deleteTag, saveQuestionWithAnswers, deleteQuestion } from '../../../api/quiz.api'
import type { Tag as TagType, Question as QuestionType, QuestionPayload, AnswerPayload } from '../../../types/quiz'
import Toast from '../../../components/ui/popups/Toast'
import { ConfirmDialog } from '../../../components/ui/popups/ConfirmDialog'
import { DraftConflictNotice, SaveIndicator } from '../../../components/admin/DraftStatus'
import { REQUIRED_TAG_GROUPS, layoutQuestionIds } from '../../../utils/quizVersion'
import { useQuizDraft } from './hooks/useQuizDraft'
import { useDraftContent, useQuizVersions, versionMatchesDraft } from './hooks/useQuizVersions'

type TabType = 'questions' | 'tags' | 'layout'

type PendingDelete =
  | { kind: 'question'; item: QuestionType }
  | { kind: 'tag'; item: TagType }

const REQUIRED_SLUGS = new Set(REQUIRED_TAG_GROUPS.flatMap(g => g.slugs))

function short(text: string, max = 60) {
  const t = text.trim()
  return t.length > max ? `${t.slice(0, max)}…` : t
}

export function QuizManagementPage() {
  const [activeTab, setActiveTab] = useState<TabType>('questions')
  const { questions, tags, isLoading, refetch } = useQuizData()

  // Working package = question/tag library + layout draft (DB, autosaved).
  const draft = useQuizDraft()
  const versions = useQuizVersions({ flushDraft: draft.flush, getRevision: draft.getRevision })
  const draftContent = useDraftContent(draft.items, [questions, tags], draft.isLoaded && !isLoading)
  const live = versions.liveVersion
  const hasUnpublishedChanges =
    live !== null && draftContent.isReady && draftContent.content !== null &&
    !versionMatchesDraft(live, draft.items, draftContent.content)

  // Tag Modal State
  const [isTagModalOpen, setIsTagModalOpen] = useState(false)
  const [editingTag, setEditingTag] = useState<TagType | null>(null)

  // Question Modal State
  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState<QuestionType | null>(null)

  const [isVersionControlOpen, setIsVersionControlOpen] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null)
  const [toastMessage, setToastMessage] = useState('')
  const [dismissedImportInfo, setDismissedImportInfo] = useState(false)

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

  const handleDeleteTag = (id: string) => {
    const tag = tags.find(t => t.id === id)
    if (tag) setPendingDelete({ kind: 'tag', item: tag })
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

  const handleDeleteQuestion = (id: string) => {
    const question = questions.find(q => q.id === id)
    if (question) setPendingDelete({ kind: 'question', item: question })
  }

  /** Errors are shown inside the confirm dialog. */
  const confirmDelete = async () => {
    if (!pendingDelete) return
    if (pendingDelete.kind === 'question') await deleteQuestion(pendingDelete.item.id)
    else await deleteTag(pendingDelete.item.id)
    setPendingDelete(null)
    refetch()
  }

  const inDraftLayout = pendingDelete?.kind === 'question' && layoutQuestionIds(draft.items).includes(pendingDelete.item.id)

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
      <Toast
        open={draft.importedFromBrowser && !dismissedImportInfo}
        type="success"
        title="Przeniesiono szkic układu"
        message="Twój dotychczasowy szkic układu z tej przeglądarki został zapisany w bazie. Od teraz układ zapisuje się automatycznie."
        position="top"
        durationMs={8000}
        onClose={() => setDismissedImportInfo(true)}
      />
      <div className="w-full max-w-[1400px] mx-auto pt-12 px-4 md:px-8">
        {/* Header */}
        <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            {/* Breadcrumbs */}
            <div className="text-[11px] xl:text-[12px] font-semibold tracking-wider text-primary/90 mb-1.5 font-manrope">
              Panel Admina &gt; Zarządzanie Quizem &gt; {tabLabels[activeTab]}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-[36px] xl:text-[42px] font-bold text-dark font-manrope">
                {tabLabels[activeTab]}
              </h1>
              {live ? (
                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide bg-green-100 text-green-800">
                  Live · v{live.version_number}
                </span>
              ) : !versions.isLoading && (
                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide bg-amber-100 text-amber-800">
                  Nieopublikowany
                </span>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-4 xl:gap-6">
            {draft.isLoaded && <SaveIndicator status={draft.status} onRetry={() => void draft.flush().catch(() => undefined)} />}

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

            <button
              onClick={() => setIsVersionControlOpen(true)}
              className="bg-secondary-2 hover:bg-secondary-2/90 text-white px-6 py-3 rounded-full font-medium text-[14px] xl:text-[15px] transition-colors flex items-center gap-2 shadow-sm cursor-pointer"
            >
              <History className="size-4 xl:size-4.5" />
              Kontrola wersji
            </button>

            {activeTab === 'layout' && (
              <button
                onClick={() => window.open('/quiz', '_blank')}
                title="Otwiera quiz w wersji live (tak, jak widzą go użytkownicy)"
                className="bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-full font-medium text-[14px] xl:text-[15px] transition-colors flex items-center gap-2 shadow-sm cursor-pointer"
              >
                <PlayCircle className="size-4 xl:size-4.5" />
                Rozwiąż Quiz
              </button>
            )}
          </div>
        </div>

        {draft.status === 'conflict' && <DraftConflictNotice subject="Układ quizu" onOverwrite={draft.overwriteRemote} />}

        {draft.loadError && (
          <div className="mb-6 rounded-[16px] border border-red-200 bg-red-50 px-5 py-4 text-[14px] text-[#7A2533]">{draft.loadError}</div>
        )}

        {hasUnpublishedChanges && live && (
          <p className="mb-6 flex items-center gap-2 text-[13px] text-[#B26B00]">
            <span className="size-1.5 shrink-0 rounded-full bg-[#D9822B]" />
            Masz zmiany nieopublikowane — użytkownicy widzą v{live.version_number} „{live.name}”. Pytania, oznaczenia i układ trafią do nich dopiero po zapisaniu i opublikowaniu nowej wersji w „Kontroli wersji”.
          </p>
        )}

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
          {isLoading || (activeTab === 'layout' && !draft.isLoaded) ? (
            <div className="flex justify-center items-center mt-12 text-dark/50">
              Ładowanie danych z bazy...
            </div>
          ) : (
            <>
              {activeTab === 'questions' && <QuestionsTab questions={questions} onEdit={handleOpenQuestionModal} onDelete={handleDeleteQuestion} />}
              {activeTab === 'tags' && <TagsTab tags={tags} onEdit={handleOpenTagModal} onDelete={handleDeleteTag} onRefresh={refetch} />}
              {activeTab === 'layout' && <LayoutTab questions={questions} items={draft.items} setItems={draft.setItems} />}
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
        <QuizVersionModal
          isOpen={isVersionControlOpen}
          onClose={() => setIsVersionControlOpen(false)}
          draftItems={draft.items}
          draftContent={draftContent.content}
          draftReady={draftContent.isReady && draft.isLoaded}
          versions={versions.versions}
          liveVersion={live}
          isLoading={versions.isLoading}
          loadError={versions.loadError}
          onSaveVersion={versions.saveVersion}
          onLoadVersion={v => draft.setItems(v.layout_data)}
          onPublish={versions.publish}
          onDelete={versions.remove}
        />

        <ConfirmDialog
          open={pendingDelete !== null}
          tone="danger"
          title={pendingDelete?.kind === 'tag' ? 'Usunąć oznaczenie?' : 'Usunąć pytanie?'}
          description={
            pendingDelete?.kind === 'tag'
              ? <>Oznaczenie <b>„{pendingDelete.item.slug}”</b> zostanie usunięte z biblioteki i ze wszystkich odpowiedzi.</>
              : <>Pytanie <b>„{pendingDelete ? short(pendingDelete.item.content) : ''}”</b> i wszystkie jego odpowiedzi zostaną usunięte z biblioteki.</>
          }
          consequences={[
            'Tej operacji nie można cofnąć.',
            'Wersja live i zapisane wersje się nie zmienią — użytkownicy nadal widzą dotychczasową treść, dopóki nie opublikujesz nowej wersji.',
            ...(pendingDelete?.kind === 'tag' ? ['Punktacja tego oznaczenia zniknie ze wszystkich odpowiedzi w bibliotece.'] : []),
            ...(pendingDelete?.kind === 'tag' && REQUIRED_SLUGS.has(pendingDelete.item.slug)
              ? ['To oznaczenie jest potrzebne do wyliczenia wyniku quizu — bez niego nie opublikujesz nowej wersji.']
              : []),
            ...(inDraftLayout ? ['Pytanie jest użyte w szkicu układu — szkic będzie niekompletny, dopóki nie usuniesz go z układu.'] : []),
          ]}
          confirmLabel={pendingDelete?.kind === 'tag' ? 'Tak, usuń oznaczenie' : 'Tak, usuń pytanie'}
          onConfirm={confirmDelete}
          onCancel={() => setPendingDelete(null)}
        />
      </div>
    </>
  )
}
