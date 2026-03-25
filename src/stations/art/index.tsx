import { WindowManagerProvider } from '../../components/win98/WindowManagerProvider';
import Desktop from '../../components/win98/Desktop';
import Window from '../../components/win98/Window';

export default function ArtStation() {
  const pieces = ['Personal Series', 'Inspiration', 'Process', 'Aesthetic', 'Collaboration'];

  return (
    <section className="station station-art" data-station="art">
      <WindowManagerProvider>
        <Desktop>
          {/* Gallery window — large, center */}
          <Window
            id="art-gallery"
            title="Gallery.exe"
            resizable
            style={{ top: '6vh', left: '8vw', width: '52vw', height: '75vh' }}
          >
            <h3 style={{ margin: '0 0 8px 0', color: 'var(--palette-color-1)', fontFamily: 'var(--custom-font)' }}>
              Works
            </h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 8,
            }}>
              {pieces.map((label, i) => (
                <div key={i} style={{
                  aspectRatio: i === 0 ? '4/3' : '1',
                  gridColumn: i === 0 ? 'span 2' : undefined,
                  border: '2px solid var(--palette-color-2)',
                  background: 'var(--palette-color-3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.8em',
                  color: 'var(--palette-color-1)',
                  fontFamily: 'var(--custom-font)',
                }}>
                  [IMAGE: {label}]
                </div>
              ))}
            </div>
          </Window>

          {/* Manifesto window — smaller, overlapping right */}
          <Window
            id="art-manifesto"
            title="Manifesto.txt"
            resizable
            style={{ top: '18vh', left: '54vw', width: '28vw', height: '40vh' }}
          >
            <p style={{
              margin: 0,
              fontSize: '1em',
              color: 'var(--palette-color-1)',
              fontFamily: 'var(--custom-font)',
              lineHeight: 1.6,
            }}>
              [PLACEHOLDER: Text about the art sensibility — calm maximalism, layered compositions, considered chaos, intentional clutter]
            </p>
          </Window>

          {/* Tiny label window — corner title card */}
          <Window
            id="art-label"
            title="label.txt"
            style={{ top: '68vh', left: '64vw', width: '16vw', height: 'auto' }}
          >
            <p style={{
              margin: 0,
              fontSize: '1.1em',
              color: 'var(--palette-color-1)',
              fontFamily: 'var(--custom-font)',
              fontWeight: 'bold',
              textAlign: 'center',
            }}>
              Calm Maximalism
            </p>
          </Window>

          {/* Status bar scroll cue */}
          <div className="station-status-bar">
            <span>Scroll down for more...</span>
          </div>
        </Desktop>
      </WindowManagerProvider>
    </section>
  );
}
