import { describe, expect, it } from 'vitest'
import { KID_WORDS } from '../data/kidWords.ts'
import { DEFAULT_DIRECTION_IDS, DIRECTIONS, directionArrow } from './directions.ts'
import {
  generatePuzzle,
  pickDiverseWords,
  type GenerateSuccess,
} from './generate.ts'
import {
  filterBankWords,
  hasFinalLetter,
  isFinalLetter,
  normalizeHebrew,
  parseWordList,
} from './hebrew.ts'
import { mulberry32 } from './rng.ts'
import {
  findWordOccurrences,
  isUniquePlacement,
  uniquenessViolations,
} from './verify.ts'

describe('default directions', () => {
  it('enables RTL, top-to-bottom, and top-right to bottom-left', () => {
    expect([...DEFAULT_DIRECTION_IDS]).toEqual(['rtl', 'ttb', 'trbl'])
  })

  it('maps each placement vector to the matching visual arrow', () => {
    const arrows = Object.fromEntries(
      DIRECTIONS.map((dir) => [dir.id, directionArrow(dir.dr, dir.dc)]),
    )
    expect(arrows).toEqual({
      rtl: '←',
      ttb: '↓',
      btt: '↑',
      ltr: '→',
      trbl: '↙',
      tlbr: '↘',
      brtl: '↖',
      bltr: '↗',
    })
  })
})

function success(result: ReturnType<typeof generatePuzzle>): GenerateSuccess {
  expect(result.ok).toBe(true)
  if (!result.ok) throw new Error(result.error)
  return result
}

describe('normalizeHebrew', () => {
  it('strips nikud, spaces, and punctuation', () => {
    expect(normalizeHebrew('שָׁלוֹם')).toBe('שלום')
    expect(normalizeHebrew('בית ספר')).toBe('ביתספר')
    expect(normalizeHebrew('  כַּדּוּר! ')).toBe('כדור')
  })

  it('keeps final letters rather than folding them', () => {
    expect(normalizeHebrew('חכם')).toBe('חכם')
    expect(hasFinalLetter('שלום')).toBe(true)
    expect(hasFinalLetter('שמש')).toBe(false)
    expect(isFinalLetter('ם')).toBe(true)
    expect(isFinalLetter('מ')).toBe(false)
  })

  it('parses a mixed textarea into unique words', () => {
    expect(parseWordList('שמש, ירח\nכוכב; שמש')).toEqual([
      'שמש',
      'ירח',
      'כוכב',
    ])
  })
})

describe('filterBankWords', () => {
  it('drops short words, finals, oversize, max-length, and contained words', () => {
    const result = filterBankWords(
      ['יד', 'שלום', 'שמש', 'כדור', 'כדורגל', 'סופרקאליפרגיל', 'אבגדהוזחטיכלמנסעפ'],
      { noFinalLetters: true, gridSize: 8 },
    )
    expect(result.skippedShort).toContain('יד')
    expect(result.skippedFinals).toContain('שלום')
    expect(result.skippedTooLong).toContain('סופרקאליפרגיל')
    expect(result.skippedMaxLength).toContain('אבגדהוזחטיכלמנסעפ')
    expect(result.skippedContained).toContain('כדור')
    expect(result.kept).toEqual(['כדורגל', 'שמש'])
  })
})

describe('uniqueness scan', () => {
  it('detects a second copy of a bank word', () => {
    const grid = [
      ['ש', 'מ', 'ש', 'א'],
      ['ב', 'ג', 'ד', 'ה'],
      ['ש', 'מ', 'ש', 'ו'],
      ['ז', 'ח', 'ט', 'י'],
    ]
    const dirs = DIRECTIONS.filter((d) => d.id === 'ltr')
    const found = findWordOccurrences(grid, 'שמש', dirs)
    expect(found).toHaveLength(2)
    expect(isUniquePlacement(grid, ['שמש'], dirs)).toBe(false)
    expect(uniquenessViolations(grid, ['שמש'], dirs)[0]).toMatch(/2 occurrences/)
  })

  it('counts a palindrome on the same cells only once', () => {
    const grid = [
      ['א', 'ב', 'א'],
      ['ג', 'ד', 'ה'],
      ['ו', 'ז', 'ח'],
    ]
    const dirs = DIRECTIONS.filter((d) => d.id === 'ltr' || d.id === 'rtl')
    expect(findWordOccurrences(grid, 'אבא', dirs)).toHaveLength(1)
  })
})

