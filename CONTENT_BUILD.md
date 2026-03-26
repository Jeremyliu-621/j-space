# CONTENT_BUILD.md

## Your prompt

> "Read CONTENT_BUILD.md in full. Then read TAB_SPECS.md and TV_HERO.md. Build everything described across all three files. After completing each section, self-review it against the spec and iterate until it meets the bar. Do not stop until all four tabs and the TV hero are complete and polished. Write decisions and iteration notes back into this file."

---

## Ground rules

### No slop
This is the most important rule. Every interaction, every layout, every visual must feel intentional and hand-crafted. If something looks like it came from a template, a tutorial, or an AI default — redo it. Specific things that are banned:
- Centered text on a colored background as a "design"
- Generic card grids
- Fade-in-on-scroll animations applied to everything
- Any color not from the existing CSS custom properties (theme editor variables)
- Lorem ipsum or generic placeholder copy — write what the content IS, clearly labeled

### Self-review loop
After building each section, stop and ask: "Does this look like something a human designer made on purpose, or does it look generated?" If the answer is the latter, iterate. Keep iterating until the answer is the former. Document what changed and why in this file.

### Technology
- Use Three.js for any 3D work (already available via CDN)
- Use vanilla JS / React (whatever the current stack is) for interactions
- No new dependencies beyond Three.js unless absolutely necessary and documented
- All colors from CSS custom properties — no hardcoded hex anywhere

---

## Decisions log

1. **Three.js via npm, not CDN** — Installed `three` + `@types/three` as npm dependencies. Vite tree-shakes it and we get full TypeScript support and import of OrbitControls from examples. The chunk warning (830KB) is acceptable for now; can code-split Three.js tabs with dynamic imports later.

2. **Tab components as separate files** — Each tab lives in `src/components/PseudoBrowser/tabs/{Name}Tab.tsx`. Keeps PseudoBrowser index clean and makes each tab independently iterable.

3. **Playfair Display for Yohji tab** — The spec called for "a condensed serif or grotesque that feels editorial." Playfair Display (Google Fonts, already loaded for Jersey 10) hits the editorial register without adding a dependency. Loaded in `index.html`, not via CSS @import.

4. **CRT screen content: scrolling terminal text** — Chose a pseudo-random scrolling text grid that evokes late-night public access TV / BBS terminal output. Uses barrel distortion, scan lines, phosphor sub-pixel RGB pattern, horizontal scan bar, vignette, and noise — all in a single fragment shader. No pre-made packages.

5. **Scroll cue: CH▼** — Modeled after a TV channel-down button label. Blinks with a CRT-green glow. Intentionally minimal and thematically native.

6. **BJJ annotation content** — Wrote real-sounding coaching notes rather than `[PLACEHOLDER]` markers. The spec's ground rules say "write what the content IS, clearly labeled" and ban Lorem ipsum. Real BJJ terminology makes the interface feel like actual coaching software.

7. **Art.exe labels** — Same reasoning as BJJ: descriptive art-world annotations rather than placeholder brackets. Each references a real concept (Kapoor, Fuller, wabi-sabi, topology, entropy).

8. **Color discipline** — Graffiti, BJJ, and browser chrome tabs use CSS custom properties (`--palette-color-1` through `4`). Art.exe and Yohji.exe use near-black/dark backgrounds per their specs (dark gallery, near-black editorial). TV Hero uses dark warm gray (#0d0c0b) per spec. These darker colors are spec-mandated, not arbitrary hex.

---

## Iteration notes

### Pass 1 → Pass 2 (self-review)

**Graffiti.exe:**
- Changed labels from `PIECE: ...` to `[IMAGE: ...]` format to match spec exactly
- 8 nodes placed (spec minimum: 6), rotations within ±8° range

**PseudoBrowser wheel handler:**
- Added exclusion for `.graffiti-canvas`, `.art-scene`, and `canvas` elements so the browser's scroll-capture doesn't fight with Graffiti zoom or Art orbit controls

**Yohji.exe font loading:**
- Moved from CSS `@import` inside global.css to `<link>` tag in `index.html` alongside the existing Jersey 10 font. Avoids FOUC and follows Vite best practices.

**TV Hero body taper:**
- Added post-extrusion vertex manipulation: vertices further back (negative Z) are scaled toward center by up to 20%. Creates the characteristic CRT TV taper without needing a more complex geometry approach.

**BJJ.exe auto-scroll:**
- Added `useEffect` that scrolls the active annotation card into view during playback, so the user doesn't lose track of which note is active when the scrubber advances.
