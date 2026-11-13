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
  | 'exercise-poll'
  | 'exercise-thought-record'
  | 'exercise-i-message'
  | 'exercise-pattern-detector'
  | 'exercise-quiz'

// ============================================================
// BLOCK CONFIGS
// ============================================================

// --- exercise-messenger ---
// Chat simulation as a tree of scenarios. The fixed header "Przeczytaj
// rozmowę i wybierz najlepszą odpowiedź." is UI, not data.
// The contact's avatar is not data: the app picks it from the user's gender.
// Playback: the contact writes `root.message`; the user picks one of
// exactly 3 options; the contact answers with `option.next.message`; if that
// node has options the user picks again, and so on until a node without
// options. Then "Sprawdź odpowiedź": every pick on the path correct → next
// view, otherwise "Spróbuj ponownie" (restart). "Sprawdź dlaczego" opens the
// explanation sub-view: for every pick on the path the contact's message,
// the picked answer and that option's `explanation`; then the `conclusion`
// of the node where the conversation ended ("Czas na wnioski").
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

// --- exercise-poll ---
// "Sondaż użytkowników": one question, 2..6 answers, no correct answer.
// The fixed header "Twoja odpowiedź oraz odpowiedzi społeczności" is UI,
// not data. Playback: the user picks one answer, then every answer shows the
// community's share of votes (%) with the user's pick highlighted, plus the
// total number of votes; then "Dalej". Votes are counted per view id +
// option id, so option ids must stay stable across versions.
export type PollOption = {
  id: string
  text: string
}

export type ExercisePollConfig = {
  question: string
  options: PollOption[]
}

// --- Step exercises (shared by thought-record and i-message) ---
// Steps unlock one by one; in each the user picks one answer from a list
// (exactly one is correct). "Sprawdź odpowiedzi" leads to the interpretation
// screen in one of two variants — `success` (every pick correct; the user may
// open it to see why, then "Dalej") or `failure` (at least one wrong pick;
// ends with "Spróbuj ponownie"). Both variants show: result, a reminder of
// the task, explanation, every step with the picked answer and that answer's
// `explanation` (shared by variants), conclusion. The success conclusion is
// short: title, body and an optional "Zapamiętaj". Fixed UI: "KROK n:",
// "Wyjaśnienie", verdicts "Prawidłowa odpowiedź!" / "Dlaczego to zła odpowiedź?".
export type ChoiceOption = {
  id: string
  label: string
  description: string // optional hint under the label in the picker list
  is_correct: boolean
  explanation: string // shown under the verdict when this answer was picked
}

export type ChoiceStep = {
  id: string
  title: string // after "KROK n:", e.g. "Zidentyfikuj główną emocję"
  subtitle: string // e.g. "Wybierz emocję, którą teraz czujesz."
  options: ChoiceOption[]
}

export type TextBlock = { title: string; body: string }

export type RememberWidget = { title: string; lead: string; text: string } // "Zapamiętaj" (lead shown in bold)

export type ReasonsList = { title: string; points: string[] } // "Dlaczego to działa?"

/** Short conclusion after a fully correct attempt. */
export type ShortConclusion = {
  title: string // default "Czas na wnioski"
  body: string
  remember: RememberWidget | null
}

export type ExerciseOutcome<C> = {
  result: TextBlock // header + intro, e.g. "To nie była odpowiednia analiza"
  explanation: TextBlock // under "Wyjaśnienie"
  conclusion: C
}

export type OutcomeVariant = 'success' | 'failure'

// --- exercise-thought-record ---
// "Dziennik Myśli ABC" (CBT; also usable for Gottman's horsemen → antidotes).
// 2..5 steps. Fixed UI: header "Jak powinieneś się zachować w podanej
// sytuacji?", label "Obraz sytuacji", reminder "Przypomnijmy obraz sytuacji".
export type ThoughtRecordReactionStep = {
  title: string // e.g. "Fakt"
  text: string // e.g. "Wiadomość została odczytana."
}

/** Full conclusion after a wrong analysis. */
export type ThoughtRecordConclusion = ShortConclusion & {
  reaction: { title: string; steps: ThoughtRecordReactionStep[] } // "Jak powinna wyglądać reakcja?"
  reasons: ReasonsList
}

