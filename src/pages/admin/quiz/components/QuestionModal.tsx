import { type Dispatch, type SetStateAction } from 'react'
import { Plus, Trash2, ChevronDown, Save } from 'lucide-react'
import type { Question, Tag, AnswerPayload, QuestionType } from '../../../../types/quiz'
import { BaseModal } from '../../../../components/ui/popups/BaseModal'
import { AsyncButton } from '../../../../components/ui/buttons/Button'
import { useQuestionForm } from '../hooks/useQuestionForm'

// --- SUB-COMPONENTS ---
const ScaleConfig = ({
  scaleLabels,
  setScaleLabels,
  error,
  setError
}: {
  scaleLabels: { start: string, end: string }
  setScaleLabels: Dispatch<SetStateAction<{ start: string, end: string }>>
  error: string
  setError: (e: string) => void
}) => (
  <div className="flex flex-col md:flex-row gap-4 mb-6">
    <div className="flex-1">
      <label className="block text-[10px] font-bold tracking-widest text-dark/50 mb-2">ETYKIETA POCZĄTKU (1)</label>
      <input
        type="text"
        maxLength={24}
        value={scaleLabels.start}
        onChange={e => {
          setScaleLabels(p => ({ ...p, start: e.target.value }))
          if (error.includes('etykiety')) setError('')
        }}
        placeholder="np. Zdecydowanie nie"
        className="w-full px-3 py-2 rounded-lg border border-dark/20 text-[13px] font-medium focus:border-primary/50 focus:outline-none"
      />
    </div>

    <div className="flex-1">
      <label className="block text-[10px] font-bold tracking-widest text-dark/50 mb-2">ETYKIETA KOŃCA (10)</label>
      <input
        type="text"
        maxLength={24}
        value={scaleLabels.end}
        onChange={e => {
          setScaleLabels(p => ({ ...p, end: e.target.value }))
          if (error.includes('etykiety')) setError('')
        }}
        placeholder="np. Zdecydowanie tak"
        className="w-full px-3 py-2 rounded-lg border border-dark/20 text-[13px] font-medium focus:border-primary/50 focus:outline-none"
      />
    </div>
  </div>
)

