// @vitest-environment happy-dom
import { act, createElement, StrictMode, useState } from 'react'

globalThis.IS_REACT_ACT_ENVIRONMENT = true
import { createRoot, type Root } from 'react-dom/client'
import { describe, expect, it } from 'vitest'
import App from '../App.tsx'
import { SettingsPanel } from './SettingsPanel.tsx'
import { HANUKKAH_WORDS, PURIM_WORDS } from '../data/holidayPacks.ts'
import { DIRECTIONS } from '../generator/directions.ts'
import { gridSizeForWordCount, MAX_BANK_WORDS } from '../generator/wordLimits.ts'

function setNativeValue(el: HTMLInputElement, value: string) {
  const proto = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')
  proto?.set?.call(el, value)
}

function sendInput(el: HTMLInputElement, value: string) {
  setNativeValue(el, value)
  el.dispatchEvent(new Event('input', { bubbles: true }))
  el.dispatchEvent(new Event('change', { bubbles: true }))
}

function pointer(type: 'pointerdown' | 'pointerup' | 'pointercancel', target: EventTarget) {
  target.dispatchEvent(new PointerEvent(type, { bubbles: true, cancelable: true }))
}

function gridRange(root: ParentNode): HTMLInputElement {
  const span = [...root.querySelectorAll('.range > span')].find((node) =>
    node.textContent?.includes('גודל רשת'),
  )
  const range = span?.parentElement?.querySelector('input[type="range"]')
  if (!(range instanceof HTMLInputElement)) throw new Error('missing grid range')
  return range
}

function gridNumber(root: ParentNode): HTMLInputElement {
  const input = root.querySelector('input[aria-label="גודל רשת"]')
  if (!(input instanceof HTMLInputElement)) throw new Error('missing grid number')
  return input
}

function sizeLabel(root: ParentNode): string {
  const span = [...root.querySelectorAll('.range > span')].find((node) =>
    node.textContent?.includes('גודל רשת'),
  )
  return span?.textContent ?? ''
}

async function mount(node: ReturnType<typeof createElement>) {
  const container = document.createElement('div')
  document.body.appendChild(container)
  const root = createRoot(container)
  await act(async () => {
    root.render(node)
  })
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

function PanelHarness() {
  const [grid, setGrid] = useState(12)
  return createElement(
    'div',
    null,
    createElement(SettingsPanel, {
      directions: DIRECTIONS,
      enabled: new Set(['rtl']),
      onToggleDirection: () => undefined,
      draft: '',
      onDraftChange: () => undefined,
      onAddWords: () => undefined,
      onPasteWords: () => undefined,
      looksLikeWordList: () => false,
      bank: ['שמש'],
      bankLimit: MAX_BANK_WORDS,
      issues: [],
      onGrowBoard: () => undefined,
      addDisabled: true,
      onRemoveWord: () => undefined,
      randomAge10: false,
      onRandomAge10: () => undefined,
      noFinals: false,
      onNoFinals: () => undefined,
      gridSize: grid,
      onGridSize: setGrid,
      imageCount: 1,
      onImageCount: () => undefined,
      fontSize: 18,
      onFontSize: () => undefined,
      busy: false,
      onReshuffle: () => undefined,
    }),
    createElement(
      'button',
      { type: 'button', onClick: () => setGrid(20) },
      'program-20',
    ),
    createElement('output', null, String(grid)),
  )
}

function stateOf(container: ParentNode): string {
  return container.querySelector('output')?.textContent ?? ''
}

async function dragRange(range: HTMLInputElement, value: string) {
  await act(async () => {
    pointer('pointerdown', range)
    sendInput(range, value)
    pointer('pointerup', range)
    pointer('pointerup', window)
  })
}

async function staleThumb(range: HTMLInputElement, value: string) {
  await act(async () => {
    setNativeValue(range, value)
    range.dispatchEvent(new Event('input', { bubbles: true }))
    range.dispatchEvent(new Event('change', { bubbles: true }))
    pointer('pointerup', window)
    range.dispatchEvent(new FocusEvent('blur', { bubbles: true }))
  })
}

describe('committed grid slider', () => {
  it('commits a drag and still accepts the number field', async () => {
    const view = await mount(createElement(StrictMode, null, createElement(PanelHarness)))
    const range = gridRange(view.container)
    await dragRange(range, '8')
    expect(stateOf(view.container)).toBe('8')
    expect(sizeLabel(view.container)).toBe('גודל רשת: 8×8')

    const number = gridNumber(view.container)
    await act(async () => {
      number.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: '1' }))
      sendInput(number, '16')
    })
    expect(stateOf(view.container)).toBe('16')
    expect(sizeLabel(view.container)).toBe('גודל רשת: 16×16')
    await view.unmount()
  })

  it('does not let an open drag or a stale thumb overwrite a programmatic size', async () => {
    const view = await mount(createElement(StrictMode, null, createElement(PanelHarness)))
    const range = gridRange(view.container)

    await act(async () => {
      pointer('pointerdown', range)
      sendInput(range, '8')
    })
    expect(sizeLabel(view.container)).toBe('גודל רשת: 8×8')
    expect(stateOf(view.container)).toBe('12')

    const program = [...view.container.querySelectorAll('button')].find((button) =>
      button.textContent?.includes('program-20'),
    )
    if (!program) throw new Error('missing program size button')
    await act(async () => {
      program.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })
    expect(stateOf(view.container)).toBe('20')
    expect(sizeLabel(view.container)).toBe('גודל רשת: 20×20')

    await staleThumb(range, '8')
    expect(stateOf(view.container)).toBe('20')
    expect(range.value).toBe('20')
    expect(sizeLabel(view.container)).toBe('גודל רשת: 20×20')

    await dragRange(range, '15')
    expect(stateOf(view.container)).toBe('15')
    expect(sizeLabel(view.container)).toBe('גודל רשת: 15×15')
    await view.unmount()
  })
})

