import { useEffect, useRef } from 'react'
import type { KeyboardEvent } from 'react'
import { Image, UserRound } from 'lucide-react'
import type { KnowledgeElement, KnowledgeSectionIcon } from '../../../../../types/modules'
import { createKnowledgeStep } from '../../../../../utils/moduleFlow'
import { AddLink, InlineText, RemoveButton } from '../fields'
import { CalloutCard } from '../callout/CalloutCard'
import { RichTextField } from '../rich/RichTextField'
import { CHAT_VERDICTS, HEADING_TYPE, IMAGE_SIZE, KV, LIST_MARKERS, SECTION_ICONS, TYPE } from './theme'

// Element previews of "Widok wiedzy", editable in place. Look = mobile app
// (Figma "Dawka wiedzy", 14.11.2026); variants are switched in the side panel.
// Formatting per field follows the contract in types/modules.ts.

type ElementProps<T extends KnowledgeElement['type']> = {
  element: Extract<KnowledgeElement, { type: T }>
  onChange: (element: Extract<KnowledgeElement, { type: T }>) => void
}

export function ElementPreview({ element, onChange }: { element: KnowledgeElement; onChange: (el: KnowledgeElement) => void }) {
  switch (element.type) {
    case 'heading':
      return <HeadingElement element={element} onChange={onChange} />
    case 'paragraph':
      return <ParagraphElement element={element} onChange={onChange} />
    case 'image-text':
      return <ImageTextElement element={element} onChange={onChange} />
    case 'section-title':
      return <SectionTitleElement element={element} onChange={onChange} />
    case 'list':
      return <ListElement element={element} onChange={onChange} />
    case 'steps':
      return <StepsElement element={element} onChange={onChange} />
    case 'callout':
      return <CalloutElement element={element} onChange={onChange} />
    case 'chat-example':
      return <ChatExampleElement element={element} onChange={onChange} />
  }
}

// --- Headings / text ---

const HEADING_PLACEHOLDER = { 1: 'Nagłówek H1', 2: 'Nagłówek H2' } as const

function HeadingElement({ element, onChange }: ElementProps<'heading'>) {
  return (
    <RichTextField
      colors
      value={element.text}
      onChange={text => onChange({ ...element, text })}
      placeholder={HEADING_PLACEHOLDER[element.level]}
      color={KV.heading}
      className={HEADING_TYPE[element.level]}
    />
  )
}

function ParagraphElement({ element, onChange }: ElementProps<'paragraph'>) {
  return (
    <RichTextField
      multiline
      bold
      colors
      value={element.text}
      onChange={text => onChange({ ...element, text })}
      placeholder="Wpisz treść akapitu"
      color={KV.body}
      className={TYPE.text}
    />
  )
}

export function ImagePlaceholder({ width, height }: { width: number; height: number }) {
  return (
    <div
      title="Grafikę wybierzesz z biblioteki mediów (wkrótce). Do tego czasu aplikacja pokazuje puste pole."
      className="flex shrink-0 flex-col items-center justify-center gap-1 rounded-[32px] text-[#9AA3A8]"
      style={{ width, height, backgroundColor: KV.imagePlaceholder }}
    >
      <Image className="size-6" strokeWidth={1.5} />
      <span className="text-[10px] font-semibold uppercase tracking-wider">Grafika</span>
    </div>
  )
}

function ImageTextElement({ element, onChange }: ElementProps<'image-text'>) {
  const image = <ImagePlaceholder {...IMAGE_SIZE} />
  return (
    <div className="flex items-center gap-4">
      {element.image_side === 'left' && image}
      <div className="min-w-0 flex-1">
        <RichTextField
          multiline
          bold
          colors
          value={element.text}
          onChange={text => onChange({ ...element, text })}
          placeholder="Tekst obok grafiki"
          color={KV.body}
          className={TYPE.text}
        />
      </div>
      {element.image_side === 'right' && image}
    </div>
  )
}

const ICON_ORDER: KnowledgeSectionIcon[] = ['question', 'wrong', 'chat-good', 'good']

