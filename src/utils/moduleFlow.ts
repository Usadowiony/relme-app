import type {
  BlockConfigMap,
  BlockType,
  ContrastListCard,
  ContrastNoteCard,
  ExerciseMessengerConfig,
  KnowledgeBehavioralContrastConfig,
  MessengerConclusion,
  MessengerExplanation,
  MessengerNode,
  MessengerOption,
  MessengerWidget,
  ModuleFlowData,
  ModuleView,
} from '../types/modules'

// ============================================================
// Limits (shared by admin forms, API validation and mobile)
// ============================================================

export const MODULE_LIMITS = {
  messenger: {
    optionsPerNode: 3,
    maxDepth: 4, // max number of choices on one path (scenario 1.2.3.1)
    message: 500,
    optionText: 200,
    // explanation ("Sprawdź dlaczego") per answer
    explTitle: 80,
    explBody: 600,
    explPoint: 200,
    maxExplPoints: 5,
    widgetTitle: 40,
    widgetText: 300,
    // conclusion per ending scenario
    conclusionTitle: 80,
    conclusionBody: 600,
    betterTitle: 80,
    example: 300,
    reason: 200,
    minReasons: 2,
    maxReasons: 4,
  },
  contrast: {
    minPoints: 1,
    maxPoints: 5,
    kicker: 60,
    headline: 160,
    cardTitle: 40,
    lead: 120,
    point: 200,
    noteText: 300,
  },
} as const

export function createId(): string {
  return crypto.randomUUID()
}

export function createEmptyFlow(): ModuleFlowData {
  return { schema_version: 2, views: [] }
}

/** Normalizes whatever is stored in DB to flow v2 (old/empty shapes → empty flow). */
export function normalizeFlow(raw: unknown): ModuleFlowData {
  if (
    raw &&
    typeof raw === 'object' &&
    (raw as { schema_version?: unknown }).schema_version === 2 &&
    Array.isArray((raw as { views?: unknown }).views)
  ) {
    const flow = raw as ModuleFlowData
    return {
      ...flow,
      views: flow.views.map((view): ModuleView => {
        switch (view.block_type) {
          case 'knowledge-behavioral-contrast':
            return { ...view, config: normalizeContrastConfig(view.config) }
          case 'exercise-messenger':
            return { ...view, config: normalizeMessengerConfig(view.config) }
        }
      }),
    }
  }
  return createEmptyFlow()
}

/**
 * Upgrades older T5.1b messenger drafts: the linear `steps` list (only the
 * first step is kept; option `reply` becomes the scenario message) and the
 * tree without structured explanations/conclusions (string explanation →
 * explanation body, missing conclusion → default).
 */
function normalizeMessengerConfig(raw: unknown): ExerciseMessengerConfig {
  const defaults = createDefaultConfig('exercise-messenger')
  if (!raw || typeof raw !== 'object') return defaults

  type RawOption = Omit<Partial<MessengerOption>, 'explanation' | 'next'> & {
    explanation?: string | MessengerExplanation
    next?: RawNode
  }
  type RawNode = Omit<Partial<MessengerNode>, 'options'> & { options?: RawOption[] }
  const r = raw as { avatar?: ExerciseMessengerConfig['avatar']; root?: RawNode } & {
    steps?: { incoming_message?: string; options?: { text?: string; is_correct?: boolean; reply?: string; explanation?: string }[] }[]
  }

  const normalizeNode = (node: RawNode | undefined): MessengerNode => {
    const base = createMessengerNode(node?.message ?? '')
    return {
      id: node?.id ?? base.id,
      message: base.message,
      conclusion: node?.conclusion ?? base.conclusion,
      options: (node?.options ?? []).map(opt => ({
        id: opt.id ?? createId(),
        text: opt.text ?? '',
        is_correct: !!opt.is_correct,
        explanation:
          typeof opt.explanation === 'object' && opt.explanation
            ? opt.explanation
            : { ...createMessengerExplanation(), body: opt.explanation ?? '' },
        next: normalizeNode(opt.next),
      })),
    }
  }

  if (r.root) return { avatar: r.avatar ?? null, root: normalizeNode(r.root) }

  const step = r.steps?.[0]
  if (!step) return defaults
  return {
    avatar: null,
    root: normalizeNode({
      message: step.incoming_message,
      options: createMessengerOptions().map((opt, i) => {
        const old = step.options?.[i]
        return old
          ? { ...opt, text: old.text ?? '', is_correct: !!old.is_correct, explanation: old.explanation ?? '', next: { message: old.reply } }
          : opt
      }),
    }),
  }
}

