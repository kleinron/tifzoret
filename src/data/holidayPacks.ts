import { hasFinalLetter } from '../generator/hebrew.ts'
import {
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

/** Built-in word bank for «רגיל» when no earlier regular state was saved. */
export const REGULAR_BANK = [
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
    words: REGULAR_BANK,
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
}

/**
 * State the chip switch reads.
 * `fromPackId: 'regular'` means «רגיל» is already selected, so the current
 * bank and final-letter checkbox stay. Any other origin restores the
 * built-in regular pack.
 */
export type HolidaySwitchState = {
  bank: readonly string[]
  fromPackId?: HolidayPackId
  noFinals?: boolean
}

/**
 * חנוכה and פורים replace the word bank with that pack’s words only.
 * Words from the previous pack and from manual edits are dropped.
 * «רגיל» restores the built-in regular state: the default word bank,
 * the default drawing catalog, and the default final-letter checkbox.
 * Applying «רגיל» while it is already selected keeps the current bank.
 */
export function applyHolidayPack(
  current: HolidaySwitchState,
  packId: HolidayPackId,
): AppliedHolidayPack {
  const pack = holidayPackById(packId)
  if (packId !== 'regular') {
    return {
      packId,
      bank: [...pack.words],
      noFinals: pack.noFinals,
      imageIds: pack.imageIds,
    }
  }
  if (current.fromPackId === 'regular') {
    return {
      packId,
      bank: [...current.bank],
      noFinals: current.noFinals ?? pack.noFinals,
      imageIds: pack.imageIds,
    }
  }
  return {
    packId,
    bank: [...pack.words],
    noFinals: pack.noFinals,
    imageIds: pack.imageIds,
  }
}

/**
 * Board side after a holiday chip.
 * חנוכה and פורים size from the replaced bank (that pack’s words only).
 * The side rises to the same word target automatic fill already uses,
 * and to the «הגדל לוח» size when a word is longer than the current board.
 * It never goes down. «רגיל» leaves the side as it is.
 */
export function gridSizeAfterHolidayPack(input: {
  packId: HolidayPackId
  bank: readonly string[]
  currentGrid: number
}): number {
  if (input.packId === 'regular') return input.currentGrid
  const forCount = gridSizeForWordCount(input.bank.length)
  const forLength = suggestedGridSizeForWords(input.bank, input.currentGrid) ?? 0
  return Math.max(input.currentGrid, forCount, forLength)
}
