import { CircleCheck, CircleX } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

// Colours of the behavioral-contrast screen (mobile mockup). Shared by the
// editor popup and the timeline summary.

export const CONTRAST_TONES = {
  avoid: { icon: CircleX, color: '#E0565B', bg: '#FFF8F8', border: '#F5D3D3' },
  focus: { icon: CircleCheck, color: '#3E8E6B', bg: '#F7FBF8', border: '#BFDFCC' },
} satisfies Record<string, { icon: LucideIcon; color: string; bg: string; border: string }>

export type ContrastTone = keyof typeof CONTRAST_TONES

export const CONTRAST_NOTE = { color: '#3B8FD9', bg: '#EAF4FD' }
export const CONTRAST_KICKER_COLOR = '#2B6E78'
