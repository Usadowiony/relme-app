import { useState } from 'react'
import type { ExerciseMessengerConfig } from '../../../../../types/modules'
import { MESSENGER_EXPLANATION_KEY } from '../../../../../utils/moduleFlow'
import type { BlockFormProps } from '../fields'
import { ConversationEditor } from './ConversationEditor'
import { ExplanationEditor } from './ExplanationEditor'

type Tab = 'conversation' | 'explanations'

const TABS: { id: Tab; label: string }[] = [
  { id: 'conversation', label: 'Treść ćwiczenia' },
  { id: 'explanations', label: 'Interpretacja odpowiedzi' },
]

export function MessengerForm({ config, onChange, errors, readOnly }: BlockFormProps<ExerciseMessengerConfig>) {
  const [tab, setTab] = useState<Tab>('conversation')

  const errorKeys = Object.keys(errors)
  const errorCount: Record<Tab, number> = {
    explanations: errorKeys.filter(k => MESSENGER_EXPLANATION_KEY.test(k)).length,
    conversation: errorKeys.filter(k => !MESSENGER_EXPLANATION_KEY.test(k)).length,
  }

  return (
    <div className="flex flex-col gap-5 min-w-0">
      <div role="tablist" className="flex gap-1 self-start rounded-full bg-neutral p-1">
        {TABS.map(t => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-[13px] font-semibold transition-colors cursor-pointer ${
              tab === t.id ? 'bg-white text-dark shadow-sm' : 'text-dark/55 hover:text-dark'
            }`}
          >
            {t.label}
            {errorCount[t.id] > 0 && (
              <span className="rounded-full bg-[#C03448] px-1.5 text-[10px] font-bold leading-4 text-white">{errorCount[t.id]}</span>
            )}
          </button>
        ))}
      </div>

      {tab === 'conversation' ? (
        <fieldset disabled={readOnly} className="min-w-0">
          <ConversationEditor config={config} onChange={onChange} errors={errors} readOnly={readOnly} />
        </fieldset>
      ) : (
        <ExplanationEditor config={config} onChange={onChange} errors={errors} readOnly={readOnly} />
      )}
    </div>
  )
}
