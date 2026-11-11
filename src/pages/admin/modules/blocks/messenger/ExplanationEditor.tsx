import { useState } from 'react'
import type { ReactNode } from 'react'
import { Check, CircleCheck, CircleX, Lightbulb, Plus, Sparkles, Trash2, X } from 'lucide-react'
import type {
  ExerciseMessengerConfig,
  MessengerConclusion,
  MessengerExplanation,
  MessengerNode,
  MessengerOption,
  MessengerWidget,
} from '../../../../../types/modules'
import {
  MODULE_LIMITS,
  createMessengerWidget,
  validateMessengerConclusion,
  validateMessengerExplanation,
} from '../../../../../utils/moduleFlow'
import type { ValidationErrors } from '../../../../../utils/moduleFlow'
import { removeAt, replaceAt } from '../../../../../utils/arrays'
import { InlineText } from '../fields'
import { CONTACT_BUBBLE, MSG_GREEN, MSG_RED } from './theme'
import { AvatarCircle, PhoneFrame } from './MessengerFrame'

// Tab "Interpretacja odpowiedzi": the "Sprawdź dlaczego" screen (mockup).
// Top: one explanation per answer (any scenario). Bottom: one conclusion
// ("Czas na wnioski") per ending scenario.

const L = MODULE_LIMITS.messenger

const WIDGETS: Record<MessengerWidget['kind'], { label: string; icon: typeof Sparkles; color: string; bg: string }> = {
  remember: { label: 'Zapamiętaj', icon: Sparkles, color: '#3B8FD9', bg: '#EAF4FD' },
  golden_rule: { label: 'Złota zasada', icon: Lightbulb, color: '#E39B2D', bg: '#FFF4E3' },
}

// --- Tree helpers ---

type AnswerItem = { option: MessengerOption; contactMessage: string; label: string }
type EndingItem = { node: MessengerNode; label: string; pathCorrect: boolean }

function collect(root: MessengerNode) {
  const answers: AnswerItem[] = []
  const endings: EndingItem[] = []

  // Breadth-first so the list reads: bazowy, 1, 2, 3, 1.1, …
  const queue: { node: MessengerNode; path: number[]; correct: boolean }[] = [{ node: root, path: [], correct: true }]
  while (queue.length > 0) {
    const { node, path, correct } = queue.shift()!
    const label = path.length === 0 ? 'Scenariusz bazowy' : `Scenariusz ${path.join('.')}`
    node.options.forEach((option, i) => {
      answers.push({ option, contactMessage: node.message, label })
      const childPath = [...path, i + 1]
      const childCorrect = correct && option.is_correct
      if (option.next.options.length === 0) {
        endings.push({ node: option.next, label: `Scenariusz ${childPath.join('.')}`, pathCorrect: childCorrect })
      } else {
        queue.push({ node: option.next, path: childPath, correct: childCorrect })
      }
    })
  }
  return { answers, endings }
}

function mapNodes(node: MessengerNode, fn: (n: MessengerNode) => MessengerNode): MessengerNode {
  const n = fn(node)
  return { ...n, options: n.options.map(o => ({ ...o, next: mapNodes(o.next, fn) })) }
}

const isEmpty = (errors: ValidationErrors) => Object.keys(errors).length === 0

// --- Main ---

type ExplanationEditorProps = {
  config: ExerciseMessengerConfig
  onChange: (config: ExerciseMessengerConfig) => void
  errors: ValidationErrors
  readOnly: boolean
}

