import { WindowManagerProvider } from './components/win98/WindowManagerProvider'
import { ThemeProvider } from './components/win98/ThemeProvider'
import IntroStation from './stations/intro'
import Win98Station from './stations/win98'
import PseudoBrowser from './components/PseudoBrowser'

function App() {
  return (
    <ThemeProvider>
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
