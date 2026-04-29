# Intro station — final state

**Branch:** `overnight-cursor-3d` (forked off `straw-station`)
**Worktree:** `C:\Users\jerem\CODE2025\PERSONAL Projects\98-website-overnight`
**Pinned at:** commit `07c18d7`
**Dev server:** `http://localhost:5175/`

---

## Final composition

The intro station's first page now shows:

1. **Floral pattern** background (existing `Backgroundpixels.png`)
2. **Four real straw `LandingArena` instances**, one anchored at each viewport corner with intentional bleed past the edges so each arena reads as glimpsed through a window. Each arena is the actual straw arena — mock agents walking around, doing ping pong, etc.
3. **Centered panel** with the `i'm jeremy / building straw / hackathons for openclaws / bikepacker` bio. Panel sits above the arenas in z-order so its text is unobstructed.
4. **Decorative button strip** under the bio (conference / round table / emoji / ping pong) — same pill-shaped pastel style as straw's home buttons. Currently no-ops; wire to a specific arena's actions if you want them functional.
5. **Leaderboard preview** in the top-right (`straw — live arena` with three mock competition rows).
6. **Archive link** in bottom-right (scrolls to the next station).

Each arena's WebGL canvas is alpha:true with `clearAlpha = 0`, so the floral pattern bleeds through every pixel where the arena's office footprint isn't drawn.

---

## What I copied from straw

The entire `arena-3d/` folder from straw → `src/components/arena-3d/`. ~30 files including:

- `LandingArena.tsx` (added a `hideControls` prop)
- `tuner/TunerScene.tsx` (made canvas alpha-true + clearAlpha 0)
- `core/*` (avatarProfile, constants, geometry, navigation, stations, types, defaultLayout)
- `objects/*` (AgentCharacter, ArenaDoor, EmojiOverlay, FurnitureModel, InteriorWall, PingPongBalls, ProceduralFurniture)
- `scene/OfficeEnvironment.tsx`
- `BWEffects.tsx`, `FollowCamController.tsx`, `useArenaGameLoop.ts`, `useMockArenaAgents.ts`, etc.

GLB furniture models also copied to `public/office-assets/models/furniture/`.

---

## Two bugs that took the longest

1. **`body::before` noise overlay was crushing every WebGL pixel.** The `mix-blend-mode: multiply` overlay at z-index 9999 was multiplying canvas content into invisibility — `alpha:false` opaque clear color showed (R3F renders that), but anything WebGL drew over the cleared back buffer got blended into black. Fix: deleted the rule. The grain is a faint aesthetic detail; not worth the conflict.

2. **R3F leaves `clearAlpha` at 1 even when context `alpha: true`.** Setting `alpha: true` on the GL context attributes is necessary but not sufficient — R3F's renderer init still calls `setClearAlpha(1)` so the back buffer clears opaque black between frames. Fix: explicit `gl.setClearAlpha(0)` in `onCreated` callback in TunerScene's Canvas.

3. **R3F's auto-resize observer doesn't fire on initial mount with our scroll-snap layout.** Likely because of `content-visibility: auto` on sibling stations. Workaround: IntroStation dispatches a `window.resize` event a couple of frames after mount, kicking R3F's `useMeasure` observer.

---

## Files I touched

```
src/stations/intro/
  index.tsx              — composition (4 arenas + panel + buttons + leaderboard)
  LeaderboardPreview.tsx — mock straw arena table, top-right
  palette.ts             — color tokens (kept from earlier work, mostly unused now)

src/components/arena-3d/
  LandingArena.tsx       — added hideControls prop
  tuner/TunerScene.tsx   — alpha:true + setClearAlpha(0)
  ...everything else copied straight from straw

src/styles/global.css    — disabled body::before, panel/archive/leaderboard z-indexes adjusted
src/main.tsx             — StrictMode toggled briefly during R3F debug, restored

public/office-assets/    — straw's GLB furniture models
```

---

## Suggested next steps

- **Wire the button strip to actually do something.** Lift `useTunerAgent` from one of the arenas (e.g. the TL one) up to IntroStation, expose its handlers, and connect each button to `triggerStandup('conference')` / `triggerStandup('round_table')` / `triggerDevAction(idx, 'emoji')` / the ping-pong sender.
- **Top-right arena overlap with the leaderboard.** Either move the leaderboard down a touch or shift the TR arena's bleed.
- **Hidden arena dev controls.** Each LandingArena has its own conference/round-table/etc. controls that we suppress via `hideControls`. If you want them off in straw too, make `hideControls` default `true` (currently `false` to match straw's existing behavior).
- **Performance.** Four R3F canvases × ~15 mock agents each is ~60 agents tick-looping every frame. On a slow laptop this might warm fans. If it does, drop frameloop to `"demand"` on the off-screen-on-load arenas, or reduce mock agent count via straw's `useMockArenaAgents` config.

---

## How to merge into the trunk

```bash
cd "C:\Users\jerem\code2025\PERSONAL Projects\98-website"
git checkout straw-station
git merge overnight-cursor-3d
```

Or onto main:

```bash
git checkout main
git merge overnight-cursor-3d
```
