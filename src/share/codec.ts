/**
 * Share-link codec for תפזורת.
 *
 * URL shape: `?p=<base62>`
 * Missing `p` (empty search) means app defaults — do not encode the solved grid.
 *
 * Why base62 (`0-9A-Za-z`) instead of base64url:
 * - The payload never needs percent-encoding (`-`, `_`, `=` stay out of the URL).
 * - Chat apps and copy-paste are less likely to wrap or strip punctuation.
 * - Density is ~1% worse than base64url, which is dwarfed by 5-bit Hebrew packing
 *   (UTF-8 Hebrew is 16 bits/letter in the URL after percent-encoding).
 *
 * Image positions are not stored. The count is a setting; the recipient
 * re-rolls origins on generate, the same way word placement is re-rolled.
 *
 * Binary layout (MSB-first bitstream):
 *   4 bits  version (=2; version 1 still decodes)
 *   1 bit   hasWords
 *   1 bit   hasSettings
 *   2 bits  reserved (0)
 *   if hasSettings:
 *     8 bits direction mask (bit i = DIRECTION_IDS[i])
 *     4 bits gridSize - 8          (8–20)
 *     5 bits fontSize - 12         (12–28)
 *     1 bit  randomAge10
 *     1 bit  noFinals
 *     5 bits imageCount (0–31)     version 2
 *     1 bit  reserved (0)          version 1 only — imageCount decodes as 0
 *   if hasWords:
 *     for each word: 5-bit indices into PACK_LETTERS, then WORD_END (27)
 *     then LIST_END (28)
 *
 * Hebrew packing: 27-letter alphabet (22 regular + 5 sofit) in 5 bits.
 * Finals stay distinct so «שלום» round-trips after nikud/space normalization.
 */

import { DIRECTION_IDS, type DirectionId } from '../generator/directions.ts'
import { MAX_WORD_LENGTH, normalizeHebrew } from '../generator/hebrew.ts'
import { MAX_BANK_WORDS, MAX_GRID_SIZE, MIN_GRID_SIZE } from '../generator/wordLimits.ts'

export const SHARE_VERSION = 2

/** Version 1 links predate image blocks and decode with imageCount 0. */
const SHARE_VERSION_V1 = 1

/** 5-bit field. The board clamps further to how many picture blocks fit. */
export const MAX_SHARE_IMAGE_COUNT = 31
export const SHARE_QUERY_PARAM = 'p'

export const MIN_FONT_SIZE = 12
export const MAX_FONT_SIZE = 28

/** 27 Hebrew letters: 22 + sofit. Fits in 5 bits with room for sentinels. */
export const PACK_LETTERS = [
  'א',
  'ב',
  'ג',
  'ד',
  'ה',
  'ו',
  'ז',
  'ח',
  'ט',
  'י',
  'כ',
  'ל',
  'מ',
  'נ',
  'ס',
  'ע',
  'פ',
  'צ',
  'ק',
  'ר',
  'ש',
  'ת',
  'ך',
  'ם',
  'ן',
  'ף',
  'ץ',
] as const

const WORD_END = 27
const LIST_END = 28
const MAX_LETTERS_PER_WORD = 32

/** URL-safe compact alphabet: digits, then A–Z, then a–z. */
export const BASE62_ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'

const LETTER_INDEX = new Map<string, number>(PACK_LETTERS.map((ch, i) => [ch, i]))

export type ShareSettings = {
  directions: readonly DirectionId[]
  gridSize: number
  fontSize: number
  randomAge10: boolean
  noFinals: boolean
  /** Pictures to place. Origins are not shared; they re-roll on generate. */
  imageCount: number
}

export type SharePayload = {
  words?: string[]
  settings?: ShareSettings
}

class BitWriter {
  private readonly bits: number[] = []

  write(value: number, width: number): void {
    for (let i = width - 1; i >= 0; i--) {
      this.bits.push((value >>> i) & 1)
    }
  }

  toBytes(): Uint8Array {
    const bytes = new Uint8Array(Math.ceil(this.bits.length / 8))
    for (let i = 0; i < this.bits.length; i++) {
      if (this.bits[i]) bytes[i >> 3]! |= 1 << (7 - (i & 7))
    }
    return bytes
  }
}

class BitReader {
  private i = 0
  private readonly bytes: Uint8Array

  constructor(bytes: Uint8Array) {
    this.bytes = bytes
  }

  remaining(): number {
    return this.bytes.length * 8 - this.i
  }

  read(width: number): number | null {
    if (this.remaining() < width) return null
    let value = 0
    for (let n = 0; n < width; n++) {
      const bit = (this.bytes[this.i >> 3]! >>> (7 - (this.i & 7))) & 1
      value = (value << 1) | bit
      this.i += 1
    }
    return value
  }
}

function clampInt(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min
  return Math.min(max, Math.max(min, Math.round(value)))
}

export function sanitizeShareWords(words: readonly string[]): string[] {
  const out: string[] = []
  const seen = new Set<string>()
  for (const raw of words) {
    const word = normalizeHebrew(raw)
    if (!word || word.length > MAX_WORD_LENGTH) continue
    let packable = true
    for (const ch of word) {
      if (!LETTER_INDEX.has(ch)) {
        packable = false
        break
      }
    }
    if (!packable || seen.has(word)) continue
    seen.add(word)
    out.push(word)
    if (out.length >= MAX_BANK_WORDS) break
  }
  return out
}

function maskFromDirections(ids: readonly DirectionId[]): number {
  const set = new Set(ids)
  let mask = 0
  DIRECTION_IDS.forEach((id, i) => {
    if (set.has(id)) mask |= 1 << i
  })
  return mask
}

