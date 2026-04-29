# Overnight Build — Cursor-Following Agent + Office Edges

**Branch:** `overnight-cursor-3d` (forked off `straw-station`)
**Worktree:** `C:\Users\jerem\CODE2025\PERSONAL Projects\98-website-overnight`
**Started:** 2026-04-29

## Goal

Take the existing jia.build-style intro station (floral pattern + flat panel + bio) and extend it with:

1. A 3D human "agent" character that follows the cursor
2. Office furniture and a leaderboard preview scattered along the left, right, and top edges of the page (framing the central panel)
3. Visual treatment inspired by straw's `arena-tuner` — adapted from straw's white-bg pastels to our pale blue-grey theme

---

## Research findings — straw repo

Cloned to `C:\Users\jerem\CODE2025\PERSONAL Projects\straw-source` for reference.

### The "3D human asset" is procedural, not a GLB

`AgentCharacter.tsx` builds a Minecraft-style voxel character entirely from `THREE.BoxGeometry` primitives:

- Head: 22×22×22 box (skin tone)
- Hair: 24×6×24 box on top
- Eyes: two 4×4×1 black boxes
- Torso: 20×28×14 box (top color)
- Arms: 8×24×10 box at shoulders, 7×6×8 hand at wrist (skin)
- Legs: 9×22×10 box at hips, 9×6×14 shoe at foot
- Status dot: small sphere above head

Animation:
- `useFrame` loop reads agent state from a ref each frame
- Walking: arms/legs swing via `Math.sin((frame + phase) * WALK_ANIM_SPEED)`
- Looking: head rotation toward target (`lookAtX/Y` → `Math.atan2`)
- Lerp position toward target with `0.15`

We replicate this directly in our codebase — no asset to copy, just the technique.

### Avatar color palette (`avatarProfile.ts`)

| Group | Examples |
|---|---|
| Skin | `#f7d7c2`, `#f4c58a`, `#d8a06e`, `#b7794e`, `#8a5a3b`, `#5d3a24` |
| Hair | `#151515`, `#3e2723`, `#6b4f3a`, `#7b341e`, `#d6b56c`, `#7c3aed`, `#0891b2`, `#db2777` |
| Clothing | `#2d3748`, `#7090ff`, `#34d399`, `#f59e0b`, `#f43f5e`, `#8b5cf6`, `#f5f5f4`, `#64748b` |
| Shoes | `#1a1a1a`, `#1e3a8a`, `#7c4a2d`, `#e5e7eb` |

### Arena-Tuner's BWEffects (the visual style we're borrowing)

`BWEffects.tsx` runs a scene-wide pass that:

1. Replaces every non-emissive mesh material with one of four variants:
   - `unlit` — flat white `MeshBasicMaterial`
   - `lit` — flat white `MeshStandardMaterial` (receives shadows)
   - `unlit-tint` — original color lerped toward white by `tintAmount`
   - `lit-tint` — same but lit
2. Adds a black outline overlay to each mesh via `THREE.EdgesGeometry` + `LineSegments`

The look = **clean polygon shapes in white-ish fills with crisp black contour lines**. Like a comic book page.

### Pastel accents used elsewhere in straw

`LandingArena.tsx` button accents (the "4-color pastel palette"):
- `#cfd5e8` (pale lavender-blue) — for "conference" CTA
- `#e0d6d0` (pale taupe) — for "round table"
- `#ecd0cc` (pale peach) — for "emoji"
- `#d0d7d1` (pale sage) — for "ping pong"

`HeroSection.tsx` button colors:
- `#f7d4d0` (pale coral)
- `#d9d4f6` (pale violet)

These are warm + saturated pastels designed to pop against straw's `#FDFCFC` near-white background.

### Office furniture

GLB models live at `/public/office-assets/models/furniture/*.glb`. Copied into our `public/office-assets/models/furniture/`:

- `desk.glb` (~10kb)
- `chairDesk.glb`
- `computerScreen.glb`
- `pottedPlant.glb`
- `lampRoundFloor.glb`
- `bookcaseClosed.glb`
- ... 11 more

`FurnitureModel.tsx` shows how they're loaded (`useGLTF` from drei) and tinted. Each furniture type has a custom tint (e.g. desk `#8b5e32`, computer `#363c58`).

### Leaderboard structure

`/leaderboard/page.tsx` — table of "competitions" with columns:
Title · Status pill · Agents count · Top score · Budget · Time-left

