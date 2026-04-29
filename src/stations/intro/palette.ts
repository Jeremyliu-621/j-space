/**
 * Color tokens for the intro station — adapted from straw's pastel-on-white
 * palette to read on our pale blue-grey floral background.
 *
 * Strategy: desaturate straw's pastels by ~30% and shift warm tones cooler
 * so they sit on our `#cfd6df` panel without clashing.
 */

// Background / panel base — same as `.intro-panel` background-color
export const PANEL_COLOR = '#cfd6df';

// Slightly lighter than panel, used as the "tint target" for BW-style
// material lerping (our equivalent of straw's pure-white tint target).
export const TINT_TARGET = '#dde2e8';

// Slightly softer than pure black for outlines — pure black on a pale panel
// is too harsh.
export const OUTLINE_COLOR = '#0e1218';

// Adapted accents (the "4-color pastel palette")
export const ACCENT = {
  blue: '#c2cfdc',     // was straw's #cfd5e8
  taupe: '#cfc7c0',    // was straw's #e0d6d0
  rose: '#d8c2bc',     // was straw's #ecd0cc
  sage: '#bfc8c1',     // was straw's #d0d7d1
} as const;

// Status colors (for leaderboard preview pills) — desaturated versions
// of straw's green/amber/gray.
export const STATUS = {
  liveBg: '#cdddc8',
  liveText: '#3a5a37',
  evalBg: '#e0d4b8',
  evalText: '#6a5320',
  closedBg: '#d4d4d4',
  closedText: '#525252',
} as const;

// Curated subsets of the agent profile palette — biased toward the cooler /
// less-saturated options so the character mixes with our cool blue-grey panel.
// (Keep the warm skin tones — those still read as skin.)
export const AGENT_SKIN_TONES = [
  '#f7d7c2', // fair
  '#f4c58a', // light
  '#d8a06e', // warm
  '#b7794e', // tan
  '#8a5a3b', // deep
  '#5d3a24', // rich
] as const;

export const AGENT_HAIR_COLORS = [
  '#151515',
  '#3e2723',
  '#6b4f3a',
  '#7b341e',
  '#d6b56c',
] as const;

export const AGENT_TOP_COLORS = [
  '#2d3748',  // graphite
  '#64748b',  // slate
  '#7090ff',  // sky (only saturated one — for visual interest)
  '#5a6470',  // mid-slate (cool, our addition)
  '#8a93a0',  // light slate (cool, our addition)
] as const;

export const AGENT_BOTTOM_COLORS = [
  '#2d3748',  // graphite
  '#3a4456',  // deeper slate
  '#1a1f2c',  // near-black
] as const;

export const AGENT_SHOE_COLORS = [
  '#1a1a1a',
  '#1e3a8a',
  '#7c4a2d',
  '#e5e7eb',
] as const;

// Furniture tint colors for the edge-office decoration. Lower saturation
// versions of straw's tints — we want the office elements to feel
// atmospheric, not loud.
export const FURNITURE_TINT = {
  desk: '#9c8b6e',
  chair: '#5a6270',
  computer: '#454c66',
  plant: null as string | null,  // keep original GLB material colors
  lamp: '#b8a07c',
  bookshelf: '#6b4d36',
} as const;

// Hash a string into a deterministic int (FNV-1a). Used to pick a stable
// avatar profile for a given seed, mirroring straw's avatarProfile.ts.
export function hashSeed(seed: string): number {
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function pick<T>(values: readonly T[], index: number): T {
  return values[index % values.length];
}
