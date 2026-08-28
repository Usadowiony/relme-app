// ============================================================
// T5.1: Module Types — Graph Structure & Block System
// ============================================================

// --- Block Type Registry ---
// Extensible: add new block type strings here when introducing new blocks.
// Each block type has a corresponding concrete config type (discriminated union).
// The `(string & {})` fallback prevents crashes on unknown types
// while preserving autocomplete for known registered types.
export type BlockType =
  | 'exercise-messenger'
  | 'knowledge-behavioral-contrast'
  | (string & {})

// ============================================================
// BLOCK CONFIG TYPES
// Each block_type has its own config shape.
// PM defines the fields when implementing each block.
// ============================================================

// --- exercise-messenger ---
// Interactive chat exercise: user picks from answer options,
// receives personalized bot replies, passes/fails at the end.
// TODO(T5.1b): Define full config shape during ExerciseMessengerForm implementation.
export type ExerciseMessengerConfig = Record<string, unknown>

// --- knowledge-behavioral-contrast ---
// Displays a contrast of two behaviors/thoughts:
// image (via media_id), headline, two labeled cards ("Zamiast" / "Skup się na"),
// each with a sub-headline and 3 editable bullet points.
// Optional hint/memo element at the bottom.
// TODO(T5.1b): Define full config shape during KnowledgeBehavioralContrastForm implementation.
export type KnowledgeBehavioralContrastConfig = Record<string, unknown>

// --- Graph Nodes & Edges ---
// Discriminated union: TypeScript narrows config type based on block_type.
// The generic fallback branch handles future/unknown block types gracefully.

export type ModuleNode =
  | {
      id: string
      block_type: 'exercise-messenger'
      config: ExerciseMessengerConfig
      position_order: number
    }
  | {
      id: string
      block_type: 'knowledge-behavioral-contrast'
      config: KnowledgeBehavioralContrastConfig
      position_order: number
    }
  | {
      // Fallback for future block types not yet registered in this union.
      // Add new block_type + config type above instead of relying on this branch.
      id: string
      block_type: string
      config: Record<string, unknown>
      position_order: number
    }

export type ModuleEdge = {
  id: string
  source_node_id: string
  target_node_id: string
  condition: string | null  // e.g. answer_id, 'default', or null (unconditional)
}

export type ModuleFlowData = {
  schema_version: number    // currently 1 — increment on breaking structural changes
  entry_node_id: string
  nodes: ModuleNode[]
  edges: ModuleEdge[]
}

// --- Module Record (from DB) ---

export type ModuleStatus = 'draft' | 'published' | 'archived'

export type Module = {
  id: string
  title: string
  description: string | null
  cover_media_id: string | null
  status: ModuleStatus
  flow_data: ModuleFlowData
  created_by: string | null
  created_at: string
  updated_at: string
}

// --- Module Progress (user state) ---

export type ModuleProgress = {
  id: string
  user_id: string
  module_id: string
  current_node_id: string
  completed_at: string | null
  collected_tags: Record<string, number>  // { tag_slug: total_points } — placeholder for T5.4
  created_at: string
  updated_at: string
}

// --- Feedback System (embedded in block config) ---
// Generic feedback structure used by exercise blocks.
// Feedback lives inside block config — deleting an answer auto-removes its variant.

export type FeedbackVariant = {
  condition_key: string  // e.g. answer_id, 'all_correct', 'any_wrong'
  text: string
}

export type BlockFeedback = {
  fallback_text: string    // shown when no variant condition matches
  variants: FeedbackVariant[]
}

// --- Draft Management (localStorage) ---

export type ModuleDraftState = {
  moduleId: string
  flowData: ModuleFlowData
  lastModified: string
}
