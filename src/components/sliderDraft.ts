const sliderDraftCancels = new Set<() => void>()

/**
 * Drop every open slider preview so a parent write is not followed by that
 * gesture's pointerup committing the old thumb. «הגדל רשת» calls this on
 * pointerdown, before the same click releases the pointer.
 */
export function cancelCommittedSliderDrafts(): void {
  for (const cancel of sliderDraftCancels) cancel()
}

export function registerSliderDraftCancel(cancel: () => void): () => void {
  sliderDraftCancels.add(cancel)
  return () => sliderDraftCancels.delete(cancel)
}
