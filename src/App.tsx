import { WindowManagerProvider } from './components/win98/WindowManagerProvider'
import { useTheme, ThemeProvider } from './components/win98/ThemeProvider'
import IntroStation from './stations/intro'
import Win98Station from './stations/win98'
import PseudoBrowser from './components/PseudoBrowser'

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

        <WindowManagerProvider>
          <Win98Station />
        </WindowManagerProvider>

        <PseudoBrowser />
      </div>
    </ThemeProvider>
  )
}

export default App
