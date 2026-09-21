import { useEffect, useId, useRef, useState } from 'react'
import { buildShareUrl, type ShareSettings } from '../share/codec.ts'

export type ShareButtonProps = {
  words: readonly string[]
  settings: ShareSettings
}

export type SharePopoverProps = {
  id?: string
  includeWords: boolean
  includeSettings: boolean
  onIncludeWords: (value: boolean) => void
  onIncludeSettings: (value: boolean) => void
  onCopy: () => void
}

export function SharePopover(props: SharePopoverProps) {
  return (
    <div
      id={props.id}
      className="share-popover"
      role="dialog"
      aria-label="שיתוף קישור"
    >
      <label className="toggle">
        <input
          type="checkbox"
          checked={props.includeWords}
          onChange={(e) => props.onIncludeWords(e.target.checked)}
        />
        <span>כלול מילים</span>
      </label>
      <label className="toggle">
        <input
          type="checkbox"
          checked={props.includeSettings}
          onChange={(e) => props.onIncludeSettings(e.target.checked)}
        />
        <span>כלול הגדרות</span>
      </label>
      <button type="button" className="primary" onClick={props.onCopy}>
        העתק קישור
      </button>
    </div>
  )
}

async function copyToClipboard(text: string): Promise<void> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      return
    }
  } catch {
    // Some browsers expose clipboard but deny permission; fall back.
  }
  const el = document.createElement('textarea')
  el.value = text
  el.setAttribute('readonly', '')
  el.style.position = 'fixed'
  el.style.top = '-1000px'
  document.body.appendChild(el)
  el.select()
  const ok = document.execCommand('copy')
  document.body.removeChild(el)
  if (!ok) throw new Error('copy failed')
}

export function ShareButton({ words, settings }: ShareButtonProps) {
  const [open, setOpen] = useState(false)
  const [includeWords, setIncludeWords] = useState(true)
  const [includeSettings, setIncludeSettings] = useState(true)
  const [toast, setToast] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)
  const toastTimer = useRef(0)
  const popoverId = useId()

  useEffect(() => {
    if (!open) return
    const onPointer = (event: PointerEvent) => {
      if (!wrapRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('pointerdown', onPointer)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('pointerdown', onPointer)
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  useEffect(() => () => window.clearTimeout(toastTimer.current), [])

  const onCopy = () => {
    const url = buildShareUrl(
      {
        words: includeWords ? [...words] : undefined,
        settings: includeSettings ? settings : undefined,
      },
      window.location.href,
    )
    void copyToClipboard(url)
      .then(() => {
        setToast(true)
        window.clearTimeout(toastTimer.current)
        toastTimer.current = window.setTimeout(() => setToast(false), 1800)
      })
      .catch(() => undefined)
  }

  return (
    <div className="share-wrap" ref={wrapRef}>
      <button
        type="button"
        className="outline"
        aria-expanded={open}
        aria-controls={popoverId}
        aria-haspopup="dialog"
        onClick={() => setOpen((value) => !value)}
      >
        שתף
      </button>
      {open ? (
        <SharePopover
          id={popoverId}
          includeWords={includeWords}
          includeSettings={includeSettings}
          onIncludeWords={setIncludeWords}
          onIncludeSettings={setIncludeSettings}
          onCopy={onCopy}
        />
      ) : null}
      {toast ? (
        <div className="share-toast" role="status" aria-live="polite">
          הועתק
        </div>
      ) : null}
    </div>
  )
}
