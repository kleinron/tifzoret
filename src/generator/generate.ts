import { KID_WORDS } from '../data/kidWords.ts'
import { directionsById, type Direction, type DirectionId } from './directions.ts'
import {
  filterBankWords,
  HEBREW_LETTERS,
  hasFinalLetter,
  MIN_WORD_LENGTH,
  parseWordList,
} from './hebrew.ts'
import { mulberry32, pickIndex, shuffle } from './rng.ts'
import {
  findWordOccurrences,
  isUniquePlacement,
  type Cell,
} from './verify.ts'

export type Placement = {
  word: string
  row: number
  col: number
  direction: DirectionId
  cells: Cell[]
}

export type GenerateRequest = {
  size: number
  userWords: readonly string[]
  directions: readonly DirectionId[]
  noFinalLetters: boolean
  randomAge10Fill: boolean
  seed?: number
  rng?: () => number
  maxPlacementAttempts?: number
  maxRepairAttempts?: number
  corpus?: readonly string[]
}

export type GenerateSuccess = {
  ok: true
  grid: string[][]
  words: string[]
  placements: Placement[]
  attempts: number
  extraWords: string[]
  skippedShort: string[]
  skippedFinals: string[]
  skippedContained: string[]
  skippedTooLong: string[]
}

export type GenerateFailure = {
  ok: false
  error: string
  errorHe: string
  skippedShort: string[]
  skippedFinals: string[]
  skippedContained: string[]
  skippedTooLong: string[]
}

export type GenerateResult = GenerateSuccess | GenerateFailure

const DEFAULT_MAX_PLACEMENT = 80
const DEFAULT_MAX_REPAIR = 180

function fail(
  error: string,
  errorHe: string,
  extras: Partial<GenerateFailure> = {},
): GenerateFailure {
  return {
    ok: false,
    error,
    errorHe,
    skippedShort: extras.skippedShort ?? [],
    skippedFinals: extras.skippedFinals ?? [],
    skippedContained: extras.skippedContained ?? [],
    skippedTooLong: extras.skippedTooLong ?? [],
  }
}

function extraWordTarget(size: number, existingCount: number): number {
  const target = Math.max(6, Math.round(size * 1.05))
  return Math.max(0, target - existingCount)
}

export function pickDiverseWords(
  corpus: readonly string[],
  options: {
    exclude: ReadonlySet<string>
    count: number
    gridSize: number
    noFinalLetters: boolean
    rng: () => number
  },
): string[] {
  const pool = corpus.filter((raw) => {
    if (options.exclude.has(raw)) return false
    if (raw.length < MIN_WORD_LENGTH || raw.length > options.gridSize) {
      return false
    }
    if (options.noFinalLetters && hasFinalLetter(raw)) return false
    for (const ex of options.exclude) {
      if (ex.includes(raw) || raw.includes(ex)) return false
    }
    return true
  })

  const shuffled = shuffle(pool, options.rng)
  const picked: string[] = []
  const usedFirst = new Set<string>()
  const usedLen = new Set<number>()

  const tryTake = (predicate: (w: string) => boolean) => {
    for (const word of shuffled) {
      if (picked.length >= options.count) return
      if (picked.includes(word)) continue
      if (!predicate(word)) continue
      if (picked.some((p) => p.includes(word) || word.includes(p))) continue
      picked.push(word)
      usedFirst.add(word[0]!)
      usedLen.add(word.length)
    }
  }

  tryTake((w) => !usedFirst.has(w[0]!))
  tryTake((w) => !usedLen.has(w.length))
  tryTake(() => true)
  return picked
}

type Slot = { row: number; col: number; direction: Direction }

function allSlots(
  size: number,
  wordLen: number,
  directions: readonly Direction[],
): Slot[] {
  const slots: Slot[] = []
  for (const direction of directions) {
    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        const endR = row + direction.dr * (wordLen - 1)
        const endC = col + direction.dc * (wordLen - 1)
        if (endR < 0 || endR >= size || endC < 0 || endC >= size) continue
        slots.push({ row, col, direction })
      }
    }
  }
  return slots
}

function canPlace(
  grid: (string | null)[][],
  word: string,
  slot: Slot,
): boolean {
  for (let i = 0; i < word.length; i++) {
    const r = slot.row + slot.direction.dr * i
    const c = slot.col + slot.direction.dc * i
    const existing = grid[r]![c]
    if (existing !== null && existing !== word[i]) return false
  }
  return true
}

function writeWord(grid: (string | null)[][], word: string, slot: Slot): Cell[] {
  const cells: Cell[] = []
  for (let i = 0; i < word.length; i++) {
    const r = slot.row + slot.direction.dr * i
    const c = slot.col + slot.direction.dc * i
    grid[r]![c] = word[i]!
    cells.push({ row: r, col: c })
  }
  return cells
}

function emptyGrid(size: number): (string | null)[][] {
  return Array.from({ length: size }, () => Array.from({ length: size }, () => null))
}

function placeWords(
  size: number,
  words: readonly string[],
  directions: readonly Direction[],
  rng: () => number,
): Placement[] | null {
  const grid = emptyGrid(size)
  const placements: Placement[] = []
  const ordered = words.slice().sort((a, b) => b.length - a.length)

  for (const word of ordered) {
    const slots = shuffle(allSlots(size, word.length, directions), rng)
    let placed: Placement | null = null
    for (const slot of slots) {
      if (!canPlace(grid, word, slot)) continue
      const cells = writeWord(grid, word, slot)
      placed = {
        word,
        row: slot.row,
        col: slot.col,
        direction: slot.direction.id,
        cells,
      }
      break
    }
    if (!placed) return null
    placements.push(placed)
  }

  return placements
}

