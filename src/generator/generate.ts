import { KID_WORDS } from '../data/kidWords.ts'
import { directionsById, type Direction, type DirectionId } from './directions.ts'
import {
  filterBankWords,
  HEBREW_LETTERS,
  hasFinalLetter,
  MAX_WORD_LENGTH,
  MIN_WORD_LENGTH,
  parseWordList,
} from './hebrew.ts'
import {
  capBankWords,
  AGE10_FILL_LABEL,
  extraFillCount,
  MAX_BANK_WORDS,
} from './wordLimits.ts'
import {
  BLOCKED_CELL,
  blockedCellKeys,
  IMAGE_BLOCK_SIZE,
  imagePlacementErrorHe,
  keptImageBlocks,
  maxImageBlocks,
  resolveImageBlocks,
  type ImageBlock,
  type ImagePolicy,
} from './imageBlocks.ts'
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
  /**
   * How many 4×4 pictures to block out. Omitted means 0 so older callers
   * stay letter-only. The app setting defaults to 1.
   */
  imageCount?: number
  /**
   * What to do with {@link pinnedImageBlocks}. Omitted means `roll`: place
   * `imageCount` new pictures, same as before pictures could be pinned.
   */
  imagePolicy?: ImagePolicy
  /**
   * Pictures already on the board. `keep` reuses them when they still fit.
   * `adapt` keeps what it can and fills up to `imageCount`.
   */
  pinnedImageBlocks?: readonly ImageBlock[]
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
  imageBlocks: ImageBlock[]
  attempts: number
  extraWords: string[]
  skippedShort: string[]
  skippedFinals: string[]
  skippedContained: string[]
  skippedTooLong: string[]
  skippedMaxLength: string[]
  skippedOverCapacity: string[]
  fillCappedAtMax: boolean
}

