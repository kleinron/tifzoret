// @vitest-environment happy-dom
import { act, createElement, StrictMode } from 'react'

globalThis.IS_REACT_ACT_ENVIRONMENT = true
import { createRoot, type Root } from 'react-dom/client'
import { describe, expect, it } from 'vitest'
import App from '../App.tsx'
import { KID_WORDS } from '../data/kidWords.ts'
import { DEFAULT_BANK, PURIM_WORDS } from '../data/holidayPacks.ts'
import { FILL_HOLIDAY_REASON } from '../generator/wordLimits.ts'
import { BASE62_ALPHABET, SHARE_QUERY_PARAM } from '../share/codec.ts'

async function settlePuzzle() {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 600))
  })
}

function fillButton(root: ParentNode): HTMLButtonElement {
  const button = [...root.querySelectorAll('button')].find((node) =>
    /^הוסף \d מילים$/.test(node.textContent ?? ''),
  )
  if (!(button instanceof HTMLButtonElement)) throw new Error('missing fill button')
  return button
}

function chipWords(root: ParentNode): string[] {
  return [...root.querySelectorAll('.chip')].map((node) =>
    (node.textContent ?? '').replace('×', '').trim(),
  )
}

function puzzleList(root: ParentNode): string[] {
  return [...root.querySelectorAll('.word-bank-list li')].map((node) =>
    (node.textContent ?? '').trim(),
  )
}

function setNativeValue(el: HTMLInputElement, value: string) {
  const proto = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')
  proto?.set?.call(el, value)
}

/** Version-2 settings link with the old fill bit set or clear, and no word list. */
function legacyFillSettingsSearch(fillBit: number): string {
  const bits: number[] = []
  const write = (value: number, width: number) => {
    for (let i = width - 1; i >= 0; i--) bits.push((value >>> i) & 1)
  }
  write(2, 4)
  write(0, 1)
  write(1, 1)
  write(0, 2)
  write(1, 8)
  write(4, 4)
  write(6, 5)
  write(fillBit, 1)
  write(0, 1)
  write(1, 5)
  const bytes = new Uint8Array(Math.ceil(bits.length / 8))
  for (let i = 0; i < bits.length; i++) {
    if (bits[i]) bytes[i >> 3]! |= 1 << (7 - (i & 7))
  }
  let n = 0n
  for (const byte of bytes) n = (n << 8n) + BigInt(byte)
  const chars: string[] = []
  while (n > 0n) {
    chars.push(BASE62_ALPHABET[Number(n % 62n)]!)
    n /= 62n
  }
  return `?${SHARE_QUERY_PARAM}=${chars.reverse().join('')}`
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
  it('adds 3 corpus words on a 12 board and stays a one-shot control', async () => {
    window.history.replaceState(null, '', '/')
    const view = await renderApp()
    const before = chipWords(view.container)
    expect(before).toHaveLength(10)
    const button = fillButton(view.container)
    expect(button.textContent).toBe('הוסף 3 מילים')
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
    expect(again.disabled).toBe(false)
    expect(again.textContent).toBe('הוסף 3 מילים')
    await view.unmount()
  })

  it('relabels the button when the board grows from 12 to 13', async () => {
    window.history.replaceState(null, '', '/')
    const view = await renderApp()
    const input = view.container.querySelector('input[aria-label="גודל רשת"]')
    if (!(input instanceof HTMLInputElement)) throw new Error('missing grid size field')
    await act(async () => {
      input.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))
      setNativeValue(input, '13')
      input.dispatchEvent(new Event('input', { bubbles: true }))
      input.dispatchEvent(new Event('change', { bubbles: true }))
    })
    await settlePuzzle()
    expect(fillButton(view.container).textContent).toBe('הוסף 4 מילים')
    expect(fillButton(view.container).disabled).toBe(false)
    await view.unmount()
  })

  it('disables the button for a holiday pack and does not add corpus words', async () => {
    window.history.replaceState(null, '', '/')
    const view = await renderApp()
    const beforeHoliday = chipWords(view.container)
    expect(beforeHoliday).toEqual([...DEFAULT_BANK])
    const toggle = view.container.querySelector('button.holiday-toggle')
    if (!(toggle instanceof HTMLButtonElement)) throw new Error('missing holiday toggle')
    await act(async () => {
      toggle.click()
    })
    const purim = [...view.container.querySelectorAll('button')].find(
      (node) => node.textContent === 'פורים',
    )
    if (!(purim instanceof HTMLButtonElement)) throw new Error('missing purim chip')
    await act(async () => {
      purim.click()
    })
    await settlePuzzle()

    const button = fillButton(view.container)
    expect(button.disabled).toBe(true)
    expect(view.container.textContent).toContain(FILL_HOLIDAY_REASON)
    expect(chipWords(view.container)).toEqual([...PURIM_WORDS])

    await act(async () => {
      button.click()
    })
    await settlePuzzle()
    expect(chipWords(view.container)).toEqual([...PURIM_WORDS])

    const regular = [...view.container.querySelectorAll('button')].find(
      (node) => node.textContent === 'רגיל',
    )
    if (!(regular instanceof HTMLButtonElement)) throw new Error('missing regular chip')
    await act(async () => {
      regular.click()
    })
    await settlePuzzle()
    expect(chipWords(view.container)).toEqual(beforeHoliday)
    expect(chipWords(view.container)).toEqual([...DEFAULT_BANK])
    expect(fillButton(view.container).disabled).toBe(false)
    expect(fillButton(view.container).textContent).toBe('הוסף 3 מילים')
    expect(view.container.textContent).not.toContain(FILL_HOLIDAY_REASON)
    await view.unmount()
  })

  it('does not over-fill when an old share link still has the fill bit set', async () => {
    window.history.replaceState(null, '', `/${legacyFillSettingsSearch(1)}`)
    const view = await renderApp()
    const chips = chipWords(view.container)
    expect(chips).toHaveLength(10)
    const listed = puzzleList(view.container)
    expect(listed.length).toBeGreaterThan(0)
    for (const word of listed) expect(chips).toContain(word)
    expect(fillButton(view.container).disabled).toBe(false)
    await view.unmount()
    window.history.replaceState(null, '', '/')
  })
})
