import { HolidayPacks, type HolidayPacksProps } from './HolidayPacks.tsx'

export type WordBankProps = {
  words: readonly string[]
  found: ReadonlySet<string>
  holidayOpen: boolean
  holidayPack: HolidayPacksProps['activeId']
  onToggleHoliday: () => void
  onSelectHoliday: HolidayPacksProps['onSelect']
}

export function WordBank(props: WordBankProps) {
  return (
    <aside className="panel word-bank" aria-label="מחסן מילים">
      <div className="word-bank-header">
        <h2>מחסן מילים</h2>
        <HolidayPacks
          open={props.holidayOpen}
          activeId={props.holidayPack}
          onToggle={props.onToggleHoliday}
          onSelect={props.onSelectHoliday}
        />
      </div>
      {props.words.length === 0 ? (
        <p className="hint">מילות המחסן יופיעו כאן אחרי יצירת התפזורת.</p>
      ) : (
        <ul className="word-bank-list" dir="rtl">
          {props.words.map((word) => (
            <li key={word} className={props.found.has(word) ? 'found-word' : undefined}>
              {word}
            </li>
          ))}
        </ul>
      )}
    </aside>
  )
}
