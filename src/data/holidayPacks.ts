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
    words: [],
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
 * חנוכה and פורים replace the word bank with that pack’s words only.
 * Words from the previous pack and from manual edits are dropped.
 * «רגיל» restores the default checkbox and catalog, and leaves the bank as it is.
 */
export function applyHolidayPack(
  current: { bank: readonly string[] },
  packId: HolidayPackId,
): AppliedHolidayPack {
  const pack = holidayPackById(packId)
  return {
    packId,
    bank: packId === 'regular' ? [...current.bank] : [...pack.words],
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