export type ExerciseThoughtRecordConfig = {
  situation: string // "Obraz sytuacji"
  hint: ContrastNoteCard | null // optional "Wskazówka"
  steps: ChoiceStep[]
  success: ExerciseOutcome<ShortConclusion>
  failure: ExerciseOutcome<ThoughtRecordConclusion>
}

// --- exercise-i-message ---
// "Kreator Komunikatu JA" (NVC / Porozumienie bez przemocy). Exactly 4 steps:
// observation, feeling, need, request. Fixed UI: header "Stwórz prawidłową
// odpowiedź", reminder "Przypomnijmy kontekst". The partner's avatar is picked
// by the app from the user's gender. Under the steps the app assembles the
// picked labels into "Treść odpowiedzi:" (see composeIMessage).
export type IMessageConclusion = ShortConclusion & {
  better_title: string // default "Tak mogła brzmieć Twoja odpowiedź" — above the message built from correct answers
  reasons: ReasonsList
}

export type ExerciseIMessageConfig = {
  context: TextBlock // "Kontekst wiadomości" + its description
  partner_message: string // the partner's chat bubble
  hint: ContrastNoteCard | null // optional "Wskazówka"
  steps: ChoiceStep[] // exactly 4
  success: ExerciseOutcome<ShortConclusion>
  failure: ExerciseOutcome<IMessageConclusion>
}

// --- exercise-pattern-detector ---
// "Detektor Wzorców" (Red / Green Flags). Fixed UI: header "Wychwyć green
// oraz red flagi w wypowiedzi", the illustration, counters ("Znajdź 2 sygnały
// ostrzegawcze"), "Twoje trafienia", "Przypomnijmy analizowaną wypowiedź",
// "Wyjaśnienie", "Dlaczego to sygnał ostrzegawczy?" / "Dlaczego to pozytywny
// sygnał?". Playback: `text` is split into tappable fragments (flags + the
// neutral text between them, see patternSegments); the user marks fragments
// until every flag is found — only then "Przejdź dalej" / "Sprawdź
// wyjaśnienie" (interpretation: result, the text with highlights, every flag
// in text order with its title, quote and explanation, conclusion, optional
// "Zapamiętaj"). Flags are character ranges [start, end) of `text`.
export type PatternFlagKind = 'red' | 'green'

export type PatternFlag = {
  id: string
  kind: PatternFlagKind
  start: number
  end: number
  title: string // e.g. "Obwinianie byłych partnerów"
  explanation: string
}

export type ExercisePatternDetectorConfig = {
  title: string // default "Detektyw wzorców"
  subtitle: string
  text: string
  flags: PatternFlag[] // sorted by start, non-overlapping
  result: TextBlock // "Analiza wykrytych sygnałów" + intro
  conclusion: TextBlock // "Czas na wnioski"
  remember: ContrastNoteCard | null // optional "Zapamiętaj"
}

// --- exercise-quiz ---
// One question, 2..6 answers, 1+ correct. Fixed UI: the hint "Możesz zaznaczyć maksymalnie N
// odpowiedzi" (shown when N = number of correct answers > 1), verdict
// headers "Dlaczego Twoja odpowiedź była poprawna?" / "…niepoprawna?".
// Playback: the user picks up to N answers and checks them; the answer is
// correct only when the picked set equals the correct set. The
// interpretation shows every picked answer (green/red) with its
// `explanation`, then the optional "Zapamiętaj".
export type QuizOption = {
  id: string
  text: string
  is_correct: boolean
  explanation: string
}

export type ExerciseQuizConfig = {
  instruction: string // small header, default "Zaznacz prawidłową odpowiedź."
  question: string
  /** Optional illustration slot; the picture itself comes with the media library (null media = not chosen yet). */
  image: { media_id: string | null } | null
  options: QuizOption[]
  remember: ContrastNoteCard | null
}

export type BlockConfigMap = {
  'exercise-messenger': ExerciseMessengerConfig
  'knowledge-behavioral-contrast': KnowledgeBehavioralContrastConfig
  'exercise-poll': ExercisePollConfig
  'exercise-thought-record': ExerciseThoughtRecordConfig
  'exercise-i-message': ExerciseIMessageConfig
  'exercise-pattern-detector': ExercisePatternDetectorConfig
  'exercise-quiz': ExerciseQuizConfig
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
