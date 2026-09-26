// @vitest-environment happy-dom
import { act, createElement, StrictMode } from 'react'

globalThis.IS_REACT_ACT_ENVIRONMENT = true
import { createRoot, type Root } from 'react-dom/client'
import { describe, expect, it } from 'vitest'
import App from '../App.tsx'
import type { DirectionId } from '../generator/directions.ts'
import { PLACEMENT_FAILED_HE } from '../generator/generate.ts'
import { HEBREW_LETTERS } from '../generator/hebrew.ts'
import {
  ENLARGE_GRID_LABEL,
  ENLARGE_GRID_MAX_HINT,
  enlargedGridSizeForWords,
} from '../generator/wordLimits.ts'
import { encodeSharePayload, type ShareSettings } from '../share/codec.ts'

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

function rangeByLabel(root: ParentNode, label: string): HTMLInputElement {
  const span = [...root.querySelectorAll('.range > span')].find((node) =>
    node.textContent?.includes(label),
  )
  const range = span?.parentElement?.querySelector('input[type="range"]')
  if (!(range instanceof HTMLInputElement)) throw new Error(`missing range ${label}`)
  return range
}

function numberByLabel(root: ParentNode, label: string): HTMLInputElement {
  const input = root.querySelector(`input[aria-label="${label}"]`)
  if (!(input instanceof HTMLInputElement)) throw new Error(`missing number ${label}`)
  return input
}

function sizeLabel(root: ParentNode): string {
  const span = [...root.querySelectorAll('.range > span')].find((node) =>
    node.textContent?.includes('גודל רשת'),
  )
  return span?.textContent ?? ''
}

function imageLabel(root: ParentNode): string {
  const span = [...root.querySelectorAll('.range > span')].find((node) =>
    node.textContent?.includes('תמונות על הלוח'),
  )
  return span?.textContent ?? ''
}

function enlargeButton(root: ParentNode): HTMLButtonElement | null {
  const button = root.querySelector('.banner.error button')
  return button instanceof HTMLButtonElement ? button : null
}

function clickControl(el: Element) {
  el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))
  el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
  el.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }))
  el.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }))
  el.dispatchEvent(new MouseEvent('click', { bubbles: true }))
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

async function settlePuzzle() {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 600))
  })
}

function wordsOf(count: number, len: number): string[] {
  const out: string[] = []
  let i = 0
  while (out.length < count) {
    let x = i++
    let word = ''
    for (let k = 0; k < len; k++) {
      word += HEBREW_LETTERS[x % HEBREW_LETTERS.length]
      x = Math.floor(x / HEBREW_LETTERS.length)
    }
    out.push(word)
  }
  return out
}

function boot(words: string[], settings: ShareSettings) {
  window.history.replaceState(null, '', `/?p=${encodeSharePayload({ words, settings })}`)
}