function applyPlacements(
  size: number,
  placements: readonly Placement[],
): (string | null)[][] {
  const grid = emptyGrid(size)
  for (const p of placements) {
    for (let i = 0; i < p.word.length; i++) {
      const cell = p.cells[i]!
      grid[cell.row]![cell.col] = p.word[i]!
    }
  }
  return grid
}

function fillRandom(
  partial: (string | null)[][],
  alphabet: readonly string[],
  rng: () => number,
): string[][] {
  return partial.map((row) =>
    row.map((ch) => (ch === null ? alphabet[pickIndex(alphabet.length, rng)]! : ch)),
  )
}

function lockedCells(placements: readonly Placement[]): Set<string> {
  const locked = new Set<string>()
  for (const p of placements) {
    for (const cell of p.cells) {
      locked.add(`${cell.row},${cell.col}`)
    }
  }
  return locked
}

function repairUniqueness(
  grid: string[][],
  words: readonly string[],
  directions: readonly Direction[],
  alphabet: readonly string[],
  locked: Set<string>,
  rng: () => number,
  maxRepair: number,
): boolean {
  for (let i = 0; i < maxRepair; i++) {
    if (isUniquePlacement(grid, words, directions)) return true

    let mutated = false
    for (const word of words) {
      const found = findWordOccurrences(grid, word, directions)
      if (found.length <= 1) continue
      for (const occ of found.slice(1)) {
        const mutable = occ.cells.filter(
          (c) => !locked.has(`${c.row},${c.col}`),
        )
        if (mutable.length === 0) continue
        const cell = mutable[pickIndex(mutable.length, rng)]!
        const current = grid[cell.row]![cell.col]!
        let next = current
        let guard = 0
        while (next === current && guard < 12) {
          next = alphabet[pickIndex(alphabet.length, rng)]!
          guard += 1
        }
        grid[cell.row]![cell.col] = next
        mutated = true
      }
    }

    if (!mutated) return false
  }
  return isUniquePlacement(grid, words, directions)
}

export function generatePuzzle(request: GenerateRequest): GenerateResult {
  const size = request.size
  if (!Number.isInteger(size) || size < 8 || size > 20) {
    return fail(
      'Grid size must be between 8 and 20.',
      'גודל הרשת חייב להיות בין 8 ל־20.',
    )
  }

  const directionIds = request.directions
  const directions = directionsById(directionIds)
  if (directions.length === 0) {
    return fail(
      'Select at least one direction.',
      'יש לבחור לפחות כיוון אחד.',
    )
  }

  const parsed = parseWordList(request.userWords.join('\n'))
  const filtered = filterBankWords(parsed, {
    noFinalLetters: request.noFinalLetters,
    gridSize: size,
  })

  const skips = {
    skippedShort: filtered.skippedShort,
    skippedFinals: filtered.skippedFinals,
    skippedContained: filtered.skippedContained,
    skippedTooLong: filtered.skippedTooLong,
  }

  const rng = request.rng ?? mulberry32(request.seed ?? Date.now() >>> 0)
  const corpus = request.corpus ?? KID_WORDS
  const extraWords: string[] = []
  const bank = filtered.kept.slice()

  if (request.randomAge10Fill) {
    const extras = pickDiverseWords(corpus, {
      exclude: new Set(bank),
      count: extraWordTarget(size, bank.length),
      gridSize: size,
      noFinalLetters: request.noFinalLetters,
      rng,
    })
    extraWords.push(...extras)
    bank.push(...extras)
  }

  const uniqueBank = [...new Set(bank)]
  const again = filterBankWords(uniqueBank, {
    noFinalLetters: request.noFinalLetters,
    gridSize: size,
  })
  const words = again.kept
  skips.skippedContained = [
    ...new Set([...skips.skippedContained, ...again.skippedContained]),
  ]

  if (words.length === 0) {
    return fail(
      'No words to place. Add words or enable the age-10 filler.',
      'אין מילים לשיבוץ. הוסיפו מילים או הפעילו «השלם אקראי לגיל 10».',
      skips,
    )
  }

  const alphabet = HEBREW_LETTERS
  const maxPlacement = request.maxPlacementAttempts ?? DEFAULT_MAX_PLACEMENT
  const maxRepair = request.maxRepairAttempts ?? DEFAULT_MAX_REPAIR

  for (let attempt = 1; attempt <= maxPlacement; attempt++) {
    const placements = placeWords(size, words, directions, rng)
    if (!placements) continue

    const partial = applyPlacements(size, placements)
    const grid = fillRandom(partial, alphabet, rng)
    const locked = lockedCells(placements)

    if (
      !repairUniqueness(
        grid,
        words,
        directions,
        alphabet,
        locked,
        rng,
        maxRepair,
      )
    ) {
      continue
    }

    const sortedWords = words.slice().sort((a, b) => a.localeCompare(b, 'he'))
    return {
      ok: true,
      grid,
      words: sortedWords,
      placements,
      attempts: attempt,
      extraWords,
      ...skips,
    }
  }

  return fail(
    `Could not build a unique puzzle after ${maxPlacement} attempts.`,
    `לא הצלחנו ליצור תפזורת שבה כל מילה מופיעה פעם אחת בלבד אחרי ${maxPlacement} ניסיונות. נסו רשת גדולה יותר, פחות מילים, או פחות כיוונים.`,
    skips,
  )
}

export function lettersAlong(grid: string[][], cells: readonly Cell[]): string {
  return cells.map((c) => grid[c.row]![c.col]!).join('')
}
