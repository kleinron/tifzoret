import { describe, expect, it } from 'vitest'
import { BOARD_IMAGE_IDS, PURIM_IMAGE_IDS } from '../images/catalog.ts'
import type { ImageBlock } from './imageBlocks.ts'
import {
  boardAfterFailedGenerate,
  imagePolicyForRefresh,
  puzzleRefreshDelay,
  puzzleSettingsKey,
  refreshWordPlan,
  SETTINGS_GENERATE_DEBOUNCE_MS,
} from './puzzleRefresh.ts'

describe('puzzle refresh rules', () => {
  it('debounces settings after the first build and runs explicit actions now', () => {
    expect(puzzleRefreshDelay('settings', false)).toBe(0)
    expect(puzzleRefreshDelay('settings', true)).toBe(SETTINGS_GENERATE_DEBOUNCE_MS)
    expect(puzzleRefreshDelay('reshuffle', true)).toBe(0)
  })

  it('keeps pictures on reshuffle only when the board already has some', () => {
    expect(imagePolicyForRefresh('reshuffle', 2)).toBe('keep')
    expect(imagePolicyForRefresh('reshuffle', 0)).toBe('roll')
    expect(imagePolicyForRefresh('settings', 2)).toBe('adapt')
    expect(imagePolicyForRefresh('settings', 0)).toBe('adapt')
  })

  it('reshuffle reuses placed words and does not draw a new age-10 set', () => {
    expect(refreshWordPlan('reshuffle', ['שמש'], ['שמש', 'ירח'], true)).toEqual({
      words: ['שמש', 'ירח'],
      randomAge10Fill: false,
    })
    expect(refreshWordPlan('reshuffle', ['שמש'], [], true)).toEqual({
      words: ['שמש'],
      randomAge10Fill: true,
    })
    expect(refreshWordPlan('settings', ['שמש'], ['שמש', 'ירח'], false)).toEqual({
      words: ['שמש'],
      randomAge10Fill: false,
    })
    expect(refreshWordPlan('settings', ['שמש', 'פרח'], ['שמש'], true)).toEqual({
      words: ['שמש', 'פרח'],
      randomAge10Fill: true,
    })
  })

  it('changes when board, directions, words, or picture count change, not when those are reordered', () => {
    const base = {
      directions: ['ttb', 'rtl'],
      gridSize: 12,
      imageCount: 1,
      bank: ['שמש', 'ירח'],
      randomAge10: false,
      noFinals: false,
    }
    expect(puzzleSettingsKey(base)).toBe(puzzleSettingsKey({ ...base, directions: ['rtl', 'ttb'] }))
    expect(puzzleSettingsKey(base)).not.toBe(puzzleSettingsKey({ ...base, gridSize: 8 }))
    expect(puzzleSettingsKey(base)).not.toBe(puzzleSettingsKey({ ...base, imageCount: 0 }))
    expect(puzzleSettingsKey(base)).not.toBe(
      puzzleSettingsKey({ ...base, bank: ['שמש'] }),
    )
    expect(puzzleSettingsKey(base)).not.toBe(
      puzzleSettingsKey({ ...base, randomAge10: true }),
    )
    expect(puzzleSettingsKey(base)).not.toBe(puzzleSettingsKey({ ...base, noFinals: true }))
    expect(puzzleSettingsKey(base)).not.toBe(
      puzzleSettingsKey({ ...base, directions: ['rtl'] }),
    )
  })
})

describe('failed generate after a pack change', () => {
  const hanukkah: ImageBlock[] = [
    { imageId: 'hanukkiah', row: 0, col: 0 },
    { imageId: 'dreidel', row: 0, col: 5 },
  ]

  it('clears the board and drops Hanukkah drawings when Purim is selected', () => {
    const next = boardAfterFailedGenerate(hanukkah, PURIM_IMAGE_IDS)
    expect(next.clearBoard).toBe(true)
    expect(next.imageBlocks).toEqual([])
  })

  it('clears the board and drops Hanukkah drawings when the regular catalog is selected', () => {
    const next = boardAfterFailedGenerate(hanukkah, BOARD_IMAGE_IDS)
    expect(next.clearBoard).toBe(true)
    expect(next.imageBlocks).toEqual([])
  })

  it('keeps the last board when every drawing is still in the active catalog', () => {
    const purim: ImageBlock[] = [{ imageId: 'megillah', row: 1, col: 2 }]
    const next = boardAfterFailedGenerate(purim, PURIM_IMAGE_IDS)
    expect(next.clearBoard).toBe(false)
    expect(next.imageBlocks).toEqual(purim)
  })

  it('drops only the drawings that are outside the active catalog', () => {
    const mixed: ImageBlock[] = [
      { imageId: 'megillah', row: 1, col: 2 },
      { imageId: 'cat', row: 6, col: 6 },
    ]
    const next = boardAfterFailedGenerate(mixed, PURIM_IMAGE_IDS)
    expect(next.clearBoard).toBe(true)
    expect(next.imageBlocks).toEqual([{ imageId: 'megillah', row: 1, col: 2 }])
  })
})
