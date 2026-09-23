import type { Direction, DirectionId } from './directions.ts'
import { BLOCKED_CELL } from './imageBlocks.ts'

export type Cell = { row: number; col: number }

export type WordOccurrence = {
  word: string
  row: number
  col: number
  direction: DirectionId
  cells: Cell[]
}

export function cellSetKey(cells: readonly Cell[]): string {
  return cells
    .map((c) => `${c.row},${c.col}`)
    .sort()
    .join('|')
}

export function findWordOccurrences(
  grid: string[][],
  word: string,
  directions: readonly Direction[],
): WordOccurrence[] {
  const size = grid.length
  const found: WordOccurrence[] = []
  const seen = new Set<string>()

  for (const dir of directions) {
    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        const cells: Cell[] = []
        let ok = true
        for (let i = 0; i < word.length; i++) {
          const r = row + dir.dr * i
          const c = col + dir.dc * i
          if (r < 0 || r >= size || c < 0 || c >= size) {
            ok = false
            break
          }
          const letter = grid[r]![c]
          // Image cells are not letters. A span that enters one is skipped,
          // not joined across the picture.
          if (letter === BLOCKED_CELL || letter !== word[i]) {
            ok = false
            break
          }
          cells.push({ row: r, col: c })
        }
        if (!ok) continue
        const key = cellSetKey(cells)
        if (seen.has(key)) continue
        seen.add(key)
        found.push({ word, row, col, direction: dir.id, cells })
      }
    }
  }

  return found
}

export function findAllOccurrences(
  grid: string[][],
  words: readonly string[],
  directions: readonly Direction[],
): Map<string, WordOccurrence[]> {
  const map = new Map<string, WordOccurrence[]>()
  for (const word of words) {
    map.set(word, findWordOccurrences(grid, word, directions))
  }
  return map
}

export function uniquenessViolations(
  grid: string[][],
  words: readonly string[],
  directions: readonly Direction[],
): string[] {
  const violations: string[] = []
  for (const word of words) {
    const found = findWordOccurrences(grid, word, directions)
    if (found.length === 0) {
      violations.push(`${word}: missing`)
    } else if (found.length > 1) {
      violations.push(`${word}: ${found.length} occurrences`)
    }
  }
  return violations
}

export function isUniquePlacement(
  grid: string[][],
  words: readonly string[],
  directions: readonly Direction[],
): boolean {
  return uniquenessViolations(grid, words, directions).length === 0
}
