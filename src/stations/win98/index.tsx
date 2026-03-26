import React, { useState, useCallback } from 'react';
import Desktop from '../../components/win98/Desktop';
import Window from '../../components/win98/Window';
import DesktopIcon from '../../components/win98/DesktopIcon';
import StartMenu from '../../components/win98/StartMenu';
import ImageViewer from '../../components/win98/ImageViewer';
import { useWindowManager } from '../../components/win98/WindowManager';
import { useTheme, colorPalettes } from '../../components/win98/ThemeProvider';
import { useTypewriter } from '../../lib/hooks/useTypewriter';
import { getImageUrl } from '../../lib/images';
import * as content from '../../lib/content';

// Typewriter title component
function TypewriterTitle({ text, tag: Tag = 'h2', className = '', style = {}, trigger = true, styledIndices }: {
  text: string; tag?: 'h1' | 'h2' | 'h3' | 'p'; className?: string; style?: React.CSSProperties; trigger?: boolean; styledIndices?: { indices: number[]; style: React.CSSProperties };
}) {
  const { displayText } = useTypewriter(text, { trigger });
  const rendered = styledIndices
    ? displayText.split('').map((ch, i) => {
        return styledIndices.indices.includes(i)
          ? <span key={i} style={styledIndices.style}>{ch}</span>
          : <React.Fragment key={i}>{ch}</React.Fragment>;
      })
    : displayText;
  return <Tag className={className} style={{ minHeight: '1.2em', ...style }}>{rendered}</Tag>;
}

// Project card in list view
function ProjectCard({ project, index, onSpecifics }: {
  project: content.Project; index: number; onSpecifics: (i: number) => void;
}) {
  const theme = useTheme();
  const btnStyle = theme.getButtonStyle();
  const imgUrl = project.image ? getImageUrl(project.image) : null;

  return (
    <div className="project-card">
      <div className="project-card-text">
        <h3 className="project-card-title">{project.title}</h3>
        <p className="project-card-description">{project.description}</p>
        {(project.front || project.back) && (
          <p className="project-card-stack">
            {project.front && <><strong>Front:</strong> {project.front}<br /></>}
            {project.back && <><strong>Back: </strong> {project.back}</>}
          </p>
        )}
        <div className="project-card-buttons">
          {project.website && (
            <a href={project.website} target="_blank" rel="noopener noreferrer" className="social-btn" style={{ width: 120, ...btnStyle }}>
              <img src={getImageUrl('website-icon') || ''} alt="Website" /> Website
            </a>
          )}
          {project.github && (
            <a href={project.github} target="_blank" rel="noopener noreferrer" className="social-btn" style={{ width: 120, ...btnStyle }}>
              <img src={getImageUrl('github-icon') || ''} alt="GitHub" /> GitHub
            </a>
          )}
          <a href="#" className="social-btn" style={{ width: 120, ...btnStyle }} onClick={(e) => { e.preventDefault(); onSpecifics(index); }}>
            <img src={getImageUrl('specifics-icon') || ''} alt="Specifics" /> Specifics
          </a>
        </div>
      </div>
      {imgUrl && <img src={imgUrl} className="project-card-image" alt={project.title} />}
    </div>
  );
}

