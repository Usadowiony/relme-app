import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import { Bold, Eraser } from 'lucide-react'
import { TEXT_COLORS, applyRichFormat, parseRich, serializeRich } from '../../../../../utils/richText'
import type { RichAllowed, RichFormat, StyledChar, TextColor } from '../../../../../utils/richText'
import { useEditorReadOnly } from './richFormatContext'

// ============================================================
// WYSIWYG text field (contentEditable). The stored value keeps the shared
// markup (utils/richText.ts), but the admin only ever sees the result: bold
// is bold, colours are coloured. The DOM is the editing surface; on every
// input it is read back into styled characters and serialised. It is rebuilt
// from `value` only when the value changes from outside or after a format.
//
// Selecting text shows a small toolbar above the field with exactly the
// formats this field allows — fields without formatting show nothing.
// ============================================================

type RichTextFieldProps = {
  value: string
  onChange: (value: string) => void
  placeholder: string
  /** Font, size, line height and weight (no colour classes — use `color`). */
  className?: string
  color: string
  /** Enter = new paragraph. Otherwise Enter goes to `onKeyDown` (e.g. "new list item"). */
  multiline?: boolean
  /** Allowed formats; both false = plain text. */
  bold?: boolean
  colors?: boolean
  strongWeight?: number
  onKeyDown?: (e: KeyboardEvent<HTMLDivElement>) => void
}

const ZWSP = '​' // never rendered by us, but skipped if the browser leaves one behind

// --- DOM ↔ styled characters ---

function visibleLength(data: string): number {
  let n = 0
  for (const ch of data) if (ch !== ZWSP) n++
  return n
}

/** A trailing <br> (left by the browser) is not a line break. */
function countsAsBreak(node: Node): boolean {
  return node.nodeName === 'BR' && !!node.nextSibling
}

function readDom(root: HTMLElement): StyledChar[] {
  const out: StyledChar[] = []
  const walk = (node: Node, bold: boolean, color: TextColor | null) => {
    node.childNodes.forEach(child => {
      if (child.nodeType === Node.TEXT_NODE) {
        for (const ch of (child as Text).data) {
          if (ch === ZWSP) continue
          const c = ch === ' ' ? ' ' : ch
          out.push(c === '\n' ? { ch: c, bold: false, color: null } : { ch: c, bold, color })
        }
      } else if (child instanceof HTMLElement) {
        if (child.nodeName === 'BR') {
          if (countsAsBreak(child)) out.push({ ch: '\n', bold: false, color: null })
          return
        }
        const key = child.dataset.color
        walk(child, bold || child.dataset.bold === '1', key && key in TEXT_COLORS ? (key as TextColor) : color)
      }
    })
  }
  walk(root, false, null)
  return out
}

/** Text with line breaks as <br> (browsers lose raw "\n" in text nodes while typing). */
function appendText(parent: Node, text: string) {
  text.split('\n').forEach((part, i) => {
    if (i > 0) parent.appendChild(document.createElement('br'))
    if (part) parent.appendChild(document.createTextNode(part))
  })
}

function renderDom(root: HTMLElement, value: string, strongWeight: number) {
  root.textContent = ''
  for (const s of parseRich(value).segments) {
    if (s.marker) continue
    if (!s.bold && !s.color) {
      appendText(root, s.text)
      continue
    }
    const span = document.createElement('span')
    appendText(span, s.text)
    if (s.bold) {
      span.dataset.bold = '1'
      span.style.fontWeight = String(strongWeight)
    }
    if (s.color) {
      span.dataset.color = s.color
      span.style.color = TEXT_COLORS[s.color]
    }
    root.appendChild(span)
  }
  // A trailing line break needs one more <br> to show the empty last line.
  if (value.endsWith('\n')) root.appendChild(document.createElement('br'))
}

/** Visible character index of a DOM position. */
function offsetOf(root: HTMLElement, container: Node, offset: number): number {
  let count = 0
  /** Adds everything before the target in document order; true once the target is reached. */
  const walk = (node: Node): boolean => {
    if (node === container) {
      if (node.nodeType === Node.TEXT_NODE) count += visibleLength((node as Text).data.slice(0, offset))
      else Array.from(node.childNodes).slice(0, offset).forEach(walk)
      return true
    }
    if (node.nodeType === Node.TEXT_NODE) {
      count += visibleLength((node as Text).data)
      return false
    }
    if (countsAsBreak(node)) {
      count += 1
      return false
    }
    for (const child of Array.from(node.childNodes)) if (walk(child)) return true
    return false
  }
  walk(root)
  return count
}

