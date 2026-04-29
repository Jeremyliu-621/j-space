import { useEffect } from 'react';
import LandingArena from '../../components/arena-3d/LandingArena';
import { useTheme } from '../../components/win98/ThemeProvider';

/**
 * Four full straw `LandingArena` instances — copied as-is from the straw
 * repo — anchored at the four corners of the viewport with intentional
 * bleed past each edge so they get cut off. Each one runs its own mock
 * agents (~15 agents per arena, walking around, doing ping pong, etc.).
 */
const ARENA_BOX_W = 700;
const ARENA_BOX_H = 540;
// Bleed past viewport edges — large negative offset so each arena
// shows only its corner, the rest disappears past the page edge.
const BLEED_X = 280;
const BLEED_Y = 220;

export default function IntroStation() {
  const { paletteKey, getDesktopBackground, getDesktopBeforeStyle } = useTheme();
  // Match the Win98 desktop's background treatment — for themed palettes the
  // pattern is colorized via a `filter` on a ::before-style pseudo, for
  // default/dark it's just the raw image. We render the bg as its own
  // absolutely-positioned div behind the rest of the station's content.
  const isThemedPalette = paletteKey !== 'default' && paletteKey !== 'dark';
  const bgPatternStyle: React.CSSProperties = isThemedPalette
    ? getDesktopBeforeStyle()
    : getDesktopBackground();

  const scrollNext = () => {
    document
      .querySelector('.station-win98')
      ?.scrollIntoView({ behavior: 'smooth' });
  };

  // R3F's Canvas auto-resize observer doesn't fire on initial mount in this
  // setup (likely due to the scroll-snap stations + content-visibility on
  // sibling stations). Dispatch a resize event a couple of frames after
  // mount so each Canvas measures its parent and starts rendering.
  useEffect(() => {
    const id1 = requestAnimationFrame(() => {
      requestAnimationFrame(() => window.dispatchEvent(new Event('resize')));
    });
    const id2 = setTimeout(() => window.dispatchEvent(new Event('resize')), 250);
    return () => {
      cancelAnimationFrame(id1);
      clearTimeout(id2);
    };
  }, []);

  const arenaBase: React.CSSProperties = {
    position: 'absolute',
    width: ARENA_BOX_W,
    height: ARENA_BOX_H,
    pointerEvents: 'none',
    overflow: 'hidden',
    zIndex: 2,
  };

  return (
    <section className="station station-intro">
      {/* Floral pattern bg as its own layer behind everything, so the same
          theme filter the Win98 desktop applies hits it the same way. */}
      <div
        className="intro-bg-pattern"
        style={{
          ...bgPatternStyle,
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* TOP-LEFT: bleeds past top + left edges */}
      <div style={{ ...arenaBase, top: -BLEED_Y, left: -BLEED_X }}>
        <LandingArena height={ARENA_BOX_H} hideControls zoom={21} />
      </div>

      {/* TOP-RIGHT */}
      <div style={{ ...arenaBase, top: -BLEED_Y, right: -BLEED_X }}>
        <LandingArena height={ARENA_BOX_H} hideControls zoom={21} />
      </div>

      {/* BOTTOM-LEFT */}
      <div style={{ ...arenaBase, bottom: -BLEED_Y, left: -BLEED_X }}>
        <LandingArena height={ARENA_BOX_H} hideControls zoom={21} />
      </div>

      {/* BOTTOM-RIGHT */}
      <div style={{ ...arenaBase, bottom: -BLEED_Y, right: -BLEED_X }}>
        <LandingArena height={ARENA_BOX_H} hideControls zoom={21} />
      </div>

      <div className="intro-panel">
        <h1 className="intro-heading">i'm jeremy</h1>
        <p className="intro-line">building straw</p>
        <p className="intro-line">hackathons for openclaws</p>
        <p className="intro-line">bikepacker</p>
      </div>

      {/* LandingArena-style button strip, BELOW the panel rather than inside
          it — sits on the floral pattern with no shared background.
          Decorative for now; clicks are no-ops. */}
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
