import { useRef, useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import CursorAgent from './CursorAgent';

/**
 * R3F canvas overlay for the intro station. Fully covers the section but
 * sets `pointer-events: none` so DOM siblings (the central panel, the
 * archive link) remain clickable. Tracks the page cursor via a window
 * mousemove listener and feeds normalized [-1, 1] coords into the agent.
 */
export default function Scene() {
  const cursorRef = useRef({ x: 0, y: 0 });
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);

  useEffect(() => {
    function onMove(e: MouseEvent) {
      cursorRef.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      cursorRef.current.y = (e.clientY / window.innerHeight) * 2 - 1;
    }
    window.addEventListener('mousemove', onMove, { passive: true });
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  // Manually observe the wrapper and pass explicit dimensions to Canvas.
  // R3F's built-in resize observer was unreliable for us — likely interplay
  // with `content-visibility: auto` on the parent scroll-snap stations.
  useEffect(() => {
    if (!wrapperRef.current) return;
    const el = wrapperRef.current;
    const update = () => {
      const r = el.getBoundingClientRect();
      setSize({ w: Math.round(r.width), h: Math.round(r.height) });
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      ref={wrapperRef}
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 1,
      }}
    >
      {size && (
      <Canvas
        orthographic
        camera={{ position: [0, 0, 100], zoom: 4, near: 0.1, far: 1000 }}
        dpr={[1, 2]}
        gl={{ alpha: true, antialias: true }}
        style={{
          background: 'transparent',
          width: `${size.w}px`,
          height: `${size.h}px`,
        }}
      >
        {/* Soft directional light from upper-left, mild ambient fill so the
            agent reads as having form without harsh shadows. */}
        <ambientLight intensity={0.65} />
        <directionalLight position={[5, 10, 8]} intensity={0.8} />

        {/* DEBUG marker — bright red box at origin */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[40, 40, 40]} />
          <meshBasicMaterial color="red" />
        </mesh>

        <CursorAgent cursorRef={cursorRef} />
      </Canvas>
      )}
    </div>
  );
}
