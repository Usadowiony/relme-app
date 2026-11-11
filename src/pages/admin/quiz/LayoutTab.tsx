import { useState, useMemo, useEffect } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import { Trash2, Plus, Split, ChevronUp, ChevronDown } from 'lucide-react'
import type { Question, LayoutItem } from '../../../types/quiz'
import { QuestionPickerModal } from './components/QuestionPickerModal'
import { PathModal } from './components/PathModal'
import { useLayoutTree, findSiblingIds } from './hooks/useLayoutTree'

// --- CONSTANTS ---
const DEPTH_BG = [
  'bg-[#F4FAFA]/70',
  'bg-[#EBF4FA]/60',
  'bg-[#1dd3b0]',
  'bg-[#E3EBFC]',
  'bg-[#DAE4FB]',
]

function getDepthBg(depth: number): string {
  return DEPTH_BG[Math.min(depth, DEPTH_BG.length - 1)]
}

function getTypeColor(type: string): string {
  switch (type) {
    case 'single': return '#219ebc'
    case 'multi': return '#ef476f'
    case 'scale': return '#52b788'
    default: return '#888'
  }
}

function getTypeLabel(type: string): string {
  switch (type) {
    case 'single': return 'Jednokrotny'
    case 'multi': return 'Wielokrotny'
    case 'scale': return 'Skala'
    default: return type
  }
}

// --- SUB-COMPONENTS ---
type QuestionCardProps = {
  question: Question
  item: LayoutItem
  isRoot: boolean
  position: number
  depth: number
  onRemove: () => void
  canMoveUp: boolean
  canMoveDown: boolean
  onMoveUp: () => void
  onMoveDown: () => void
  onAddPath: (questionId: string, answerId: string) => void
  onRemovePath: (questionId: string, pathIdx: number) => void
  onAddNestedQuestion: (questionId: string, pathIdx: number) => void
  onRemoveNestedQuestion: (questionId: string, pathIdx: number, childIdx: number) => void
  onMoveNestedQuestion: (questionId: string, pathIdx: number, fromIdx: number, toIdx: number) => void
  questionsMap: Map<string, Question>
  defaultCollapsed?: boolean
}

