import { useCallback, useRef } from 'react';

interface DragOptions {
  onDragEnd?: (left: number, top: number) => void;
  constrainTop?: number; // minimum top value
}

/**
 * During drag we mutate `transform: translate3d(...)` instead of left/top so the
 * browser can move the element on its existing GPU layer without repainting it
 * or anything composited above it (e.g. the noise overlay or sibling windows).
 * On release we commit the final left/top inline before clearing transform so
 * there's no flicker before React reconciles the new position.
 */
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
    const constrainTop = options.constrainTop ?? 0;
    const minDy = constrainTop - startTop;

    isDragging.current = true;

    // Overlay to lock move cursor during drag
    const overlay = document.createElement('div');
    overlay.style.cssText = `position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: 99998; cursor: url('/cursors/move.svg') 16 16, move;`;
    document.body.appendChild(overlay);

    const onMouseMove = (me: MouseEvent) => {
      const dx = me.clientX - startX;
      const dy = Math.max(minDy, me.clientY - startY);
      el.style.transform = `translate3d(${dx}px, ${dy}px, 0)`;
    };

    const commit = (clientX: number, clientY: number) => {
      const dx = clientX - startX;
      const dy = Math.max(minDy, clientY - startY);
      const newLeft = startLeft + dx;
      const newTop = startTop + dy;
      // Apply final left/top inline first so the element stays put when we drop transform.
      el.style.left = `${newLeft}px`;
      el.style.top = `${newTop}px`;
      el.style.right = 'auto';
      el.style.bottom = 'auto';
      el.style.transform = '';
      return { newLeft, newTop };
    };

    const onMouseUp = (ue: MouseEvent) => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      overlay.remove();
      isDragging.current = false;

      const { newLeft, newTop } = commit(ue.clientX, ue.clientY);
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
    const constrainTop = options.constrainTop ?? 0;
    const minDy = constrainTop - startTop;

    e.preventDefault();
    isDragging.current = true;

    const onTouchMove = (me: TouchEvent) => {
      me.preventDefault();
      const t = me.touches[0];
      const dx = t.clientX - startX;
      const dy = Math.max(minDy, t.clientY - startY);
      el.style.transform = `translate3d(${dx}px, ${dy}px, 0)`;
    };

    const onTouchEnd = (ue: TouchEvent) => {
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('touchend', onTouchEnd);
      document.removeEventListener('touchcancel', onTouchEnd);
      isDragging.current = false;

      const t = ue.changedTouches[0];
      const dx = t.clientX - startX;
      const dy = Math.max(minDy, t.clientY - startY);
      const newLeft = startLeft + dx;
      const newTop = startTop + dy;
      el.style.left = `${newLeft}px`;
      el.style.top = `${newTop}px`;
      el.style.right = 'auto';
      el.style.bottom = 'auto';
      el.style.transform = '';
      options.onDragEnd?.(newLeft, newTop);
    };

    document.addEventListener('touchmove', onTouchMove, { passive: false });
    document.addEventListener('touchend', onTouchEnd);
    document.addEventListener('touchcancel', onTouchEnd);
  }, [elementRef, options]);

  return { onMouseDown, onTouchStart, isDragging };
}
