import { useEffect, useRef, useState } from 'react'
import type { ReactNode, RefObject } from 'react'
import { Reorder, useDragControls } from 'framer-motion'
import { ArrowDown, ArrowUp, Copy, GripVertical, MousePointerClick, Trash2 } from 'lucide-react'
import type { KnowledgeElement, KnowledgeElementType, KnowledgeListMarker, KnowledgeViewConfig } from '../../../../../types/modules'
import { KNOWLEDGE_ELEMENT_TYPES, createKnowledgeElement, duplicateKnowledgeElement } from '../../../../../utils/moduleFlow'
import type { BlockFormProps } from '../fields'
import { CalloutVariantChoice } from '../callout/CalloutCard'
import { ElementPreview } from './elements'
import { CHAT_VERDICTS, ELEMENT_META, KV, LIST_MARKERS, SECTION_ICONS, elementGap } from './theme'

// "Widok wiedzy" editor: on the left the phone screen at real width (402 pt),
// edited in place (selecting text shows a toolbar with the formats that field
// allows); on the right the settings of the selected element and the element
// catalogue. New elements go under the selected one. Drag the handle on the
// left edge of an element to reorder (kept inside the screen).

export function KnowledgeViewForm({ config, onChange, readOnly }: BlockFormProps<KnowledgeViewConfig>) {
  const { elements } = config
  const [selectedId, setSelectedId] = useState<string | null>(elements[0]?.id ?? null)
  const reveal = useRef<string | null>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const selectedIndex = elements.findIndex(e => e.id === selectedId)
  const selected = selectedIndex >= 0 ? elements[selectedIndex] : null

  const setElements = (next: KnowledgeElement[]) => onChange({ ...config, elements: next })
  const update = (el: KnowledgeElement) => setElements(elements.map(e => (e.id === el.id ? el : e)))

  const insertAfterSelected = (el: KnowledgeElement) => {
    const at = selectedIndex >= 0 ? selectedIndex + 1 : elements.length
    setElements([...elements.slice(0, at), el, ...elements.slice(at)])
    setSelectedId(el.id)
    reveal.current = el.id
  }

  const move = (delta: -1 | 1) => {
    const to = selectedIndex + delta
    if (selectedIndex < 0 || to < 0 || to >= elements.length) return
    const next = [...elements]
    ;[next[selectedIndex], next[to]] = [next[to], next[selectedIndex]]
    setElements(next)
  }

  const remove = () => {
    if (!selected) return
    const next = elements.filter(e => e.id !== selected.id)
    setElements(next)
    setSelectedId(next[Math.min(selectedIndex, next.length - 1)]?.id ?? null)
  }

  // Scroll a newly added element into view and put the cursor in its first field.
  useEffect(() => {
    const id = reveal.current
    if (!id) return
    reveal.current = null
    const node = document.querySelector<HTMLElement>(`[data-element-id="${id}"]`)
    node?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    node?.querySelector<HTMLElement>('textarea, [contenteditable="true"]')?.focus({ preventScroll: true })
  })

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
      {/* Phone */}
      <div
        className="mx-auto w-full shrink-0 rounded-[32px] border border-dark/15 bg-white shadow-soft"
        style={{ maxWidth: KV.screenWidth }}
      >
        <fieldset disabled={readOnly} className="min-w-0 py-10" style={{ paddingInline: KV.sidePadding }}>
          {elements.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-[16px] border border-dashed border-dark/20 px-6 py-12 text-center text-[13px] text-dark/50">
              <MousePointerClick className="size-6" />
              Widok jest pusty. Dodaj pierwszy element z panelu „Dodaj element”.
            </div>
          ) : (
            <Reorder.Group ref={listRef} as="div" axis="y" values={elements} onReorder={setElements}>
              {elements.map((el, i) => (
                <ElementShell
                  key={el.id}
                  element={el}
                  boundsRef={listRef}
                  gap={i === 0 ? 0 : elementGap(elements[i - 1], el)}
                  selected={el.id === selectedId}
                  onSelect={() => setSelectedId(el.id)}
                  onChange={update}
                />
              ))}
            </Reorder.Group>
          )}
        </fieldset>
      </div>

      {/* Side panel */}
      <aside className="flex min-w-0 flex-1 flex-col gap-4 lg:sticky lg:top-0">
        <Panel title="Zaznaczony element">
          {selected ? (
            <SelectedElementPanel
              element={selected}
              index={selectedIndex}
              count={elements.length}
              readOnly={readOnly}
              onChange={update}
              onMove={move}
              onDuplicate={() => insertAfterSelected(duplicateKnowledgeElement(selected))}
              onRemove={remove}
            />
          ) : (
            <p className="text-[12px] leading-snug text-dark/50">Kliknij element w podglądzie, aby zmienić jego wariant, kolejność albo go usunąć.</p>
          )}
        </Panel>

        {!readOnly && (
          <Panel title="Dodaj element" hint={selected ? 'Pojawi się pod zaznaczonym elementem.' : 'Pojawi się na końcu widoku.'}>
            <div className="grid grid-cols-2 gap-2">
              {KNOWLEDGE_ELEMENT_TYPES.map(type => (
                <AddElementButton key={type} type={type} onClick={() => insertAfterSelected(createKnowledgeElement(type))} />
              ))}
            </div>
          </Panel>
        )}
      </aside>
    </div>
  )
}

