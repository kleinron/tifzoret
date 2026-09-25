import {
  BOARD_IMAGE_IDS,
  type BoardImageId,
} from '../images/catalog.ts'
import { pickIndex, shuffle } from './rng.ts'

/**
 * Side of each picture square, in cells.
 * Boards of side 10 and under use 3×3; larger boards use 4×4.
 */
export function pictureBlockSize(boardSize: number): number {
  return boardSize <= 10 ? 3 : 4
}

/**
 * Empty cells required along a shared edge once two or more pictures are
 * placed. Corner-only contact is allowed.
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
 * 4×4 packings tighter than a plain stride-5 grid or a stride-4 checkerboard.
 * Each list is a maximum set of origins whose blocks never share an edge.
 * Used only when {@link pictureBlockSize} is 4.
 */
const SPECIAL_EDGE_PACKINGS_4: Record<number, readonly { row: number; col: number }[]> = {
  13: [
    { row: 0, col: 0 },
    { row: 0, col: 5 },
    { row: 4, col: 9 },
    { row: 5, col: 0 },
    { row: 9, col: 4 },
    { row: 9, col: 9 },
  ],
  17: [
    { row: 0, col: 0 },
    { row: 0, col: 5 },
    { row: 3, col: 13 },
    { row: 5, col: 0 },
    { row: 5, col: 8 },
    { row: 8, col: 13 },
    { row: 9, col: 4 },
    { row: 13, col: 0 },
    { row: 13, col: 8 },
    { row: 13, col: 13 },
  ],
  18: [
    { row: 0, col: 0 },
    { row: 0, col: 5 },
    { row: 0, col: 10 },
    { row: 4, col: 14 },
    { row: 5, col: 0 },
    { row: 5, col: 5 },
    { row: 9, col: 9 },
    { row: 9, col: 14 },
    { row: 10, col: 0 },
    { row: 14, col: 4 },
    { row: 14, col: 9 },
    { row: 14, col: 14 },
  ],
}

/**
 * 3×3 packing tighter than the stride-3 checkerboard.
 * Six blocks fit on a 10×10 board; the checkerboard only seats five.
 */
const SPECIAL_EDGE_PACKINGS_3: Record<number, readonly { row: number; col: number }[]> = {
  10: [
    { row: 0, col: 0 },
    { row: 0, col: 4 },
    { row: 3, col: 7 },
    { row: 4, col: 0 },
    { row: 7, col: 3 },
    { row: 7, col: 7 },
  ],
}

function specialEdgePacking(
  gridSize: number,
  block: number,
): readonly { row: number; col: number }[] | undefined {
  if (!Number.isInteger(gridSize)) return undefined
  if (block === 3) return SPECIAL_EDGE_PACKINGS_3[gridSize]
  if (block === 4) return SPECIAL_EDGE_PACKINGS_4[gridSize]
  return undefined
}

function latticeCount(gridSize: number, stride: number, block: number): number {
  if (gridSize < block) return 0
  const across = Math.floor((gridSize - block) / stride) + 1
  return across * across
}

/** Larger color class of a stride-`block` lattice. Orthogonal neighbors are omitted, so corners may touch. */
function checkerCount(gridSize: number, block: number): number {
  const across = Math.floor(gridSize / block)
  if (across <= 0) return 0
  return Math.ceil((across * across) / 2)
}

/**
 * How many picture blocks fit on an n×n board when blocks may meet at a
 * corner but may not share an edge. One empty cell separates any overlapping
 * projection. The footprint is {@link pictureBlockSize}.
 */
export function maxImageBlocks(gridSize: number): number {
  if (!Number.isFinite(gridSize)) return 0
  const block = pictureBlockSize(gridSize)
  if (gridSize < block) return 0
  const gapped = latticeCount(gridSize, block + IMAGE_BLOCK_GAP, block)
  const checker = checkerCount(gridSize, block)
  const special = specialEdgePacking(gridSize, block)?.length ?? 0
  return Math.max(gapped, checker, special)
}

