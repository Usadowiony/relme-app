import type { PatternFlagKind } from '../../../../../types/modules'

// Colours of the "Detektor wzorców" screens (mobile mockups).

export const PD = {
  teal: '#2B6E78',
  screen: '#F4F4F4',
  neutral: '#EEEFEF', // tappable neutral fragment in the app
  remember: { color: '#3B8FD9', bg: '#EAF4FD' },
  conclusion: { color: '#3E8E6B', bg: '#F3F8F5', border: '#DCEAE1' },
}

export const FLAG_STYLE: Record<
  PatternFlagKind,
  { label: string; long: string; color: string; bg: string; line: string; boxBg: string; heading: string }
> = {
  red: {
    label: 'Red flag',
    long: 'Sygnał ostrzegawczy',
    color: '#E0484F',
    bg: '#FCE1E1',
    line: '#F2A3A3',
    boxBg: '#FDF2F2',
    heading: 'Dlaczego to sygnał ostrzegawczy?',
  },
  green: {
    label: 'Green flag',
    long: 'Pozytywny sygnał',
    color: '#3AA66B',
    bg: '#E1F3E7',
    line: '#A6D9B8',
    boxBg: '#F2FAF5',
    heading: 'Dlaczego to pozytywny sygnał?',
  },
}
