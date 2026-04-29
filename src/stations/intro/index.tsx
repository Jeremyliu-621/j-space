import bgPattern from '../../assets/Backgroundpixels.png';
import Scene from './Scene';

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
      <Scene />

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
