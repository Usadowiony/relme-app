import { Info, Lightbulb, Sparkles } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { CalloutVariant } from '../../../../../types/modules'

// The shared widget (Callout) — one look in every block and in the app
// (Figma CSS export of "Dawka wiedzy", decision 14.11.2026). Titles are fixed
// by the variant: CALLOUT_TITLES in utils/moduleFlow.ts.

export type CalloutTheme = {
  Icon: LucideIcon
  accent: string // icon + title
  text: string // body (light), bold phrases in the same colour
  surface: string
  border: string
  blob: string
}

export const CALLOUTS: Record<CalloutVariant, CalloutTheme> = {
  remember: { Icon: Sparkles, accent: '#4F46E5', text: '#120B6B', surface: '#EEF2FF', border: '#DEE4FA', blob: '#EFEEF9' },
  info: { Icon: Info, accent: '#3595FB', text: '#225284', surface: '#EFF7FE', border: '#DEE4FA', blob: '#E6F3FF' },
  golden: { Icon: Lightbulb, accent: '#FFAE00', text: '#705419', surface: '#FEF6EC', border: '#F0E1CE', blob: '#FFF1DF' },
}

export const CALLOUT_SHADOW = '0px 4px 4px rgba(116, 116, 116, 0.08)'

/** Title 18/24 extrabold (= H2 of "Widok wiedzy"); body 14/20 light, bold 600. */
export const CALLOUT_TYPE = {
  title: 'font-jakarta text-[18px] leading-[24px] font-extrabold',
  body: 'font-jakarta text-[14px] leading-[20px] font-light',
  strongWeight: 600,
} as const
