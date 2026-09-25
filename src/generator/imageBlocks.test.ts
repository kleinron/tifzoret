import { describe, expect, it } from 'vitest'
import { BOARD_IMAGE_IDS } from '../images/catalog.ts'
import {
  BLOCKED_CELL,
  blockedCellKeys,
  clampImageCount,
  DEFAULT_IMAGE_COUNT,
  imageBlockCells,
  imageBlocksOverlap,
  imageBlocksShareEdge,
  imagePlacementErrorHe,
  keptImageBlocks,
  maxImageBlocks,
  pictureBlockSize,
  placeImageBlocks,
  resolveImageBlocks,
  type ImageBlock,
} from './imageBlocks.ts'
import { mulberry32 } from './rng.ts'

describe('maxImageBlocks', () => {
  it('counts blocks that may touch at a corner but not along an edge', () => {
    expect(pictureBlockSize(8)).toBe(3)
    expect(pictureBlockSize(10)).toBe(3)
    expect(pictureBlockSize(11)).toBe(4)
    expect(pictureBlockSize(12)).toBe(4)
    expect(DEFAULT_IMAGE_COUNT).toBe(1)
    expect(maxImageBlocks(8)).toBe(4)
    expect(maxImageBlocks(9)).toBe(5)
    expect(maxImageBlocks(10)).toBe(6)
    expect(maxImageBlocks(11)).toBe(4)
    expect(maxImageBlocks(12)).toBe(5)
    expect(maxImageBlocks(13)).toBe(6)
    expect(maxImageBlocks(14)).toBe(9)
    expect(maxImageBlocks(15)).toBe(9)
    expect(maxImageBlocks(16)).toBe(9)
    expect(maxImageBlocks(17)).toBe(10)
    expect(maxImageBlocks(18)).toBe(12)
    expect(maxImageBlocks(19)).toBe(16)
    expect(maxImageBlocks(20)).toBe(16)
    expect(maxImageBlocks(4)).toBe(1)
    expect(maxImageBlocks(3)).toBe(1)
    expect(maxImageBlocks(2)).toBe(0)
    expect(maxImageBlocks(Number.NaN)).toBe(0)
  })
})

describe('clampImageCount', () => {
  it('clamps to the board and keeps zero', () => {
    expect(clampImageCount(9, 8)).toBe(4)
    expect(clampImageCount(9, 12)).toBe(5)
    expect(clampImageCount(9, 14)).toBe(9)
    expect(clampImageCount(0, 12)).toBe(0)
    expect(clampImageCount(-4, 12)).toBe(0)
    expect(clampImageCount(1.6, 12)).toBe(2)
    expect(clampImageCount(Number.NaN, 12)).toBe(1)
    expect(clampImageCount(99, 20)).toBe(16)
  })
})

