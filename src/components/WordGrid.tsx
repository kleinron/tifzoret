import {
  useCallback,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent,
} from 'react'
import {
  BLOCKED_CELL,
  pictureBlockSize,
  type ImageBlock,
} from '../generator/imageBlocks.ts'
import { BoardImage } from '../images/BoardImage.tsx'
import { boardImageLabel } from '../images/catalog.ts'
import type { Cell } from '../generator/verify.ts'

export type WordGridProps = {
  grid: string[][]
  fontSize: number
  foundCells: ReadonlyMap<string, string>
  onPathComplete: (cells: Cell[]) => void
  imageBlocks?: readonly ImageBlock[]
}

function cellKey(row: number, col: number): string {
  return `${row},${col}`
}

function lineCells(start: Cell, end: Cell): Cell[] {
  const dRow = end.row - start.row
  const dCol = end.col - start.col
  const absR = Math.abs(dRow)
  const absC = Math.abs(dCol)
  if (absR !== 0 && absC !== 0 && absR !== absC) return [start]
  const steps = Math.max(absR, absC)
  if (steps === 0) return [start]
  const dr = Math.sign(dRow)
  const dc = Math.sign(dCol)
  const cells: Cell[] = []
  for (let i = 0; i <= steps; i++) {
    cells.push({ row: start.row + dr * i, col: start.col + dc * i })
  }
  return cells
}

function cellFromEvent(
  event: PointerEvent<HTMLDivElement>,
  root: HTMLElement,
  size: number,
): Cell | null {
  const target = document.elementFromPoint(event.clientX, event.clientY)
  const cellEl = target instanceof Element ? target.closest('[data-cell]') : null
  if (!cellEl || !root.contains(cellEl)) return null
  const row = Number(cellEl.getAttribute('data-row'))
  const col = Number(cellEl.getAttribute('data-col'))
  if (!Number.isInteger(row) || !Number.isInteger(col)) return null
  if (row < 0 || col < 0 || row >= size || col >= size) return null
  if (!cellEl.classList.contains('cell-image')) return { row, col }
  const rect = cellEl.getBoundingClientRect()
  if (rect.width <= 0 || rect.height <= 0) return { row, col }
  const relX = Math.min(Math.max(event.clientX - rect.left, 0), rect.width - 0.01)
  const relY = Math.min(Math.max(event.clientY - rect.top, 0), rect.height - 0.01)
  const span = pictureBlockSize(size)
  const imageCol = Math.min(span - 1, Math.floor((relX / rect.width) * span))
  const imageRow = Math.min(span - 1, Math.floor((relY / rect.height) * span))
  const next = { row: row + imageRow, col: col + imageCol }
  if (next.row >= size || next.col >= size) return { row, col }
  return next
}

export function WordGrid(props: WordGridProps) {
  const size = props.grid.length
  const rootRef = useRef<HTMLDivElement>(null)
  const startRef = useRef<Cell | null>(null)
  const [preview, setPreview] = useState<Cell[]>([])
  const labelId = useId()

  const finish = useCallback(
    (cells: Cell[]) => {
      startRef.current = null
      setPreview([])
      if (cells.length >= 2) props.onPathComplete(cells)
    },
    [props],
  )

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return
    const root = rootRef.current
    if (!root) return
    const cell = cellFromEvent(event, root, size)
    if (!cell) return
    root.setPointerCapture(event.pointerId)
    startRef.current = cell
    setPreview([cell])
  }

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const start = startRef.current
    const root = rootRef.current
    if (!start || !root) return
    const cell = cellFromEvent(event, root, size)
    if (!cell) return
    setPreview(lineCells(start, cell))
  }

  const onPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    const start = startRef.current
    const root = rootRef.current
    if (!start || !root) return
    const cell = cellFromEvent(event, root, size) ?? preview[preview.length - 1]
    const cells = cell ? lineCells(start, cell) : preview
    finish(cells)
  }

  const previewKeys = new Set(preview.map((c) => cellKey(c.row, c.col)))
  const imageBlocks = props.imageBlocks ?? []
  const span = pictureBlockSize(size)
  const imageByOrigin = new Map<string, ImageBlock>()
  const covered = new Set<string>()
  for (const block of imageBlocks) {
    imageByOrigin.set(cellKey(block.row, block.col), block)
    for (let dr = 0; dr < span; dr++) {
      for (let dc = 0; dc < span; dc++) {
        covered.add(cellKey(block.row + dr, block.col + dc))
      }
    }
  }

  return (
    <section className="panel puzzle-main" aria-labelledby={labelId}>
      <h2 id={labelId} className="visually-hidden">
        ריבוע האותיות
      </h2>
      <div
        ref={rootRef}
        className="letter-grid"
        dir="ltr"
        style={
          {
            '--grid-n': String(size),
            fontSize: `${props.fontSize}pt`,
          } as CSSProperties
        }
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={() => finish([])}
        role="grid"
        aria-rowcount={size}
        aria-colcount={size}
      >
        {props.grid.map((row, r) =>
          row.map((letter, c) => {
            const key = cellKey(r, c)
            const image = imageByOrigin.get(key)
            if (image) {
              return (
                <div
                  key={key}
                  className="cell cell-image"
                  data-cell=""
                  data-row={r}
                  data-col={c}
                  data-image={image.imageId}
                  role="gridcell"
                  aria-label={`תמונה: ${boardImageLabel(image.imageId)}`}
                  style={{
                    gridRow: `${r + 1} / span ${span}`,
                    gridColumn: `${c + 1} / span ${span}`,
                  }}
                >
                  <BoardImage id={image.imageId} />
                </div>
              )
            }
            if (covered.has(key)) return null
            const foundColor = props.foundCells.get(key)
            const classes = ['cell']
            if (previewKeys.has(key)) classes.push('preview')
            if (foundColor) classes.push('found')
            const shown = letter === BLOCKED_CELL ? '' : letter
            return (
              <div
                key={key}
                className={classes.join(' ')}
                data-cell=""
                data-row={r}
                data-col={c}
                role="gridcell"
                style={{
                  gridRow: r + 1,
                  gridColumn: c + 1,
                  ...(foundColor ? { backgroundColor: foundColor } : {}),
                }}
              >
                <span className="cell-letter">{shown}</span>
              </div>
            )
          }),
        )}
      </div>
    </section>
  )
}