function SectionTitleElement({ element, onChange }: ElementProps<'section-title'>) {
  const { Icon, color } = SECTION_ICONS[element.icon]
  const nextIcon = ICON_ORDER[(ICON_ORDER.indexOf(element.icon) + 1) % ICON_ORDER.length]
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        title="Kliknij, aby zmienić ikonę"
        onClick={() => onChange({ ...element, icon: nextIcon })}
        className="shrink-0 rounded-full cursor-pointer disabled:cursor-default"
      >
        <Icon className="size-[21px]" strokeWidth={2} style={{ color }} />
      </button>
      <div className="min-w-0 flex-1">
        <RichTextField
          colors
          value={element.text}
          onChange={text => onChange({ ...element, text })}
          placeholder="Nagłówek sekcji"
          color={KV.heading}
          className={TYPE.h2}
        />
      </div>
    </div>
  )
}

// --- Lists ---

/** Moves the cursor to the n-th field of a list after React has rendered the change. */
function useListFocus() {
  const containerRef = useRef<HTMLDivElement>(null)
  const pending = useRef<{ index: number; atEnd: boolean } | null>(null)
  // Runs after every render; the list change that follows `focus()` triggers it.
  useEffect(() => {
    const request = pending.current
    if (!request) return
    pending.current = null
    const el = containerRef.current?.querySelectorAll<HTMLElement>('textarea, [contenteditable="true"]')[request.index]
    if (!el) return
    el.focus()
    if (el instanceof HTMLTextAreaElement) {
      const pos = request.atEnd ? el.value.length : 0
      el.setSelectionRange(pos, pos)
    } else {
      const range = document.createRange()
      range.selectNodeContents(el)
      range.collapse(!request.atEnd)
      window.getSelection()?.removeAllRanges()
      window.getSelection()?.addRange(range)
    }
  })
  return {
    containerRef,
    focus: (index: number, atEnd = false) => {
      pending.current = { index, atEnd }
    },
  }
}

function ListElement({ element, onChange }: ElementProps<'list'>) {
  const { containerRef, focus } = useListFocus()
  const marker = LIST_MARKERS[element.marker]
  const setItems = (items: string[]) => onChange({ ...element, items })

  const handleKey = (i: number) => (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter') {
      setItems([...element.items.slice(0, i + 1), '', ...element.items.slice(i + 1)])
      focus(i + 1)
    } else if (e.key === 'Backspace' && element.items[i] === '' && element.items.length > 1) {
      e.preventDefault()
      setItems(element.items.filter((_, j) => j !== i))
      focus(Math.max(0, i - 1), true)
    }
  }

  return (
    <div ref={containerRef}>
      <div className="flex flex-col gap-2">
        {element.items.map((item, i) => (
          <div key={i} className="group flex items-start gap-2">
            <span className="flex h-6 w-[22px] shrink-0 items-center justify-center">
              {marker.Icon ? (
                <marker.Icon className="size-[22px]" strokeWidth={2} style={{ color: marker.color }} />
              ) : (
                <span className="size-[7px] rounded-full" style={{ backgroundColor: marker.color }} />
              )}
            </span>
            <div className="min-w-0 flex-1">
              <RichTextField
                value={item}
                onChange={text => setItems(element.items.map((it, j) => (j === i ? text : it)))}
                onKeyDown={handleKey(i)}
                placeholder="Punkt listy"
                color={KV.body}
                className={TYPE.text}
              />
            </div>
            {element.items.length > 1 && (
              <RemoveButton title="Usuń punkt" onClick={() => setItems(element.items.filter((_, j) => j !== i))} />
            )}
          </div>
        ))}
      </div>
      <AddLink
        onClick={() => {
          setItems([...element.items, ''])
          focus(element.items.length)
        }}
      >
        Dodaj punkt (lub Enter w ostatnim)
      </AddLink>
    </div>
  )
}

