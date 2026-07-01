![nano-pastel](.github/images/nano-pastel.png)

# nano-pastel

> Pastel color palette generator with **parity-alternating hue selection** so adjacent groups never look alike. Returns `PastelColor` instances you can `.lighten()`, `.darken()`, or drop straight into inline styles.

## Why

When you have an ordered list of groups (e.g. sections of a debug table) and want each one to have its own pastel background, naive hashing produces lots of collisions — two adjacent groups often land on the same hue.

This library solves it with two complementary palettes:

- even indices → warm-side hues (0°-180°)
- odd indices → cool-side hues (180°-360°)

That guarantees a hue gap of ≥ 100° between any two neighbors, with a translucent background that lets the container color bleed through for the "candy / cream" feel.

## Install

```bash
pnpm add nano-pastel
```

## Usage

```ts
import { pastelsFor, pastelStyle, stylesForGroupOrder } from 'nano-pastel'

// Inline style for an NTag-like element
const groupOrder = ['group1', 'group2', 'group3', 'group4', 'group5', 'group6', 'group7', 'group8']
const groupColors = pastelsFor(groupOrder)
// groupColors.group1.value → 'hsla(10, 45%, 92%, 0.9)'
// groupColors.group2.value → 'hsla(200, 45%, 92%, 0.9)'

// Or get a ready-to-spread object suitable for v-bind / :style
const styles = stylesForGroupOrder(groupOrder, 'dark')
// styles.group1.backgroundColor.value → 'hsla(10, 35%, 32%, 0.55)'
```

### `PastelColor`

`pastelsFor`, `pastelStyle`, and `stylesForGroupOrder` all return `PastelColor` instances. Each one carries a hue, theme-aware saturation / lightness / alpha, and a few immutable mutators:

```ts
import { PastelColor } from 'nano-pastel'

const color = new PastelColor({ hue: 10, theme: 'light' })
color.value // 'hsla(10, 45%, 92%, 0.9)'
color.hsl // { h: 10, s: 45, l: 92, a: 0.9 }
color.lighten(10) // L → 100, returns a new PastelColor
color.darken(20) // L → 72, returns a new PastelColor
color.saturate(15) // S → 60, returns a new PastelColor
color.desaturate(50) // S → 0, returns a new PastelColor
color.withAlpha(0.5) // a → 0.5, returns a new PastelColor
```

All mutators are pure — `color.value` is unchanged after the call, and you get back a new instance.

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
import { pastelStyle } from 'nano-pastel'

const brandPalette = {
  warm: [15, 60, 110, 160],
  cool: [210, 260, 310, 350]
}

pastelStyle({ index: 0, palette: brandPalette })
// → { backgroundColor: <PastelColor hue=15>, color: <PastelColor hue=15 s=55 l=32>, border: '0' }
```

### Direct API

```ts
import { pastelStyle, pickPastelHue, pickPastelHueForKey } from 'nano-pastel'

pickPastelHue(0) // → 10 (warm palette, index 0)
pickPastelHue(1) // → 200 (cool palette, index 0)
pickPastelHue(2) // → 50 (warm palette, index 1)
pickPastelHueForKey('alpha') // → stable hue for the key 'alpha' (FNV-1a)

pastelStyle({ index: 2, theme: 'light' })
// → { backgroundColor: <PastelColor hsla(50, 45%, 92%, 0.9)>, color: <PastelColor hsla(50, 55%, 32%, 1)>, border: '0' }
```

## API

| Export | Description |
|---|---|
| `pickPastelHue(index, palette?)` | Returns the canonical hue for an index. Even = warm, odd = cool. |
| `pickPastelHueForKey(key, palette?)` | Hash-based stable hue (FNV-1a). |
| `pastelStyle({ index, theme?, borderless?, palette? })` | Returns a `PastelStyle` of `PastelColor` instances. |
| `pastelsFor(groupOrder, { strategy?, theme?, palette? })` | Maps each group to a `PastelColor`. `strategy`: `'order'` (default) or `'hash'`. |
| `stylesForGroupOrder(groupOrder, theme?, { strategy?, palette?, borderless? })` | Maps each group to a full `PastelStyle`. |
| `pastelHuesForGroupOrder(count, palette?)` | Returns an array of hues for `0..count-1`. |
| `hueDistance(a, b)` | Wrapped hue distance (0-180). |
| `HUE_SET_WARM` / `HUE_SET_COOL` / `DEFAULT_PALETTE` | The two built-in hue sets and the combined palette object. |
| `PastelColor` | Class — see [the PastelColor section](#pastelcolor). |

## License

MIT
