import React, { useState, useCallback, useRef } from 'react';
import { WindowManagerContext, type WindowState, type WindowManagerContextType } from './WindowManager';

export function WindowManagerProvider({ children }: { children: React.ReactNode }) {
  const [windows, setWindows] = useState<WindowState[]>([]);
  const zIndexCounter = useRef(10);

  const getNextZIndex = useCallback(() => {
    zIndexCounter.current += 1;
    return zIndexCounter.current;
  }, []);

  const registerWindow = useCallback((id: string, title: string) => {
    setWindows(prev => {
      if (prev.find(w => w.id === id)) return prev;
      return [...prev, {
        id,
        title,
        isMinimized: false,
        isMaximized: false,
        zIndex: zIndexCounter.current++,
      }];
    });
  }, []);

  const unregisterWindow = useCallback((id: string) => {
    setWindows(prev => prev.filter(w => w.id !== id));
  }, []);

  const focusWindow = useCallback((id: string) => {
    setWindows(prev => {
      const nextZ = zIndexCounter.current++;
      return prev.map(w =>
        w.id === id ? { ...w, zIndex: nextZ, isMinimized: false } : w
      );
    });
  }, []);

  const minimizeWindow = useCallback((id: string) => {
    setWindows(prev =>
      prev.map(w => w.id === id ? { ...w, isMinimized: true } : w)
    );
  }, []);

  const restoreWindow = useCallback((id: string) => {
    setWindows(prev => {
      const nextZ = zIndexCounter.current++;
      return prev.map(w =>
        w.id === id ? { ...w, isMinimized: false, zIndex: nextZ } : w
      );
    });
  }, []);

  const closeWindow = useCallback((id: string) => {
    setWindows(prev => prev.filter(w => w.id !== id));
  }, []);

  const maximizeWindow = useCallback((id: string) => {
    setWindows(prev =>
      prev.map(w => {
        if (w.id !== id) return w;
        if (w.isMaximized) {
          return {
            ...w,
            isMaximized: false,
            top: w.prevTop,
            left: w.prevLeft,
            right: undefined,
            bottom: undefined,
            width: w.prevWidth,
            height: w.prevHeight,
          };
        }
        return {
          ...w,
          isMaximized: true,
          prevTop: w.top,
          prevLeft: w.left,
          prevWidth: w.width,
          prevHeight: w.height,
          top: '4px',
          left: '4px',
          right: '4px',
          bottom: '4px',
          width: undefined,
          height: undefined,
        };
      })
    );
  }, []);

  const updateWindowPosition = useCallback((id: string, pos: { top?: string; left?: string; right?: string; bottom?: string }) => {
    setWindows(prev =>
      prev.map(w => w.id === id ? { ...w, ...pos } : w)
    );
  }, []);

  const updateWindowSize = useCallback((id: string, size: { width?: string; height?: string }) => {
    setWindows(prev =>
      prev.map(w => w.id === id ? { ...w, ...size } : w)
    );
  }, []);

  const value: WindowManagerContextType = {
    windows,
    registerWindow,
    unregisterWindow,
    focusWindow,
    minimizeWindow,
    restoreWindow,
    closeWindow,
    maximizeWindow,
    updateWindowPosition,
    updateWindowSize,
    getNextZIndex,
  };

  return (
    <WindowManagerContext.Provider value={value}>
      {children}
    </WindowManagerContext.Provider>
  );
}