/**
 * Early T5.1b drafts stored contrast as `{ headline, cards: [{ title, points }] }`.
 * Maps that shape (and any missing fields) onto the current contract.
 */
function normalizeContrastConfig(raw: unknown): KnowledgeBehavioralContrastConfig {
  const defaults = createDefaultConfig('knowledge-behavioral-contrast')
  if (!raw || typeof raw !== 'object') return defaults
  const r = raw as Partial<KnowledgeBehavioralContrastConfig> & {
    cards?: { title?: string; points?: string[] }[]
  }
  if (r.avoid && r.focus) {
    return { ...defaults, ...r, remember: r.remember ?? null }
  }
  const [a, f, n] = r.cards ?? []
  const toList = (card: typeof a, fallback: ContrastListCard): ContrastListCard =>
    card ? { title: card.title ?? fallback.title, lead: '', points: card.points?.length ? card.points : [''] } : fallback
  return {
    kicker: defaults.kicker,
    headline: r.headline ?? '',
    avoid: toList(a, defaults.avoid),
    focus: toList(f, defaults.focus),
    remember: n ? { title: n.title ?? 'Zapamiętaj', text: (n.points ?? []).join(' ') } : null,
  }
}

// ============================================================
// Default configs
// ============================================================

export function createMessengerConclusion(): MessengerConclusion {
  return {
    title: 'Czas na wnioski',
    body: '',
    better: { title: 'Jak możesz odpowiedzieć lepiej?', example: '', reasons: ['', ''] },
  }
}

export function createMessengerExplanation(): MessengerExplanation {
  return { title: 'Na czym polegał błąd?', body: '', points: [], widget: null }
}

export function createMessengerWidget(kind: MessengerWidget['kind']): MessengerWidget {
  return { kind, title: kind === 'remember' ? 'Zapamiętaj' : 'Złota zasada', text: '' }
}

export function createMessengerNode(message = ''): MessengerNode {
  return { id: createId(), message, options: [], conclusion: createMessengerConclusion() }
}

/** Exactly 3 empty options, none marked correct yet. */
export function createMessengerOptions(): MessengerOption[] {
  return Array.from({ length: MODULE_LIMITS.messenger.optionsPerNode }, () => ({
    id: createId(),
    text: '',
    is_correct: false,
    explanation: createMessengerExplanation(),
    next: createMessengerNode(),
  }))
}

export function createContrastNote(): ContrastNoteCard {
  return { title: 'Zapamiętaj', text: '' }
}

export function createDefaultConfig<K extends BlockType>(type: K): BlockConfigMap[K] {
  const defaults: { [T in BlockType]: () => BlockConfigMap[T] } = {
    'exercise-messenger': () => ({
      avatar: null,
      root: { ...createMessengerNode(), options: createMessengerOptions() },
    }),
    'knowledge-behavioral-contrast': () => ({
      kicker: 'Szybkie przypomnienie:',
      headline: '',
      avoid: { title: 'Zamiast', lead: '', points: [''] },
      focus: { title: 'Skup się na', lead: '', points: [''] },
      remember: null,
    }),
  }
  return defaults[type]()
}

export function createView(type: BlockType): ModuleView {
  return { id: createId(), block_type: type, config: createDefaultConfig(type) } as ModuleView
}

// ============================================================
// Validation — returns field-keyed Polish error messages.
// Keys are dot paths (e.g. "avoid.points.0") so forms can show
// inline errors; empty object = valid.
// ============================================================

export type ValidationErrors = Record<string, string>

function checkText(
  errors: ValidationErrors,
  key: string,
  value: string,
  max: number,
  label: string,
  required = true
) {
  const trimmed = value.trim()
  if (required && trimmed.length === 0) {
    errors[key] = `${label} jest wymagane.`
  } else if (trimmed.length > max) {
    errors[key] = `${label}: maksymalnie ${max} znaków.`
  }
}

