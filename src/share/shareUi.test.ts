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
    expect(html).toContain('class="outline topbar-btn topbar-share"')
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
  it('gives both actions the same outline shell and a 16px icon', () => {
    const html = renderToStaticMarkup(createElement(App))
    expect(html).toContain('class="outline topbar-btn topbar-share"')
    expect(html).toContain('class="outline topbar-btn topbar-print"')
    expect(html).not.toContain('primary topbar-btn')
    expect(html).toContain('>הדפס<')
    expect(html).not.toContain('הדפס A4')
    expect(html).toContain('שתף')
    expect(html.match(/class="btn-icon"/g)?.length).toBe(2)
  })

  it('matches height, padding, and radius; color is the only style difference', () => {
    const css = readFileSync(new URL('../index.css', import.meta.url), 'utf8')
    const pair = css.match(/\.topbar-actions \.topbar-btn \{[^}]*\}/)?.[0] ?? ''
    expect(pair).toMatch(/min-height:\s*2\.5rem/)
    expect(pair).toMatch(/padding:\s*0\.45rem 0\.9rem/)
    expect(pair).toMatch(/border-radius:\s*999px/)
    expect(pair).toMatch(/border:\s*1\.5px solid transparent/)
    expect(pair).toMatch(/background:\s*transparent/)
    expect(pair).toMatch(/font-size:\s*16px/)
    const icon = css.match(/\.topbar-actions \.topbar-btn \.btn-icon \{[^}]*\}/)?.[0] ?? ''
    expect(icon).toMatch(/width:\s*16px/)
    expect(icon).toMatch(/height:\s*16px/)
    const print = css.match(/button\.topbar-print \{[^}]*\}/)?.[0] ?? ''
    const share = css.match(/button\.topbar-share \{[^}]*\}/)?.[0] ?? ''
    expect(print).toMatch(/border-color:\s*#6a645c/)
    expect(print).toMatch(/color:\s*#6a645c/)
    expect(print).not.toMatch(/padding|font-weight|border-width|background/)
    expect(share).toMatch(/border-color:\s*#9a4a28/)
    expect(share).toMatch(/color:\s*#9a4a28/)
    expect(share).not.toMatch(/padding|font-weight|border-width|background/)
  })
})
