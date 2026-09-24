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
    expect([...BOARD_IMAGE_IDS]).toEqual([
      'cat',
      'ball',
      'sun',
      'flower',
      'fish',
      'star',
      'tree',
      'bird',
      'house',
      'car',
      'apple',
      'heart',
      'cloud',
      'moon',
      'butterfly',
      'boat',
    ])
    expect(BOARD_IMAGE_LABELS.cat).toBe('חתול')
    expect(BOARD_IMAGE_LABELS.ball).toBe('כדור')
    expect(BOARD_IMAGE_LABELS.sun).toBe('שמש')
    expect(BOARD_IMAGE_LABELS.flower).toBe('פרח')
    expect(BOARD_IMAGE_LABELS.fish).toBe('דג')
    expect(BOARD_IMAGE_LABELS.star).toBe('כוכב')
    expect(BOARD_IMAGE_LABELS.tree).toBe('עץ')
    expect(BOARD_IMAGE_LABELS.bird).toBe('ציפור')
    expect(BOARD_IMAGE_LABELS.house).toBe('בית')
    expect(BOARD_IMAGE_LABELS.car).toBe('מכונית')
    expect(BOARD_IMAGE_LABELS.apple).toBe('תפוח')
    expect(BOARD_IMAGE_LABELS.heart).toBe('לב')
    expect(BOARD_IMAGE_LABELS.cloud).toBe('ענן')
    expect(BOARD_IMAGE_LABELS.moon).toBe('ירח')
    expect(BOARD_IMAGE_LABELS.butterfly).toBe('פרפר')
    expect(BOARD_IMAGE_LABELS.boat).toBe('סירה')
  })

  it('keeps the rounded backdrop plate inside each drawing', () => {
    const board = renderToStaticMarkup(createElement(BoardImage, { id: 'sun' }))
    expect(board).toContain('rx="12"')
    expect(board).toContain('fill="#fff6d2"')
  })
})

describe('default image setting', () => {
  it('starts at one picture and names the control תמונות על הלוח', () => {
    const html = renderToStaticMarkup(createElement(App))
    expect(html).toContain('תמונות על הלוח: 1')
    expect(html).toContain('aria-label="תמונות על הלוח"')
    expect(html).toContain('max="4"')
    expect(html).toContain('מחסן מילים')
  })
})
