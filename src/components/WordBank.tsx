export type WordBankProps = {
  words: readonly string[]
  found: ReadonlySet<string>
}

export function WordBank(props: WordBankProps) {
  return (
    <aside className="panel word-bank" aria-label="בנק מילים">
      <h2>בנק מילים</h2>
      {props.words.length === 0 ? (
        <p className="hint">המילים יופיעו כאן אחרי יצירת התפזורת.</p>
      ) : (
        <ul>
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