// Single project view
function ProjectSingle({ project, onAll }: { project: content.Project; onAll: () => void }) {
  const theme = useTheme();
  const btnStyle = theme.getButtonStyle();
  const imgUrl = project.image ? getImageUrl(project.image) : null;

  return (
    <div className="project-single">
      <h1 className="project-single-title">{project.title}</h1>
      {imgUrl && <img src={imgUrl} className="project-single-image" alt={project.title} />}
      {(project.front || project.back) && (
        <div className="project-section">
          <h3 className="project-section-title">Stack</h3>
          <p className="project-section-stack">
            {project.front && <>Front: {project.front}<br /></>}
            {project.back && <>Back: {project.back}</>}
          </p>
        </div>
      )}
      <div className="project-section">
        <h3 className="project-section-title">Description</h3>
        <p className="project-section-content">{project.description}</p>
      </div>
      {project.additionalInfo && (
        <div className="project-section">
          <h3 className="project-section-title">Additional Information</h3>
          <div className="project-section-content" style={{ fontSize: '1.2em' }}>{project.additionalInfo}</div>
        </div>
      )}
      <div className="project-single-buttons">
        {project.website && (
          <a href={project.website} target="_blank" rel="noopener noreferrer" className="social-btn" style={{ fontSize: 20, width: 140, ...btnStyle }}>
            <img src={getImageUrl('website-icon') || ''} alt="Website" /> Website
          </a>
        )}
        {project.github && (
          <a href={project.github} target="_blank" rel="noopener noreferrer" className="social-btn" style={{ fontSize: 20, width: 140, ...btnStyle }}>
            <img src={getImageUrl('github-icon') || ''} alt="GitHub" /> GitHub
          </a>
        )}
        <a href="#" className="social-btn" style={{ fontSize: 20, width: 140, ...btnStyle }} onClick={(e) => { e.preventDefault(); onAll(); }}>
          <img src={getImageUrl('all-icon') || ''} alt="All" /> All
        </a>
      </div>
    </div>
  );
}

