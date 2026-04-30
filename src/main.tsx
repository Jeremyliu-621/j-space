import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import '98.css'
import './styles/global.css'

// Kick off the arena-3d chunk fetch in parallel with the main bundle
// executing. The dynamic import promise resolves once and is cached, so
// when React.lazy in IntroStation reaches for the same module, the chunk
// is already downloaded (or actively downloading) — no waterfall waiting
// for `lazy()` to fire after first render.
import('./components/arena-3d/LandingArena')

// Same trick for the GLB office furniture: inject <link rel="preload">
// tags into the head so the 17 model files start fetching during HTML
// parse, in parallel with everything else. By the time TunerScene mounts
// and `useGLTF` asks for them, they're in HTTP cache.
const GLB_FILES = [
  'desk',
  'chairDesk',
  'computerScreen',
  'lampRoundFloor',
  'bookcaseClosed',
  'pottedPlant',
  'plantSmall1',
  'loungeSofa',
  'loungeDesignChair',
  'tableCoffee',
  'tableRound',
  'table',
  'kitchenCabinet',
  'kitchenCoffeeMachine',
  'kitchenFridgeSmall',
  'deskCorner',
  'chairModernCushion',
] as const
for (const name of GLB_FILES) {
  const link = document.createElement('link')
  link.rel = 'preload'
  link.as = 'fetch'
  link.crossOrigin = 'anonymous'
  link.href = `/office-assets/models/furniture/${name}.glb`
  document.head.appendChild(link)
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
