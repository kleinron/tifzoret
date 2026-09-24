import { describe, expect, it } from 'vitest'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { SettingsPanel } from '../components/SettingsPanel.tsx'
import { DIRECTIONS } from './directions.ts'
import { generatePuzzle } from './generate.ts'
import { filterBankWords, HEBREW_LETTERS } from './hebrew.ts'
import {
  capBankWords,
  editorValidation,
  AGE10_FILL_LABEL,
  age10FillHint,
  extraFillCount,
  growBoardCtaLabel,
  looksLikeWordList,
  MAX_BANK_WORDS,
  MAX_WORD_LENGTH,
  messageBankFull,
  messageTooLong,
  messageTooLongForGrid,
  planWordIntake,
  suggestedGridSizeForWords,
} from './wordLimits.ts'

const LETTER_16 = 'אבגדהוזחטיכלמנסע'
const LETTER_17 = 'אבגדהוזחטיכלמנסעפ'
const LETTER_14 = 'אבגדהוזחטיכלמנ'

function manyWords(count: number, len = 3): string[] {
  const out: string[] = []
  let i = 0
  while (out.length < count) {
    let x = i++
    let word = ''
    for (let k = 0; k < len; k++) {
      word += HEBREW_LETTERS[x % HEBREW_LETTERS.length]
      x = Math.floor(x / HEBREW_LETTERS.length)
    }
    out.push(word)
  }
  return out
}

describe('word length cap (16)', () => {
  it('rejects words longer than 16 Hebrew letters', () => {
    expect(LETTER_16).toHaveLength(MAX_WORD_LENGTH)
    expect(LETTER_17).toHaveLength(MAX_WORD_LENGTH + 1)
    const result = planWordIntake([], [LETTER_16, LETTER_17, 'שמש'], 20)
    expect(result.accepted).toEqual([LETTER_16, 'שמש'])
    expect(result.tooLong).toEqual([LETTER_17])
    expect(result.nextBank).not.toContain(LETTER_17)
  })

  it('uses a clear Hebrew error for oversize words', () => {
    const ui = editorValidation([], LETTER_17, 20)
    expect(ui.messages).toContain(messageTooLong())
    expect(ui.messages[0]).toBe('עד 16 אותיות')
    expect(ui.growTo).toBeNull()
    expect(ui.inputValid).toBe(false)
    expect(ui.canAdd).toBe(false)
    expect(ui.issues[0]?.tone).toBe('danger')
  })

  it('filterBankWords flags max-length separately from grid size', () => {
    const result = filterBankWords(['שמש', LETTER_17, LETTER_14], {
      noFinalLetters: false,
      gridSize: 12,
    })
    expect(result.skippedMaxLength).toContain(LETTER_17)
    expect(result.skippedTooLong).toContain(LETTER_14)
    expect(result.skippedMaxLength).not.toContain(LETTER_14)
    expect(result.kept).toContain('שמש')
  })
})

describe('word length vs board size', () => {
  it('holds back words longer than N but ≤16 and suggests a larger board', () => {
    const result = planWordIntake(['שמש'], [LETTER_14, 'ירח'], 12)
    expect(LETTER_14.length).toBe(14)
    expect(result.accepted).toEqual(['ירח'])
    expect(result.tooLongForGrid).toEqual([LETTER_14])
    expect(result.nextBank).toEqual(['שמש', 'ירח'])
    expect(suggestedGridSizeForWords(result.tooLongForGrid, 12)).toBe(14)
  })

  it('CTA label and Hebrew validation mention the needed size', () => {
    const ui = editorValidation(['שמש'], LETTER_14, 12)
    expect(ui.growTo).toBe(14)
    expect(ui.messages).toContain(messageTooLongForGrid(12))
    expect(ui.messages).toContain('המילה ארוכה מהלוח (12×12)')
    expect(ui.issues[0]?.tone).toBe('warning')
    expect(ui.inputValid).toBe(false)
    expect(ui.canAdd).toBe(false)
    expect(growBoardCtaLabel(14)).toBe('הגדל לוח ל־14')
  })

  it('accepts the held word after the board grows to its length', () => {
    const blocked = planWordIntake([], [LETTER_14], 12)
    expect(blocked.accepted).toEqual([])
    const grown = planWordIntake([], blocked.remaining, 14)
    expect(grown.accepted).toEqual([LETTER_14])
    expect(grown.tooLongForGrid).toEqual([])
  })

  it('shows a grow CTA when the bank already has a word longer than N', () => {
    const ui = editorValidation([LETTER_14, 'שמש'], '', 12)
    expect(ui.growTo).toBe(14)
    expect(ui.messages.some((m) => m.includes('12×12'))).toBe(true)
    expect(ui.inputValid).toBe(false)
  })
})

