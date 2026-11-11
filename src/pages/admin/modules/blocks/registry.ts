import type { ComponentType } from 'react'
import type { LucideIcon } from 'lucide-react'
import {
  Flag,
  Headphones,
  Layers,
  ListChecks,
  MessageCircle,
  Puzzle,
  Scale,
  ShieldHalf,
  Sparkles,
  TextQuote,
  Users,
  WandSparkles,
} from 'lucide-react'
import type { BlockConfigMap, BlockType } from '../../../../types/modules'
import type { BaseModalProps } from '../../../../components/ui/popups/BaseModal'
import type { BlockFormProps } from './fields'
import { MessengerForm } from './messenger/MessengerForm'
import { ContrastForm } from './contrast/ContrastForm'
import { ContrastSummary } from './contrast/ContrastSummary'
import { MessengerSummary } from './summaries'

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
}

export function getBlockDefinition(type: BlockType): AnyBlockDefinition {
  return BLOCK_REGISTRY[type]
}

// Planned blocks shown greyed out in the library ("wkrótce").
export type PlannedBlock = { label: string; description: string; icon: LucideIcon; category: BlockCategory }

export const PLANNED_BLOCKS: PlannedBlock[] = [
  { label: 'Media Card', description: 'Obraz / wideo', icon: Headphones, category: 'knowledge' },
  { label: 'Concept Text', description: 'Krótki tekst, max 300 znaków', icon: TextQuote, category: 'knowledge' },
  { label: 'Story Flow / Stories', description: 'Pełnoekranowe plansze', icon: Layers, category: 'knowledge' },
  { label: 'Quiz', description: 'Jedno pytanie, max 6 odpowiedzi', icon: ListChecks, category: 'exercise' },
  { label: 'Sondaż użytkowników', description: 'Zbieranie opinii społeczności', icon: Users, category: 'exercise' },
  { label: 'Restrukturyzacja Poznawcza', description: 'Analiza myśli automatycznych', icon: Puzzle, category: 'exercise' },
  { label: 'Kreator Komunikatu JA', description: 'Budowanie wypowiedzi w 4 krokach', icon: Sparkles, category: 'exercise' },
  { label: 'Detektor Wzorców', description: 'Red i Green Flags', icon: Flag, category: 'exercise' },
  { label: 'Dialog z Krytykiem', description: 'Rozbrajanie lęku (IFS)', icon: ShieldHalf, category: 'exercise' },
  { label: 'Tinder Swipe', description: 'Wiele pytań, dwie odpowiedzi', icon: WandSparkles, category: 'exercise' },
]

export const CATEGORY_LABELS: Record<BlockCategory, string> = {
  knowledge: 'Podawanie wiedzy',
  exercise: 'Ćwiczenia',
}
