import { useEffect, useState } from 'react';
import { useWindowManager } from '../WindowManager';
import { useTheme } from '../ThemeProvider';

interface TaskbarProps {
  onStartClick: () => void;
  startMenuOpen: boolean;
}

export default function Taskbar({ onStartClick, startMenuOpen }: TaskbarProps) {
  const wm = useWindowManager();
  const theme = useTheme();
  const [time, setTime] = useState('');

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes().toString().padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours % 12 || 12;
      setTime(`${displayHours}:${minutes} ${ampm}`);
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  const buttonStyle = theme.getButtonStyle();

  return (
    <div style={{
      position: 'absolute',
      bottom: 0, left: 0, right: 0,
      height: 28,
      zIndex: 10000,
      background: '#c0c0c0',
      borderTop: '2px solid #ffffff',
      display: 'flex',
      alignItems: 'center',
      padding: '2px',
      gap: '2px',
    }}>
      {/* Start button */}
      <button
        className={startMenuOpen ? 'active' : ''}
        onClick={onStartClick}
        style={{
          height: 22,
          padding: '0 8px',
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          minWidth: 'auto',
          flexShrink: 0,
          ...(startMenuOpen ? {
            boxShadow: 'inset -1px -1px #ffffff, inset 1px 1px #0a0a0a, inset -2px -2px #dfdfdf, inset 2px 2px #808080',
          } : {}),
        }}
      >
        <span style={{ fontSize: 11 }}>Start</span>
      </button>

      {/* Task buttons */}
      <div style={{ display: 'flex', gap: 2, flex: 1, overflowX: 'auto', overflowY: 'hidden' }}>
        {wm.windows.map(w => (
          <button
            key={w.id}
            onClick={() => {
              if (w.isMinimized) {
                wm.restoreWindow(w.id);
              } else {
                wm.focusWindow(w.id);
              }
            }}
            style={{
              height: 22,
              minWidth: 120,
              maxWidth: 160,
              padding: '0 8px',
              fontSize: 11,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              textAlign: 'left',
              flexShrink: 0,
              fontStyle: w.isMinimized ? 'italic' : 'normal',
              ...buttonStyle,
            }}
          >
            {w.title}
          </button>
        ))}
      </div>

      {/* System tray */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        padding: '0 4px',
        borderLeft: '1px solid #808080',
        borderTop: '1px solid #808080',
        borderRight: '1px solid #ffffff',
        borderBottom: '1px solid #ffffff',
        height: 18,
        flexShrink: 0,
      }}>
        <span style={{ fontSize: 11, padding: '0 4px' }}>{time}</span>
      </div>
    </div>
  );
}
