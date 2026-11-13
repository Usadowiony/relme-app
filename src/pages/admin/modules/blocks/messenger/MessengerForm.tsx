import { useState } from 'react'
import type { ExerciseMessengerConfig } from '../../../../../types/modules'
import { MESSENGER_EXPLANATION_KEY } from '../../../../../utils/moduleFlow'
import { BlockTabs } from '../fields'
import type { BlockFormProps } from '../fields'
import { ConversationEditor } from './ConversationEditor'
import { ExplanationEditor } from './ExplanationEditor'

type Tab = 'conversation' | 'explanations'

export function MessengerForm({ config, onChange, errors, readOnly }: BlockFormProps<ExerciseMessengerConfig>) {
  const [tab, setTab] = useState<Tab>('conversation')

  const errorKeys = Object.keys(errors)
  const explanationErrors = errorKeys.filter(k => MESSENGER_EXPLANATION_KEY.test(k)).length

  return (
    <div className="flex flex-col gap-5 min-w-0">
      <BlockTabs
        active={tab}
        onChange={setTab}
        tabs={[
          { id: 'conversation', label: 'Treść ćwiczenia', errorCount: errorKeys.length - explanationErrors },
          { id: 'explanations', label: 'Interpretacja odpowiedzi', errorCount: explanationErrors },
        ]}
      />

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