// ============================================================
// Phone
// ============================================================

function ElementShell({ element, boundsRef, gap, selected, onSelect, onChange }: {
  element: KnowledgeElement
  boundsRef: RefObject<HTMLDivElement | null>
  gap: number
  selected: boolean
  onSelect: () => void
  onChange: (el: KnowledgeElement) => void
}) {
  const controls = useDragControls()
  return (
    <Reorder.Item
      as="div"
      value={element}
      dragListener={false}
      dragControls={controls}
      dragConstraints={boundsRef}
      dragElastic={0}
      whileDrag={{ zIndex: 10 }}
      data-element-id={element.id}
      onPointerDownCapture={onSelect}
      onFocusCapture={onSelect}
      className="group/el relative"
      style={{ marginTop: gap }}
    >
      <span
        aria-hidden
        className={`pointer-events-none absolute -inset-x-1.5 -inset-y-1.5 rounded-[12px] border-[1.5px] transition-colors ${
          selected ? 'border-[#6366F1]/55' : 'border-transparent group-hover/el:border-dashed group-hover/el:border-dark/15'
        }`}
      />
      <button
        type="button"
        title="Przeciągnij, aby zmienić kolejność"
        onPointerDown={e => {
          e.preventDefault()
          controls.start(e)
        }}
        className={`absolute -left-[19px] top-0 flex h-6 w-4 touch-none items-center justify-center rounded text-dark/35 transition-opacity hover:text-dark cursor-grab active:cursor-grabbing disabled:hidden ${
          selected ? 'opacity-100' : 'opacity-0 group-hover/el:opacity-100'
        }`}
      >
        <GripVertical className="size-4" />
      </button>
      <ElementPreview element={element} onChange={onChange} />
    </Reorder.Item>
  )
}

// ============================================================
// Side panel
// ============================================================

function Panel({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="rounded-[16px] border border-gray bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <h3 className="text-[10px] font-bold uppercase tracking-widest text-dark/55">{title}</h3>
        {hint && <span className="text-[11px] text-dark/45">{hint}</span>}
      </div>
      {children}
    </section>
  )
}

function AddElementButton({ type, onClick }: { type: KnowledgeElementType; onClick: () => void }) {
  const { label, description, Icon } = ELEMENT_META[type]
  return (
    <button
      type="button"
      onClick={onClick}
      title={description}
      className="flex items-center gap-2.5 rounded-[12px] border border-gray px-2.5 py-2 text-left transition-all hover:border-[#6366F1]/40 hover:bg-[#F5F5FF] cursor-pointer"
    >
      <span className="flex size-8 shrink-0 items-center justify-center rounded-[9px] bg-[#EEF0FF] text-[#5B5BD6]">
        <Icon className="size-4" />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-[12px] font-semibold text-dark">{label}</span>
        <span className="block truncate text-[10.5px] text-dark/50">{description}</span>
      </span>
    </button>
  )
}

function SelectedElementPanel({ element, index, count, readOnly, onChange, onMove, onDuplicate, onRemove }: {
  element: KnowledgeElement
  index: number
  count: number
  readOnly: boolean
  onChange: (el: KnowledgeElement) => void
  onMove: (delta: -1 | 1) => void
  onDuplicate: () => void
  onRemove: () => void
}) {
  const { label, Icon } = ELEMENT_META[element.type]
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <Icon className="size-4 shrink-0 text-[#5B5BD6]" />
          <span className="truncate text-[13px] font-semibold text-dark">{label}</span>
          <span className="shrink-0 text-[11px] text-dark/40">
            {index + 1} z {count}
          </span>
        </div>
        {!readOnly && (
          <div className="flex shrink-0 items-center gap-0.5">
            <IconAction title="Przesuń wyżej" disabled={index === 0} onClick={() => onMove(-1)}>
              <ArrowUp className="size-4" />
            </IconAction>
            <IconAction title="Przesuń niżej" disabled={index === count - 1} onClick={() => onMove(1)}>
              <ArrowDown className="size-4" />
            </IconAction>
            <IconAction title="Duplikuj" onClick={onDuplicate}>
              <Copy className="size-4" />
            </IconAction>
            <IconAction title="Usuń element" danger onClick={onRemove}>
              <Trash2 className="size-4" />
            </IconAction>
          </div>
        )}
      </div>
      <fieldset disabled={readOnly} className="min-w-0">
        <ElementSettings element={element} onChange={onChange} />
      </fieldset>
    </div>
  )
}

function IconAction({ title, disabled, danger, onClick, children }: {
  title: string
  disabled?: boolean
  danger?: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={`flex size-8 items-center justify-center rounded-full transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-30 ${
        danger ? 'text-[#D15F5F] enabled:hover:bg-red-50' : 'text-dark/60 enabled:hover:bg-neutral'
      }`}
    >
      {children}
    </button>
  )
}

