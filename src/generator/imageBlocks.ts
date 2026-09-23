import {
  BOARD_IMAGE_IDS,
  type BoardImageId,
} from '../images/catalog.ts'
import { pickIndex, shuffle } from './rng.ts'

/** Each picture covers a square of this many cells on a side. */
export const IMAGE_BLOCK_SIZE = 4

/** App default when the visitor did not open a share link. */
export const DEFAULT_IMAGE_COUNT = 1

/**
 * Grid cell covered by a picture. Not a Hebrew letter, so word search
 * skips any span that enters it.
 */
export const BLOCKED_CELL = '\u0000'

export type ImageBlock = {
  imageId: BoardImageId
  row: number
  col: number
}

/** How many non-overlapping 4×4 blocks fit on an n×n board. */
export function maxImageBlocks(gridSize: number): number {
  if (!Number.isFinite(gridSize) || gridSize < IMAGE_BLOCK_SIZE) return 0
  const across = Math.floor(gridSize / IMAGE_BLOCK_SIZE)
  return across * across
}

export function clampImageCount(count: number, gridSize: number): number {
  const max = maxImageBlocks(gridSize)
  if (!Number.isFinite(count)) return Math.min(DEFAULT_IMAGE_COUNT, max)
  return Math.min(max, Math.max(0, Math.round(count)))
}

export function imagePlacementErrorHe(count: number, gridSize: number): string {
  const max = maxImageBlocks(gridSize)
  return `לא הצלחנו למקם ${count} תמונות של 4×4 בלי חפיפה על לוח ${gridSize}×${gridSize}. אפשר לכל היותר ${max}.`
}

export function imageBlockCells(block: {
  row: number
  col: number
}): { row: number; col: number }[] {
  const cells: { row: number; col: number }[] = []
  for (let row = 0; row < IMAGE_BLOCK_SIZE; row++) {
    for (let col = 0; col < IMAGE_BLOCK_SIZE; col++) {
      cells.push({ row: block.row + row, col: block.col + col })
    }
  }
  return cells
}

export function blockedCellKeys(
  blocks: readonly { row: number; col: number }[],
): Set<string> {
  const keys = new Set<string>()
  for (const block of blocks) {
    for (const cell of imageBlockCells(block)) {
      keys.add(`${cell.row},${cell.col}`)
    }
  }
  return keys
}

export function imageBlocksOverlap(
  a: { row: number; col: number },
  b: { row: number; col: number },
): boolean {
  return (
    a.row < b.row + IMAGE_BLOCK_SIZE &&
    b.row < a.row + IMAGE_BLOCK_SIZE &&
    a.col < b.col + IMAGE_BLOCK_SIZE &&
    b.col < a.col + IMAGE_BLOCK_SIZE
  )
}

function originFits(size: number, row: number, col: number): boolean {
  return (
    row >= 0 &&
    col >= 0 &&
    row + IMAGE_BLOCK_SIZE <= size &&
    col + IMAGE_BLOCK_SIZE <= size
  )
}

function allOrigins(size: number): { row: number; col: number }[] {
  const max = size - IMAGE_BLOCK_SIZE
  const origins: { row: number; col: number }[] = []
  for (let row = 0; row <= max; row++) {
    for (let col = 0; col <= max; col++) {
      origins.push({ row, col })
    }
  }
  return origins
}

/**
 * Guaranteed packing: a shifted lattice of floor(n/4) by floor(n/4).
 * Used when a random greedy pass cannot seat every block.
 */
function latticeOrigins(
  size: number,
  count: number,
  rng: () => number,
): { row: number; col: number }[] | null {
  const across = Math.floor(size / IMAGE_BLOCK_SIZE)
  if (across * across < count) return null
  const slack = size - across * IMAGE_BLOCK_SIZE
  const offsetRow = slack === 0 ? 0 : pickIndex(slack + 1, rng)
  const offsetCol = slack === 0 ? 0 : pickIndex(slack + 1, rng)
  const origins: { row: number; col: number }[] = []
  for (let row = 0; row < across; row++) {
    for (let col = 0; col < across; col++) {
      origins.push({
        row: offsetRow + row * IMAGE_BLOCK_SIZE,
        col: offsetCol + col * IMAGE_BLOCK_SIZE,
      })
    }
  }
  return shuffle(origins, rng).slice(0, count)
}

const GREEDY_TRIES = 32

function randomOrigins(
  size: number,
  count: number,
  rng: () => number,
): { row: number; col: number }[] | null {
  const pool = allOrigins(size)
  for (let attempt = 0; attempt < GREEDY_TRIES; attempt++) {
    const shuffled = shuffle(pool, rng)
    const placed: { row: number; col: number }[] = []
    for (const origin of shuffled) {
      if (placed.some((block) => imageBlocksOverlap(block, origin))) continue
      placed.push(origin)
      if (placed.length === count) return placed
    }
  }
  return latticeOrigins(size, count, rng)
}

function pickImages(
  count: number,
  rng: () => number,
  ids: readonly BoardImageId[],
): BoardImageId[] {
  const picked: BoardImageId[] = []
  let bag: BoardImageId[] = []
  while (picked.length < count) {
    if (bag.length === 0) {
      bag = shuffle(ids, rng)
      const prev = picked[picked.length - 1]
      if (prev !== undefined && bag.length > 1 && bag[bag.length - 1] === prev) {
        const last = bag.pop()!
        bag.unshift(last)
      }
    }
    picked.push(bag.pop()!)
  }
  return picked
}

/**
 * Place `count` non-overlapping 4×4 blocks at random origins.
 * Returns null when `count` cannot fit. Count 0 returns an empty list
 * and does not draw from `rng`.
 *
 * Pictures are a shuffled cycle of the catalog, so a batch uses each
 * drawing once before repeating.
 */
export function placeImageBlocks(
  size: number,
  count: number,
  rng: () => number,
  imageIds: readonly BoardImageId[] = BOARD_IMAGE_IDS,
): ImageBlock[] | null {
  if (count === 0) return []
  if (!Number.isInteger(count) || count < 0) return null
  if (!Number.isInteger(size) || count > maxImageBlocks(size)) return null
  if (imageIds.length === 0) return null

  const origins = randomOrigins(size, count, rng)
  if (!origins || origins.length !== count) return null
  if (origins.some((origin) => !originFits(size, origin.row, origin.col))) {
    return null
  }
  for (let i = 0; i < origins.length; i++) {
    for (let j = i + 1; j < origins.length; j++) {
      if (imageBlocksOverlap(origins[i]!, origins[j]!)) return null
    }
  }

  const pictures = pickImages(count, rng, imageIds)
  return origins.map((origin, index) => ({
    imageId: pictures[index]!,
    row: origin.row,
    col: origin.col,
  }))
}
