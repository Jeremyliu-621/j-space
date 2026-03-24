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

    const rect = el.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;

    isDragging.current = true;

    const onMouseMove = (me: MouseEvent) => {
      const newLeft = me.clientX - offsetX;
      const newTop = Math.max(options.constrainTop ?? 0, me.clientY - offsetY);
      el.style.left = `${newLeft}px`;
      el.style.top = `${newTop}px`;
      el.style.right = 'auto';
      el.style.bottom = 'auto';
    };

    const onMouseUp = (ue: MouseEvent) => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      isDragging.current = false;

      const newLeft = ue.clientX - offsetX;
      const newTop = Math.max(options.constrainTop ?? 0, ue.clientY - offsetY);
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
    const offsetX = touch.clientX - rect.left;
    const offsetY = touch.clientY - rect.top;

    // Check if touch is in the title bar area (~30px from top)
    if (touch.clientY - rect.top > 30) return;

    e.preventDefault();
    isDragging.current = true;

    const onTouchMove = (me: TouchEvent) => {
      me.preventDefault();
      const t = me.touches[0];
      el.style.left = `${t.clientX - offsetX}px`;
      el.style.top = `${Math.max(options.constrainTop ?? 0, t.clientY - offsetY)}px`;
    };

    const onTouchEnd = (ue: TouchEvent) => {
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('touchend', onTouchEnd);
      document.removeEventListener('touchcancel', onTouchEnd);
      isDragging.current = false;

      const t = ue.changedTouches[0];
      const newLeft = t.clientX - offsetX;
      const newTop = Math.max(options.constrainTop ?? 0, t.clientY - offsetY);
      options.onDragEnd?.(newLeft, newTop);
    };

    document.addEventListener('touchmove', onTouchMove, { passive: false });
    document.addEventListener('touchend', onTouchEnd);
    document.addEventListener('touchcancel', onTouchEnd);
  }, [elementRef, options]);

  return { onMouseDown, onTouchStart, isDragging };
}
