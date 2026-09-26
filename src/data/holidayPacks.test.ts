import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import App from '../App.tsx'
import { SettingsPanel } from '../components/SettingsPanel.tsx'
import { WordBank } from '../components/WordBank.tsx'
import { ImageCatalogModal } from '../components/ImageCatalogModal.tsx'
import { DIRECTIONS } from '../generator/directions.ts'
import { generatePuzzle, type GenerateSuccess } from '../generator/generate.ts'
import { filterBankWords, hasFinalLetter } from '../generator/hebrew.ts'
import { puzzleSettingsKey } from '../generator/puzzleRefresh.ts'
import { pictureBlockSize } from '../generator/imageBlocks.ts'
import {
  gridSizeForWords,
  MAX_BANK_WORDS,
  MAX_GRID_SIZE,
  MIN_GRID_SIZE,
} from '../generator/wordLimits.ts'
import {
  BOARD_IMAGE_IDS,
  HANUKKAH_IMAGE_IDS,
  PURIM_IMAGE_IDS,
} from '../images/catalog.ts'
import {
  applyHolidayPack,
  gridSizeAfterHolidayPack,
  HANUKKAH_WORDS,
  holidayPackById,
  HOLIDAY_PACKS,
  prioritizePackWords,
  PURIM_WORDS,
  type HolidayPackId,
} from './holidayPacks.ts'

const DEFAULT_BANK = ['שמש', 'ירח', 'כוכב', 'פרח', 'ספר', 'כדור', 'חתול', 'מים', 'שלום', 'בית']

function success(result: ReturnType<typeof generatePuzzle>): GenerateSuccess {
  expect(result.ok).toBe(true)
  if (!result.ok) throw new Error(result.error)
  return result
}

function finalsControl(html: string): string {
  const at = html.indexOf('ללא אותיות סופיות')
  expect(at).toBeGreaterThan(0)
  return html.slice(Math.max(0, at - 180), at)
}

function settingsHtml(noFinals: boolean): string {
  return renderToStaticMarkup(
    createElement(SettingsPanel, {
      directions: DIRECTIONS,
      enabled: new Set(['rtl']),
      onToggleDirection: () => undefined,
      draft: '',
      onDraftChange: () => undefined,
      onAddWords: () => undefined,
      onPasteWords: () => undefined,
      looksLikeWordList: () => false,
      bank: ['שמש'],
      bankLimit: MAX_BANK_WORDS,
      issues: [],
      onGrowBoard: () => undefined,
      addDisabled: true,
      onRemoveWord: () => undefined,
      randomAge10: false,
      onRandomAge10: () => undefined,
      noFinals,
      onNoFinals: () => undefined,
      gridSize: 12,
      onGridSize: () => undefined,
      imageCount: 1,
      onImageCount: () => undefined,
      fontSize: 18,
      onFontSize: () => undefined,
      busy: false,
      onReshuffle: () => undefined,
    }),
  )
}

