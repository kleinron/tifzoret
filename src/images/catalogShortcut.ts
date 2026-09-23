/** Keyboard event fields needed to recognize the picture-catalog chord. */
export type CatalogShortcutEvent = {
  key: string
  code?: string
  ctrlKey: boolean
  metaKey: boolean
  shiftKey: boolean
  altKey: boolean
  repeat?: boolean
}

/** Enough of the focused node to decide whether the user is editing text. */
export type ShortcutFocusNode = {
  tagName?: string
  type?: string
  isContentEditable?: boolean
}

/** Single-line text fields. Checkboxes, ranges, and number spinners stay eligible. */
const TEXT_INPUT_TYPES = new Set([
  'text',
  'search',
  'email',
  'url',
  'tel',
  'password',
])

/**
 * Ctrl+Shift+I (Windows/Linux) or Cmd+Shift+I (macOS).
 * Also matches the physical KeyI key so a Hebrew layout still opens the catalog
 * and lines up with the browser DevTools chord. Alt is excluded.
 */
export function isImageCatalogShortcut(event: CatalogShortcutEvent): boolean {
  if (event.repeat || event.altKey || !event.shiftKey) return false
  if (!event.ctrlKey && !event.metaKey) return false
  return event.key.toLowerCase() === 'i' || event.code === 'KeyI'
}

/** True when focus is in a text input, textarea, or contenteditable. */
export function isTextFieldFocused(node: ShortcutFocusNode | null | undefined): boolean {
  if (!node) return false
  if (node.isContentEditable) return true
  const tag = node.tagName?.toUpperCase()
  if (tag === 'TEXTAREA') return true
  if (tag !== 'INPUT') return false
  const type = (node.type ?? 'text').toLowerCase()
  return TEXT_INPUT_TYPES.has(type)
}

/** Open only for the catalog chord, and only when neither focus nor the event target is a text field. */
export function catalogShortcutOpens(
  event: CatalogShortcutEvent,
  active: ShortcutFocusNode | null | undefined,
  target: ShortcutFocusNode | null | undefined,
): boolean {
  if (!isImageCatalogShortcut(event)) return false
  if (isTextFieldFocused(active) || isTextFieldFocused(target)) return false
  return true
}

function focusNode(element: Element): ShortcutFocusNode {
  return {
    tagName: element.tagName,
    type: element instanceof HTMLInputElement ? element.type : undefined,
    isContentEditable: element instanceof HTMLElement && element.isContentEditable,
  }
}

/** The focused node, or the text field that contains it. */
export function shortcutFocusFromTarget(target: EventTarget | null): ShortcutFocusNode | null {
  if (typeof Element === 'undefined' || !(target instanceof Element)) return null
  let current: Element | null = target
  let fallback: ShortcutFocusNode | null = null
  while (current) {
    const node = focusNode(current)
    if (isTextFieldFocused(node)) return node
    fallback ??= node
    current = current.parentElement
  }
  return fallback
}
