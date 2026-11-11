// ============================================================
// Knowledge Modules — types (T5.1)
// ============================================================
// A module is a LINEAR list of views. Each view renders exactly one block.
// There are no branches/paths between views: if a block has its own logic
// (retry, explanation screen, per-answer extra screen), those sub-views live
// INSIDE the block config and the user always continues to the next view.
// This file is the data contract shared with the mobile player — keep it
// free of UI concerns.

// --- Block Type Registry ---
// Add a new block: extend BlockType + BlockConfigMap, then register it in
// utils/moduleFlow.ts (defaults + validation) and in the admin block registry.
export type BlockType =
  | 'exercise-messenger'
  | 'knowledge-behavioral-contrast'

// ============================================================
// BLOCK CONFIGS
// ============================================================

// --- exercise-messenger ---
// Chat simulation as a tree of scenarios. The fixed header "Przeczytaj
// rozmowę i wybierz najlepszą odpowiedź." is UI, not data.
// Playback: the contact (avatar) writes `root.message`; the user picks one of
// exactly 3 options; the contact answers with `option.next.message`; if that
// node has options the user picks again, and so on until a node without
// options. Then "Sprawdź odpowiedź": every pick on the path correct → next
// view, otherwise "Spróbuj ponownie" (restart). "Sprawdź dlaczego" opens the
// explanation sub-view: for every pick on the path the contact's message,
// the picked answer and that option's `explanation`; then the `conclusion`
// of the node where the conversation ended ("Czas na wnioski").
export type MessengerAvatar = 'female' | 'male'

export type MessengerWidget = {
  kind: 'remember' | 'golden_rule' // "Zapamiętaj" (blue) / "Złota zasada" (amber)
  title: string
  text: string
}

export type MessengerExplanation = {
  title: string // default "Na czym polegał błąd?"
  body: string
  points: string[] // optional bullet list (0..max)
  widget: MessengerWidget | null
}

export type MessengerConclusion = {
  title: string // default "Czas na wnioski"
  body: string
  better: {
    title: string // default "Jak możesz odpowiedzieć lepiej?"
    example: string // example answer shown in a chat bubble
    reasons: string[] // "Dlaczego to działa?" — 2..4 points
  }
}

export type MessengerOption = {
  id: string
  text: string
  is_correct: boolean // exactly one correct option per node
  explanation: MessengerExplanation
  next: MessengerNode // contact's reply to this option ("scenariusz")
}

export type MessengerNode = {
  id: string
  message: string // contact's message
  options: MessengerOption[] // 0 (conversation ends) or exactly 3; root always 3
  conclusion: MessengerConclusion // used only when the node ends the conversation
}

export type ExerciseMessengerConfig = {
  avatar: MessengerAvatar | null
  root: MessengerNode
}

// --- knowledge-behavioral-contrast ---
// One reading screen: kicker (default "Szybkie przypomnienie:"), headline,
// a red "avoid" card ("Zamiast"), a green "focus" card ("Skup się na") and an
// optional blue "remember" note ("Zapamiętaj"). Card titles are editable.
export type ContrastListCard = {
  title: string
  lead: string // required "rozwinięcie" under the title, e.g. "Reagować oskarżeniami poprzez"
  points: string[]
}

export type ContrastNoteCard = {
  title: string
  text: string
}

export type KnowledgeBehavioralContrastConfig = {
  kicker: string
  headline: string
  avoid: ContrastListCard
  focus: ContrastListCard
  remember: ContrastNoteCard | null
}

export type BlockConfigMap = {
  'exercise-messenger': ExerciseMessengerConfig
  'knowledge-behavioral-contrast': KnowledgeBehavioralContrastConfig
}

// --- Views ---
// Discriminated union: `block_type` narrows `config`.
export type ModuleView = {
  [K in BlockType]: { id: string; block_type: K; config: BlockConfigMap[K] }
}[BlockType]

export type ModuleFlowData = {
  schema_version: 2
  views: ModuleView[]
}

// ============================================================
// RECORDS (DB) — versioning model (T5.2)
// ============================================================
// modules         : metadata + pointer to the LIVE version (what users get)
// module_drafts   : the admin's working copy (autosaved, `revision` = optimistic lock)
// module_versions : named, immutable snapshots; a version that was ever
//                   published can never be deleted. A published module never
//                   disappears — its live version can only be replaced.

export type Module = {
  id: string
  title: string
  description: string | null
  cover_media_id: string | null
  live_version_id: string | null // null = never published
  created_by: string | null
  created_at: string
  updated_at: string
}

export type ModuleDraft = {
  module_id: string
  flow_data: ModuleFlowData
  revision: number
  updated_by: string | null
  updated_at: string
}

export type ModuleVersion = {
  id: string
  module_id: string
  version_number: number // v1, v2, … per module
  name: string
  flow_data: ModuleFlowData
  created_by: string | null
  created_at: string
  published_at: string | null // first publication; set = "was live at least once"
}

/** Derived: live = module's live pointer; archived = was live before; saved = never published. */
export type ModuleVersionStatus = 'saved' | 'live' | 'archived'

// --- Module Progress (user state) ---

export type ModuleProgress = {
  id: string
  user_id: string
  module_id: string
  module_version_id: string // version the user goes through (kept when a newer one is published)
  current_node_id: string // id of the current view
  completed_at: string | null
  collected_tags: Record<string, number>
  created_at: string
  updated_at: string
}

// --- Admin views (API results) ---

export type ModuleListItem = Module & {
  draft_view_count: number
  live_version: Pick<ModuleVersion, 'id' | 'version_number' | 'name'> | null
}

export type ModuleEditorData = {
  module: Module
  draft: ModuleDraft
}