const AnswerManager = ({
  questionType,
  answers,
  answerErrors,
  openTagDropdownIdxs,
  availableTags,
  handleAnswerContentChange,
  handleRemoveAnswer,
  toggleDropdown,
  toggleTagForAnswer,
  updateTagPointsForAnswer
}: {
  questionType: QuestionType
  answers: AnswerPayload[]
  answerErrors: string[]
  openTagDropdownIdxs: number[]
  availableTags: Tag[]
  handleAnswerContentChange: (idx: number, val: string) => void
  handleRemoveAnswer: (idx: number) => void
  toggleDropdown: (idx: number) => void
  toggleTagForAnswer: (ansIdx: number, tagId: string) => void
  updateTagPointsForAnswer: (ansIdx: number, tagId: string, points: number) => void
}) => (
  <div className={`mt-4 flex flex-col gap-${questionType === 'scale' ? '3' : '4'}`}>
    {answers.map((ans, idx) => (
      <div key={idx} className="bg-neutral border border-dark/20 rounded-[16px] p-4 flex flex-col gap-3 relative transition-all">
        {questionType === 'scale' ? (
          <div className="flex justify-between items-center gap-4 border-b border-dark/20">
            <span className="text-dark font-semibold text-[14px]">Wartość skali: {idx + 1}</span>
            <button
              onClick={() => toggleDropdown(idx)}
              className={`px-3 py-1.5 rounded-full border border-dashed flex items-center gap-1.5 transition-colors cursor-pointer text-[10px] font-bold tracking-widest uppercase ${openTagDropdownIdxs.includes(idx) ? 'border-black text-primary' : 'border-black text-dark/50 hover:text-dark hover:border-dark'}`}
            >
              OZNACZENIA
            </button>
          </div>
        ) : (
          <div className="flex justify-between items-start gap-4">
            <input
              type="text"
              value={ans.content}
              onChange={(e) => handleAnswerContentChange(idx, e.target.value)}
              placeholder="Treść odpowiedzi..."
              className={`flex-1 bg-transparent text-dark font-medium text-[14px] focus:outline-none border-b ${answerErrors[idx] ? 'border-[#D15F5F]/50 focus:border-[#D15F5F]' : 'border-gray focus:border-primary/30'} pb-3 transition-colors`}
            />

            <div className="flex items-center gap-3">
              <button
                onClick={() => toggleDropdown(idx)}
                className={`px-3 py-1.5 rounded-full border border-dashed flex items-center gap-1.5 transition-colors cursor-pointer text-[10px] font-bold tracking-widest uppercase ${openTagDropdownIdxs.includes(idx) ? 'border-black text-primary' : 'border-black text-dark/50 hover:text-dark hover:border-dark'}`}
              >
                OZNACZENIA
              </button>
              <button
                onClick={() => handleRemoveAnswer(idx)}
                className=" text-dark/50 hover:text-[#D15F5F] transition-colors p-1 cursor-pointer"
              >
                <Trash2 className="size-[16px]" />
              </button>
            </div>
          </div>
        )}

        {answerErrors[idx] && (
          <div className={`text-[#D15F5F] text-[11px] font-bold tracking-wider mt-1 ${questionType !== 'scale' && 'mb-2'} animate-fade-in`}>
            * {answerErrors[idx]}
          </div>
        )}

        {openTagDropdownIdxs.includes(idx) && (
          <div className={`pt-${questionType === 'scale' ? '4' : '3 pb-1 border-t border-gray/10 mt-2'} animate-fade-in`}>
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-3">
              {availableTags.length === 0 ? (
                <div className="text-[11px] text-dark/50">Brak tagów do wyboru.</div>
              ) : (
                availableTags.map(t => {
                  const tagObj = ans.tags.find(x => x.tag_id === t.id)
                  const isSelected = !!tagObj

                  return (
                    <div key={t.id} className="flex items-center gap-1.5">
                      <button
                        onClick={() => toggleTagForAnswer(idx, t.id)}
                        className="text-[11px] font-semibold px-4 py-1.5 rounded-full cursor-pointer transition-all shadow-sm border"
                        style={isSelected ? {
                          backgroundColor: t.color || '#3B82F6',
                          color: '#fff',
                          borderColor: t.color || '#3B82F6'
                        } : {
                          backgroundColor: '#fff',
                          color: '#4B5563',
                          borderColor: '#E5E7EB'
                        }}
                      >
                        {t.slug}
                      </button>
                      {isSelected && t.is_scored && (
                        <input
                          type="number"
                          value={tagObj?.points || 0}
                          onChange={(e) => updateTagPointsForAnswer(idx, t.id, parseInt(e.target.value) || 0)}
                          className={`w-[42px] h-[30px] text-center bg-white rounded-lg text-[13px] font-semibold focus:outline-none shadow-sm transition-all`}
                          style={{
                            border: `1.5px solid ${t.color || '#3B82F6'}`,
                            color: '#1A1B1E'
                          }}
                        />
                      )}
                    </div>
                  )
                })
              )}
            </div>
          </div>
        )}
      </div>
    ))}
  </div>
)

// --- MAIN COMPONENT ---
type QuestionModalProps = {
  isOpen: boolean
  onClose: () => void
  onSave: (payload: { content: string, question_type: QuestionType, media_url?: string }, answers: AnswerPayload[]) => Promise<void> | void
  initialData?: Question | null
  availableTags: Tag[]
}

