import { useEffect, useRef, useCallback } from 'react';
import { useWindowManager } from '../WindowManager';
import { useTheme } from '../ThemeProvider';
import { useDraggable } from '../../../lib/hooks/useDraggable';
import { useResizable } from '../../../lib/hooks/useResizable';

interface WindowProps {
  id: string;
  title: string;
  children: React.ReactNode;
  resizable?: boolean;
  className?: string;
  style?: React.CSSProperties;
  showMinimize?: boolean;
  onClose?: () => void;
}

type ResizeDir = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';
const RESIZE_DIRS: ResizeDir[] = ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'];

const RESIZE_CURSOR: Record<ResizeDir, string> = {
  n: 'ns-resize', s: 'ns-resize',
  e: 'ew-resize', w: 'ew-resize',
  ne: 'nesw-resize', sw: 'nesw-resize',
  nw: 'nwse-resize', se: 'nwse-resize',
};

const RESIZE_POS: Record<ResizeDir, React.CSSProperties> = {
  nw: { top: -2, left: -2, width: 8, height: 8 },
  n: { top: -2, left: 8, right: 8, height: 6 },
  ne: { top: -2, right: -2, width: 8, height: 8 },
  w: { top: 8, left: -2, bottom: 8, width: 6 },
  e: { top: 8, right: -2, bottom: 8, width: 6 },
  sw: { bottom: -2, left: -2, width: 8, height: 8 },
  s: { bottom: -2, left: 8, right: 8, height: 6 },
  se: { bottom: -2, right: -2, width: 8, height: 8 },
};

export default function Window({ id, title, children, resizable = false, className = '', style = {}, showMinimize = true, onClose }: WindowProps) {
  const wm = useWindowManager();
  const theme = useTheme();
  const windowRef = useRef<HTMLDivElement>(null);
  const registeredRef = useRef(false);

  // Find this window's state
  const windowState = wm.windows.find(w => w.id === id);

  // Register on mount
  useEffect(() => {
    if (!registeredRef.current) {
      wm.registerWindow(id, title);
      registeredRef.current = true;
    }
    return () => {
      // Don't unregister on unmount — the parent controls lifecycle
    };
  }, [id, title, wm]);

  // Drag
  const { onMouseDown: onDragMouseDown, onTouchStart: onDragTouchStart } = useDraggable(windowRef, {
    constrainTop: 0,
    onDragEnd: (left, top) => {
      wm.updateWindowPosition(id, { top: `${top}px`, left: `${left}px`, right: undefined, bottom: undefined });
    },
  });

  // Resize
  const { onResizeStart } = useResizable(windowRef, {
    onResizeEnd: (rect) => {
      wm.updateWindowPosition(id, { top: `${rect.top}px`, left: `${rect.left}px`, right: undefined, bottom: undefined });
      wm.updateWindowSize(id, { width: `${rect.width}px`, height: `${rect.height}px` });
    },
  });

  const handleFocus = useCallback(() => {
    wm.focusWindow(id);
  }, [id, wm]);

  const handleMinimize = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    wm.minimizeWindow(id);
  }, [id, wm]);

  const handleClose = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (onClose) {
      onClose();
    } else {
      wm.closeWindow(id);
    }
  }, [id, wm, onClose]);

  const handleMaximize = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    wm.maximizeWindow(id);
  }, [id, wm]);

  if (!windowState) return null;
  if (windowState.isMinimized) return null;

  // Build style from window state + props
  const windowStyle: React.CSSProperties = {
    position: 'absolute',
    zIndex: windowState.zIndex,
    ...style,
    // State-managed position/size overrides prop style
    ...(windowState.top != null ? { top: windowState.top } : {}),
    ...(windowState.left != null ? { left: windowState.left } : {}),
    ...(windowState.right != null ? { right: windowState.right } : {}),
    ...(windowState.bottom != null ? { bottom: windowState.bottom } : {}),
    ...(windowState.width != null ? { width: windowState.width } : {}),
    ...(windowState.height != null ? { height: windowState.height } : {}),
  };

  const bodyStyle = theme.getWindowBodyStyle();

  return (
    <div
      ref={windowRef}
      className={`window ${className}`}
      style={windowStyle}
      onMouseDown={handleFocus}
    >
      {/* Title bar */}
      <div
        className="title-bar"
        onMouseDown={onDragMouseDown}
        onTouchStart={onDragTouchStart}
      >
        <div className="title-bar-text">
          {title}
        </div>
        <div className="title-bar-controls">
          {showMinimize && <button aria-label="Minimize" onClick={handleMinimize}></button>}
          <button aria-label="Maximize" onClick={handleMaximize}></button>
          <button aria-label="Close" onClick={handleClose}></button>
        </div>
      </div>

      {/* Window body */}
      <div className="window-body" style={{
        ...bodyStyle,
      }}>
        {children}
      </div>

      {/* Resize handles */}
      {resizable && RESIZE_DIRS.map(dir => (
        <div
          key={dir}
          style={{
            position: 'absolute',
            zIndex: 10,
            cursor: RESIZE_CURSOR[dir],
            ...RESIZE_POS[dir],
          }}
          onMouseDown={(e) => onResizeStart(e, dir)}
        />
      ))}
    </div>
  );
}
