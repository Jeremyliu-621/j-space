import { WindowManagerProvider } from './components/win98/WindowManagerProvider'
import { ThemeProvider } from './components/win98/ThemeProvider'
import Win98Station from './stations/win98'
import GraffitiStation from './stations/graffiti'
import BJJStation from './stations/bjj'
import ArtStation from './stations/art'
import FashionStation from './stations/fashion'
import IdentityCard from './components/IdentityCard'

function App() {
  return (
    <div id="scroll-container">
      <WindowManagerProvider>
        <ThemeProvider>
          <Win98Station />
        </ThemeProvider>
      </WindowManagerProvider>

      <GraffitiStation />
      <BJJStation />
      <ArtStation />
      <FashionStation />

      <IdentityCard />
    </div>
  )
}

export default App
