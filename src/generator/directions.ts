export const DIRECTION_IDS = [
  'rtl',
  'ttb',
  'btt',
  'ltr',
  'trbl',
  'tlbr',
  'brtl',
  'bltr',
] as const

export type DirectionId = (typeof DIRECTION_IDS)[number]

export type Direction = {
  id: DirectionId
  dr: number
  dc: number
  label: string
  hint: string
}

/** Grid origin is top-left; column increases to the right. */
export const DIRECTIONS: readonly Direction[] = [
  { id: 'rtl', dr: 0, dc: -1, label: 'מימין לשמאל', hint: 'ימין ← שמאל' },
  { id: 'ttb', dr: 1, dc: 0, label: 'מלמעלה למטה', hint: 'למעלה ← למטה' },
  { id: 'btt', dr: -1, dc: 0, label: 'מלמטה למעלה', hint: 'למטה ← למעלה' },
  { id: 'ltr', dr: 0, dc: 1, label: 'משמאל לימין', hint: 'שמאל ← ימין' },
  {
    id: 'trbl',
    dr: 1,
    dc: -1,
    label: 'מימין-מעלה לשמאל-מטה',
    hint: 'אלכסון ↙',
  },
  {
    id: 'tlbr',
    dr: 1,
    dc: 1,
    label: 'משמאל-מעלה לימין-מטה',
    hint: 'אלכסון ↘',
  },
  {
    id: 'brtl',
    dr: -1,
    dc: -1,
    label: 'מימין-מטה לשמאל-מעלה',
    hint: 'אלכסון ↖',
  },
  {
    id: 'bltr',
    dr: -1,
    dc: 1,
    label: 'משמאל-מטה לימין-מעלה',
    hint: 'אלכסון ↗',
  },
]

export const DEFAULT_DIRECTION_IDS: readonly DirectionId[] = ['rtl', 'ttb', 'trbl']

/**
 * Visual arrow for a placement vector.
 * Grid row grows downward and column grows to the right, so the glyph
 * points the way a word is read. These arrows are not bidi-mirrored.
 */
export function directionArrow(dr: number, dc: number): string {
  if (dr === -1 && dc === -1) return '↖'
  if (dr === -1 && dc === 0) return '↑'
  if (dr === -1 && dc === 1) return '↗'
  if (dr === 0 && dc === -1) return '←'
  if (dr === 0 && dc === 1) return '→'
  if (dr === 1 && dc === -1) return '↙'
  if (dr === 1 && dc === 0) return '↓'
  if (dr === 1 && dc === 1) return '↘'
  throw new Error(`Unsupported direction vector ${dr},${dc}`)
}

export function directionsById(
  ids: readonly DirectionId[],
): Direction[] {
  const set = new Set(ids)
  return DIRECTIONS.filter((d) => set.has(d.id))
}
