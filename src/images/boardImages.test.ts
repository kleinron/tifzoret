import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import App from '../App.tsx'
import { BoardImage } from './BoardImage.tsx'
import { BOARD_IMAGE_IDS, BOARD_IMAGE_LABELS } from './catalog.ts'

describe('embedded board images', () => {
  it('ships a distinct inline svg for each picture, with no network urls', () => {
    const markup = BOARD_IMAGE_IDS.map((id) =>
      renderToStaticMarkup(createElement(BoardImage, { id })),
    )
    expect(new Set(markup).size).toBe(BOARD_IMAGE_IDS.length)
    for (const html of markup) {
      expect(html).toContain('<svg')
      expect(html).toContain('board-image')
      expect(html).not.toMatch(/https?:|url\(|href=/)
    }
    expect(BOARD_IMAGE_LABELS.cat).toBe('חתול')
    expect(BOARD_IMAGE_LABELS.ball).toBe('כדור')
    expect(BOARD_IMAGE_LABELS.sun).toBe('שמש')
    expect(BOARD_IMAGE_LABELS.flower).toBe('פרח')
    expect(BOARD_IMAGE_LABELS.fish).toBe('דג')
    expect(BOARD_IMAGE_LABELS.star).toBe('כוכב')
  })

  it('uses a full-bleed plate on the board and a rounded plate in the catalog', () => {
    const board = renderToStaticMarkup(createElement(BoardImage, { id: 'sun' }))
    expect(board).toContain('<rect width="64" height="64" fill="#fff6d2">')
    expect(board).not.toContain('rx="12"')

    const catalog = renderToStaticMarkup(
      createElement(BoardImage, { id: 'sun', framed: true }),
    )
    expect(catalog).toContain('rx="12"')
    expect(catalog).toContain('fill="#fff6d2"')
  })
})

describe('default image setting', () => {
  it('starts at one picture and names the control תמונות על הלוח', () => {
    const html = renderToStaticMarkup(createElement(App))
    expect(html).toContain('תמונות על הלוח: 1')
    expect(html).toContain('aria-label="תמונות על הלוח"')
    expect(html).toContain('max="9"')
    expect(html).toContain('מחסן מילים')
  })
})
