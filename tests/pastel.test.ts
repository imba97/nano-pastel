import { describe, expect, it } from 'vitest'
import {
  DEFAULT_PALETTE,
  HUE_SET_COOL,
  HUE_SET_WARM,
  hueDistance,
  PASTEL_GUARANTEED_WINDOW,
  PastelColor,
  pastelHuesForGroupOrder,
  pastelsFor,
  pastelStyle,
  pickPastelHue,
  pickPastelHueForKey,
  stylesForGroupOrder
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
  it('formats .value as hsla()', () => {
    const color = new PastelColor({ hue: 10, theme: 'light' })
    expect(color.value).toBe('hsla(10, 45%, 92%, 0.9)')
  })

  it('uses dark defaults when theme is dark', () => {
    const color = new PastelColor({ hue: 200, theme: 'dark' })
    expect(color.value).toBe('hsla(200, 35%, 32%, 0.55)')
  })

  it('lets saturation / lightness / alpha override the theme defaults', () => {
    const color = new PastelColor({
      hue: 100,
      theme: 'light',
      saturation: 60,
      lightness: 50,
      alpha: 0.5
    })
    expect(color.value).toBe('hsla(100, 60%, 50%, 0.5)')
  })

  it('wraps out-of-range hues into [0, 360)', () => {
    const color = new PastelColor({ hue: 370 })
    expect(color.hsl.h).toBe(10)
  })

  it('lighten() adds to L and clamps to 100', () => {
    const color = new PastelColor({ hue: 10, lightness: 95 })
    expect(color.lighten(10).hsl.l).toBe(100)
  })

  it('darken() subtracts from L and clamps to 0', () => {
    const color = new PastelColor({ hue: 10, lightness: 5 })
    expect(color.darken(10).hsl.l).toBe(0)
  })

  it('saturate() adds to S and clamps to 100', () => {
    const color = new PastelColor({ hue: 10, saturation: 95 })
    expect(color.saturate(10).hsl.s).toBe(100)
  })

  it('desaturate() subtracts from S and clamps to 0', () => {
    const color = new PastelColor({ hue: 10, saturation: 5 })
    expect(color.desaturate(10).hsl.s).toBe(0)
  })

  it('withAlpha() sets alpha within [0, 1]', () => {
    const color = new PastelColor({ hue: 10, alpha: 0.5 })
    expect(color.withAlpha(0.3).hsl.a).toBe(0.3)
    expect(color.withAlpha(2).hsl.a).toBe(1)
    expect(color.withAlpha(-1).hsl.a).toBe(0)
  })

  it('mutators return new instances and do not modify the original', () => {
    const color = new PastelColor({ hue: 10, theme: 'light' })
    const lighter = color.lighten(5)
    expect(lighter).not.toBe(color)
    expect(lighter.hsl.l).toBe(97)
    expect(color.hsl.l).toBe(92)
  })
})

describe('pastelStyle', () => {
  it('returns PastelColor instances for backgroundColor and color', () => {
    const style = pastelStyle({ index: 0, theme: 'light' })
    expect(style.backgroundColor).toBeInstanceOf(PastelColor)
    expect(style.color).toBeInstanceOf(PastelColor)
  })

  it('emits hsla background and hsl-shaped text', () => {
    const style = pastelStyle({ index: 0, theme: 'light' })
    expect(style.backgroundColor.value).toMatch(/^hsla\(/)
    expect(style.color.value).toMatch(/^hsla\(/)
  })

  it('defaults to borderless style', () => {
    const style = pastelStyle({ index: 2 })
    expect(style.border).toBe('0')
  })

  it('omits border when borderless is false', () => {
    const style = pastelStyle({ index: 2, borderless: false })
    expect(style.border).toBeUndefined()
  })

  it('switches theme defaults between light and dark', () => {
    const light = pastelStyle({ index: 3, theme: 'light' })
    const dark = pastelStyle({ index: 3, theme: 'dark' })
    expect(light.backgroundColor.value).not.toBe(dark.backgroundColor.value)
    expect(light.color.value).not.toBe(dark.color.value)
  })

  it('honors a custom palette', () => {
    const style = pastelStyle({ index: 0, palette: customPalette })
    expect(style.backgroundColor.hsl.h).toBe(customPalette.warm[0])
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

  it('uses theme defaults on the returned color', () => {
    const map = pastelsFor(['group1'], { theme: 'dark' })
    expect(map.group1.hsl.l).toBe(32)
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
})

describe('stylesForGroupOrder', () => {
  it('produces a complete style object per group', () => {
    const order = ['a', 'b', 'c']
    const map = stylesForGroupOrder(order)
    for (const key of order) {
      expect(map[key]).toBeDefined()
      expect(map[key].backgroundColor).toBeInstanceOf(PastelColor)
      expect(map[key].color).toBeInstanceOf(PastelColor)
    }
  })

  it('reuses pickPastelHue indices under the default order strategy', () => {
    const order = ['x', 'y', 'z']
    const map = stylesForGroupOrder(order, 'dark')
    const flat = Object.values(map)
    expect(flat[0].backgroundColor.value).toMatch(/^hsla\(/)
    expect(flat[1].backgroundColor.value).toMatch(/^hsla\(/)
  })

  it('hash strategy keeps colors stable across reorderings', () => {
    const a = stylesForGroupOrder(['group1', 'group2'], 'light', { strategy: 'hash' })
    const b = stylesForGroupOrder(['group2', 'other', 'group1'], 'light', { strategy: 'hash' })
    expect(a.group1.backgroundColor.value).toBe(b.group1.backgroundColor.value)
    expect(a.group2.backgroundColor.value).toBe(b.group2.backgroundColor.value)
  })
})

describe('defaultPalette', () => {
  it('uses the built-in warm/cool hue sets', () => {
    expect(DEFAULT_PALETTE.warm).toEqual(HUE_SET_WARM)
    expect(DEFAULT_PALETTE.cool).toEqual(HUE_SET_COOL)
  })
})
