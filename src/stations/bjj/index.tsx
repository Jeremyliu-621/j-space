import { WindowManagerProvider } from '../../components/win98/WindowManagerProvider';
import Desktop from '../../components/win98/Desktop';
import Window from '../../components/win98/Window';

export default function BJJStation() {
  return (
    <section className="station station-bjj" data-station="bjj">
      <WindowManagerProvider>
        <Desktop>
          {/* Training photo window — wide, centered */}
          <Window
            id="bjj-training"
            title="Training.exe"
            resizable
            style={{ top: '15vh', left: '15vw', width: '50vw', height: '55vh' }}
          >
            <div style={{
              width: '100%',
              height: '100%',
              minHeight: 200,
              border: '2px solid var(--palette-color-2)',
              background: 'var(--palette-color-3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.85em',
              color: 'var(--palette-color-1)',
              fontFamily: 'var(--custom-font)',
            }}>
              [IMAGE: Training / Competition Photo]
            </div>
          </Window>

          {/* Stats window — small, overlapping bottom-right */}
          <Window
            id="bjj-stats"
            title="Stats.txt"
            resizable
            style={{ top: '50vh', left: '52vw', width: '22vw', height: '28vh' }}
          >
            <div style={{ fontFamily: 'var(--custom-font)', color: 'var(--palette-color-1)' }}>
              <div style={{ marginBottom: 8, borderBottom: '1px solid var(--palette-color-2)', paddingBottom: 4 }}>
                <strong>Belt:</strong> [PLACEHOLDER]
              </div>
              <div style={{ marginBottom: 8, borderBottom: '1px solid var(--palette-color-2)', paddingBottom: 4 }}>
                <strong>Years:</strong> [PLACEHOLDER]
              </div>
              <div>
                <strong>Submissions:</strong> [PLACEHOLDER]
              </div>
            </div>
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