/** DOM position of a visible character index. */
function locate(root: HTMLElement, index: number): [Node, number] {
  let remaining = index
  let result: [Node, number] | null = null
  const visit = (node: Node) => {
    for (const child of Array.from(node.childNodes)) {
      if (result) return
      if (child.nodeType === Node.TEXT_NODE) {
        const data = (child as Text).data
        const len = visibleLength(data)
        if (remaining < len || remaining === 0) {
          let i = 0
          for (let seen = 0; i < data.length && seen < remaining; i++) if (data[i] !== ZWSP) seen++
          result = [child, i]
          return
        }
        remaining -= len
      } else if (child.nodeName === 'BR') {
        if (remaining === 0) {
          result = [node, Array.from(node.childNodes).indexOf(child)]
          return
        }
        if (countsAsBreak(child)) remaining -= 1
      } else {
        visit(child)
      }
    }
  }
  visit(root)
  return result ?? [root, root.childNodes.length]
}

function getSelectionRange(root: HTMLElement): [number, number] | null {
  const sel = window.getSelection()
  if (!sel || sel.rangeCount === 0) return null
  const r = sel.getRangeAt(0)
  if (!root.contains(r.startContainer) || !root.contains(r.endContainer)) return null
  return [offsetOf(root, r.startContainer, r.startOffset), offsetOf(root, r.endContainer, r.endOffset)]
}

function setSelectionRange(root: HTMLElement, from: number, to: number) {
  const sel = window.getSelection()
  if (!sel) return
  const range = document.createRange()
  const [sn, so] = locate(root, from)
  const [en, eo] = locate(root, to)
  range.setStart(sn, so)
  range.setEnd(en, eo)
  sel.removeAllRanges()
  sel.addRange(range)
}

// ============================================================

