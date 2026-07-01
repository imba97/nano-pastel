![nano-pastel](https://github.com/imba97/nano-pastel/raw/main/.github/images/nano-pastel.png)

# nano-pastel

> Parity-alternating pastel palette generator — adjacent groups stay ≥100° apart, with custom palettes and hash-stable colors.

## Why

When you have an ordered list of groups (e.g. sections of a debug table) and want each one to have its own pastel background, naive hashing produces lots of collisions — two adjacent groups often land on the same hue.

This library solves it with two complementary palettes:

- even indices → warm-side hues (0°-180°)
- odd indices → cool-side hues (180°-360°)

That guarantees a hue gap of ≥ 100° between any two neighbors. The library returns `PastelColor` instances — pick a base, then `.lighten()` / `.darken()` / `.saturate()` for variants.

## Install

```bash
pnpm add nano-pastel
```

## Usage

```ts
import { pastelsFor } from 'nano-pastel'

// One PastelColor per group, with adjacent-safe hues
const groupOrder = ['group1', 'group2', 'group3', 'group4', 'group5', 'group6', 'group7', 'group8']
const colors = pastelsFor(groupOrder)
// colors.group1.value → 'hsla(10, 45%, 92%, 0.9)'
// colors.group2.value → 'hsla(200, 45%, 92%, 0.9)'
```

Combine a base color with `.lighten()` / `.darken()` to get a `background + text` pair yourself:

```ts
const bg = colors.group1
const text = colors.group1.darken(50)
```

### Hash strategy

The default strategy is `'order'`: group color depends on its position in the input array. Switch to `'hash'` when you want the same key to always resolve to the same color, regardless of where it appears:

```ts
const order = ['group1', 'group2', 'group3']
const colors = pastelsFor(order, { strategy: 'hash' })
colors.group1.value // always the same, even if you reorder or insert other groups
```

### Custom palette

Plug in your own warm/cool hue sets (brand colors, accessibility-tuned sets, etc.):

```ts
import { pastelsFor } from 'nano-pastel'

const brandPalette = {
  warm: [15, 60, 110, 160],
  cool: [210, 260, 310, 350]
}

pastelsFor(['group1', 'group2'], { palette: brandPalette })
```

### `PastelColor`

Each `pastelsFor` entry is a `PastelColor` carrying an HSL tuple. All mutators are immutable — they return a new instance:

```ts
import { PastelColor } from 'nano-pastel'

const color = new PastelColor({ hue: 10, saturation: 45, lightness: 92, alpha: 0.9 })
color.value // 'hsla(10, 45%, 92%, 0.9)'
color.hsl // { h: 10, s: 45, l: 92, a: 0.9 }
color.lighten(10) // L → 100, returns a new PastelColor
color.darken(20) // L → 72, returns a new PastelColor
color.saturate(15) // S → 60, returns a new PastelColor
color.desaturate(50) // S → 0, returns a new PastelColor
color.withAlpha(0.5) // a → 0.5, returns a new PastelColor
```

`new PastelColor(...)` clamps `saturation` / `lightness` to `[0, 100]` and `alpha` to `[0, 1]`. Out-of-range hues are wrapped into `[0, 360)`.

### Direct API

```ts
import { pickPastelHue, pickPastelHueForKey } from 'nano-pastel'

pickPastelHue(0) // → 10 (warm palette, index 0)
pickPastelHue(1) // → 200 (cool palette, index 0)
pickPastelHue(2) // → 50 (warm palette, index 1)
pickPastelHueForKey('alpha') // → stable hue for the key 'alpha' (FNV-1a)
```

## API

| Export | Description |
|---|---|
| `pickPastelHue(index, palette?)` | Returns the canonical hue for an index. Even = warm, odd = cool. |
| `pickPastelHueForKey(key, palette?)` | Hash-based stable hue (FNV-1a). |
| `pastelsFor(groupOrder, { strategy?, palette?, saturation?, lightness?, alpha? })` | Maps each group to a `PastelColor`. `strategy`: `'order'` (default) or `'hash'`. |
| `pastelHuesForGroupOrder(count, palette?)` | Returns an array of hues for `0..count-1`. |
| `hueDistance(a, b)` | Wrapped hue distance (0-180). |
| `HUE_SET_WARM` / `HUE_SET_COOL` / `DEFAULT_PALETTE` | The two built-in hue sets and the combined palette object. |
| `DEFAULT_HSL` | The default `saturation` / `lightness` / `alpha` applied by `pastelsFor`. |
| `PastelColor` | Class — see [the PastelColor section](#pastelcolor). |

## License

MIT
