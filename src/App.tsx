import { useCallback, useEffect, useMemo, useState } from 'react'
import { WordBank } from './components/WordBank.tsx'
import { SettingsPanel } from './components/SettingsPanel.tsx'
import { WordGrid } from './components/WordGrid.tsx'
import {
  DEFAULT_DIRECTION_IDS,
  DIRECTIONS,
  type DirectionId,
} from './generator/directions.ts'
import { generatePuzzle, lettersAlong } from './generator/generate.ts'
import { parseWordList } from './generator/hebrew.ts'
import type { Cell } from './generator/verify.ts'

const DEFAULT_BANK = [
  'שמש',
  'ירח',
  'כוכב',
  'פרח',
  'ספר',
  'כדור',
  'חתול',
  'מים',
  'שלום',
  'בית',
]

const FOUND_COLORS = [
  '#f4c7c3',
  '#c9e4c9',
  '#c9d6f2',
  '#f6e2a8',
  '#e4d0f2',
  '#c7ebe4',
  '#f5d0b5',
  '#d9e3a8',
]

function cellKey(cell: Cell): string {
  return `${cell.row},${cell.col}`
}

export default function App() {
  const [enabledDirs, setEnabledDirs] = useState<Set<DirectionId>>(
    () => new Set(DEFAULT_DIRECTION_IDS),
  )
  const [draft, setDraft] = useState('')
  const [bank, setBank] = useState<string[]>(DEFAULT_BANK)
  const [randomAge10, setRandomAge10] = useState(false)
  const [noFinals, setNoFinals] = useState(false)
  const [gridSize, setGridSize] = useState(12)
  const [fontSize, setFontSize] = useState(18)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notes, setNotes] = useState<string[]>([])
  const [grid, setGrid] = useState<string[][] | null>(null)
  const [puzzleWords, setPuzzleWords] = useState<string[]>([])
  const [foundWords, setFoundWords] = useState<Set<string>>(new Set())
  const [foundCells, setFoundCells] = useState<Map<string, string>>(new Map())

  const toggleDirection = (id: DirectionId) => {
    setEnabledDirs((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const mergeDraftIntoBank = (): string[] => {
    const parsed = parseWordList(draft)
    if (parsed.length === 0) return bank
    const seen = new Set(bank)
    const next = [...bank]
    for (const word of parsed) {
      if (seen.has(word)) continue
      seen.add(word)
      next.push(word)
    }
    setBank(next)
    setDraft('')
    return next
  }

  const addWords = () => {
    mergeDraftIntoBank()
  }

  const removeWord = (word: string) => {
    setBank((prev) => prev.filter((w) => w !== word))
  }

  const runGenerate = useCallback(
    (userWords: readonly string[], reshuffle = false) => {
      setBusy(true)
      setError(null)
      window.setTimeout(() => {
        const result = generatePuzzle({
          size: gridSize,
          userWords,
          directions: [...enabledDirs],
          noFinalLetters: noFinals,
          randomAge10Fill: reshuffle ? false : randomAge10,
        })
        setBusy(false)
        if (!result.ok) {
          setError(result.errorHe)
          return
        }
        const skipped: string[] = []
        if (result.skippedFinals.length) {
          skipped.push(`הוסרו בגלל אותיות סופיות: ${result.skippedFinals.join(', ')}`)
        }
        if (result.skippedContained.length) {
          skipped.push(
            `הוסרו כי הן מוכלות במילה אחרת: ${result.skippedContained.join(', ')}`,
          )
        }
        if (result.skippedShort.length) {
          skipped.push(`הוסרו מילים קצרות מדי: ${result.skippedShort.join(', ')}`)
        }
        if (result.skippedTooLong.length) {
          skipped.push(`הוסרו כי ארוכות מהרשת: ${result.skippedTooLong.join(', ')}`)
        }
        if (result.extraWords.length) {
          skipped.push(`נוספו ${result.extraWords.length} מילים לגיל 10`)
        }
        setNotes(skipped)
        setGrid(result.grid)
        setPuzzleWords(result.words)
        setFoundWords(new Set())
        setFoundCells(new Map())
      }, 30)
    },
    [enabledDirs, gridSize, noFinals, randomAge10],
  )

  const onPathComplete = (cells: Cell[]) => {
    if (!grid) return
    const forward = lettersAlong(grid, cells)
    const backward = [...forward].reverse().join('')
    const match = puzzleWords.find((w) => w === forward || w === backward)
    if (!match || foundWords.has(match)) return
    const color = FOUND_COLORS[foundWords.size % FOUND_COLORS.length]!
    setFoundWords((prev) => new Set(prev).add(match))
    setFoundCells((prev) => {
      const next = new Map(prev)
      for (const cell of cells) next.set(cellKey(cell), color)
      return next
    })
  }

  const status = useMemo(() => {
    if (!grid) return 'בחרו הגדרות ולחצו «צור תפזורת».'
    return `${puzzleWords.length} מילים · ${grid.length}×${grid.length}`
  }, [grid, puzzleWords.length])

  useEffect(() => {
    runGenerate(DEFAULT_BANK, false)
    // First paint only — avoid regenerating when settings objects change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="page">
      <header className="topbar">
        <div>
          <h1>תפזורת</h1>
          <p className="tagline">מחולל תפזורות בעברית · בלי שרת</p>
        </div>
        <button
          type="button"
          className="primary no-print"
          onClick={() => window.print()}
        >
          הדפס A4
        </button>
      </header>

      <div className="layout">
        <SettingsPanel
          directions={DIRECTIONS}
          enabled={enabledDirs}
          onToggleDirection={toggleDirection}
          draft={draft}
          onDraftChange={setDraft}
          onAddWords={addWords}
          bank={bank}
          onRemoveWord={removeWord}
          randomAge10={randomAge10}
          onRandomAge10={setRandomAge10}
          noFinals={noFinals}
          onNoFinals={setNoFinals}
          gridSize={gridSize}
          onGridSize={setGridSize}
          fontSize={fontSize}
          onFontSize={setFontSize}
          busy={busy}
          onGenerate={() => runGenerate(mergeDraftIntoBank(), false)}
          onReshuffle={() =>
            runGenerate(puzzleWords.length ? puzzleWords : bank, puzzleWords.length > 0)
          }
        />

        <main className="center-col">
          {error ? <p className="banner error no-print">{error}</p> : null}
          {notes.length > 0 && !error ? (
            <ul className="banner notes no-print">
              {notes.map((n) => (
                <li key={n}>{n}</li>
              ))}
            </ul>
          ) : null}
          <p className="status no-print">{status}</p>
          {grid ? (
            <WordGrid
              grid={grid}
              fontSize={fontSize}
              foundCells={foundCells}
              onPathComplete={onPathComplete}
            />
          ) : (
            <section className="panel puzzle-main empty-grid">
              <p>הריבוע יופיע כאן.</p>
            </section>
          )}
        </main>

        <WordBank words={puzzleWords} found={foundWords} />
      </div>
    </div>
  )
}