export function RichTextField({
  value,
  onChange,
  placeholder,
  className = '',
  color,
  multiline = false,
  bold = false,
  colors = false,
  strongWeight = 700,
  onKeyDown,
}: RichTextFieldProps) {
  const readOnly = useEditorReadOnly()
  const ref = useRef<HTMLDivElement>(null)
  const shown = useRef<string | null>(null) // value the DOM currently represents
  const [hasSelection, setHasSelection] = useState(false)
  const allowed: RichAllowed = { bold, colors }
  const formatting = bold || colors

  // Rebuild the DOM only when the value did not come from this field's own typing.
  useLayoutEffect(() => {
    const root = ref.current
    if (!root || shown.current === value) return
    renderDom(root, value, strongWeight)
    shown.current = value
  }, [value, strongWeight])

  // Show the toolbar while a non-empty part of this field is selected.
  useEffect(() => {
    if (!formatting || readOnly) return
    const onSelectionChange = () => {
      const root = ref.current
      const range = root && document.activeElement === root ? getSelectionRange(root) : null
      setHasSelection(!!range && range[0] !== range[1])
    }
    document.addEventListener('selectionchange', onSelectionChange)
    return () => document.removeEventListener('selectionchange', onSelectionChange)
  }, [formatting, readOnly])

  /** Writes a new value: DOM, caret/selection and parent state. */
  const commit = (text: string, from: number, to: number) => {
    const root = ref.current
    if (!root) return
    renderDom(root, text, strongWeight)
    shown.current = text
    setSelectionRange(root, from, to)
    onChange(text)
  }

  const handleInput = () => {
    const root = ref.current
    if (!root) return
    const text = serializeRich(readDom(root), allowed).text
    if (text === '' && root.childNodes.length > 0) root.textContent = '' // let the placeholder show again
    shown.current = text
    onChange(text)
  }

  const insertText = (insert: string) => {
    const root = ref.current
    const range = root && getSelectionRange(root)
    if (!root || !range) return
    const chars = readDom(root)
    const [from, to] = range
    const added: StyledChar[] = Array.from(insert, ch => ({ ch, bold: false, color: null }))
    const caret = from + added.length
    commit(serializeRich([...chars.slice(0, from), ...added, ...chars.slice(to)], allowed).text, caret, caret)
  }

  const apply = (format: RichFormat) => {
    const root = ref.current
    const range = root && getSelectionRange(root)
    if (!root || !range) return
    const current = serializeRich(readDom(root), allowed).text
    const result = applyRichFormat(current, range[0], range[1], format, allowed)
    if (result) commit(result.text, range[0], range[1])
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    // Never let the browser apply its own formatting.
    if ((e.ctrlKey || e.metaKey) && ['b', 'i', 'u'].includes(e.key.toLowerCase())) {
      e.preventDefault()
      if (e.key.toLowerCase() === 'b' && bold) apply({ kind: 'bold' })
      return
    }
    if (e.key === 'Enter') {
      e.preventDefault()
      if (multiline) insertText('\n')
    }
    onKeyDown?.(e)
  }

  return (
    <div className="relative min-w-0">
      {formatting && hasSelection && !readOnly && <FormatBubble bold={bold} colors={colors} onApply={apply} />}
      <div
        ref={ref}
        role="textbox"
        aria-multiline={multiline}
        aria-label={placeholder}
        data-placeholder={placeholder}
        contentEditable={!readOnly}
        suppressContentEditableWarning
        spellCheck
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        onBlur={() => setHasSelection(false)}
        onPaste={e => {
          e.preventDefault()
          const text = e.clipboardData.getData('text/plain')
          insertText(multiline ? text.replace(/\r\n?/g, '\n').replace(/\n{3,}/g, '\n\n') : text.replace(/\s*\n\s*/g, ' '))
        }}
        onDrop={e => e.preventDefault()}
        className={`-mx-1.5 min-h-[1lh] whitespace-pre-wrap break-words rounded-[8px] px-1.5 py-0.5 outline-none transition-colors empty:before:pointer-events-none empty:before:opacity-35 empty:before:content-[attr(data-placeholder)] focus:bg-white focus:shadow-[0_0_0_2px_rgba(79,70,229,0.3)] ${
          readOnly ? '' : 'hover:bg-dark/[0.04] cursor-text'
        } ${className}`}
        style={{ color }}
      />
    </div>
  )
}

// ============================================================
// Floating toolbar (only the formats the field allows)
// ============================================================

const COLOR_LABELS: Record<TextColor, string> = {
  zielony: 'Zielony',
  czerwony: 'Czerwony',
  turkusowy: 'Turkusowy',
  fioletowy: 'Fioletowy',
  niebieski: 'Niebieski',
}

function FormatBubble({ bold, colors, onApply }: { bold: boolean; colors: boolean; onApply: (format: RichFormat) => void }) {
  const btn = 'flex size-7 items-center justify-center rounded-[7px] transition-colors hover:bg-white/15 cursor-pointer'
  // onMouseDown.preventDefault keeps the focus and the selection in the field.
  return (
    <div
      onMouseDown={e => e.preventDefault()}
      className="absolute bottom-full left-0 z-30 mb-1.5 flex items-center gap-0.5 rounded-[10px] bg-[#1A1B1E] p-1 shadow-lg"
    >
      {bold && (
        <button type="button" title="Pogrubienie (Ctrl+B)" onClick={() => onApply({ kind: 'bold' })} className={`${btn} text-white`}>
          <Bold className="size-4" strokeWidth={2.75} />
        </button>
      )}
      {bold && colors && <span className="mx-0.5 h-4 w-px bg-white/20" />}
      {colors &&
        (Object.keys(TEXT_COLORS) as TextColor[]).map(key => (
          <button key={key} type="button" title={COLOR_LABELS[key]} onClick={() => onApply({ kind: 'color', color: key })} className={btn}>
            <span className="size-4 rounded-full ring-2 ring-white/90" style={{ backgroundColor: TEXT_COLORS[key] }} />
          </button>
        ))}
      <span className="mx-0.5 h-4 w-px bg-white/20" />
      <button type="button" title="Usuń formatowanie" onClick={() => onApply({ kind: 'clear' })} className={`${btn} text-white/80`}>
        <Eraser className="size-4" />
      </button>
    </div>
  )
}
