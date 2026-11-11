import type { MessengerAvatar } from '../../../../../types/modules'

// Colours and avatar placeholders of the messenger screens (mobile mockups).

export const MSG_TEAL = '#2B6E78'
export const MSG_GREEN = '#3E8E6B'
export const MSG_RED = '#E0565B'

export const AVATARS: Record<MessengerAvatar, { label: string; bg: string; color: string }> = {
  female: { label: 'Kobieta', bg: '#F9DCD6', color: '#C0556B' },
  male: { label: 'Mężczyzna', bg: '#D6E6F5', color: '#3B6E9E' },
}

/** Contact bubble style (left side of the chat). */
export const CONTACT_BUBBLE =
  'rounded-[10px] border border-[#E6E6E6] bg-[#F7F7F7] px-3 py-2 text-[13px] leading-snug text-dark'
