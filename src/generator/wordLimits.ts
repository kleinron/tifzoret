import { MAX_WORD_LENGTH, MIN_WORD_LENGTH, parseWordList } from './hebrew.ts'

export { MAX_WORD_LENGTH }

/** Hard cap on how many words may sit in the user bank. */
export const MAX_BANK_WORDS = 50

export const MAX_GRID_SIZE = 20
export const MIN_GRID_SIZE = 8

/** Board side when the visitor has not chosen one and no share link set it. */
export const DEFAULT_GRID_SIZE = 12

/**
 * Cells added to each side of a square that could hold the letters.
 * With this margin, חנוכה merged onto the default bank is a 12×12 board,
 * which generated reliably in a 24-seed sweep.
 */
const GRID_SIDE_MARGIN = 2

export type WordIntakeResult = {
  accepted: string[]
  nextBank: string[]
  remaining: string[]
  tooLong: string[]
  tooLongForGrid: string[]
  overCapacity: string[]
}

export type ValidationTone = 'danger' | 'warning'

export type FieldIssue = {
  tone: ValidationTone
  message: string
  growTo?: number
}

export type EditorValidation = WordIntakeResult & {
  issues: FieldIssue[]
  messages: string[]
  growTo: number | null
  inputValid: boolean
  canAdd: boolean
}

function uniqueKeepOrder(words: readonly string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const word of words) {
    if (seen.has(word)) continue
    seen.add(word)
    out.push(word)
  }
  return out
}

export function messageTooLong(): string {
  return `עד ${MAX_WORD_LENGTH} אותיות`
}

export function messageTooLongForGrid(gridSize: number): string {
  return `המילה ארוכה מהלוח (${gridSize}×${gridSize})`
}

export function messageBankFull(): string {
  return `עד ${MAX_BANK_WORDS} מילים במחסן`
}

export function messageRandomFillCapped(): string {
  return `השלמה אקראית הופסקה במקסימום ${MAX_BANK_WORDS} מילים במחסן.`
}

/** Setting name. Fill runs when a puzzle is built, not as its own action. */
export const AGE10_FILL_LABEL = 'מילוי אוטומטי'

export function growBoardCtaLabel(size: number): string {
  return `הגדל לוח ל־${size}`
}

export function suggestedGridSizeForWords(
  words: readonly string[],
  gridSize: number,
): number | null {
  let needed: number | null = null
  for (const word of words) {
    if (word.length > gridSize && word.length <= MAX_WORD_LENGTH) {
      needed = needed === null ? word.length : Math.max(needed, word.length)
    }
  }
  return needed
}

function clampGridSize(value: number): number {
  return Math.min(MAX_GRID_SIZE, Math.max(MIN_GRID_SIZE, Math.round(value)))
}

/**
 * Board side for the words a puzzle will try to place.
 * Two-letter words are ignored, same as the generator. The side is a
 * square of those letters plus {@link GRID_SIDE_MARGIN}, and at least
 * the longest word, then clamped to the size slider.
 */
export function gridSizeForWords(words: readonly string[]): number {
  let letters = 0
  let longest = 0
  let count = 0
  for (const word of words) {
    if (word.length < MIN_WORD_LENGTH || word.length > MAX_WORD_LENGTH) continue
    letters += word.length
    if (word.length > longest) longest = word.length
    count += 1
  }
  if (count === 0) return DEFAULT_GRID_SIZE
  const side = Math.ceil(Math.sqrt(letters) + GRID_SIDE_MARGIN)
  return clampGridSize(Math.max(longest, side))
}

/**
 * Decide which incoming words may join the bank.
 * Words longer than the grid (but ≤16) are held back so a grow-board CTA can retry them.
 */
export function planWordIntake(
  bank: readonly string[],
  incoming: readonly string[],
  gridSize: number,
): WordIntakeResult {
  const seen = new Set(bank)
  const accepted: string[] = []
  const tooLong: string[] = []
  const tooLongForGrid: string[] = []
  const overCapacity: string[] = []

  for (const word of uniqueKeepOrder(incoming)) {
    if (seen.has(word)) continue
    if (word.length > MAX_WORD_LENGTH) {
      tooLong.push(word)
      continue
    }
    if (word.length > gridSize) {
      tooLongForGrid.push(word)
      continue
    }
    if (bank.length + accepted.length >= MAX_BANK_WORDS) {
      overCapacity.push(word)
      continue
    }
    seen.add(word)
    accepted.push(word)
  }

  return {
    accepted,
    nextBank: [...bank, ...accepted],
    remaining: [...tooLong, ...tooLongForGrid, ...overCapacity],
    tooLong,
    tooLongForGrid,
    overCapacity,
  }
}

export function editorValidation(
  bank: readonly string[],
  draft: string,
  gridSize: number,
): EditorValidation {
  const incoming = parseWordList(draft)
  const intake = planWordIntake(bank, incoming, gridSize)
  const bankTooLong = bank.filter((w) => w.length > MAX_WORD_LENGTH)
  const bankTooLongForGrid = bank.filter(
    (w) => w.length > gridSize && w.length <= MAX_WORD_LENGTH,
  )

  const issues: FieldIssue[] = []
  const allTooLong = uniqueKeepOrder([...bankTooLong, ...intake.tooLong])
  if (allTooLong.length) {
    issues.push({ tone: 'danger', message: messageTooLong() })
  }

  const allTooLongForGrid = uniqueKeepOrder([
    ...bankTooLongForGrid,
    ...intake.tooLongForGrid,
  ])
  const growTo = suggestedGridSizeForWords(allTooLongForGrid, gridSize)
  if (allTooLongForGrid.length) {
    issues.push({
      tone: 'warning',
      message: messageTooLongForGrid(gridSize),
      growTo: growTo ?? undefined,
    })
  }

  if (intake.overCapacity.length) {
    issues.push({ tone: 'danger', message: messageBankFull() })
  }

  const inputValid = issues.length === 0
  const canAdd = inputValid && intake.accepted.length > 0

  return {
    ...intake,
    issues,
    messages: issues.map((issue) => issue.message),
    growTo,
    inputValid,
    canAdd,
  }
}

export function capBankWords(
  words: readonly string[],
  max: number = MAX_BANK_WORDS,
): { kept: string[]; skippedOverCapacity: string[] } {
  if (words.length <= max) return { kept: [...words], skippedOverCapacity: [] }
  return {
    kept: words.slice(0, max),
    skippedOverCapacity: words.slice(max),
  }
}

/** How many age-10 extras to request, never crossing the bank cap. */
export function extraFillCount(size: number, existingCount: number): number {
  const densityTarget = Math.max(6, Math.round(size * 1.05))
  const desired = Math.max(0, densityTarget - existingCount)
  const room = Math.max(0, MAX_BANK_WORDS - existingCount)
  return Math.min(desired, room)
}

/** Hint under the age-10 toggle. K is extraFillCount; idle when nothing would be added. */
export function age10FillHint(gridSize: number, existingCount: number): string {
  const extra = extraFillCount(gridSize, existingCount)
  if (extra <= 0) return 'כבר ביעד ללוח הזה — לא יתווספו מילים'
  return `יוסיף עוד ${extra} מילים`
}

export function formatRemainingDraft(words: readonly string[]): string {
  return words.join('\n')
}

/** True when pasted text looks like a list rather than a single in-progress word. */
export function looksLikeWordList(text: string): boolean {
  if (/[\n\r,;]/.test(text)) return true
  return parseWordList(text).length > 1
}