export type GenerateFailure = {
  ok: false
  error: string
  errorHe: string
  skippedShort: string[]
  skippedFinals: string[]
  skippedContained: string[]
  skippedTooLong: string[]
  skippedMaxLength: string[]
  skippedOverCapacity: string[]
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
    skippedMaxLength: extras.skippedMaxLength ?? [],
    skippedOverCapacity: extras.skippedOverCapacity ?? [],
  }
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
    if (
      raw.length < MIN_WORD_LENGTH ||
      raw.length > options.gridSize ||
      raw.length > MAX_WORD_LENGTH
    ) {
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
  blocked: ReadonlySet<string>,
): boolean {
  for (let i = 0; i < word.length; i++) {
    const r = slot.row + slot.direction.dr * i
    const c = slot.col + slot.direction.dc * i
    if (blocked.has(`${r},${c}`)) return false
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
  blocked: ReadonlySet<string>,
): Placement[] | null {
  const grid = emptyGrid(size)
  const placements: Placement[] = []
  const ordered = words.slice().sort((a, b) => b.length - a.length)

  for (const word of ordered) {
    const slots = shuffle(allSlots(size, word.length, directions), rng)
    let placed: Placement | null = null
    for (const slot of slots) {
      if (!canPlace(grid, word, slot, blocked)) continue
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

function lockedCells(
  placements: readonly Placement[],
  blocked: ReadonlySet<string>,
): Set<string> {
  const locked = new Set<string>(blocked)
  for (const p of placements) {
    for (const cell of p.cells) {
      locked.add(`${cell.row},${cell.col}`)
    }
  }
  return locked
}

function stampBlocked(
  grid: (string | null)[][],
  blocks: readonly ImageBlock[],
): void {
  for (const block of blocks) {
    for (let row = 0; row < IMAGE_BLOCK_SIZE; row++) {
      for (let col = 0; col < IMAGE_BLOCK_SIZE; col++) {
        grid[block.row + row]![block.col + col] = BLOCKED_CELL
      }
    }
  }
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
        if (current === BLOCKED_CELL) continue
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

  const policy: ImagePolicy = request.imagePolicy ?? 'roll'
  const pinned = request.pinnedImageBlocks ?? []
  // A legal keep is fixed for every attempt and does not draw from `rng`.
  const kept = policy === 'keep' ? keptImageBlocks(size, pinned) : null
  const imageCount = kept ? kept.length : (request.imageCount ?? 0)
  const fallbackPolicy: ImagePolicy =
    policy === 'keep' ? (pinned.length > 0 ? 'adapt' : 'roll') : policy
  if (!Number.isInteger(imageCount) || imageCount < 0) {
    return fail(
      'Image count must be zero or more.',
      'מספר התמונות חייב להיות אפס או יותר.',
    )
  }
  if (imageCount > maxImageBlocks(size)) {
    return fail(
      `Could not place ${imageCount} 4×4 image blocks without a shared edge on a ${size}×${size} grid.`,
      imagePlacementErrorHe(imageCount, size),
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

  const capped = capBankWords(filtered.kept)
  const skips = {
    skippedShort: filtered.skippedShort,
    skippedFinals: filtered.skippedFinals,
    skippedContained: filtered.skippedContained,
    skippedTooLong: filtered.skippedTooLong,
    skippedMaxLength: filtered.skippedMaxLength,
    skippedOverCapacity: capped.skippedOverCapacity,
  }

  const rng = request.rng ?? mulberry32(request.seed ?? Date.now() >>> 0)
  const corpus = request.corpus ?? KID_WORDS
  const extraWords: string[] = []
  const bank = capped.kept.slice()
  const fillCappedAtMax =
    Boolean(request.randomAge10Fill) && bank.length >= MAX_BANK_WORDS

  if (request.randomAge10Fill) {
    const extras = pickDiverseWords(corpus, {
      exclude: new Set(bank),
      count: extraFillCount(size, bank.length),
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
  const limited = capBankWords(again.kept)
  const words = limited.kept
  skips.skippedContained = [
    ...new Set([...skips.skippedContained, ...again.skippedContained]),
  ]
  skips.skippedOverCapacity = [
    ...new Set([...skips.skippedOverCapacity, ...limited.skippedOverCapacity]),
  ]

  if (words.length === 0) {
    return fail(
      'No words to place. Add words or enable automatic fill.',
      `אין מילים לשיבוץ. הוסיפו מילים או הפעילו «${AGE10_FILL_LABEL}».`,
      skips,
    )
  }

  const freeCells = size * size - imageCount * IMAGE_BLOCK_SIZE * IMAGE_BLOCK_SIZE
  const shortest = words.reduce((min, word) => Math.min(min, word.length), words[0]!.length)
  if (freeCells < shortest) {
    return fail(
      'Not enough open cells left for the words once the pictures are placed.',
      'אין מספיק משבצות פנויות למילים אחרי התמונות. הקטינו את מספר התמונות או הגדילו את הלוח.',
      skips,
    )
  }

  const alphabet = HEBREW_LETTERS
  const maxPlacement = request.maxPlacementAttempts ?? DEFAULT_MAX_PLACEMENT
  const maxRepair = request.maxRepairAttempts ?? DEFAULT_MAX_REPAIR

  for (let attempt = 1; attempt <= maxPlacement; attempt++) {
    const blocks =
      kept ??
      resolveImageBlocks(size, imageCount, rng, {
        policy: fallbackPolicy,
        existing: pinned,
      })
    if (!blocks) {
      return fail(
        `Could not place ${imageCount} 4×4 image blocks without a shared edge on a ${size}×${size} grid.`,
        imagePlacementErrorHe(imageCount, size),
        skips,
      )
    }

    const blocked = blockedCellKeys(blocks)
    const placements = placeWords(size, words, directions, rng, blocked)
    if (!placements) continue

    const partial = applyPlacements(size, placements)
    stampBlocked(partial, blocks)
    const grid = fillRandom(partial, alphabet, rng)
    const locked = lockedCells(placements, blocked)

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
      imageBlocks: blocks,
      attempts: attempt,
      extraWords,
      fillCappedAtMax,
      ...skips,
    }
  }

  const retryHint =
    imageCount > 0
      ? 'נסו רשת גדולה יותר, פחות מילים, פחות כיוונים, או פחות תמונות.'
      : 'נסו רשת גדולה יותר, פחות מילים, או פחות כיוונים.'
  return fail(
    `Could not build a unique puzzle after ${maxPlacement} attempts.`,
    `לא הצלחנו ליצור תפזורת שבה כל מילה מופיעה פעם אחת בלבד אחרי ${maxPlacement} ניסיונות. ${retryHint}`,
    skips,
  )
}

export function lettersAlong(grid: string[][], cells: readonly Cell[]): string {
  return cells.map((c) => grid[c.row]![c.col]!).join('')
}
