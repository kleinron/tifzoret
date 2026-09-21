/** Cantillation, nikud, and related Hebrew marks. */
const NIKUD_AND_MARKS = /[\u0591-\u05C7]/g
const FINAL_LETTERS = /[םןץףך]/
const FINAL_LETTER_SET = new Set(['ם', 'ן', 'ץ', 'ף', 'ך'])

/** 22 regular Hebrew letters (no sofit forms). Used for random cell fill. */
export const HEBREW_LETTERS = [
  'א',
  'ב',
  'ג',
  'ד',
  'ה',
  'ו',
  'ז',
  'ח',
  'ט',
  'י',
  'כ',
  'ל',
  'מ',
  'נ',
  'ס',
  'ע',
  'פ',
  'צ',
  'ק',
  'ר',
  'ש',
  'ת',
] as const

export const MIN_WORD_LENGTH = 3
/** Hard cap: a Hebrew word may not exceed this many letters. */
export const MAX_WORD_LENGTH = 16

export function hasFinalLetter(word: string): boolean {
  return FINAL_LETTERS.test(word)
}

export function isFinalLetter(ch: string): boolean {
  return FINAL_LETTER_SET.has(ch)
}

/**
 * Strip nikud/cantillation, whitespace, punctuation, and non-Hebrew letters.
 * Final letters are kept (not folded to regular forms).
 */
export function normalizeHebrew(raw: string): string {
  return raw
    .replace(NIKUD_AND_MARKS, '')
    .replace(/[\s\u00A0\u200B-\u200D\uFEFF\-–—_.,;:/\\()'"`״׳']+/g, '')
    .replace(/[^\u05D0-\u05EA]/g, '')
}

export function parseWordList(text: string): string[] {
  const parts = text.split(/[\n,;]+/g)
  const out: string[] = []
  const seen = new Set<string>()
  for (const part of parts) {
    const word = normalizeHebrew(part)
    if (!word || seen.has(word)) continue
    seen.add(word)
    out.push(word)
  }
  return out
}

export type WordFilterResult = {
  kept: string[]
  skippedShort: string[]
  skippedFinals: string[]
  skippedContained: string[]
  skippedTooLong: string[]
  skippedMaxLength: string[]
}

export function filterBankWords(
  words: string[],
  options: { noFinalLetters: boolean; gridSize: number },
): WordFilterResult {
  const skippedShort: string[] = []
  const skippedFinals: string[] = []
  const skippedTooLong: string[] = []
  const skippedMaxLength: string[] = []
  const lengthOk: string[] = []

  for (const word of words) {
    if (word.length < MIN_WORD_LENGTH) {
      skippedShort.push(word)
      continue
    }
    if (word.length > MAX_WORD_LENGTH) {
      skippedMaxLength.push(word)
      continue
    }
    if (word.length > options.gridSize) {
      skippedTooLong.push(word)
      continue
    }
    if (options.noFinalLetters && hasFinalLetter(word)) {
      skippedFinals.push(word)
      continue
    }
    lengthOk.push(word)
  }

  const unique = [...new Set(lengthOk)]
  unique.sort((a, b) => b.length - a.length || a.localeCompare(b, 'he'))

  const kept: string[] = []
  const skippedContained: string[] = []
  for (const word of unique) {
    if (kept.some((longer) => longer.includes(word))) {
      skippedContained.push(word)
      continue
    }
    kept.push(word)
  }

  kept.sort((a, b) => a.localeCompare(b, 'he'))
  return {
    kept,
    skippedShort,
    skippedFinals,
    skippedContained,
    skippedTooLong,
    skippedMaxLength,
  }
}
