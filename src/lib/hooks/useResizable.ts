import { useCallback } from 'react';

type ResizeDir = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';

interface ResizeOptions {
  onResizeEnd?: (rect: { left: number; top: number; width: number; height: number }) => void;
  minWidth?: number;
  minHeight?: number;
}

const CURSOR_MAP: Record<ResizeDir, string> = {
  n: `url('/cursors/ns-resize.svg') 6 16, ns-resize`,
  s: `url('/cursors/ns-resize.svg') 6 16, ns-resize`,
  e: `url('/cursors/ew-resize.svg') 16 6, ew-resize`,
  w: `url('/cursors/ew-resize.svg') 16 6, ew-resize`,
  ne: `url('/cursors/nesw-resize.svg') 16 16, nesw-resize`,
  sw: `url('/cursors/nesw-resize.svg') 16 16, nesw-resize`,
  nw: `url('/cursors/nwse-resize.svg') 16 16, nwse-resize`,
  se: `url('/cursors/nwse-resize.svg') 16 16, nwse-resize`,
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

    // Overlay to lock cursor during resize
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
      el.style.width = `${r.width}px`;
      el.style.height = `${r.height}px`;
      el.style.left = `${r.left}px`;
      el.style.top = `${r.top}px`;
      el.style.right = 'auto';
      el.style.bottom = 'auto';
    };

    const onMouseUp = (ue: MouseEvent) => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      overlay.remove();

      const r = calc(ue.clientX - startX, ue.clientY - startY);
      options.onResizeEnd?.(r);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }, [elementRef, minW, minH, options]);

  return { onResizeStart };
}
