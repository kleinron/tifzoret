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

  it('hides settings and other no-print chrome', () => {
    expect(print).toMatch(/\.settings/)
    expect(print).toMatch(/\.no-print/)
    expect(print).toMatch(/display:\s*none\s*!important/)
  })

  it('keeps a square grid at min(100%, 170mm) with configured pt type', () => {
    expect(print).toMatch(/\.letter-grid\s*\{[^}]*width:\s*min\(100%,\s*170mm\)/)
    expect(print).toMatch(/\.letter-grid\s*\{[^}]*aspect-ratio:\s*1/)
    expect(print).not.toMatch(/100cqw/)
  })

  it('places the word bank below the grid at full width', () => {
    expect(print).toMatch(/\.center-col\s*\{[^}]*order:\s*1/)
    expect(print).toMatch(/\.word-bank\s*\{[^}]*order:\s*2/)
    expect(print).toMatch(/\.word-bank\s*\{[^}]*width:\s*100%/)
    expect(print).toMatch(/\.word-bank ul\s*\{[^}]*columns:\s*3/)
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
})
