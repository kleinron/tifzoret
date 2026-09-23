import { readFileSync } from 'node:fs'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import App from '../App.tsx'
import { ImageCatalogModal } from '../components/ImageCatalogModal.tsx'
import { BOARD_IMAGE_IDS, BOARD_IMAGE_LABELS } from './catalog.ts'
import { isImageCatalogShortcut } from './catalogShortcut.ts'

const base = {
  key: 'i',
  code: 'KeyI',
  ctrlKey: false,
  metaKey: false,
  shiftKey: false,
  altKey: false,
}

describe('picture catalog shortcut', () => {
  it('matches Ctrl+Shift+I and Cmd+Shift+I, including the physical I key', () => {
    expect(isImageCatalogShortcut({ ...base, ctrlKey: true, shiftKey: true })).toBe(true)
    expect(
      isImageCatalogShortcut({ ...base, key: 'I', metaKey: true, shiftKey: true }),
    ).toBe(true)
    expect(
      isImageCatalogShortcut({
        ...base,
        key: 'ן',
        code: 'KeyI',
        ctrlKey: true,
        shiftKey: true,
      }),
    ).toBe(true)
    expect(
      isImageCatalogShortcut({ ...base, ctrlKey: true, metaKey: true, shiftKey: true }),
    ).toBe(true)
  })

  it('ignores chords that are not the catalog shortcut', () => {
    expect(isImageCatalogShortcut({ ...base, ctrlKey: true })).toBe(false)
    expect(isImageCatalogShortcut({ ...base, shiftKey: true })).toBe(false)
    expect(isImageCatalogShortcut({ ...base, metaKey: true })).toBe(false)
    expect(
      isImageCatalogShortcut({ ...base, ctrlKey: true, shiftKey: true, altKey: true }),
    ).toBe(false)
    expect(
      isImageCatalogShortcut({ ...base, key: 'k', code: 'KeyK', ctrlKey: true, shiftKey: true }),
    ).toBe(false)
    expect(
      isImageCatalogShortcut({
        ...base,
        ctrlKey: true,
        shiftKey: true,
        repeat: true,
      }),
    ).toBe(false)
  })
})

describe('picture catalog modal', () => {
  it('lists every embedded drawing from the catalog registry', () => {
    const html = renderToStaticMarkup(
      createElement(ImageCatalogModal, { onClose: () => undefined }),
    )
    expect(html).toContain('מחסן התמונות')
    expect(html).toContain('role="dialog"')
    expect(html).toContain('aria-modal="true"')
    expect(html).toContain('aria-labelledby=')
    expect(html).toContain('catalog-close')
    expect(html).toContain('סגור')
    expect(html).toContain('catalog-backdrop')
    expect(html.match(/class="board-image"/g)?.length).toBe(BOARD_IMAGE_IDS.length)
    for (const id of BOARD_IMAGE_IDS) {
      expect(html).toContain(BOARD_IMAGE_LABELS[id])
    }
    expect(html).not.toMatch(/https?:/)
  })

  it('stays closed on first paint so the board default is unchanged', () => {
    const html = renderToStaticMarkup(createElement(App))
    expect(html).not.toContain('מחסן התמונות')
    expect(html).not.toContain('catalog-backdrop')
    expect(html).toContain('תמונות על הלוח: 1')
  })

  it('is omitted from print along with the rest of the chrome', () => {
    const css = readFileSync(new URL('../index.css', import.meta.url), 'utf8')
    const print = css.slice(css.indexOf('@media print'))
    expect(print).toMatch(/\.catalog-backdrop/)
    expect(print).toMatch(/display:\s*none\s*!important/)
  })
})