function puzzleSettings(
  gridSize: number,
  imageCount: number,
  directions: DirectionId[] = ['rtl'],
): ShareSettings {
  return {
    directions,
    gridSize,
    fontSize: 18,
    randomAge10: false,
    noFinals: false,
    imageCount,
  }
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

describe('enlarge grid from a failed build', () => {
  it('grows a small board with the suggested size, then builds the puzzle', async () => {
    const words = wordsOf(9, 8)
    expect(enlargedGridSizeForWords(words, 8)).toBe(9)
    boot(words, puzzleSettings(8, 0))
    const view = await renderApp()

    const banner = view.container.querySelector('.banner.error')
    const message = banner?.querySelector(':scope > p')
    expect(message?.textContent).toBe(PLACEMENT_FAILED_HE)
    const button = enlargeButton(view.container)
    expect(button?.textContent).toBe(ENLARGE_GRID_LABEL)
    expect(button?.classList.contains('secondary')).toBe(true)
    expect(button?.classList.contains('primary')).toBe(false)
    expect(message?.contains(button!)).toBe(false)
    expect(button?.disabled).toBe(false)
    expect(view.container.querySelector('.banner-enlarge-hint')).toBeNull()
    expect(sizeLabel(view.container)).toBe('גודל רשת: 8×8')

    const range = rangeByLabel(view.container, 'גודל רשת')
    await act(async () => {
      pointer('pointerdown', range)
      sendInput(range, '12')
    })
    expect(sizeLabel(view.container)).toBe('גודל רשת: 12×12')

    await act(async () => {
      clickControl(button!)
    })
    expect(sizeLabel(view.container)).toBe('גודל רשת: 9×9')
    expect(numberByLabel(view.container, 'גודל רשת').value).toBe('9')
    expect(numberByLabel(view.container, 'תמונות על הלוח').value).toBe('0')

    await staleThumb(range, '12')
    expect(sizeLabel(view.container)).toBe('גודל רשת: 9×9')
    expect(range.value).toBe('9')

    await settlePuzzle()
    expect(view.container.querySelector('.banner.error')).toBeNull()
    expect(view.container.querySelector('.status')?.textContent).toContain('9×9')
    expect(numberByLabel(view.container, 'תמונות על הלוח').value).toBe('0')
    await view.unmount()
  })

  it('clamps the picture count the same way a size change does', async () => {
    const words = wordsOf(12, 8)
    expect(enlargedGridSizeForWords(words, 10)).toBe(11)
    boot(words, puzzleSettings(10, 6))
    const view = await renderApp()

    expect(view.container.querySelector('.banner.error')?.textContent).toContain(
      PLACEMENT_FAILED_HE,
    )
    expect(imageLabel(view.container)).toBe('תמונות על הלוח: 6')
    const images = rangeByLabel(view.container, 'תמונות על הלוח')
    await act(async () => {
      pointer('pointerdown', images)
      sendInput(images, '2')
    })
    expect(imageLabel(view.container)).toBe('תמונות על הלוח: 2')

    const button = enlargeButton(view.container)
    expect(button?.disabled).toBe(false)
    await act(async () => {
      clickControl(button!)
    })
    expect(sizeLabel(view.container)).toBe('גודל רשת: 11×11')
    expect(imageLabel(view.container)).toBe('תמונות על הלוח: 4')
    expect(numberByLabel(view.container, 'תמונות על הלוח').value).toBe('4')

    await staleThumb(images, '2')
    expect(imageLabel(view.container)).toBe('תמונות על הלוח: 4')
    expect(images.value).toBe('4')

    await settlePuzzle()
    const after = enlargeButton(view.container)
    expect(after?.disabled).toBe(true)
    expect(view.container.querySelector('.banner-enlarge-hint')).toBeNull()
    expect(view.container.querySelector('.banner.error > p')?.textContent).toBe(
      PLACEMENT_FAILED_HE,
    )
    expect(sizeLabel(view.container)).toBe('גודל רשת: 11×11')
    await view.unmount()
  })

  it('disables the action when the board is already at the slider max', async () => {
    const words = HEBREW_LETTERS.slice(0, 21).map((ch) => ch.repeat(16))
    expect(enlargedGridSizeForWords(words, 20)).toBeNull()
    boot(words, puzzleSettings(20, 0))
    const view = await renderApp()

    expect(view.container.querySelector('.banner.error')?.textContent).toContain(
      PLACEMENT_FAILED_HE,
    )
    const button = enlargeButton(view.container)
    expect(button?.textContent).toBe(ENLARGE_GRID_LABEL)
    expect(button?.classList.contains('secondary')).toBe(true)
    expect(button?.disabled).toBe(true)
    expect(view.container.querySelector('.banner-enlarge-hint')?.textContent).toBe(
      ENLARGE_GRID_MAX_HINT,
    )
    expect(view.container.querySelector('.banner.error > p')?.textContent).toBe(
      PLACEMENT_FAILED_HE,
    )
    await act(async () => {
      clickControl(button!)
    })
    expect(sizeLabel(view.container)).toBe('גודל רשת: 20×20')
    await view.unmount()
  })

  it('does not offer enlarge for a failure a larger grid would not address', async () => {
    boot(['שמש'], puzzleSettings(12, 0, []))
    const view = await renderApp()
    const banner = view.container.querySelector('.banner.error')
    expect(banner?.textContent).toMatch(/כיוון/)
    expect(banner?.textContent).not.toContain(ENLARGE_GRID_LABEL)
    expect(enlargeButton(view.container)).toBeNull()
    await view.unmount()
  })
})
