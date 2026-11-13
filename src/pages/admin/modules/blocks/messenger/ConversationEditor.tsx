import { Check, MessageCircleMore, Plus, X } from 'lucide-react'
import type { ExerciseMessengerConfig, MessengerNode, MessengerOption } from '../../../../../types/modules'
import { MODULE_LIMITS, createMessengerOptions } from '../../../../../utils/moduleFlow'
import type { ValidationErrors } from '../../../../../utils/moduleFlow'
import { replaceAt } from '../../../../../utils/arrays'
import { InlineText } from '../fields'
import type { BlockFormProps } from '../fields'
import { CONTACT_BUBBLE, MSG_GREEN as GREEN, MSG_TEAL as TEAL } from './theme'
import { AvatarCircle, PhoneFrame } from './MessengerFrame'

// Tab "Treść ćwiczenia": mirrors the mobile chat screen (mockup "Etap 4 ·
// Rozmowa"). The conversation is a tree: the contact's message → 3 answers →
// for each answer a "scenariusz" with the contact's reply, which may continue
// with 3 more answers (scenariusz 2.1, 2.2, 2.3 …).

const L = MODULE_LIMITS.messenger

export function ConversationEditor({ config, onChange, errors }: BlockFormProps<ExerciseMessengerConfig>) {
  const ctx: TreeContext = { errors }

  return (
    <PhoneFrame>
      <div className="mb-5 flex items-center gap-2 text-[13px] font-bold text-dark">
        <MessageCircleMore className="size-5 shrink-0" style={{ color: TEAL }} />
        Przeczytaj rozmowę i wybierz najlepszą odpowiedź.
      </div>

      <NodeEditor
        node={config.root}
        depth={1}
        path={[]}
        ctx={ctx}
        onChange={root => onChange({ ...config, root })}
      />
    </PhoneFrame>
  )
}

// --- Tree ---

type TreeContext = {
  errors: ValidationErrors
}

type NodeEditorProps = {
  node: MessengerNode
  depth: number // 1 = root; number of the choice this node's options would be
  path: number[] // scenario numbering, e.g. [2, 1] → "2.1"
  ctx: TreeContext
  onChange: (node: MessengerNode) => void
}

