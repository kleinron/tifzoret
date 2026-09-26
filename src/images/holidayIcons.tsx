import type { ReactNode } from 'react'

/** Same plate as the default catalog: rounded square, no text, no network assets. */
function Icon({
  backdrop,
  children,
}: {
  backdrop: string
  children: ReactNode
}) {
  return (
    <svg
      className="board-image"
      viewBox="0 0 64 64"
      aria-hidden="true"
      focusable="false"
    >
      <rect x="1" y="1" width="62" height="62" rx="12" fill={backdrop} />
      {children}
    </svg>
  )
}

export function HanukkiahIcon() {
  const candles = [
    { x: 6, top: 30 },
    { x: 12.5, top: 26 },
    { x: 19, top: 22 },
    { x: 25.5, top: 18 },
    { x: 32, top: 9 },
    { x: 38.5, top: 18 },
    { x: 45, top: 22 },
    { x: 51.5, top: 26 },
    { x: 58, top: 30 },
  ]
  return (
    <Icon backdrop="#fff3d0">
      <rect x="18" y="50" width="28" height="6" rx="2" fill="#a87422" />
      <rect x="24" y="46" width="16" height="6" rx="1.5" fill="#c4892a" />
      <rect x="30.4" y="14" width="3.2" height="34" rx="1" fill="#e0a83a" />
      <path
        d="M8 44h48"
        fill="none"
        stroke="#e0a83a"
        strokeWidth="3.2"
        strokeLinecap="round"
      />
      {candles.map((candle) => (
        <g key={candle.x}>
          <rect
            x={candle.x}
            y={candle.top}
            width="3.4"
            height={44 - candle.top}
            rx="1"
            fill="#fffdf8"
          />
          <ellipse cx={candle.x + 1.7} cy={candle.top - 2.2} rx="2.1" ry="3.3" fill="#f27a1a" />
          <ellipse cx={candle.x + 1.7} cy={candle.top - 1.4} rx="1" ry="1.7" fill="#ffe08a" />
        </g>
      ))}
    </Icon>
  )
}

export function DreidelIcon() {
  return (
    <Icon backdrop="#e5f4fa">
      <circle cx="32" cy="9" r="3.2" fill="#c4892a" />
      <rect x="29.2" y="10" width="5.6" height="8" rx="2" fill="#8a5a32" />
      <rect x="15" y="18" width="34" height="26" rx="4" fill="#3d9cc9" />
      <rect x="15" y="18" width="34" height="6" rx="2" fill="#2f7fa3" />
      <polygon points="17,44 47,44 32,58" fill="#2f7fa3" />
    </Icon>
  )
}

export function OilJugIcon() {
  return (
    <Icon backdrop="#fff1e0">
      <path
        d="M32 26c20-2 24 14 2 22"
        fill="none"
        stroke="#c46a4a"
        strokeWidth="3.6"
        strokeLinecap="round"
      />
      <ellipse cx="30" cy="40" rx="14" ry="15" fill="#d98978" />
      <ellipse cx="24" cy="38" rx="3.2" ry="6" fill="#e7a08a" />
      <rect x="23" y="20" width="14" height="12" rx="4" fill="#c46a4a" />
      <ellipse cx="30" cy="20" rx="7" ry="3.2" fill="#e0a83a" />
      <ellipse cx="30" cy="20" rx="3.4" ry="1.5" fill="#f6c445" />
      <path
        d="M27 18.4c.4-5.4 5.6-5.4 6 0"
        fill="none"
        stroke="#f0b429"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <circle cx="30" cy="15.6" r="2.4" fill="#f6c445" />
    </Icon>
  )
}

export function SufganiyahIcon() {
  return (
    <Icon backdrop="#fde8f0">
      <circle cx="32" cy="37" r="15.5" fill="#c4892a" />
      <circle cx="32" cy="33.5" r="15.5" fill="#e0944a" />
      <ellipse cx="25.5" cy="28" rx="5" ry="3" fill="#f2c36a" />
      <g fill="#fffdf8">
        <circle cx="24" cy="24" r="1.8" />
        <circle cx="29" cy="21.5" r="1.6" />
        <circle cx="34" cy="22.2" r="1.9" />
        <circle cx="39" cy="24" r="1.5" />
        <circle cx="22" cy="28.5" r="1.4" />
        <circle cx="27.5" cy="27" r="1.3" />
        <circle cx="36.5" cy="27.2" r="1.6" />
        <circle cx="41.5" cy="28.5" r="1.3" />
        <circle cx="31" cy="25.5" r="1.2" />
        <circle cx="20.5" cy="32" r="1.15" />
        <circle cx="43" cy="32" r="1.1" />
      </g>
      <ellipse cx="33" cy="35.2" rx="3.3" ry="2.3" fill="#c43b3b" />
      <ellipse cx="32.1" cy="34.4" rx="1.4" ry="0.85" fill="#e24b4b" />
    </Icon>
  )
}

export function CandleIcon() {
  return (
    <Icon backdrop="#fff6e8">
      <rect x="27" y="28" width="10" height="24" rx="2" fill="#fffdf8" />
      <rect x="27" y="28" width="10" height="5" rx="1" fill="#e24b4b" />
      <ellipse cx="29.5" cy="38" rx="1.5" ry="7" fill="#f3e6c4" />
      <rect x="31" y="22" width="2" height="7" rx="0.6" fill="#2a241c" />
      <ellipse cx="32" cy="16" rx="5" ry="8" fill="#f27a1a" />
      <ellipse cx="32" cy="15" rx="2.3" ry="4" fill="#ffe08a" />
    </Icon>
  )
}