/** Catalog ids with repeats removed, first occurrence kept. */
function distinctImageIds(ids: readonly BoardImageId[]): BoardImageId[] {
  const seen = new Set<BoardImageId>()
  const unique: BoardImageId[] = []
  for (const id of ids) {
    if (seen.has(id)) continue
    seen.add(id)
    unique.push(id)
  }
  return unique
}

export function clampImageCount(count: number, gridSize: number): number {
  const max = maxImageBlocks(gridSize)
  if (!Number.isFinite(count)) return Math.min(DEFAULT_IMAGE_COUNT, max)
  return Math.min(max, Math.max(0, Math.round(count)))
}

export function imagePlacementErrorHe(count: number, gridSize: number): string {
  const max = maxImageBlocks(gridSize)
  const span = pictureBlockSize(gridSize)
  return `לא הצלחנו למקם ${count} תמונות של ${span}×${span} בלי צלע משותפת על לוח ${gridSize}×${gridSize}. אפשר לכל היותר ${max}.`
}

export function imageBlockCells(
  block: { row: number; col: number },
  boardSize: number,
): { row: number; col: number }[] {
  const span = pictureBlockSize(boardSize)
  const cells: { row: number; col: number }[] = []
  for (let row = 0; row < span; row++) {
    for (let col = 0; col < span; col++) {
      cells.push({ row: block.row + row, col: block.col + col })
    }
  }
  return cells
}

export function blockedCellKeys(
  blocks: readonly { row: number; col: number }[],
  boardSize: number,
): Set<string> {
  const keys = new Set<string>()
  for (const block of blocks) {
    for (const cell of imageBlockCells(block, boardSize)) {
      keys.add(`${cell.row},${cell.col}`)
    }
  }
  return keys
}

/** Empty cells between two intervals of length `span`. Negative when they overlap, 0 when they touch. */
function axisSeparation(a: number, b: number, span: number): number {
  if (a > b) return axisSeparation(b, a, span)
  return b - (a + span)
}

/** True when the picture footprints occupy the same cell. */
export function imageBlocksOverlap(
  a: { row: number; col: number },
  b: { row: number; col: number },
  boardSize: number,
): boolean {
  const span = pictureBlockSize(boardSize)
  return Math.abs(a.row - b.row) < span && Math.abs(a.col - b.col) < span
}

/**
 * True when two blocks overlap or share any edge segment, including a
 * partial edge. Corner-only contact returns false: each block is expanded
 * on its four sides, not into the diagonal cells.
 */
export function imageBlocksShareEdge(
  a: { row: number; col: number },
  b: { row: number; col: number },
  boardSize: number,
): boolean {
  const span = pictureBlockSize(boardSize)
  const rowGap = axisSeparation(a.row, b.row, span)
  const colGap = axisSeparation(a.col, b.col, span)
  return (rowGap < 0 && colGap <= 0) || (colGap < 0 && rowGap <= 0)
}

function originFits(size: number, row: number, col: number): boolean {
  const span = pictureBlockSize(size)
  return row >= 0 && col >= 0 && row + span <= size && col + span <= size
}

function allOrigins(size: number): { row: number; col: number }[] {
  const span = pictureBlockSize(size)
  const max = size - span
  const origins: { row: number; col: number }[] = []
  for (let row = 0; row <= max; row++) {
    for (let col = 0; col <= max; col++) {
      origins.push({ row, col })
    }
  }
  return origins
}

function shiftedLattice(
  size: number,
  stride: number,
  rng: () => number,
): { row: number; col: number }[] {
  const span = pictureBlockSize(size)
  const across = Math.floor((size - span) / stride) + 1
  if (across <= 0) return []
  const used = (across - 1) * stride + span
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
  return origins
}

/** One color of a stride-`span` lattice. Same-color neighbors meet only at corners. */
function checkerLattices(
  size: number,
  rng: () => number,
): { row: number; col: number }[][] {
  const span = pictureBlockSize(size)
  const across = Math.floor(size / span)
  if (across <= 0) return []
  const slack = size - across * span
  const offsetRow = slack === 0 ? 0 : pickIndex(slack + 1, rng)
  const offsetCol = slack === 0 ? 0 : pickIndex(slack + 1, rng)
  const colors: { row: number; col: number }[][] = [[], []]
  for (let row = 0; row < across; row++) {
    for (let col = 0; col < across; col++) {
      colors[(row + col) % 2]!.push({
        row: offsetRow + row * span,
        col: offsetCol + col * span,
      })
    }
  }
  return colors
}

