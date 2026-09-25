import type { ReactNode } from 'react'
import type { BoardImageId } from './catalog.ts'
import {
  CandleIcon,
  CrownIcon,
  DreidelIcon,
  GeltIcon,
  GraggerIcon,
  HamantaschIcon,
  HanukkiahIcon,
  MaskIcon,
  MegillahIcon,
  MishloachIcon,
  OilJugIcon,
  SufganiyahIcon,
} from './holidayIcons.tsx'

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

function HouseIcon() {
  return (
    <Icon backdrop="#fff1e0">
      <rect x="40" y="14" width="6" height="12" rx="1" fill="#c46a4a" />
      <polygon points="32,8 8,32 56,32" fill="#e07a5f" />
      <rect x="14" y="30" width="36" height="22" rx="2" fill="#f3c56b" />
      <rect x="18" y="35" width="8" height="8" rx="1" fill="#7eb6d6" />
      <rect x="38" y="35" width="8" height="8" rx="1" fill="#7eb6d6" />
      <rect x="27" y="38" width="10" height="14" rx="1.5" fill="#8a5a32" />
    </Icon>
  )
}

function CarIcon() {
  return (
    <Icon backdrop="#e7f3e4">
      <polygon points="18,34 25,22 42,22 50,34" fill="#f2a35a" />
      <rect x="8" y="32" width="48" height="14" rx="5" fill="#e07a5f" />
      <rect x="27" y="24" width="6.5" height="7" rx="1" fill="#fffdf8" />
      <rect x="36" y="24" width="6.5" height="7" rx="1" fill="#fffdf8" />
      <circle cx="50" cy="37" r="2" fill="#f6e27a" />
      <circle cx="18" cy="46" r="5.2" fill="#2a241c" />
      <circle cx="46" cy="46" r="5.2" fill="#2a241c" />
      <circle cx="18" cy="46" r="2" fill="#efe8dc" />
      <circle cx="46" cy="46" r="2" fill="#efe8dc" />
    </Icon>
  )
}

function AppleIcon() {
  return (
    <Icon backdrop="#fff0ea">
      <ellipse cx="32" cy="37" rx="14" ry="15" fill="#e24b4b" />
      <path
        d="M32 24c.4-6 4.2-10 8.5-10"
        fill="none"
        stroke="#8a5a32"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <ellipse cx="42" cy="16" rx="6.2" ry="3.2" fill="#5a9a45" transform="rotate(38 42 16)" />
      <ellipse cx="25" cy="33" rx="3" ry="4.6" fill="#ffb0aa" />
    </Icon>
  )
}

function HeartIcon() {
  return (
    <Icon backdrop="#fde8f0">
      <circle cx="23.5" cy="28" r="11" fill="#e24b6a" />
      <circle cx="40.5" cy="28" r="11" fill="#e24b6a" />
      <polygon points="13.6,33 50.4,33 32,54" fill="#e24b6a" />
      <ellipse cx="20" cy="24" rx="3" ry="2" fill="#ffc2ce" />
    </Icon>
  )
}

function CloudIcon() {
  return (
    <Icon backdrop="#cfe8f6">
      <circle cx="24" cy="34" r="10" fill="#fffdf8" />
      <circle cx="37" cy="28" r="12" fill="#fffdf8" />
      <circle cx="48" cy="35" r="8" fill="#fffdf8" />
      <ellipse cx="34" cy="40" rx="20" ry="9" fill="#fffdf8" />
    </Icon>
  )
}

function MoonIcon() {
  return (
    <Icon backdrop="#ece4f7">
      <circle cx="27" cy="33" r="16" fill="#f6d35a" />
      <circle cx="38" cy="27" r="13" fill="#ece4f7" />
      <circle cx="48" cy="16" r="1.7" fill="#f0b429" />
      <circle cx="54" cy="28" r="1.1" fill="#e09a2b" />
    </Icon>
  )
}

function ButterflyIcon() {
  return (
    <Icon backdrop="#fff6e8">
      <ellipse cx="21" cy="27" rx="12" ry="10" fill="#e86b93" />
      <ellipse cx="43" cy="27" rx="12" ry="10" fill="#e86b93" />
      <ellipse cx="23" cy="43" rx="9" ry="8" fill="#f6c445" />
      <ellipse cx="41" cy="43" rx="9" ry="8" fill="#f6c445" />
      <circle cx="20" cy="26" r="2.6" fill="#fffdf8" />
      <circle cx="44" cy="26" r="2.6" fill="#fffdf8" />
      <ellipse cx="32" cy="35" rx="2.8" ry="13" fill="#6b4a32" />
      <circle cx="32" cy="20" r="3.3" fill="#6b4a32" />
      <path
        d="M29.4 18C26 12 24 10 22 8M34.6 18C38 12 40 10 42 8"
        fill="none"
        stroke="#6b4a32"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <circle cx="22" cy="8" r="1.4" fill="#6b4a32" />
      <circle cx="42" cy="8" r="1.4" fill="#6b4a32" />
    </Icon>
  )
}

function BoatIcon() {
  return (
    <Icon backdrop="#e5f4fa">
      <polygon points="33,14 50,40 33,40" fill="#fffdf8" />
      <polygon points="31,22 16,40 31,40" fill="#ffe8cc" />
      <rect x="31" y="12" width="2.4" height="32" rx="1" fill="#8a5a32" />
      <polygon points="12,42 52,42 46,54 18,54" fill="#d86a45" />
      <path
        d="M12 58c6-3.2 9 2.4 14 0s8 3.2 14 0 8 3.2 14 0"
        fill="none"
        stroke="#3d9cc9"
        strokeWidth="2.4"
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
    case 'house':
      return <HouseIcon />
    case 'car':
      return <CarIcon />
    case 'apple':
      return <AppleIcon />
    case 'heart':
      return <HeartIcon />
    case 'cloud':
      return <CloudIcon />
    case 'moon':
      return <MoonIcon />
    case 'butterfly':
      return <ButterflyIcon />
    case 'boat':
      return <BoatIcon />
    case 'hanukkiah':
      return <HanukkiahIcon />
    case 'dreidel':
      return <DreidelIcon />
    case 'oil-jug':
      return <OilJugIcon />
    case 'sufganiyah':
      return <SufganiyahIcon />
    case 'candle':
      return <CandleIcon />
    case 'gelt':
      return <GeltIcon />
    case 'megillah':
      return <MegillahIcon />
    case 'gragger':
      return <GraggerIcon />
    case 'hamantasch':
      return <HamantaschIcon />
    case 'mask':
      return <MaskIcon />
    case 'crown':
      return <CrownIcon />
    case 'mishloach':
      return <MishloachIcon />
    default: {
      const unknown: never = id
      throw new Error(`Unknown image ${String(unknown)}`)
    }
  }
}