function QuestionCard({
  question,
  item,
  isRoot,
  position,
  depth,
  onRemove,
  canMoveUp,
  canMoveDown,
  onMoveUp,
  onMoveDown,
  onAddPath,
  onRemovePath,
  onAddNestedQuestion,
  onRemoveNestedQuestion,
  onMoveNestedQuestion,
  questionsMap,
  defaultCollapsed = true,
}: QuestionCardProps) {
  const [collapsedPaths, setCollapsedPaths] = useState<Set<number>>(() => {
    if (!defaultCollapsed) return new Set()
    return new Set(item.paths.map((_, i) => i))
  })

  const togglePath = (pIdx: number) => {
    setCollapsedPaths(prev => {
      const next = new Set(prev)
      if (next.has(pIdx)) next.delete(pIdx)
      else next.add(pIdx)
      return next
    })
  }

  const answerPathMap = new Map<string, { pathName: string; pathIdx: number }>()
  item.paths.forEach((p, idx) => {
    answerPathMap.set(p.answer_id, { pathName: p.path_name, pathIdx: idx })
  })

  const displayAnswers = question.question_type === 'scale'
    ? []
    : (question.answers || [])

  const typeColor = getTypeColor(question.question_type)

  return (
    <div>
      {/* Main question card */}
      <div className="bg-white rounded-[24px] p-8 shadow-soft border border-gray/70 w-full relative z-10">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-2">
            <div
              className="text-[10px] font-semibold tracking-widest uppercase px-3 py-1.5 rounded-full"
              style={{ backgroundColor: `${typeColor}18`, color: typeColor }}
            >
              {isRoot ? 'Root' : `#${position}`} • {getTypeLabel(question.question_type)}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={canMoveUp ? onMoveUp : undefined}
              disabled={!canMoveUp}
              className={`size-7 rounded-full flex items-center justify-center transition-colors ${canMoveUp ? 'text-dark/70 hover:text-dark/70 hover:bg-neutral cursor-pointer' : 'text-dark/12 cursor-default'}`}
              title="Przesuń w górę"
            >
              <ChevronUp className="size-5" />
            </button>
            <button
              onClick={canMoveDown ? onMoveDown : undefined}
              disabled={!canMoveDown}
              className={`size-7 rounded-full flex items-center justify-center transition-colors ${canMoveDown ? 'text-dark/40 hover:text-dark/70 hover:bg-neutral cursor-pointer' : 'text-dark/12 cursor-default'}`}
              title="Przesuń w dół"
            >
              <ChevronDown className="size-5" />
            </button>
            <button
              onClick={onRemove}
              className="ml-2 size-7 rounded-full flex items-center justify-center text-[#D15F5F] opacity-90 hover:opacity-100 hover:bg-red-50 transition-all cursor-pointer"
              title="Usuń z układu"
            >
              <Trash2 className="size-[16px]" />
            </button>
          </div>
        </div>

        <h3 className="text-[18px] xl:text-[20px] font-semibold text-dark mb-6 font-manrope">
          {question.content}
        </h3>

        {question.question_type === 'scale' && (
          <div
            className="text-[11px] font-medium rounded-[12px] px-4 py-3 text-center"
            style={{ backgroundColor: `${typeColor}10`, color: `${typeColor}CC` }}
          >
            Skala 1-10 • Brak rozgałęzień
          </div>
        )}

        {displayAnswers.length > 0 && (
          <div className="flex flex-col gap-3">
            {displayAnswers.map((ans, idx) => {
              const letter = String.fromCharCode(65 + idx)
              const pathInfo = answerPathMap.get(ans.id)

              return (
                <div
                  key={ans.id}
                  className="border rounded-[16px] py-3 px-5 flex items-center justify-between bg-white hover:bg-neutral/50 transition-colors"
                  style={{ borderColor: `${typeColor}30` }}
                >
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    <div
                      className="size-[28px] xl:size-[32px] rounded-full font-bold text-xs xl:text-sm flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${typeColor}18`, color: typeColor }}
                    >
                      {letter}
                    </div>
                    <span className="text-[13px] xl:text-[15px] font-medium text-dark truncate">
                      {ans.content}
                    </span>
                  </div>

                  {pathInfo ? (
                    <span className="text-[12px] text-dark/70 font-medium shrink-0 ml-3">
                      → Ścieżka: <span className="text-dark/70 font-semibold">{pathInfo.pathName}</span>
                    </span>
                  ) : (
                    <button
                      onClick={() => onAddPath(question.id, ans.id)}
                      className="size-7 rounded-full border border-dashed border-dakr/70 flex items-center justify-center text-dark/70 hover:text-dark/60 hover:border-dark/40 transition-colors cursor-pointer shrink-0 ml-3"
                    >
                      <Plus className="size-4" />
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Paths Container - Now INSIDE the question card */}
        {item.paths.length > 0 && (
          <div className="mt-8 flex flex-col gap-4 border-t border-gray/10 pt-8">
            {item.paths.map((path, pIdx) => {
              const isCollapsed = collapsedPaths.has(pIdx)
              return (
                <div key={`path-${path.answer_id}`} className="w-full">
                  <div className={`rounded-[24px] shadow-sm border border-black/30 w-full relative z-10 ${getDepthBg(depth)}`}>
                    <div
                      className="flex items-center justify-between px-8 py-5 cursor-pointer select-none"
                      onClick={() => togglePath(pIdx)}
                    >
                      <div className="flex items-center gap-2 text-[11px] font-bold tracking-widest text-dark/80 uppercase">
                        <Split className="size-[12px]" />
                        Ścieżka {path.path_name}
                        <span className="text-dark/60 font-medium normal-case tracking-normal ml-1">
                          ({path.children.length} {path.children.length === 1 ? 'pytanie' : 'pytań'})
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); onRemovePath(question.id, pIdx) }}
                          className="mr-2 size-7 rounded-full flex items-center justify-center text-[#D15F5F] opacity-90 hover:opacity-100 hover:bg-red-50 transition-all cursor-pointer"
                        >
                          <Trash2 className="size-[16px]" />
                        </button>
                        <ChevronDown
                          className={`size-5 text-dark/70 transition-transform duration-200 ${isCollapsed ? '-rotate-90' : ''}`}
                        />
                      </div>
                    </div>

                    {!isCollapsed && (
                      <div className="px-8 pb-8">
                        {path.children.map((child, cIdx) => {
                          const childQ = questionsMap.get(child.question_id)
                          if (!childQ) return null

                          return (
                            <div key={`nested-${child.question_id}-${cIdx}`} className="mb-4">
                              <QuestionCard
                                question={childQ}
                                item={child}
                                isRoot={false}
                                position={cIdx + 1}
                                depth={depth + 1}
                                onRemove={() => onRemoveNestedQuestion(question.id, pIdx, cIdx)}
                                canMoveUp={cIdx > 0}
                                canMoveDown={cIdx < path.children.length - 1}
                                onMoveUp={() => onMoveNestedQuestion(question.id, pIdx, cIdx, cIdx - 1)}
                                onMoveDown={() => onMoveNestedQuestion(question.id, pIdx, cIdx, cIdx + 1)}
                                onAddPath={onAddPath}
                                onRemovePath={onRemovePath}
                                onAddNestedQuestion={onAddNestedQuestion}
                                onRemoveNestedQuestion={onRemoveNestedQuestion}
                                onMoveNestedQuestion={onMoveNestedQuestion}
                                questionsMap={questionsMap}
                                defaultCollapsed={true}
                              />
                            </div>
                          )
                        })}

                        <button
                          onClick={() => onAddNestedQuestion(question.id, pIdx)}
                          className="mt-4 w-full py-4 rounded-[12px] bg-black text-white  hover:bg-black/90 transition-colors font-bold text-[11px] tracking-widest uppercase cursor-pointer"
                        >
                          Dodaj zagnieżdżone pytanie
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}


// --- MAIN COMPONENT ---
type LayoutTabProps = {
  questions: Question[]
  /** Working layout (owned by the page, autosaved to the DB). */
  items: LayoutItem[]
  setItems: Dispatch<SetStateAction<LayoutItem[]>>
}

export function LayoutTab({ questions, items, setItems }: LayoutTabProps) {
  const {
    draft,
    addRootQuestion,
    addNestedQuestionToPath,
    removeRootQuestion,
    removeNestedQuestionFromPath,
    moveRootQuestion,
    moveNestedQuestionInPath,
    addPath,
    removePathFromNode,
    cleanStaleItems
  } = useLayoutTree(items, setItems)

  const [isPickerOpen, setIsPickerOpen] = useState(false)
  const [pickerTarget, setPickerTarget] = useState<{ type: 'root' } | { type: 'nested', questionId: string, pathIdx: number } | null>(null)
  const [pickerSiblingIds, setPickerSiblingIds] = useState<string[]>([])

  const [isPathModalOpen, setIsPathModalOpen] = useState(false)
  const [pathTarget, setPathTarget] = useState<{ questionId: string, answerId: string } | null>(null)

  const questionsMap = useMemo(() => new Map(questions.map(q => [q.id, q])), [questions])

  useEffect(() => {
    const validItems = draft.items
      .map(item => ({ item, question: questionsMap.get(item.question_id) }))
      .filter(entry => entry.question != null)

    if (validItems.length < draft.items.length && questions.length > 0) {
      const validIds = new Set<string>()
      questionsMap.forEach((_, id) => validIds.add(id))
      setTimeout(() => {
        cleanStaleItems(validIds)
      }, 0)
    }
  }, [draft.items, questionsMap, questions.length, cleanStaleItems])


  const openPickerForRoot = () => {
    setPickerTarget({ type: 'root' })
    setPickerSiblingIds(draft.items.map(i => i.question_id))
    setIsPickerOpen(true)
  }

  const openPickerForNested = (questionId: string, pathIdx: number) => {
    setPickerTarget({ type: 'nested', questionId, pathIdx })
    setPickerSiblingIds(findSiblingIds(draft.items, questionId, pathIdx))
    setIsPickerOpen(true)
  }

  const handleQuestionPicked = (questionId: string) => {
    setIsPickerOpen(false)
    if (!pickerTarget) return

    if (pickerTarget.type === 'root') {
      addRootQuestion(questionId)
    } else {
      addNestedQuestionToPath(pickerTarget.questionId, pickerTarget.pathIdx, questionId)
    }
  }

  const openPathModal = (questionId: string, answerId: string) => {
    setPathTarget({ questionId, answerId })
    setIsPathModalOpen(true)
  }

  const handlePathCreated = (pathName: string) => {
    setIsPathModalOpen(false)
    if (!pathTarget) return
    addPath(pathTarget.questionId, pathTarget.answerId, pathName)
  }

  if (draft.items.length === 0 && questions.length === 0) {
    return (
      <div className="mt-16 flex flex-col items-center justify-center text-center">
        <div className="size-14 bg-secondary-2/80 rounded-full flex items-center justify-center mb-4">
          <Split className="size-6 text-white" />
        </div>
        <h3 className="text-xl font-semibold text-dark font-manrope">Brak układu</h3>
        <p className="text-dark/50 mt-2">Użyj zakładki "Pytania i odpowiedzi", aby dodać pierwsze pytania do układu.</p>
      </div>
    )
  }

  return (
    <>
      <div className="flex flex-col items-center mt-8 pb-20 relative">
        {draft.items.length > 0 && (
          <div className="absolute top-0 bottom-[120px] left-1/2 -translate-x-1/2 w-px bg-gray/30 -z-10" />
        )}

        {(() => {
          const validItems = draft.items
            .map((item, originalIdx) => ({ item, originalIdx, question: questionsMap.get(item.question_id) }))
            .filter(entry => entry.question != null)

          return validItems.map(({ item, question }, visibleIdx) => (
            <div key={`root-${item.question_id}-${visibleIdx}`} className="w-full max-w-5xl relative z-10">
              <QuestionCard
                question={question!}
                item={item}
                isRoot={visibleIdx === 0}
                position={visibleIdx + 1}
                depth={0}
                onRemove={() => removeRootQuestion(visibleIdx)}
                canMoveUp={visibleIdx > 0}
                canMoveDown={visibleIdx < validItems.length - 1}
                onMoveUp={() => moveRootQuestion(visibleIdx, visibleIdx - 1)}
                onMoveDown={() => moveRootQuestion(visibleIdx, visibleIdx + 1)}
                onAddPath={openPathModal}
                onRemovePath={(qId, pIdx) => removePathFromNode(qId, pIdx)}
                onAddNestedQuestion={(qId, pIdx) => openPickerForNested(qId, pIdx)}
                onRemoveNestedQuestion={(qId, pIdx, cIdx) => removeNestedQuestionFromPath(qId, pIdx, cIdx)}
                onMoveNestedQuestion={(qId, pIdx, fromIdx, toIdx) => moveNestedQuestionInPath(qId, pIdx, fromIdx, toIdx)}
                questionsMap={questionsMap}
                defaultCollapsed={true}
              />

              {visibleIdx < validItems.length - 1 && (
                <div className="flex justify-center">
                  <div className="w-px h-8 bg-gray/30" />
                </div>
              )}
            </div>
          ))
        })()}

        <div className="mt-12 flex flex-col items-center">
          <button
            onClick={openPickerForRoot}
            className="bg-white size-[60px] rounded-full shadow-soft border border-gray/30 flex items-center justify-center cursor-pointer hover:bg-neutral transition-colors z-10 relative"
          >
            <Plus className="size-6 text-dark/70" />
          </button>
          <div className="mt-4 text-[10px] font-bold tracking-widest text-dark/50 uppercase">
            Nowe Pytanie
          </div>
        </div>
      </div>

      <QuestionPickerModal
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        onSelect={handleQuestionPicked}
        questions={questions}
        siblingQuestionIds={pickerSiblingIds}
      />

      <PathModal
        isOpen={isPathModalOpen}
        onClose={() => setIsPathModalOpen(false)}
        onSave={handlePathCreated}
      />
    </>
  )
}
