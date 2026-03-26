# TV_HERO.md — CRT TV Hero Section

## Where this lives

This is the very first thing a visitor sees — a full-viewport section that sits **above** the Win98 desktop in the scroll flow. The user scrolls down from this section to reach the Win98 desktop.

---

## The concept

A photorealistic 3D CRT television — the kind from the late 80s/early 90s, boxy, thick bezel, slightly rounded screen with CRT screen curvature — centered on a dark background. The TV is on. Something is playing on it. The room around the TV is dark and minimal — the TV is the only light source.

This is the intro. It sets the tone for the whole site before the user even reaches the Win98 desktop.

---

## The TV — 3D implementation

Build with Three.js. This must look photorealistic — not stylized, not low-poly, not cartoon.

### Geometry
- Body: a rounded rectangular box, thick depth (CRT TVs are deep), slightly tapered toward the back
- Screen: slightly inset into the bezel, with a gentle convex curve (the characteristic CRT bulge) — approximate this with a curved plane or a slightly inflated quad
- Bezel: thick, plastic — the screen is surrounded by 3–4cm of bezel on all sides. The bezel corners are more rounded than the body
- Legs/stand: small, stubby plastic feet at the bottom corners — or a small rectangular stand
- Details: a power button (small cylinder), a volume knob (small cylinder), possibly a channel dial — these don't need to function, just exist as geometry
- Antenna: two rabbit ear antennae extending from the top back, at a slight V angle (thin cylinders)

### Materials
- Body: matte plastic — warm gray or off-white (classic CRT color), slight surface imperfection — not perfectly smooth
- Screen glass: slightly reflective, the screen content shows through it with a faint glass tint and the characteristic CRT screen curvature distortion at edges
- Buttons/knobs: slightly darker plastic than the body
- All materials should respond to lighting — this is what makes it look real

### Lighting
- The room is dark — ambient light very low
- The TV screen is a light source — it emits a soft, flickering blue-white glow onto the surfaces around it and onto the TV body itself
- One very faint overhead fill light — barely there, just enough to define the top of the TV body
- No other lights — the TV is the room

### Screen content
Claude decides what plays on the screen. It should be:
- Relevant to Jeremy — not generic static or a test pattern (though a brief static/scan-line intro before the content loads is great)
- Looping
- Options to consider: a generative animation that feels like late-night public access TV, a slowly scrolling text feed of Jeremy's name / interests / stack, a fake news ticker, an abstract CRT-era screensaver pattern, a glitchy ident
- The screen should have CRT visual effects: scan lines, slight barrel distortion at edges, a subtle phosphor glow, occasional very subtle flicker
- Implement scan lines as a full-screen overlay shader or CSS overlay on the screen plane

### Animation
- The TV itself: very subtle idle animation — an almost imperceptible slow bob (0.5% scale), as if there's a very faint hum
- The screen glow: flickering — not obvious flicker, but a very subtle irregular brightness variation (like a real CRT)
- Antennae: static

---

## The room / background

- Near-black background — not pure black, a very dark warm gray or near-black
- The TV's screen light should cast a visible soft pool of light on the "floor" below and in front of the TV — fake this with a radial gradient plane or a Three.js point light attached to the screen
- No other objects in the room — the TV is alone
- Optional: very faint, barely-visible floor reflection of the TV (a very low opacity flipped/blurred copy of the TV below the ground plane)

---

## Scroll cue

At the bottom of this section, a minimal cue to scroll down — something that feels native to the TV aesthetic. Ideas: a small animated channel-change icon, a blinking cursor, a "↓" in a CRT font. Claude decides the exact form. It should not be a generic scroll arrow.

---

## Performance

Three.js scene must not destroy frame rate. Optimize:
- Keep geometry polygon count reasonable — photorealism comes from materials and lighting, not polygon density
- Use `requestAnimationFrame` properly
- The scene should run at 60fps on a modern laptop

---

## What not to do

- Do not make the TV low-poly or stylized — it must read as photorealistic
- Do not fill the room with other objects or decorations
- Do not make the screen content distracting or busy — it should feel like something you'd stumble on at 2am
- Do not add text overlays on top of the 3D scene (Jeremy's name, tagline, etc.) — the TV speaks for itself
- Do not use a pre-made Three.js CRT shader package — build the effects from scratch or use minimal raw Three.js