export default function Win98Station() {
  const wm = useWindowManager();
  const theme = useTheme();

  // Start menu state
  const [startMenuOpen, setStartMenuOpen] = useState(false);

  // Dynamic windows (opened via icons/menu)
  const [folderOpen, setFolderOpen] = useState(false);
  const [chatboxOpen, setChatboxOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [thanksOpen, setThanksOpen] = useState(false);
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [imageViewerIndex, setImageViewerIndex] = useState(0);

  // Animation triggers
  const [windowsVisible, setWindowsVisible] = useState<Record<string, boolean>>({});

  // Stagger window opening
  React.useEffect(() => {
    const timers = [
      setTimeout(() => setWindowsVisible(p => ({ ...p, aboutMe: true })), 200),
      setTimeout(() => setWindowsVisible(p => ({ ...p, skills: true })), 700),
      setTimeout(() => setWindowsVisible(p => ({ ...p, hobbies: true })), 1000),
      setTimeout(() => setWindowsVisible(p => ({ ...p, interactive: true })), 1500),
      setTimeout(() => setWindowsVisible(p => ({ ...p, projects: true })), 2000),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  // Project tab state
  const [activeProjectTab, setActiveProjectTab] = useState<string>('all');

  // Track which windows are "alive" (not closed by user)
  const [closedWindows, setClosedWindows] = useState<Set<string>>(new Set());

  const openWindow = useCallback((id: string) => {
    setClosedWindows(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    setWindowsVisible(prev => ({ ...prev, [id]: true }));
    wm.focusWindow(id);
  }, [wm]);

  const handleCloseWindow = useCallback((id: string) => {
    wm.unregisterWindow(id);
    setClosedWindows(prev => new Set(prev).add(id));
  }, [wm]);

  const openImageViewer = useCallback((index: number) => {
    setImageViewerIndex(index);
    setImageViewerOpen(true);
  }, []);

  const isWindowAlive = (id: string) => !closedWindows.has(id) && windowsVisible[id];

  const btnStyle = theme.getButtonStyle();
  const borderColor = theme.palette.colors[1];
  const itemBg = theme.paletteKey === 'default' ? '#e0e0e0' : theme.palette.colors[3];

  // Start menu items
  const menuItems = [
    { id: 'menu-about-me', emoji: '👤', label: 'About Me', onClick: () => openWindow('aboutMe') },
    { id: 'menu-skills', emoji: '💼', label: 'Skills', onClick: () => openWindow('skills') },
    { id: 'menu-hobbies', emoji: '🎨', label: 'Hobbies', onClick: () => openWindow('hobbies') },
    { id: 'menu-projects', emoji: '📁', label: 'My Projects', onClick: () => openWindow('projects') },
    { id: 'menu-interactive', emoji: '✨', label: 'Interactive', onClick: () => openWindow('interactive') },
    { id: 'menu-folder', emoji: '📂', label: 'Folder', onClick: () => setFolderOpen(true), separator: true },
    { id: 'menu-blog', emoji: '📝', label: 'See More Jeremy!', onClick: () => window.open('https://more-jeremy.vercel.app/', '_blank') },
    { id: 'menu-chatbox', emoji: '💬', label: 'Chatbox', onClick: () => setChatboxOpen(true) },
    { id: 'menu-thanks', emoji: '🙏', label: 'Thank you!', onClick: () => setThanksOpen(true) },
    { id: 'menu-theme-editor', emoji: '🎨', label: 'Theme Editor', onClick: () => setSettingsOpen(true), separator: true },
    { id: 'menu-shutdown', emoji: '⏻', label: 'Shut Down...', onClick: () => { if (confirm('Are you sure you want to shut down?')) { window.close(); window.location.href = 'about:blank'; } }, separator: true },
  ];

  return (
    <section className="station station-win98" data-station="win98">
      <Desktop>
        {/* Desktop Icons */}
        <DesktopIcon id="desktop-folder" icon={getImageUrl('directory_computer') || ''} label="Double Click Me!" onDoubleClick={() => setFolderOpen(true)} />
        <DesktopIcon id="desktop-blog" icon={getImageUrl('user-world') || ''} label="See More Jeremy!" onDoubleClick={() => window.open('https://more-jeremy.vercel.app/', '_blank')} />
        <DesktopIcon id="desktop-chatbox" icon={getImageUrl('user-chatbox') || ''} label="Chatbox" onDoubleClick={() => setChatboxOpen(true)} />
        <DesktopIcon id="desktop-theme" icon={getImageUrl('paint_old') || ''} label="Theme Editor" onDoubleClick={() => setSettingsOpen(true)} />
        <DesktopIcon id="desktop-thanks" icon={getImageUrl('picture-painting') || ''} label="Thank you!" onDoubleClick={() => setThanksOpen(true)} />

        {/* About Me Window */}
        {isWindowAlive('aboutMe') && (
          <Window id="aboutMe" title="About Me.exe" resizable className="window-about-me window-pop-open" onClose={() => handleCloseWindow('aboutMe')}>
            <TypewriterTitle text="Jeremy Liu" tag="h2" trigger={windowsVisible.aboutMe} style={{ color: 'var(--palette-color-1, #000000)' }} styledIndices={{ indices: [0, 7], style: { fontStyle: 'italic', fontSize: '1.3em' } }} />
            <p className="bold-title">{content.aboutMe.title}</p>
            <p>{content.aboutMe.bio}</p>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
              <img src={getImageUrl('cruisesunset') || ''} alt="Cruise Sunset" style={{ width: '60%', height: 100, margin: '8px 2px', border: `2px solid ${borderColor}`, boxSizing: 'border-box', display: 'block', objectFit: 'cover', objectPosition: 'center' }} />
              <img src={getImageUrl('pixelbjj') || ''} alt="bjj pixel art" style={{ width: '60%', height: 100, margin: '8px 2px', border: `2px solid ${borderColor}`, boxSizing: 'border-box', display: 'block', objectFit: 'cover', objectPosition: 'center' }} />
            </div>
            <div className="social-buttons-grid">
              {content.socialLinks.map(link => (
                <a key={link.label} href={link.href} target={link.href.startsWith('mailto') ? undefined : '_blank'} className="social-btn" style={btnStyle}>
                  <img src={getImageUrl(link.icon) || ''} alt={link.label} /> {link.label}
                </a>
              ))}
            </div>
          </Window>
        )}

        {/* Skills Window */}
        {isWindowAlive('skills') && (
          <Window id="skills" title="Skills.exe" resizable className="window-skills window-pop-open" onClose={() => handleCloseWindow('skills')}>
            <TypewriterTitle text="Programming Languages" tag="h3" trigger={windowsVisible.skills} style={{ color: 'var(--palette-color-1, #000000)' }} />
            <p style={{ margin: '3px 0' }}>{content.skills.programmingLanguages}</p>
            <hr style={{ margin: '8px 0' }} />
            <TypewriterTitle text="Data & ML" tag="h3" trigger={windowsVisible.skills} style={{ color: 'var(--palette-color-1, #000000)' }} />
            <p style={{ margin: '3px 0' }}>{content.skills.dataML}</p>
            <hr style={{ margin: '8px 0' }} />
            <TypewriterTitle text="Web & UI" tag="h3" trigger={windowsVisible.skills} style={{ color: 'var(--palette-color-1, #000000)' }} />
            <p style={{ margin: '3px 0' }}>{content.skills.webUI}</p>
            <hr style={{ margin: '8px 0' }} />
            <TypewriterTitle text="Robotics & Systems" tag="h3" trigger={windowsVisible.skills} style={{ color: 'var(--palette-color-1, #000000)' }} />
            <p style={{ margin: '3px 0' }}>{content.skills.roboticsSystems}</p>
            <hr style={{ margin: '8px 0' }} />
            <TypewriterTitle text="Developer Tools" tag="h3" trigger={windowsVisible.skills} style={{ color: 'var(--palette-color-1, #000000)' }} />
            <p style={{ margin: '3px 0' }}>{content.skills.developerTools}</p>
            <hr style={{ margin: '8px 0' }} />
            <h3 style={{ color: 'var(--palette-color-1, #000000)' }}>Currently improving by:</h3>
            <ul style={{ textAlign: 'left', margin: '3px 0 0 0', paddingLeft: 20, lineHeight: 1.4 }}>
              {content.skills.improvingBy.map((item, i) => <li key={i}>{item}</li>)}
            </ul>
          </Window>
        )}

        {/* Hobbies Window */}
        {isWindowAlive('hobbies') && (
          <Window id="hobbies" title="Hobbies.exe" resizable className="window-hobbies window-pop-open" onClose={() => handleCloseWindow('hobbies')}>
            <TypewriterTitle text="OUTSIDE of Academics" tag="h3" trigger={windowsVisible.hobbies} />
            <p>{content.hobbies}</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {[
                { src: 'conormcgregor', alt: 'Conor McGregor', maxWidth: 50 },
                { src: 'animation', alt: 'Pretty Animation', maxWidth: 50 },
                { src: 'bjj-grappling', alt: 'BJJ Grappling', maxWidth: 50 },
                { src: 'Happy', alt: 'Charles Oliviera', maxWidth: 200 },
                { src: 'Rodney', alt: 'Skating', maxWidth: 100 },
                { src: 'stop', alt: 'graffiti', maxWidth: 100 },
              ].map(img => (
                <img key={img.src} src={getImageUrl(img.src) || ''} alt={img.alt} style={{ maxWidth: img.maxWidth, width: 'auto', height: 'auto', objectFit: 'contain', display: 'block', margin: '8px 0 0 0', border: `2px solid ${borderColor}` }} />
              ))}
            </div>
          </Window>
        )}

        {/* Projects Window */}
        {isWindowAlive('projects') && (
          <Window id="projects" title="My Projects.exe" resizable className="window-projects window-pop-open" onClose={() => handleCloseWindow('projects')}>
            {/* Tabs */}
            <div className="projects-tabs" onWheel={(e) => { e.currentTarget.scrollLeft += e.deltaY; }}>
              <button className={`project-tab ${activeProjectTab === 'all' ? 'active' : ''}`} onClick={() => setActiveProjectTab('all')}>All</button>
              {content.projects.map((p, i) => (
                <button key={i} className={`project-tab ${activeProjectTab === String(i) ? 'active' : ''}`} onClick={() => setActiveProjectTab(String(i))} style={{ minWidth: 80 }}>
                  {p.title.length > 12 ? p.title.substring(0, 12) + '...' : p.title}
                </button>
              ))}
            </div>
            {/* Tab content */}
            <div className="projects-tab-content">
              {activeProjectTab === 'all' ? (
                <div>
                  <TypewriterTitle text="My Projects" tag="h1" trigger={windowsVisible.projects} style={{ marginTop: 0, marginBottom: 5 }} />
                  {content.projects.map((project, i) => (
                    <ProjectCard key={i} project={project} index={i} onSpecifics={(idx) => setActiveProjectTab(String(idx))} />
                  ))}
                </div>
              ) : (
                <ProjectSingle project={content.projects[parseInt(activeProjectTab)]} onAll={() => setActiveProjectTab('all')} />
              )}
            </div>
          </Window>
        )}

        {/* Interactive Window */}
        {isWindowAlive('interactive') && (
          <Window id="interactive" title="Interactive.exe" resizable className="window-interactive window-pop-open" onClose={() => handleCloseWindow('interactive')}>
            <div style={{ overflow: 'hidden', display: 'flex', alignItems: 'center', gap: 10 }}>
              <TypewriterTitle text="you can interact with windows!" tag="p" trigger={windowsVisible.interactive} style={{ margin: 0, fontSize: '1.15em', flex: 1 }} />
              <img src={getImageUrl('ascii-gif') || ''} alt="Bear" style={{ maxWidth: 100, height: 'auto', flexShrink: 0, border: `2px solid ${borderColor}` }} />
            </div>
          </Window>
        )}

        {/* Folder Window */}
        {folderOpen && (
          <Window id="folder" title="Folder.exe" resizable style={{ top: 100, left: 100, width: 600, height: 500 }} onClose={() => { setFolderOpen(false); handleCloseWindow('folder'); }}>
            <h3 style={{ marginTop: 0, marginBottom: 8, fontWeight: 'bold' }}>Images</h3>
            <div style={{ marginBottom: 20, padding: 8, background: itemBg, border: `1px solid ${borderColor}` }}>
              {content.ASSET_IMAGES.map((img, index) => {
                const imgUrl = getImageUrl(img.split('.')[0]);
                return (
                  <div key={img} style={{ display: 'inline-block', margin: 8, textAlign: 'center', verticalAlign: 'top', width: 100, cursor: 'pointer' }}
                    onDoubleClick={() => openImageViewer(index)}>
                    <img src={imgUrl || ''} alt={img} style={{ width: 64, height: 64, objectFit: 'contain', border: `1px solid ${borderColor}`, background: '#fff', padding: 2, display: 'block', margin: '0 auto 4px auto' }} />
                    <span style={{ fontSize: '0.85em', color: '#000', display: 'block', wordBreak: 'break-word' }}>{img}</span>
                  </div>
                );
              })}
            </div>
            <h3 style={{ marginTop: 0, marginBottom: 8, fontWeight: 'bold' }}>Source Code Files</h3>
            <div style={{ padding: 8, background: itemBg, border: `1px solid ${borderColor}` }}>
              {[
                { name: 'main.tsx', description: 'Main application entry point' },
                { name: 'App.tsx', description: 'Root React component' },
                { name: 'global.css', description: 'Global styles' },
                { name: 'package.json', description: 'Project dependencies' },
              ].map(file => (
                <div key={file.name} style={{ padding: '4px 8px', borderBottom: `1px solid ${borderColor}`, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontWeight: 'bold', minWidth: 120 }}>{file.name}</span>
                  <span style={{ color: '#666', fontSize: '0.9em' }}>{file.description}</span>
                </div>
              ))}
            </div>
          </Window>
        )}

        {/* Image Viewer Window */}
        {imageViewerOpen && (
          <Window id="imageViewer" title="Image Viewer.exe" resizable style={{ top: 150, left: 200, width: 700, height: 600 }} onClose={() => { setImageViewerOpen(false); handleCloseWindow('imageViewer'); }}>
            <ImageViewer imageList={content.ASSET_IMAGES} initialIndex={imageViewerIndex} />
          </Window>
        )}

        {/* Chatbox Window */}
        {chatboxOpen && (
          <Window id="chatbox" title="Chatbox.exe" resizable style={{ top: 100, left: 100, width: 600, height: 550 }} onClose={() => { setChatboxOpen(false); handleCloseWindow('chatbox'); }}>
            <iframe src="https://www3.cbox.ws/box/?boxid=3551058&boxtag=a6HwaA" width="100%" height="100%" allowTransparency frameBorder={0} style={{ border: `1px solid ${borderColor}`, background: '#fff' }} />
          </Window>
        )}

        {/* Settings/Theme Editor Window */}
        {settingsOpen && (
          <Window id="settings" title="Settings.exe" resizable style={{ top: 120, left: 100, width: 400, height: 360 }} onClose={() => { setSettingsOpen(false); handleCloseWindow('settings'); }}>
            <h2 style={{ marginTop: 0, marginBottom: 20, fontWeight: 'bold', fontSize: '1.5em' }}>Settings</h2>
            <h3 style={{ margin: '0 0 12px 0', fontWeight: 'bold', fontSize: '1.2em' }}>Color Palette</h3>
            {Object.entries(colorPalettes).map(([key, palette]) => (
              <div key={key} className="palette-option" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <label className="palette-label" style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
                  <input type="radio" name="color-palette" value={key} checked={theme.paletteKey === key} onChange={() => theme.applyPalette(key)} style={{ cursor: 'pointer' }} />
                  <strong>{palette.name}</strong>
                  <div className="palette-color-swatches" style={{ display: 'flex', gap: 2 }}>
                    {palette.colors.map((color, i) => (
                      <div key={i} className="palette-color-swatch" style={{ background: color, width: 16, height: 16, border: '1px solid #808080' }} />
                    ))}
                  </div>
                </label>
                <button className="palette-apply-btn" onClick={() => theme.applyPalette(key)} style={btnStyle}>Apply</button>
              </div>
            ))}
          </Window>
        )}

        {/* Thank You Window */}
        {thanksOpen && (
          <Window id="thanks" title="Thank you!.exe" resizable style={{ top: 50, left: 50, width: 600, height: 500 }} onClose={() => { setThanksOpen(false); handleCloseWindow('thanks'); }}>
            <h2 style={{ marginTop: 0, marginBottom: 20, fontWeight: 'bold', fontSize: '1.8em', textAlign: 'center' }}>Thank You!</h2>
            {content.thanks.map((item, i) => (
              <div key={i} className="thanks-item" style={{ marginBottom: 20, padding: 8, border: `1px solid ${borderColor}`, backgroundColor: itemBg }}>
                <h3 style={{ margin: '4px 0 8px 2px', fontWeight: 'bold', fontSize: '1.2em' }}>
                  {item.link ? (
                    <a href={item.link} target="_blank" rel="noopener noreferrer" style={{ color: '#000080', textDecoration: 'underline', padding: '3px 6px' }}>{item.name}</a>
                  ) : (
                    <strong>{item.name}</strong>
                  )}
                </h3>
                <p style={{ margin: '0 0 0 2px', lineHeight: 1.4, color: '#000' }}>{item.description}</p>
              </div>
            ))}
          </Window>
        )}

        {/* Start Menu */}
        <StartMenu items={menuItems} visible={startMenuOpen} onClose={() => setStartMenuOpen(false)} />

      </Desktop>
    </section>
  );
}
