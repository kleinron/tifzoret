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
}

export function boardImageLabel(id: BoardImageId): string {
  return BOARD_IMAGE_LABELS[id]
}
