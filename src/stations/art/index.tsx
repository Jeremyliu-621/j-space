export default function ArtStation() {
  const pieces = [
    { label: 'Personal Series' },
    { label: 'Inspiration' },
    { label: 'Process' },
    { label: 'Aesthetic' },
    { label: 'Collaboration' },
  ];

  return (
    <section className="station station-art" data-station="art">
      <div className="art-container">
        <div className="art-header">
          <h1>CALM MAXIMALISM</h1>
          <p className="art-subtitle">Layered. Considered. Intentional.</p>
        </div>

        <div className="art-gallery">
          {pieces.map((piece, i) => (
            <div key={i} className={`art-piece art-piece-${i + 1}`}>
              <div className="art-image">[IMAGE: {piece.label}]</div>
              <div className="art-meta">{piece.label}</div>
            </div>
          ))}
        </div>

        <div className="scroll-cue">&#x2193; scroll to continue</div>
      </div>
    </section>
  );
}
