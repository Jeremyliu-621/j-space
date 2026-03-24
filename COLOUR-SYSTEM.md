# Colour System Documentation

A comprehensive reference for every colour, font, and visual treatment used across the j-space website — including how the 8 dynamic palettes remap to specific elements.

---

## Table of Contents

1. [Font System](#font-system)
2. [CSS Variables](#css-variables)
3. [Windows 98 Framework Colours (98.css)](#windows-98-framework-colours-98css)
4. [Dynamic Palette System](#dynamic-palette-system)
5. [How Palette Colours Map to Elements](#how-palette-colours-map-to-elements)
6. [All 8 Palettes](#all-8-palettes)
7. [Background Treatment Per Theme](#background-treatment-per-theme)
8. [Hardcoded Colours (Not Theme-Aware)](#hardcoded-colours-not-theme-aware)
9. [Hover, Active, and Focus States](#hover-active-and-focus-states)
10. [3D Border System](#3d-border-system)
11. [Typography Sizes](#typography-sizes)
12. [File Locations](#file-locations)

---

## Font System

### Primary Font — Jersey 10

| Property       | Value                                          |
| -------------- | ---------------------------------------------- |
| Source         | Google Fonts (`index.html`, lines 6–11)        |
| CSS variable   | `--custom-font: "Jersey 10", sans-serif`       |
| Fallback chain | `"Jersey 10"` → `sans-serif`                  |

**Applied to:**

| Element                | File & Line               |
| ---------------------- | ------------------------- |
| `body`                 | `src/style.css:30`        |
| Desktop folder labels  | `src/style.css:745`       |
| Social buttons         | `src/style.css:799`       |
| Project tabs           | `src/style.css:977`       |
| All window content     | Inherited from `body`     |

### Secondary Font — Pixelated MS Sans Serif

Defined by the 98.css library via `@font-face` in `node_modules/98.css/style.css:85–99`. Loaded from WOFF/WOFF2. Used internally by 98.css for native Win98 chrome (title bars, menu labels, status bars). In practice, `--custom-font` overrides most of these.

### Fallback — Arial

Used by 98.css when neither of the above are available.

---

## CSS Variables

Defined in `src/style.css:12–18` and dynamically overwritten by `src/main.js` when a theme is applied:

```css
:root {
  --custom-font:      "Jersey 10", sans-serif;
  --palette-color-1:  #c0c0c0;   /* maps to colors[0] — darkest  */
  --palette-color-2:  #808080;   /* maps to colors[1] — primary  */
  --palette-color-3:  #000000;   /* maps to colors[2] — secondary */
  --palette-color-4:  #ffffff;   /* maps to colors[3] — lightest  */
}
```

Additional variables set dynamically by JS on `<html>` or desktop element:

| Variable         | Purpose                                   | Set in            |
| ---------------- | ----------------------------------------- | ----------------- |
| `--bg-image`     | Desktop wallpaper URL                     | `main.js`         |
| `--bg-filter`    | CSS `filter` for background (per-theme)   | `main.js:267–274` |
| `--bg-overlay`   | Translucent colour tint over wallpaper    | `main.js:277–284` |

---

## Windows 98 Framework Colours (98.css)

These are the defaults provided by the `98.css` library (`node_modules/98.css/style.css:7–82`). They define the base Win98 chrome:

| Variable               | Value      | Used for                                         |
| ---------------------- | ---------- | ------------------------------------------------ |
| `--text-color`         | `#222222`  | Body text, headings                              |
| `--surface`            | `#c0c0c0`  | Main surface (buttons, window backgrounds)       |
| `--button-highlight`   | `#ffffff`  | Light edge of 3D bevels                          |
| `--button-face`        | `#dfdfdf`  | Button face / depressed state fill               |
| `--button-shadow`      | `#808080`  | Dark edge of 3D bevels                           |
| `--window-frame`       | `#0a0a0a`  | Outermost window outline                         |
| `--dialog-blue`        | `#000080`  | Active title bar gradient start (navy)           |
| `--dialog-blue-light`  | `#1084d0`  | Active title bar gradient end (blue)             |
| `--dialog-gray`        | `#808080`  | Inactive title bar gradient start                |
| `--dialog-gray-light`  | `#b5b5b5`  | Inactive title bar gradient end                  |
| `--link-blue`          | `#0000ff`  | Hyperlinks                                       |

---

## Dynamic Palette System

The theming engine lives in `src/main.js:231–436`. Each palette is an array of **4 colours** ordered darkest → lightest:

```
colors[0]  — darkest   → buttons / interactive element backgrounds
colors[1]  — primary   → borders (window bodies, images, items)
colors[2]  — secondary → window body / card / item backgrounds
colors[3]  — lightest  → button text colour, light fills
```

### How Palette Colours Map to Elements

Below is the exact mapping applied by `applyPalette()` in `main.js:287–436`:

| Target Element / Selector                | CSS Property       | Palette Slot           |
| ---------------------------------------- | ------------------ | ---------------------- |
| `.window-body` backgrounds               | `background-color` | `colors[2]` secondary  |
| `.window-body` borders                   | `border-color`     | `colors[1]` primary    |
| Buttons (`button` elements in windows)   | `background-color` | `colors[0]` darkest    |
| Button text                              | `color`            | `colors[3]` lightest   |
| Project cards (`.project-card`)          | `background-color` | `colors[2]` secondary  |
| Project card borders                     | `border-color`     | `colors[1]` primary    |
| Hobby items                              | `background-color` | `colors[2]` secondary  |
| Hobby item borders                       | `border-color`     | `colors[1]` primary    |
| Thank-you items                          | `background-color` | `colors[2]` secondary  |
| Thank-you item borders                   | `border-color`     | `colors[1]` primary    |
| Image viewer borders                     | `border-color`     | `colors[1]` primary    |
| Image borders (throughout)               | `border-color`     | `colors[1]` primary    |
| `--palette-color-1` (CSS var)            | —                  | `colors[0]` darkest    |
| `--palette-color-2` (CSS var)            | —                  | `colors[1]` primary    |
| `--palette-color-3` (CSS var)            | —                  | `colors[2]` secondary  |
| `--palette-color-4` (CSS var)            | —                  | `colors[3]` lightest   |
| `h2` colour                              | `color`            | `--palette-color-1`    |

### Palette persistence

- **`localStorage["colorPalette"]`** — palette name string
- **`localStorage["paletteColors"]`** — JSON array of 4 hex strings
- On load (`main.js:638–644`): a random theme is selected if none is stored.
- On "Apply" in Settings window: new palette is saved and applied to all elements.

---

## All 8 Palettes

### 1. Default (Win98 Authentic)

| Slot       | Hex       | Swatch | Role                  |
| ---------- | --------- | ------ | --------------------- |
| `[0]`      | `#000000` | ■      | Buttons               |
| `[1]`      | `#808080` | ■      | Borders               |
| `[2]`      | `#c0c0c0` | ■      | Window body BG        |
| `[3]`      | `#e0e0e0` | ■      | Button text / light   |

Resets to hardcoded defaults. No background filter or overlay.

### 2. Dark

| Slot       | Hex       | Swatch | Role                  |
| ---------- | --------- | ------ | --------------------- |
| `[0]`      | `#1a1a1a` | ■      | Buttons               |
| `[1]`      | `#2d2d2d` | ■      | Borders               |
| `[2]`      | `#404040` | ■      | Window body BG        |
| `[3]`      | `#525252` | ■      | Button text / light   |

Uses a dedicated dark background image (`dark-Backgroundpixels`). No CSS filter or overlay.

### 3. Retro Green

| Slot       | Hex       | Swatch | Role                  |
| ---------- | --------- | ------ | --------------------- |
| `[0]`      | `#5C6F2B` | ■      | Buttons (olive)       |
| `[1]`      | `#DE802B` | ■      | Borders (orange)      |
| `[2]`      | `#D8C9A7` | ■      | Window body BG (tan)  |
| `[3]`      | `#EEEEEE` | ■      | Button text (white)   |

**BG filter:** `hue-rotate(15deg) saturate(1.1) brightness(0.95)`
**BG overlay:** `rgba(92, 111, 43, 0.08)`

### 4. Lilac

| Slot       | Hex       | Swatch | Role                     |
| ---------- | --------- | ------ | ------------------------ |
| `[0]`      | `#898AC4` | ■      | Buttons (soft purple)    |
| `[1]`      | `#A2AADB` | ■      | Borders (light purple)   |
| `[2]`      | `#C0C9EE` | ■      | Window body BG (lavender)|
| `[3]`      | `#FFF2E0` | ■      | Button text (cream)      |

**BG filter:** `hue-rotate(20deg) saturate(1.15) brightness(1.02)`
**BG overlay:** `rgba(137, 138, 196, 0.06)`

### 5. Snow

| Slot       | Hex       | Swatch | Role                       |
| ---------- | --------- | ------ | -------------------------- |
| `[0]`      | `#89A8B2` | ■      | Buttons (cool blue-gray)   |
| `[1]`      | `#B3C8CF` | ■      | Borders (light blue-gray)  |
| `[2]`      | `#E5E1DA` | ■      | Window body BG (warm white)|
| `[3]`      | `#F1F0E8` | ■      | Button text (pale cream)   |

**BG filter:** `hue-rotate(180deg) saturate(0.9) brightness(1.05)`
**BG overlay:** `rgba(137, 168, 178, 0.05)`

### 6. Dark Chocolate

| Slot       | Hex       | Swatch | Role                       |
| ---------- | --------- | ------ | -------------------------- |
| `[0]`      | `#896C6C` | ■      | Buttons (warm brown)       |
| `[1]`      | `#E5BEB5` | ■      | Borders (mauve)            |
| `[2]`      | `#EEE6CA` | ■      | Window body BG (warm beige)|
| `[3]`      | `#e0e0e0` | ■      | Button text (light gray)   |

**BG filter:** `hue-rotate(25deg) saturate(1.2) brightness(0.92)`
**BG overlay:** `rgba(137, 108, 108, 0.07)`

### 7. Cream

| Slot       | Hex       | Swatch | Role                       |
| ---------- | --------- | ------ | -------------------------- |
| `[0]`      | `#C9B59C` | ■      | Buttons (warm tan)         |
| `[1]`      | `#D9CFC7` | ■      | Borders (light brown)      |
| `[2]`      | `#EFE9E3` | ■      | Window body BG (cream)     |
| `[3]`      | `#F9F8F6` | ■      | Button text (off-white)    |

**BG filter:** `hue-rotate(30deg) saturate(1.1) brightness(1.03)`
**BG overlay:** `rgba(201, 181, 156, 0.06)`

### 8. Calm Green

| Slot       | Hex       | Swatch | Role                       |
| ---------- | --------- | ------ | -------------------------- |
| `[0]`      | `#778873` | ■      | Buttons (sage green)       |
| `[1]`      | `#A1BC98` | ■      | Borders (soft green)       |
| `[2]`      | `#D2DCB6` | ■      | Window body BG (pale green)|
| `[3]`      | `#F1F3E0` | ■      | Button text (pale lime)    |

**BG filter:** `hue-rotate(4deg) saturate(1.15) brightness(0.98)`
**BG overlay:** `rgba(119, 136, 115, 0.07)`

---

## Background Treatment Per Theme

The desktop wallpaper is styled via pseudo-elements on `win98-desktop` (`src/style.css:90–119`):

| Layer               | Property                  | Purpose                                    |
| ------------------- | ------------------------- | ------------------------------------------ |
| `::before`          | `background-image`        | The wallpaper image (set via `--bg-image`)  |
| `::before`          | `filter: var(--bg-filter)`| Hue/saturation/brightness shift per theme  |
| `::after`           | `background: var(--bg-overlay)` | Subtle translucent colour tint       |

### Body Noise Overlay (`src/style.css:36–64`)

A `body::before` pseudo-element adds a faint CRT scanline effect over everything:

- **Pattern:** repeating linear gradients
- **Colour:** `rgba(0, 0, 0, 0.05)`
- **Opacity:** `0.745`
- **Blend mode:** `multiply`

This overlay is **not theme-aware** — it applies identically across all palettes.

---

## Hardcoded Colours (Not Theme-Aware)

These colours remain constant regardless of which palette is active:

| Colour      | Hex / Value                  | Where Used                                                   | File                          |
| ----------- | ---------------------------- | ------------------------------------------------------------ | ----------------------------- |
| Body BG     | `#c0c0c0`                   | Page background                                              | `src/style.css:25`            |
| Title bar active | `#000080` → `#1084d0`  | Window title bar gradient                                    | `98.css` (--dialog-blue/light)|
| Title bar inactive | `#808080` → `#b5b5b5` | Inactive window title bar gradient                           | `98.css` (--dialog-gray/light)|
| Links       | `#0000ff`                    | Hyperlinks (thank-you items, etc.)                           | `main.js:2428`, `98.css`      |
| Folder hover | `rgba(0, 0, 128, 0.3)`     | Desktop icon hover highlight                                 | `src/style.css:758`           |
| Folder selected | `#000080`               | Desktop icon selected/active state                           | `src/style.css:766`           |
| Start menu hover | `#000080` bg, `#fff` text | Start menu item hover                                     | `src/style.css:167`           |
| Stack text  | `#666`                       | Technology stack labels on project cards                     | `src/style.css:538`           |
| Stack text (single) | `#000`               | Technology stack labels in single project view               | `src/style.css:592`           |
| Social btn hover | `#d4d4d4`               | Social button hover state                                    | `src/style.css:808`           |
| Social btn active | `#a0a0a0`              | Social button pressed state                                  | `src/style.css:813`           |
| Tab hover   | `#d4d4d4`                    | Project tab hover                                            | `src/style.css:984`           |
| Tab active border | `#808080` / `#ffffff`  | Top-left / bottom-right of pressed tab                       | `src/style.css:989–998`       |
| Icon text shadow | `#fff` (4 directions)   | White outline on desktop icon labels                         | `src/style.css:747`           |
| Disabled text | `#808080` + `#ffffff` shadow | Disabled button text with light shadow                    | `98.css`                      |
| Noise overlay | `rgba(0, 0, 0, 0.05)`     | CRT scanline effect                                          | `src/style.css:47`            |
| Icon drop shadow | `rgba(0, 0, 0, 0.3)`   | Desktop folder icon shadow                                   | `src/style.css:732`           |

---

## Hover, Active, and Focus States

### Buttons (Social / General)

| State   | Background | Text    | Border                                                         |
| ------- | ---------- | ------- | -------------------------------------------------------------- |
| Default | `#c0c0c0`  | `#000`  | Top/left: `2px solid #ffffff`, Bottom/right: `2px solid #808080` |
| Hover   | `#d4d4d4`  | `#000`  | Same as default                                                |
| Active  | `#a0a0a0`  | `#000`  | `2px inset #c0c0c0`                                           |

Transition: `all 0.1s`

### Desktop Folder Icons

| State    | Effect                          |
| -------- | ------------------------------- |
| Hover    | `rgba(0, 0, 128, 0.3)` background |
| Selected | `#000080` solid background      |

### Start Menu Items

| State  | Background | Text   |
| ------ | ---------- | ------ |
| Hover  | `#000080`  | `#fff` |

Transition: `0.1s`

### Project Tabs

| State  | Background | Border                                                             |
| ------ | ---------- | ------------------------------------------------------------------ |
| Hover  | `#d4d4d4`  | Default                                                            |
| Active | `#c0c0c0`  | Top/left: `1px solid #808080`, Bottom/right: `1px solid #ffffff`   |

### Focus (98.css)

- **Outline:** `1px dotted #000000` with `-4px` offset
- **Applied to:** buttons, inputs

---

## 3D Border System

The classic Win98 beveled look is created by layered `box-shadow` insets defined in 98.css:

### Raised (default state)

```
inset -1px -1px #0a0a0a,    /* outer bottom-right: near-black */
inset  1px  1px #ffffff,     /* outer top-left: white */
inset -2px -2px #808080,     /* inner bottom-right: gray */
inset  2px  2px #dfdfdf      /* inner top-left: light gray */
```

### Sunken (pressed/input fields)

The shadows are reversed — dark edges on top-left, light edges on bottom-right.

### Social Buttons (custom in `src/style.css:790–800`)

```
border-top:    2px solid #ffffff;
border-left:   2px solid #ffffff;
border-bottom: 2px solid #808080;
border-right:  2px solid #808080;
```

---

## Typography Sizes

| Element                  | Size      | Weight | Line Height | File                    |
| ------------------------ | --------- | ------ | ----------- | ----------------------- |
| Body text / paragraphs   | `1.25em`  | normal | `1.3`       | `src/style.css:658`     |
| List items               | `1.25em`  | normal | —           | `src/style.css:672`     |
| `h2`                     | `2.8em`   | bold   | —           | `src/style.css:678`     |
| `h3`                     | `1.35em`  | bold   | —           | `src/style.css:689`     |
| `h4`                     | `1.29em`  | normal | —           | `src/style.css:699`     |
| Project single title     | `2.4em`   | —      | —           | `src/style.css:560`     |
| Project section title    | `1.6em`   | —      | —           | `src/style.css:580`     |
| Window body (1065–1400px)| `0.85–0.9em` | — | —           | `src/style.css:318–326` |

`h2` colour is set to `var(--palette-color-1, #000000)` — it is theme-aware.

---

## File Locations

| File                                       | What it contains                        |
| ------------------------------------------ | --------------------------------------- |
| `src/style.css`                            | All custom styles (1257 lines)          |
| `src/main.js`                              | Palette definitions, theme logic        |
| `index.html`                               | Font imports, HTML structure            |
| `node_modules/98.css/style.css`            | Win98 framework variables and chrome    |
| `node_modules/98-components/dist/style.css`| Component-level Win98 styles            |
| `src/components/projects.js`               | Project card rendering (uses theme)     |
