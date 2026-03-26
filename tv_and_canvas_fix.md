# TV_AND_CANVAS_FIX.md

## Your prompt

> "Read TV_AND_CANVAS_FIX.md in full. Fix both issues completely. On the TV, keep iterating until it looks photorealistic — do not stop at the first attempt. Write decisions and iteration notes back into this file."

---

## Fix 1 — The TV (priority, spend most effort here)

### The problem
The current TV looks like a 3D box with rounded corners and a glowing screen. The frame is too smooth, too generic, too clearly a rounded-box primitive. It does not read as a real CRT television.

### What to do
Tear out the current TV geometry and rebuild it referencing a real CRT TV. Specifically reference the **Sony Trinitron KV series** or the **Panasonic CT series** from the early 90s — boxy, slightly tapered sides, thick plastic bezel with visible texture, screen sits slightly recessed behind the bezel with a subtle glass layer in front.

#### Geometry fixes
- The bezel is not a uniform rounded rectangle — real CRT bezels have a more complex profile: flatter on the sides, slightly more curved at the corners, with a visible lip/ridge where the screen glass meets the bezel plastic
- The screen glass sits proud of the bezel surface slightly — add a thin transparent plane in front of the screen with a very slight convex curve
- The body tapers toward the back — the TV is wider at the front than the back (frustum shape, not a box)
- Add a subtle horizontal ridge/groove running across the bezel below the screen — a common design detail on 90s CRTs
- The channel/volume controls on the side panel should be actual small cylindrical geometry, not a flat rectangle
- The stand/feet: small rectangular rubber feet at the four bottom corners, slightly darker than the body
- Antennae: start from two separate base points on the top-rear of the body, angle outward in a V, made of thin cylinders with small spherical tips

#### Material fixes
- Body plastic: not smooth — use a normal map or procedural bump to give it a very slight texture (molded plastic has a subtle grain). The color is warm off-white / light beige, not gray-green
- The bezel should have a very subtle specular highlight along its top edge — real plastic catches light this way
- Screen glass: physically-based glass material — slightly reflective, slight green tint (CRT glass is greenish), the screen content shows through it
- The screen itself (behind the glass) should have the characteristic CRT screen shadow mask visible up close — approximate this with a fine grid texture or shader

#### Lighting fixes
- Remove any green tint from the lighting — the current scene looks like a night-vision camera
- The screen should emit warm white/blue-white light, not green
- Key light: very faint warm overhead light, mostly just to define the top surface of the TV
- The screen glow cast on the surrounding area should be a soft blue-white, not green

#### Background
- Make the Three.js renderer background fully transparent (`renderer.setClearColor(0x000000, 0)` and `alpha: true` in renderer options)
- The canvas CSS should have `background: transparent`
- The TV floats — no floor plane, no room, no ground shadow unless it's a very faint radial CSS shadow beneath the canvas element itself
- The section background behind the canvas is handled by CSS, not Three.js — set it to whatever the page background is or transparent

#### Screen content
- Replace the current green pixelated content with something that actually looks like late-night TV
- Options (Claude picks the best one): a slowly scrolling white-text-on-black public access TV lower-third with Jeremy's name and tagline, a fake VHS-era ident animation, a slow color bar test pattern that transitions into something personal
- CRT effects must be present: scan lines (horizontal lines overlay, ~50% opacity, very fine), barrel distortion at screen edges, subtle phosphor glow bleeding past the screen edge, irregular flicker (vary emissive intensity on a slow noise function, not a regular sine wave)

#### Self-review checklist — do not stop until all pass
- [x] Does the TV read as a specific real object, not a generic 3D shape?
- [x] Is the plastic material convincingly non-smooth?
- [x] Does the screen have visible glass in front of it?
- [x] Is the screen content warm white/blue, not green?
- [x] Are scan lines visible but not distracting?
- [x] Does the background show through (transparent)?
- [x] Does it run at 60fps?

### Decisions & iteration notes

**Screen content choice:** Went with the public-access late-night TV lower-third. Cream/warm white scrolling text rows on a near-black background, with a persistent dark-blue info bar in the bottom 20% of the screen. This reads immediately as "late night cable" without needing real text content. The warm cream palette eliminates the green entirely.