describe('max 50 words in the bank', () => {
  it('rejects adding beyond 50 with a Hebrew message', () => {
    const bank = manyWords(MAX_BANK_WORDS)
    const extra = manyWords(3).map((w) => `ת${w}`)
    const result = planWordIntake(bank, extra, 12)
    expect(result.accepted).toEqual([])
    expect(result.overCapacity).toEqual(extra)
    expect(result.nextBank).toHaveLength(MAX_BANK_WORDS)
    const ui = editorValidation(bank, extra.join('\n'), 12)
    expect(ui.messages).toContain(messageBankFull())
    expect(ui.messages).toContain('עד 50 מילים במחסן')
    expect(ui.inputValid).toBe(false)
    expect(ui.canAdd).toBe(false)
  })

  it('caps a pasted seed list at 50 and reports how many were added', () => {
    const incoming = manyWords(MAX_BANK_WORDS + 5)
    const result = planWordIntake([], incoming, 12)
    expect(result.accepted).toHaveLength(MAX_BANK_WORDS)
    expect(result.overCapacity).toHaveLength(5)
    expect(result.nextBank).toHaveLength(MAX_BANK_WORDS)
    const ui = editorValidation([], incoming.join('\n'), 12)
    expect(ui.messages).toContain(messageBankFull())
  })

  it('capBankWords slices overflow in original order', () => {
    const words = manyWords(52)
    const capped = capBankWords(words)
    expect(capped.kept).toEqual(words.slice(0, 50))
    expect(capped.skippedOverCapacity).toEqual(words.slice(50))
  })

  it('extra random fill never requests more than remaining bank slots', () => {
    expect(extraFillCount(12, 0)).toBeGreaterThan(0)
    expect(extraFillCount(12, MAX_BANK_WORDS)).toBe(0)
    expect(extraFillCount(20, MAX_BANK_WORDS - 1)).toBeLessThanOrEqual(1)
  })

  it('describes how many age-10 words Generate would add, or that the board is already full', () => {
    const extra = extraFillCount(12, 1)
    expect(extra).toBeGreaterThan(0)
    expect(age10FillHint(12, 1)).toBe(
      `יוסיף עוד ${extra} מילים`,
    )
    expect(age10FillHint(12, 13)).toBe('כבר ביעד ללוח הזה — לא יתווספו מילים')
    expect(age10FillHint(12, MAX_BANK_WORDS)).toBe(
      'כבר ביעד ללוח הזה — לא יתווספו מילים',
    )
    expect(age10FillHint(12, 1)).not.toMatch(/בלי רשת|offline|השלם אקראי/)
  })
})

describe('paste / generate helpers', () => {
  it('enables add when the draft has a valid new word', () => {
    const ui = editorValidation(['שמש'], 'ירח', 12)
    expect(ui.inputValid).toBe(true)
    expect(ui.canAdd).toBe(true)
    expect(ui.issues).toEqual([])
  })

  it('treats newline or comma payloads as a word list', () => {
    expect(looksLikeWordList('שמש\nירח')).toBe(true)
    expect(looksLikeWordList('שמש, ירח')).toBe(true)
    expect(looksLikeWordList('שמש')).toBe(false)
  })

  it('generatePuzzle skips >16 words and caps a 51-word seed list', () => {
    const seed = [...manyWords(MAX_BANK_WORDS + 1), LETTER_17]
    const result = generatePuzzle({
      size: 12,
      userWords: seed,
      directions: ['rtl'],
      noFinalLetters: false,
      randomAge10Fill: false,
      seed: 1,
      maxPlacementAttempts: 1,
    })
    expect(result.skippedMaxLength).toContain(LETTER_17)
    expect(result.skippedOverCapacity.length).toBeGreaterThan(0)
    if (result.ok) {
      expect(result.words.length).toBeLessThanOrEqual(MAX_BANK_WORDS)
      expect(result.words).not.toContain(LETTER_17)
    }
  })

  it('generatePuzzle random fill does not grow a full 50-word bank', () => {
    const result = generatePuzzle({
      size: 12,
      userWords: manyWords(MAX_BANK_WORDS),
      directions: ['rtl'],
      noFinalLetters: false,
      randomAge10Fill: true,
      seed: 2,
      maxPlacementAttempts: 1,
    })
    expect(result.skippedOverCapacity).toEqual([])
    if (result.ok) {
      expect(result.words.length).toBeLessThanOrEqual(MAX_BANK_WORDS)
      expect(result.extraWords).toEqual([])
      expect(result.fillCappedAtMax).toBe(true)
    } else {
      expect(result.skippedMaxLength).toEqual([])
    }
  })
})

