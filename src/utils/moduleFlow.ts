import type {
  BlockConfigMap,
  BlockType,
  ContrastListCard,
  ContrastNoteCard,
  ExerciseMessengerConfig,
  ExercisePollConfig,
  ExerciseThoughtRecordConfig,
  KnowledgeBehavioralContrastConfig,
  MessengerConclusion,
  MessengerExplanation,
  MessengerNode,
  MessengerOption,
  MessengerWidget,
  ModuleFlowData,
  ModuleView,
  ChoiceOption,
  ChoiceStep,
  ExerciseIMessageConfig,
  ExerciseOutcome,
  ExercisePatternDetectorConfig,
  ExerciseQuizConfig,
  ShortConclusion,
} from '../types/modules'
import { jsonEqual } from './json'

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
  poll: {
    minOptions: 2,
    maxOptions: 6,
    question: 160,
    option: 100,
  },
  // Shared by step exercises (thought-record, i-message)
  steps: {
    // content tab
    minOptions: 3,
    maxOptions: 4,
    hintTitle: 40,
    hintText: 300,
    stepTitle: 80,
    stepSubtitle: 120,
    optionLabel: 80,
    optionDescription: 150,
    // interpretation tab
    optionExplanation: 600,
    resultTitle: 80,
    resultBody: 400,
    explTitle: 100,
    explBody: 800,
    conclusionTitle: 80,
    conclusionBody: 600,
    widgetTitle: 60,
    reason: 160,
    minReasons: 2,
    maxReasons: 5,
    rememberLead: 160,
    rememberText: 400,
  },
  thoughtRecord: {
    minSteps: 2,
    maxSteps: 5, // ABC = 3, ABCDE = 5; Gottman horseman → antidote = 2
    situation: 300,
    reactionStepTitle: 60,
    reactionStepText: 200,
    minReactionSteps: 2,
    maxReactionSteps: 6,
  },
  iMessage: {
    steps: 4, // observation, feeling, need, request (fixed)
    contextTitle: 80,
    contextBody: 300,
    partnerMessage: 300,
  },
  patternDetector: {
    title: 60,
    subtitle: 200,
    text: 600,
    maxFlags: 6,
    flagTitle: 60,
    explanation: 500,
    resultTitle: 80,
    resultBody: 300,
    conclusionTitle: 60,
    conclusionBody: 500,
    rememberTitle: 40,
    rememberText: 300,
  },
  quiz: {
    instruction: 60,
    minOptions: 2,
    maxOptions: 6,
    question: 160,
    option: 100,
    explanation: 500,
    rememberTitle: 40,
    rememberText: 300,
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
          case 'exercise-poll':
            return { ...view, config: normalizePollConfig(view.config) }
          case 'exercise-thought-record':
            return { ...view, config: normalizeThoughtRecordConfig(view.config) }
          case 'exercise-i-message':
            return { ...view, config: normalizeIMessageConfig(view.config) }
          case 'exercise-pattern-detector':
            return { ...view, config: { ...createDefaultConfig('exercise-pattern-detector'), ...(view.config as object) } }
          case 'exercise-quiz':
            return { ...view, config: { ...createDefaultConfig('exercise-quiz'), ...(view.config as object) } }
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
  // Older drafts also stored `avatar` — dropped (the app picks it from the user's gender).
  const r = raw as { root?: RawNode } & {
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

  if (r.root) return { root: normalizeNode(r.root) }

  const step = r.steps?.[0]
  if (!step) return defaults
  return {
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

/** Fills missing poll fields (keeps option ids — votes are keyed by them). */
function normalizePollConfig(raw: unknown): ExercisePollConfig {
  if (!raw || typeof raw !== 'object') return createDefaultConfig('exercise-poll')
  const r = raw as Partial<ExercisePollConfig>
  return {
    question: r.question ?? '',
    options: (r.options ?? []).map(o => ({ id: o?.id ?? createId(), text: o?.text ?? '' })),
  }
}

/**
 * Fills missing thought-record sections with defaults. Early drafts had a
 * single (failure) interpretation at the top level — moved into `failure`.
 */
function normalizeThoughtRecordConfig(raw: unknown): ExerciseThoughtRecordConfig {
  const defaults = createDefaultConfig('exercise-thought-record')
  if (!raw || typeof raw !== 'object') return defaults
  const r = raw as Partial<ExerciseThoughtRecordConfig> & Partial<ExerciseThoughtRecordConfig['failure']>
  const failure = r.failure ?? {
    result: r.result ?? defaults.failure.result,
    explanation: r.explanation ?? defaults.failure.explanation,
    conclusion: r.conclusion ? { ...defaults.failure.conclusion, ...r.conclusion } : defaults.failure.conclusion,
  }
  return {
    situation: r.situation ?? '',
    hint: r.hint ?? null,
    steps: r.steps ?? defaults.steps,
    success: r.success ?? defaults.success,
    failure,
  }
}

function normalizeIMessageConfig(raw: unknown): ExerciseIMessageConfig {
  const defaults = createDefaultConfig('exercise-i-message')
  if (!raw || typeof raw !== 'object') return defaults
  const r = raw as Partial<ExerciseIMessageConfig>
  return {
    context: r.context ?? defaults.context,
    partner_message: r.partner_message ?? '',
    hint: r.hint ?? null,
    steps: r.steps ?? defaults.steps,
    success: r.success ?? defaults.success,
    failure: r.failure ? { ...r.failure, conclusion: { ...defaults.failure.conclusion, ...r.failure.conclusion } } : defaults.failure,
  }
}

// ============================================================
// Default configs
// ============================================================

export function createChoiceOption(): ChoiceOption {
  return { id: createId(), label: '', description: '', is_correct: false, explanation: '' }
}

/** A step with the minimum number of empty answers. */
export function createChoiceStep(title = '', subtitle = ''): ChoiceStep {
  return {
    id: createId(),
    title,
    subtitle,
    options: Array.from({ length: MODULE_LIMITS.steps.minOptions }, createChoiceOption),
  }
}

function createOutcome<C>(resultTitle: string, conclusion: C): ExerciseOutcome<C> {
  return { result: { title: resultTitle, body: '' }, explanation: { title: '', body: '' }, conclusion }
}

function createShortConclusion(): ShortConclusion {
  return { title: 'Czas na wnioski', body: '', remember: null }
}

/** The 4 fixed NVC steps, pre-filled with the mockup wording (editable). */
const I_MESSAGE_STEPS: [string, string][] = [
  ['Wybierz obserwację', 'Jaki opis sytuacji przedstawia suchy fakt, bez ocen i uogólnień?'],
  ['Wybierz uczucie', 'Które sformułowanie opisuje Twój stan emocjonalny, nie obwiniając drugiej strony?'],
  ['Wybierz potrzebę', 'Jaka Twoja uniwersalna potrzeba kryje się pod tymi emocjami?'],
  ['Wybierz prośbę', 'O jakie konkretne, możliwe do wykonania działanie chcesz poprosić?'],
]

/**
 * Builds the "Treść odpowiedzi" message from picked answers: labels lose
 * their leading/trailing "…" and are joined with ", " — or ". " when the next
 * part starts with a capital letter (e.g. the request "Czy możemy…").
 */
export function composeIMessage(labels: string[]): string {
  const parts = labels.map(l => l.trim().replace(/^[\s.…]+|[\s.…]+$/g, '')).filter(Boolean)
  let out = ''
  parts.forEach((part, i) => {
    if (i === 0) out = part.charAt(0).toUpperCase() + part.slice(1)
    else if (/^\p{Lu}/u.test(part)) out += `${/[.?!]$/.test(out) ? '' : '.'} ${part}`
    else out += `${/[,;]$/.test(out) ? '' : ','} ${part}`
  })
  return out && !/[.?!]$/.test(out) ? `${out}.` : out
}

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
      root: { ...createMessengerNode(), options: createMessengerOptions() },
    }),
    'knowledge-behavioral-contrast': () => ({
      kicker: 'Szybkie przypomnienie:',
      headline: '',
      avoid: { title: 'Zamiast', lead: '', points: [''] },
      focus: { title: 'Skup się na', lead: '', points: [''] },
      remember: null,
    }),
    'exercise-poll': () => ({ question: '', options: [] }),
    'exercise-thought-record': () => ({
      situation: '',
      hint: null,
      steps: Array.from({ length: 3 }, () => createChoiceStep()), // A-B-C
      success: createOutcome('To była trafna analiza', createShortConclusion()),
      failure: createOutcome('To nie była odpowiednia analiza', {
        ...createShortConclusion(),
        reaction: {
          title: 'Jak powinna wyglądać reakcja?',
          steps: Array.from({ length: MODULE_LIMITS.thoughtRecord.minReactionSteps }, () => ({ title: '', text: '' })),
        },
        reasons: { title: 'Dlaczego to działa?', points: ['', ''] },
      }),
    }),
    'exercise-i-message': () => ({
      context: { title: '', body: '' },
      partner_message: '',
      hint: null,
      steps: I_MESSAGE_STEPS.map(([title, subtitle]) => createChoiceStep(title, subtitle)),
      success: createOutcome('To był dobry komunikat JA', createShortConclusion()),
      failure: createOutcome('To nie był dobry komunikat JA', {
        ...createShortConclusion(),
        better_title: 'Tak mogła brzmieć Twoja odpowiedź',
        reasons: { title: 'Dlaczego to działa?', points: ['', ''] },
      }),
    }),
    'exercise-pattern-detector': () => ({
      title: 'Detektyw wzorców',
      subtitle: 'Zaznacz fragmenty wypowiedzi, które mogą być sygnałami ostrzegawczymi lub zielonymi flagami.',
      text: '',
      flags: [],
      result: { title: '', body: '' },
      conclusion: { title: 'Czas na wnioski', body: '' },
      remember: null,
    }),
    'exercise-quiz': () => ({
      instruction: 'Zaznacz prawidłową odpowiedź.',
      question: '',
      image: null,
      options: [],
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
//   conversation: `node.<id>.message`, `node.<id>.options`, `option.<id>.text`
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

// Poll error keys: `question`, `options`, `option.<id>.text`
function validatePoll(config: ExercisePollConfig): ValidationErrors {
  const L = MODULE_LIMITS.poll
  const errors: ValidationErrors = {}

  checkText(errors, 'question', config.question, L.question, 'Treść pytania')
  if (config.options.length < L.minOptions || config.options.length > L.maxOptions) {
    errors.options = `Sondaż musi mieć od ${L.minOptions} do ${L.maxOptions} odpowiedzi.`
  }
  for (const opt of config.options) {
    checkText(errors, `option.${opt.id}.text`, opt.text, L.option, 'Treść odpowiedzi')
  }
  return errors
}

// Step-exercise error keys (thought-record, i-message):
//   content:        block-specific top-level keys, `hint.*`, `steps`,
//                   `step.<id>.{title,subtitle,options}`, `option.<id>.{label,description}`
//   interpretation: `option.<id>.explanation`, `<variant>.{result,explanation,conclusion}.*`
//                   where <variant> = success | failure
export const STEP_EXERCISE_INTERPRETATION_KEY = /^(success|failure)\.|\.explanation$/

function validateHint(errors: ValidationErrors, hint: ContrastNoteCard | null) {
  const L = MODULE_LIMITS.steps
  if (!hint) return
  checkText(errors, 'hint.title', hint.title, L.hintTitle, 'Tytuł wskazówki')
  checkText(errors, 'hint.text', hint.text, L.hintText, 'Treść wskazówki')
}

function validateChoiceSteps(errors: ValidationErrors, steps: ChoiceStep[]) {
  const L = MODULE_LIMITS.steps
  for (const step of steps) {
    checkText(errors, `step.${step.id}.title`, step.title, L.stepTitle, 'Treść kroku')
    checkText(errors, `step.${step.id}.subtitle`, step.subtitle, L.stepSubtitle, 'Podopis kroku')
    if (step.options.length < L.minOptions || step.options.length > L.maxOptions) {
      errors[`step.${step.id}.options`] = `Krok musi mieć od ${L.minOptions} do ${L.maxOptions} odpowiedzi.`
    } else if (step.options.filter(o => o.is_correct).length !== 1) {
      errors[`step.${step.id}.options`] = 'Zaznacz jedną prawidłową odpowiedź.'
    }
    for (const opt of step.options) {
      checkText(errors, `option.${opt.id}.label`, opt.label, L.optionLabel, 'Treść odpowiedzi')
      checkText(errors, `option.${opt.id}.description`, opt.description, L.optionDescription, 'Opis odpowiedzi', false)
      checkText(errors, `option.${opt.id}.explanation`, opt.explanation, L.optionExplanation, 'Wyjaśnienie odpowiedzi')
    }
  }
}

/** Result, explanation and the short part of the conclusion (both variants). */
function validateOutcome(errors: ValidationErrors, variant: 'success' | 'failure', outcome: ExerciseOutcome<ShortConclusion>) {
  const L = MODULE_LIMITS.steps
  const p = variant
  checkText(errors, `${p}.result.title`, outcome.result.title, L.resultTitle, 'Nagłówek')
  checkText(errors, `${p}.result.body`, outcome.result.body, L.resultBody, 'Wstęp')
  checkText(errors, `${p}.explanation.title`, outcome.explanation.title, L.explTitle, 'Nagłówek wyjaśnienia')
  checkText(errors, `${p}.explanation.body`, outcome.explanation.body, L.explBody, 'Treść wyjaśnienia')

  const c = outcome.conclusion
  checkText(errors, `${p}.conclusion.title`, c.title, L.conclusionTitle, 'Nagłówek')
  checkText(errors, `${p}.conclusion.body`, c.body, L.conclusionBody, 'Rozwinięcie')
  if (c.remember) {
    checkText(errors, `${p}.conclusion.remember.title`, c.remember.title, L.widgetTitle, 'Tytuł widżetu')
    checkText(errors, `${p}.conclusion.remember.lead`, c.remember.lead, L.rememberLead, 'Wyróżnione zdanie')
    checkText(errors, `${p}.conclusion.remember.text`, c.remember.text, L.rememberText, 'Treść widżetu')
  }
}

function validateReasons(errors: ValidationErrors, reasons: { title: string; points: string[] }) {
  const L = MODULE_LIMITS.steps
  checkText(errors, 'failure.conclusion.reasons.title', reasons.title, L.widgetTitle, 'Nagłówek')
  if (reasons.points.length < L.minReasons || reasons.points.length > L.maxReasons) {
    errors['failure.conclusion.reasons.points'] = `Od ${L.minReasons} do ${L.maxReasons} podpunktów.`
  }
  reasons.points.forEach((p, i) => checkText(errors, `failure.conclusion.reasons.points.${i}`, p, L.reason, 'Podpunkt'))
}

function validateThoughtRecord(config: ExerciseThoughtRecordConfig): ValidationErrors {
  const L = MODULE_LIMITS.thoughtRecord
  const errors: ValidationErrors = {}

  checkText(errors, 'situation', config.situation, L.situation, 'Obraz sytuacji')
  validateHint(errors, config.hint)
  if (config.steps.length < L.minSteps || config.steps.length > L.maxSteps) {
    errors.steps = `Ćwiczenie musi mieć od ${L.minSteps} do ${L.maxSteps} kroków.`
  }
  validateChoiceSteps(errors, config.steps)

  validateOutcome(errors, 'success', config.success)
  validateOutcome(errors, 'failure', config.failure)

  // Failure-only part of the conclusion
  const c = config.failure.conclusion
  checkText(errors, 'failure.conclusion.reaction.title', c.reaction.title, MODULE_LIMITS.steps.widgetTitle, 'Nagłówek widżetu')
  if (c.reaction.steps.length < L.minReactionSteps || c.reaction.steps.length > L.maxReactionSteps) {
    errors['failure.conclusion.reaction.steps'] = `Od ${L.minReactionSteps} do ${L.maxReactionSteps} etapów reakcji.`
  }
  c.reaction.steps.forEach((s, i) => {
    checkText(errors, `failure.conclusion.reaction.steps.${i}.title`, s.title, L.reactionStepTitle, 'Nazwa etapu')
    checkText(errors, `failure.conclusion.reaction.steps.${i}.text`, s.text, L.reactionStepText, 'Opis etapu')
  })
  validateReasons(errors, c.reasons)

  return errors
}

function validateIMessage(config: ExerciseIMessageConfig): ValidationErrors {
  const L = MODULE_LIMITS.iMessage
  const errors: ValidationErrors = {}

  checkText(errors, 'context.title', config.context.title, L.contextTitle, 'Kontekst wiadomości')
  checkText(errors, 'context.body', config.context.body, L.contextBody, 'Opis kontekstu')
  checkText(errors, 'partner_message', config.partner_message, L.partnerMessage, 'Wiadomość partnera')
  validateHint(errors, config.hint)
  if (config.steps.length !== L.steps) errors.steps = `Ćwiczenie musi mieć dokładnie ${L.steps} kroki.`
  validateChoiceSteps(errors, config.steps)

  validateOutcome(errors, 'success', config.success)
  validateOutcome(errors, 'failure', config.failure)
  checkText(errors, 'failure.conclusion.better_title', config.failure.conclusion.better_title, MODULE_LIMITS.steps.widgetTitle, 'Nagłówek widżetu')
  validateReasons(errors, config.failure.conclusion.reasons)

  return errors
}

// Pattern-detector error keys:
//   content:        `title`, `subtitle`, `text`, `flags`
//   interpretation: `result.*`, `flag.<id>.{title,explanation}`, `conclusion.*`, `remember.*`
export const PATTERN_INTERPRETATION_KEY = /^(result|flag|conclusion|remember)\./

function validatePatternDetector(config: ExercisePatternDetectorConfig): ValidationErrors {
  const L = MODULE_LIMITS.patternDetector
  const errors: ValidationErrors = {}

  checkText(errors, 'title', config.title, L.title, 'Nagłówek')
  checkText(errors, 'subtitle', config.subtitle, L.subtitle, 'Podtytuł')
  checkText(errors, 'text', config.text, L.text, 'Treść wypowiedzi')
  if (config.flags.length === 0) errors.flags = 'Zaznacz w wypowiedzi co najmniej jedną red lub green flagę.'
  else if (config.flags.length > L.maxFlags) errors.flags = `Maksymalnie ${L.maxFlags} zaznaczonych fragmentów.`

  checkText(errors, 'result.title', config.result.title, L.resultTitle, 'Nagłówek')
  checkText(errors, 'result.body', config.result.body, L.resultBody, 'Podtytuł')
  for (const flag of config.flags) {
    checkText(errors, `flag.${flag.id}.title`, flag.title, L.flagTitle, 'Nazwa sygnału')
    checkText(errors, `flag.${flag.id}.explanation`, flag.explanation, L.explanation, 'Wyjaśnienie')
  }
  checkText(errors, 'conclusion.title', config.conclusion.title, L.conclusionTitle, 'Nagłówek')
  checkText(errors, 'conclusion.body', config.conclusion.body, L.conclusionBody, 'Treść wniosków')
  if (config.remember) {
    checkText(errors, 'remember.title', config.remember.title, L.rememberTitle, 'Tytuł karty')
    checkText(errors, 'remember.text', config.remember.text, L.rememberText, 'Treść karty')
  }
  return errors
}

const COUNT_WORDS: Record<number, string> = { 2: 'dwie', 3: 'trzy', 4: 'cztery', 5: 'pięć' }

/** Quiz hint under the question — shown only when more than one answer is correct. */
export function quizSelectionHint(correctCount: number): string | null {
  return correctCount > 1 ? `Możesz zaznaczyć maksymalnie ${COUNT_WORDS[correctCount] ?? correctCount} odpowiedzi` : null
}

// Quiz error keys: content `question`, `options`, `option.<id>.text`;
// interpretation `option.<id>.explanation`, `remember.*`
export const QUIZ_INTERPRETATION_KEY = /\.explanation$|^remember\./

function validateQuiz(config: ExerciseQuizConfig): ValidationErrors {
  const L = MODULE_LIMITS.quiz
  const errors: ValidationErrors = {}

  checkText(errors, 'instruction', config.instruction, L.instruction, 'Polecenie')
  checkText(errors, 'question', config.question, L.question, 'Treść pytania')
  if (config.options.length < L.minOptions || config.options.length > L.maxOptions) {
    errors.options = `Quiz musi mieć od ${L.minOptions} do ${L.maxOptions} odpowiedzi.`
  } else if (!config.options.some(o => o.is_correct)) {
    errors.options = 'Zaznacz co najmniej jedną prawidłową odpowiedź.'
  } else if (config.options.every(o => o.is_correct)) {
    errors.options = 'Co najmniej jedna odpowiedź musi być nieprawidłowa.'
  }
  for (const opt of config.options) {
    checkText(errors, `option.${opt.id}.text`, opt.text, L.option, 'Treść odpowiedzi')
    checkText(errors, `option.${opt.id}.explanation`, opt.explanation, L.explanation, 'Wyjaśnienie')
  }
  if (config.remember) {
    checkText(errors, 'remember.title', config.remember.title, L.rememberTitle, 'Tytuł karty')
    checkText(errors, 'remember.text', config.remember.text, L.rememberText, 'Treść karty')
  }
  return errors
}

export function validateView(view: ModuleView): ValidationErrors {
  switch (view.block_type) {
    case 'exercise-messenger':
      return validateMessenger(view.config)
    case 'knowledge-behavioral-contrast':
      return validateContrast(view.config)
    case 'exercise-poll':
      return validatePoll(view.config)
    case 'exercise-thought-record':
      return validateThoughtRecord(view.config)
    case 'exercise-i-message':
      return validateIMessage(view.config)
    case 'exercise-pattern-detector':
      return validatePatternDetector(view.config)
    case 'exercise-quiz':
      return validateQuiz(view.config)
  }
}

export type FlowIssue = { viewIndex: number; viewId: string; errors: ValidationErrors }

/** Full content validation (used before publishing). */
export function validateFlowContent(flow: ModuleFlowData): FlowIssue[] {
  return flow.views
    .map((view, viewIndex) => ({ viewIndex, viewId: view.id, errors: validateView(view) }))
    .filter(issue => Object.keys(issue.errors).length > 0)
}

const KNOWN_BLOCK_TYPES: readonly string[] = ['exercise-messenger', 'knowledge-behavioral-contrast', 'exercise-poll', 'exercise-thought-record', 'exercise-i-message', 'exercise-pattern-detector', 'exercise-quiz']

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

/** True when two flows have identical content (draft vs saved version). */
export function flowsEqual(a: ModuleFlowData, b: ModuleFlowData): boolean {
  return jsonEqual(a, b)
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