function reflectOrigins(
  size: number,
  origins: readonly { row: number; col: number }[],
  rng: () => number,
): { row: number; col: number }[] {
  const flipRow = pickIndex(2, rng) === 1
  const flipCol = pickIndex(2, rng) === 1
  const swap = pickIndex(2, rng) === 1
  const span = pictureBlockSize(size)
  return origins.map((origin) => {
    let row = flipRow ? size - span - origin.row : origin.row
    let col = flipCol ? size - span - origin.col : origin.col
    if (swap) {
      const tmp = row
      row = col
      col = tmp
    }
    return { row, col }
  })
}

/**
 * Guaranteed packing used when a random greedy pass cannot seat every block.
 * With two or more pictures, candidates keep a one-cell gap on shared edges
 * and may still touch at a corner.
 */
function latticeOrigins(
  size: number,
  count: number,
  rng: () => number,
): { row: number; col: number }[] | null {
  const span = pictureBlockSize(size)
  if (count < 2) {
    const packed = shiftedLattice(size, span, rng)
    if (packed.length < count) return null
    return shuffle(packed, rng).slice(0, count)
  }
  const pools: { row: number; col: number }[][] = []
  const separated = shiftedLattice(size, span + IMAGE_BLOCK_GAP, rng)
  if (separated.length >= count) pools.push(separated)
  for (const color of checkerLattices(size, rng)) {
    if (color.length >= count) pools.push(color)
  }
  const special = specialEdgePacking(size, span)
  if (special && special.length >= count) pools.push(reflectOrigins(size, special, rng))
  if (pools.length === 0) return null
  const pool = pools[pickIndex(pools.length, rng)]!
  return shuffle(pool, rng).slice(0, count)
}

const GREEDY_TRIES = 32

function randomOrigins(
  size: number,
  count: number,
  rng: () => number,
): { row: number; col: number }[] | null {
  const separateEdges = count >= 2
  const pool = allOrigins(size)
  for (let attempt = 0; attempt < GREEDY_TRIES; attempt++) {
    const shuffled = shuffle(pool, rng)
    const placed: { row: number; col: number }[] = []
    for (const origin of shuffled) {
      const blocked = separateEdges
        ? placed.some((block) => imageBlocksShareEdge(block, origin, size))
        : placed.some((block) => imageBlocksOverlap(block, origin, size))
      if (blocked) continue
      placed.push(origin)
      if (placed.length === count) return placed
    }
  }
  return latticeOrigins(size, count, rng)
}

/**
 * Up to `count` different drawings, in random order.
 * Never repeats an id. Does not draw from `rng` when nothing can be picked.
 * When every id is eligible, the shuffle matches a single catalog pass so a
 * fresh placement still consumes the same random draws as before.
 */
function pickImages(
  count: number,
  rng: () => number,
  ids: readonly BoardImageId[],
): BoardImageId[] {
  if (count <= 0) return []
  const available = distinctImageIds(ids)
  if (available.length === 0) return []
  const take = Math.min(count, available.length)
  const shuffled = shuffle(available, rng)
  const picked: BoardImageId[] = []
  for (let i = 0; i < take; i++) picked.push(shuffled.pop()!)
  return picked
}

/**
 * How an existing set of pictures is treated on the next build.
 * - `roll` — ignore them and place `count` new blocks.
 * - `keep` — same drawings, same cells («ערבב מחדש»), when that set is still legal.
 * - `adapt` — keep drawings that still fit, drop the rest, and fill up to `count`
 *   with drawings that are not already on the board (a settings change).
 */
export type ImagePolicy = 'roll' | 'keep' | 'adapt'

function allowedImageIds(ids: readonly BoardImageId[]): Set<string> {
  return new Set(ids)
}

