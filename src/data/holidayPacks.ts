import { hasFinalLetter } from '../generator/hebrew.ts'
import {
  DEFAULT_GRID_SIZE,
  gridSizeForWordCount,
  suggestedGridSizeForWords,
} from '../generator/wordLimits.ts'
import {
  BOARD_IMAGE_IDS,
  HANUKKAH_IMAGE_IDS,
  PURIM_IMAGE_IDS,
  type BoardImageId,
} from '../images/catalog.ts'

/** App default for «ללא אותיות סופיות»: finals stay in the puzzle. */
export const DEFAULT_NO_FINALS = false

/** Built-in word bank for «רגיל» when no regular snapshot was saved. */
export const DEFAULT_BANK = [
  'שמש',
  'ירח',
  'כוכב',
  'פרח',
  'ספר',
  'כדור',
  'חתול',
  'מים',
  'שלום',
  'בית',
] as const

export const REGULAR_BANK = DEFAULT_BANK

export const HOLIDAY_PACK_IDS = ['regular', 'hanukkah', 'purim'] as const

export type HolidayPackId = (typeof HOLIDAY_PACK_IDS)[number]

/**
 * «גדול היה פה» is three words. «פך» is a drawing, not a word.
 * «נס» and «פה» are two letters; the generator still skips words under three
 * letters, and they remain in the bank.
 */
export const HANUKKAH_WORDS = [
  'חנוכה',
  'סביבון',
  'סופגנייה',
  'לביבה',
  'חנוכייה',
  'נרות',
  'שמן',
  'נס',
  'אור',
  'מטבעות',
  'הלל',
  'גדול',
  'היה',
  'פה',
] as const

/** No «אוזן» and no «כתר» — those motifs are drawings only. */
export const PURIM_WORDS = [
  'פורים',
  'אסתר',
  'מרדכי',
  'המן',
  'מגילה',
  'רעשן',
  'משלוח',
  'מנות',
  'תחפושת',
  'מסכה',
  'ויזתא',
] as const

/**
 * A pack that needs a final letter must leave «ללא אותיות סופיות» unchecked.
 * A pack with no final letters keeps the app default.
 */
export function noFinalsForPackWords(words: readonly string[]): boolean {
  if (words.some((word) => hasFinalLetter(word))) return false
  return DEFAULT_NO_FINALS
}

export type HolidayPack = {
  id: HolidayPackId
  label: string
  words: readonly string[]
  imageIds: readonly BoardImageId[]
  noFinals: boolean
}

export const HOLIDAY_PACKS: readonly HolidayPack[] = [
  {
    id: 'regular',
    label: 'רגיל',
    words: DEFAULT_BANK,
    imageIds: BOARD_IMAGE_IDS,
    noFinals: DEFAULT_NO_FINALS,
  },
  {
    id: 'hanukkah',
    label: 'חנוכה',
    words: HANUKKAH_WORDS,
    imageIds: HANUKKAH_IMAGE_IDS,
    noFinals: noFinalsForPackWords(HANUKKAH_WORDS),
  },
  {
    id: 'purim',
    label: 'פורים',
    words: PURIM_WORDS,
    imageIds: PURIM_IMAGE_IDS,
    noFinals: noFinalsForPackWords(PURIM_WORDS),
  },
]

export function holidayPackById(id: HolidayPackId): HolidayPack {
  const pack = HOLIDAY_PACKS.find((item) => item.id === id)
  if (!pack) throw new Error(`Unknown holiday pack ${id}`)
  return pack
}

export type AppliedHolidayPack = {
  packId: HolidayPackId
  bank: string[]
  noFinals: boolean
  imageIds: readonly BoardImageId[]
  /** Kept while a holiday pack is active. Cleared once «רגיל» restores it. */
  regularSnapshot: RegularSnapshot | null
  /**
   * Board side to apply. Set for «רגיל»: the saved side, or 12 when there
   * is no snapshot. Omitted for a holiday chip; that side is computed apart.
   */
  gridSize?: number
}

/** Regular bank, board side, final-letter checkbox, and picture catalog. */
export type RegularSnapshot = {
  bank: readonly string[]
  gridSize: number
  noFinals: boolean
  imageIds: readonly BoardImageId[]
}

