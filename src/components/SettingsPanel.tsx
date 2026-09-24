import { useEffect, useRef, useState, type ClipboardEvent, type PointerEvent as ReactPointerEvent } from 'react'
import { DirectionArrow } from './actionIcons.tsx'
import {
  directionArrowRotation,
  type Direction,
  type DirectionId,
} from '../generator/directions.ts'
import { clampImageCount, maxImageBlocks } from '../generator/imageBlocks.ts'
import type { FieldIssue } from '../generator/wordLimits.ts'
import {
  AGE10_FILL_LABEL,
  age10FillHint,
  growBoardCtaLabel,
  MAX_BANK_WORDS,
  MAX_WORD_LENGTH,
} from '../generator/wordLimits.ts'

function clampSlider(raw: number, min: number, max: number): number | null {
  if (!Number.isFinite(raw)) return null
  return Math.min(max, Math.max(min, Math.round(raw)))
}

/**
 * Range that previews while the thumb moves and commits once, on release.
 * React's onChange follows every input event, so a drag must not call onCommit
 * until pointerup / keyup. The paired number field commits on each typed value.
 */
function CommittedSlider(props: {
  min: number
  max: number
  value: number
  numberLabel: string
  onCommit: (value: number) => void
  format: (value: number) => string
}) {
  const rangeRef = useRef<HTMLInputElement>(null)
  const finishRef = useRef<(() => void) | null>(null)
  const liveRef = useRef({
    value: props.value,
    min: props.min,
    max: props.max,
    onCommit: props.onCommit,
  })
  const [draft, setDraft] = useState<{ value: number; base: number } | null>(null)
  const shown = draft !== null && draft.base === props.value ? draft.value : props.value

  useEffect(() => {
    liveRef.current = {
      value: props.value,
      min: props.min,
      max: props.max,
      onCommit: props.onCommit,
    }
  }, [props.value, props.min, props.max, props.onCommit])

  useEffect(() => {
    return () => {
      if (!finishRef.current) return
      window.removeEventListener('pointerup', finishRef.current)
      window.removeEventListener('pointercancel', finishRef.current)
      finishRef.current = null
    }
  }, [])

  const commit = (raw: number) => {
    const live = liveRef.current
    const next = clampSlider(raw, live.min, live.max)
    if (next === null || next === live.value) {
      setDraft(null)
      return
    }
    setDraft({ value: next, base: live.value })
    live.onCommit(next)
  }

  const armRelease = (event: ReactPointerEvent<HTMLInputElement>) => {
    if (finishRef.current) return
    const finish = () => {
      window.removeEventListener('pointerup', finish)
      window.removeEventListener('pointercancel', finish)
      finishRef.current = null
      commit(Number(rangeRef.current?.value ?? event.currentTarget.value))
    }
    finishRef.current = finish
    window.addEventListener('pointerup', finish)
    window.addEventListener('pointercancel', finish)
  }

  return (
    <label className="range">
      <span>{props.format(shown)}</span>
      <div className="size-row">
        <input
          ref={rangeRef}
          type="range"
          min={props.min}
          max={props.max}
          step={1}
          value={shown}
          onChange={(e) => {
            const next = clampSlider(Number(e.target.value), props.min, props.max)
            if (next !== null) setDraft({ value: next, base: props.value })
          }}
          onPointerDown={armRelease}
          onKeyUp={() => commit(Number(rangeRef.current?.value))}
          onBlur={() => commit(Number(rangeRef.current?.value))}
        />
        <input
          type="number"
          min={props.min}
          max={props.max}
          step={1}
          value={shown}
          onChange={(e) => {
            const next = Number(e.target.value)
            if (!Number.isFinite(next) || next < props.min || next > props.max) return
            if (next === props.value) {
              setDraft(null)
              return
            }
            setDraft({ value: next, base: props.value })
            props.onCommit(next)
          }}
          aria-label={props.numberLabel}
        />
      </div>
    </label>
  )
}

export type SettingsPanelProps = {
  directions: readonly Direction[]
  enabled: ReadonlySet<DirectionId>
  onToggleDirection: (id: DirectionId) => void
  draft: string
  onDraftChange: (value: string) => void
  onAddWords: () => void
  onPasteWords: (text: string) => void
  looksLikeWordList: (text: string) => boolean
  bank: readonly string[]
  bankLimit: number
  issues: readonly FieldIssue[]
  onGrowBoard: (size: number) => void
  addDisabled: boolean
  onRemoveWord: (word: string) => void
  randomAge10: boolean
  onRandomAge10: (value: boolean) => void
  noFinals: boolean
  onNoFinals: (value: boolean) => void
  gridSize: number
  onGridSize: (value: number) => void
  imageCount: number
  onImageCount: (value: number) => void
  fontSize: number
  onFontSize: (value: number) => void
  busy: boolean
  onReshuffle: () => void
}