function copyBlock(block: ImageBlock): ImageBlock {
  return { imageId: block.imageId, row: block.row, col: block.col }
}

/** In bounds, and a drawing from the catalog that is active for this placement. */
function blockFits(
  size: number,
  block: ImageBlock,
  allowed: ReadonlySet<string>,
): boolean {
  return (
    allowed.has(block.imageId) &&
    Number.isInteger(block.row) &&
    Number.isInteger(block.col) &&
    originFits(size, block.row, block.col)
  )
}

function blocksConflict(
  size: number,
  blocks: readonly { row: number; col: number }[],
  separateEdges: boolean,
): boolean {
  for (let i = 0; i < blocks.length; i++) {
    for (let j = i + 1; j < blocks.length; j++) {
      const conflict = separateEdges
        ? imageBlocksShareEdge(blocks[i]!, blocks[j]!, size)
        : imageBlocksOverlap(blocks[i]!, blocks[j]!, size)
      if (conflict) return true
    }
  }
  return false
}

/**
 * Exact pictures to leave in place. Returns null when the set is empty or
 * any block is out of bounds, unknown, a repeated drawing, or too close to
 * another (shared edge once there are two or more). Does not draw from an rng.
 */
export function keptImageBlocks(
  size: number,
  blocks: readonly ImageBlock[],
  imageIds: readonly BoardImageId[] = BOARD_IMAGE_IDS,
): ImageBlock[] | null {
  if (blocks.length === 0) return null
  if (!Number.isInteger(size) || blocks.length > maxImageBlocks(size)) return null
  const allowed = allowedImageIds(imageIds)
  const copies: ImageBlock[] = []
  const seen = new Set<BoardImageId>()
  for (const block of blocks) {
    if (!blockFits(size, block, allowed) || seen.has(block.imageId)) return null
    seen.add(block.imageId)
    copies.push(copyBlock(block))
  }
  if (copies.length >= 2 && blocksConflict(size, copies, true)) return null
  return copies
}

/**
 * Pictures from `blocks` that still fit `size`, in their existing order,
 * stopped at `count`. A drawing already kept is skipped. Later blocks fill
 * gaps left by ones that no longer fit.
 */
export function retainImageBlocks(
  blocks: readonly ImageBlock[],
  size: number,
  count: number,
  imageIds: readonly BoardImageId[] = BOARD_IMAGE_IDS,
): ImageBlock[] {
  if (count <= 0) return []
  const allowed = allowedImageIds(imageIds)
  const separateEdges = count >= 2
  const kept: ImageBlock[] = []
  const seen = new Set<BoardImageId>()
  for (const block of blocks) {
    if (kept.length >= count) break
    if (!blockFits(size, block, allowed) || seen.has(block.imageId)) continue
    if (kept.length >= 1 && blocksConflict(size, [...kept, block], separateEdges)) continue
    seen.add(block.imageId)
    kept.push(copyBlock(block))
  }
  return kept
}

function additionalOrigins(
  size: number,
  need: number,
  rng: () => number,
  fixed: readonly { row: number; col: number }[],
  separateEdges: boolean,
): { row: number; col: number }[] | null {
  if (need <= 0) return []
  const pool = allOrigins(size)
  for (let attempt = 0; attempt < GREEDY_TRIES; attempt++) {
    const shuffled = shuffle(pool, rng)
    const placed: { row: number; col: number }[] = fixed.slice()
    const added: { row: number; col: number }[] = []
    for (const origin of shuffled) {
      const blocked = separateEdges
        ? placed.some((block) => imageBlocksShareEdge(block, origin, size))
        : placed.some((block) => imageBlocksOverlap(block, origin, size))
      if (blocked) continue
      placed.push(origin)
      added.push(origin)
      if (added.length === need) return added
    }
  }
  return null
}

