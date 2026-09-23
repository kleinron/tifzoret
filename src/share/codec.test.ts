import { describe, expect, it } from 'vitest'
import { DIRECTION_IDS, type DirectionId } from '../generator/directions.ts'
import { HEBREW_LETTERS, MAX_WORD_LENGTH } from '../generator/hebrew.ts'
import { MAX_BANK_WORDS } from '../generator/wordLimits.ts'
import {
  BASE62_ALPHABET,
  buildShareUrl,
  decodeSharePayload,
  encodeSharePayload,
  MAX_SHARE_IMAGE_COUNT,
  PACK_LETTERS,
  payloadFromSearch,
  SHARE_QUERY_PARAM,
  SHARE_VERSION,
  sanitizeShareWords,
  type SharePayload,
  type ShareSettings,
} from './codec.ts'

const WORDS = ['שמש', 'ירח', 'כוכב', 'שלום', 'כדור']

/** Rebuild a version-1 payload (1-bit settings pad, no image count). */
function legacyVersion1Bytes(options: {
  directionsMask: number
  gridOffset: number
  fontOffset: number
  words?: string[]
}): Uint8Array {
  const bits: number[] = []
  const write = (value: number, width: number) => {
    for (let i = width - 1; i >= 0; i--) bits.push((value >>> i) & 1)
  }
  write(1, 4)
  write(options.words ? 1 : 0, 1)
  write(1, 1)
  write(0, 2)
  write(options.directionsMask, 8)
  write(options.gridOffset, 4)
  write(options.fontOffset, 5)
  write(0, 1)
  write(0, 1)
  write(0, 1)
  if (options.words) {
    for (const word of options.words) {
      for (const ch of word) write(PACK_LETTERS.indexOf(ch as (typeof PACK_LETTERS)[number]), 5)
      write(27, 5)
    }
    write(28, 5)
  }
  const bytes = new Uint8Array(Math.ceil(bits.length / 8))
  for (let i = 0; i < bits.length; i++) {
    if (bits[i]) bytes[i >> 3]! |= 1 << (7 - (i & 7))
  }
  return bytes
}