describe('holiday pack word lists', () => {
  it('uses the locked Hanukkah and Purim lists, without the excluded words', () => {
    expect([...HANUKKAH_WORDS]).toEqual([
      'חנוכה',
      'סביבון',
      'סופגנייה',
      'לביבה',
      'חנוכייה',
      'נרות',
      'שמן',
      'נס',
      'אור',
      'מטבעות',
      'הלל',
      'גדול',
      'היה',
      'פה',
    ])
    expect([...PURIM_WORDS]).toEqual([
      'פורים',
      'אסתר',
      'מרדכי',
      'המן',
      'מגילה',
      'רעשן',
      'משלוח',
      'מנות',
      'תחפושת',
      'מסכה',
      'ויזתא',
    ])
    expect(HANUKKAH_WORDS).not.toContain('פך')
    expect(PURIM_WORDS).not.toContain('אוזן')
    expect(PURIM_WORDS).not.toContain('כתר')
  })

  it('unchecks final letters when a pack word needs a sofit form', () => {
    expect(HANUKKAH_WORDS.filter((word) => hasFinalLetter(word))).toEqual(['סביבון', 'שמן'])
    expect(PURIM_WORDS.filter((word) => hasFinalLetter(word))).toEqual([
      'פורים',
      'המן',
      'רעשן',
    ])
    expect(holidayPackById('hanukkah').noFinals).toBe(false)
    expect(holidayPackById('purim').noFinals).toBe(false)
    expect(holidayPackById('regular').noFinals).toBe(false)
    expect(applyHolidayPack({ bank: ['שמש'] }, 'hanukkah').noFinals).toBe(false)
    expect(applyHolidayPack({ bank: ['שמש'] }, 'purim').noFinals).toBe(false)
    expect(applyHolidayPack({ bank: ['שמש'] }, 'regular').noFinals).toBe(false)
  })

  it('merges pack words to the front and keeps other user words', () => {
    const next = prioritizePackWords(['ירח', 'חנוכה', 'שמש'], HANUKKAH_WORDS)
    expect(next.slice(0, HANUKKAH_WORDS.length)).toEqual([...HANUKKAH_WORDS])
    expect(next.slice(HANUKKAH_WORDS.length)).toEqual(['ירח', 'שמש'])
    expect(next.filter((word) => word === 'חנוכה')).toHaveLength(1)

    const purim = applyHolidayPack({ bank: next }, 'purim')
    expect(purim.bank.slice(0, PURIM_WORDS.length)).toEqual([...PURIM_WORDS])
    expect(purim.bank).toContain('חנוכה')
    expect(purim.bank).toContain('שמש')
    expect(purim.bank.filter((word) => word === 'פורים')).toHaveLength(1)
  })

  it('does not drop holiday words when the bank is already full', () => {
    const user = Array.from({ length: MAX_BANK_WORDS }, (_, i) => `מילה${i}`)
    const next = prioritizePackWords(user, HANUKKAH_WORDS)
    expect(next).toHaveLength(MAX_BANK_WORDS)
    expect(next.slice(0, HANUKKAH_WORDS.length)).toEqual([...HANUKKAH_WORDS])
    expect(next).not.toContain('מילה49')
    expect(next).toContain('מילה0')
  })

  it('leaves the bank untouched when restoring the regular pack', () => {
    const bank = ['שמש', 'סביבון', 'ירח']
    const next = applyHolidayPack({ bank }, 'regular')
    expect(next.bank).toEqual(bank)
    expect(next.bank).not.toBe(bank)
    expect(next.imageIds).toEqual(BOARD_IMAGE_IDS)
  })
})

