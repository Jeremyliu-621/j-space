export default function GraffitiStation() {
  return (
    <section className="station station-graffiti" data-station="graffiti">
      <div className="graffiti-container">
        <div className="graffiti-header">
          <h1>STREET TAGS</h1>
          <p className="graffiti-tagline">legal pieces + community walls</p>
        </div>

        <div className="graffiti-grid">
          {[1, 2, 3, 4].map(n => (
            <div key={n} className="graffiti-piece">
              <div className="graffiti-image-placeholder">[IMAGE: Graffiti Piece #{n}]</div>
              <div className="graffiti-label">Piece {n}</div>
            </div>
          ))}
        </div>

        <div className="scroll-cue">&#x2193; scroll to continue</div>
      </div>
    </section>
  );
}
