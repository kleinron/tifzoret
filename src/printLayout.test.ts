import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { WordGrid } from './components/WordGrid.tsx'

const css = readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'index.css'), 'utf8')

function printBlock(source: string): string {
  const start = source.indexOf('@media print')
  expect(start).toBeGreaterThanOrEqual(0)
  let i = source.indexOf('{', start)
  expect(i).toBeGreaterThan(start)
  let depth = 0
  for (; i < source.length; i++) {
    const ch = source[i]
    if (ch === '{') depth++
    else if (ch === '}') {
      depth--
      if (depth === 0) return source.slice(start, i + 1)
    }
  }
  throw new Error('Unclosed @media print block')
}

describe('print stylesheet', () => {
  const print = printBlock(css)

  it('declares A4 with 12mm margins at the top level', () => {
    const pageAtRoot = css.slice(0, css.indexOf('@media print'))
    expect(pageAtRoot).toMatch(/@page\s*\{[^}]*size:\s*A4/)
    expect(pageAtRoot).toMatch(/@page\s*\{[^}]*margin:\s*12mm/)
  })

  it('makes html/body and the print sheet fill the page instead of an RTL side column', () => {
    expect(print).toMatch(/html,\s*body\s*\{[^}]*width:\s*100%/)
    expect(print).toMatch(/#root,\s*\.page\s*\{[^}]*max-width:\s*100%/)
    expect(print).toMatch(/#root,\s*\.page\s*\{[^}]*margin:\s*0 auto/)
  })

  it('hides settings, tagline, and other no-print chrome', () => {
    expect(print).toMatch(/\.settings/)
    expect(print).toMatch(/\.no-print/)
    expect(print).toMatch(/\.tagline/)
    expect(print).toMatch(/\.topbar-actions/)
    expect(print).toMatch(/\.share-popover/)
    expect(print).toMatch(/display:\s*none\s*!important/)
    expect(print).not.toMatch(/\.tagline\s*\{[^}]*font-size:\s*10pt/)
  })

  it('keeps a square grid in the 150–160mm print lock so the bank fits on A4', () => {
    expect(print).toMatch(/\.letter-grid\s*\{[^}]*width:\s*min\(100%,\s*152mm\)/)
    expect(print).toMatch(/\.letter-grid\s*\{[^}]*max-width:\s*152mm/)
    expect(print).toMatch(/\.letter-grid\s*\{[^}]*aspect-ratio:\s*1/)
    expect(print).not.toMatch(/100cqw/)
  })

  it('places the word bank below the grid in 5 dense columns', () => {
    expect(print).toMatch(/\.center-col\s*\{[^}]*order:\s*1/)
    expect(print).toMatch(/\.word-bank\s*\{[^}]*order:\s*2/)
    expect(print).toMatch(/\.word-bank\s*\{[^}]*width:\s*100%/)
    expect(print).toMatch(/\.layout\s*\{[^}]*gap:\s*2\.5mm/)
    expect(print).toMatch(/\.word-bank ul\s*\{[^}]*display:\s*grid/)
    expect(print).toMatch(
      /\.word-bank ul\s*\{[^}]*grid-template-columns:\s*repeat\(5,\s*minmax\(0,\s*1fr\)\)/,
    )
    expect(print).toMatch(/\.word-bank ul\s*\{[^}]*line-height:\s*1\.15/)
    expect(print).toMatch(/\.word-bank ul\s*\{[^}]*width:\s*100%/)
    expect(print).not.toMatch(/\.word-bank ul\s*\{[^}]*columns:\s*3/)
  })

  it('tightens word-bank item spacing so leftover words cannot orphan onto page 2', () => {
    expect(print).toMatch(/\.word-bank li \+ li\s*\{[^}]*margin-top:\s*0/)
    expect(print).toMatch(/\.word-bank\s*\{[^}]*break-inside:\s*avoid/)
  })

  it('keeps board images visible when printing', () => {
    expect(print).toMatch(/\.cell-image/)
    expect(print).toMatch(/\.board-image/)
    expect(print).toMatch(/print-color-adjust:\s*exact/)
    expect(print).not.toMatch(/\.cell-image\s*\{[^}]*display:\s*none/)
  })

  it('centers letters in cells', () => {
    expect(print).toMatch(/text-align:\s*center/)
    expect(print).toMatch(/justify-content:\s*center/)
    expect(print).toMatch(/align-items:\s*center/)
  })
})

describe('WordGrid print hooks', () => {
  it('uses the configured font size in pt and wraps letters for centering', () => {
    const html = renderToStaticMarkup(
      createElement(WordGrid, {
        grid: [
          ['א', 'ב'],
          ['ג', 'ד'],
        ],
        fontSize: 18,
        foundCells: new Map(),
        onPathComplete: () => undefined,
      }),
    )
    expect(html).toMatch(/font-size:\s*18pt/)
    expect(html).toMatch(/--grid-n:\s*2/)
    expect(html).toContain('cell-letter')
    expect(html).toContain('dir="ltr"')
  })

  it('prints an embedded picture across a 4×4 block', () => {
    const grid = Array.from({ length: 8 }, () => Array.from({ length: 8 }, () => 'א'))
    const html = renderToStaticMarkup(
      createElement(WordGrid, {
        grid,
        fontSize: 18,
        foundCells: new Map(),
        onPathComplete: () => undefined,
        imageBlocks: [{ imageId: 'cat', row: 1, col: 2 }],
      }),
    )
    expect(html).toContain('<svg')
    expect(html).toContain('board-image')
    expect(html).toContain('cell-image')
    expect(html).toContain('תמונה: חתול')
    expect(html).toContain('data-image="cat"')
    expect(html).toContain('grid-row:2 / span 4')
    expect(html).toContain('grid-column:3 / span 4')
    expect(html.match(/data-cell=/g)?.length).toBe(64 - 15)
    expect(html).not.toContain('http://')
    expect(html).not.toContain('https://')
  })
})
