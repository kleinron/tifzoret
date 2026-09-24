import type { ClipboardEvent } from 'react'
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
          <label className="range">
            <span>גודל רשת: {props.gridSize}×{props.gridSize}</span>
            <div className="size-row">
              <input
                type="range"
                min={8}
                max={20}
                step={1}
                value={props.gridSize}
                onChange={(e) => props.onGridSize(Number(e.target.value))}
              />
              <input
                type="number"
                min={8}
                max={20}
                step={1}
                value={props.gridSize}
                onChange={(e) => {
                  const n = Number(e.target.value)
                  if (n >= 8 && n <= 20) props.onGridSize(n)
                }}
                aria-label="גודל רשת"
              />
            </div>
          </label>
          <label className="range">
            <span>תמונות על הלוח: {imageCount}</span>
            <div className="size-row">
              <input
                type="range"
                min={0}
                max={maxImages}
                step={1}
                value={imageCount}
                onChange={(e) => props.onImageCount(Number(e.target.value))}
              />
              <input
                type="number"
                min={0}
                max={maxImages}
                step={1}
                value={imageCount}
                onChange={(e) => {
                  const n = Number(e.target.value)
                  if (n >= 0 && n <= maxImages) props.onImageCount(n)
                }}
                aria-label="תמונות על הלוח"
              />
            </div>
          </label>
          <p className="hint">
            כל תמונה מכסה 4×4 משבצות בלי אותיות. עד {maxImages} בלוח הזה, בלי
            צלע משותפת (מגע בפינה מותר). «ערבב מחדש» משאיר את התמונות שכבר על
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
          className={props.busy ? 'secondary is-busy' : 'secondary'}
          onClick={props.onReshuffle}
          disabled={props.busy}
        >
          ערבב מחדש
        </button>
      </div>
    </aside>
  )
}
