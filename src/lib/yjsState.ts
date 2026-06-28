const CHUNK_SIZE = 0x8000

/** Yjs fragment name shared between seeding (`yjsSeed.ts`) and the Collaboration extension's `field` option. */
export const YJS_FIELD = 'default'

/**
 * Sentinel `origin` tag for Yjs updates applied from a remote peer, so local
 * doc/awareness listeners can tell them apart from the user's own edits and
 * avoid re-broadcasting an update that just arrived.
 */
export const REMOTE_ORIGIN = Symbol('remote-yjs-update')

export function bytesToBase64(bytes: Uint8Array): string {
  let binary = ''
  for (let i = 0; i < bytes.length; i += CHUNK_SIZE) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK_SIZE))
  }
  return btoa(binary)
}

export function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

// y-prosemirror's cursor decorations only accept 6-digit hex colors and
// warn on every render otherwise, so hue is converted to hex rather than
// returned as an hsl() string.
function hslToHex(hue: number, saturation: number, lightness: number): string {
  const s = saturation / 100
  const l = lightness / 100
  const k = (n: number) => (n + hue / 30) % 12
  const a = s * Math.min(l, 1 - l)
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))
  const toHex = (x: number) => Math.round(255 * x).toString(16).padStart(2, '0')
  return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`
}

/**
 * Deterministic per-user cursor color for collaboration awareness, so the
 * same user always gets the same color across sessions.
 */
export function awarenessColor(userId: string): string {
  let hash = 0
  for (let i = 0; i < userId.length; i++) {
    hash = (hash << 5) - hash + userId.charCodeAt(i)
    hash |= 0
  }
  return hslToHex(Math.abs(hash) % 360, 70, 45)
}
