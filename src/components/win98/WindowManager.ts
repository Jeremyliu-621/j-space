import { createContext, useContext } from 'react';

export interface WindowState {
  id: string;
  title: string;
  isMinimized: boolean;
  isMaximized: boolean;
  zIndex: number;
  // Position/size stored as CSS strings to support vw/vh/%/px
  top?: string;
  left?: string;
  right?: string;
  bottom?: string;
  width?: string;
  height?: string;
  // Pre-maximize state
  prevTop?: string;
  prevLeft?: string;
  prevWidth?: string;
  prevHeight?: string;
}

export interface WindowManagerContextType {
  windows: WindowState[];
  registerWindow: (id: string, title: string) => void;
  unregisterWindow: (id: string) => void;
  focusWindow: (id: string) => void;
  minimizeWindow: (id: string) => void;
  restoreWindow: (id: string) => void;
  closeWindow: (id: string) => void;
  maximizeWindow: (id: string) => void;
  updateWindowPosition: (id: string, pos: { top?: string; left?: string; right?: string; bottom?: string }) => void;
  updateWindowSize: (id: string, size: { width?: string; height?: string }) => void;
  getNextZIndex: () => number;
}

export const WindowManagerContext = createContext<WindowManagerContextType | null>(null);

export function useWindowManager(): WindowManagerContextType {
  const ctx = useContext(WindowManagerContext);
  if (!ctx) throw new Error('useWindowManager must be used inside WindowManagerProvider');
  return ctx;
}
