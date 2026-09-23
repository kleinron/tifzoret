import { describe, expect, it } from 'vitest'
import { BOARD_IMAGE_IDS } from '../images/catalog.ts'
import {
  BLOCKED_CELL,
  blockedCellKeys,
  clampImageCount,
  DEFAULT_IMAGE_COUNT,
  IMAGE_BLOCK_SIZE,
  imageBlockCells,
  imageBlocksOverlap,
  imagePlacementErrorHe,
  maxImageBlocks,
  placeImageBlocks,
} from './imageBlocks.ts'
import { mulberry32 } from './rng.ts'

describe('maxImageBlocks', () => {
  it('counts a lattice of non-overlapping 4×4 squares', () => {
    expect(IMAGE_BLOCK_SIZE).toBe(4)
    expect(DEFAULT_IMAGE_COUNT).toBe(1)
    expect(maxImageBlocks(8)).toBe(4)
    expect(maxImageBlocks(11)).toBe(4)
    expect(maxImageBlocks(12)).toBe(9)
    expect(maxImageBlocks(15)).toBe(9)
    expect(maxImageBlocks(16)).toBe(16)
    expect(maxImageBlocks(20)).toBe(25)
    expect(maxImageBlocks(3)).toBe(0)
    expect(maxImageBlocks(Number.NaN)).toBe(0)
  })
})

describe('clampImageCount', () => {
  it('clamps to the board and keeps zero', () => {
    expect(clampImageCount(9, 8)).toBe(4)
    expect(clampImageCount(9, 12)).toBe(9)
    expect(clampImageCount(0, 12)).toBe(0)
    expect(clampImageCount(-4, 12)).toBe(0)
    expect(clampImageCount(1.6, 12)).toBe(2)
    expect(clampImageCount(Number.NaN, 12)).toBe(1)
  })
})

describe('placeImageBlocks', () => {
  function assertPacked(
    blocks: NonNullable<ReturnType<typeof placeImageBlocks>>,
    size: number,
    count: number,
  ) {
    expect(blocks).toHaveLength(count)
    const keys = blockedCellKeys(blocks)
    expect(keys.size).toBe(count * IMAGE_BLOCK_SIZE * IMAGE_BLOCK_SIZE)
    for (const block of blocks) {
      expect(BOARD_IMAGE_IDS).toContain(block.imageId)
      expect(block.row).toBeGreaterThanOrEqual(0)
      expect(block.col).toBeGreaterThanOrEqual(0)
      expect(block.row + IMAGE_BLOCK_SIZE).toBeLessThanOrEqual(size)
      expect(block.col + IMAGE_BLOCK_SIZE).toBeLessThanOrEqual(size)
      expect(imageBlockCells(block)).toHaveLength(16)
    }
    for (let i = 0; i < blocks.length; i++) {
      for (let j = i + 1; j < blocks.length; j++) {
        expect(imageBlocksOverlap(blocks[i]!, blocks[j]!)).toBe(false)
      }
    }
  }

  it('returns no blocks and ignores the rng when count is zero', () => {
    let draws = 0
    const rng = () => {
      draws += 1
      return 0.5
    }
    expect(placeImageBlocks(12, 0, rng)).toEqual([])
    expect(draws).toBe(0)
  })

  it('returns null when the count cannot fit', () => {
    expect(placeImageBlocks(8, 5, mulberry32(1))).toBeNull()
    expect(placeImageBlocks(12, -1, mulberry32(1))).toBeNull()
    expect(imagePlacementErrorHe(5, 8)).toBe(
      'לא הצלחנו למקם 5 תמונות של 4×4 בלי חפיפה על לוח 8×8. אפשר לכל היותר 4.',
    )
  })

  it('tiles an 8×8 board with the only four possible blocks', () => {
    const blocks = placeImageBlocks(8, 4, mulberry32(3))
    expect(blocks).not.toBeNull()
    const origins = blocks!.map((block) => `${block.row},${block.col}`).sort()
    expect(origins).toEqual(['0,0', '0,4', '4,0', '4,4'])
    for (const cell of blockedCellKeys(blocks!)) {
      expect(BLOCKED_CELL).toBe('\u0000')
      expect(cell).toMatch(/^\d,\d$/)
    }
    expect(blockedCellKeys(blocks!).size).toBe(64)
  })

  it('places random in-bounds blocks that do not overlap', () => {
    for (const size of [8, 12, 15, 20]) {
      const max = maxImageBlocks(size)
      for (const count of [1, Math.ceil(max / 2), max]) {
        for (const seed of [1, 8, 42]) {
          const blocks = placeImageBlocks(size, count, mulberry32(seed))
          expect(blocks, `${size} count ${count} seed ${seed}`).not.toBeNull()
          assertPacked(blocks!, size, count)
        }
      }
    }
  })

  it('does not always sit on the 4-cell lattice', () => {
    const origins = new Set<string>()
    let staggered = false
    for (let seed = 1; seed <= 24; seed++) {
      const [block] = placeImageBlocks(12, 1, mulberry32(seed))!
      origins.add(`${block.row},${block.col}`)
      if (block.row % 4 !== 0 || block.col % 4 !== 0) staggered = true
    }
    expect(origins.size).toBeGreaterThan(3)
    expect(staggered).toBe(true)
  })

  it('cycles drawings so the first catalog pass has no repeats', () => {
    for (let seed = 0; seed < 12; seed++) {
      const blocks = placeImageBlocks(20, BOARD_IMAGE_IDS.length + 1, mulberry32(seed))!
      const ids = blocks.map((block) => block.imageId)
      expect(new Set(ids.slice(0, BOARD_IMAGE_IDS.length)).size).toBe(BOARD_IMAGE_IDS.length)
      expect(ids[ids.length - 1]).not.toBe(ids[ids.length - 2])
    }
  })
})
