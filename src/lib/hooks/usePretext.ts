import { useMemo } from 'react';
import {
  prepareWithSegments,
  layout,
  layoutWithLines,
  measureNaturalWidth,
  type PreparedTextWithSegments,
  type LayoutResult,
  type LayoutLine,
} from '@chenglou/pretext';

interface PretextResult {
  /** The cached prepared text object — pass to other pretext functions. */
  prepared: PreparedTextWithSegments;
  /** Height in px and number of lines at the current width. */
  layout: LayoutResult;
  /** Full line-by-line breakdown (text content + width per line). */
  lines: LayoutLine[];
  /** The intrinsic width of the text with no line breaks. */
  naturalWidth: number;
}

/**
 * React hook for pretext text measurement.
 *
 * Prepares text once (memoized by text + font), then recomputes layout
 * whenever maxWidth or lineHeight changes — layout is pure arithmetic
 * so this is effectively free on re-render.
 *
 * ```tsx
 * const { layout, lines } = usePretext('Hello world', '16px Inter', 320, 24);
 * // layout.height, layout.lineCount, lines[0].text, etc.
 * ```
 */
export function usePretext(
  text: string,
  font: string,
  maxWidth: number,
  lineHeight: number,
): PretextResult {
  const prepared = useMemo(
    () => prepareWithSegments(text, font),
    [text, font],
  );

  return useMemo(() => {
    const layoutResult = layout(prepared, maxWidth, lineHeight);
    const { lines } = layoutWithLines(prepared, maxWidth, lineHeight);
    const naturalWidth = measureNaturalWidth(prepared);

    return { prepared, layout: layoutResult, lines, naturalWidth };
  }, [prepared, maxWidth, lineHeight]);
}
