type IconProps = {
  className?: string
}

/**
 * One arrow, rotated so every compass direction shares stroke weight,
 * head shape, and optical size. 0° points up.
 */
export function DirectionArrow({
  rotation,
  className,
}: IconProps & { rotation: number }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M12 18.8V6.7M7 10.2 12 5.2l5 5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        transform={`rotate(${rotation} 12 12)`}
      />
    </svg>
  )
}

export function PrinterIcon({ className = 'btn-icon' }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M7 8.2V4.2h10v4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M6.2 16.6H5.2A1.7 1.7 0 0 1 3.5 14.9v-4.2A1.7 1.7 0 0 1 5.2 9h13.6a1.7 1.7 0 0 1 1.7 1.7v4.2a1.7 1.7 0 0 1-1.7 1.7h-1"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M7.2 14.2h9.6V20H7.2z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/** Network share glyph. Hub sits toward the label; nodes point outward in RTL. */
export function ShareIcon({ className = 'btn-icon' }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="6.2" cy="12" r="2.15" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="17.6" cy="6.15" r="2.15" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="17.6" cy="17.85" r="2.15" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M8.15 11.05 15.45 7.2M8.15 12.95 15.45 16.8"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  )
}
