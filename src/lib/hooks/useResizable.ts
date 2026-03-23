import { useCallback } from 'react';

type ResizeDir = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';

interface ResizeOptions {
  onResizeEnd?: (rect: { left: number; top: number; width: number; height: number }) => void;
  minWidth?: number;
  minHeight?: number;
}

const CURSOR_MAP: Record<ResizeDir, string> = {
  n: 'ns-resize', s: 'ns-resize',
  e: 'ew-resize', w: 'ew-resize',
  ne: 'nesw-resize', sw: 'nesw-resize',
  nw: 'nwse-resize', se: 'nwse-resize',
};

export function useResizable(elementRef: React.RefObject<HTMLElement | null>, options: ResizeOptions = {}) {
  const minW = options.minWidth ?? 200;
  const minH = options.minHeight ?? 150;

  const onResizeStart = useCallback((e: React.MouseEvent, dir: ResizeDir) => {
    e.preventDefault();
    e.stopPropagation();

    const el = elementRef.current;
    if (!el) return;

    const startRect = el.getBoundingClientRect();
    const startX = e.clientX;
    const startY = e.clientY;

    // Create ghost
    const ghost = document.createElement('div');
    ghost.style.cssText = `
      position: fixed; width: ${startRect.width}px; height: ${startRect.height}px;
      left: ${startRect.left}px; top: ${startRect.top}px;
      border: 2px solid white; mix-blend-mode: difference;
      z-index: 99999; pointer-events: none; box-sizing: border-box;
    `;
    document.body.appendChild(ghost);

    // Create overlay for cursor
    const overlay = document.createElement('div');
    overlay.style.cssText = `position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: 99998; cursor: ${CURSOR_MAP[dir]};`;
    document.body.appendChild(overlay);

    const calc = (dx: number, dy: number) => {
      let w = startRect.width, h = startRect.height, l = startRect.left, t = startRect.top;

      if (dir.includes('e')) w = Math.max(minW, startRect.width + dx);
      if (dir.includes('w')) { w = Math.max(minW, startRect.width - dx); l = startRect.left + (startRect.width - w); }
      if (dir.includes('s')) h = Math.max(minH, startRect.height + dy);
      if (dir.includes('n')) { h = Math.max(minH, startRect.height - dy); t = startRect.top + (startRect.height - h); }

      return { width: w, height: h, left: l, top: t };
    };

    const onMouseMove = (me: MouseEvent) => {
      const r = calc(me.clientX - startX, me.clientY - startY);
      Object.assign(ghost.style, { width: `${r.width}px`, height: `${r.height}px`, left: `${r.left}px`, top: `${r.top}px` });
    };

    const onMouseUp = (ue: MouseEvent) => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      ghost.remove();
      overlay.remove();

      const r = calc(ue.clientX - startX, ue.clientY - startY);
      options.onResizeEnd?.(r);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }, [elementRef, minW, minH, options]);

  return { onResizeStart };
}
