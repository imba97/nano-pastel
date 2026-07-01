/**
 * Pastel palette generator.
 *
 * Adjacent groups land on opposite sides of the color wheel: even indices
 * pull from the warm set, odd indices from the cool set, guaranteeing a
 * hue gap of ~100° between any two neighbors.
 */

/** Warm-side hues (0° - 180°). */
export const HUE_SET_WARM = [10, 50, 100, 150] as const

/** Cool-side hues (180° - 360°), opposite the warm set. */
export const HUE_SET_COOL = [200, 250, 290, 340] as const

export interface PastelPalette {
  warm: readonly number[]
  cool: readonly number[]
}

export const DEFAULT_PALETTE: PastelPalette = {
  warm: HUE_SET_WARM,
  cool: HUE_SET_COOL
}

export type PastelStrategy = 'order' | 'hash'

export interface PastelHsl {
  h: number
  s: number
  l: number
  a: number
}

/** Default HSL values for the pastel look. Override via `pastelsFor` options. */
export const DEFAULT_HSL = {
  saturation: 45,
  lightness: 92,
  alpha: 0.9
} as const

function clamp(n: number, min: number, max: number): number {
  return n < min ? min : n > max ? max : n
}

function wrapHue(h: number): number {
  return ((h % 360) + 360) % 360
}

/**
 * Pick a hue by index. Even → warm, odd → cool.
 *
 * Adjacent hues stay ≥ 100° apart within the guaranteed window
 * (positions 0..PASTEL_GUARANTEED_WINDOW-1). Beyond that, the palette
 * wraps and the wrap-around gap may shrink.
 */
export function pickPastelHue(index: number, palette: PastelPalette = DEFAULT_PALETTE): number {
  const safeIndex = Number.isFinite(index) ? Math.max(0, Math.floor(index)) : 0
  const set = safeIndex % 2 === 0 ? palette.warm : palette.cool
  const setIndex = Math.floor(safeIndex / 2) % set.length
  return set[setIndex]
}

/** Number of positions guaranteed to keep adjacent hues ≥ 100° apart. */
export const PASTEL_GUARANTEED_WINDOW = HUE_SET_WARM.length + HUE_SET_COOL.length

/** Wrapped hue distance in degrees (0-180). */
export function hueDistance(a: number, b: number): number {
  const diff = Math.abs(a - b) % 360
  return diff > 180 ? 360 - diff : diff
}

/** FNV-1a 32-bit hash. Stable across runs and platforms. */
function fnv1a(str: string): number {
  let hash = 2166136261
  for (let i = 0; i < str.length; i += 1) {
    hash ^= str.charCodeAt(i)
    hash = Math.imul(hash, 16777619) >>> 0
  }
  return hash
}

/** Hash-based stable hue. Same key always maps to the same color. */
export function pickPastelHueForKey(key: string, palette: PastelPalette = DEFAULT_PALETTE): number {
  return pickPastelHue(fnv1a(key), palette)
}

/** Return one hue per element, with adjacent items ≥ 100° apart. */
export function pastelHuesForGroupOrder(count: number, palette: PastelPalette = DEFAULT_PALETTE): number[] {
  const hues: number[] = []
  for (let i = 0; i < count; i += 1) {
    hues.push(pickPastelHue(i, palette))
  }
  return hues
}

export class PastelColor {
  readonly hue: number
  readonly saturation: number
  readonly lightness: number
  readonly alpha: number

  constructor(options: {
    hue: number
    saturation: number
    lightness: number
    alpha: number
  }) {
    this.hue = wrapHue(options.hue)
    this.saturation = clamp(options.saturation, 0, 100)
    this.lightness = clamp(options.lightness, 0, 100)
    this.alpha = clamp(options.alpha, 0, 1)
  }

  get hsl(): PastelHsl {
    return { h: this.hue, s: this.saturation, l: this.lightness, a: this.alpha }
  }

  get value(): string {
    return `hsla(${this.hue}, ${this.saturation}%, ${this.lightness}%, ${this.alpha})`
  }

  lighten(amount: number): PastelColor {
    return new PastelColor({
      hue: this.hue,
      saturation: this.saturation,
      lightness: clamp(this.lightness + amount, 0, 100),
      alpha: this.alpha
    })
  }

  darken(amount: number): PastelColor {
    return this.lighten(-amount)
  }

  saturate(amount: number): PastelColor {
    return new PastelColor({
      hue: this.hue,
      saturation: clamp(this.saturation + amount, 0, 100),
      lightness: this.lightness,
      alpha: this.alpha
    })
  }

  desaturate(amount: number): PastelColor {
    return this.saturate(-amount)
  }

  withAlpha(alpha: number): PastelColor {
    return new PastelColor({
      hue: this.hue,
      saturation: this.saturation,
      lightness: this.lightness,
      alpha: clamp(alpha, 0, 1)
    })
  }
}

export interface PastelsForOptions {
  /** 'order' (default) uses group position, 'hash' uses a stable key hash. */
  strategy?: PastelStrategy
  /** Override the default warm/cool palette. */
  palette?: PastelPalette
  /** Override the default pastel HSL values. */
  saturation?: number
  lightness?: number
  alpha?: number
}

/** Map each ordered group name to a `PastelColor`. */
export function pastelsFor(
  groupOrder: readonly string[],
  options: PastelsForOptions = {}
): Record<string, PastelColor> {
  const {
    strategy = 'order',
    palette = DEFAULT_PALETTE,
    saturation = DEFAULT_HSL.saturation,
    lightness = DEFAULT_HSL.lightness,
    alpha = DEFAULT_HSL.alpha
  } = options
  const map: Record<string, PastelColor> = {}
  groupOrder.forEach((group, idx) => {
    const hue = strategy === 'hash' ? pickPastelHueForKey(group, palette) : pickPastelHue(idx, palette)
    map[group] = new PastelColor({ hue, saturation, lightness, alpha })
  })
  return map
}
