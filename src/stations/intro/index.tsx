import bgPattern from '../../assets/Backgroundpixels.png';
import Arena from './Arena';
import LeaderboardPreview from './LeaderboardPreview';

/**
 * Four mini iso arenas, one per corner — each lets agents and furniture
 * bleed past the viewport edges, like glimpsing four neighboring offices
 * around the central panel.
 */
const ARENA_BOX_W = 600;
const ARENA_BOX_H = 460;
// How far each arena bleeds past the corresponding viewport edge.
const BLEED = 130;

export default function IntroStation() {
  const scrollNext = () => {
    document
      .querySelector('.station-win98')
      ?.scrollIntoView({ behavior: 'smooth' });
  };

  const arenaBase: React.CSSProperties = {
    position: 'absolute',
    width: ARENA_BOX_W,
    height: ARENA_BOX_H,
    pointerEvents: 'none',
    // Above the noise overlay (z 9999); panel sits above this at z 10002.
    zIndex: 10000,
  };

  return (
    <section
      className="station station-intro"
      style={{ backgroundImage: `url(${bgPattern})` }}
    >
      {/* TOP-LEFT arena — bleeds past top + left edges */}
      <div style={{ ...arenaBase, top: -BLEED, left: -BLEED }}>
        <Arena variant="desk" seed="alpha" />
      </div>

      {/* TOP-RIGHT arena */}
      <div style={{ ...arenaBase, top: -BLEED, right: -BLEED }}>
        <Arena variant="study" seed="beta" />
      </div>

      {/* BOTTOM-LEFT arena */}
      <div style={{ ...arenaBase, bottom: -BLEED, left: -BLEED }}>
        <Arena variant="lounge" seed="gamma" />
      </div>

      {/* BOTTOM-RIGHT arena */}
      <div style={{ ...arenaBase, bottom: -BLEED, right: -BLEED }}>
        <Arena variant="kitchen" seed="delta" />
      </div>

      <LeaderboardPreview />

      <div className="intro-panel">
        <h1 className="intro-heading">i'm jeremy</h1>
        <p className="intro-line">building straw</p>
        <p className="intro-line">hackathons for openclaws</p>
        <p className="intro-line">bikepacker</p>
      </div>

      <a
        className="intro-archive"
        href="#win98"
        onClick={(e) => {
          e.preventDefault();
          scrollNext();
        }}
      >
        archive
      </a>
    </section>
  );
}