export function GeltIcon() {
  return (
    <Icon backdrop="#fff8dc">
      <ellipse cx="24" cy="44" rx="13" ry="5" fill="#a87422" />
      <ellipse cx="24" cy="40" rx="13" ry="5" fill="#c4892a" />
      <ellipse cx="24" cy="36" rx="13" ry="5" fill="#e0a83a" />
      <ellipse cx="24" cy="34" rx="13" ry="5.2" fill="#f0b429" />
      <ellipse cx="24" cy="34" rx="7" ry="2.6" fill="#c4892a" />
      <g transform="rotate(-16 46 28)">
        <circle cx="46" cy="28" r="12" fill="#e0a83a" />
        <circle cx="46" cy="28" r="8" fill="#f6c445" />
        <circle cx="46" cy="28" r="4.2" fill="none" stroke="#c4892a" strokeWidth="1.8" />
      </g>
    </Icon>
  )
}

export function MegillahIcon() {
  return (
    <Icon backdrop="#f6efe2">
      <rect x="18" y="18" width="28" height="28" rx="1" fill="#f3e6c4" />
      <rect x="12" y="14" width="6" height="36" rx="3" fill="#8a5a32" />
      <rect x="46" y="14" width="6" height="36" rx="3" fill="#8a5a32" />
      <circle cx="15" cy="14" r="3.3" fill="#c4892a" />
      <circle cx="49" cy="14" r="3.3" fill="#c4892a" />
      <circle cx="15" cy="50" r="3.3" fill="#c4892a" />
      <circle cx="49" cy="50" r="3.3" fill="#c4892a" />
    </Icon>
  )
}

export function GraggerIcon() {
  return (
    <Icon backdrop="#fde8e4">
      <rect x="28" y="32" width="8" height="22" rx="3" fill="#8a5a32" />
      <circle cx="32" cy="54" r="3.2" fill="#c4892a" />
      <rect x="10" y="12" width="44" height="24" rx="5" fill="#e24b4b" />
      <rect x="14" y="16" width="36" height="16" rx="3" fill="#c43b3b" />
      <circle cx="32" cy="24" r="5.2" fill="#f6c445" />
      <rect x="30" y="7" width="4" height="9" rx="1" fill="#f2c14e" />
    </Icon>
  )
}

export function HamantaschIcon() {
  return (
    <Icon backdrop="#fff0ea">
      <polygon points="32,8 8,54 56,54" fill="#e0a83a" />
      <polygon points="32,16 16,50 48,50" fill="#f2c36a" />
      <polygon points="32,8 24,28 32,22" fill="#c4892a" />
      <polygon points="32,8 40,28 32,22" fill="#f6d35a" />
      <polygon points="32,30 22,48 42,48" fill="#4a2e22" />
    </Icon>
  )
}

export function MaskIcon() {
  return (
    <Icon backdrop="#ece4f7">
      <path
        d="M12 30c0-10 8-16 20-16s20 6 20 16c0 14-8 22-20 22S12 44 12 30z"
        fill="#7a5aaa"
      />
      <path d="M46 20c8-8 14-4 10 4-3 5-8 5-10 1z" fill="#e86b93" />
      <ellipse cx="24" cy="30" rx="6.2" ry="5" fill="#fffdf8" />
      <ellipse cx="40" cy="30" rx="6.2" ry="5" fill="#fffdf8" />
      <circle cx="24" cy="30" r="2.1" fill="#2a241c" />
      <circle cx="40" cy="30" r="2.1" fill="#2a241c" />
      <path
        d="M26 42c2 2.2 4 3.2 6 3.2s4-1 6-3.2"
        fill="none"
        stroke="#f6c445"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </Icon>
  )
}

export function CrownIcon() {
  return (
    <Icon backdrop="#fff6d2">
      <polygon points="8,44 14,16 24,32 32,12 40,32 50,16 56,44" fill="#f0b429" />
      <rect x="8" y="40" width="48" height="12" rx="2" fill="#e0a83a" />
      <circle cx="32" cy="24" r="2.6" fill="#e24b4b" />
      <circle cx="18" cy="45" r="2.4" fill="#e24b4b" />
      <circle cx="32" cy="45" r="2.4" fill="#3d9cc9" />
      <circle cx="46" cy="45" r="2.4" fill="#5a9a45" />
    </Icon>
  )
}

export function MishloachIcon() {
  return (
    <Icon backdrop="#e7f3e4">
      <path d="M14 32h36l-4 20H18z" fill="#c46a4a" />
      <path d="M16 38h32M17 44h30" stroke="#a85638" strokeWidth="2" strokeLinecap="round" />
      <ellipse cx="32" cy="32" rx="18" ry="5" fill="#d98978" />
      <polygon points="22,30 15,16 29,16" fill="#e0a83a" />
      <polygon points="22,24 18,16 26,16" fill="#4a2e22" />
      <circle cx="40" cy="18" r="6.5" fill="#e24b4b" />
      <path
        d="M40 12c1-4 4-5 6-3"
        fill="none"
        stroke="#5a9a45"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <rect x="47" y="20" width="7" height="12" rx="2" fill="#7eb6d6" />
      <rect x="48.2" y="16" width="4.6" height="5" rx="1" fill="#3d9cc9" />
    </Icon>
  )
}
