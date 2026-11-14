// ============================================================
// Rich text markup (shared contract with the mobile app — copy 1:1).
//
//   **fraza**            bold
//   {zielony}fraza{/}    coloured (key from TEXT_COLORS)
//   \n                   new paragraph (multiline fields only)
//
// Parsing is per line: `**` toggles bold, `{key}` switches the colour,
// `{/}` resets it; a line break resets both. Unknown `{…}` stays literal.
// The admin editor never writes formatting across a line break.
// ============================================================

export const TEXT_COLORS = {
  zielony: '#009859',
  czerwony: '#DE2343',
  turkusowy: '#276E7D',
  fioletowy: '#4F46E5',
  niebieski: '#3595FB',
} as const

export type TextColor = keyof typeof TEXT_COLORS

export function isTextColor(key: string): key is TextColor {
  return Object.prototype.hasOwnProperty.call(TEXT_COLORS, key)
}

/** One visible character with its style and position in the raw string. */
export type RichChar = { ch: string; bold: boolean; color: TextColor | null; raw: number }

/** Raw string split into styled text and markup tokens, in order (for editor overlays). */
export type RichSegment = { text: string; bold: boolean; color: TextColor | null; marker: boolean }

const TAG = /^\{(\/|[a-ząćęłńóśźż]+)\}/

export function parseRich(text: string): { chars: RichChar[]; segments: RichSegment[] } {
  const chars: RichChar[] = []
  const segments: RichSegment[] = []
  let bold = false
  let color: TextColor | null = null

  const push = (seg: RichSegment) => {
    const last = segments[segments.length - 1]
    if (last && last.marker === seg.marker && last.bold === seg.bold && last.color === seg.color) last.text += seg.text
    else segments.push(seg)
  }

  let i = 0
  while (i < text.length) {
    if (text.startsWith('**', i)) {
      push({ text: '**', bold, color, marker: true })
      bold = !bold
      i += 2
      continue
    }
    if (text[i] === '{') {
      const m = TAG.exec(text.slice(i))
      if (m && (m[1] === '/' || isTextColor(m[1]))) {
        color = m[1] === '/' ? null : (m[1] as TextColor)
        push({ text: m[0], bold, color, marker: true })
        i += m[0].length
        continue
      }
    }
    const ch = text[i]
    if (ch === '\n') {
      bold = false
      color = null
    }
    chars.push({ ch, bold: ch === '\n' ? false : bold, color: ch === '\n' ? null : color, raw: i })
    push({ text: ch, bold: ch === '\n' ? false : bold, color: ch === '\n' ? null : color, marker: false })
    i++
  }
  return { chars, segments }
}

/** Text without markup (summaries, search). */
export function richToPlain(text: string): string {
  return parseRich(text)
    .chars.map(c => c.ch)
    .join('')
}

export type StyledChar = Pick<RichChar, 'ch' | 'bold' | 'color'>

/** Formats a field accepts (e.g. headings: colour only; callout body: bold only). */
export type RichAllowed = { bold: boolean; colors: boolean }

/** Rebuilds minimal markup; `rawIndex[i]` = position of chars[i] in the result. */
export function serializeRich(chars: StyledChar[], allowed: RichAllowed = { bold: true, colors: true }): { text: string; rawIndex: number[] } {
  chars = chars.map(c => ({ ch: c.ch, bold: allowed.bold && c.bold, color: allowed.colors ? c.color : null }))
  let out = ''
  const rawIndex: number[] = []
  let bold = false
  let color: TextColor | null = null

  const closeAll = () => {
    if (bold) out += '**'
    if (color) out += '{/}'
    bold = false
    color = null
  }

  // Bold and colour are independent: `{key}` switches the colour directly.
  for (const c of chars) {
    if (c.ch === '\n') {
      closeAll()
    } else {
      // Close bold before switching colour, open it after — keeps the markup nested: {k}**x**{/}
      if (bold && !c.bold) {
        out += '**'
        bold = false
      }
      if (c.color !== color) {
        out += c.color ? `{${c.color}}` : '{/}'
        color = c.color
      }
      if (c.bold !== bold) {
        out += '**'
        bold = c.bold
      }
    }
    rawIndex.push(out.length)
    out += c.ch
  }
  closeAll()
  return { text: out, rawIndex }
}

export type RichFormat = { kind: 'bold' } | { kind: 'color'; color: TextColor } | { kind: 'clear' }

/**
 * Applies a format to the visible characters [from, to) of `text` (indices
 * into parseRich().chars, i.e. what the user sees). Bold and a colour already
 * applied to the whole selection are toggled off. Returns null when the
 * selection has no visible characters.
 */
export function applyRichFormat(
  text: string,
  from: number,
  to: number,
  format: RichFormat,
  allowed?: RichAllowed,
): { text: string; from: number; to: number } | null {
  const { chars } = parseRich(text)
  // Double-click selections often include a trailing space — keep formatting tight.
  while (from < to && /\s/.test(chars[from].ch)) from++
  while (to > from && /\s/.test(chars[to - 1].ch)) to--
  if (from >= to) return null

  const range = chars.slice(from, to).filter(c => c.ch !== '\n')
  const next = chars.map(c => ({ ch: c.ch, bold: c.bold, color: c.color }))

  if (format.kind === 'bold') {
    const value = !range.every(c => c.bold)
    for (let i = from; i < to; i++) if (next[i].ch !== '\n') next[i].bold = value
  } else if (format.kind === 'color') {
    const value = range.every(c => c.color === format.color) ? null : format.color
    for (let i = from; i < to; i++) if (next[i].ch !== '\n') next[i].color = value
  } else {
    for (let i = from; i < to; i++) {
      next[i].bold = false
      next[i].color = null
    }
  }

  return { text: serializeRich(next, allowed).text, from, to }
}
