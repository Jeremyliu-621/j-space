import { useRef, useEffect, useState } from 'react';
import { WindowManagerProvider } from '../../components/win98/WindowManagerProvider';
import Desktop from '../../components/win98/Desktop';
import Window from '../../components/win98/Window';
import { useTheme } from '../../components/win98/ThemeProvider';

export default function GraffitiStation() {
  const sectionRef = useRef<HTMLElement>(null);
  const [showEntry, setShowEntry] = useState(false);
  const [entryDone, setEntryDone] = useState(false);
  const theme = useTheme();

  // Play expanding-window entry animation when station first scrolls into view
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !entryDone) {
          setShowEntry(true);
        }
      },
      { threshold: 0.15 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [entryDone]);

  const handleAnimationEnd = () => {
    setShowEntry(false);
    setEntryDone(true);
  };

  const bodyStyle = theme.getWindowBodyStyle();

  return (
    <section ref={sectionRef} className="station station-graffiti" data-station="graffiti">
      {/* Window-expansion entry animation: a Win98 window zooms from small to full viewport */}
      {showEntry && (
        <div className="station-entry-overlay">
          <div className="window station-entry-window" onAnimationEnd={handleAnimationEnd}>
            <div className="title-bar" style={{ background: 'var(--palette-color-2, #808080)' }}>
              <div className="title-bar-text">Graffiti.exe</div>
              <div className="title-bar-controls">
                <button aria-label="Minimize" />
                <button aria-label="Maximize" />
                <button aria-label="Close" />
              </div>
            </div>
            <div className="window-body" style={{ ...bodyStyle, flex: 1 }} />
          </div>
        </div>
      )}

      <WindowManagerProvider>
        <Desktop>
          {/* Gallery window — large, center-left */}
          <Window
            id="graffiti-gallery"
            title="Gallery.exe"
            resizable
            style={{ top: '8vh', left: '6vw', width: '55vw', height: '70vh' }}
          >
            <h3 style={{ margin: '0 0 8px 0', color: 'var(--palette-color-1)', fontFamily: 'var(--custom-font)' }}>
              Pieces
            </h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 8,
            }}>
              {[1, 2, 3, 4].map(n => (
                <div key={n} style={{
                  aspectRatio: '1',
                  border: '2px solid var(--palette-color-2)',
                  background: 'var(--palette-color-3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.85em',
                  color: 'var(--palette-color-1)',
                  fontFamily: 'var(--custom-font)',
                }}>
                  [IMAGE: Graffiti Piece #{n}]
                </div>
              ))}
            </div>
          </Window>

          {/* About window — smaller, top-right, overlapping gallery */}
          <Window
            id="graffiti-about"
            title="About.txt"
            resizable
            style={{ top: '12vh', left: '50vw', width: '30vw', height: '32vh' }}
          >
            <p style={{
              margin: 0,
              fontSize: '1em',
              color: 'var(--palette-color-1)',
              fontFamily: 'var(--custom-font)',
              lineHeight: 1.6,
            }}>
              [PLACEHOLDER: Short text about graffiti practice — legal walls, community pieces, influences, tools used]
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
