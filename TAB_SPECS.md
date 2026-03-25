# TAB_SPECS.md — Four Tab Specs

## Tab 1: Graffiti.exe — Infinite Canvas

### The concept
A Figma-like infinite canvas where graffiti pieces live as draggable, resizable image nodes scattered across a large 2D space. The user can pan around the canvas, drag pieces to reposition them, and resize them. It should feel like a messy digital wall — not a gallery, not a grid. Pieces overlap, vary in size, sit at slight angles.

### Implementation
- The canvas is larger than the viewport — the user can pan by clicking and dragging the background
- Each image node is independently draggable and resizable (resize handle at bottom-right corner)
- Nodes can be brought to front on click (z-index)
- Initial layout: pieces scattered at varied positions, sizes, and rotations (slight — max ±8deg) — not random noise, but considered placement that feels like a real wall
- A subtle grid or dot-pattern background on the canvas (like Figma's canvas) using theme colors
- Zoom in/out with scroll wheel (min 0.4x, max 2x)
- All images are placeholders for now — each node should show a clearly labeled placeholder: `[IMAGE: piece name / location / year]` with a light background that suggests a photo would go here
- Minimum 6 image nodes on the canvas
- A small HUD in the corner: zoom level indicator, a "reset view" button — styled minimally, using theme colors

### Feel
Tactile. Like actually moving things around. Snap-to-nothing — free movement only. The slight rotation on pieces is key — it should feel hand-placed, not auto-arranged.

---

## Tab 2: BJJ.exe — Fight Tape

### The concept
A fake "fight tape" review interface. Feels like coaching software or a scouting tool. Left side: a large video placeholder (labeled `[VIDEO: competition / training footage]`) styled like a video player with scrubber, play/pause, timestamp. Right side: a vertical feed of timestamped "notes" — like a coach's annotations on the tape.

### Implementation
- Left panel (~60% width): video player UI — play/pause button, progress scrubber (draggable), timestamp display (`0:00 / 0:00`), fullscreen button — all functional as UI even though the video is a placeholder
- The scrubber should actually be draggable and update the timestamp display
- Right panel (~40% width): scrollable feed of timestamped annotation cards
  - Each card has a timestamp (e.g. `0:23`), a move label (e.g. `[PLACEHOLDER: move name]`), and a short note (`[PLACEHOLDER: coaching note]`)
  - Cards highlight when "active" — tie the active card to scrubber position ranges (fake, hardcoded ranges are fine)
  - Clicking a card jumps the scrubber to that timestamp
- At least 8 annotation cards
- The whole interface should feel sparse and functional — like actual sports software, not a portfolio piece pretending to be sports software

### Feel
Utilitarian. Monospace or semi-monospace type for timestamps and labels. High contrast. Like something you'd use in a dark room before a match.

---

## Tab 3: Art.exe — 3D Object Room

### The concept
An interactive Three.js scene — a sparse, dark room with a few 3D objects floating or resting in it. Each object represents something from Jeremy's art interests — abstract sculptural forms, not literal objects. The user can orbit around the scene with mouse drag. Clicking an object reveals a label/note about it.

### Implementation
- Three.js scene, perspective camera, orbit controls (mouse drag to rotate, scroll to zoom)
- The room: a dark environment — think gallery at night. A floor plane, maybe faint ambient light + one or two point lights casting shadows
- 3 to 5 objects in the scene — these should be genuinely interesting 3D shapes, not default cube/sphere/cylinder:
  - Consider: a twisted torus knot, a low-poly abstract mesh, a Möbius strip-like surface, a geodesic form, a crumpled plane
  - Objects should be still by default but subtly animated — very slow rotation, or a gentle float (sine wave Y position)
- Materials: matte, no shine — think matte black, warm gray, off-white. No metallic/glossy PBR. Colors from theme palette where possible
- On hover: object gets a subtle highlight (emissive tint)
- On click: a floating label appears near the object with placeholder text `[PLACEHOLDER: artwork / artist / note]` — styled as a minimal annotation, not a tooltip
- Lighting: one warm key light, one cool fill light, ambient low — dramatic but not theatrical
- The scene should feel like it could be a real art installation, not a Three.js demo

### Feel
Quiet. Considered. The user discovers it by interacting — it doesn't announce itself. No instructions text. No UI chrome. Just the scene.

---

## Tab 4: Yohji.exe — The Lookbook

### The concept
A vertical editorial lookbook — but not a standard image scroll. The layout uses overlapping full-bleed image zones, large typographic interruptions, and deliberate whitespace. Think a high-fashion editorial printed on newsprint. Black background, white/off-white type, images that bleed to the edge of the content area.

### Implementation
- Vertical scroll within the tab
- Layout alternates between:
  - Full-bleed image placeholder (labeled `[IMAGE: look / piece / season]`) edge-to-edge, no padding
  - Typographic sections: large, sparse text — one of the five words/phrases: `ANTI-MAINSTREAM`, `DECONSTRUCTION`, `WABI-SABI`, `DARKNESS`, `INTENTIONALITY` — displayed huge, sometimes cropped at the edge, sometimes offset
  - Split sections: image left, text right — or image right, text left — but with intentional asymmetry (60/40, not 50/50)
- At least 5 image placeholders and all 5 typographic words used
- Typography: find or use a condensed serif or grotesque that feels editorial — not the Win98 pixel font for this tab
- No cards. No borders around images. Images and type share the same plane
- Scroll behavior: standard scroll within the content area
- Background: near-black, not pure black

### Feel
Cold. Deliberate. Every element placed with intention. If it looks like a portfolio page, it's wrong — it should look like a magazine spread.