// Messenger error keys are id-based (the tree has no stable index paths):
//   conversation: `avatar`, `node.<id>.message`, `node.<id>.options`, `option.<id>.text`
//   explanations: `option.<id>.explanation.*`, `node.<id>.conclusion.*`
export const MESSENGER_EXPLANATION_KEY = /\.(explanation|conclusion)\./

/** Errors of one answer's "Sprawdź dlaczego" explanation (prefix `option.<id>.explanation`). */
export function validateMessengerExplanation(optionId: string, e: MessengerExplanation): ValidationErrors {
  const L = MODULE_LIMITS.messenger
  const errors: ValidationErrors = {}
  const base = `option.${optionId}.explanation`

  checkText(errors, `${base}.title`, e.title, L.explTitle, 'Nagłówek')
  checkText(errors, `${base}.body`, e.body, L.explBody, 'Rozwinięcie')
  if (e.points.length > L.maxExplPoints) errors[`${base}.points`] = `Maksymalnie ${L.maxExplPoints} podpunktów.`
  e.points.forEach((p, i) => checkText(errors, `${base}.points.${i}`, p, L.explPoint, 'Podpunkt'))
  if (e.widget) {
    checkText(errors, `${base}.widget.title`, e.widget.title, L.widgetTitle, 'Tytuł widżetu')
    checkText(errors, `${base}.widget.text`, e.widget.text, L.widgetText, 'Treść widżetu')
  }
  return errors
}

/** Errors of an ending scenario's "Czas na wnioski" (prefix `node.<id>.conclusion`). */
export function validateMessengerConclusion(nodeId: string, c: MessengerConclusion): ValidationErrors {
  const L = MODULE_LIMITS.messenger
  const errors: ValidationErrors = {}
  const base = `node.${nodeId}.conclusion`

  checkText(errors, `${base}.title`, c.title, L.conclusionTitle, 'Nagłówek')
  checkText(errors, `${base}.body`, c.body, L.conclusionBody, 'Rozwinięcie')
  checkText(errors, `${base}.better.title`, c.better.title, L.betterTitle, 'Nagłówek widżetu')
  checkText(errors, `${base}.better.example`, c.better.example, L.example, 'Przykładowa odpowiedź')
  if (c.better.reasons.length < L.minReasons || c.better.reasons.length > L.maxReasons) {
    errors[`${base}.better.reasons`] = `Od ${L.minReasons} do ${L.maxReasons} podpunktów.`
  }
  c.better.reasons.forEach((r, i) => checkText(errors, `${base}.better.reasons.${i}`, r, L.reason, 'Podpunkt'))
  return errors
}

function validateMessenger(config: ExerciseMessengerConfig): ValidationErrors {
  const L = MODULE_LIMITS.messenger
  const errors: ValidationErrors = {}

  if (!config.avatar) errors.avatar = 'Wybierz postać rozmówcy.'

  const visit = (node: MessengerNode, depth: number, isRoot: boolean) => {
    checkText(errors, `node.${node.id}.message`, node.message, L.message, 'Wiadomość rozmówcy')

    if (node.options.length === 0) {
      if (isRoot) errors[`node.${node.id}.options`] = `Dodaj ${L.optionsPerNode} odpowiedzi.`
      else Object.assign(errors, validateMessengerConclusion(node.id, node.conclusion))
      return
    }
    if (node.options.length !== L.optionsPerNode) {
      errors[`node.${node.id}.options`] = `Muszą być dokładnie ${L.optionsPerNode} odpowiedzi.`
    } else if (node.options.filter(o => o.is_correct).length !== 1) {
      errors[`node.${node.id}.options`] = 'Zaznacz jedną prawidłową odpowiedź.'
    }
    if (depth > L.maxDepth) {
      errors[`node.${node.id}.options`] = `Rozmowa może mieć maksymalnie ${L.maxDepth} wybory z rzędu.`
    }

    for (const opt of node.options) {
      checkText(errors, `option.${opt.id}.text`, opt.text, L.optionText, 'Treść odpowiedzi')
      Object.assign(errors, validateMessengerExplanation(opt.id, opt.explanation))
      visit(opt.next, depth + 1, false)
    }
  }
  visit(config.root, 1, true)

  return errors
}

