import { useEffect, useState, useCallback } from 'react';
import { useWindowManager } from '../WindowManager';
import { useTheme } from '../ThemeProvider';

// Win98-era confetti colors: classic system palette
const WIN98_COLORS = ['#000080', '#008080', '#800080', '#808000', '#c0c0c0', '#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff'];
// Shapes: tiny rectangles, squares, and lines — like old screensaver debris
const CONFETTI_SHAPES = ['rect', 'square', 'line'] as const;

function spawnConfetti(x: number, y: number) {
  const count = 18 + Math.floor(Math.random() * 10);
  const container = document.createElement('div');
  container.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:99999;overflow:hidden';
  document.body.appendChild(container);

  for (let i = 0; i < count; i++) {
    const el = document.createElement('div');
    const color = WIN98_COLORS[Math.floor(Math.random() * WIN98_COLORS.length)];
    const shape = CONFETTI_SHAPES[Math.floor(Math.random() * CONFETTI_SHAPES.length)];
    const angle = (Math.random() * Math.PI * 2);
    const velocity = 120 + Math.random() * 200;
    const vx = Math.cos(angle) * velocity;
    const vy = Math.sin(angle) * velocity - 150; // bias upward
    const spin = (Math.random() - 0.5) * 720;
    const size = 3 + Math.random() * 5;

    let w: number, h: number;
    if (shape === 'square') { w = size; h = size; }
    else if (shape === 'line') { w = size * 2.5; h = 2; }
    else { w = size * 1.8; h = size; }

    el.style.cssText = `position:absolute;left:${x}px;top:${y}px;width:${w}px;height:${h}px;background:${color};image-rendering:pixelated;pointer-events:none;`;

    container.appendChild(el);

    let t = 0;
    const gravity = 500;
    const startX = x, startY = y;
    let lastTime = performance.now();

    function tick(now: number) {
      const dt = (now - lastTime) / 1000;
      lastTime = now;
      t += dt;
      const px = startX + vx * t;
      const py = startY + vy * t + 0.5 * gravity * t * t;
      const rot = spin * t;
      el.style.transform = `translate(${px - startX}px, ${py - startY}px) rotate(${rot}deg)`;
      el.style.opacity = String(Math.max(0, 1 - t / 1.2));
      if (t < 1.2) requestAnimationFrame(tick);
      else el.remove();
    }
    requestAnimationFrame(tick);
  }

  setTimeout(() => container.remove(), 1500);
}

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
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              spawnConfetti(rect.left + rect.width / 2, rect.top);
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
