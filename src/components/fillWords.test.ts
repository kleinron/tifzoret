// @vitest-environment happy-dom
import { act, createElement, StrictMode } from 'react'

globalThis.IS_REACT_ACT_ENVIRONMENT = true
import { createRoot, type Root } from 'react-dom/client'
import { describe, expect, it } from 'vitest'
import App from '../App.tsx'
import { KID_WORDS } from '../data/kidWords.ts'
import { FILL_AT_TARGET_REASON } from '../generator/wordLimits.ts'

async function settlePuzzle() {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 600))
  })
}

function fillButton(root: ParentNode): HTMLButtonElement {
  const button = [...root.querySelectorAll('button')].find(
    (node) => node.textContent === 'הוסף 3 מילים',
  )
  if (!(button instanceof HTMLButtonElement)) throw new Error('missing fill button')
  return button
}

function chipWords(root: ParentNode): string[] {
  return [...root.querySelectorAll('.chip')].map((node) =>
    (node.textContent ?? '').replace('×', '').trim(),
  )
}

async function renderApp() {
  const container = document.createElement('div')
  document.body.appendChild(container)
  let root: Root
  await act(async () => {
    root = createRoot(container)
    root.render(createElement(StrictMode, null, createElement(App)))
  })
  await settlePuzzle()
  return {
    container,
    async unmount() {
      await act(async () => {
        root.unmount()
      })
      container.remove()
    },
  }
}

describe('one-shot fill button', () => {
  it('adds exactly 3 corpus words on a 12 board, then disables at the target', async () => {
    const view = await renderApp()
    const before = chipWords(view.container)
    expect(before).toHaveLength(10)
    const button = fillButton(view.container)
    expect(button.disabled).toBe(false)
    expect(button.className).toContain('secondary')
    expect(button.className).not.toContain('primary')
    expect(view.container.textContent).not.toContain('מילוי אוטומטי')

    await act(async () => {
      button.click()
    })
    await settlePuzzle()

    const after = chipWords(view.container)
    expect(after).toHaveLength(13)
    const added = after.filter((word) => !before.includes(word))
    expect(added).toHaveLength(3)
    for (const word of added) expect(KID_WORDS).toContain(word)
    const again = fillButton(view.container)
    expect(again.disabled).toBe(true)
    expect(view.container.textContent).toContain(FILL_AT_TARGET_REASON)
    await view.unmount()
  })
})
