/**
 * Thin wrapper around @chenglou/pretext for text measurement and canvas rendering.
 *
 * Pretext measures text via canvas and caches segment widths, so all subsequent
 * layout calls are pure arithmetic (~0.0002ms). This module exposes the parts of
 * the API most relevant to this project — primarily canvas text rendering and
 * variable-width line layout for the graffiti station.
 *
 * @see https://github.com/chenglou/pretext
 */

import {
  prepare,
  prepareWithSegments,
  layout,
  layoutWithLines,
  layoutNextLineRange,
  materializeLineRange,
  measureNaturalWidth,
  clearCache,
  type PreparedText,
  type PreparedTextWithSegments,
  type LayoutResult,
  type LayoutLine,
  type LayoutCursor,
} from '@chenglou/pretext';

// Re-export core types for consumers
export type { PreparedText, PreparedTextWithSegments, LayoutResult, LayoutLine, LayoutCursor };

// ---------------------------------------------------------------------------
// Basic measurement
// ---------------------------------------------------------------------------

/** Prepare text for layout. One-time cost (~10-20ms), cached internally. */
export { prepare, prepareWithSegments, clearCache };

/** Get height and line count for text at a given width. */
export { layout };

/** Get full line-by-line breakdown (text + width per line). */
export { layoutWithLines };

/** Get the intrinsic width of text with no line breaks. */
export { measureNaturalWidth };

// ---------------------------------------------------------------------------
// Variable-width line iteration (for text flowing around obstacles)
// ---------------------------------------------------------------------------

/**
 * Walk through text one line at a time, allowing a different maxWidth per line.
 * This is the key API for the graffiti station — text flowing around shapes,
 * images, or irregular containers.
 *
 * Example: rendering text on canvas that wraps around a painted shape
 * ```ts
 * const prepared = prepareWithSegments(text, '24px "Jersey 10"');
 * const lines = layoutVariableWidth(prepared, (y) => {
 *   // Narrower width where the shape is
 *   if (y > 100 && y < 300) return 400;
 *   return 600;
 * }, 32);
 * ```
 */
export function layoutVariableWidth(
  prepared: PreparedTextWithSegments,
  getWidthAtY: (y: number) => number,
  lineHeight: number,
): Array<LayoutLine & { y: number }> {
  const lines: Array<LayoutLine & { y: number }> = [];
  let cursor: LayoutCursor = { segmentIndex: 0, graphemeIndex: 0 };
  let y = 0;

  while (true) {
    const maxWidth = getWidthAtY(y);
    const range = layoutNextLineRange(prepared, cursor, maxWidth);
    if (range === null) break;

    const line = materializeLineRange(prepared, range);
    lines.push({ ...line, y });

    cursor = range.end;
    y += lineHeight;
  }

  return lines;
}

// ---------------------------------------------------------------------------
// Canvas rendering helper
// ---------------------------------------------------------------------------

/**
 * Render prepared text onto a canvas context. Handles line wrapping at maxWidth
 * and positions each line at the correct y offset.
 *
 * Returns the total height consumed.
 */
export function renderToCanvas(
  ctx: CanvasRenderingContext2D,
  prepared: PreparedTextWithSegments,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
): number {
  const { lines } = layoutWithLines(prepared, maxWidth, lineHeight);

  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i].text, x, y + i * lineHeight);
  }

  return lines.length * lineHeight;
}

/**
 * Render text with variable line widths onto a canvas. Uses a callback to
 * determine the available width at each y position — for text flowing around
 * obstacles, irregular containers, etc.
 *
 * Returns the total height consumed.
 */
export function renderToCanvasVariableWidth(
  ctx: CanvasRenderingContext2D,
  prepared: PreparedTextWithSegments,
  x: number,
  startY: number,
  getWidthAtY: (y: number) => number,
  lineHeight: number,
): number {
  const lines = layoutVariableWidth(prepared, getWidthAtY, lineHeight);

  for (const line of lines) {
    ctx.fillText(line.text, x, startY + line.y);
  }

  return lines.length > 0 ? lines[lines.length - 1].y + lineHeight : 0;
}
