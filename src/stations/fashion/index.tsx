export default function FashionStation() {
  const philosophyItems = [
    'ANTI-MAINSTREAM',
    'DECONSTRUCTION',
    'WABI-SABI',
    'DARKNESS',
    'INTENTIONALITY',
  ];

  return (
    <section className="station station-fashion" data-station="fashion">
      <div className="fashion-container">
        <div className="fashion-left">
          <div className="fashion-image-large">[IMAGE: Yohji/Fashion Piece]</div>
        </div>
        <div className="fashion-right">
          <div className="fashion-content">
            <h1>YOHJI YAMAMOTO</h1>
            <div className="fashion-divider"></div>
            <div className="fashion-philosophy">
              {philosophyItems.map(item => (
                <div key={item} className="philosophy-item">
                  <span className="philosophy-label">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="scroll-cue">&#x2190; scroll back to start</div>
      </div>
    </section>
  );
}
