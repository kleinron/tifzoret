import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ImageCatalogModal } from './components/ImageCatalogModal.tsx'
import { WordBank } from './components/WordBank.tsx'
import { SettingsPanel } from './components/SettingsPanel.tsx'
import { PrinterIcon } from './components/actionIcons.tsx'
import { ShareButton } from './components/ShareButton.tsx'
import { WordGrid } from './components/WordGrid.tsx'
import {
  DEFAULT_DIRECTION_IDS,
  DIRECTIONS,
  type DirectionId,
} from './generator/directions.ts'
import { generatePuzzle, lettersAlong } from './generator/generate.ts'
import {
  imagePolicyForRefresh,
  puzzleRefreshDelay,
  puzzleSettingsKey,
  refreshWordPlan,
  type PuzzleRefresh,
} from './generator/puzzleRefresh.ts'
import {
  clampImageCount,
  DEFAULT_IMAGE_COUNT,
  type ImageBlock,
} from './generator/imageBlocks.ts'
import { parseWordList } from './generator/hebrew.ts'
import type { Cell } from './generator/verify.ts'
import {
  editorValidation,
  formatRemainingDraft,
  looksLikeWordList,
  MAX_BANK_WORDS,
  MAX_GRID_SIZE,
  MAX_WORD_LENGTH,
  messageRandomFillCapped,
  MIN_GRID_SIZE,
  planWordIntake,
} from './generator/wordLimits.ts'
import { catalogShortcutOpens, shortcutFocusFromTarget } from './images/catalogShortcut.ts'
import { payloadFromSearch, type SharePayload } from './share/codec.ts'

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

function clamp(value: number, min: number, max: number, fallback: number): number {
  if (!Number.isFinite(value)) return fallback
  return Math.min(max, Math.max(min, Math.round(value)))
}

function clampGridSize(value: number): number {
  return clamp(value, MIN_GRID_SIZE, MAX_GRID_SIZE, 12)
}

function cellKey(cell: Cell): string {
  return `${cell.row},${cell.col}`
}

function readShareFromWindow(): SharePayload | null {
  if (typeof window === 'undefined') return null
  return payloadFromSearch(window.location.search)
}