export function SettingsPanel(props: SettingsPanelProps) {
  const onPaste = (event: ClipboardEvent<HTMLTextAreaElement>) => {
    const text = event.clipboardData.getData('text')
    if (!text || !props.looksLikeWordList(text)) return
    event.preventDefault()
    props.onPasteWords(text)
  }

  const atLimit = props.bank.length >= props.bankLimit
  const invalid = props.issues.length > 0
  const maxImages = maxImageBlocks(props.gridSize)
  const imageCount = clampImageCount(props.imageCount, props.gridSize)

  return (
    <aside className="panel settings no-print" aria-label="הגדרות">
      <h2>הגדרות</h2>
      <div className="settings-body">
        <fieldset className="block">
          <legend>כיוונים</legend>
          <p className="hint">סמנו כל כיוון שבו מותר לשבץ מילים.</p>
          <ul className="direction-list">
            {props.directions.map((dir) => (
              <li key={dir.id} className={`direction-item direction-${dir.id}`}>
                <label title={dir.label}>
                  <input
                    type="checkbox"
                    checked={props.enabled.has(dir.id)}
                    onChange={() => props.onToggleDirection(dir.id)}
                    aria-label={dir.label}
                  />
                  <span className="direction-arrow" dir="ltr" aria-hidden="true">
                    <DirectionArrow
                      rotation={directionArrowRotation(dir.dr, dir.dc)}
                    />
                  </span>
                </label>
              </li>
            ))}
          </ul>
        </fieldset>

        <fieldset className="block">
          <legend>מחסן מילים</legend>
          <p className="hint">
            מילה בכל שורה או מופרדות בפסיק. ניקוד ורווחים מוסרים. עד{' '}
            {MAX_WORD_LENGTH} אותיות, עד {MAX_BANK_WORDS} מילים במחסן.
          </p>
          <textarea
            value={props.draft}
            onChange={(e) => props.onDraftChange(e.target.value)}
            onPaste={onPaste}
            rows={3}
            placeholder={'שמש\nירח\nכוכב'}
            dir="rtl"
            aria-invalid={invalid}
            aria-describedby={invalid ? 'word-validation' : undefined}
          />
          {invalid ? (
            <div id="word-validation" className="field-messages" dir="rtl">
              {props.issues.map((issue) => {
                const growTo = issue.growTo
                return (
                  <div
                    key={`${issue.tone}:${issue.message}`}
                    className={`field-message field-message-${issue.tone}`}
                    aria-live="polite"
                  >
                    <span>{issue.message}</span>
                    {growTo != null ? (
                      <button
                        type="button"
                        className="secondary grow-cta"
                        onClick={() => props.onGrowBoard(growTo)}
                      >
                        {growBoardCtaLabel(growTo)}
                      </button>
                    ) : null}
                  </div>
                )
              })}
            </div>
          ) : null}
          <button
            type="button"
            className="secondary"
            onClick={props.onAddWords}
            disabled={props.addDisabled}
          >
            הוסף למחסן מילים
          </button>
          <p className={atLimit ? 'bank-count at-limit' : 'bank-count'}>
            {props.bank.length} / {props.bankLimit} במחסן מילים
          </p>
          {props.bank.length > 0 ? (
            <ul className="chip-list">
              {props.bank.map((word) => (
                <li key={word}>
                  <button
                    type="button"
                    className="chip"
                    onClick={() => props.onRemoveWord(word)}
                    title="הסר"
                  >
                    {word} <span aria-hidden="true">×</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="hint">מחסן המילים ריק עדיין.</p>
          )}
        </fieldset>

        <fieldset className="block">
          <legend>אפשרויות</legend>
          <label className="toggle">
            <input
              type="checkbox"
              checked={props.randomAge10}
              onChange={(e) => props.onRandomAge10(e.target.checked)}
            />
            <span>{AGE10_FILL_LABEL}</span>
          </label>
          <p className="hint">{age10FillHint(props.gridSize, props.bank.length)}</p>
          <label className="toggle">
            <input
              type="checkbox"
              checked={props.noFinals}
              onChange={(e) => props.onNoFinals(e.target.checked)}
            />
            <span>ללא אותיות סופיות</span>
          </label>
          <p className="hint">
            כשמופעל, מילים עם אות סופית (ם, ן, ץ, ף, ך) לא ייכנסו לתפזורת, וגם
            האותיות הסופיות לא יופיעו בריבוע.
          </p>
        </fieldset>

        <fieldset className="block">
          <legend>גודל</legend>
          <CommittedSlider
            min={8}
            max={20}
            value={props.gridSize}
            numberLabel="גודל רשת"
            onCommit={props.onGridSize}
            format={(n) => `גודל רשת: ${n}×${n}`}
          />
          <CommittedSlider
            min={0}
            max={maxImages}
            value={imageCount}
            numberLabel="תמונות על הלוח"
            onCommit={props.onImageCount}
            format={(n) => `תמונות על הלוח: ${n}`}
          />
          <p className="hint">
            כל תמונה מכסה ריבוע לפי גודל הלוח (3×3 או 4×4) בלי אותיות. עד {maxImages} בלוח הזה, בלי
            צלע משותפת (מגע בפינה מותר). כל ציור על הלוח שונה. «ערבב מחדש» משאיר את התמונות שכבר על
            הלוח. שינוי הגדרות יוצר תפזורת מיד, ומשאיר תמונות קיימות כל עוד
            הן נכנסות בלוח.
          </p>
          <label className="range">
            <span>גודל גופן: {props.fontSize}pt</span>
            <div className="size-row">
              <input
                type="range"
                min={12}
                max={28}
                step={1}
                value={props.fontSize}
                onChange={(e) => props.onFontSize(Number(e.target.value))}
              />
              <input
                type="number"
                min={12}
                max={28}
                step={1}
                value={props.fontSize}
                onChange={(e) => {
                  const n = Number(e.target.value)
                  if (n >= 12 && n <= 28) props.onFontSize(n)
                }}
                aria-label="גודל גופן בנקודות"
              />
            </div>
          </label>
        </fieldset>
      </div>

      <div className="actions">
        <button
          type="button"
          className={props.busy ? 'primary is-busy' : 'primary'}
          onClick={props.onReshuffle}
          disabled={props.busy}
        >
          ערבב מחדש
        </button>
      </div>
    </aside>
  )
}
