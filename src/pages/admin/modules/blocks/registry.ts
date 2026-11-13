import type { ComponentType } from 'react'
import type { LucideIcon } from 'lucide-react'
import { Flag, ListChecks, MessageCircle, Puzzle, Scale, Sparkles, TextQuote, Users } from 'lucide-react'
import type { BlockConfigMap, BlockType } from '../../../../types/modules'
import type { BaseModalProps } from '../../../../components/ui/popups/BaseModal'
import type { BlockFormProps } from './fields'
import { MessengerForm } from './messenger/MessengerForm'
import { ContrastForm } from './contrast/ContrastForm'
import { ContrastSummary } from './contrast/ContrastSummary'
import { MessengerSummary } from './messenger/MessengerSummary'
import { PollForm } from './poll/PollForm'
import { PollSummary } from './poll/PollSummary'
import { ThoughtRecordForm } from './thought-record/ThoughtRecordForm'
import { ThoughtRecordSummary } from './thought-record/ThoughtRecordSummary'
import { IMessageForm } from './i-message/IMessageForm'
import { IMessageSummary } from './i-message/IMessageSummary'
import { PatternDetectorForm } from './pattern-detector/PatternDetectorForm'
import { PatternDetectorSummary } from './pattern-detector/PatternDetectorSummary'
import { QuizForm } from './quiz/QuizForm'
import { QuizSummary } from './quiz/QuizSummary'

// ============================================================
// Block registry — single place that wires a block type to its admin UI.
// To add a block: types/modules.ts → utils/moduleFlow.ts (defaults,
// validation) → Form + Summary components → one entry below.
// ============================================================

export type BlockCategory = 'knowledge' | 'exercise'

type BlockDefinition<K extends BlockType> = {
  type: K
  label: string
  description: string
  icon: LucideIcon
  color: string
  category: BlockCategory
  /** Edit popup width — narrow for phone-preview editors, wide for long forms. */
  modalWidth: NonNullable<BaseModalProps['maxWidth']>
  Form: ComponentType<BlockFormProps<BlockConfigMap[K]>>
  Summary: ComponentType<{ config: BlockConfigMap[K]; color: string }>
}

// Erased form used by generic editor code. Safe because a view's
// block_type always matches its config (see ModuleView union).
export type AnyBlockDefinition = Omit<BlockDefinition<BlockType>, 'Form' | 'Summary'> & {
  Form: ComponentType<BlockFormProps<BlockConfigMap[BlockType]>>
  Summary: ComponentType<{ config: BlockConfigMap[BlockType]; color: string }>
}

function defineBlock<K extends BlockType>(def: BlockDefinition<K>): AnyBlockDefinition {
  return def as unknown as AnyBlockDefinition
}

export const BLOCK_REGISTRY: Record<BlockType, AnyBlockDefinition> = {
  'knowledge-behavioral-contrast': defineBlock({
    type: 'knowledge-behavioral-contrast',
    label: 'Kontrast Zachowań',
    description: 'Porównanie właściwych postaw',
    icon: Scale,
    color: '#D9646F',
    category: 'knowledge',
    modalWidth: 'xl',
    Form: ContrastForm,
    Summary: ContrastSummary,
  }),
  'exercise-messenger': defineBlock({
    type: 'exercise-messenger',
    label: 'Messenger',
    description: 'Symulacja dialogu na żywo',
    icon: MessageCircle,
    color: '#7C6FD6',
    category: 'exercise',
    modalWidth: '2xl',
    Form: MessengerForm,
    Summary: MessengerSummary,
  }),
  'exercise-poll': defineBlock({
    type: 'exercise-poll',
    label: 'Sondaż użytkowników',
    description: 'Zbieranie opinii społeczności',
    icon: Users,
    color: '#2B8A9A',
    category: 'exercise',
    modalWidth: 'lg',
    Form: PollForm,
    Summary: PollSummary,
  }),
  'exercise-thought-record': defineBlock({
    type: 'exercise-thought-record',
    label: 'Dziennik Myśli ABC',
    description: 'Analiza sytuacji krok po kroku (CBT, Gottman)',
    icon: Puzzle,
    color: '#2B6E78',
    category: 'exercise',
    modalWidth: 'xl',
    Form: ThoughtRecordForm,
    Summary: ThoughtRecordSummary,
  }),
  'exercise-i-message': defineBlock({
    type: 'exercise-i-message',
    label: 'Kreator Komunikatu JA',
    description: 'Odpowiedź w 4 krokach NVC',
    icon: Sparkles,
    color: '#C27C2C',
    category: 'exercise',
    modalWidth: 'xl',
    Form: IMessageForm,
    Summary: IMessageSummary,
  }),
  'exercise-pattern-detector': defineBlock({
    type: 'exercise-pattern-detector',
    label: 'Detektor Wzorców',
    description: 'Red i Green Flags',
    icon: Flag,
    color: '#E0484F',
    category: 'exercise',
    modalWidth: 'xl',
    Form: PatternDetectorForm,
    Summary: PatternDetectorSummary,
  }),
  'exercise-quiz': defineBlock({
    type: 'exercise-quiz',
    label: 'Quiz',
    description: 'Jedno pytanie, max 6 odpowiedzi',
    icon: ListChecks,
    color: '#4C7FD1',
    category: 'exercise',
    modalWidth: 'lg',
    Form: QuizForm,
    Summary: QuizSummary,
  }),
}

export function getBlockDefinition(type: BlockType): AnyBlockDefinition {
  return BLOCK_REGISTRY[type]
}

// Planned blocks shown greyed out in the library ("wkrótce").
export type PlannedBlock = { label: string; description: string; icon: LucideIcon; category: BlockCategory }

export const PLANNED_BLOCKS: PlannedBlock[] = [
  { label: 'Concept Text', description: 'Krótki tekst, max 300 znaków', icon: TextQuote, category: 'knowledge' },
]

export const CATEGORY_LABELS: Record<BlockCategory, string> = {
  knowledge: 'Podawanie wiedzy',
  exercise: 'Ćwiczenia',
}
