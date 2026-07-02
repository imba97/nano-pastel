import { describe, expect, it } from 'vitest'
import {
  DEFAULT_HSL,
  DEFAULT_PALETTE,
  HUE_SET_COOL,
  HUE_SET_WARM,
  hueDistance,
  PASTEL_GUARANTEED_WINDOW,
  PastelColor,
  pastelHuesForGroupOrder,
  pastelsFor,
  pickPastelHue,
  pickPastelHueForKey
} from '../src/pastel'

const customPalette = {
  warm: [20, 70, 120, 170] as const,
  cool: [210, 260, 310, 350] as const
}

describe('pickPastelHue', () => {
  it('alternates between warm (even) and cool (odd) sets', () => {
    expect(pickPastelHue(0)).toBe(HUE_SET_WARM[0])
    expect(pickPastelHue(1)).toBe(HUE_SET_COOL[0])
    expect(pickPastelHue(2)).toBe(HUE_SET_WARM[1])
    expect(pickPastelHue(3)).toBe(HUE_SET_COOL[1])
  })

  it('wraps within each palette when index exceeds palette length', () => {
    expect(pickPastelHue(8)).toBe(pickPastelHue(0))
    expect(pickPastelHue(9)).toBe(pickPastelHue(1))
  })

  it('coerces negative / non-finite inputs to 0', () => {
    expect(pickPastelHue(-3)).toBe(pickPastelHue(0))
    expect(pickPastelHue(Number.NaN)).toBe(pickPastelHue(0))
  })

  it('keeps adjacent hues at least 100 degrees apart inside the guaranteed window', () => {
    for (let i = 0; i < PASTEL_GUARANTEED_WINDOW - 1; i += 1) {
      const a = pickPastelHue(i)
      const b = pickPastelHue(i + 1)
      expect(hueDistance(a, b)).toBeGreaterThanOrEqual(100)
    }
  })

  it('honors a custom palette', () => {
    expect(pickPastelHue(0, customPalette)).toBe(customPalette.warm[0])
    expect(pickPastelHue(1, customPalette)).toBe(customPalette.cool[0])
    expect(pickPastelHue(2, customPalette)).toBe(customPalette.warm[1])
  })
})

describe('pickPastelHueForKey', () => {
  it('is deterministic across calls', () => {
    expect(pickPastelHueForKey('group1')).toBe(pickPastelHueForKey('group1'))
  })

  it('produces different hues for different keys (in general)', () => {
    const a = pickPastelHueForKey('alpha')
    const b = pickPastelHueForKey('bravo')
    const c = pickPastelHueForKey('charlie')
    expect(new Set([a, b, c]).size).toBeGreaterThan(1)
  })

  it('uses the custom palette when provided', () => {
    const hue = pickPastelHueForKey('any-key', customPalette)
    expect([...customPalette.warm, ...customPalette.cool]).toContain(hue)
  })
})

describe('pastelHuesForGroupOrder', () => {
  it('returns one hue per element', () => {
    expect(pastelHuesForGroupOrder(5)).toHaveLength(5)
  })

  it('produces stable hues matching pickPastelHue', () => {
    const n = 6
    for (let i = 0; i < n; i += 1) {
      expect(pastelHuesForGroupOrder(n)[i]).toBe(pickPastelHue(i))
    }
  })

  it('honors a custom palette', () => {
    expect(pastelHuesForGroupOrder(2, customPalette)).toEqual([
      customPalette.warm[0],
      customPalette.cool[0]
    ])
  })
})

