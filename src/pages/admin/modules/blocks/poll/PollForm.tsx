import { useState } from 'react'
import { ChartNoAxesColumn, ClipboardList, Plus, X } from 'lucide-react'
import type { ExercisePollConfig } from '../../../../../types/modules'
import { MODULE_LIMITS, createId } from '../../../../../utils/moduleFlow'
import { InlineText } from '../fields'
import type { BlockFormProps } from '../fields'
import { POLL_THEME as T } from './theme'

// Editor that mirrors the mobile poll screen (mockup: "Co jest według Ciebie
// zawsze największym wyzwaniem w relacji?") — the question and every answer
// are inputs; the header is fixed UI. Results (%) exist only in the app.

const L = MODULE_LIMITS.poll

export function PollForm({ config, onChange, errors, readOnly }: BlockFormProps<ExercisePollConfig>) {
  // Only the answer added in this session gets focus (not the existing ones on open).
  const [focusId, setFocusId] = useState<string | null>(null)

  const addOption = () => {
    const id = createId()
    setFocusId(id)
    onChange({ ...config, options: [...config.options, { id, text: '' }] })
  }

  const setText = (id: string, text: string) =>
    onChange({ ...config, options: config.options.map(o => (o.id === id ? { ...o, text } : o)) })

  const removeOption = (id: string) => onChange({ ...config, options: config.options.filter(o => o.id !== id) })

  return (
    <fieldset disabled={readOnly} className="min-w-0">
      <div className="w-full rounded-[18px] border border-dark/25 p-3 sm:p-4" style={{ backgroundColor: T.screen }}>
        <div className="rounded-[16px] border border-gray/40 bg-white px-5 pt-5 pb-6 shadow-sm sm:px-6">
          <div className="flex items-center gap-2 text-dark/80">
            <ClipboardList className="size-[18px] shrink-0" style={{ color: T.accent }} />
            <span className="text-[12px] font-semibold">Twoja odpowiedź oraz odpowiedzi społeczności</span>
          </div>

          <div className="mt-4">
            <InlineText
              value={config.question}
              onChange={question => onChange({ ...config, question })}
              maxLength={L.question}
              placeholder="Wpisz treść pytania"
              error={errors.question}
              className="font-manrope text-[22px] font-bold leading-[1.25] text-dark"
            />
          </div>

          <div className="mt-6 flex flex-col gap-3">
            {config.options.map(option => {
              const error = errors[`option.${option.id}.text`]
              return (
                <div
                  key={option.id}
                  className="group relative rounded-[12px] px-4 py-3.5"
                  style={{ backgroundColor: T.option, boxShadow: `0 2px 0 ${T.optionShadow}` }}
                >
                  <div className="pr-6">
                    <InlineText
                      value={option.text}
                      onChange={text => setText(option.id, text)}
                      maxLength={L.option}
                      placeholder="Wpisz treść odpowiedzi"
                      error={error}
                      autoFocus={option.id === focusId}
                      className="text-[15px] font-semibold text-dark"
                    />
                  </div>
                  <button
                    type="button"
                    title="Usuń odpowiedź"
                    onClick={() => removeOption(option.id)}
                    className="absolute right-2 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-full text-dark/50 opacity-0 transition-opacity hover:bg-white hover:text-[#D15F5F] group-hover:opacity-100 focus:opacity-100 cursor-pointer disabled:hidden"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              )
            })}

            {config.options.length < L.maxOptions && (
              <button
                type="button"
                onClick={addOption}
                className="flex items-center justify-center gap-2 rounded-[12px] border border-dashed py-3.5 text-[13px] font-semibold transition-colors hover:bg-[#EEF5F6] cursor-pointer disabled:hidden"
                style={{ borderColor: `${T.accent}66`, color: T.accent }}
              >
                <Plus className="size-4" /> Dodaj odpowiedź
              </button>
            )}

            <p className={`text-center text-[11px] ${errors.options ? 'text-[#C03448]' : 'text-dark/45'}`}>
              {errors.options ??
                `${config.options.length}/${L.maxOptions} odpowiedzi · minimum ${L.minOptions}`}
            </p>
          </div>
        </div>

        <div className="mt-3 flex items-start gap-2 px-1 text-[12px] leading-snug text-dark/55">
          <ChartNoAxesColumn className="mt-px size-4 shrink-0" />
          <span>
            Po wybraniu odpowiedzi użytkownik zobaczy, jak głosowała społeczność: procent głosów przy każdej
            odpowiedzi, wyróżniony własny wybór i łączną liczbę odpowiedzi.
          </span>
        </div>
      </div>
    </fieldset>
  )
}