function StepsElement({ element, onChange }: ElementProps<'steps'>) {
  const { containerRef, focus } = useListFocus()
  const setStep = (id: string, patch: Partial<{ title: string; text: string }>) =>
    onChange({ ...element, steps: element.steps.map(s => (s.id === id ? { ...s, ...patch } : s)) })

  return (
    <div ref={containerRef}>
      <div className="flex flex-col gap-6">
        {element.steps.map((step, i) => (
          <div key={step.id} className="group relative flex items-start gap-[14px]">
            {i < element.steps.length - 1 && (
              <span
                aria-hidden
                className="absolute left-[19.5px] top-5 h-[calc(100%+24px)] border-l border-dashed"
                style={{ borderColor: KV.step.line }}
              />
            )}
            <span
              className="relative flex size-10 shrink-0 items-center justify-center rounded-full font-jakarta text-[16px] font-bold"
              style={{ backgroundColor: KV.step.circle, color: KV.step.number }}
            >
              {i + 1}
            </span>
            {/* pt-2: the first title line (24) is centred on the 40 pt circle */}
            <div className="flex min-w-0 flex-1 flex-col gap-1 pt-2">
              <div style={{ color: KV.heading }}>
                <InlineText
                  value={step.title}
                  onChange={title => setStep(step.id, { title })}
                  placeholder="Nazwa kroku"
                  className={TYPE.textBold}
                />
              </div>
              <RichTextField
                multiline
                value={step.text}
                onChange={text => setStep(step.id, { text })}
                placeholder="Opis kroku"
                color={KV.body}
                className={TYPE.small}
              />
            </div>
            {element.steps.length > 1 && (
              <RemoveButton title="Usuń krok" onClick={() => onChange({ ...element, steps: element.steps.filter(s => s.id !== step.id) })} />
            )}
          </div>
        ))}
      </div>
      <AddLink
        onClick={() => {
          onChange({ ...element, steps: [...element.steps, createKnowledgeStep()] })
          focus(element.steps.length * 2)
        }}
      >
        Dodaj krok
      </AddLink>
    </div>
  )
}

// --- Cards ---

function CalloutElement({ element, onChange }: ElementProps<'callout'>) {
  // The shared widget; the variant is switched in the side panel.
  return <CalloutCard callout={element} onChange={callout => onChange({ ...element, ...callout })} />
}

function ChatExampleElement({ element, onChange }: ElementProps<'chat-example'>) {
  const v = CHAT_VERDICTS[element.verdict]
  const bubble = 'max-w-[75%] rounded-[8px] border px-3 py-2'
  const text = TYPE.chat
  return (
    <div
      className="flex flex-col gap-[22px] rounded-[10px] border-2 bg-white px-[18px] py-6"
      style={{ borderColor: KV.chat.cardBorder, boxShadow: KV.shadow }}
    >
      <div className="flex items-start gap-2">
        <div
          title="Postać rozmówcy dobiera aplikacja (jak w Messengerze)"
          className="flex size-[29px] shrink-0 items-center justify-center rounded-full border bg-[#E6EAEC] text-[#7A868C]"
          style={{ borderColor: KV.chat.avatarBorder }}
        >
          <UserRound className="size-4" />
        </div>
        <div className={bubble} style={{ backgroundColor: KV.chat.bubble, borderColor: KV.chat.bubbleBorder }}>
          <RichTextField
            value={element.message}
            onChange={message => onChange({ ...element, message })}
            placeholder="Wiadomość rozmówcy"
            color={KV.body}
            className={text}
          />
        </div>
      </div>
      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          title="Kliknij, aby przełączyć: dobra / zła odpowiedź"
          onClick={() => onChange({ ...element, verdict: element.verdict === 'good' ? 'bad' : 'good' })}
          className="shrink-0 rounded-full cursor-pointer disabled:cursor-default"
        >
          <v.Icon className="size-[21px]" strokeWidth={1.5} style={{ color: v.icon }} />
        </button>
        <div className={bubble} style={{ backgroundColor: v.surface, borderColor: v.border }}>
          <RichTextField
            value={element.reply}
            onChange={reply => onChange({ ...element, reply })}
            placeholder={element.verdict === 'good' ? 'Dobra odpowiedź' : 'Zła odpowiedź'}
            color={v.text}
            className={text}
          />
        </div>
      </div>
    </div>
  )
}
