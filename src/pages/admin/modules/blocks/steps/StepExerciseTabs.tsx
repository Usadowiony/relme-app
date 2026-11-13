import { useState } from 'react'
import type { ReactNode } from 'react'
import { STEP_EXERCISE_INTERPRETATION_KEY } from '../../../../../utils/moduleFlow'
import type { ValidationErrors } from '../../../../../utils/moduleFlow'
import { BlockTabs } from '../fields'

type Tab = 'content' | 'interpretation'

/**
 * Two-tab shell of a step exercise popup. The content tab is locked by a
 * fieldset in read-only mode; the interpretation tab locks its inputs itself
 * (its answer pickers must stay clickable).
 */
export function StepExerciseTabs({ errors, readOnly, content, interpretation }: {
  errors: ValidationErrors
  readOnly: boolean
  content: ReactNode
  interpretation: ReactNode
}) {
  const [tab, setTab] = useState<Tab>('content')

  const errorKeys = Object.keys(errors)
  const interpretationErrors = errorKeys.filter(k => STEP_EXERCISE_INTERPRETATION_KEY.test(k)).length

  return (
    <div className="flex flex-col gap-5 min-w-0">
      <BlockTabs
        active={tab}
        onChange={setTab}
        tabs={[
          { id: 'content', label: 'Treść ćwiczenia', errorCount: errorKeys.length - interpretationErrors },
          { id: 'interpretation', label: 'Interpretacja odpowiedzi', errorCount: interpretationErrors },
        ]}
      />

      {tab === 'content' ? (
        <fieldset disabled={readOnly} className="min-w-0">
          {content}
        </fieldset>
      ) : (
        interpretation
      )}
    </div>
  )
}
