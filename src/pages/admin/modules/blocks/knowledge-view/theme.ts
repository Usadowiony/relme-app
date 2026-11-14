import {
  Check,
  CircleCheck,
  CircleQuestionMark,
  CircleX,
  Heading,
  LayoutPanelLeft,
  List,
  ListOrdered,
  MessageCircleCheck,
  MessagesSquare,
  Pilcrow,
  Sparkles,
  X,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type {
  KnowledgeElement,
  KnowledgeElementType,
  KnowledgeListMarker,
  KnowledgeSectionIcon,
} from '../../../../../types/modules'

/** Element catalogue shown in the side panel ("Dodaj element"), in this order. */
export const ELEMENT_META: Record<KnowledgeElementType, { label: string; description: string; Icon: LucideIcon }> = {
  heading: { label: 'Nagłówek', description: 'H1 lub H2', Icon: Heading },
  paragraph: { label: 'Akapit', description: 'Tekst z formatowaniem', Icon: Pilcrow },
  'image-text': { label: 'Tekst z grafiką', description: 'Grafika z lewej lub prawej', Icon: LayoutPanelLeft },
  'section-title': { label: 'Nagłówek z ikoną', description: 'Pytanie, błąd, dobra odpowiedź…', Icon: CircleQuestionMark },
  list: { label: 'Lista', description: 'Ptaszki, krzyżyki lub kropki', Icon: List },
  steps: { label: 'Kroki', description: 'Numerowana oś 1, 2, 3…', Icon: ListOrdered },
  callout: { label: 'Widżet', description: 'Zapamiętaj, Warto wiedzieć, Złota zasada', Icon: Sparkles },
  'chat-example': { label: 'Przykład rozmowy', description: 'Wiadomość + dobra / zła odpowiedź', Icon: MessagesSquare },
}

// "Widok wiedzy" — layout from the Figma CSS export, typography from the
// type scale agreed on 14.11.2026 (see types/modules.ts). The editor preview
// is the real phone width: 402 pt screen, 20 pt side padding.

export const KV = {
  screenWidth: 402,
  sidePadding: 20,
  heading: '#141F36', // all headings and step titles
  body: '#1D232B', // all body text
  step: { circle: '#E2E8F0', number: '#475569', line: '#A7AEB7' },
  imagePlaceholder: '#EEF1F2',
  chat: {
    cardBorder: '#EBEBEB',
    avatarBorder: '#BABABA',
    bubble: '#FBFBFB',
    bubbleBorder: '#EBEBEB',
  },
  shadow: '0px 4px 4px rgba(116, 116, 116, 0.08)',
} as const

/** The whole type scale of the block — Plus Jakarta Sans, 4 steps (+ chat bubbles). */
export const TYPE = {
  h1: 'font-jakarta text-[20px] leading-[28px] font-extrabold',
  h2: 'font-jakarta text-[18px] leading-[24px] font-extrabold', // H2, section title, callout title
  text: 'font-jakarta text-[16px] leading-[24px] font-normal', // paragraph, image text, list
  textBold: 'font-jakarta text-[16px] leading-[24px] font-bold', // step title
  small: 'font-jakarta text-[14px] leading-[20px] font-normal', // step description
  smallLight: 'font-jakarta text-[14px] leading-[20px] font-light', // callout body
  chat: 'font-jakarta text-[13px] leading-[18px] font-normal',
} as const

export const HEADING_TYPE: Record<1 | 2, string> = { 1: TYPE.h1, 2: TYPE.h2 }

/** Illustration next to text (rounded 32). */
export const IMAGE_SIZE = { width: 141, height: 114 } as const

export const SECTION_ICONS: Record<KnowledgeSectionIcon, { Icon: LucideIcon; color: string; label: string }> = {
  question: { Icon: CircleQuestionMark, color: '#564DF9', label: 'Pytanie' },
  wrong: { Icon: CircleX, color: '#FF6D6D', label: 'Czego unikać' },
  'chat-good': { Icon: MessageCircleCheck, color: '#2BAD77', label: 'Dobra odpowiedź' },
  good: { Icon: CircleCheck, color: '#2BAD77', label: 'Dobry sposób' },
}

// Callout cards: the shared widget — blocks/callout/ (CalloutCard, CALLOUTS).

/** List (16/24 text): icon 22 (stroke 2) or a 7 pt dot, centred on the first 24 pt line; items 8 apart. */
export const LIST_MARKERS: Record<KnowledgeListMarker, { label: string; Icon: LucideIcon | null; color: string }> = {
  check: { label: 'Ptaszki', Icon: Check, color: '#2BAD77' },
  cross: { label: 'Krzyżyki', Icon: X, color: '#FF6D6D' },
  dot: { label: 'Kropki', Icon: null, color: KV.body },
}

export const CHAT_VERDICTS = {
  good: { Icon: CircleCheck, icon: '#2BAD77', surface: '#E2F7EB', border: '#2BAD77', text: '#12965F', label: 'Dobra odpowiedź' },
  bad: { Icon: CircleX, icon: '#FF6D6D', surface: '#FFF3F3', border: '#FF6060', text: '#C84E4E', label: 'Zła odpowiedź' },
} as const

const BOXED: KnowledgeElement['type'][] = ['list', 'steps', 'callout', 'chat-example']

/** Vertical gap above `next` (pt) — the same rule the mobile app uses (see types/modules.ts). */
export function elementGap(prev: KnowledgeElement, next: KnowledgeElement): number {
  if (prev.type === 'section-title') return 16
  return BOXED.includes(prev.type) || BOXED.includes(next.type) ? 26 : 16
}
