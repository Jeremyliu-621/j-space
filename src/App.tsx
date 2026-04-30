import { lazy, Suspense } from 'react'
import { WindowManagerProvider } from './components/win98/WindowManagerProvider'
import { useTheme, ThemeProvider } from './components/win98/ThemeProvider'
import IntroStation from './stations/intro'
import Win98Station from './stations/win98'

// PseudoBrowser is the bottom-most station — its tab content is dozens of
// images and canvas state that aren't needed for first paint. Code-split
// so the initial scroll into Win98 isn't gated on downloading the
// browser's React tree + its tab assets.
const PseudoBrowser = lazy(() => import('./components/PseudoBrowser'))

/**
 * One continuous floral background that spans every station — fixed to the
 * viewport so as you scroll between intro / win98 / browser it stays put,
 * giving the impression of one ambient layer beneath the whole page.
 *
 * Picks up the active theme's filter via the same getDesktopBeforeStyle /
 * getDesktopBackground hooks the Win98 desktop uses, so it always reads in
 * the same color as everything else.
 */
function PageBackground() {
  const { paletteKey, getDesktopBackground, getDesktopBeforeStyle } = useTheme();
  const isThemed = paletteKey !== 'default' && paletteKey !== 'dark';
  const bgStyle = isThemed ? getDesktopBeforeStyle() : getDesktopBackground();

  return (
    <div
      className="page-bg"
      style={{
        ...bgStyle,
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        backgroundColor: '#c0c0c0',
      }}
    />
  );
}

function App() {
  return (
    <ThemeProvider>
      <PageBackground />
      <div id="scroll-container">
        <IntroStation />

        {/* Empty spacer between intro and Win98 — gives the corner arenas
            and the panel breathing room before the desktop shows up, and
            keeps any bleed/overflow from one station crashing into the
            next. The page-bg flows through it. */}
        <div className="station-gap" aria-hidden />

        <WindowManagerProvider>
          <Win98Station />
        </WindowManagerProvider>

        <Suspense fallback={null}>
          <PseudoBrowser />
        </Suspense>
      </div>
    </ThemeProvider>
  )
}

export default App
