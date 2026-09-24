import {
  BOARD_IMAGE_IDS,
  type BoardImageId,
} from '../images/catalog.ts'
import { pickIndex, shuffle } from './rng.ts'

/** Each picture covers a square of this many cells on a side. */
export const IMAGE_BLOCK_SIZE = 4

/**
 * Empty cells required between pictures once two or more are placed.
 * Checked in the Chebyshev sense, so blocks may not share an edge or a corner.
 */
export const IMAGE_BLOCK_GAP = 1

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

/**
 * How many 4×4 blocks fit on an n×n board when every pair keeps
 * {@link IMAGE_BLOCK_GAP} empty cell of Chebyshev separation.
 * Stride is 5: the picture plus one empty cell before the next origin.
 */
export function maxImageBlocks(gridSize: number): number {
  if (!Number.isFinite(gridSize) || gridSize < IMAGE_BLOCK_SIZE) return 0
  const stride = IMAGE_BLOCK_SIZE + IMAGE_BLOCK_GAP
  const across = Math.floor((gridSize - IMAGE_BLOCK_SIZE) / stride) + 1
  return across * across
}

export function clampImageCount(count: number, gridSize: number): number {
  const max = maxImageBlocks(gridSize)
  if (!Number.isFinite(count)) return Math.min(DEFAULT_IMAGE_COUNT, max)
  return Math.min(max, Math.max(0, Math.round(count)))
}

export function imagePlacementErrorHe(count: number, gridSize: number): string {
  const max = maxImageBlocks(gridSize)
  return `לא הצלחנו למקם ${count} תמונות של 4×4 בלי מגע (גם בפינה) על לוח ${gridSize}×${gridSize}. אפשר לכל היותר ${max}.`
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

function blocksConflict(
  a: { row: number; col: number },
  b: { row: number; col: number },
  gap: number,
): boolean {
  const span = IMAGE_BLOCK_SIZE + gap
  return Math.abs(a.row - b.row) < span && Math.abs(a.col - b.col) < span
}

/** True when the 4×4 footprints occupy the same cell. */
export function imageBlocksOverlap(
  a: { row: number; col: number },
  b: { row: number; col: number },
): boolean {
  return blocksConflict(a, b, 0)
}

/**
 * True when two blocks overlap, share any edge segment (including a partial
 * edge), or meet at a corner. Equivalent to inflating each block by
 * {@link IMAGE_BLOCK_GAP} and testing overlap.
 */
export function imageBlocksTouch(
  a: { row: number; col: number },
  b: { row: number; col: number },
): boolean {
  return blocksConflict(a, b, IMAGE_BLOCK_GAP)
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
 * Guaranteed packing on a shifted lattice. With two or more pictures the
 * stride is 5 so neighbors keep a one-cell gap, including at corners.
 * Used when a random greedy pass cannot seat every block.
 */
function latticeOrigins(
  size: number,
  count: number,
  rng: () => number,
): { row: number; col: number }[] | null {
  const gap = count >= 2 ? IMAGE_BLOCK_GAP : 0
  const stride = IMAGE_BLOCK_SIZE + gap
  const across = Math.floor((size - IMAGE_BLOCK_SIZE) / stride) + 1
  if (across * across < count) return null
  const used = (across - 1) * stride + IMAGE_BLOCK_SIZE
  const slack = size - used
  const offsetRow = slack === 0 ? 0 : pickIndex(slack + 1, rng)
  const offsetCol = slack === 0 ? 0 : pickIndex(slack + 1, rng)
  const origins: { row: number; col: number }[] = []
  for (let row = 0; row < across; row++) {
    for (let col = 0; col < across; col++) {
      origins.push({
        row: offsetRow + row * stride,
        col: offsetCol + col * stride,
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
  const gap = count >= 2 ? IMAGE_BLOCK_GAP : 0
  const pool = allOrigins(size)
  for (let attempt = 0; attempt < GREEDY_TRIES; attempt++) {
    const shuffled = shuffle(pool, rng)
    const placed: { row: number; col: number }[] = []
    for (const origin of shuffled) {
      if (placed.some((block) => blocksConflict(block, origin, gap))) continue
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
 * Place `count` 4×4 blocks at random origins.
 * A single picture may sit on any in-bounds origin. Two or more pictures
 * keep a one-cell Chebyshev gap: no shared edge and no corner contact.
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
  const gap = count >= 2 ? IMAGE_BLOCK_GAP : 0
  for (let i = 0; i < origins.length; i++) {
    for (let j = i + 1; j < origins.length; j++) {
      if (blocksConflict(origins[i]!, origins[j]!, gap)) return null
    }
  }

  const pictures = pickImages(count, rng, imageIds)
  return origins.map((origin, index) => ({
    imageId: pictures[index]!,
    row: origin.row,
    col: origin.col,
  }))
}
