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
}

/** ms to wait offscreen before fully unmounting an arena. Long enough that
 *  quick scroll-and-back doesn't lose the live state, short enough that
 *  genuine "moved on" frees memory + GPU + simulation cost. */
const UNMOUNT_DELAY_MS = 5000;

function ArenaSlot({ position }: ArenaSlotProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(true);
  const [hovered, setHovered] = useState(false);
  // `mounted` is the React-side gate — fully unmount the LandingArena
  // (Canvas, agents, GLBs) when offscreen for >UNMOUNT_DELAY_MS so the
  // browser frees the WebGL context entirely.
  const [mounted, setMounted] = useState(true);

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

  // Unmount on a delay when offscreen; remount immediately when in view.
  useEffect(() => {
    if (inView) {
      setMounted(true);
      return;
    }
    const id = window.setTimeout(() => setMounted(false), UNMOUNT_DELAY_MS);
    return () => window.clearTimeout(id);
  }, [inView]);

  return (
    <div
      ref={wrapperRef}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'absolute',
        width: ARENA_BOX_W,
        height: ARENA_BOX_H,
        // pointer-events: auto so we get hover events; the canvas itself is
        // visually decorative and won't trap meaningful clicks.
        pointerEvents: 'auto',
        overflow: 'hidden',
        zIndex: 2,
        ...position,
      }}
    >
      {mounted && (
        <Suspense fallback={null}>
          <LandingArena
            height={ARENA_BOX_H}
            hideControls
            zoom={21}
            paused={!inView}
            showPaths={hovered}
          />
        </Suspense>
      )}
    </div>
  );
}

export default function IntroStation() {
  // Arenas mount on first render — no requestIdleCallback gate. The chunk
  // and GLBs are preloaded in main.tsx so they're already in cache by the
  // time React reaches this point, and the Suspense boundary inside each
  // ArenaSlot keeps the bio panel painting first either way.

  // R3F's Canvas auto-resize observer doesn't fire on initial mount in this
  // setup. Dispatch a resize event a few frames after mount so each Canvas
  // measures its parent.
  useEffect(() => {
    const id1 = requestAnimationFrame(() => {
      requestAnimationFrame(() => window.dispatchEvent(new Event('resize')));
    });
    const id2 = window.setTimeout(() => window.dispatchEvent(new Event('resize')), 250);
    return () => {
      cancelAnimationFrame(id1);
      window.clearTimeout(id2);
    };
  }, []);

  const scrollNext = () => {
    document
      .querySelector('.station-win98')
      ?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="station station-intro">
      <ArenaSlot position={{ top: -BLEED_Y, left: -BLEED_X }} />
      <ArenaSlot position={{ top: -BLEED_Y, right: -BLEED_X }} />
      <ArenaSlot position={{ bottom: -BLEED_Y, left: -BLEED_X }} />
      <ArenaSlot position={{ bottom: -BLEED_Y, right: -BLEED_X }} />

      <div className="intro-panel">
        <h1 className="intro-heading">i'm jeremy</h1>
        <p className="intro-line">comp eng @ uoft</p>
        <p className="intro-line">builder at heart</p>
        <p className="intro-line">super happy</p>
      </div>

      <div className="intro-side-links">
        {[
          { label: 'conference', event: 'arena:conference' },
          { label: 'round table', event: 'arena:round_table' },
          { label: 'emoji', event: 'arena:emoji' },
          { label: 'ping pong', event: 'arena:ping_pong' },
        ].map(({ label, event }) => (
          <a
            key={label}
            href="#"
            className="intro-side-link"
            onClick={(e) => {
              e.preventDefault();
              // Fan out to all four arenas — each LandingArena listens for
              // these events and runs its own handler.
              window.dispatchEvent(new CustomEvent(event));
              // Drop the focus ring left by the click.
              (e.currentTarget as HTMLAnchorElement).blur();
            }}
          >
            {label}
          </a>
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
