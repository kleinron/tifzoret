import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
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
    expect(html).toContain('class="outline"')
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
})
