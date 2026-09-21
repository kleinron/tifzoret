import type { Direction, DirectionId } from '../generator/directions.ts'

export type SettingsPanelProps = {
  directions: readonly Direction[]
  enabled: ReadonlySet<DirectionId>
  onToggleDirection: (id: DirectionId) => void
  draft: string
  onDraftChange: (value: string) => void
  onAddWords: () => void
  bank: readonly string[]
  onRemoveWord: (word: string) => void
  randomAge10: boolean
  onRandomAge10: (value: boolean) => void
  noFinals: boolean
  onNoFinals: (value: boolean) => void
  gridSize: number
  onGridSize: (value: number) => void
  fontSize: number
  onFontSize: (value: number) => void
  busy: boolean
  onGenerate: () => void
  onReshuffle: () => void
}

export function SettingsPanel(props: SettingsPanelProps) {
  return (
    <aside className="panel settings no-print" aria-label="הגדרות">
      <h2>הגדרות</h2>
      <div className="settings-body">
        <fieldset className="block">
          <legend>כיוונים</legend>
          <p className="hint">סמנו כל כיוון שבו מותר לשבץ מילים.</p>
          <ul className="direction-list">
            {props.directions.map((dir) => (
              <li key={dir.id}>
                <label>
                  <input
                    type="checkbox"
                    checked={props.enabled.has(dir.id)}
                    onChange={() => props.onToggleDirection(dir.id)}
                  />
                  <span>{dir.label}</span>
                </label>
              </li>
            ))}
          </ul>
        </fieldset>

        <fieldset className="block">
          <legend>מילים</legend>
          <p className="hint">מילה בכל שורה או מופרדות בפסיק. ניקוד ורווחים מוסרים.</p>
          <textarea
            value={props.draft}
            onChange={(e) => props.onDraftChange(e.target.value)}
            rows={3}
            placeholder={'שמש\nירח\nכוכב'}
            dir="rtl"
          />
          <button type="button" className="secondary" onClick={props.onAddWords}>
            הוסף לרשימה
          </button>
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
            <p className="hint">אין מילים ברשימה עדיין.</p>
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
            <span>השלם אקראי לגיל 10</span>
          </label>
          <p className="hint">מוסיף מילים ידידותיות לגיל ~10 מקובץ מובנה, בלי רשת.</p>
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
        <button type="button" className="primary" onClick={props.onGenerate} disabled={props.busy}>
          {props.busy ? 'יוצר…' : 'צור תפזורת'}
        </button>
        <button type="button" className="secondary" onClick={props.onReshuffle} disabled={props.busy}>
          ערבב מחדש
        </button>
      </div>
    </aside>
  )
}

