export default function BJJStation() {
  return (
    <section className="station station-bjj" data-station="bjj">
      <div className="bjj-container">
        <div className="bjj-center">
          <div className="bjj-image-placeholder">[IMAGE: Training/Grappling]</div>
          <h1 className="bjj-title">BJJ</h1>
          <p className="bjj-subtitle">Brazilian Jiu-Jitsu</p>
        </div>

        <div className="bjj-stats">
          <div className="bjj-stat">
            <div className="stat-number">?</div>
            <div className="stat-label">Belt</div>
          </div>
          <div className="bjj-stat">
            <div className="stat-number">~</div>
            <div className="stat-label">Years</div>
          </div>
          <div className="bjj-stat">
            <div className="stat-number">&infin;</div>
            <div className="stat-label">Submissions</div>
          </div>
        </div>

        <div className="scroll-cue">&#x2193; scroll to continue</div>
      </div>
    </section>
  );
}
