/** Generic helpers used across the pastel module. */

/** Clamp `n` to the inclusive `[min, max]` range. */
export function clamp(n: number, min: number, max: number): number {
  return n < min ? min : n > max ? max : n
}

/** Wrap a hue into `[0, 360)`. */
export function wrapHue(h: number): number {
  return ((h % 360) + 360) % 360
}

/** Convert HSL (h ∈ [0,360), s/l ∈ [0,100]) to 0-255 RGB. */
export function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const sNorm = s / 100
  const lNorm = l / 100
  if (sNorm === 0) {
    const v = Math.round(lNorm * 255)
    return [v, v, v]
  }
  const c = (1 - Math.abs(2 * lNorm - 1)) * sNorm
  const hPrime = ((h / 60) % 6 + 6) % 6
  const x = c * (1 - Math.abs((hPrime % 2) - 1))
  let r1 = 0
  let g1 = 0
  let b1 = 0
  if (hPrime < 1) {
    r1 = c
    g1 = x
    b1 = 0
  }
  else if (hPrime < 2) {
    r1 = x
    g1 = c
    b1 = 0
  }
  else if (hPrime < 3) {
    r1 = 0
    g1 = c
    b1 = x
  }
  else if (hPrime < 4) {
    r1 = 0
    g1 = x
    b1 = c
  }
  else if (hPrime < 5) {
    r1 = x
    g1 = 0
    b1 = c
  }
  else {
    r1 = c
    g1 = x
    b1 = 0
  }
  const m = lNorm - c / 2
  return [
    Math.round((r1 + m) * 255),
    Math.round((g1 + m) * 255),
    Math.round((b1 + m) * 255)
  ]
}

/** Format a 0-255 channel as a two-character lowercase hex byte. */
export function toHexByte(n: number): string {
  return n.toString(16).padStart(2, '0')
}

/** FNV-1a 32-bit hash. Stable across runs and platforms. */
export function fnv1a(str: string): number {
  let hash = 2166136261
  for (let i = 0; i < str.length; i += 1) {
    hash ^= str.charCodeAt(i)
    hash = Math.imul(hash, 16777619) >>> 0
  }
  return hash
}