describe('SettingsPanel validation UI', () => {
  const base = {
    directions: DIRECTIONS,
    enabled: new Set(['rtl']),
    onToggleDirection: () => undefined,
    draft: LETTER_14,
    onDraftChange: () => undefined,
    onAddWords: () => undefined,
    onPasteWords: () => undefined,
    looksLikeWordList: () => false,
    bank: ['שמש'],
    bankLimit: MAX_BANK_WORDS,
    onGrowBoard: () => undefined,
    onRemoveWord: () => undefined,
    randomAge10: false,
    onRandomAge10: () => undefined,
    noFinals: false,
    onNoFinals: () => undefined,
    gridSize: 12,
    onGridSize: () => undefined,
    imageCount: 1,
    onImageCount: () => undefined,
    fontSize: 18,
    onFontSize: () => undefined,
    busy: false,
    onReshuffle: () => undefined,
  }

  it('renders an inline amber board-size message with a small grow CTA beside it', () => {
    const ui = editorValidation(['שמש'], LETTER_14, 12)
    const html = renderToStaticMarkup(
      createElement(SettingsPanel, {
        ...base,
        issues: ui.issues,
        addDisabled: !ui.canAdd,
      }),
    )
    expect(html).not.toContain('צור תפזורת')
    expect(html).toContain('ערבב מחדש')
    expect(html).toContain('המילה ארוכה מהלוח (12×12)')
    expect(html).toContain('הגדל לוח ל־14')
    expect(html).toContain('field-message-warning')
    expect(html).toContain('grow-cta')
    expect(html).toContain('dir="rtl"')
    expect(html).not.toContain('role="alert"')
    expect(html).toContain('disabled=""')
    expect(html).toContain('1 / 50 במחסן מילים')
    expect(html).toContain('עד 16 אותיות')
    expect(html).toContain('עד 50 מילים במחסן')
    expect(html).toContain(AGE10_FILL_LABEL)
    expect(html).toContain(age10FillHint(12, 1))
    expect(html).not.toContain('השלם אקראי')
    expect(html).not.toContain('בלי רשת')
    expect(html).toContain('תמונות על הלוח: 1')
    expect(html).toContain('aria-label="תמונות על הלוח"')
    expect(html).toContain('max="5"')
    expect(html).toContain('aria-label="מימין לשמאל"')
    expect(html).toContain('title="מימין לשמאל"')
    expect(html).toContain('direction-arrow')
    expect(html).toContain('dir="ltr"')
    const arrowPath = 'M12 18.8V6.7M7 10.2 12 5.2l5 5'
    expect(html.split(arrowPath).length - 1).toBe(8)
    expect(html).toContain('rotate(270 12 12)')
    expect(html).toContain('rotate(225 12 12)')
    expect(html).not.toContain('←')
    expect(html).not.toContain('↙')
    expect(html).not.toContain('>מימין לשמאל<')
  })

  it('renders the 16-letter rejection in red without a grow CTA and disables add', () => {
    const ui = editorValidation([], LETTER_17, 12)
    const html = renderToStaticMarkup(
      createElement(SettingsPanel, {
        ...base,
        draft: LETTER_17,
        bank: [],
        issues: ui.issues,
        addDisabled: !ui.canAdd,
      }),
    )
    expect(html).toContain('עד 16 אותיות')
    expect(html).toContain('field-message-danger')
    expect(html).not.toContain('הגדל לוח')
    expect(html).not.toContain('צור תפזורת')
    expect(html).toMatch(/<button[^>]*disabled[^>]*>הוסף למחסן מילים/)
  })

  it('keeps add disabled and reshuffle available when the draft is empty and the bank is valid', () => {
    const ui = editorValidation(['שמש'], '', 12)
    expect(ui.inputValid).toBe(true)
    expect(ui.canAdd).toBe(false)
    const html = renderToStaticMarkup(
      createElement(SettingsPanel, {
        ...base,
        draft: '',
        issues: ui.issues,
        addDisabled: !ui.canAdd,
      }),
    )
    expect(html).toMatch(/<button[^>]*disabled[^>]*>הוסף למחסן מילים/)
    expect(html).toContain('ערבב מחדש')
    expect(html).toMatch(/<button type="button" class="primary">ערבב מחדש<\/button>/)
    expect(html).not.toMatch(/<button[^>]*disabled[^>]*>ערבב מחדש/)
  })

  it('caps תמונות על הלוח at how many picture blocks fit', () => {
    const html = renderToStaticMarkup(
      createElement(SettingsPanel, {
        ...base,
        gridSize: 8,
        imageCount: 9,
        issues: [],
        addDisabled: false,
      }),
    )
    expect(html).toContain('תמונות על הלוח: 4')
    expect(html).toContain('max="4"')
    expect(html).toContain('כל תמונה מכסה ריבוע לפי גודל הלוח (3×3 או 4×4)')
    expect(html).not.toContain('מכסה 4×4')
    expect(html).toContain('עד 4 בלוח הזה')
    expect(html).toContain('מגע בפינה מותר')
    expect(html).toContain('«ערבב מחדש» משאיר את התמונות שכבר על')
    expect(html).toContain('שינוי הגדרות יוצר תפזורת')
  })
})
