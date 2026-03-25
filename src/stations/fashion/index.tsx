import { WindowManagerProvider } from '../../components/win98/WindowManagerProvider';
import Desktop from '../../components/win98/Desktop';
import Window from '../../components/win98/Window';

export default function FashionStation() {
  const values = [
    'ANTI-MAINSTREAM',
    'DECONSTRUCTION',
    'WABI-SABI',
    'DARKNESS',
    'INTENTIONALITY',
  ];

  return (
    <section className="station station-fashion" data-station="fashion">
      <WindowManagerProvider>
        <Desktop>
          {/* Portrait window — tall, left-of-center */}
          <Window
            id="fashion-look"
            title="Look.exe"
            resizable
            style={{ top: '8vh', left: '18vw', width: '26vw', height: '72vh' }}
          >
            <div style={{
              width: '100%',
              height: '100%',
              minHeight: 300,
              border: '2px solid var(--palette-color-2)',
              background: 'var(--palette-color-3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.85em',
              color: 'var(--palette-color-1)',
              fontFamily: 'var(--custom-font)',
            }}>
              [IMAGE: Yohji / Fashion Piece]
            </div>
          </Window>

          {/* Values window — small, right side */}
          <Window
            id="fashion-values"
            title="Values.txt"
            resizable
            style={{ top: '25vh', left: '52vw', width: '20vw', height: 'auto' }}
          >
            <div style={{ fontFamily: 'var(--custom-font)', color: 'var(--palette-color-1)' }}>
              {values.map((word, i) => (
                <div key={word} style={{
                  padding: '6px 0',
                  borderBottom: i < values.length - 1 ? '1px solid var(--palette-color-2)' : 'none',
                  fontSize: '0.95em',
                  letterSpacing: '2px',
                }}>
                  {word}
                </div>
              ))}
            </div>
          </Window>

          {/* Status bar scroll cue */}
          <div className="station-status-bar">
            <span>End of stations</span>
          </div>
        </Desktop>
      </WindowManagerProvider>
    </section>
  );
}
