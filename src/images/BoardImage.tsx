import type { ReactNode } from 'react'
import type { BoardImageId } from './catalog.ts'

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

function CatIcon() {
  return (
    <Icon backdrop="#ffe8cc">
      <polygon points="14,30 16,12 28,26" fill="#e8943a" />
      <polygon points="50,30 48,12 36,26" fill="#e8943a" />
      <polygon points="17,28 19,16 26,26" fill="#f6c7b8" />
      <polygon points="47,28 45,16 38,26" fill="#f6c7b8" />
      <circle cx="32" cy="36" r="16" fill="#e8943a" />
      <circle cx="25" cy="34" r="2.2" fill="#2a241c" />
      <circle cx="39" cy="34" r="2.2" fill="#2a241c" />
      <polygon points="32,38 28.5,42 35.5,42" fill="#e07a5f" />
      <path
        d="M24 46c2.4 2.2 5 3.2 8 3.2s5.6-1 8-3.2"
        fill="none"
        stroke="#2a241c"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M8 34h10M46 34h10M10 40h8M46 40h8"
        fill="none"
        stroke="#2a241c"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </Icon>
  )
}

function BallIcon() {
  return (
    <Icon backdrop="#fde8e4">
      <circle cx="32" cy="34" r="18" fill="#e24b4b" />
      <path
        d="M16 31c5 5 27 5 32 0"
        fill="none"
        stroke="#fffdf8"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path
        d="M18 41c4.5 3 23 3 28 0"
        fill="none"
        stroke="#fffdf8"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <circle cx="25" cy="27" r="3" fill="#ffd0cc" />
    </Icon>
  )
}

function SunIcon() {
  return (
    <Icon backdrop="#fff6d2">
      <g stroke="#f0b429" strokeWidth="4" strokeLinecap="round">
        <line x1="32" y1="8" x2="32" y2="16" />
        <line x1="32" y1="48" x2="32" y2="56" />
        <line x1="8" y1="32" x2="16" y2="32" />
        <line x1="48" y1="32" x2="56" y2="32" />
        <line x1="15" y1="15" x2="20.5" y2="20.5" />
        <line x1="43.5" y1="43.5" x2="49" y2="49" />
        <line x1="49" y1="15" x2="43.5" y2="20.5" />
        <line x1="20.5" y1="43.5" x2="15" y2="49" />
      </g>
      <circle cx="32" cy="32" r="12" fill="#f6c445" />
      <circle cx="28" cy="29" r="1.7" fill="#2a241c" />
      <circle cx="36" cy="29" r="1.7" fill="#2a241c" />
      <path
        d="M27 35c1.6 2 3.4 3 5 3s3.4-1 5-3"
        fill="none"
        stroke="#2a241c"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </Icon>
  )
}

function FlowerIcon() {
  return (
    <Icon backdrop="#fde8f0">
      <rect x="30" y="38" width="4" height="16" rx="2" fill="#5a9a45" />
      <circle cx="32" cy="16" r="7" fill="#e86b93" />
      <circle cx="46" cy="26" r="7" fill="#e86b93" />
      <circle cx="41" cy="40" r="7" fill="#e86b93" />
      <circle cx="23" cy="40" r="7" fill="#e86b93" />
      <circle cx="18" cy="26" r="7" fill="#e86b93" />
      <circle cx="32" cy="28" r="7" fill="#f6c445" />
    </Icon>
  )
}

function FishIcon() {
  return (
    <Icon backdrop="#e5f4fa">
      <polygon points="48,32 62,18 62,46" fill="#3d9cc9" />
      <ellipse cx="30" cy="32" rx="18" ry="12" fill="#3d9cc9" />
      <circle cx="20" cy="29" r="2.1" fill="#2a241c" />
      <circle cx="19.2" cy="28.3" r="0.7" fill="#fffdf8" />
      <path
        d="M30 24c4 3 4 13 0 16"
        fill="none"
        stroke="#2f7fa3"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </Icon>
  )
}

function StarIcon() {
  return (
    <Icon backdrop="#fff6d8">
      <polygon
        points="32,8 37.5,24 54,24 40.6,33.6 45.8,50 32,40 18.2,50 23.4,33.6 10,24 26.5,24"
        fill="#f6c445"
        stroke="#e09a2b"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </Icon>
  )
}

function TreeIcon() {
  return (
    <Icon backdrop="#e7f3e4">
      <rect x="28" y="36" width="8" height="16" rx="2" fill="#8a5a32" />
      <circle cx="32" cy="28" r="14" fill="#5a9a45" />
      <circle cx="24" cy="32" r="8" fill="#6aaf52" />
      <circle cx="40" cy="32" r="8" fill="#4e8c3c" />
    </Icon>
  )
}

function BirdIcon() {
  return (
    <Icon backdrop="#fff0e4">
      <ellipse cx="28" cy="38" rx="16" ry="11" fill="#ef8b4c" />
      <circle cx="42" cy="28" r="9" fill="#ef8b4c" />
      <polygon points="49,28 60,23 51,33" fill="#f2c14e" />
      <circle cx="45" cy="26" r="1.7" fill="#2a241c" />
      <polygon points="18,36 6,28 16,44" fill="#d8743a" />
      <path
        d="M22 46c2 4 8 5 12 2"
        fill="none"
        stroke="#d8743a"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </Icon>
  )
}

export function BoardImage({ id }: { id: BoardImageId }) {
  switch (id) {
    case 'cat':
      return <CatIcon />
    case 'ball':
      return <BallIcon />
    case 'sun':
      return <SunIcon />
    case 'flower':
      return <FlowerIcon />
    case 'fish':
      return <FishIcon />
    case 'star':
      return <StarIcon />
    case 'tree':
      return <TreeIcon />
    case 'bird':
      return <BirdIcon />
    default: {
      const unknown: never = id
      throw new Error(`Unknown image ${String(unknown)}`)
    }
  }
}