Status pills use color-coded soft pill backgrounds: green for "Live", yellow for "Evaluating", gray for "Closed".

Mock data has fields: `title`, `category`, `status`, `deadline`, `budget_cents`, `competitor_count`, `top_score`.

---

## Color adaptation for our gray theme

Our intro background: pale blue-grey floral pattern + flat panel of `#cfd6df`.

Straw's pastels (`#cfd5e8`, `#e0d6d0`, `#ecd0cc`, `#d0d7d1`) are designed for a near-white background. On our cooler `#cfd6df` background we need:

- **Lower saturation** — desaturate by ~30%
- **Cool the warm tones** — straw's peach/taupe shift toward grey-blue
- **Keep the same lightness** — they should still feel like pastel highlights

Adapted palette (proposed — will refine in browser):

| Use | Original (straw) | Adapted (us) |
|---|---|---|
| Conference / Cool accent | `#cfd5e8` | `#c2cfdc` (deeper blue-grey) |
| Round table / Warm neutral | `#e0d6d0` | `#cfc7c0` (muted taupe) |
| Emoji / Coral | `#ecd0cc` | `#d8c2bc` (rosy mauve) |
| Ping-pong / Sage | `#d0d7d1` | `#bfc8c1` (smoky sage) |

For the agent character:
- Use the existing skin/hair palette (warm tones still work, they're skin)
- Clothing: prefer the cooler/muted options (`#2d3748`, `#64748b`, `#7090ff`) over the vibrant pinks/greens. Lerp toward `#cfd6df` by ~25-35% so they don't clash with the BG.

For the BW edges effect:
- Keep black outlines (`#0a0a0a` not pure black, slightly softer)
- "White tint target" → use `#dde2e8` (slightly lighter than panel) for the lerp destination instead of pure white
- Tint amount: `0.5` — strong enough to feel cohesive, weak enough to keep some color identity

---

## Build plan (working through tasks)

1. ✅ Install deps (`@react-three/fiber`, `@react-three/drei`)
2. ✅ Copy GLB assets into `public/office-assets/`
3. **Build `<CursorAgent />`** — procedural character using only primitives, no GLB. Tracks cursor in screen space, then converts to 3D head rotation + body lean. Lives inside the IntroStation.
4. **Build `<EdgeOffice />`** — scattered office GLBs along the left/right/top edges of the IntroStation. Tinted with our adapted palette, ~25-30% opacity so they read as decoration not focus.
5. **Build `<LeaderboardPreview />`** — small DOM panel (NOT 3D) with mock competition rows. Style matches straw's leaderboard but with our adapted pastel pills. Position one row top-right.
6. **Apply our BW-style override** — for the 3D scene, give all our procedural meshes black edge outlines via `EdgesGeometry`, materials lerped toward `#dde2e8`.
7. **Tune positions, sizes, and opacities in browser** — iterate against screenshots.
8. **Commit checkpoints frequently** so progress is preserved.

---

## Decisions / open questions

### Composition
The central panel and bio stay exactly where they are. The agent + office + leaderboard are framing/decoration that should NOT compete with the central content.

### Agent placement
Two options:
- **A**: Single agent on the "ground" of the intro station, walks/turns to follow cursor across the page.
- **B**: Agent positioned at the bottom-center, only rotates head/body to track cursor.

Defaulting to **A** because it feels more alive. Will fall back to **B** if the walking distracts from the central text.

### 3D scene depth
A 3D Canvas overlaying everything will block clicks on the underlying DOM. Solutions:
- `pointer-events: none` on the canvas wrapper, then hand-wire cursor tracking via window mousemove
- Or: only allow pointer events on specific 3D objects, not the canvas as a whole

Going with `pointer-events: none` for cleanliness — the agent is decoration, not interactive.

---

## Files in this branch

- `src/stations/intro/index.tsx` — existing hero (committed)
- `src/stations/intro/CursorAgent.tsx` — NEW
- `src/stations/intro/EdgeOffice.tsx` — NEW
- `src/stations/intro/LeaderboardPreview.tsx` — NEW
- `src/stations/intro/scene.tsx` — NEW R3F Canvas wrapper
- `src/stations/intro/palette.ts` — NEW adapted color tokens
- `public/office-assets/models/furniture/*.glb` — copied from straw

---

## Notes for morning review

I'll list anything I land on that should be revisited when you wake up — design decisions you should sanity-check, unresolved bugs, things I deliberately scoped out.