function adaptedImageBlocks(
  size: number,
  count: number,
  rng: () => number,
  existing: readonly ImageBlock[],
  imageIds: readonly BoardImageId[],
): ImageBlock[] | null {
  if (!Number.isInteger(count) || count < 0) return null
  if (count === 0) return []
  if (!Number.isInteger(size) || count > maxImageBlocks(size)) return null
  const catalog = distinctImageIds(imageIds)
  // The shipped catalog is large enough for every product board. A shorter
  // list still places only distinct drawings, fewer than `count` when needed.
  const target = Math.min(count, catalog.length)
  if (target === 0) return null
  const retained = retainImageBlocks(existing, size, target, catalog)
  if (retained.length === 0) return placeImageBlocks(size, target, rng, catalog)

  const separateEdges = target >= 2
  for (let keep = retained.length; keep >= 1; keep--) {
    const prefix = retained.slice(0, keep)
    const used = new Set(prefix.map((block) => block.imageId))
    const available = catalog.filter((id) => !used.has(id))
    const need = Math.min(target - prefix.length, available.length)
    if (need === 0) return prefix
    const added = additionalOrigins(size, need, rng, prefix, separateEdges)
    if (!added) continue
    const pictures = pickImages(need, rng, available)
    if (pictures.length !== need) continue
    return [
      ...prefix,
      ...added.map((origin, index) => ({
        imageId: pictures[index]!,
        row: origin.row,
        col: origin.col,
      })),
    ]
  }
  return placeImageBlocks(size, target, rng, catalog)
}

/**
 * Place `count` pictures under `policy`. `roll` matches {@link placeImageBlocks}.
 * `keep` returns `existing` unchanged when that set is still legal, and otherwise
 * adapts. A repeated drawing is not legal, so reshuffle replaces it instead of
 * keeping the copy. `adapt` prefers the current drawings and only moves or drops
 * what no longer fits the board or the requested count. Added drawings are
 * chosen from ids that are not already placed.
 */
export function resolveImageBlocks(
  size: number,
  count: number,
  rng: () => number,
  options?: {
    policy?: ImagePolicy
    existing?: readonly ImageBlock[]
    imageIds?: readonly BoardImageId[]
  },
): ImageBlock[] | null {
  const policy = options?.policy ?? 'roll'
  const existing = options?.existing ?? []
  const imageIds = options?.imageIds ?? BOARD_IMAGE_IDS
  if (policy === 'keep' && existing.length > 0) {
    const kept = keptImageBlocks(size, existing, imageIds)
    if (kept) return kept
    return adaptedImageBlocks(size, count, rng, existing, imageIds)
  }
  if (policy === 'adapt') return adaptedImageBlocks(size, count, rng, existing, imageIds)
  return placeImageBlocks(size, count, rng, imageIds)
}

/**
 * Place `count` picture blocks at random origins.
 * Each block is {@link pictureBlockSize} cells on a side.
 * A single picture may sit on any in-bounds origin. Two or more pictures
 * may meet at a corner, but not along an edge: overlapping rows need a
 * one-cell column gap, and overlapping columns need a one-cell row gap.
 * Returns null when `count` cannot fit on the board. Count 0 returns an
 * empty list and does not draw from `rng`.
 *
 * Every placed block uses a different drawing. The shipped catalog has one
 * drawing per picture that fits on any current board, so a legal count is
 * placed in full. A shorter id list is a fallback: place that many distinct
 * drawings and do not repeat one to fill the request.
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
  const available = distinctImageIds(imageIds)
  if (available.length === 0) return null
  const placeCount = Math.min(count, available.length)

  const origins = randomOrigins(size, placeCount, rng)
  if (!origins || origins.length !== placeCount) return null
  if (origins.some((origin) => !originFits(size, origin.row, origin.col))) {
    return null
  }
  for (let i = 0; i < origins.length; i++) {
    for (let j = i + 1; j < origins.length; j++) {
      const conflict =
        placeCount >= 2
          ? imageBlocksShareEdge(origins[i]!, origins[j]!, size)
          : imageBlocksOverlap(origins[i]!, origins[j]!, size)
      if (conflict) return null
    }
  }

  const pictures = pickImages(placeCount, rng, available)
  if (pictures.length !== placeCount) return null
  return origins.map((origin, index) => ({
    imageId: pictures[index]!,
    row: origin.row,
    col: origin.col,
  }))
}