describe('holiday picture catalogs', () => {
  it('ships a distinct drawing set per holiday, separate from the default catalog', () => {
    expect(HANUKKAH_IMAGE_IDS.length).toBeGreaterThanOrEqual(4)
    expect(HANUKKAH_IMAGE_IDS.length).toBeLessThanOrEqual(6)
    expect(PURIM_IMAGE_IDS.length).toBeGreaterThanOrEqual(4)
    expect(PURIM_IMAGE_IDS.length).toBeLessThanOrEqual(6)
    const all = [...BOARD_IMAGE_IDS, ...HANUKKAH_IMAGE_IDS, ...PURIM_IMAGE_IDS]
    expect(new Set(all).size).toBe(all.length)
    expect(holidayPackById('hanukkah').imageIds).toEqual(HANUKKAH_IMAGE_IDS)
    expect(holidayPackById('purim').imageIds).toEqual(PURIM_IMAGE_IDS)
    expect([...HOLIDAY_PACKS.map((pack) => pack.label)]).toEqual(['רגיל', 'חנוכה', 'פורים'])
  })

  it('places only the active catalog and still seats words that use final letters', () => {
    const pack = holidayPackById('hanukkah')
    const placed = filterBankWords([...pack.words], {
      noFinalLetters: pack.noFinals,
      gridSize: 12,
    })
    expect(placed.skippedFinals).toEqual([])
    expect(placed.kept).toContain('סביבון')
    expect(placed.kept).toContain('שמן')
    expect(placed.skippedShort).toEqual(['נס', 'פה'])

    const puzzle = success(
      generatePuzzle({
        size: 12,
        userWords: pack.words,
        directions: ['rtl', 'ttb', 'trbl'],
        noFinalLetters: pack.noFinals,
        randomAge10Fill: false,
        imageCount: 3,
        imagePolicy: 'adapt',
        pinnedImageBlocks: [{ imageId: 'cat', row: 0, col: 0 }],
        imageIds: pack.imageIds,
        seed: 4,
      }),
    )
    expect(puzzle.words).toContain('סביבון')
    expect(puzzle.skippedFinals).not.toContain('סביבון')
    expect(puzzle.imageBlocks).toHaveLength(3)
    expect(new Set(puzzle.imageBlocks.map((block) => block.imageId)).size).toBe(3)
    for (const block of puzzle.imageBlocks) {
      expect(pack.imageIds).toContain(block.imageId)
    }

    const again = success(
      generatePuzzle({
        size: 12,
        userWords: puzzle.words,
        directions: ['rtl', 'ttb', 'trbl'],
        noFinalLetters: pack.noFinals,
        randomAge10Fill: false,
        imageCount: 3,
        imagePolicy: 'keep',
        pinnedImageBlocks: puzzle.imageBlocks,
        imageIds: pack.imageIds,
        seed: 9,
      }),
    )
    expect(again.imageBlocks).toEqual(puzzle.imageBlocks)
  })

  it('builds a puzzle for one pack merged onto the default bank', () => {
    const defaults = ['שמש', 'ירח', 'כוכב', 'פרח', 'ספר', 'כדור', 'חתול', 'מים', 'שלום', 'בית']
    for (const id of ['hanukkah', 'purim'] as const) {
      const pack = holidayPackById(id)
      const applied = applyHolidayPack({ bank: defaults }, id)
      expect(applied.bank.slice(0, pack.words.length)).toEqual([...pack.words])
      expect(applied.bank).toEqual(expect.arrayContaining([...defaults]))
      const puzzle = success(
        generatePuzzle({
          size: 12,
          userWords: applied.bank,
          directions: ['rtl', 'ttb', 'trbl'],
          noFinalLetters: applied.noFinals,
          randomAge10Fill: false,
          imageCount: 1,
          imageIds: applied.imageIds,
          seed: 3,
        }),
      )
      expect(puzzle.imageBlocks).toHaveLength(1)
      expect(applied.imageIds).toContain(puzzle.imageBlocks[0]!.imageId)
      expect(puzzle.words).toEqual(
        expect.arrayContaining(pack.words.filter((word) => word.length >= 3)),
      )
    }
  })

  it('changes the puzzle settings key when the catalog changes and the bank does not', () => {
    const base = {
      directions: ['rtl'],
      gridSize: 12,
      imageCount: 1,
      bank: [...HANUKKAH_WORDS],
      randomAge10: false,
      noFinals: false,
    }
    expect(puzzleSettingsKey(base)).toBe(puzzleSettingsKey({ ...base, holidayPack: 'regular' }))
    expect(puzzleSettingsKey({ ...base, holidayPack: 'hanukkah' })).not.toBe(
      puzzleSettingsKey({ ...base, holidayPack: 'regular' }),
    )
  })
})

