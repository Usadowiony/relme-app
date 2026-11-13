import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { PatternFlag, PatternFlagKind } from '../../../../../types/modules'
import { MODULE_LIMITS, createId } from '../../../../../utils/moduleFlow'
import { adjustFlagsOnEdit, applyMark, tokenize } from '../../../../../utils/patternFlags'
import { FLAG_STYLE } from './theme'

// The message text with red/green flag marking. Two modes:
// - "edit": a plain textarea; flags follow the edited text,
// - "red" / "green": words are clickable — click or drag across words to
//   mark them; a click on an already marked fragment toggles it.

export type MarkerMode = 'edit' | PatternFlagKind

const L = MODULE_LIMITS.patternDetector

type Props = {
  text: string
  flags: PatternFlag[]
  mode: MarkerMode
  readOnly: boolean
  error?: string
  onChange: (text: string, flags: PatternFlag[]) => void
}

export function FlagMarker({ text, flags, mode, readOnly, error, onChange }: Props) {
  if (mode === 'edit' && !readOnly) {
    return (
      <TextEditor
        text={text}
        error={error}
        onChange={next => onChange(next, adjustFlagsOnEdit(text, next, flags))}
      />
    )
  }
  return <WordMarker text={text} flags={flags} kind={mode === 'edit' ? null : mode} readOnly={readOnly} onChange={f => onChange(text, f)} />
}

/** Highlighted text (read-only) — also used by the interpretation tab. */
export function HighlightedText({ text, flags }: { text: string; flags: PatternFlag[] }) {
  return <WordMarker text={text} flags={flags} kind={null} readOnly onChange={() => {}} />
}

// --- Edit mode ---

function TextEditor({ text, error, onChange }: { text: string; error?: string; onChange: (text: string) => void }) {
  const ref = useRef<HTMLTextAreaElement>(null)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [text])

  return (
    <div>
      <textarea
        ref={ref}
        rows={3}
        value={text}
        maxLength={L.text}
        placeholder="Wpisz całą treść wypowiedzi, np. Mój były partner był wariatem i niczego nie rozumiał, ale przy Tobie od razu czuję…"
        onChange={e => onChange(e.target.value.replace(/\s*\n\s*/g, ' '))}
        className={`block w-full resize-none overflow-hidden rounded-[10px] bg-[#F7F8F8] px-3 py-2.5 font-manrope text-[18px] font-medium leading-[1.6] text-dark outline-none transition-shadow placeholder:text-dark/35 focus:bg-white focus:shadow-[0_0_0_2px_rgba(43,110,120,0.35)] ${
          error ? 'shadow-[0_0_0_2px_#E7B2B9]' : ''
        }`}
      />
      <div className="mt-1 flex justify-between text-[11px]">
        <span className="text-[#C03448]">{error}</span>
        <span className="text-dark/40">{text.length}/{L.text}</span>
      </div>
    </div>
  )
}

// --- Mark mode ---

type Drag = { anchor: number; current: number } // token indexes

function WordMarker({ text, flags, kind, readOnly, onChange }: {
  text: string
  flags: PatternFlag[]
  kind: PatternFlagKind | null // null = view only
  readOnly: boolean
  onChange: (flags: PatternFlag[]) => void
}) {
  const tokens = tokenize(text)
  const [drag, setDrag] = useState<Drag | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const interactive = !readOnly && kind !== null

  // Commit the gesture when the mouse is released anywhere on the page.
  useEffect(() => {
    if (!drag || !kind) return
    const finish = () => {
      const from = Math.min(drag.anchor, drag.current)
      const to = Math.max(drag.anchor, drag.current)
      const result = applyMark(text, flags, tokens[from].start, tokens[to].end, kind, from === to, L.maxFlags, createId)
      setNotice(result.error ?? null)
      onChange(result.flags)
      setDrag(null)
    }
    window.addEventListener('pointerup', finish)
    return () => window.removeEventListener('pointerup', finish)
  }, [drag, kind, text, flags, tokens, onChange])

  if (!text.trim()) {
    return <p className="py-4 text-center text-[13px] text-dark/45">Najpierw wpisz treść wypowiedzi (przycisk „Edytuj treść”).</p>
  }

  const dragFrom = drag ? Math.min(drag.anchor, drag.current) : -1
  const dragTo = drag ? Math.max(drag.anchor, drag.current) : -1

  return (
    <div>
      <p className={`font-manrope text-[18px] font-medium leading-[2.1] text-dark ${interactive ? 'select-none' : ''}`}>
        {tokens.map((token, i) => {
          const flag = flags.find(f => token.start >= f.start && token.end <= f.end)
          const inDrag = i >= dragFrom && i <= dragTo
          const style = flag ? FLAG_STYLE[flag.kind] : null
          const preview = inDrag && kind ? FLAG_STYLE[kind] : null

          return (
            <span
              key={token.start}
              onPointerDown={
                interactive && token.isWord
                  ? e => {
                      e.preventDefault()
                      setDrag({ anchor: i, current: i })
                    }
                  : undefined
              }
              onPointerEnter={interactive && drag && token.isWord ? () => setDrag({ ...drag, current: i }) : undefined}
              className={`[box-decoration-break:clone] py-[3px] ${
                interactive && token.isWord ? 'cursor-pointer rounded-[3px] hover:outline hover:outline-1 hover:outline-dark/25' : ''
              }`}
              style={
                preview
                  ? { backgroundColor: preview.bg, boxShadow: `inset 0 -2px 0 ${preview.color}`, opacity: 0.85 }
                  : style
                    ? { backgroundColor: style.bg, boxShadow: `inset 0 -2px 0 ${style.line}` }
                    : undefined
              }
            >
              {token.text}
            </span>
          )
        })}
      </p>
      {notice && <p className="mt-1 text-[11px] text-[#C03448]">{notice}</p>}
    </div>
  )
}