function bytesToBase62(bytes: Uint8Array): string {
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

const SETTINGS: ShareSettings = {
  directions: ['ltr', 'btt', 'bltr'],
  gridSize: 16,
  fontSize: 22,
  randomAge10: true,
  noFinals: true,
  imageCount: 3,
}

function roundTrip(payload: SharePayload): SharePayload {
  const encoded = encodeSharePayload(payload)
  const decoded = decodeSharePayload(encoded)
  expect(decoded).not.toBeNull()
  return decoded!
}

describe('share alphabet', () => {
  it('packs 27 Hebrew letters (regular + sofit) into 5-bit indices', () => {
    expect(PACK_LETTERS).toHaveLength(27)
    expect(new Set(PACK_LETTERS).size).toBe(27)
    expect(PACK_LETTERS).toContain('א')
    expect(PACK_LETTERS).toContain('ת')
    expect(PACK_LETTERS).toContain('ם')
    expect(PACK_LETTERS).toContain('ץ')
  })

  it('uses alphanumeric base62 so ?p= never needs percent-encoding', () => {
    expect(BASE62_ALPHABET).toHaveLength(62)
    expect(SHARE_VERSION).toBe(2)
    const encoded = encodeSharePayload({ words: WORDS, settings: SETTINGS })
    expect(encoded).toMatch(/^[0-9A-Za-z]+$/)
    expect(encodeURIComponent(encoded)).toBe(encoded)
  })
})

describe('encode/decode round-trip', () => {
  it('restores words only (including sofit finals)', () => {
    const decoded = roundTrip({ words: WORDS })
    expect(decoded.words).toEqual(WORDS)
    expect(decoded.settings).toBeUndefined()
  })

  it('restores settings only (directions, board, font, flags)', () => {
    const decoded = roundTrip({ settings: SETTINGS })
    expect(decoded.words).toBeUndefined()
    expect(decoded.settings).toEqual({
      ...SETTINGS,
      directions: ['btt', 'ltr', 'bltr'] as DirectionId[],
    })
    expect(new Set(decoded.settings!.directions)).toEqual(new Set(SETTINGS.directions))
    expect(decoded.settings!.gridSize).toBe(16)
    expect(decoded.settings!.fontSize).toBe(22)
    expect(decoded.settings!.randomAge10).toBe(true)
    expect(decoded.settings!.noFinals).toBe(true)
    expect(decoded.settings!.imageCount).toBe(3)
  })

  it('restores both words and settings', () => {
    const decoded = roundTrip({ words: WORDS, settings: SETTINGS })
    expect(decoded.words).toEqual(WORDS)
    expect(new Set(decoded.settings!.directions)).toEqual(new Set(SETTINGS.directions))
    expect(decoded.settings!.gridSize).toBe(16)
    expect(decoded.settings!.fontSize).toBe(22)
    expect(decoded.settings!.randomAge10).toBe(true)
    expect(decoded.settings!.noFinals).toBe(true)
    expect(decoded.settings!.imageCount).toBe(3)
  })

  it('round-trips an empty word list when words are included', () => {
    const decoded = roundTrip({ words: [] })
    expect(decoded.words).toEqual([])
    expect(decoded.settings).toBeUndefined()
  })

  it('round-trips every direction id', () => {
    const decoded = roundTrip({
      settings: { ...SETTINGS, directions: DIRECTION_IDS },
    })
    expect(decoded.settings!.directions).toEqual([...DIRECTION_IDS])
  })

  it('clamps board, font, and image count into the packed ranges', () => {
    const decoded = roundTrip({
      settings: { ...SETTINGS, gridSize: 99, fontSize: 3, imageCount: 99 },
    })
    expect(decoded.settings!.gridSize).toBe(20)
    expect(decoded.settings!.fontSize).toBe(12)
    expect(decoded.settings!.imageCount).toBe(MAX_SHARE_IMAGE_COUNT)
  })

  it('round-trips an image count of zero separately from one', () => {
    const none = roundTrip({ settings: { ...SETTINGS, imageCount: 0 } })
    const one = roundTrip({ settings: { ...SETTINGS, imageCount: 1 } })
    expect(none.settings!.imageCount).toBe(0)
    expect(one.settings!.imageCount).toBe(1)
    expect(encodeSharePayload({ settings: { ...SETTINGS, imageCount: 0 } })).not.toBe(
      encodeSharePayload({ settings: { ...SETTINGS, imageCount: 1 } }),
    )
  })

  it('decodes version-1 links as imageCount 0 without shifting the word list', () => {
    const v1SettingsAndWord = bytesToBase62(
      legacyVersion1Bytes({
        directionsMask: 1,
        gridOffset: 4,
        fontOffset: 6,
        words: ['שמש'],
      }),
    )
    const decoded = decodeSharePayload(v1SettingsAndWord)
    expect(decoded?.settings?.imageCount).toBe(0)
    expect(decoded?.settings?.gridSize).toBe(12)
    expect(decoded?.settings?.fontSize).toBe(18)
    expect(decoded?.settings?.directions).toEqual(['rtl'])
    expect(decoded?.words).toEqual(['שמש'])
  })

  it('keeps sofit letters distinct from their regular forms', () => {
    const decoded = roundTrip({ words: ['שלום', 'שלמ'] })
    expect(decoded.words).toEqual(['שלום', 'שלמ'])
  })

  it('strips nikud on encode so the packed form stays Hebrew letters only', () => {
    const decoded = roundTrip({ words: ['שָׁלוֹם', 'כַּדּוּר'] })
    expect(decoded.words).toEqual(['שלום', 'כדור'])
  })
})

describe('query param ?p=', () => {
  it('treats a missing p as “use app defaults”', () => {
    expect(payloadFromSearch('')).toBeNull()
    expect(payloadFromSearch('?')).toBeNull()
    expect(payloadFromSearch('?foo=1')).toBeNull()
  })

  it('loads words and/or settings from ?p=', () => {
    const encoded = encodeSharePayload({ words: WORDS, settings: SETTINGS })
    const loaded = payloadFromSearch(`?${SHARE_QUERY_PARAM}=${encoded}`)
    expect(loaded?.words).toEqual(WORDS)
    expect(new Set(loaded?.settings?.directions)).toEqual(new Set(SETTINGS.directions))
  })

  it('returns null for a corrupt payload so the app can fall back to defaults', () => {
    expect(payloadFromSearch('?p=')).toBeNull()
    expect(payloadFromSearch('?p=!!!')).toBeNull()
    expect(decodeSharePayload('0')).toBeNull()
    expect(decodeSharePayload('not-valid')).toBeNull()
  })

  it('builds a compact self-contained share URL', () => {
    const url = buildShareUrl(
      { words: WORDS },
      'https://kleinron.github.io/tifzoret/#unused',
    )
    expect(url).toMatch(/^https:\/\/kleinron\.github\.io\/tifzoret\/\?p=[0-9A-Za-z]+$/)
    const parsed = new URL(url)
    expect(payloadFromSearch(parsed.search)?.words).toEqual(WORDS)
  })
})

function manyHebrewWords(count: number): string[] {
  const out: string[] = []
  let i = 0
  while (out.length < count) {
    let x = i++
    let word = ''
    for (let k = 0; k < 3; k++) {
      word += HEBREW_LETTERS[x % HEBREW_LETTERS.length]
      x = Math.floor(x / HEBREW_LETTERS.length)
    }
    out.push(word)
  }
  return out
}

describe('packing limits and compactness', () => {
  it('drops overlong words and caps the bank at 50', () => {
    const tooLong = 'א'.repeat(MAX_WORD_LENGTH + 1)
    const sanitized = sanitizeShareWords(['שמש', tooLong, ...manyHebrewWords(MAX_BANK_WORDS + 8)])
    expect(sanitized).not.toContain(tooLong)
    expect(sanitized[0]).toBe('שמש')
    expect(sanitized).toHaveLength(MAX_BANK_WORDS)
  })

  it('keeps a typical word list much shorter than JSON or percent-encoded Hebrew', () => {
    const bank = ['שמש', 'ירח', 'כוכב', 'פרח', 'ספר', 'כדור', 'חתול', 'מים', 'שלום', 'בית']
    const packed = encodeSharePayload({ words: bank })
    const json = JSON.stringify(bank)
    const query = encodeURIComponent(bank.join(','))
    expect(packed.length).toBeLessThan(json.length)
    expect(packed.length).toBeLessThan(query.length)
    expect(packed.length).toBeLessThan(90)
  })
})