describe('holiday pack controls', () => {
  it('keeps the chip row closed until חגים is opened, next to the word bank', () => {
    const closed = renderToStaticMarkup(
      createElement(WordBank, {
        words: ['שמש'],
        found: new Set<string>(),
        holidayOpen: false,
        holidayPack: 'regular',
        onToggleHoliday: () => undefined,
        onSelectHoliday: () => undefined,
      }),
    )
    expect(closed).toContain('מחסן מילים')
    expect(closed).toContain('>חגים<')
    expect(closed).toContain('aria-expanded="false"')
    expect(closed).not.toContain('holiday-chip')
    expect(closed).toContain('class="holiday-toggle no-print"')

    const open = renderToStaticMarkup(
      createElement(WordBank, {
        words: ['שמש'],
        found: new Set<string>(),
        holidayOpen: true,
        holidayPack: 'hanukkah' as HolidayPackId,
        onToggleHoliday: () => undefined,
        onSelectHoliday: () => undefined,
      }),
    )
    expect(open).toContain('aria-expanded="true"')
    expect(open).toContain('role="group"')
    expect(open).toContain('>רגיל<')
    expect(open).toContain('>חנוכה<')
    expect(open).toContain('>פורים<')
    expect(open).toContain('aria-pressed="true"')
    expect(open).toMatch(/holiday-chip is-selected[^>]*>חנוכה</)
  })

  it('shows the final-letter checkbox from the noFinals flag', () => {
    expect(finalsControl(settingsHtml(false))).not.toContain('checked')
    expect(finalsControl(settingsHtml(true))).toContain('checked')
  })

  it('starts on the regular pack with the final-letter checkbox cleared', () => {
    const html = renderToStaticMarkup(createElement(App))
    expect(html).toContain('>חגים<')
    expect(html).toContain('aria-expanded="false"')
    expect(html).not.toContain('holiday-chip')
    expect(finalsControl(html)).not.toContain('checked')
  })

  it('lists the active catalog in the picture store', () => {
    const html = renderToStaticMarkup(
      createElement(ImageCatalogModal, {
        onClose: () => undefined,
        imageIds: PURIM_IMAGE_IDS,
      }),
    )
    expect(html.match(/class="board-image"/g)?.length).toBe(PURIM_IMAGE_IDS.length)
    expect(html).toContain('מגילה')
    expect(html).toContain('רעשן')
    expect(html).toContain('אוזן המן')
    expect(html).toContain('כתר אסתר')
    expect(html).not.toContain('חתול')
  })
})

