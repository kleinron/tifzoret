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

export type BoardImageId = (typeof BOARD_IMAGE_IDS)[number]

export const BOARD_IMAGE_LABELS: Record<BoardImageId, string> = {
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

export function boardImageLabel(id: BoardImageId): string {
  return BOARD_IMAGE_LABELS[id]
}
