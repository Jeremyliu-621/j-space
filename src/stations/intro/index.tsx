import bgPattern from '../../assets/Backgroundpixels.png';
import CursorAgent from './CursorAgent';
import OfficeElements from './OfficeElements';
import LeaderboardPreview from './LeaderboardPreview';

export default function IntroStation() {
  const scrollNext = () => {
    document
      .querySelector('.station-win98')
      ?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section
      className="station station-intro"
      style={{ backgroundImage: `url(${bgPattern})` }}
    >
      <OfficeElements />
      <LeaderboardPreview />

      <div className="intro-panel">
        <h1 className="intro-heading">i'm jeremy</h1>
        <p className="intro-line">building straw</p>
        <p className="intro-line">hackathons for openclaws</p>
        <p className="intro-line">bikepacker</p>
      </div>

      <CursorAgent scale={0.7} bottomOffset={20} />

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
