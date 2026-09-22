export type WordBankProps = {
  words: readonly string[]
  found: ReadonlySet<string>
}

export function WordBank(props: WordBankProps) {
  return (
    <aside className="panel word-bank" aria-label="מחסן מילים">
      <h2>מחסן מילים</h2>
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
