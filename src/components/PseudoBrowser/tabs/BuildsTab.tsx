import { useTheme } from "../../win98/ThemeProvider";
import { getImageUrl } from "../../../lib/images";
import { projects } from "../../../lib/content";

const PROJECT_IMAGE_SRC: Record<string, string> = {
  sinatra: "/projects/sinatrademo.gif",
  lockblock: "/projects/lockblock.png",
  "ufc-search": "/projects/ufc_elo.png",
};

function resolveProjectImage(slug?: string): string | null {
  if (!slug) return null;
  return PROJECT_IMAGE_SRC[slug] ?? `/projects/${slug}.png`;
}

export default function BuildsTab() {
  const theme = useTheme();
  const btnStyle = theme.getButtonStyle();
  const websiteIcon = getImageUrl("website-icon") ?? "";
  const githubIcon = getImageUrl("github-icon") ?? "";

  return (
    <div className="builds-tab">
      <h1 className="builds-heading">My Projects</h1>
      <div className="projects-grid">
        {projects.map((project) => {
          const imgSrc = resolveProjectImage(project.image);
          return (
            <div key={project.title} className="project-card">
              {imgSrc && (
                <img
                  src={imgSrc}
                  className="project-card-image"
                  alt={project.title}
                />
              )}
              <h3 className="project-card-title">{project.title}</h3>
              <p className="project-card-description">{project.description}</p>
              <div className="project-card-buttons">
                {project.website && (
                  <a
                    href={project.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="social-btn"
                    style={btnStyle}
                  >
                    {websiteIcon && <img src={websiteIcon} alt="web" />} web
                  </a>
                )}
                {project.github && (
                  <a
                    href={project.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="social-btn"
                    style={btnStyle}
                  >
                    {githubIcon && <img src={githubIcon} alt="git" />} git
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
