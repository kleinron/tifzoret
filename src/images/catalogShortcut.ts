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