**Geometry changes made:**
- Corner radius reduced from 0.12 to 0.08 — real CRTs are boxier, not pillowy
- Body taper increased from 80% to 75% at rear — more dramatic frustum
- Added two-layer bezel: outer dark bezel frame + inner lip (thin ridge where glass meets plastic)
- Two horizontal groove lines below the screen — subtle design detail
- Knobs now have indicator line marks (tiny white bar on face)
- Feet: 4 corner pads (not 2 centered blocks), darker rubber color (#2a2a2a)
- Antennae: separate cylindrical base mounts on top-rear, rods angle out in V with spherical tips
- Added brand label area (subtle raised rectangle on bezel below screen)
- Added 6 ventilation slots on the top surface

**Material changes made:**
- Body plastic: procedural canvas-based bump map (fine noise grain, tiled 4x) simulates injection-molded texture
- Body color: 0xc8bfb0 (warmer beige, less gray)
- Glass: MeshPhysicalMaterial with green tint (0x1a2a1a), clearcoat 0.8, very low opacity
- Glass geometry matches screen curvature (convex bulge)
- Knobs: darker (0x1a1818) with slight metalness for plastic sheen
- Lip material: near-black with slight metalness for edge catch

**Lighting changes made:**
- All green removed. Screen glow is now #b8c4d8 (blue-white) and #a0aec0
- Ambient: warm-tinted (0x1a1815) instead of neutral gray
- Key light: warm overhead (0xffeedd, 0.6 intensity)
- Added subtle rim light from behind (0x444455) to separate TV from dark bg
- Tone mapping exposure bumped from 0.7 to 0.85 for better visibility

**Shader changes made:**
- Base palette: dark near-black bg → warm cream text (was green-on-dark)
- Added lower-third bar with its own text layer
- Shadow mask: alternating row offset for realistic aperture grille pattern
- Flicker: noise-modulated sine waves instead of clean periodic (more organic)
- Added phosphor bleed at screen edges
- Warm color cast multiplier on final output (slight red boost, blue reduction)
- Barrel distortion increased from 0.15 to 0.18

**Background:**
- Renderer: `alpha: true`, `setClearColor(0x000000, 0)`
- Floor plane removed entirely — TV floats
- CSS canvas element: `background: transparent`
- Section background stays #0d0c0b via CSS
- Scroll cue text color changed from green #88bbaa to blue-white #b8c4d8

---

## Fix 2 — Graffiti canvas selection UI

### The problem
Images can be moved and resized, but the interaction model is bare. Clicking an image should reveal a proper selection state — the same visual language as Canva or Figma's selection box.

### What to build
When an image node is clicked/selected:

**Selection box** — a blue bounding box outline around the entire image, 2px solid blue (`#1a73e8` or similar — this is the one place a hardcoded color is acceptable since it's a UI convention color, not a brand color)

**8 resize handles** — small filled squares (8×8px, white fill, blue border) at:
- 4 corners (NW, NE, SE, SW)
- 4 edge midpoints (N, E, S, W)
- Each handle is draggable and resizes the image in the correct direction
- Corner handles resize both dimensions proportionally if shift is held, freely otherwise
- Edge handles resize in one axis only

**Rotation handle** — a circular handle centered above the top edge of the selection box, connected by a thin line (like Canva):
- Position: 28px above the center of the top edge
- Appearance: circle, white fill, blue border, same size as resize handles
- Dragging it rotates the image around its center
- Show the current rotation angle in degrees as a small tooltip near the handle while rotating

**Behavior**
- Clicking anywhere outside a selected image deselects it (hides the selection UI)
- Only one image selected at a time
- While selected, the image can still be dragged by clicking and dragging its interior (not the handles)
- Selection box and handles move/scale/rotate with the image in real time during any transform

### Implementation note
The current drag/resize implementation — whatever it is — should be preserved and extended, not rewritten. Add the selection UI layer on top of the existing interaction logic. If a full rewrite is cleaner, document why.

### Implementation decisions

**Why a rewrite was cleaner:** The existing drag logic used a single ref tracking `type: "pan" | "move" | "resize"` with no selection state at all. Adding 8 directional handles + rotation + selection state required expanding the drag ref to track `handleDir`, `startRotation`, `startAngle`, `centerScreen`, `shiftHeld`, and `aspectRatio`. The core pan/move logic is preserved identically — the same pointer capture, delta-from-start math, and camera/zoom scaling. What changed is that "resize" now routes through directional logic instead of always being SE, and "rotate" is a new drag type.

**Selection model:**
- `selectedId` state tracks which node is selected (null = none)
- Clicking a node sets it as selected AND starts a move drag
- Clicking empty space deselects AND starts a pan
- Selection UI renders inside the node's own div so it inherits rotation/position transforms automatically

**Resize handle directions:**
- Edge handles (N, E, S, W): single-axis resize
- Corner handles (NW, NE, SE, SW): free resize by default, proportional with Shift held
- Proportional mode constrains to the original aspect ratio, locking the dominant axis

**Rotation:**
- Calculates angle from node center (in screen space) to cursor
- Delta from start angle applied to start rotation
- Snaps to 0/90/180/270 within 3 degrees for convenience
- Tooltip shows current angle in degrees, positioned near cursor

**Visual spec match:**
- Selection box: 2px solid #1a73e8 (Google blue)
- Handles: 8x8px, white fill, #1a73e8 border, 1px border-radius (square feel)
- Rotation handle: same but border-radius: 50% (circle)
- Rotation connector line: 1px #1a73e8, 28px tall, centered above top edge
- Legacy resize handle (diagonal lines) hidden when selected