describe('pastelColor', () => {
  it('formats .value as rgba by default', () => {
    const color = new PastelColor({ hue: 10, saturation: 45, lightness: 92, alpha: 0.9 })
    expect(color.value).toBe('rgba(244, 228, 225, 0.9)')
  })

  it('formats .value as hex when format is "hex"', () => {
    const color = new PastelColor({ hue: 10, saturation: 45, lightness: 92, alpha: 0.9, format: 'hex' })
    expect(color.value).toBe('#f4e4e1')
  })

  it('formats .value as hsla when format is "hsla"', () => {
    const color = new PastelColor({ hue: 10, saturation: 45, lightness: 92, alpha: 0.9, format: 'hsla' })
    expect(color.value).toBe('hsla(10, 45%, 92%, 0.9)')
  })

  it('exposes rgba and hex getters regardless of format', () => {
    const color = new PastelColor({ hue: 10, saturation: 45, lightness: 92, alpha: 0.9, format: 'hsla' })
    expect(color.rgba).toBe('rgba(244, 228, 225, 0.9)')
    expect(color.hex).toBe('#f4e4e1')
  })

  it('exposes the chosen format on .format', () => {
    expect(new PastelColor({ hue: 10, saturation: 45, lightness: 92, alpha: 0.9 }).format).toBe('rgba')
    expect(new PastelColor({ hue: 10, saturation: 45, lightness: 92, alpha: 0.9, format: 'hex' }).format).toBe('hex')
    expect(new PastelColor({ hue: 10, saturation: 45, lightness: 92, alpha: 0.9, format: 'hsla' }).format).toBe('hsla')
  })

  it('preserves format across mutators', () => {
    const color = new PastelColor({ hue: 10, saturation: 45, lightness: 92, alpha: 0.9, format: 'hex' })
    expect(color.lighten(2).format).toBe('hex')
    expect(color.darken(2).format).toBe('hex')
    expect(color.saturate(2).format).toBe('hex')
    expect(color.desaturate(2).format).toBe('hex')
    expect(color.withAlpha(0.5).format).toBe('hex')
  })

  it('wraps out-of-range hues into [0, 360)', () => {
    const color = new PastelColor({ hue: 370, saturation: 45, lightness: 92, alpha: 0.9 })
    expect(color.hsl.h).toBe(10)
  })

  it('clamps saturation to [0, 100]', () => {
    expect(new PastelColor({ hue: 10, saturation: 150, lightness: 50, alpha: 0.5 }).hsl.s).toBe(100)
    expect(new PastelColor({ hue: 10, saturation: -10, lightness: 50, alpha: 0.5 }).hsl.s).toBe(0)
  })

  it('clamps lightness to [0, 100]', () => {
    expect(new PastelColor({ hue: 10, saturation: 50, lightness: 150, alpha: 0.5 }).hsl.l).toBe(100)
    expect(new PastelColor({ hue: 10, saturation: 50, lightness: -10, alpha: 0.5 }).hsl.l).toBe(0)
  })

  it('clamps alpha to [0, 1]', () => {
    expect(new PastelColor({ hue: 10, saturation: 50, lightness: 50, alpha: 2 }).hsl.a).toBe(1)
    expect(new PastelColor({ hue: 10, saturation: 50, lightness: 50, alpha: -1 }).hsl.a).toBe(0)
  })

  it('lighten() adds to L and clamps to 100', () => {
    const color = new PastelColor({ hue: 10, saturation: 50, lightness: 95, alpha: 0.5 })
    expect(color.lighten(10).hsl.l).toBe(100)
  })

  it('darken() subtracts from L and clamps to 0', () => {
    const color = new PastelColor({ hue: 10, saturation: 50, lightness: 5, alpha: 0.5 })
    expect(color.darken(10).hsl.l).toBe(0)
  })

  it('saturate() adds to S and clamps to 100', () => {
    const color = new PastelColor({ hue: 10, saturation: 95, lightness: 50, alpha: 0.5 })
    expect(color.saturate(10).hsl.s).toBe(100)
  })

  it('desaturate() subtracts from S and clamps to 0', () => {
    const color = new PastelColor({ hue: 10, saturation: 5, lightness: 50, alpha: 0.5 })
    expect(color.desaturate(10).hsl.s).toBe(0)
  })

  it('withAlpha() sets alpha within [0, 1]', () => {
    const color = new PastelColor({ hue: 10, saturation: 50, lightness: 50, alpha: 0.5 })
    expect(color.withAlpha(0.3).hsl.a).toBe(0.3)
    expect(color.withAlpha(2).hsl.a).toBe(1)
    expect(color.withAlpha(-1).hsl.a).toBe(0)
  })

  it('mutators return new instances and do not modify the original', () => {
    const color = new PastelColor({ hue: 10, saturation: 50, lightness: 92, alpha: 0.5 })
    const lighter = color.lighten(5)
    expect(lighter).not.toBe(color)
    expect(lighter.hsl.l).toBe(97)
    expect(color.hsl.l).toBe(92)
  })

  it('supports the base-color + tweak pattern', () => {
    const base = new PastelColor({ hue: 10, saturation: 45, lightness: 92, alpha: 0.9 })
    const tint = base.lighten(5)
    const text = base.darken(40).saturate(20)
    expect(tint.hsl.h).toBe(10)
    expect(tint.hsl.l).toBe(97)
    expect(text.hsl.h).toBe(10)
    expect(text.hsl.l).toBe(52)
  })
})