export default function App() {
  const [boot] = useState(readShareFromWindow)
  const [enabledDirs, setEnabledDirs] = useState<Set<DirectionId>>(
    () => new Set(boot?.settings?.directions ?? DEFAULT_DIRECTION_IDS),
  )
  const [draft, setDraft] = useState('')
  const [bank, setBank] = useState<string[]>(() =>
    boot?.words !== undefined ? boot.words : DEFAULT_BANK,
  )
  const [randomAge10, setRandomAge10] = useState(
    () => boot?.settings?.randomAge10 ?? false,
  )
  const [noFinals, setNoFinals] = useState(() => boot?.settings?.noFinals ?? false)
  const [gridSize, setGridSize] = useState(() =>
    boot?.settings ? clampGridSize(boot.settings.gridSize) : 12,
  )
  const [imageCount, setImageCount] = useState(() =>
    boot?.settings
      ? clampImageCount(
          boot.settings.imageCount ?? 0,
          clampGridSize(boot.settings.gridSize),
        )
      : DEFAULT_IMAGE_COUNT,
  )
  const [imageBlocks, setImageBlocks] = useState<ImageBlock[]>([])
  const [fontSize, setFontSize] = useState(() =>
    boot?.settings ? clamp(boot.settings.fontSize, 12, 28, 18) : 18,
  )
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notes, setNotes] = useState<string[]>([])
  const [grid, setGrid] = useState<string[][] | null>(null)
  const [puzzleWords, setPuzzleWords] = useState<string[]>([])
  const [foundWords, setFoundWords] = useState<Set<string>>(new Set())
  const [foundCells, setFoundCells] = useState<Map<string, string>>(new Map())
  const [catalogOpen, setCatalogOpen] = useState(false)
  const closeCatalog = useCallback(() => setCatalogOpen(false), [])
  const actionRef = useRef<PuzzleRefresh>('settings')
  const bootedRef = useRef(false)
  const genIdRef = useRef(0)
  const genTimerRef = useRef<number | null>(null)
  const [manualNonce, setManualNonce] = useState(0)
  const liveRef = useRef({
    enabledDirs,
    gridSize,
    imageCount,
    noFinals,
    randomAge10,
    bank,
    puzzleWords,
    imageBlocks,
  })
  liveRef.current = {
    enabledDirs,
    gridSize,
    imageCount,
    noFinals,
    randomAge10,
    bank,
    puzzleWords,
    imageBlocks,
  }

  const toggleDirection = (id: DirectionId) => {
    setEnabledDirs((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const applyIntake = (incoming: readonly string[], size = gridSize): string[] => {
    if (incoming.length === 0) return bank
    const result = planWordIntake(bank, incoming, size)
    setBank(result.nextBank)
    setDraft(formatRemainingDraft(result.remaining))
    return result.nextBank
  }

  const mergeDraftIntoBank = (): string[] => {
    return applyIntake(parseWordList(draft))
  }

  const addWords = () => {
    mergeDraftIntoBank()
  }

  const pasteWords = (text: string) => {
    const combined = draft.trim() ? `${draft}\n${text}` : text
    const incoming = parseWordList(combined)
    const result = planWordIntake(bank, incoming, gridSize)
    const invalid =
      result.tooLong.length > 0 ||
      result.tooLongForGrid.length > 0 ||
      result.overCapacity.length > 0
    if (invalid) {
      const pending = incoming.filter((word) => !bank.includes(word))
      setDraft(formatRemainingDraft(pending))
      return
    }
    applyIntake(incoming)
  }

  const applyGridSize = (value: number) => {
    const next = clampGridSize(value)
    setGridSize(next)
    setImageCount((current) => clampImageCount(current, next))
  }

  const growBoard = (size: number) => {
    const nextSize = clampGridSize(size)
    applyGridSize(nextSize)
    applyIntake(parseWordList(draft), nextSize)
  }

  const validation = editorValidation(bank, draft, gridSize)

  const removeWord = (word: string) => {
    setBank((prev) => prev.filter((w) => w !== word))
  }

  const requestGenerate = (action: PuzzleRefresh) => {
    actionRef.current = action
    setManualNonce((nonce) => nonce + 1)
  }

  const runGenerate = useCallback((action: PuzzleRefresh) => {
    const live = liveRef.current
    const plan = refreshWordPlan(action, live.bank, live.puzzleWords, live.randomAge10)
    const imagePolicy = imagePolicyForRefresh(action, live.imageBlocks.length)
    const snapshot = {
      size: live.gridSize,
      userWords: plan.words,
      directions: [...live.enabledDirs],
      noFinalLetters: live.noFinals,
      randomAge10Fill: plan.randomAge10Fill,
      imageCount: live.imageCount,
      imagePolicy,
      pinnedImageBlocks: imagePolicy === 'roll' ? undefined : live.imageBlocks,
    }
    const id = ++genIdRef.current
    if (genTimerRef.current !== null) window.clearTimeout(genTimerRef.current)
    setBusy(true)
    setError(null)
    genTimerRef.current = window.setTimeout(() => {
      genTimerRef.current = null
      if (genIdRef.current !== id) return
      const result = generatePuzzle(snapshot)
      if (genIdRef.current !== id) return
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
      if (result.skippedMaxLength.length) {
        skipped.push(
          `לא ניתן לשבץ מילים ארוכות מ־${MAX_WORD_LENGTH} אותיות: ${result.skippedMaxLength.join(', ')}`,
        )
      }
      if (result.skippedOverCapacity.length) {
        skipped.push(
          `לא נוספו כי מחסן המילים מוגבל ל־${MAX_BANK_WORDS} מילים: ${result.skippedOverCapacity.join(', ')}`,
        )
      }
      if (result.fillCappedAtMax) {
        skipped.push(messageRandomFillCapped())
      }
      if (result.extraWords.length) {
        skipped.push(`נוספו ${result.extraWords.length} מילים לגיל 10`)
      }
      setNotes(skipped)
      setGrid(result.grid)
      setImageBlocks(result.imageBlocks)
      setPuzzleWords(result.words)
      setFoundWords(new Set())
      setFoundCells(new Map())
    }, 30)
  }, [])

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
    if (!grid) return 'יוצר תפזורת…'
    return `${puzzleWords.length} מילים · ${grid.length}×${grid.length}`
  }, [grid, puzzleWords.length])

  const settingsKey = puzzleSettingsKey({
    directions: [...enabledDirs],
    gridSize,
    imageCount,
    bank,
    randomAge10,
    noFinals,
  })

  useEffect(() => {
    const delay = puzzleRefreshDelay(actionRef.current, bootedRef.current)
    const timer = window.setTimeout(() => {
      bootedRef.current = true
      const action = actionRef.current
      actionRef.current = 'settings'
      runGenerate(action)
    }, delay)
    return () => window.clearTimeout(timer)
  }, [settingsKey, manualNonce, runGenerate])

  useEffect(() => {
    return () => {
      genIdRef.current += 1
      if (genTimerRef.current !== null) window.clearTimeout(genTimerRef.current)
    }
  }, [])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const opens = catalogShortcutOpens(
        event,
        shortcutFocusFromTarget(document.activeElement),
        shortcutFocusFromTarget(event.target),
      )
      if (!opens) return
      // Overrides the browser DevTools chord while this page is focused,
      // except when the user is in a text field.
      event.preventDefault()
      event.stopPropagation()
      setCatalogOpen(true)
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [])

  return (
    <div className="page">
      <header className="topbar">
        <div>
          <h1>תפזורת</h1>
          <p className="tagline no-print">מחולל תפזורות בעברית · בלי שרת</p>
        </div>
        <div className="topbar-actions no-print">
          <ShareButton
            words={bank}
            settings={{
              directions: [...enabledDirs],
              gridSize,
              fontSize,
              randomAge10,
              noFinals,
              imageCount,
            }}
          />
          <button type="button" className="outline topbar-btn topbar-print" onClick={() => window.print()}>
            <PrinterIcon />
            <span>הדפס</span>
          </button>
        </div>
      </header>

      <div className="layout">
        <SettingsPanel
          directions={DIRECTIONS}
          enabled={enabledDirs}
          onToggleDirection={toggleDirection}
          draft={draft}
          onDraftChange={setDraft}
          onAddWords={addWords}
          onPasteWords={pasteWords}
          looksLikeWordList={looksLikeWordList}
          bank={bank}
          bankLimit={MAX_BANK_WORDS}
          issues={validation.issues}
          onGrowBoard={growBoard}
          addDisabled={!validation.canAdd}
          onRemoveWord={removeWord}
          randomAge10={randomAge10}
          onRandomAge10={setRandomAge10}
          noFinals={noFinals}
          onNoFinals={setNoFinals}
          gridSize={gridSize}
          onGridSize={applyGridSize}
          imageCount={imageCount}
          onImageCount={(value) => setImageCount(clampImageCount(value, gridSize))}
          fontSize={fontSize}
          onFontSize={(value) => setFontSize(clamp(value, 12, 28, 18))}
          busy={busy}
          onReshuffle={() => requestGenerate('reshuffle')}
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
              imageBlocks={imageBlocks}
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
      {catalogOpen ? <ImageCatalogModal onClose={closeCatalog} /> : null}
    </div>
  )
}