function validateContrast(config: KnowledgeBehavioralContrastConfig): ValidationErrors {
  const L = MODULE_LIMITS.contrast
  const errors: ValidationErrors = {}

  checkText(errors, 'kicker', config.kicker, L.kicker, 'Nadtytuł')
  checkText(errors, 'headline', config.headline, L.headline, 'Nagłówek')

  for (const key of ['avoid', 'focus'] as const) {
    const card = config[key]
    checkText(errors, `${key}.title`, card.title, L.cardTitle, 'Tytuł karty')
    checkText(errors, `${key}.lead`, card.lead, L.lead, 'Rozwinięcie')
    if (card.points.length < L.minPoints || card.points.length > L.maxPoints) {
      errors[`${key}.points`] = `Karta musi mieć od ${L.minPoints} do ${L.maxPoints} punktów.`
    }
    card.points.forEach((point, p) => {
      checkText(errors, `${key}.points.${p}`, point, L.point, 'Punkt')
    })
  }

  if (config.remember) {
    checkText(errors, 'remember.title', config.remember.title, L.cardTitle, 'Tytuł karty')
    checkText(errors, 'remember.text', config.remember.text, L.noteText, 'Treść')
  }

  return errors
}

export function validateView(view: ModuleView): ValidationErrors {
  switch (view.block_type) {
    case 'exercise-messenger':
      return validateMessenger(view.config)
    case 'knowledge-behavioral-contrast':
      return validateContrast(view.config)
  }
}

export type FlowIssue = { viewIndex: number; viewId: string; errors: ValidationErrors }

/** Full content validation (used before publishing). */
export function validateFlowContent(flow: ModuleFlowData): FlowIssue[] {
  return flow.views
    .map((view, viewIndex) => ({ viewIndex, viewId: view.id, errors: validateView(view) }))
    .filter(issue => Object.keys(issue.errors).length > 0)
}

const KNOWN_BLOCK_TYPES: readonly string[] = ['exercise-messenger', 'knowledge-behavioral-contrast']

/**
 * Structural validation (used before every save). Drafts may hold incomplete
 * content, but the shape must always be correct.
 */
export function assertValidFlowStructure(flow: ModuleFlowData): void {
  if (flow.schema_version !== 2 || !Array.isArray(flow.views)) {
    throw new Error('Nieprawidłowa struktura modułu.')
  }
  const ids = new Set<string>()
  for (const view of flow.views) {
    if (!view.id || ids.has(view.id)) throw new Error('Zduplikowany lub pusty identyfikator widoku.')
    ids.add(view.id)
    if (!KNOWN_BLOCK_TYPES.includes(view.block_type)) {
      throw new Error(`Nieznany typ bloku: ${String(view.block_type)}.`)
    }
    if (!view.config || typeof view.config !== 'object') {
      throw new Error('Brak konfiguracji bloku.')
    }
  }
}

/** Key-order independent JSON (jsonb from the DB reorders keys). */
function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`
  if (value && typeof value === 'object') {
    const entries = Object.keys(value as Record<string, unknown>)
      .sort()
      .map(k => `${JSON.stringify(k)}:${stableStringify((value as Record<string, unknown>)[k])}`)
    return `{${entries.join(',')}}`
  }
  return JSON.stringify(value)
}

/** True when two flows have identical content (draft vs saved version). */
export function flowsEqual(a: ModuleFlowData, b: ModuleFlowData): boolean {
  return a === b || stableStringify(a) === stableStringify(b)
}

// ============================================================
// Navigation helpers (mobile player / preview)
// ============================================================

/** Next view id or null when the current view is the last one. */
export function getNextViewId(flow: ModuleFlowData, currentId: string): string | null {
  const idx = flow.views.findIndex(v => v.id === currentId)
  if (idx === -1) return flow.views[0]?.id ?? null
  return flow.views[idx + 1]?.id ?? null
}

/** Progress as { current: 1-based position, total }. */
export function getProgress(flow: ModuleFlowData, currentId: string): { current: number; total: number } {
  const idx = flow.views.findIndex(v => v.id === currentId)
  return { current: idx === -1 ? 0 : idx + 1, total: flow.views.length }
}
