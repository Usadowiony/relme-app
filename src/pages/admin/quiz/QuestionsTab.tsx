import { Pencil, Trash2 } from 'lucide-react'
import type { Question } from '../../../types/quiz'

export function QuestionsTab({ questions, onEdit, onDelete }: { questions: Question[]; onEdit: (q: Question) => void; onDelete: (id: string) => void }) {
  if (!questions || questions.length === 0) {
    return (
      <div className="mt-16 flex flex-col items-center justify-center text-center">
        <div className="size-14 bg-primary/80 rounded-full flex items-center justify-center mb-4">
          <Pencil className="size-6 text-white" />
        </div>
        <h3 className="text-xl font-semibold text-dark font-manrope">Brak pytań</h3>
        <p className="text-dark/50 mt-2">Użyj przycisku "Dodaj pytanie", aby rozpocząć budowę quizu.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 mt-8">
      {questions.map((q, idx) => {
        let typeLabel = ''
        let circleColor = ''
        let labelColor = ''

        switch (q.question_type) {
          case 'single':
            typeLabel = 'Jednokrotnego wyboru'
            circleColor = 'bg-[#219ebc]/20 text-[#219ebc]/80'
            labelColor = 'text-[#219ebc]/80'
            break
          case 'multi':
            typeLabel = 'Wielokrotnego wyboru'
            circleColor = 'bg-[#ffafcc]/30 text-[#ef476f]/70'
            labelColor = 'text-[#ef476f]/70'
            break
          case 'scale':
            typeLabel = 'Skala 1-10'
            circleColor = 'bg-[#52b788]/30 text-[#52b788]/80'
            labelColor = 'text-[#52b788]/80'
            break
          default:
            typeLabel = 'Jednokrotnego wyboru'
            circleColor = 'bg-[#219ebc]/20 text-[#219ebc]/80'
            labelColor = 'text-[#219ebc]/80'
        }

        return (
          <div key={q.id} className="bg-white rounded-[24px] py-6 px-8 shadow-soft border border-gray/20">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
              <div className="flex items-center gap-4 flex-wrap md:flex-nowrap">
                <div className={`size-10 shrink-0 rounded-full font-bold flex items-center justify-center font-manrope ${circleColor}`}>
                  {idx + 1}
                </div>
                <div className="flex flex-col">
                  <div className={`self-start text-[10px] font-bold uppercase tracking-widest py-1 rounded-full mb-1 ${labelColor}`}>
                    {typeLabel}
                  </div>
                  <h3 className="text-[18px] xl:text-[20px] font-semibold text-dark font-manrope">
                    {q.content}
                  </h3>
                </div>
              </div>
              <div className="flex items-center gap-3 mt-4 md:mt-0">
                <button onClick={() => onEdit(q)} className="text-primary-2 opacity-90 hover:opacity-100 transition-opacity cursor-pointer">
                  <Pencil className="size-[18px]" />
                </button>
                <button onClick={() => onDelete(q.id)} className="text-[#D15F5F] opacity-90 hover:opacity-100 transition-opacity cursor-pointer">
                  <Trash2 className="size-[18px]" />
                </button>
              </div>
            </div>

            {/* Render answers summary */}
            <div className="ml-14 flex flex-wrap gap-2">
              {q.question_type === 'scale' ? (() => {
                // Parse labels from the first answer's JSON content
                let startLabel = '1'
                let endLabel = '10'
                const firstAns = q.answers?.find((a) => {
                  try {
                    return JSON.parse(a.content).start
                  } catch {
                    return false
                  }
                })
                if (firstAns?.content) {
                  try {
                    const parsed = JSON.parse(firstAns.content)
                    if (parsed.start) startLabel = parsed.start
                    if (parsed.end) endLabel = parsed.end
                  } catch { /* fallback to defaults */ }
                }

                return (
                  <div className="mt-2 w-full max-w-[90%]">
                    <div className="relative h-2 w-full">
                      <div className="h-full w-full bg-[#EAEAEA] rounded-full overflow-hidden">
                        <div className="h-full bg-[#52b788]/70 w-1/2 rounded-full" />
                      </div>
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-4 bg-white border-[3px] border-[#52b788]/70 rounded-full shadow-sm" />
                    </div>
                    <div className="relative flex justify-between mt-4 text-[9px] font-bold tracking-widest text-dark/50 uppercase">
                      <span>{startLabel}</span>
                      <span>{endLabel}</span>
                    </div>
                  </div>
                )
              })() : (
                q.answers?.map((ans) => (
                  <div key={ans.id} className="bg-[#F1F3F5] text-dark/80 lg:text-[11px] font-medium px-3 py-1.5 rounded-full">
                    {ans.content}
                  </div>
                ))
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