function directionsFromMask(mask: number): DirectionId[] {
  return DIRECTION_IDS.filter((_, i) => (mask & (1 << i)) !== 0)
}

function bytesToBase62(bytes: Uint8Array): string {
  if (bytes.length === 0) return '0'
  let n = 0n
  for (const byte of bytes) n = (n << 8n) + BigInt(byte)
  if (n === 0n) return '0'
  const chars: string[] = []
  while (n > 0n) {
    chars.push(BASE62_ALPHABET[Number(n % 62n)]!)
    n /= 62n
  }
  return chars.reverse().join('')
}

function base62ToBytes(text: string): Uint8Array | null {
  if (!text || !/^[0-9A-Za-z]+$/.test(text)) return null
  let n = 0n
  for (const ch of text) {
    const idx = BASE62_ALPHABET.indexOf(ch)
    if (idx < 0) return null
    n = n * 62n + BigInt(idx)
  }
  if (n === 0n) return new Uint8Array([0])
  const bytes: number[] = []
  while (n > 0n) {
    bytes.push(Number(n % 256n))
    n /= 256n
  }
  bytes.reverse()
  return Uint8Array.from(bytes)
}

export function encodeSharePayload(payload: SharePayload): string {
  const words = payload.words !== undefined ? sanitizeShareWords(payload.words) : undefined
  const settings = payload.settings
  const hasWords = words !== undefined
  const hasSettings = settings !== undefined

  const w = new BitWriter()
  w.write(SHARE_VERSION, 4)
  w.write(hasWords ? 1 : 0, 1)
  w.write(hasSettings ? 1 : 0, 1)
  w.write(0, 2)

  if (hasSettings && settings) {
    w.write(maskFromDirections(settings.directions), 8)
    w.write(clampInt(settings.gridSize, MIN_GRID_SIZE, MAX_GRID_SIZE) - MIN_GRID_SIZE, 4)
    w.write(clampInt(settings.fontSize, MIN_FONT_SIZE, MAX_FONT_SIZE) - MIN_FONT_SIZE, 5)
    w.write(settings.randomAge10 ? 1 : 0, 1)
    w.write(settings.noFinals ? 1 : 0, 1)
    w.write(clampInt(settings.imageCount, 0, MAX_SHARE_IMAGE_COUNT), 5)
  }

  if (hasWords && words) {
    for (const word of words) {
      for (const ch of word) {
        w.write(LETTER_INDEX.get(ch)!, 5)
      }
      w.write(WORD_END, 5)
    }
    w.write(LIST_END, 5)
  }

  return bytesToBase62(w.toBytes())
}

export function decodeSharePayload(text: string): SharePayload | null {
  const bytes = base62ToBytes(text)
  if (!bytes || bytes.length === 0) return null
  const r = new BitReader(bytes)
  const version = r.read(4)
  const hasWordsBit = r.read(1)
  const hasSettingsBit = r.read(1)
  const reserved = r.read(2)
  if (
    (version !== SHARE_VERSION && version !== SHARE_VERSION_V1) ||
    hasWordsBit === null ||
    hasSettingsBit === null
  ) {
    return null
  }
  if (reserved !== 0) return null

  const payload: SharePayload = {}

  if (hasSettingsBit) {
    const mask = r.read(8)
    const gridOff = r.read(4)
    const fontOff = r.read(5)
    const randomAge10 = r.read(1)
    const noFinals = r.read(1)
    if (
      mask === null ||
      gridOff === null ||
      fontOff === null ||
      randomAge10 === null ||
      noFinals === null
    ) {
      return null
    }
    let imageCount = 0
    if (version === SHARE_VERSION_V1) {
      const pad = r.read(1)
      if (pad === null) return null
    } else {
      const rawCount = r.read(5)
      if (rawCount === null) return null
      imageCount = clampInt(rawCount, 0, MAX_SHARE_IMAGE_COUNT)
    }
    payload.settings = {
      directions: directionsFromMask(mask),
      gridSize: clampInt(gridOff + MIN_GRID_SIZE, MIN_GRID_SIZE, MAX_GRID_SIZE),
      fontSize: clampInt(fontOff + MIN_FONT_SIZE, MIN_FONT_SIZE, MAX_FONT_SIZE),
      randomAge10: randomAge10 === 1,
      noFinals: noFinals === 1,
      imageCount,
    }
  }

  if (hasWordsBit) {
    const words: string[] = []
    let current = ''
    for (;;) {
      const idx = r.read(5)
      if (idx === null) return null
      if (idx === LIST_END) {
        if (current.length > 0) return null
        break
      }
      if (idx === WORD_END) {
        if (current.length > 0 && current.length <= MAX_WORD_LENGTH && words.length < MAX_BANK_WORDS) {
          words.push(current)
        }
        current = ''
        continue
      }
      const ch = PACK_LETTERS[idx]
      if (!ch) return null
      if (current.length >= MAX_LETTERS_PER_WORD) return null
      current += ch
    }
    payload.words = sanitizeShareWords(words)
  }

  return payload
}

/** `null` when `p` is absent or the payload is invalid — caller uses app defaults. */
export function payloadFromSearch(search: string): SharePayload | null {
  const trimmed = search.startsWith('?') ? search.slice(1) : search
  if (!trimmed) return null
  const params = new URLSearchParams(trimmed)
  const raw = params.get(SHARE_QUERY_PARAM)
  if (!raw) return null
  return decodeSharePayload(raw)
}

export function buildShareUrl(payload: SharePayload, href: string): string {
  const url = new URL(href)
  url.hash = ''
  url.search = ''
  url.searchParams.set(SHARE_QUERY_PARAM, encodeSharePayload(payload))
  return url.toString()
}
