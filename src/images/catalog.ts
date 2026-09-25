/** Original clipart ids shipped with the app. No network fetches. */
export const BOARD_IMAGE_IDS = [
  'cat',
  'ball',
  'sun',
  'flower',
  'fish',
  'star',
  'tree',
  'bird',
  'house',
  'car',
  'apple',
  'heart',
  'cloud',
  'moon',
  'butterfly',
  'boat',
] as const

export type DefaultBoardImageId = (typeof BOARD_IMAGE_IDS)[number]

/** Hanukkah drawings. A holiday pack replaces the default catalog with these. */
export const HANUKKAH_IMAGE_IDS = [
  'hanukkiah',
  'dreidel',
  'oil-jug',
  'sufganiyah',
  'candle',
  'gelt',
] as const

/** Purim drawings. Parallel to the default catalog, not mixed into it. */
export const PURIM_IMAGE_IDS = [
  'megillah',
  'gragger',
  'hamantasch',
  'mask',
  'crown',
  'mishloach',
] as const

export type HanukkahImageId = (typeof HANUKKAH_IMAGE_IDS)[number]
export type PurimImageId = (typeof PURIM_IMAGE_IDS)[number]
export type BoardImageId = DefaultBoardImageId | HanukkahImageId | PurimImageId

export const BOARD_IMAGE_LABELS: Record<DefaultBoardImageId, string> = {
  cat: 'חתול',
  ball: 'כדור',
  sun: 'שמש',
  flower: 'פרח',
  fish: 'דג',
  star: 'כוכב',
  tree: 'עץ',
  bird: 'ציפור',
  house: 'בית',
  car: 'מכונית',
  apple: 'תפוח',
  heart: 'לב',
  cloud: 'ענן',
  moon: 'ירח',
  butterfly: 'פרפר',
  boat: 'סירה',
}

export const HANUKKAH_IMAGE_LABELS: Record<HanukkahImageId, string> = {
  hanukkiah: 'חנוכייה',
  dreidel: 'סביבון',
  'oil-jug': 'פך שמן',
  sufganiyah: 'סופגנייה',
  candle: 'נר',
  gelt: 'מטבעות חנוכה',
}

export const PURIM_IMAGE_LABELS: Record<PurimImageId, string> = {
  megillah: 'מגילה',
  gragger: 'רעשן',
  hamantasch: 'אוזן המן',
  mask: 'מסכה',
  crown: 'כתר אסתר',
  mishloach: 'משלוח מנות',
}

const IMAGE_LABELS: Record<BoardImageId, string> = {
  ...BOARD_IMAGE_LABELS,
  ...HANUKKAH_IMAGE_LABELS,
  ...PURIM_IMAGE_LABELS,
}

export function boardImageLabel(id: BoardImageId): string {
  return IMAGE_LABELS[id]
}
