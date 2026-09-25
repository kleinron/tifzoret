import { useId } from 'react'
import { HOLIDAY_PACKS, type HolidayPackId } from '../data/holidayPacks.ts'

export type HolidayPacksProps = {
  open: boolean
  activeId: HolidayPackId
  onToggle: () => void
  onSelect: (id: HolidayPackId) => void
}

export function HolidayPacks(props: HolidayPacksProps) {
  const rowId = useId()
  return (
    <>
      <button
        type="button"
        className={props.open ? 'holiday-toggle is-open no-print' : 'holiday-toggle no-print'}
        aria-expanded={props.open}
        aria-controls={rowId}
        onClick={props.onToggle}
      >
        חגים
      </button>
      {props.open ? (
        <div id={rowId} className="holiday-row no-print" role="group" aria-label="חגים">
          {HOLIDAY_PACKS.map((pack) => {
            const selected = pack.id === props.activeId
            return (
              <button
                key={pack.id}
                type="button"
                className={selected ? 'holiday-chip is-selected' : 'holiday-chip'}
                aria-pressed={selected}
                onClick={() => props.onSelect(pack.id)}
              >
                {pack.label}
              </button>
            )
          })}
        </div>
      ) : null}
    </>
  )
}
