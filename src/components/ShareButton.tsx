import { useEffect, useId, useRef, useState } from 'react'
import { buildShareUrl, type ShareSettings } from '../share/codec.ts'
import { ShareIcon } from './actionIcons.tsx'

export type ShareButtonProps = {
  words: readonly string[]
  settings: ShareSettings
}

export type SharePopoverProps = {
  id?: string
  includeWords: boolean
  includeSettings: boolean
  copied?: boolean
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
      onPointerDown={(event) => event.stopPropagation()}
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
      <button
        type="button"
        className="primary"
        onPointerDown={(event) => {
          event.preventDefault()
          event.stopPropagation()
          props.onCopy()
        }}
      >
        העתק קישור
      </button>
      {props.copied ? (
        <div className="share-toast" role="status" aria-live="polite">
          הועתק
        </div>
      ) : null}
    </div>
  )
}

function execCopy(text: string): boolean {
  const el = document.createElement('textarea')
  el.value = text
  el.setAttribute('readonly', '')
  el.style.position = 'fixed'
  el.style.left = '-9999px'
  document.body.appendChild(el)
  el.select()
  let ok = false
  try {
    ok = document.execCommand('copy')
  } finally {
    document.body.removeChild(el)
  }
  return ok
}

function copyToClipboard(text: string): void {
  if (navigator.clipboard?.writeText) {
    const timeout = new Promise<never>((_, reject) => {
      window.setTimeout(() => reject(new Error('clipboard timeout')), 400)
    })
    void Promise.race([navigator.clipboard.writeText(text), timeout]).catch(() => {
      execCopy(text)
    })
    return
  }
  execCopy(text)
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
    copyToClipboard(url)
    setToast(true)
    window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToast(false), 2500)
  }

  return (
    <div className="share-wrap" ref={wrapRef}>
      <button
        type="button"
        className="outline topbar-btn topbar-share"
        aria-expanded={open}
        aria-controls={popoverId}
        aria-haspopup="dialog"
        onClick={() => setOpen((value) => !value)}
      >
        <ShareIcon />
        <span>שתף</span>
      </button>
      {open ? (
        <SharePopover
          id={popoverId}
          includeWords={includeWords}
          includeSettings={includeSettings}
          copied={toast}
          onIncludeWords={setIncludeWords}
          onIncludeSettings={setIncludeSettings}
          onCopy={onCopy}
        />
      ) : null}
    </div>
  )
}