export function ExplanationEditor({ config, onChange, errors, readOnly }: ExplanationEditorProps) {
  const { answers, endings } = collect(config.root)
  const [answerId, setAnswerId] = useState<string | null>(null)
  const [endingId, setEndingId] = useState<string | null>(null)

  const answer = answers.find(a => a.option.id === answerId) ?? answers[0]
  const ending = endings.find(e => e.node.id === endingId) ?? endings[0]

  const setExplanation = (optionId: string, explanation: MessengerExplanation) =>
    onChange({
      ...config,
      root: mapNodes(config.root, n => ({
        ...n,
        options: n.options.map(o => (o.id === optionId ? { ...o, explanation } : o)),
      })),
    })

  const setConclusion = (nodeId: string, conclusion: MessengerConclusion) =>
    onChange({ ...config, root: mapNodes(config.root, n => (n.id === nodeId ? { ...n, conclusion } : n)) })

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-3">
        <SectionTitle hint="Wyjaśnienie pokazywane na ekranie „Sprawdź dlaczego” dla każdej wybranej odpowiedzi.">
          Wyjaśnienia odpowiedzi
        </SectionTitle>
        <div className="flex flex-col gap-1.5">
          {answers.map(a => (
            <PickerButton
              key={a.option.id}
              selected={a === answer}
              done={isEmpty(validateMessengerExplanation(a.option.id, a.option.explanation))}
              correct={a.option.is_correct}
              onClick={() => setAnswerId(a.option.id)}
            >
              <b className="font-semibold">{a.label}</b> – odpowiedź: {a.option.text.trim() || '(brak treści)'}
            </PickerButton>
          ))}
        </div>

        {answer && (
          <fieldset disabled={readOnly} className="min-w-0">
            <AnswerExplanation
              key={answer.option.id}
              item={answer}
              avatar={config.avatar}
              errors={errors}
              onChange={e => setExplanation(answer.option.id, e)}
            />
          </fieldset>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <SectionTitle hint="Podsumowanie „Czas na wnioski” pokazywane na końcu, osobno dla każdego zakończonego scenariusza.">
          Wnioski dla zakończonych scenariuszy
        </SectionTitle>
        {endings.length === 0 ? (
          <p className="text-[13px] text-dark/50">Brak zakończonych scenariuszy — uzupełnij najpierw treść ćwiczenia.</p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {endings.map(e => (
              <PickerButton
                key={e.node.id}
                selected={e === ending}
                done={isEmpty(validateMessengerConclusion(e.node.id, e.node.conclusion))}
                correct={e.pathCorrect}
                onClick={() => setEndingId(e.node.id)}
              >
                <b className="font-semibold">{e.label}</b> – zakończenie: {e.node.message.trim() || '(brak treści)'}
              </PickerButton>
            ))}
          </div>
        )}

        {ending && (
          <fieldset disabled={readOnly} className="min-w-0">
            <ConclusionEditor
              key={ending.node.id}
              node={ending.node}
              errors={errors}
              onChange={c => setConclusion(ending.node.id, c)}
            />
          </fieldset>
        )}
      </section>
    </div>
  )
}

function SectionTitle({ children, hint }: { children: ReactNode; hint: string }) {
  return (
    <div>
      <h3 className="text-[11px] font-bold uppercase tracking-widest text-dark/70">{children}</h3>
      <p className="mt-0.5 text-[12px] text-dark/50">{hint}</p>
    </div>
  )
}

/** Outlined selector: border colour = correct/wrong answer (path), icon = filled in or not. */
function PickerButton({ selected, done, correct, onClick, children }: {
  selected: boolean
  done: boolean
  correct: boolean
  onClick: () => void
  children: ReactNode
}) {
  const color = correct ? MSG_GREEN : MSG_RED
  return (
    <button
      type="button"
      onClick={onClick}
      title={done ? 'Wyjaśnienie uzupełnione' : 'Wyjaśnienie do uzupełnienia'}
      className="flex w-full items-center gap-2.5 rounded-[12px] border-[1.5px] px-3 py-2 text-left text-[12px] text-dark transition-colors cursor-pointer"
      style={{
        borderColor: selected ? color : `${color}66`,
        backgroundColor: selected ? `${color}12` : 'white',
      }}
    >
      <span
        className="flex size-5 shrink-0 items-center justify-center rounded-full"
        style={done ? { backgroundColor: MSG_GREEN, color: 'white' } : { backgroundColor: '#ECEDEE', color: '#8A9094' }}
      >
        {done ? <Check className="size-3" strokeWidth={3} /> : <X className="size-3" strokeWidth={3} />}
      </span>
      <span className="min-w-0 truncate">{children}</span>
    </button>
  )
}

// --- Answer explanation (inside the white card, under "Wyjaśnienie") ---

function AnswerExplanation({ item, avatar, errors, onChange }: {
  item: AnswerItem
  avatar: ExerciseMessengerConfig['avatar']
  errors: ValidationErrors
  onChange: (e: MessengerExplanation) => void
}) {
  const { option } = item
  const e = option.explanation
  const base = `option.${option.id}.explanation`
  const answerColor = option.is_correct ? MSG_GREEN : MSG_RED
  const AnswerIcon = option.is_correct ? CircleCheck : CircleX

  return (
    <PhoneFrame>
      {/* Reminder: contact's message and the picked answer */}
      <div className="flex items-start gap-2.5">
        <AvatarCircle avatar={avatar} />
        <div className={`max-w-[78%] break-words ${CONTACT_BUBBLE}`}>{item.contactMessage.trim() || '—'}</div>
      </div>
      <div className="mt-4 flex items-center justify-end gap-2">
        <div
          className="max-w-[72%] break-words rounded-[10px] border px-3 py-2 text-[13px] leading-snug"
          style={{ borderColor: answerColor, color: answerColor, backgroundColor: `${answerColor}0D` }}
        >
          {option.text.trim() || '—'}
        </div>
        <AnswerIcon className="size-5 shrink-0" style={{ color: answerColor }} />
      </div>

      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-dark/15" />
        <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-dark/45">Wyjaśnienie</span>
        <div className="h-px flex-1 bg-dark/15" />
      </div>

      <InlineText
        value={e.title}
        onChange={title => onChange({ ...e, title })}
        maxLength={L.explTitle}
        placeholder="Nagłówek"
        error={errors[`${base}.title`]}
        className="font-manrope text-[17px] font-bold text-dark"
      />
      <div className="mt-1.5">
        <InlineText
          value={e.body}
          onChange={body => onChange({ ...e, body })}
          maxLength={L.explBody}
          placeholder="Rozwinięcie"
          error={errors[`${base}.body`]}
          className="text-[14px] leading-snug text-dark/85"
        />
      </div>

      {e.points.length > 0 && (
        <ul className="mt-3 flex flex-col gap-1 pl-2">
          {e.points.map((point, i) => (
            <li key={i} className="group flex items-start gap-2.5">
              <span className="mt-[9px] size-1 shrink-0 rounded-full bg-dark/70" />
              <div className="min-w-0 flex-1">
                <InlineText
                  value={point}
                  onChange={v => onChange({ ...e, points: replaceAt(e.points, i, v) })}
                  maxLength={L.explPoint}
                  placeholder={`Podpunkt ${i + 1}`}
                  error={errors[`${base}.points.${i}`]}
                  className="text-[14px] leading-snug text-dark"
                />
              </div>
              <RemoveButton title="Usuń podpunkt" onClick={() => onChange({ ...e, points: removeAt(e.points, i) })} />
            </li>
          ))}
        </ul>
      )}
      {e.points.length < L.maxExplPoints && (
        <AddLink onClick={() => onChange({ ...e, points: [...e.points, ''] })}>
          Dodaj podpunkt {e.points.length === 0 && '(opcjonalnie)'}
        </AddLink>
      )}

      <div className="mt-5">
        {e.widget ? (
          <WidgetCard
            widget={e.widget}
            errors={errors}
            base={`${base}.widget`}
            onChange={widget => onChange({ ...e, widget })}
            onRemove={() => onChange({ ...e, widget: null })}
          />
        ) : (
          <div className="flex gap-2">
            {(Object.keys(WIDGETS) as MessengerWidget['kind'][]).map(kind => (
              <button
                key={kind}
                type="button"
                onClick={() => onChange({ ...e, widget: createMessengerWidget(kind) })}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-[14px] border border-dashed py-3 text-[12px] font-semibold transition-colors cursor-pointer disabled:hidden"
                style={{ borderColor: `${WIDGETS[kind].color}80`, color: WIDGETS[kind].color }}
              >
                <Plus className="size-3.5" /> {WIDGETS[kind].label}
              </button>
            ))}
          </div>
        )}
      </div>
    </PhoneFrame>
  )
}

function WidgetCard({ widget, errors, base, onChange, onRemove }: {
  widget: MessengerWidget
  errors: ValidationErrors
  base: string
  onChange: (w: MessengerWidget) => void
  onRemove: () => void
}) {
  const w = WIDGETS[widget.kind]
  const Icon = w.icon
  return (
    <div className="group relative overflow-hidden rounded-[16px] p-4 shadow-sm" style={{ backgroundColor: w.bg }}>
      <div className="pointer-events-none absolute -bottom-8 -right-6 size-24 rounded-full bg-white/50" />
      <button
        type="button"
        title="Usuń widżet"
        onClick={onRemove}
        className="absolute right-2 top-2 z-10 flex size-7 items-center justify-center rounded-full text-[#D15F5F] opacity-0 transition-opacity hover:bg-white group-hover:opacity-100 focus:opacity-100 cursor-pointer disabled:hidden"
      >
        <Trash2 className="size-4" />
      </button>
      <div className="relative flex items-start gap-3">
        <Icon className="mt-1 size-5 shrink-0" style={{ color: w.color }} />
        <div className="flex min-w-0 flex-1 flex-col gap-1 pr-4">
          <div style={{ color: w.color }}>
            <InlineText
              value={widget.title}
              onChange={title => onChange({ ...widget, title })}
              maxLength={L.widgetTitle}
              placeholder="Tytuł widżetu"
              error={errors[`${base}.title`]}
              className="text-[16px] font-bold"
            />
          </div>
          <InlineText
            value={widget.text}
            onChange={text => onChange({ ...widget, text })}
            maxLength={L.widgetText}
            placeholder="Treść widżetu"
            error={errors[`${base}.text`]}
            className="text-[13px] leading-snug text-dark/85"
          />
        </div>
      </div>
    </div>
  )
}

// --- Ending conclusion ("Czas na wnioski") ---

function ConclusionEditor({ node, errors, onChange }: {
  node: MessengerNode
  errors: ValidationErrors
  onChange: (c: MessengerConclusion) => void
}) {
  const c = node.conclusion
  const base = `node.${node.id}.conclusion`
  const setBetter = (patch: Partial<MessengerConclusion['better']>) => onChange({ ...c, better: { ...c.better, ...patch } })

  return (
    <div className="w-full rounded-[18px] border border-dark/25 bg-[#F4F4F4] px-4 py-5 sm:px-5">
      <InlineText
        value={c.title}
        onChange={title => onChange({ ...c, title })}
        maxLength={L.conclusionTitle}
        placeholder="Nagłówek"
        error={errors[`${base}.title`]}
        className="font-manrope text-[20px] font-bold text-dark"
      />
      <div className="mt-1">
        <InlineText
          value={c.body}
          onChange={body => onChange({ ...c, body })}
          maxLength={L.conclusionBody}
          placeholder="Rozwinięcie"
          error={errors[`${base}.body`]}
          className="text-[14px] leading-snug text-dark/85"
        />
      </div>

      <div className="mt-5 rounded-[16px] border border-[#CFE6D7] bg-[#F3F9F5] p-4 shadow-sm">
        <div className="flex items-start gap-2.5">
          <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-[#DDF0E3]">
            <CircleCheck className="size-4" style={{ color: MSG_GREEN }} />
          </span>
          <div className="min-w-0 flex-1">
            <InlineText
              value={c.better.title}
              onChange={title => setBetter({ title })}
              maxLength={L.betterTitle}
              placeholder="Nagłówek widżetu"
              error={errors[`${base}.better.title`]}
              className="font-manrope text-[16px] font-bold text-dark"
            />
          </div>
        </div>

        <div className="mt-4 text-[13px] font-semibold text-dark/80">Przykładowa odpowiedź</div>
        <div className="mt-2 w-[85%] rounded-[10px] border border-[#BFE0CA] bg-[#DDF0E3] px-3 py-2 text-[13px] leading-snug text-dark">
          <InlineText
            value={c.better.example}
            onChange={example => setBetter({ example })}
            maxLength={L.example}
            placeholder="Wpisz przykładową, lepszą odpowiedź"
            error={errors[`${base}.better.example`]}
          />
        </div>

        <div className="mt-4 text-[13px] font-semibold text-dark/80">Dlaczego to działa?</div>
        <ul className="mt-2 flex flex-col gap-1">
          {c.better.reasons.map((reason, i) => (
            <li key={i} className="group flex items-start gap-2">
              <Check className="mt-1 size-3.5 shrink-0" style={{ color: MSG_GREEN }} strokeWidth={3} />
              <div className="min-w-0 flex-1">
                <InlineText
                  value={reason}
                  onChange={v => setBetter({ reasons: replaceAt(c.better.reasons, i, v) })}
                  maxLength={L.reason}
                  placeholder={`Podpunkt ${i + 1}`}
                  error={errors[`${base}.better.reasons.${i}`]}
                  className="text-[13px] leading-snug text-dark"
                />
              </div>
              <RemoveButton
                title="Usuń podpunkt"
                disabled={c.better.reasons.length <= L.minReasons}
                onClick={() => setBetter({ reasons: removeAt(c.better.reasons, i) })}
              />
            </li>
          ))}
        </ul>
        {c.better.reasons.length < L.maxReasons && (
          <AddLink onClick={() => setBetter({ reasons: [...c.better.reasons, ''] })}>Dodaj podpunkt</AddLink>
        )}
      </div>
    </div>
  )
}

// --- Small controls ---

function RemoveButton({ title, disabled, onClick }: { title: string; disabled?: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full text-dark/50 opacity-0 transition-opacity hover:bg-white group-hover:opacity-100 focus:opacity-100 cursor-pointer disabled:invisible"
    >
      <X className="size-3.5" />
    </button>
  )
}

function AddLink({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-2 flex items-center gap-1 text-[12px] font-semibold text-dark/50 hover:text-dark cursor-pointer disabled:hidden"
    >
      <Plus className="size-3.5" /> {children}
    </button>
  )
}
