import { useState, useRef, useEffect } from 'react';

const TABS = [
  { id: 'graffiti', label: 'Graffiti.exe', url: 'C:\\Jeremy\\graffiti' },
  { id: 'bjj', label: 'BJJ.exe', url: 'C:\\Jeremy\\bjj' },
  { id: 'art', label: 'Art.exe', url: 'C:\\Jeremy\\art' },
  { id: 'yohji', label: 'Yohji.exe', url: 'C:\\Jeremy\\yohji' },
];

export default function PseudoBrowser() {
  const [activeTab, setActiveTab] = useState(0);
  const browserRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const browser = browserRef.current;
    if (!browser) return;

    const handleWheel = (e: WheelEvent) => {
      const content = contentRef.current;
      if (!content || !content.contains(e.target as Node)) return;

      const panel = content.querySelector('.pb-panel-active') as HTMLElement | null;
      if (e.deltaY < 0 && (!panel || panel.scrollTop <= 0)) return;

      e.preventDefault();
      if (panel) panel.scrollTop += e.deltaY;
    };

    browser.addEventListener('wheel', handleWheel, { passive: false });
    return () => browser.removeEventListener('wheel', handleWheel);
  }, []);

  return (
    <div className="pseudo-browser" ref={browserRef}>
      <div className="pb-tab-strip">
        {TABS.map((tab, idx) => (
          <button
            key={tab.id}
            className={`pb-tab${idx === activeTab ? ' pb-tab-active' : ''}`}
            onClick={() => setActiveTab(idx)}
          >
            <span className="pb-tab-favicon" aria-hidden="true" />
            <span className="pb-tab-label">{tab.label}</span>
            <span className="pb-tab-close" aria-hidden="true">×</span>
          </button>
        ))}
        <button className="pb-tab-new" aria-label="New tab">+</button>
      </div>

      <div className="pb-toolbar">
        <button className="pb-nav-btn" aria-label="Back">←</button>
        <button className="pb-nav-btn" aria-label="Forward">→</button>
        <button className="pb-nav-btn" aria-label="Refresh">↻</button>
        <div className="pb-address-bar">
          <span className="pb-lock" aria-hidden="true">🔒</span>
          <span className="pb-url">{TABS[activeTab].url}</span>
        </div>
        <button className="pb-nav-btn pb-menu-btn" aria-label="Menu">⋮</button>
      </div>

      <div className="pb-content" ref={contentRef}>
        {TABS.map((tab, idx) => (
          <div
            key={tab.id}
            className={`pb-panel${idx === activeTab ? ' pb-panel-active' : ''}`}
            data-tab={tab.id}
          >
            <span className="pb-station-label">{tab.label.replace('.exe', '')}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
