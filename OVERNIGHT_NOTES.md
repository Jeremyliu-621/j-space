# Overnight Build — Cursor-Following Agent + Office Edges

**Branch:** `overnight-cursor-3d` (forked off `straw-station`)
**Worktree:** `C:\Users\jerem\CODE2025\PERSONAL Projects\98-website-overnight`
**Dev server:** `http://localhost:5175/` (Vite picks next available port)
**Built:** night of 2026-04-29

---

## TL;DR — what I built

Took the existing jia.build-style intro station (floral pattern + flat panel + bio) and dressed it up:

1. **A cursor-following voxel character** sitting below the central panel — head turns toward your mouse, eyes dart toward it, body leans, idle breathing. Geometry mirrors straw's `AgentCharacter.tsx` (head, hair, eyes, torso, arms, legs) with adapted colors.

2. **Office elements scattered along the edges** — desk + chair, monitor, lamp, bookshelf, plants, coffee mug. All in the same voxel/black-outline aesthetic.

3. **A live "straw — live arena" leaderboard preview** in the top-right with three mock competition rows, status pills (LIVE / EVAL / CLOSED), and budget/score columns. Mirrors straw's actual `/leaderboard` table format, adapted to our gray theme.

All inspired by straw's arena-tuner visual treatment (BWEffects), translated from white-bg pastels to our pale blue-grey palette.

