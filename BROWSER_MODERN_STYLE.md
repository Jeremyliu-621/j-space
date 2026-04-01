# BROWSER_MODERN_STYLE.md

## Your prompt

> "Read BROWSER_MODERN_STYLE.md in full. Throw out the current browser chrome CSS and rebuild it to look like a modern browser. Do not stop until it looks clean and convincing. Write decisions back into this file."

---

## The problem

The current browser chrome looks like a bad Win98 parody — orange title bars, clunky raised borders everywhere, ugly tab styling. Scrap it entirely.

The browser should look **modern** — like Chrome, Arc, or Brave. Clean, flat, minimal chrome. The only connection to the rest of the site is color: use the theme CSS custom properties for the palette, but the design language is contemporary.

---

## Visual reference

Think Chrome or Arc circa 2023-2024:

- Thin, tight chrome — the browser UI takes up as little vertical space as possible
- Tabs are rounded at the top, flat-bottomed, merge into the toolbar
- Active tab is clearly distinct — lighter background, no bottom border connecting to content
- Toolbar is a single clean bar: favicon/lock icon, address bar centered and pill-shaped or rounded-rect, minimal action buttons
- No heavy borders, no 3D effects, no raised buttons
- Subtle separators between chrome layers — 1px borders or slight bg color shifts, nothing heavy
- The content area is just white/near-white, full bleed, no inset frame

---

## Layer structure

```
┌─────────────────────────────────────────────────────────┐
│  [ Graffiti.exe × ] [ BJJ.exe × ] [ Art.exe × ] [ Yohji × ]   +  │  ← tab strip, rounded tabs, tight
├─────────────────────────────────────────────────────────┤
│  ← → ↻  🔒 C:\Jeremy\graffiti                    ⋮  │  ← toolbar, pill address bar, icon buttons
├─────────────────────────────────────────────────────────┤
│                                                         │
│                   CONTENT AREA                          │  ← full bleed, white/near-white
│                                                         │
└─────────────────────────────────────────────────────────┘
```

No title bar. No menu bar. No status bar. Just tab strip + toolbar + content. That's it. Modern browsers don't show those things by default.

---

## Spec

### Tab strip

- Sits at the very top of the browser
- Background: slightly darker than the toolbar — the "inactive zone"
- Tabs: rounded top corners (`border-radius` on top corners only), flat bottom
- Active tab: white or near-white background (matching content area), no bottom border — visually merges with content below
- Inactive tabs: slightly transparent or muted background, visible on hover
- Each tab has a small `×` close button on the right (decorative)
- Tabs have a favicon placeholder (small square or icon, 16×16) on the left
- Tab text: `Graffiti`, `BJJ`, `Art`, `Yohji` — regular weight, small, truncated with ellipsis if needed
- New tab `+` button at the end of the tab row (decorative)

### Toolbar

- Single row below tab strip
- Background: slightly lighter than tab strip background
- Left: back `←` and forward `→` icon buttons — circular hover state, flat otherwise. Refresh `↻` button next to them
- Center: address bar — pill-shaped or rounded-rect input, takes up most of the row width, shows fake URL for active tab (`C:\Jeremy\graffiti`, `C:\Jeremy\bjj`, etc.), has a lock icon `🔒` on the left inside the bar, subtle inner border
- Right: a `⋮` menu button (decorative)
- 1px bottom border separating toolbar from content

### Content area

- Full remaining height, full width
- White or near-white background — no inset border, no frame, just a clean page canvas
- Its own scroll context — scrolling here does NOT scroll the outer page
- Placeholder text centered for now

---

## Color rules

- Pull all colors from the existing theme CSS custom properties — inspect what variables the theme editor sets and use those
- The tab strip, toolbar, and tab backgrounds should use different tints/shades derived from the same palette — not all the same flat color
- Text should have proper contrast against its background at all times
- No hardcoded hex values

---

## What not to do

- No orange. No raised 3D borders. No Win98 button style anywhere in this component
- No title bar, menu bar, or status bar — modern browsers don't show these
- No heavy drop shadows
- No gradients
- Do not hardcode colors
- Do not make the chrome take up more than ~80px of vertical space total — it should feel tight

---

## Decisions log

1. **Font**: Switched tab/toolbar text from `--custom-font` (Jersey 10) to `system-ui` — modern browsers use system fonts for chrome, not display fonts. Station labels still use `--custom-font`.
2. **Color mixing**: Used `color-mix(in srgb, ...)` to derive tints/shades from palette variables instead of hardcoding hex. Tab strip bg = `--palette-color-1`, inactive tabs = 40% `--palette-color-2` into `--palette-color-1`, toolbar/active tab = 25% `--palette-color-2` into `--palette-color-3`, address bar = 6% `--palette-color-1` into `--palette-color-3`.
3. **Chrome height**: Tab strip 42px + toolbar 38px = **80px total** — right at the spec limit.
4. **Tab shape**: Rounded 8px top corners, flat bottom. Active tab background matches toolbar background so they visually merge. No inverse-curve pseudo-elements (removed — those were the Win98 holdover).
5. **Toolbar structure**: Three nav buttons (←→↻) left, pill address bar center, menu (⋮) right. Lock icon inside address bar.
6. **Address bar URLs**: `C:\Jeremy\graffiti`, etc. — updates reactively when switching tabs.
7. **Favicon placeholder**: Small 14×14 square using `currentColor` with reduced opacity — no external assets.
8. **New tab button**: `+` circle button after last tab, decorative only.
9. **Content area**: Removed the 2px `--palette-color-2` border that framed the old content area. Full bleed now.
10. **Kept**: Per-tab background patterns, station ghost labels, scroll isolation logic — all unchanged.
