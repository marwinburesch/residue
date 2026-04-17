# Fragment card textures

Issue: [#11](https://github.com/marwinburesch/residue/issues/11) — Add textures to fragment cards.

## Goal

Give the two container card types (`Note` from corkboard, `Receipt` from receipts) distinct, paper-like visual identity. Pure CSS textures and one self-hosted handwritten font for Note values. Subtle rarity-driven tinting layered on top, kept understated to preserve the project's sterile/clinical aesthetic.

## Scope

- `src/ui/containerCard.ts` — set a `data-type` attribute on the card root reflecting `container.channel`.
- `src/ui/fragmentBrowser.css` — add the per-type texture layers, the rarity tint overlay, and the `@font-face` block for Patrick Hand.
- `src/ui/fonts/patrick-hand.woff2` — self-hosted woff2 file (Latin subset).
- `index.html` — inline a single hidden `<svg>` defining the thermal-noise filter, referenced by `filter: url(#thermal-noise)` in CSS.

No engine, data, or save changes. The change is presentational only.

## Per-type identity

Pseudo-element allocation is fixed across both types to avoid collisions:

- `::before` — texture overlay (paper fiber for notes, thermal grain for receipts).
- `::after` — rarity tint wash.

Both overlays are `position: absolute; inset: 0; pointer-events: none;` and sit behind the card's children via `z-index: 0` on the overlays and `z-index: 1` on the card contents.

The push-pin for notes is rendered as a separate small absolutely-positioned `<span class="pushpin">` element appended in `containerCard.ts` — this avoids contesting `::before`.

### Note (corkboard)

- **Base surface:** off-white paper tone (`#f6f1e3` light theme; `#1c1a14` dark theme), set as a CSS custom property scoped to `.container-card[data-type="note"]`.
- **Paper fiber (`::before`):** layered `repeating-linear-gradient` at two angles + a faint `radial-gradient` vignette. Total opacity under 8%.
- **Inner shadow:** `box-shadow: inset 0 0 24px rgba(0,0,0,0.06)` on the card itself.
- **Push-pin:** a `<span class="pushpin">` element absolutely positioned at top-center. A 6px circle with a soft drop shadow and a subtle radial highlight to suggest a pin head.
- **Value font:** Patrick Hand, used only on `.fragment-value` inside notes. Title (`h3`) and label (`.fragment-label`) stay JetBrains Mono — the sterile mono frame keeps the overall aesthetic intact.

### Receipt

- **Base surface:** thermal-paper white (`#fbfaf6` light; `#15151a` dark).
- **Horizontal banding:** very subtle `repeating-linear-gradient(0deg, transparent 0 2px, rgba(0,0,0,0.025) 2px 3px)` mimicking thermal print lines. Applied as a `background-image` on the card itself (layered under the `::before` grain).
- **Grain (`::before`):** SVG `feTurbulence` filter referenced via `filter: url(#thermal-noise)` on the `::before` overlay. Filter is defined once in `index.html`.
- **Perforated top edge:** a thin top strip with `mask-image: radial-gradient(circle 4px at 4px 0, transparent 98%, black 100%)` repeated to create the zigzag/perforation look. Applied as a clip on the card's top border area.
- **Value font:** unchanged — JetBrains Mono.

## Rarity-driven subtle tinting

The `::after` overlay applies a low-alpha wash using the existing `--rarity-*` variables:

```css
background: color-mix(in srgb, var(--rarity-tint, transparent) 5%, transparent);
```

`--rarity-tint` is set per rarity class on the card:

- `.rarity-common` — no tint (default).
- `.rarity-uncommon` — `var(--rarity-uncommon)`.
- `.rarity-rare` — `var(--rarity-rare)`.
- `.rarity-epic` — `var(--rarity-epic)`.
- `.rarity-legendary` — `var(--rarity-legendary)`.
- `.rarity-mythic` — `var(--rarity-mythic)`.

Tint alpha is capped at 5% so the sterile, paper-tone feel dominates. Rarity is still primarily signaled by the existing badge.

## Theme handling

Each per-type custom property has a value for both themes, switched by the existing `:root[data-theme="dark"]` selector chain. The tinting math reuses the dark-theme `--rarity-*` overrides automatically since `color-mix` resolves at apply time.

## File-by-file changes

### `src/ui/containerCard.ts`

In `createContainerView`, after `card.className = ...`:

```ts
card.dataset.type = container.channel === "corkboard" ? "note" : "receipt";
if (card.dataset.type === "note") {
  const pin = document.createElement("span");
  pin.className = "pushpin";
  card.appendChild(pin);
}
```

No other changes; the `sourceLabel` helper continues producing the title text.

### `src/ui/fragmentBrowser.css`

- Add `@font-face` declaration for Patrick Hand pointing at `./fonts/patrick-hand.woff2`, with `font-display: swap`.
- Add the `.container-card[data-type="note"]` and `.container-card[data-type="receipt"]` rule blocks with the texture layers described above.
- Add the rarity `--rarity-tint` definitions on `.container-card.rarity-*`.
- Override `.container-card[data-type="note"] .fragment-value` to use Patrick Hand.

### `src/ui/fonts/patrick-hand.woff2`

Downloaded from Google Fonts (OFL-licensed, Latin subset only). Add a short `LICENSE` note alongside the woff2 if redistribution requires it.

### `index.html`

Add an inline hidden SVG just inside `<body>` (before `<header>`):

```html
<svg width="0" height="0" style="position:absolute" aria-hidden="true">
  <filter id="thermal-noise">
    <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch"/>
    <feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.08 0"/>
  </filter>
</svg>
```

## Out of scope

- No animation on the textures themselves.
- No per-card random tints — only rarity-driven.
- No changes to the rarity badge.
- No engine, data, or save format changes.
- No new container types or channels.

## Manual verification

- Switch between light and dark themes; both card types remain legible.
- Spawn containers of each rarity; tint is visibly different but never loud.
- Resize down to 480px; textures and push-pin still look correct.
- Process / extract / discard buttons still readable on top of the textures.