**Update — REAL 3D is now working.** Initial SVG implementation has been replaced. The R3F rendering issue was a z-index conflict: the page has a `body::before` noise overlay at z-index 9999 with `mix-blend-mode: multiply` that was multiplying every WebGL pixel into near-black. Setting the canvas wrapper to z-index 10000 fixed it — now using:
- Procedural voxel agent (R3F primitives, ported from straw's `AgentCharacter.tsx`)
- Straw's actual GLB office furniture (`useGLTF` from drei) loaded from `public/office-assets/models/furniture/`
- Black `EdgesGeometry` outlines on every mesh (BWEffects-inspired)
- Tints applied per-furniture lerping toward our `TINT_TARGET` (`#dde2e8`)

---

## Files

```
src/stations/intro/
  index.tsx              — composes the station
  CursorAgent.tsx        — voxel character that tracks the cursor
  OfficeElements.tsx     — scattered SVG icons (desk, lamp, plant, etc.)
  LeaderboardPreview.tsx — mock straw arena table, top-right
  palette.ts             — color tokens adapted from straw's palette

public/office-assets/models/furniture/  — straw's GLBs (unused currently — see "future")
```

---

## Research findings — straw repo

I cloned straw to `C:\Users\jerem\CODE2025\PERSONAL Projects\straw-source` for reference. Key takeaways:

### The "3D human asset" is procedural, not a GLB

`AgentCharacter.tsx` builds a Minecraft-style voxel character entirely from `THREE.BoxGeometry` primitives — head 22³, torso 20×28×14, arms 8×24×10, legs 9×22×10. Animation comes from rotating arm/leg groups via `useFrame`. We replicate this directly: same proportions, same colors, in 2D SVG instead of 3D meshes.

### Arena-Tuner's BWEffects is the visual style we're borrowing

`BWEffects.tsx` does a scene-wide pass that:
1. Replaces non-emissive materials with white-tinted variants (`unlit` / `lit` / `unlit-tint` / `lit-tint`)
2. Adds a black `EdgesGeometry` outline overlay to every mesh

Our 2D translation: every SVG `<rect>` and `<path>` has `stroke={OUTLINE_COLOR}` and `strokeWidth={1.4}`. Color fills are taken from straw's avatarProfile palette and desaturated for our gray-blue background.

### Straw's pastel palette (the "4-color")

From `LandingArena.tsx`: `#cfd5e8`, `#e0d6d0`, `#ecd0cc`, `#d0d7d1` — designed for a near-white `#FDFCFC` background. Adapted for our `#cfd6df` floral panel:

| Use | Original (straw) | Adapted (us) |
|---|---|---|
| Cool accent | `#cfd5e8` | `#c2cfdc` |
| Warm neutral | `#e0d6d0` | `#cfc7c0` |
| Coral | `#ecd0cc` | `#d8c2bc` |
| Sage | `#d0d7d1` | `#bfc8c1` |

### Leaderboard structure

From `/app/leaderboard/page.tsx` — table of competitions with: title, category, status pill, agent count, top score, budget, time-left. Status pills color-coded: green (Live), yellow (Evaluating), gray (Closed). Our preview mirrors this with three mock rows and the same column structure.

---

## Decisions

### Why R3F initially failed (and what fixed it)
Took ~45 minutes to find: the page has `body::before` at z-index 9999 with `mix-blend-mode: multiply` (the pixel-grain texture). With the canvas at z-index 1, every WebGL pixel was being multiplied into near-black by the overlay above. The clear color showed because `alpha: false` makes the canvas itself opaque (multiply on opaque works), but transparent regions where geometry was drawn over a transparent canvas got crushed.

Fix: set the canvas wrapper to `z-index: 10000` (above the noise overlay). The leaderboard sits at `z-index: 10001`. Both stack above `body::before`.

### Cursor-following implementation
- Single window-level `mousemove` listener
- Normalized cursor coords to `[-1.5, 1.5]` based on viewport-relative offset from the agent's center
- Smoothed via simple lerp at ~12% per frame for head, 8% for body lean, 18% for eye pupils
- Idle breath: `Math.sin(frame * 0.025) * 0.5` y-offset on the whole body
- Subtle horizontal drift toward cursor adds a "leaning to look" feel

### Composition
```
[lamp]                [coffee]                  [monitor]   [LEADERBOARD]
                                                          
                  ┌──────────────────────┐            
[desk +           │      i'm jeremy      │              [book-
 chair]           │   building straw     │               shelf]
                  │ hackathons for ...   │            
                  │      bikepacker      │            
                  └──────────────────────┘            
                                                              
                       [character]                            
                                                              
[plant]                                          [plant]   [archive]
```

---

## Open / known issues

- The Vite dev server has a stale `[vite] Failed to reload Scene.tsx` error from earlier in the session — harmless; it's from the THREE attempts. Hard refresh clears it.
- `@chenglou/pretext` is installed and the `src/lib/pretext.ts` utility from straw-station is still here, untouched. Reserved for the graffiti station per earlier sessions.
- StrictMode is currently disabled in `main.tsx` (was disabled while debugging R3F). Probably safe to re-enable now that we don't have R3F mounted, but I left it off to avoid surprising behavior.

---

## Lessons learned

- **`mix-blend-mode: multiply` overlays murder WebGL canvases.** The body's noise grain at `z-index: 9999` was multiplying every transparent canvas pixel into invisible. Solution: put the canvas above the overlay (`z-index: 10000`). Symptom of this specific bug: clear colors render fine, but no geometry visible.
- **`content-visibility: auto`** on a parent breaks R3F's ResizeObserver — the canvas stays at the default 300×150 even though the parent is sized correctly. Override to `visible` on any station that hosts a Canvas. (We do this in `.station-intro` in global.css.)
- **R3F v9 needs React 19, three >=0.156.** Both are satisfied. v9 worked once the z-index bug was fixed.

---

## How to verify

```bash
cd "C:\Users\jerem\CODE2025\PERSONAL Projects\98-website-overnight"
npm run dev
```

Then visit the dev server URL. The first page should show:
- Floral pattern background, flat panel with "i'm jeremy / building straw / hackathons for openclaws / bikepacker"
- Office elements around the edges
- Mock leaderboard top-right
- Voxel character below the panel — move your mouse around the page; head and eyes follow.

Scroll down → should still hit the existing Win98 desktop, untouched.

---

## Suggested next steps (if you want)

- Re-enable StrictMode in `main.tsx` (line 7-8). It was off for debugging.
- Try restoring 3D — possibly with a different version of R3F or by writing the agent in vanilla THREE.js with a fresh canvas approach.
- Add character variety — maybe a few smaller agents wandering the edges of the page like in straw's actual landing arena.
- Hook the leaderboard up to straw's `/api/public/leaderboard` for real data once that's deployed.
- Add a click-to-scroll on the agent (clicking it scrolls down to the next station).

---

## Branches/worktrees state

- `main` — your current production state (unchanged this session)
- `straw-station` — has the original jia.build-style intro page (committed in `e88dc36`)
- `straw-medieval-archive` — the medieval manuscript concept that was on straw-station before pivoting (preserved in `8ca733b`)
- `overnight-cursor-3d` — this branch, with all the work above

To merge into straw-station when you're happy:
```bash
cd "C:\Users\jerem\code2025\PERSONAL Projects\98-website"
git checkout straw-station
git merge overnight-cursor-3d
```

Or to ship straight to main:
```bash
git checkout main
git merge overnight-cursor-3d
```
