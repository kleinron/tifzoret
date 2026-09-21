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

  it('declares A4 at the top level so Chrome does not use the screen viewport', () => {
    const pageAtRoot = css.slice(0, css.indexOf('@media print'))
    expect(pageAtRoot).toMatch(/@page\s*\{[^}]*size:\s*A4/)
    expect(pageAtRoot).toMatch(/@page\s*\{[^}]*margin:\s*12mm/)
  })

  it('hides settings and other no-print chrome', () => {
    expect(print).toMatch(/\.settings/)
    expect(print).toMatch(/\.no-print/)
    expect(print).toMatch(/display:\s*none\s*!important/)
  })

  it('sizes the grid with %/cqw so fit-to-page cannot shrink it into a corner', () => {
    expect(print).toMatch(/\.letter-grid\s*\{[^}]*width:\s*100%\s*!important/)
    expect(print).toMatch(/font-size:\s*calc\(100cqw\s*\/\s*var\(--grid-n\)/)
    expect(print).not.toMatch(/width:\s*170mm\s*;/)
  })

  it('keeps square cells and centered letters', () => {
    expect(print).toMatch(/aspect-ratio:\s*1\s*\/\s*1\s*!important/)
    expect(print).toMatch(/text-align:\s*center\s*!important/)
    expect(print).toMatch(/justify-content:\s*center\s*!important/)
    expect(print).toMatch(/align-items:\s*center\s*!important/)
  })
})

describe('WordGrid print hooks', () => {
  it('exposes grid size as --grid-n and wraps letters for centering', () => {
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
    expect(html).toMatch(/--grid-n:\s*2/)
    expect(html).toContain('cell-letter')
    expect(html).toContain('dir="ltr"')
  })
})
