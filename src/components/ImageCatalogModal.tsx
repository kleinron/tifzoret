import { useEffect, useId, useRef } from 'react'
import { BoardImage } from '../images/BoardImage.tsx'
import { BOARD_IMAGE_IDS, boardImageLabel, type BoardImageId } from '../images/catalog.ts'

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

export function ImageCatalogModal({
  onClose,
  imageIds = BOARD_IMAGE_IDS,
}: {
  onClose: () => void
  imageIds?: readonly BoardImageId[]
}) {
  const titleId = useId()
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const previouslyFocused =
      document.activeElement instanceof HTMLElement ? document.activeElement : null
    const dialog = dialogRef.current
    dialog?.focus()

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        event.stopPropagation()
        onClose()
        return
      }
      if (event.key !== 'Tab') return
      const root = dialogRef.current
      if (!root) return
      const focusable = [...root.querySelectorAll<HTMLElement>(FOCUSABLE)]
      if (focusable.length === 0) {
        event.preventDefault()
        root.focus()
        return
      }
      const first = focusable[0]!
      const last = focusable[focusable.length - 1]!
      const active = document.activeElement
      const outside = active !== root && !root.contains(active)
      if (event.shiftKey && (active === first || active === root || outside)) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && (active === last || outside)) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKey, true)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey, true)
      document.body.style.overflow = previousOverflow
      previouslyFocused?.focus()
    }
  }, [onClose])

  return (
    <div
      className="catalog-backdrop no-print"
      onPointerDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div
        ref={dialogRef}
        className="catalog-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
      >
        <header className="catalog-header">
          <h2 id={titleId}>מחסן התמונות</h2>
          <button type="button" className="catalog-close" onClick={onClose}>
            <span aria-hidden="true">×</span>
            סגור
          </button>
        </header>
        <ul className="catalog-grid">
          {imageIds.map((id) => (
            <li key={id} className="catalog-tile">
              <div className="catalog-art">
                <BoardImage id={id} />
              </div>
              <span className="catalog-label">{boardImageLabel(id)}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