export function QuestionModal({ isOpen, onClose, onSave, initialData, availableTags }: QuestionModalProps) {
  const {
    content,
    setContent,
    mediaUrl,
    setMediaUrl,
    questionType,
    setQuestionType,
    answers,
    error,
    setError,
    answerErrors,
    isSaving,
    scaleLabels,
    setScaleLabels,
    openTagDropdownIdxs,
    handleAddAnswer,
    handleRemoveAnswer,
    handleAnswerContentChange,
    toggleDropdown,
    toggleTagForAnswer,
    updateTagPointsForAnswer,
    handleSave
  } = useQuestionForm({ isOpen, initialData, availableTags, onSave })

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={content || 'Nowe pytanie'}
      subtitle={initialData ? `EDYCJA PYTANIA` : 'NOWE PYTANIE'}
      maxWidth="2xl"
      footer={
        <>
          <AsyncButton variant="cancel" onClick={onClose}>
            Odrzuć zmiany
          </AsyncButton>
          <AsyncButton
            variant="dark"
            onClick={handleSave}
            leftIcon={<Save className="size-4" />}
            isLoading={isSaving}
          >
            Zapisz zmiany
          </AsyncButton>
        </>
      }
    >
      <div>
        <label className="block text-[11px] font-bold tracking-widest text-dark/90 uppercase mb-3">
          TREŚĆ PYTANIA
        </label>
        <input
          type="text"
          value={content}
          onChange={(e) => {
            setContent(e.target.value)
            if (error === 'Treść pytania nie może być pusta.') setError('')
          }}
          className="w-full px-4 py-3 rounded-[12px] bg-neutral border border-dark/20 focus:border-primary/50 text-dark text-[14px] font-medium focus:outline-none transition-colors"
          placeholder="Wpisz treść pytania..."
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-[11px] font-bold tracking-widest text-dark/90 uppercase mb-3">
            URL ZDJĘCIA (OPCJONALNE)
          </label>
          <input
            type="text"
            value={mediaUrl}
            onChange={(e) => setMediaUrl(e.target.value)}
            className="w-full px-4 py-3 rounded-[12px] bg-neutral border border-dark/20 focus:border-primary/50 text-dark text-[14px] font-medium focus:outline-none transition-colors"
            placeholder="https://..."
          />
        </div>
        <div>
          <label className="block text-[11px] font-bold tracking-widest text-dark/90 uppercase mb-3">
            RODZAJ ODPOWIEDZI
          </label>
          <div className="relative">
            <select
              value={questionType}
              onChange={(e) => setQuestionType(e.target.value as QuestionType)}
              className="w-full px-4 py-3 rounded-[12px] bg-neutral border border-dark/20 focus:border-primary/50 text-dark text-[14px] font-medium focus:outline-none transition-colors appearance-none cursor-pointer pr-10"
            >
              <option value="single">Jednokrotnego wyboru</option>
              <option value="multi">Wielokrotnego wyboru</option>
              <option value="scale">Skala 1-10</option>
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 size-4 text-dark/40 pointer-events-none" />
          </div>
        </div>
      </div>

      <div className="mt-4">
        {questionType === 'scale' ? (
          <>
            <div className="flex justify-between items-center mb-4">
              <label className="block text-[11px] font-bold tracking-widest text-dark/90 uppercase">
                OPCJE ODPOWIEDZI (SKALA 1-10)
              </label>
            </div>
            <ScaleConfig
              scaleLabels={scaleLabels}
              setScaleLabels={setScaleLabels}
              error={error}
              setError={setError}
            />
            <AnswerManager
              questionType={questionType}
              answers={answers}
              answerErrors={answerErrors}
              openTagDropdownIdxs={openTagDropdownIdxs}
              availableTags={availableTags}
              handleAnswerContentChange={handleAnswerContentChange}
              handleRemoveAnswer={handleRemoveAnswer}
              toggleDropdown={toggleDropdown}
              toggleTagForAnswer={toggleTagForAnswer}
              updateTagPointsForAnswer={updateTagPointsForAnswer}
            />
          </>
        ) : (
          <>
            <div className="flex justify-between items-center">
              <label className="block text-[11px] font-bold tracking-widest text-dark/90 uppercase">
                ODPOWIEDZI
              </label>
              <button
                onClick={handleAddAnswer}
                className="text-[11px] font-bold tracking-widest text-primary hover:text-primary/80 transition-colors flex items-center gap-1 uppercase cursor-pointer"
              >
                <Plus className="size-3" />
                DODAJ ODPOWIEDŹ
              </button>
            </div>
            <AnswerManager
              questionType={questionType}
              answers={answers}
              answerErrors={answerErrors}
              openTagDropdownIdxs={openTagDropdownIdxs}
              availableTags={availableTags}
              handleAnswerContentChange={handleAnswerContentChange}
              handleRemoveAnswer={handleRemoveAnswer}
              toggleDropdown={toggleDropdown}
              toggleTagForAnswer={toggleTagForAnswer}
              updateTagPointsForAnswer={updateTagPointsForAnswer}
            />
          </>
        )}
      </div>

      {error && (
        <div className="bg-[#D15F5F]/10 text-[#D15F5F] px-4 py-3 rounded-[12px] text-[13px] font-semibold tracking-wide animate-fade-in text-center mt-6">
          {error}
        </div>
      )}
    </BaseModal>
  )
}