describe('generatePuzzle uniqueness', () => {
  it('places each bank word exactly once along enabled directions', () => {
    const result = success(
      generatePuzzle({
        size: 12,
        userWords: ['שמש', 'ירח', 'כוכב', 'פרח', 'ספר', 'כדור', 'חתול', 'בית'],
        directions: [...DEFAULT_DIRECTION_IDS],
        noFinalLetters: false,
        randomAge10Fill: false,
        seed: 42,
      }),
    )

    expect(result.words.length).toBe(8)
    expect(
      isUniquePlacement(
        result.grid,
        result.words,
        DIRECTIONS.filter((d) => DEFAULT_DIRECTION_IDS.includes(d.id)),
      ),
    ).toBe(true)

    for (const word of result.words) {
      const found = findWordOccurrences(
        result.grid,
        word,
        DIRECTIONS.filter((d) => DEFAULT_DIRECTION_IDS.includes(d.id)),
      )
      expect(found, word).toHaveLength(1)
      expect(result.placements.some((p) => p.word === word)).toBe(true)
    }
  })

  it('stays unique across many seeds and all eight directions', () => {
    const words = ['תנין', 'חיטה', 'ספינה', 'גירפה', 'שוקולד', 'אופניים']
    for (const seed of [1, 7, 99, 1234, 2026]) {
      const result = success(
        generatePuzzle({
          size: 14,
          userWords: words,
          directions: DIRECTIONS.map((d) => d.id),
          noFinalLetters: false,
          randomAge10Fill: false,
          seed,
        }),
      )
      expect(
        uniquenessViolations(result.grid, result.words, DIRECTIONS),
      ).toEqual([])
    }
  })

  it('is deterministic for a given seed', () => {
    const request = {
      size: 10,
      userWords: ['שמש', 'ירח', 'ספר'],
      directions: [...DEFAULT_DIRECTION_IDS] as const,
      noFinalLetters: false,
      randomAge10Fill: false,
      seed: 77,
    }
    const a = success(generatePuzzle({ ...request }))
    const b = success(generatePuzzle({ ...request }))
    expect(a.grid).toEqual(b.grid)
    expect(a.words).toEqual(b.words)
  })

  it('excludes final letters from words and the grid when requested', () => {
    const result = success(
      generatePuzzle({
        size: 12,
        userWords: ['שלום', 'שמש', 'ירח', 'כוכב', 'פרח'],
        directions: [...DEFAULT_DIRECTION_IDS],
        noFinalLetters: true,
        randomAge10Fill: false,
        seed: 3,
      }),
    )
    expect(result.skippedFinals).toContain('שלום')
    expect(result.words).not.toContain('שלום')
    for (const row of result.grid) {
      for (const ch of row) {
        expect(isFinalLetter(ch), ch).toBe(false)
      }
    }
  })

  it('adds diverse age-10 words from the bundled corpus', () => {
    const result = success(
      generatePuzzle({
        size: 12,
        userWords: ['שמש'],
        directions: [...DEFAULT_DIRECTION_IDS],
        noFinalLetters: true,
        randomAge10Fill: true,
        seed: 11,
      }),
    )
    expect(result.extraWords.length).toBeGreaterThan(3)
    expect(result.words).toContain('שמש')
    for (const extra of result.extraWords) {
      expect(KID_WORDS).toContain(extra)
      expect(hasFinalLetter(extra)).toBe(false)
    }
    expect(
      uniquenessViolations(
        result.grid,
        result.words,
        DIRECTIONS.filter((d) => DEFAULT_DIRECTION_IDS.includes(d.id)),
      ),
    ).toEqual([])
  })

  it('fails clearly when a word is longer than the grid', () => {
    const result = generatePuzzle({
      size: 8,
      userWords: ['סופרקאליפרגיל'],
      directions: [...DEFAULT_DIRECTION_IDS],
      noFinalLetters: false,
      randomAge10Fill: false,
      seed: 1,
    })
    expect(result.ok).toBe(false)
    if (result.ok) throw new Error('expected failure')
    expect(result.errorHe).toMatch(/אין מילים/)
    expect(result.skippedTooLong.length).toBeGreaterThan(0)
  })

  it('rejects words longer than 16 letters on generate', () => {
    const result = generatePuzzle({
      size: 20,
      userWords: ['אבגדהוזחטיכלמנסעפ'],
      directions: [...DEFAULT_DIRECTION_IDS],
      noFinalLetters: false,
      randomAge10Fill: false,
      seed: 1,
    })
    expect(result.ok).toBe(false)
    if (result.ok) throw new Error('expected failure')
    expect(result.skippedMaxLength).toContain('אבגדהוזחטיכלמנסעפ')
    expect(result.errorHe).toMatch(/אין מילים/)
  })

  it('fails when no directions are selected', () => {
    const result = generatePuzzle({
      size: 10,
      userWords: ['שמש'],
      directions: [],
      noFinalLetters: false,
      randomAge10Fill: false,
      seed: 1,
    })
    expect(result.ok).toBe(false)
    if (result.ok) throw new Error('expected failure')
    expect(result.errorHe).toMatch(/כיוון/)
  })
})

describe('kid corpus', () => {
  it('is a non-trivial unique Hebrew list', () => {
    expect(KID_WORDS.length).toBeGreaterThan(150)
    expect(new Set(KID_WORDS).size).toBe(KID_WORDS.length)
    for (const word of KID_WORDS) {
      expect(word).toBe(normalizeHebrew(word))
      expect(word.length).toBeGreaterThanOrEqual(3)
    }
  })

  it('pickDiverseWords avoids finals and overlaps', () => {
    const picked = pickDiverseWords(KID_WORDS, {
      exclude: new Set(['שמש', 'כדורגל']),
      count: 12,
      gridSize: 12,
      noFinalLetters: true,
      rng: mulberry32(5),
    })
    expect(picked.length).toBe(12)
    expect(picked.includes('שמש')).toBe(false)
    expect(picked.some((w) => w.includes('כדורגל') || 'כדורגל'.includes(w))).toBe(
      false,
    )
    for (const w of picked) expect(hasFinalLetter(w)).toBe(false)
  })
})