/**
 * State the chip switch reads.
 * Leaving «רגיל» (`fromPackId: 'regular'`) saves a snapshot.
 * «רגיל» restores that snapshot. With no snapshot, it uses the built-in
 * defaults. Applying «רגיל» while it is already selected keeps the current bank.
 */
export type HolidaySwitchState = {
  bank: readonly string[]
  fromPackId?: HolidayPackId
  noFinals?: boolean
  gridSize?: number
  imageIds?: readonly BoardImageId[]
  regularSnapshot?: RegularSnapshot | null
}

function copySnapshot(snapshot: RegularSnapshot): RegularSnapshot {
  return {
    bank: [...snapshot.bank],
    gridSize: snapshot.gridSize,
    noFinals: snapshot.noFinals,
    imageIds: [...snapshot.imageIds],
  }
}

function snapshotFrom(current: HolidaySwitchState): RegularSnapshot {
  return copySnapshot({
    bank: current.bank,
    gridSize: current.gridSize ?? DEFAULT_GRID_SIZE,
    noFinals: current.noFinals ?? DEFAULT_NO_FINALS,
    imageIds: current.imageIds ?? BOARD_IMAGE_IDS,
  })
}

/**
 * חנוכה and פורים replace the word bank with that pack’s words only.
 * Words from the previous pack and from manual edits are dropped.
 * Leaving «רגיל» saves the regular bank, board side, final-letter checkbox,
 * and picture catalog. «רגיל» restores that snapshot.
 * With no snapshot (regular was never left, or this is a first load),
 * «רגיל» uses the built-in defaults: DEFAULT_BANK, side 12, default sofit,
 * and the default catalog.
 * Applying «רגיל» while it is already selected keeps the current bank.
 */
export function applyHolidayPack(
  current: HolidaySwitchState,
  packId: HolidayPackId,
): AppliedHolidayPack {
  const pack = holidayPackById(packId)
  const fromPackId = current.fromPackId

  if (packId !== 'regular') {
    const leavingRegular = fromPackId === 'regular' || fromPackId === undefined
    return {
      packId,
      bank: [...pack.words],
      noFinals: pack.noFinals,
      imageIds: pack.imageIds,
      regularSnapshot: leavingRegular
        ? snapshotFrom(current)
        : current.regularSnapshot
          ? copySnapshot(current.regularSnapshot)
          : null,
    }
  }

  if (fromPackId === 'regular' && !current.regularSnapshot) {
    return {
      packId,
      bank: [...current.bank],
      noFinals: current.noFinals ?? pack.noFinals,
      imageIds: current.imageIds ?? pack.imageIds,
      regularSnapshot: null,
      ...(current.gridSize !== undefined ? { gridSize: current.gridSize } : {}),
    }
  }

  if (current.regularSnapshot) {
    const saved = copySnapshot(current.regularSnapshot)
    return {
      packId,
      bank: [...saved.bank],
      noFinals: saved.noFinals,
      imageIds: [...saved.imageIds],
      regularSnapshot: null,
      gridSize: saved.gridSize,
    }
  }

  return {
    packId,
    bank: [...DEFAULT_BANK],
    noFinals: DEFAULT_NO_FINALS,
    imageIds: [...BOARD_IMAGE_IDS],
    regularSnapshot: null,
    gridSize: DEFAULT_GRID_SIZE,
  }
}

/**
 * Board side after a holiday chip.
 * חנוכה and פורים size from the replaced bank (that pack’s words only).
 * The side rises to the same word target automatic fill already uses,
 * and to the «הגדל לוח» size when a word is longer than the current board.
 * It never goes down.
 * «רגיל» returns to the saved regular side, or to 12 when no snapshot exists.
 * It does not keep a side the holiday enlarged.
 */
export function gridSizeAfterHolidayPack(input: {
  packId: HolidayPackId
  bank: readonly string[]
  currentGrid: number
  restoredGrid?: number
}): number {
  if (input.packId === 'regular') return input.restoredGrid ?? DEFAULT_GRID_SIZE
  const forCount = gridSizeForWordCount(input.bank.length)
  const forLength = suggestedGridSizeForWords(input.bank, input.currentGrid) ?? 0
  return Math.max(input.currentGrid, forCount, forLength)
}
