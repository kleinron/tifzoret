import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { BoardImage } from './BoardImage.tsx'
import {
  BOARD_IMAGE_IDS,
  HANUKKAH_IMAGE_IDS,
  HANUKKAH_IMAGE_LABELS,
  PURIM_IMAGE_IDS,
  PURIM_IMAGE_LABELS,
  boardImageLabel,
} from './catalog.ts'

const HOLIDAY_IDS = [...HANUKKAH_IMAGE_IDS, ...PURIM_IMAGE_IDS]

describe('holiday board images', () => {
  it('draws each holiday motif as its own inline svg, with no text and no network urls', () => {
    const markup = HOLIDAY_IDS.map((id) =>
      renderToStaticMarkup(createElement(BoardImage, { id })),
    )
    const defaults = BOARD_IMAGE_IDS.map((id) =>
      renderToStaticMarkup(createElement(BoardImage, { id })),
    )
    expect(new Set(markup).size).toBe(HOLIDAY_IDS.length)
    for (const html of markup) {
      expect(html).toContain('<svg')
      expect(html).toContain('class="board-image"')
      expect(html).toContain('rx="12"')
      expect(html).not.toMatch(/<text[\s>/]/)
      expect(html).not.toMatch(/[\u0590-\u05FF]/)
      expect(html).not.toMatch(/https?:|url\(|href=/)
      expect(defaults).not.toContain(html)
    }
    expect(boardImageLabel('hanukkiah')).toBe('חנוכייה')
    expect(boardImageLabel('dreidel')).toBe('סביבון')
    expect(boardImageLabel('oil-jug')).toBe('פך שמן')
    expect(boardImageLabel('sufganiyah')).toBe('סופגנייה')
    const sufganiyah = renderToStaticMarkup(createElement(BoardImage, { id: 'sufganiyah' }))
    expect(sufganiyah.match(/fill="#fde8f0"/g)).toEqual(['fill="#fde8f0"'])
    expect(sufganiyah).toContain('fill="#fffdf8"')
    expect(sufganiyah).toContain('fill="#c43b3b"')
    expect(sufganiyah).not.toContain('#e86b93')
    expect(sufganiyah).not.toContain('#5a9a45')
    expect(sufganiyah).not.toContain('#3d9cc9')
    expect(boardImageLabel('candle')).toBe('נר')
    expect(boardImageLabel('gelt')).toBe('מטבעות חנוכה')
    expect(HANUKKAH_IMAGE_LABELS.gelt).toBe('מטבעות חנוכה')
    expect(boardImageLabel('megillah')).toBe('מגילה')
    expect(boardImageLabel('gragger')).toBe('רעשן')
    expect(boardImageLabel('hamantasch')).toBe('אוזן המן')
    expect(boardImageLabel('mask')).toBe('מסכה')
    expect(boardImageLabel('crown')).toBe('כתר אסתר')
    expect(boardImageLabel('mishloach')).toBe('משלוח מנות')
    expect(PURIM_IMAGE_LABELS.mishloach).toBe('משלוח מנות')
  })
})