function Choice<T extends string | number>({ label, value, options, onChange }: {
  label: string
  value: T
  options: { value: T; label: ReactNode; title?: string }[]
  onChange: (value: T) => void
}) {
  return (
    <div>
      <div className="mb-1.5 text-[11px] font-semibold text-dark/60">{label}</div>
      <div className="flex flex-wrap gap-1 rounded-[12px] bg-neutral p-1">
        {options.map(o => (
          <button
            key={String(o.value)}
            type="button"
            title={o.title}
            onClick={() => onChange(o.value)}
            className={`flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-[9px] px-2.5 py-1.5 text-[12px] font-semibold transition-colors cursor-pointer disabled:cursor-default ${
              o.value === value ? 'bg-white text-dark shadow-sm' : 'text-dark/55 enabled:hover:text-dark'
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  )
}

function Hint({ children }: { children: ReactNode }) {
  return <p className="text-[12px] leading-snug text-dark/55">{children}</p>
}

const HINT_COLORS = 'Zaznacz fragment tekstu, aby zmienić jego kolor.'
const HINT_BOLD_COLORS = 'Zaznacz fragment tekstu, aby go pogrubić (Ctrl+B) lub zmienić jego kolor.'

function ElementSettings({ element, onChange }: { element: KnowledgeElement; onChange: (el: KnowledgeElement) => void }) {
  switch (element.type) {
    case 'heading':
      return (
        <div className="flex flex-col gap-3">
          <Choice
            label="Poziom"
            value={element.level}
            options={[
              { value: 1, label: 'H1', title: '20 pt' },
              { value: 2, label: 'H2', title: '18 pt — jak nagłówek z ikoną' },
            ]}
            onChange={level => onChange({ ...element, level })}
          />
          <Hint>{HINT_COLORS}</Hint>
        </div>
      )
    case 'paragraph':
      return <Hint>{HINT_BOLD_COLORS} Enter = nowy akapit.</Hint>
    case 'image-text':
      return (
        <div className="flex flex-col gap-3">
          <Choice
            label="Grafika"
            value={element.image_side}
            options={[
              { value: 'left', label: 'Z lewej' },
              { value: 'right', label: 'Z prawej' },
            ]}
            onChange={image_side => onChange({ ...element, image_side })}
          />
          <Hint>{HINT_BOLD_COLORS}</Hint>
          <Hint>Wybór grafiki dojdzie z biblioteką mediów. Do tego czasu aplikacja pokazuje puste pole w tym miejscu.</Hint>
        </div>
      )
    case 'section-title':
      return (
        <div className="flex flex-col gap-3">
          <Choice
            label="Ikona"
            value={element.icon}
            options={(Object.keys(SECTION_ICONS) as (keyof typeof SECTION_ICONS)[]).map(key => {
              const { Icon, color, label } = SECTION_ICONS[key]
              return { value: key, title: label, label: <Icon className="size-[18px]" strokeWidth={2} style={{ color }} /> }
            })}
            onChange={icon => onChange({ ...element, icon })}
          />
          <Hint>{HINT_COLORS}</Hint>
        </div>
      )
    case 'list':
      return (
        <div className="flex flex-col gap-3">
          <Choice
            label="Styl punktów"
            value={element.marker}
            options={(Object.keys(LIST_MARKERS) as KnowledgeListMarker[]).map(key => {
              const { Icon, color, label } = LIST_MARKERS[key]
              return {
                value: key,
                label: (
                  <>
                    {Icon ? <Icon className="size-4" strokeWidth={2} style={{ color }} /> : <span className="size-1.5 rounded-full" style={{ backgroundColor: color }} />}
                    {label}
                  </>
                ),
              }
            })}
            onChange={marker => onChange({ ...element, marker })}
          />
          <Hint>Enter dodaje kolejny punkt, Backspace w pustym punkcie go usuwa.</Hint>
        </div>
      )
    case 'steps':
      return <Hint>Numery i przerywana linia między krokami dodają się same.</Hint>
    case 'callout':
      return (
        <div className="flex flex-col gap-3">
          <div>
            <div className="mb-1.5 text-[11px] font-semibold text-dark/60">Rodzaj widżetu</div>
            <CalloutVariantChoice value={element.variant} onChange={variant => onChange({ ...element, variant })} />
          </div>
          <Hint>Nagłówek wynika z rodzaju widżetu. Fragment treści możesz pogrubić (zaznacz go albo Ctrl+B); kolory są stałe.</Hint>
        </div>
      )
    case 'chat-example':
      return (
        <div className="flex flex-col gap-3">
          <Choice
            label="Odpowiedź"
            value={element.verdict}
            options={(['good', 'bad'] as const).map(key => {
              const v = CHAT_VERDICTS[key]
              return { value: key, label: <><v.Icon className="size-4" style={{ color: v.icon }} />{v.label}</> }
            })}
            onChange={verdict => onChange({ ...element, verdict })}
          />
          <Hint>Postać rozmówcy dobiera aplikacja, jak w Messengerze.</Hint>
        </div>
      )
  }
}