describe('pastelsFor', () => {
  it('maps each group to a PastelColor with the right hue', () => {
    const order = ['group1', 'group2', 'group3', 'group4']
    const map = pastelsFor(order)
    expect(map.group1).toBeInstanceOf(PastelColor)
    expect(map.group1.hsl.h).toBe(pickPastelHue(0))
    expect(map.group2.hsl.h).toBe(pickPastelHue(1))
    expect(map.group3.hsl.h).toBe(pickPastelHue(2))
    expect(map.group4.hsl.h).toBe(pickPastelHue(3))
  })

  it('applies the default HSL values', () => {
    const map = pastelsFor(['group1'])
    expect(map.group1.hsl.s).toBe(DEFAULT_HSL.saturation)
    expect(map.group1.hsl.l).toBe(DEFAULT_HSL.lightness)
    expect(map.group1.hsl.a).toBe(DEFAULT_HSL.alpha)
  })

  it('lets callers override saturation / lightness / alpha', () => {
    const map = pastelsFor(['group1'], { saturation: 60, lightness: 50, alpha: 0.5 })
    expect(map.group1.hsl.s).toBe(60)
    expect(map.group1.hsl.l).toBe(50)
    expect(map.group1.hsl.a).toBe(0.5)
  })

  it('hash strategy gives the same color for the same key across calls', () => {
    const order = ['group1', 'group2', 'group3']
    const a = pastelsFor(order, { strategy: 'hash' })
    const b = pastelsFor(order, { strategy: 'hash' })
    expect(a.group1.value).toBe(b.group1.value)
    expect(a.group2.value).toBe(b.group2.value)
  })

  it('hash strategy is order-independent', () => {
    const key = 'group1'
    const a = pastelsFor([key, 'other'], { strategy: 'hash' })
    const b = pastelsFor(['other', 'other2', key], { strategy: 'hash' })
    expect(a[key].value).toBe(b[key].value)
  })

  it('honors a custom palette', () => {
    const map = pastelsFor(['group1', 'group2'], { palette: customPalette })
    expect(map.group1.hsl.h).toBe(customPalette.warm[0])
    expect(map.group2.hsl.h).toBe(customPalette.cool[0])
  })

  it('applies the format option to each color', () => {
    const hexMap = pastelsFor(['group1'], { format: 'hex' })
    expect(hexMap.group1.format).toBe('hex')
    expect(hexMap.group1.value).toBe(hexMap.group1.hex)
    const hslaMap = pastelsFor(['group1'], { format: 'hsla' })
    expect(hslaMap.group1.value).toBe('hsla(10, 45%, 92%, 0.9)')
  })
})

describe('defaultPalette', () => {
  it('uses the built-in warm/cool hue sets', () => {
    expect(DEFAULT_PALETTE.warm).toEqual(HUE_SET_WARM)
    expect(DEFAULT_PALETTE.cool).toEqual(HUE_SET_COOL)
  })
})
