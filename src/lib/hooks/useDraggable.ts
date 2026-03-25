import { useCallback, useRef } from 'react';

interface DragOptions {
  onDragEnd?: (left: number, top: number) => void;
  constrainTop?: number; // minimum top value
}

export function useDraggable(elementRef: React.RefObject<HTMLElement | null>, options: DragOptions = {}) {
  const isDragging = useRef(false);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    // Only drag from title bar area (caller should attach this to title bar)
    if ((e.target as HTMLElement).tagName === 'BUTTON') return;
    e.preventDefault();

    const el = elementRef.current;
    if (!el) return;

    const startLeft = el.offsetLeft;
    const startTop = el.offsetTop;
    const startX = e.clientX;
    const startY = e.clientY;

    isDragging.current = true;

    // Overlay to lock move cursor during drag
    const overlay = document.createElement('div');
    overlay.style.cssText = `position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: 99998; cursor: url('/cursors/move.svg') 16 16, move;`;
    document.body.appendChild(overlay);

    const onMouseMove = (me: MouseEvent) => {
      const newLeft = startLeft + (me.clientX - startX);
      const newTop = Math.max(options.constrainTop ?? 0, startTop + (me.clientY - startY));
      el.style.left = `${newLeft}px`;
      el.style.top = `${newTop}px`;
      el.style.right = 'auto';
      el.style.bottom = 'auto';
    };

    const onMouseUp = (ue: MouseEvent) => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      overlay.remove();
      isDragging.current = false;

      const newLeft = startLeft + (ue.clientX - startX);
      const newTop = Math.max(options.constrainTop ?? 0, startTop + (ue.clientY - startY));
      options.onDragEnd?.(newLeft, newTop);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }, [elementRef, options]);

  // Touch support
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if ((e.target as HTMLElement).tagName === 'BUTTON') return;

    const el = elementRef.current;
    if (!el) return;

    const touch = e.touches[0];
    const rect = el.getBoundingClientRect();

    // Check if touch is in the title bar area (~30px from top)
    if (touch.clientY - rect.top > 30) return;

    const startLeft = el.offsetLeft;
    const startTop = el.offsetTop;
    const startX = touch.clientX;
    const startY = touch.clientY;

    e.preventDefault();
    isDragging.current = true;

    const onTouchMove = (me: TouchEvent) => {
      me.preventDefault();
      const t = me.touches[0];
      el.style.left = `${startLeft + (t.clientX - startX)}px`;
      el.style.top = `${Math.max(options.constrainTop ?? 0, startTop + (t.clientY - startY))}px`;
    };

    const onTouchEnd = (ue: TouchEvent) => {
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('touchend', onTouchEnd);
      document.removeEventListener('touchcancel', onTouchEnd);
      isDragging.current = false;

      const t = ue.changedTouches[0];
      const newLeft = startLeft + (t.clientX - startX);
      const newTop = Math.max(options.constrainTop ?? 0, startTop + (t.clientY - startY));
      options.onDragEnd?.(newLeft, newTop);
    };

    document.addEventListener('touchmove', onTouchMove, { passive: false });
    document.addEventListener('touchend', onTouchEnd);
    document.addEventListener('touchcancel', onTouchEnd);
  }, [elementRef, options]);

  return { onMouseDown, onTouchStart, isDragging };
}
