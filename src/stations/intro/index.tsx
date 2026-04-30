import { useEffect, useState, lazy, Suspense, useRef } from 'react';

/**
 * The four corner arenas are heavy: ~30 files of arena-3d code plus an R3F
 * Canvas + ~15 mock agents per instance. Lazy-loading them keeps the
 * arena-3d JS out of the initial bundle so the bio panel paints first, and
 * `mounted` gates the actual render until after first paint so hydration
 * isn't blocked by Canvas init.
 */
const LandingArena = lazy(() => import('../../components/arena-3d/LandingArena'));

const ARENA_BOX_W = 700;
const ARENA_BOX_H = 540;
const BLEED_X = 280;
const BLEED_Y = 220;

interface ArenaSlotProps {
  position: React.CSSProperties;
  /** Whether this slot's arena should be live. Off-viewport slots get
   *  paused so the GPU/CPU isn't churning frames the user can't see. */
  active: boolean;
}

function ArenaSlot({ position, active }: ArenaSlotProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(true);

  // IntersectionObserver pauses each arena's render loop when its wrapper
  // scrolls out of the viewport (e.g. user is on the Win98 station).
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { rootMargin: '50px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={wrapperRef}
      style={{
        position: 'absolute',
        width: ARENA_BOX_W,
        height: ARENA_BOX_H,
        pointerEvents: 'none',
        overflow: 'hidden',
        zIndex: 2,
        ...position,
      }}
    >
      {active && (
        <Suspense fallback={null}>
          <LandingArena
            height={ARENA_BOX_H}
            hideControls
            zoom={21}
            paused={!inView}
          />
        </Suspense>
      )}
    </div>
  );
}

export default function IntroStation() {
  const [arenasMounted, setArenasMounted] = useState(false);

  // Defer arena mounting until after the first paint so the panel + bio
  // text reach the screen before the heavy R3F init kicks in.
  useEffect(() => {
    type IdleCB = (cb: () => void) => number;
    const ric = (window as Window & { requestIdleCallback?: IdleCB })
      .requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 16));
    const id = ric(() => setArenasMounted(true));
    return () => {
      const cic = (window as Window & { cancelIdleCallback?: (h: number) => void })
        .cancelIdleCallback;
      if (cic) cic(id);
      else window.clearTimeout(id);
    };
  }, []);

  // R3F's Canvas auto-resize observer doesn't fire on initial mount in this
  // setup. Dispatch a resize event a few frames after the arenas mount so
  // each Canvas measures its parent.
  useEffect(() => {
    if (!arenasMounted) return;
    const id1 = requestAnimationFrame(() => {
      requestAnimationFrame(() => window.dispatchEvent(new Event('resize')));
    });
    const id2 = window.setTimeout(() => window.dispatchEvent(new Event('resize')), 250);
    return () => {
      cancelAnimationFrame(id1);
      window.clearTimeout(id2);
    };
  }, [arenasMounted]);

  const scrollNext = () => {
    document
      .querySelector('.station-win98')
      ?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="station station-intro">
      <ArenaSlot active={arenasMounted} position={{ top: -BLEED_Y, left: -BLEED_X }} />
      <ArenaSlot active={arenasMounted} position={{ top: -BLEED_Y, right: -BLEED_X }} />
      <ArenaSlot active={arenasMounted} position={{ bottom: -BLEED_Y, left: -BLEED_X }} />
      <ArenaSlot active={arenasMounted} position={{ bottom: -BLEED_Y, right: -BLEED_X }} />

      <div className="intro-panel">
        <h1 className="intro-heading">i'm jeremy</h1>
        <p className="intro-line">
          building <a href="https://straw.vercel.app/">straw</a>,
        </p>
        <p className="intro-line">hackathons for openclaws.</p>
        <p className="intro-line">grappler</p>
      </div>

      <div className="intro-arena-buttons">
        {[
          { label: 'conference', accent: '#cfd5e8' },
          { label: 'round table', accent: '#e0d6d0' },
          { label: 'emoji', accent: '#ecd0cc' },
          { label: 'ping pong', accent: '#d0d7d1' },
        ].map((b) => (
          <button
            key={b.label}
            type="button"
            className="intro-arena-button"
            style={{ border: `1px solid ${b.accent}` }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = b.accent;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.9)';
            }}
          >
            {b.label}
          </button>
        ))}
      </div>

      <a
        className="intro-archive"
        href="#win98"
        onClick={(e) => {
          e.preventDefault();
          scrollNext();
        }}
      >
        archive
      </a>
    </section>
  );
}