describe('placeImageBlocks', () => {
  function assertPacked(
    blocks: NonNullable<ReturnType<typeof placeImageBlocks>>,
    size: number,
    count: number,
  ) {
    expect(blocks).toHaveLength(count)
    const span = pictureBlockSize(size)
    const keys = blockedCellKeys(blocks, size)
    expect(keys.size).toBe(count * span * span)
    for (const block of blocks) {
      expect(BOARD_IMAGE_IDS).toContain(block.imageId)
      expect(block.row).toBeGreaterThanOrEqual(0)
      expect(block.col).toBeGreaterThanOrEqual(0)
      expect(block.row + span).toBeLessThanOrEqual(size)
      expect(block.col + span).toBeLessThanOrEqual(size)
      expect(imageBlockCells(block, size)).toHaveLength(span * span)
    }
    expect(new Set(blocks.map((block) => block.imageId)).size).toBe(blocks.length)
    for (let i = 0; i < blocks.length; i++) {
      for (let j = i + 1; j < blocks.length; j++) {
        expect(imageBlocksOverlap(blocks[i]!, blocks[j]!, size)).toBe(false)
        if (count >= 2) {
          expect(imageBlocksShareEdge(blocks[i]!, blocks[j]!, size)).toBe(false)
        }
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
    expect(placeImageBlocks(10, 7, mulberry32(1))).toBeNull()
    expect(imagePlacementErrorHe(5, 8)).toBe(
      'לא הצלחנו למקם 5 תמונות של 3×3 בלי צלע משותפת על לוח 8×8. אפשר לכל היותר 4.',
    )
    expect(imagePlacementErrorHe(6, 12)).toBe(
      'לא הצלחנו למקם 6 תמונות של 4×4 בלי צלע משותפת על לוח 12×12. אפשר לכל היותר 5.',
    )
  })

  it('rejects a full or partial shared edge and accepts a corner', () => {
    const origin = { row: 0, col: 0 }
    expect(imageBlocksShareEdge(origin, { row: 0, col: 4 }, 12)).toBe(true)
    expect(imageBlocksShareEdge(origin, { row: 2, col: 4 }, 12)).toBe(true)
    expect(imageBlocksShareEdge(origin, { row: 1, col: 4 }, 12)).toBe(true)
    expect(imageBlocksShareEdge(origin, { row: 4, col: 0 }, 12)).toBe(true)
    expect(imageBlocksShareEdge(origin, { row: 4, col: 2 }, 12)).toBe(true)
    expect(imageBlocksShareEdge(origin, { row: 4, col: 4 }, 12)).toBe(false)
    expect(imageBlocksOverlap(origin, { row: 4, col: 4 }, 12)).toBe(false)
    expect(imageBlocksShareEdge(origin, { row: 0, col: 5 }, 12)).toBe(false)
    expect(imageBlocksShareEdge(origin, { row: 3, col: 5 }, 12)).toBe(false)
    expect(imageBlocksShareEdge(origin, { row: 5, col: 5 }, 12)).toBe(false)

    expect(imageBlocksShareEdge(origin, { row: 0, col: 3 }, 8)).toBe(true)
    expect(imageBlocksShareEdge(origin, { row: 2, col: 3 }, 10)).toBe(true)
    expect(imageBlocksShareEdge(origin, { row: 3, col: 3 }, 8)).toBe(false)
    expect(imageBlocksOverlap(origin, { row: 3, col: 3 }, 8)).toBe(false)
    expect(imageBlocksShareEdge(origin, { row: 0, col: 4 }, 8)).toBe(false)
  })

  it('places 3×3 blocks on an 8×8 board up to the maximum of four', () => {
    for (let seed = 1; seed <= 24; seed++) {
      const blocks = placeImageBlocks(8, 4, mulberry32(seed))
      expect(blocks).not.toBeNull()
      assertPacked(blocks!, 8, 4)
      expect(imageBlockCells(blocks![0]!, 8)).toHaveLength(9)
    }
  })

  it('packs five 3×3 blocks on a 9×9 board at the only origins', () => {
    const blocks = placeImageBlocks(9, 5, mulberry32(3))
    expect(blocks).not.toBeNull()
    const origins = blocks!.map((block) => `${block.row},${block.col}`).sort()
    expect(origins).toEqual(['0,0', '0,6', '3,3', '6,0', '6,6'])
    for (const cell of blockedCellKeys(blocks!, 9)) {
      expect(BLOCKED_CELL).toBe('\u0000')
      expect(cell).toMatch(/^\d,\d$/)
    }
    expect(blockedCellKeys(blocks!, 9).size).toBe(45)
    assertPacked(blocks!, 9, 5)
  })

  it('packs six 3×3 blocks on a 10×10 board', () => {
    for (const seed of [1, 3, 8, 21]) {
      const blocks = placeImageBlocks(10, 6, mulberry32(seed))
      expect(blocks, `seed ${seed}`).not.toBeNull()
      assertPacked(blocks!, 10, 6)
      expect(imageBlockCells(blocks![0]!, 10)).toHaveLength(9)
    }
  })

  it('places random in-bounds blocks that do not share an edge', () => {
    for (const size of [8, 10, 12, 13, 15, 17, 18, 20]) {
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

  it('never shares an edge across many regenerations, including counts of two and three', () => {
    const cases = [
      { size: 12, count: 2 },
      { size: 12, count: 3 },
      { size: 15, count: 3 },
      { size: 20, count: 2 },
    ]
    for (const { size, count } of cases) {
      const seen = new Set<string>()
      for (let seed = 1; seed <= 40; seed++) {
        const blocks = placeImageBlocks(size, count, mulberry32(seed))
        expect(blocks, `${size}×${size} count ${count} seed ${seed}`).not.toBeNull()
        assertPacked(blocks!, size, count)
        const signature = blocks!
          .map((block) => `${block.row},${block.col}`)
          .sort()
          .join('|')
        seen.add(signature)
      }
      expect(seen.size).toBeGreaterThan(3)
    }
  })

  it('does not always sit on the block lattice', () => {
    const origins = new Set<string>()
    let staggered = false
    for (let seed = 1; seed <= 24; seed++) {
      const [block] = placeImageBlocks(12, 1, mulberry32(seed))!
      origins.add(`${block.row},${block.col}`)
      if (block.row % 4 !== 0 || block.col % 4 !== 0) staggered = true
    }
    expect(origins.size).toBeGreaterThan(3)
    expect(staggered).toBe(true)

    let staggeredSmall = false
    for (let seed = 1; seed <= 24; seed++) {
      const [block] = placeImageBlocks(8, 1, mulberry32(seed))!
      if (block.row % 3 !== 0 || block.col % 3 !== 0) staggeredSmall = true
    }
    expect(staggeredSmall).toBe(true)
  })

  it('keeps a legal set without drawing from the rng', () => {
    const existing: ImageBlock[] = [
      { imageId: 'cat', row: 0, col: 0 },
      { imageId: 'sun', row: 4, col: 4 },
    ]
    let draws = 0
    const rng = () => {
      draws += 1
      return 0.3
    }
    expect(keptImageBlocks(8, existing)).toEqual(existing)
    expect(resolveImageBlocks(8, 2, rng, { policy: 'keep', existing })).toEqual(existing)
    expect(resolveImageBlocks(8, 2, rng, { policy: 'adapt', existing })).toEqual(existing)
    expect(draws).toBe(0)
  })

  it('rejects a shared edge, an unknown drawing, and a block past the board', () => {
    expect(
      keptImageBlocks(12, [
        { imageId: 'cat', row: 0, col: 0 },
        { imageId: 'sun', row: 0, col: 4 },
      ]),
    ).toBeNull()
    expect(keptImageBlocks(12, [{ imageId: 'nope' as ImageBlock['imageId'], row: 0, col: 0 }])).toBeNull()
    expect(keptImageBlocks(8, [{ imageId: 'fish', row: 6, col: 0 }])).toBeNull()
    expect(keptImageBlocks(12, [])).toBeNull()
    expect(
      keptImageBlocks(12, [
        { imageId: 'cat', row: 0, col: 0 },
        { imageId: 'cat', row: 0, col: 5 },
      ]),
    ).toBeNull()
  })

  it('adds a partner beside a picture that stays put', () => {
    const existing: ImageBlock[] = [{ imageId: 'cat', row: 0, col: 0 }]
    const blocks = resolveImageBlocks(8, 2, mulberry32(1), {
      policy: 'adapt',
      existing,
    })
    expect(blocks?.[0]).toEqual(existing[0])
    expect(blocks).toHaveLength(2)
    expect(imageBlocksShareEdge(blocks![0]!, blocks![1]!, 8)).toBe(false)
    expect(blocks![1]!.row + pictureBlockSize(8)).toBeLessThanOrEqual(8)
    expect(blocks![1]!.col + pictureBlockSize(8)).toBeLessThanOrEqual(8)
  })

  it('drops a picture that blocks the requested count and places a legal set', () => {
    const blocks = resolveImageBlocks(8, 4, mulberry32(4), {
      policy: 'adapt',
      existing: [{ imageId: 'cat', row: 2, col: 2 }],
    })
    expect(blocks).not.toBeNull()
    assertPacked(blocks!, 8, 4)
    expect(blocks!.some((block) => block.row === 2 && block.col === 2)).toBe(false)
  })

  it('trims to the requested count and skips a block that no longer fits', () => {
    const first: ImageBlock = { imageId: 'cat', row: 0, col: 0 }
    const second: ImageBlock = { imageId: 'sun', row: 0, col: 5 }
    const trimmed = resolveImageBlocks(12, 1, mulberry32(2), {
      policy: 'adapt',
      existing: [first, second],
    })
    expect(trimmed).toEqual([first])

    let draws = 0
    const cleared = resolveImageBlocks(
      12,
      0,
      () => {
        draws += 1
        return 0.5
      },
      { policy: 'adapt', existing: [first, second] },
    )
    expect(cleared).toEqual([])
    expect(draws).toBe(0)

    const replaced = resolveImageBlocks(8, 1, mulberry32(6), {
      policy: 'adapt',
      existing: [{ imageId: 'fish', row: 6, col: 0 }, first],
    })
    expect(replaced).toEqual([first])
  })

  it('rolls the same blocks as a fresh placement', () => {
    for (const seed of [1, 2, 7, 99]) {
      expect(resolveImageBlocks(12, 3, mulberry32(seed), { policy: 'roll' })).toEqual(
        placeImageBlocks(12, 3, mulberry32(seed)),
      )
      expect(resolveImageBlocks(12, 3, mulberry32(seed))).toEqual(
        placeImageBlocks(12, 3, mulberry32(seed)),
      )
    }
  })

  it('places exactly N distinct drawings on every current board', () => {
    expect(BOARD_IMAGE_IDS.length).toBe(16)
    expect(new Set(BOARD_IMAGE_IDS).size).toBe(16)
    for (let size = 8; size <= 20; size++) {
      const max = maxImageBlocks(size)
      expect(max, `size ${size}`).toBeLessThanOrEqual(BOARD_IMAGE_IDS.length)
      expect(clampImageCount(max, size)).toBe(max)
      for (const count of [1, max]) {
        const blocks = placeImageBlocks(size, count, mulberry32(size * 10 + count))
        expect(blocks, `${size}×${size} count ${count}`).toHaveLength(count)
        expect(new Set(blocks!.map((block) => block.imageId)).size).toBe(count)
        assertPacked(blocks!, size, count)
      }
    }
    expect(placeImageBlocks(20, 17, mulberry32(1))).toBeNull()
  })

  it('places a different drawing in every block', () => {
    for (let seed = 1; seed <= 40; seed++) {
      const blocks = placeImageBlocks(15, 3, mulberry32(seed))
      expect(blocks, `seed ${seed}`).not.toBeNull()
      expect(blocks).toHaveLength(3)
      expect(new Set(blocks!.map((block) => block.imageId)).size).toBe(3)
      assertPacked(blocks!, 15, 3)
    }
  })

  it('clamps to the distinct drawings instead of repeating a catalog that is too small', () => {
    const few = ['cat', 'sun', 'fish'] as const
    const repeated = ['cat', 'cat', 'sun', 'fish', 'sun'] as const
    for (let seed = 0; seed < 12; seed++) {
      const blocks = placeImageBlocks(24, BOARD_IMAGE_IDS.length + 1, mulberry32(seed))!
      const ids = blocks.map((block) => block.imageId)
      expect(ids).toHaveLength(BOARD_IMAGE_IDS.length)
      expect(new Set(ids).size).toBe(BOARD_IMAGE_IDS.length)
    }
    for (let seed = 1; seed <= 20; seed++) {
      const blocks = placeImageBlocks(20, 5, mulberry32(seed), [...few])!
      expect(blocks).toHaveLength(few.length)
      expect(new Set(blocks.map((block) => block.imageId))).toEqual(new Set(few))
      assertPacked(blocks, 20, few.length)

      const deduped = placeImageBlocks(20, 5, mulberry32(seed), [...repeated])!
      expect(deduped).toHaveLength(3)
      expect(new Set(deduped.map((block) => block.imageId)).size).toBe(3)
    }
  })

  it('adds drawings that are not already on the board when the count grows', () => {
    const existing: ImageBlock[] = [{ imageId: 'cat', row: 0, col: 0 }]
    const few = ['cat', 'sun', 'fish'] as const
    for (let seed = 1; seed <= 24; seed++) {
      const blocks = resolveImageBlocks(12, 3, mulberry32(seed), {
        policy: 'adapt',
        existing,
        imageIds: [...few],
      })
      expect(blocks, `seed ${seed}`).not.toBeNull()
      expect(blocks).toHaveLength(3)
      expect(blocks![0]).toEqual(existing[0])
      expect(new Set(blocks!.map((block) => block.imageId)).size).toBe(3)
      assertPacked(blocks!, 12, 3)
    }
  })

  it('does not copy a drawing when the catalog has nothing new to add', () => {
    const existing: ImageBlock[] = [
      { imageId: 'cat', row: 0, col: 0 },
      { imageId: 'sun', row: 0, col: 5 },
    ]
    let draws = 0
    const blocks = resolveImageBlocks(
      12,
      3,
      () => {
        draws += 1
        return 0.4
      },
      { policy: 'adapt', existing, imageIds: ['cat', 'sun'] },
    )
    expect(blocks).toEqual(existing)
    expect(draws).toBe(0)
    expect(new Set(blocks!.map((block) => block.imageId)).size).toBe(2)
  })

  it('replaces a repeated drawing on reshuffle instead of keeping the copy', () => {
    const existing: ImageBlock[] = [
      { imageId: 'cat', row: 0, col: 0 },
      { imageId: 'cat', row: 0, col: 5 },
    ]
    for (let seed = 1; seed <= 12; seed++) {
      const blocks = resolveImageBlocks(12, 2, mulberry32(seed), {
        policy: 'keep',
        existing,
        imageIds: ['cat', 'sun', 'fish'],
      })
      expect(blocks, `seed ${seed}`).not.toBeNull()
      expect(blocks).toHaveLength(2)
      expect(blocks![0]).toEqual(existing[0])
      expect(blocks![1]!.imageId).not.toBe('cat')
      expect(new Set(blocks!.map((block) => block.imageId)).size).toBe(2)
      assertPacked(blocks!, 12, 2)
    }
  })

  it('replaces drawings that are not in the active catalog', () => {
    const existing: ImageBlock[] = [{ imageId: 'cat', row: 0, col: 0 }]
    const holiday = ['dreidel', 'hanukkiah'] as const
    expect(keptImageBlocks(12, existing, holiday)).toBeNull()
    for (let seed = 1; seed <= 8; seed++) {
      const blocks = resolveImageBlocks(12, 1, mulberry32(seed), {
        policy: 'adapt',
        existing,
        imageIds: holiday,
      })
      expect(blocks, `seed ${seed}`).toHaveLength(1)
      expect(holiday).toContain(blocks![0]!.imageId)
      expect(blocks![0]!.imageId).not.toBe('cat')
    }
    const kept = resolveImageBlocks(12, 1, mulberry32(3), {
      policy: 'keep',
      existing: [{ imageId: 'dreidel', row: 1, col: 2 }],
      imageIds: holiday,
    })
    expect(kept).toEqual([{ imageId: 'dreidel', row: 1, col: 2 }])
  })
})