describe('holiday pack board size', () => {
  it('derives a slider-sized board from the words the pack will place', () => {
    expect(gridSizeForWords(HANUKKAH_WORDS)).toBe(10)
    expect(gridSizeForWords(PURIM_WORDS)).toBe(10)
    expect(pictureBlockSize(10)).toBe(3)

    const hanukkah = applyHolidayPack({ bank: DEFAULT_BANK }, 'hanukkah')
    const purim = applyHolidayPack({ bank: DEFAULT_BANK }, 'purim')
    expect(gridSizeForWords(hanukkah.bank)).toBe(12)
    expect(gridSizeForWords(purim.bank)).toBe(12)
    expect(pictureBlockSize(12)).toBe(4)

    const both = applyHolidayPack({ bank: hanukkah.bank }, 'purim')
    expect(gridSizeForWords(both.bank)).toBe(14)
    expect(gridSizeForWords(both.bank)).toBeGreaterThanOrEqual(MIN_GRID_SIZE)
    expect(gridSizeForWords(both.bank)).toBeLessThanOrEqual(MAX_GRID_SIZE)
  })

  it('bumps a small board when a holiday chip is selected, and that board generates', () => {
    for (const id of ['hanukkah', 'purim'] as const) {
      const applied = applyHolidayPack({ bank: DEFAULT_BANK }, id)
      const sized = gridSizeAfterHolidayPack({
        packId: id,
        bank: applied.bank,
        currentGrid: MIN_GRID_SIZE,
        savedGrid: null,
      })
      expect(sized.savedGrid).toBe(MIN_GRID_SIZE)
      expect(sized.gridSize).toBe(12)
      expect(pictureBlockSize(sized.gridSize)).toBe(4)
      for (const seed of [1, 2, 3, 4, 5]) {
        const puzzle = success(
          generatePuzzle({
            size: sized.gridSize,
            userWords: applied.bank,
            directions: ['rtl', 'ttb', 'trbl'],
            noFinalLetters: applied.noFinals,
            randomAge10Fill: false,
            imageCount: 1,
            imageIds: applied.imageIds,
            seed,
          }),
        )
        expect(puzzle.imageBlocks).toHaveLength(1)
        expect(applied.imageIds).toContain(puzzle.imageBlocks[0]!.imageId)
      }
    }
  })

  it('grows again for a second pack and remembers the board from before the holiday', () => {
    const hanukkah = applyHolidayPack({ bank: DEFAULT_BANK }, 'hanukkah')
    const afterHanukkah = gridSizeAfterHolidayPack({
      packId: 'hanukkah',
      bank: hanukkah.bank,
      currentGrid: MIN_GRID_SIZE,
      savedGrid: null,
    })
    const purim = applyHolidayPack({ bank: hanukkah.bank }, 'purim')
    const afterPurim = gridSizeAfterHolidayPack({
      packId: 'purim',
      bank: purim.bank,
      currentGrid: afterHanukkah.gridSize,
      savedGrid: afterHanukkah.savedGrid,
    })
    expect(afterPurim.savedGrid).toBe(MIN_GRID_SIZE)
    expect(afterPurim.gridSize).toBe(14)
    const puzzle = success(
      generatePuzzle({
        size: afterPurim.gridSize,
        userWords: purim.bank,
        directions: ['rtl', 'ttb', 'trbl'],
        noFinalLetters: purim.noFinals,
        randomAge10Fill: false,
        imageCount: 1,
        imageIds: purim.imageIds,
        seed: 2,
      }),
    )
    expect(puzzle.words.length).toBeGreaterThan(20)
  })

  it('restores a larger pre-pack board, and keeps a board that still fits leftover words', () => {
    const hanukkah = applyHolidayPack({ bank: DEFAULT_BANK }, 'hanukkah')
    const fromLarge = gridSizeAfterHolidayPack({
      packId: 'hanukkah',
      bank: hanukkah.bank,
      currentGrid: 16,
      savedGrid: null,
    })
    expect(fromLarge.gridSize).toBe(12)
    expect(fromLarge.savedGrid).toBe(16)

    const regular = applyHolidayPack({ bank: hanukkah.bank }, 'regular')
    const restored = gridSizeAfterHolidayPack({
      packId: 'regular',
      bank: regular.bank,
      currentGrid: fromLarge.gridSize,
      savedGrid: fromLarge.savedGrid,
    })
    expect(regular.bank).toEqual(hanukkah.bank)
    expect(restored.savedGrid).toBeNull()
    expect(restored.gridSize).toBe(16)

    const fromSmall = gridSizeAfterHolidayPack({
      packId: 'hanukkah',
      bank: hanukkah.bank,
      currentGrid: MIN_GRID_SIZE,
      savedGrid: null,
    })
    const back = gridSizeAfterHolidayPack({
      packId: 'regular',
      bank: hanukkah.bank,
      currentGrid: fromSmall.gridSize,
      savedGrid: fromSmall.savedGrid,
    })
    expect(back.gridSize).toBe(fromSmall.gridSize)
    success(
      generatePuzzle({
        size: back.gridSize,
        userWords: hanukkah.bank,
        directions: ['rtl', 'ttb', 'trbl'],
        noFinalLetters: false,
        randomAge10Fill: false,
        imageCount: 1,
        imageIds: hanukkah.imageIds,
        seed: 3,
      }),
    )

    const alreadyRegular = gridSizeAfterHolidayPack({
      packId: 'regular',
      bank: DEFAULT_BANK,
      currentGrid: 9,
      savedGrid: null,
    })
    expect(alreadyRegular.gridSize).toBe(9)
    expect(alreadyRegular.savedGrid).toBeNull()
  })
})
