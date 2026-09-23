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

export function shouldOpenImageCatalog(
  event: CatalogShortcutEvent,
  focus: ShortcutFocusNode | null | undefined,
): boolean {
  return isImageCatalogShortcut(event) && !isTextFieldFocused(focus)
}

export function shortcutFocusFromTarget(target: EventTarget | null): ShortcutFocusNode | null {
  if (typeof Element === 'undefined' || !(target instanceof Element)) return null
  return {
    tagName: target.tagName,
    type: target instanceof HTMLInputElement ? target.type : undefined,
    isContentEditable: target instanceof HTMLElement && target.isContentEditable,
  }
}