function clickControl(el: Element) {
  el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))
  el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
  el.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }))
  el.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }))
  el.dispatchEvent(new MouseEvent('click', { bubbles: true }))
}

async function chooseHoliday(container: ParentNode, label: string) {
  const toggle = container.querySelector('button.holiday-toggle')
  if (!toggle) throw new Error('missing holiday toggle')
  if (toggle.getAttribute('aria-expanded') !== 'true') {
    await act(async () => {
      clickControl(toggle)
    })
  }
  const chip = [...container.querySelectorAll('button.holiday-chip')].find((button) =>
    button.textContent?.includes(label),
  )
  if (!chip) throw new Error(`missing holiday ${label}`)
  await act(async () => {
    clickControl(chip)
  })
}

function bankWords(root: ParentNode): string[] {
  return [...root.querySelectorAll('.chip-list .chip')].map((button) => {
    const copy = button.cloneNode(true) as HTMLElement
    copy.querySelector('span')?.remove()
    return (copy.textContent ?? '').trim()
  })
}

async function settlePuzzle() {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 600))
  })
}

describe('holiday pack board size in the app', () => {
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

  it('raises חנוכה and פורים from a dragged 8×8 and ignores a stale slider draft', async () => {
    const hanukkah = await renderApp()
    await dragRange(gridRange(hanukkah.container), '8')
    expect(sizeLabel(hanukkah.container)).toBe('גודל רשת: 8×8')
    await chooseHoliday(hanukkah.container, 'חנוכה')
    await staleThumb(gridRange(hanukkah.container), '8')
    const hanukkahSize = String(gridSizeForWordCount(HANUKKAH_WORDS.length))
    expect(sizeLabel(hanukkah.container)).toBe(`גודל רשת: ${hanukkahSize}×${hanukkahSize}`)
    expect(gridRange(hanukkah.container).value).toBe(hanukkahSize)
    expect(gridNumber(hanukkah.container).value).toBe(hanukkahSize)
    expect(bankWords(hanukkah.container)).toEqual([...HANUKKAH_WORDS])
    await settlePuzzle()
    expect(hanukkah.container.querySelector('.banner.error')).toBeNull()
    expect(hanukkah.container.querySelector('.status')?.textContent).toContain(
      `${hanukkahSize}×${hanukkahSize}`,
    )
    expect(hanukkah.container.querySelector('.bank-count')?.textContent).toContain(
      `${HANUKKAH_WORDS.length} / 50`,
    )

    await chooseHoliday(hanukkah.container, 'רגיל')
    await staleThumb(gridRange(hanukkah.container), '8')
    expect(sizeLabel(hanukkah.container)).toBe(`גודל רשת: ${hanukkahSize}×${hanukkahSize}`)
    expect(bankWords(hanukkah.container)).toEqual([...HANUKKAH_WORDS])
    await hanukkah.unmount()

    const purim = await renderApp()
    await dragRange(gridRange(purim.container), '8')
    await chooseHoliday(purim.container, 'פורים')
    await staleThumb(gridRange(purim.container), '8')
    const purimSize = String(gridSizeForWordCount(PURIM_WORDS.length))
    expect(sizeLabel(purim.container)).toBe(`גודל רשת: ${purimSize}×${purimSize}`)
    expect(gridRange(purim.container).value).toBe(purimSize)
    expect(bankWords(purim.container)).toEqual([...PURIM_WORDS])
    await settlePuzzle()
    expect(purim.container.querySelector('.banner.error')).toBeNull()
    expect(purim.container.querySelector('.status')?.textContent).toContain(
      `${purimSize}×${purimSize}`,
    )
    expect(purim.container.querySelector('.bank-count')?.textContent).toContain(
      `${PURIM_WORDS.length} / 50`,
    )
    await chooseHoliday(purim.container, 'רגיל')
    expect(sizeLabel(purim.container)).toBe(`גודל רשת: ${purimSize}×${purimSize}`)
    await purim.unmount()
  })

  it('replaces the word bank when switching between חנוכה and פורים', async () => {
    const app = await renderApp()
    await chooseHoliday(app.container, 'חנוכה')
    expect(bankWords(app.container)).toEqual([...HANUKKAH_WORDS])

    await chooseHoliday(app.container, 'פורים')
    expect(bankWords(app.container)).toEqual([...PURIM_WORDS])
    expect(bankWords(app.container)).not.toContain('סופגנייה')
    expect(bankWords(app.container)).not.toContain('סופגניה')
    expect(bankWords(app.container)).not.toContain('חנוכה')
    expect(bankWords(app.container)).not.toContain('שמש')

    await chooseHoliday(app.container, 'חנוכה')
    expect(bankWords(app.container)).toEqual([...HANUKKAH_WORDS])
    expect(bankWords(app.container)).not.toContain('פורים')
    expect(bankWords(app.container)).not.toContain('אסתר')
    expect(bankWords(app.container)).not.toContain('סופגניה')
    await app.unmount()
  })
})