function NodeEditor({ node, depth, path, ctx, onChange }: NodeEditorProps) {
  const isRoot = depth === 1
  const hasMessage = node.message.trim().length > 0
  const hasOptions = node.options.length > 0
  const allOptionsFilled = hasOptions && node.options.every(o => o.text.trim().length > 0)
  const optionsError = ctx.errors[`node.${node.id}.options`]

  const setOption = (index: number, option: MessengerOption) =>
    onChange({ ...node, options: replaceAt(node.options, index, option) })

  const markCorrect = (index: number) =>
    onChange({ ...node, options: node.options.map((o, i) => ({ ...o, is_correct: i === index })) })

  const removeContinuation = () => {
    const hasContent = node.options.some(o => o.text.trim() || o.next.message.trim())
    if (hasContent && !window.confirm('Usunąć odpowiedzi i wszystkie scenariusze pod nimi?')) return
    onChange({ ...node, options: [] })
  }

  return (
    <div className="flex flex-col">
      <ContactMessage
        node={node}
        ctx={ctx}
        isRoot={isRoot}
        onChange={message => onChange({ ...node, message })}
      />

      {/* Continue this scenario with another choice */}
      {!isRoot && !hasOptions && hasMessage && depth <= L.maxDepth && (
        <button
          type="button"
          onClick={() => onChange({ ...node, options: createMessengerOptions() })}
          className="mt-2 flex items-center gap-1 self-end text-[11px] font-semibold opacity-60 hover:opacity-100 cursor-pointer disabled:hidden"
          style={{ color: TEAL }}
        >
          <Plus className="size-3.5" /> Dodaj kolejne odpowiedzi
        </button>
      )}

      {hasOptions && hasMessage && (
        <>
          <div className="mt-5 mb-3 flex items-center gap-3">
            <div className="h-px flex-1 bg-dark/15" />
            <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-dark/45">Jak odpowiesz?</span>
            <div className="h-px flex-1 bg-dark/15" />
            {!isRoot && (
              <button
                type="button"
                title="Usuń te odpowiedzi (zakończ scenariusz na wiadomości rozmówcy)"
                onClick={removeContinuation}
                className="flex size-6 items-center justify-center rounded-full text-dark/40 hover:bg-red-50 hover:text-[#D15F5F] cursor-pointer disabled:hidden"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          <div className="flex flex-col gap-3">
            {node.options.map((option, i) => (
              <OptionEditor
                key={option.id}
                option={option}
                index={i}
                error={ctx.errors[`option.${option.id}.text`]}
                onChange={next => setOption(i, next)}
                onMarkCorrect={() => markCorrect(i)}
              />
            ))}
          </div>
          {optionsError && <p className="mt-2 text-right text-[11px] text-[#C03448]">{optionsError}</p>}

          {allOptionsFilled && (
            <div className={`mt-6 flex flex-col gap-6 ${isRoot ? '' : 'ml-1 border-l-2 border-dashed border-dark/10 pl-3'}`}>
              {node.options.map((option, i) => (
                <Scenario
                  key={option.id}
                  option={option}
                  depth={depth + 1}
                  path={[...path, i + 1]}
                  ctx={ctx}
                  onChange={next => setOption(i, { ...option, next })}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

type ScenarioProps = {
  option: MessengerOption
  depth: number
  path: number[]
  ctx: TreeContext
  onChange: (next: MessengerNode) => void
}

function Scenario({ option, depth, path, ctx, onChange }: ScenarioProps) {
  return (
    <section className="flex flex-col">
      <div className="mb-3 flex items-center gap-3">
        <span className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: TEAL }}>
          Scenariusz {path.join('.')}
        </span>
        <div className="h-px flex-1 bg-dark/10" />
      </div>

      {/* User's answer, as sent in the chat */}
      <div
        className="mb-3 ml-auto max-w-[78%] rounded-[10px] px-3 py-2 text-[13px] leading-snug text-white break-words"
        style={{ backgroundColor: TEAL }}
      >
        {option.text}
      </div>

      <NodeEditor node={option.next} depth={depth} path={path} ctx={ctx} onChange={onChange} />
    </section>
  )
}

// --- Contact side ---

type ContactMessageProps = {
  node: MessengerNode
  ctx: TreeContext
  isRoot: boolean
  onChange: (message: string) => void
}

function ContactMessage({ node, ctx, isRoot, onChange }: ContactMessageProps) {
  return (
    <div className="flex items-start gap-2.5">
      <AvatarCircle />
      <div className={`w-[78%] ${CONTACT_BUBBLE}`}>
        <InlineText
          value={node.message}
          onChange={onChange}
          maxLength={L.message}
          placeholder={isRoot ? 'Wpisz treść wiadomości' : 'Wpisz odpowiedź rozmówcy'}
          error={ctx.errors[`node.${node.id}.message`]}
        />
      </div>
    </div>
  )
}

// --- User side: one of the 3 answers ---

type OptionEditorProps = {
  option: MessengerOption
  index: number
  error?: string
  onChange: (option: MessengerOption) => void
  onMarkCorrect: () => void
}

function OptionEditor({ option, index, error, onChange, onMarkCorrect }: OptionEditorProps) {
  const correct = option.is_correct

  return (
    <div className="flex flex-col items-end">
      <div className="flex w-[85%] items-start gap-2">
        <button
          type="button"
          role="radio"
          aria-checked={correct}
          title={correct ? 'Prawidłowa odpowiedź' : 'Oznacz jako prawidłową odpowiedź'}
          onClick={onMarkCorrect}
          className="mt-2 flex size-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors cursor-pointer disabled:cursor-default"
          style={correct ? { backgroundColor: GREEN, borderColor: GREEN, color: 'white' } : { borderColor: '#C9CDD0' }}
        >
          {correct && <Check className="size-3" strokeWidth={3} />}
        </button>
        <div
          className="flex-1 rounded-[10px] border px-3 py-2 text-[13px] leading-snug transition-colors"
          style={
            correct
              ? { backgroundColor: '#E8F4EC', borderColor: GREEN, color: '#1F2A2E' }
              : { backgroundColor: '#EEF4F5', borderColor: '#CFE0E3', color: '#1F2A2E' }
          }
        >
          <InlineText
            value={option.text}
            onChange={text => onChange({ ...option, text })}
            maxLength={L.optionText}
            placeholder={`Odpowiedź ${index + 1}`}
            error={error}
          />
        </div>
      </div>
      {correct && (
        <span className="mt-1 text-[11px] font-medium" style={{ color: GREEN }}>
          Wybrane jako prawidłowa odpowiedź
        </span>
      )}
    </div>
  )
}
