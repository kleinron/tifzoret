import { useCallback, useId, useRef, useState, type PointerEvent } from 'react'
import type { Cell } from '../generator/verify.ts'

export type WordGridProps = {
  grid: string[][]
  fontSize: number
  foundCells: ReadonlyMap<string, string>
  onPathComplete: (cells: Cell[]) => void
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
  return { row, col }
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

  return (
    <section className="panel puzzle-main" aria-labelledby={labelId}>
      <h2 id={labelId} className="visually-hidden">
        ריבוע האותיות
      </h2>
      <div
        ref={rootRef}
        className="letter-grid"
        dir="ltr"
        style={{
          gridTemplateColumns: `repeat(${size}, 1fr)`,
          fontSize: `${props.fontSize}pt`,
          width: `min(100%, ${Math.max(size * 1.85, 8)}em)`,
        }}
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
            const foundColor = props.foundCells.get(key)
            const classes = ['cell']
            if (previewKeys.has(key)) classes.push('preview')
            if (foundColor) classes.push('found')
            return (
              <div
                key={key}
                className={classes.join(' ')}
                data-cell=""
                data-row={r}
                data-col={c}
                role="gridcell"
                style={foundColor ? { backgroundColor: foundColor } : undefined}
              >
                {letter}
              </div>
            )
          }),
        )}
      </div>
    </section>
  )
}
