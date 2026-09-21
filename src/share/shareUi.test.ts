import { readFileSync } from 'node:fs'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import App from '../App.tsx'
import { ShareButton, SharePopover } from '../components/ShareButton.tsx'
import { DEFAULT_DIRECTION_IDS } from '../generator/directions.ts'

const settings = {
  directions: DEFAULT_DIRECTION_IDS,
  gridSize: 12,
  fontSize: 18,
  randomAge10: false,
  noFinals: false,
}

describe('share popover (designer lock)', () => {
  it('uses an outline control labelled שתף next to print', () => {
    const html = renderToStaticMarkup(
      createElement(ShareButton, { words: ['שמש'], settings }),
    )
    expect(html).toContain('שתף')
    expect(html).toContain('class="outline topbar-btn"')
    expect(html).toContain('btn-icon')
    expect(html).toContain('aria-hidden="true"')
    expect(html).not.toContain('כלול מילים')
  })

  it('opens a small panel with both include checkboxes on and העתק קישור', () => {
    const html = renderToStaticMarkup(
      createElement(SharePopover, {
        includeWords: true,
        includeSettings: true,
        onIncludeWords: () => undefined,
        onIncludeSettings: () => undefined,
        onCopy: () => undefined,
      }),
    )
    expect(html).toContain('כלול מילים')
    expect(html).toContain('כלול הגדרות')
    expect(html).toContain('העתק קישור')
    expect(html.match(/type="checkbox"/g)?.length).toBe(2)
    expect(html.match(/checked=""/g)?.length).toBe(2)
  })

  it('shows a short הועתק toast after copy', () => {
    const html = renderToStaticMarkup(
      createElement(SharePopover, {
        includeWords: true,
        includeSettings: true,
        copied: true,
        onIncludeWords: () => undefined,
        onIncludeSettings: () => undefined,
        onCopy: () => undefined,
      }),
    )
    expect(html).toContain('הועתק')
    expect(html).toContain('share-toast')
  })
})

describe('print and share button pair', () => {
  it('gives both actions the same topbar button shell and a matching icon', () => {
    const html = renderToStaticMarkup(createElement(App))
    expect(html).toContain('class="outline topbar-btn"')
    expect(html).toContain('class="primary topbar-btn"')
    expect(html).toContain('הדפס A4')
    expect(html).toContain('שתף')
    expect(html.match(/class="btn-icon"/g)?.length).toBe(2)
  })

  it('shares size, weight, and icon layout, with filled vs solid-outline tones', () => {
    const css = readFileSync(new URL('../index.css', import.meta.url), 'utf8')
    const pair = css.match(/\.topbar-actions \.topbar-btn \{[^}]*\}/)?.[0] ?? ''
    expect(pair).toMatch(/min-height:\s*2\.5rem/)
    expect(pair).toMatch(/font-weight:\s*600/)
    expect(pair).toMatch(/padding:\s*0\.5rem 0\.95rem/)
    expect(pair).toMatch(/display:\s*inline-flex/)
    expect(css).toMatch(/button\.primary\.topbar-btn \{[^}]*background:\s*#9a4a28/)
    expect(css).toMatch(/button\.outline\.topbar-btn \{[^}]*background:\s*#fffdf8/)
    expect(css).toMatch(/button\.outline\.topbar-btn \{[^}]*border-color:\s*#9a4a28/)
  })
})
