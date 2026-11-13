import type { PatternFlag, PatternFlagKind } from '../types/modules'

// Pure helpers of the "Detektor Wzorców" block: flags are character ranges
// [start, end) over the block text. Shared by the admin editor and (later)
// the mobile player — no UI here.

export type TextToken = { text: string; start: number; end: number; isWord: boolean }

/** Splits text into words (any non-space run, punctuation included) and whitespace. */
export function tokenize(text: string): TextToken[] {
  const tokens: TextToken[] = []
  for (const m of text.matchAll(/\S+|\s+/g)) {
    const start = m.index ?? 0
    tokens.push({ text: m[0], start, end: start + m[0].length, isWord: /\S/.test(m[0]) })
  }
  return tokens
}

/** Shrinks a range so it does not start or end with whitespace; null when nothing is left. */
function trimRange(text: string, start: number, end: number): { start: number; end: number } | null {
  let s = Math.max(0, start)
  let e = Math.min(text.length, end)
  while (s < e && /\s/.test(text[s])) s++
  while (e > s && /\s/.test(text[e - 1])) e--
  return e > s ? { start: s, end: e } : null
}

/**
 * Keeps flags attached to their words after the text was edited. The edit is
 * found as the region between the common prefix and suffix of both texts;
 * flags before it stay, flags after it shift, flags touching it stretch or
 * shrink with it (and disappear when nothing is left).
 */
export function adjustFlagsOnEdit(oldText: string, newText: string, flags: PatternFlag[]): PatternFlag[] {
  if (oldText === newText) return flags
  let prefix = 0
  const maxPrefix = Math.min(oldText.length, newText.length)
  while (prefix < maxPrefix && oldText[prefix] === newText[prefix]) prefix++
  let suffix = 0
  while (
    suffix < maxPrefix - prefix &&
    oldText[oldText.length - 1 - suffix] === newText[newText.length - 1 - suffix]
  ) suffix++

  const oldEnd = oldText.length - suffix
  const newEnd = newText.length - suffix
  const delta = newText.length - oldText.length

  const mapPos = (pos: number, side: 'start' | 'end'): number => {
    if (pos < prefix || (side === 'end' && pos === prefix)) return pos
    if (pos > oldEnd || (side === 'start' && pos === oldEnd)) return pos + delta
    return side === 'start' ? prefix : newEnd // inside the edited region
  }

  return flags.flatMap(f => {
    const range = trimRange(newText, mapPos(f.start, 'start'), mapPos(f.end, 'end'))
    return range ? [{ ...f, ...range }] : []
  })
}

export type MarkResult = { flags: PatternFlag[]; error?: string }

/**
 * Applies a mark gesture over [start, end) with the given kind:
 * - a click on a single word of an existing flag toggles it (same kind →
 *   removed, other kind → kind switched);
 * - otherwise the range becomes one flag, replacing every flag it overlaps
 *   (title/explanation are kept when it overlapped exactly one flag).
 */
export function applyMark(
  text: string,
  flags: PatternFlag[],
  start: number,
  end: number,
  kind: PatternFlagKind,
  isSingleWordClick: boolean,
  maxFlags: number,
  createId: () => string
): MarkResult {
  const range = trimRange(text, start, end)
  if (!range) return { flags }

  const overlapping = flags.filter(f => f.start < range.end && f.end > range.start)
  const others = flags.filter(f => !overlapping.includes(f))

  if (isSingleWordClick && overlapping.length === 1) {
    const hit = overlapping[0]
    return {
      flags: hit.kind === kind ? others : sortFlags([...others, { ...hit, kind }]),
    }
  }

  const keep = overlapping.length === 1 ? overlapping[0] : null
  if (others.length + 1 > maxFlags) {
    return { flags, error: `Możesz zaznaczyć maksymalnie ${maxFlags} fragmentów.` }
  }
  const flag: PatternFlag = {
    id: keep?.id ?? createId(),
    kind,
    start: range.start,
    end: range.end,
    title: keep?.title ?? '',
    explanation: keep?.explanation ?? '',
  }
  return { flags: sortFlags([...others, flag]) }
}

export function sortFlags(flags: PatternFlag[]): PatternFlag[] {
  return [...flags].sort((a, b) => a.start - b.start)
}

export type PatternSegment = { text: string; flag: PatternFlag | null }

/**
 * The text as a list of fragments in reading order: every flag plus the
 * neutral text between flags (whitespace-only gaps are attached as plain
 * spacing, not as fragments). Neutral fragments are tappable "decoys" in the
 * app; tapping one counts as a miss.
 */
export function patternSegments(text: string, flags: PatternFlag[]): PatternSegment[] {
  const out: PatternSegment[] = []
  let pos = 0
  for (const f of sortFlags(flags)) {
    if (f.start > pos) out.push({ text: text.slice(pos, f.start), flag: null })
    out.push({ text: text.slice(f.start, f.end), flag: f })
    pos = f.end
  }
  if (pos < text.length) out.push({ text: text.slice(pos), flag: null })
  return out
}

export function flagText(text: string, flag: PatternFlag): string {
  return text.slice(flag.start, flag.end)
}
