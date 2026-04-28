import { useState } from 'react'
import { Search, Check } from 'lucide-react'
import type { Question } from '../../../../types/quiz'
import { BaseModal } from './BaseModal'
import { AsyncButton } from '../../../../components/ui/buttons/Button'

type QuestionPickerModalProps = {
  isOpen: boolean
  onClose: () => void
  onSelect: (questionId: string) => void
  questions: Question[]
  siblingQuestionIds: string[]
}

function getTypeLabel(type: string) {
  switch (type) {
    case 'single': return { label: 'Jednokrotny', color: '#219ebc' }
    case 'multi': return { label: 'Wielokrotny', color: '#ef476f' }
    case 'scale': return { label: 'Skala 1-10', color: '#52b788' }
    default: return { label: type, color: '#888' }
  }
}

function getAnswerContents(q: Question): string {
  if (q.question_type === 'scale') return 'Skala 1-10'
  if (!q.answers || q.answers.length === 0) return 'Brak odpowiedzi'
  return q.answers.map(a => a.content).join(', ')
}

export function QuestionPickerModal({ isOpen, onClose, onSelect, questions, siblingQuestionIds }: QuestionPickerModalProps) {
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const filtered = questions.filter(q =>
    q.content.toLowerCase().includes(search.toLowerCase())
  )

  const handleSelect = () => {
    if (!selectedId) return
    onSelect(selectedId)
    setSelectedId(null)
    setSearch('')
  }

  const handleClose = () => {
    setSelectedId(null)
    setSearch('')
    onClose()
  }

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Wybierz pytanie"
      subtitle="DODAJ DO UKŁADU"
      maxWidth="xl"
      footer={
        <>
          <AsyncButton variant="cancel" onClick={handleClose}>
            Anuluj
          </AsyncButton>
          <AsyncButton
            variant="dark"
            onClick={handleSelect}
            disabled={!selectedId}
            leftIcon={<Check className="size-4" />}
          >
            Dodaj pytanie
          </AsyncButton>
        </>
      }
    >
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-dark/40" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Szukaj pytania..."
          className="w-full pl-11 pr-4 py-3 rounded-[12px] bg-neutral border border-dark/20 focus:border-primary/50 text-dark text-[14px] font-medium focus:outline-none transition-colors"
        />
      </div>

      {/* Question list */}
      <div className="flex flex-col gap-2 max-h-[400px] overflow-y-auto custom-scrollbar -mx-1 px-1">
        {filtered.length === 0 ? (
          <div className="text-center text-dark/40 text-[13px] py-8">
            {questions.length === 0 ? 'Brak pytań w bazie. Dodaj pytania w zakładce "Pytania i odpowiedzi".' : 'Brak wyników dla podanej frazy.'}
          </div>
        ) : (
          filtered.map(q => {
            const alreadyOnPath = siblingQuestionIds.includes(q.id)
            const typeInfo = getTypeLabel(q.question_type)
            const isSelected = selectedId === q.id

            return (
              <button
                key={q.id}
                onClick={() => !alreadyOnPath && setSelectedId(isSelected ? null : q.id)}
                disabled={alreadyOnPath}
                className={`w-full text-left p-4 rounded-[16px] border transition-all ${alreadyOnPath
                  ? 'bg-neutral/60 border-gray/15 opacity-50 cursor-not-allowed'
                  : isSelected
                    ? 'bg-primary/5 border-primary/40 shadow-sm'
                    : 'bg-white border-dark/20 hover:border-gray/40 hover:bg-neutral/40 cursor-pointer'
                  }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span
                        className="text-[9px] font-bold tracking-widest uppercase px-2 py-0.5 rounded-full"
                        style={{ color: typeInfo.color, backgroundColor: `${typeInfo.color}20` }}
                      >
                        {typeInfo.label}
                      </span>
                      {alreadyOnPath && (
                        <span className="text-[9px] font-bold tracking-widest uppercase text-dark/40 px-2 py-0.5 rounded-full bg-dark/5">
                          Już na tej ścieżce
                        </span>
                      )}
                    </div>
                    <p className="text-[14px] font-semibold text-dark truncate">{q.content}</p>
                    <p className="mt-1.5 text-[11px] text-dark/40 font-medium line-clamp-1 overflow-hidden break-words">
                      {getAnswerContents(q)}
                    </p>
                  </div>
                  {isSelected && (
                    <div className="size-6 rounded-full bg-primary flex items-center justify-center shrink-0 mt-1">
                      <Check className="size-3.5 text-white" />
                    </div>
                  )}
                </div>
              </button>
            )
          })
        )}
      </div>
    </BaseModal>
  )
}
