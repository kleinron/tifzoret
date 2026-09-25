import type { BoardImageId } from '../images/catalog.ts'
import type { ImageBlock, ImagePolicy } from './imageBlocks.ts'

/** Why the board is being built again. */
export type PuzzleRefresh = 'settings' | 'reshuffle'

/**
 * Wait after a committed settings change so a paired update (board size and
 * the clamped picture count) becomes one build. Sliders themselves commit
 * only on release, not on each pixel of a drag.
 */
export const SETTINGS_GENERATE_DEBOUNCE_MS = 180

/**
 * First paint and «ערבב מחדש» run immediately.
 * Later settings changes wait so one gesture becomes one build.
 */
export function puzzleRefreshDelay(action: PuzzleRefresh, booted: boolean): number {
  if (!booted || action !== 'settings') return 0
  return SETTINGS_GENERATE_DEBOUNCE_MS
}

/**
 * Reshuffle keeps pictures only once some are on the board.
 * Settings keep what still fits (`adapt`).
 */
export function imagePolicyForRefresh(
  action: PuzzleRefresh,
  existingPictureCount: number,
): ImagePolicy {
  if (action === 'reshuffle') return existingPictureCount > 0 ? 'keep' : 'roll'
  return 'adapt'
}

/**
 * Words for this build. Reshuffle reuses the puzzle already on screen
 * (no new age-10 draw). Anything else starts from the word bank.
 */
export function refreshWordPlan(
  action: PuzzleRefresh,
  bank: readonly string[],
  puzzleWords: readonly string[],
  randomAge10: boolean,
): { words: readonly string[]; randomAge10Fill: boolean } {
  const freezePuzzle = action === 'reshuffle' && puzzleWords.length > 0
  return {
    words: freezePuzzle ? puzzleWords : bank,
    randomAge10Fill: freezePuzzle ? false : randomAge10,
  }
}

/**
 * Identity of the puzzle-defining settings. Font size and the uncommitted
 * word draft are intentionally absent: they do not rebuild the board.
 */
export function puzzleSettingsKey(input: {
  directions: readonly string[]
  gridSize: number
  imageCount: number
  bank: readonly string[]
  randomAge10: boolean
  noFinals: boolean
  /** Active picture catalog. A pack swap rebuilds even when words and checkboxes do not. */
  holidayPack?: string
}): string {
  return [
    input.directions.slice().sort().join(','),
    String(input.gridSize),
    String(input.imageCount),
    input.bank.join('\u0001'),
    input.randomAge10 ? '1' : '0',
    input.noFinals ? '1' : '0',
    input.holidayPack ?? 'regular',
  ].join('\u0002')
}

/**
 * A failed build keeps the last board only when every drawing still belongs
 * to the catalog the user has selected. Otherwise the letter grid is cleared
 * and drawings from the previous pack are dropped.
 */
export function boardAfterFailedGenerate(
  imageBlocks: readonly ImageBlock[],
  imageIds: readonly BoardImageId[],
): { clearBoard: boolean; imageBlocks: ImageBlock[] } {
  const allowed = new Set<string>(imageIds)
  const compatible = imageBlocks.filter((block) => allowed.has(block.imageId))
  return {
    clearBoard: compatible.length !== imageBlocks.length,
    imageBlocks: compatible,
  }
}
