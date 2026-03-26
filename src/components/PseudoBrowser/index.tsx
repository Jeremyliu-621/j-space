import { useState, useRef, useEffect, useLayoutEffect, useCallback } from "react";
import { useTheme } from "../win98/ThemeProvider";
import GraffitiTab from "./tabs/GraffitiTab";
import BjjTab from "./tabs/BjjTab";
import ArtTab from "./tabs/ArtTab";
import YohjiTab from "./tabs/YohjiTab";

const TABS = [
  { id: "graffiti", label: "Graffiti.exe", url: "C:\\Jeremy\\graffiti" },
  { id: "bjj", label: "BJJ.exe", url: "C:\\Jeremy\\bjj" },
  { id: "art", label: "Art.exe", url: "C:\\Jeremy\\art" },
  { id: "yohji", label: "Yohji.exe", url: "C:\\Jeremy\\yohji" },
];

const TAB_COMPONENTS: Record<string, React.ComponentType> = {
  graffiti: GraffitiTab,
  bjj: BjjTab,
  art: ArtTab,
  yohji: YohjiTab,
};

export default function PseudoBrowser() {
  const [activeTab, setActiveTab] = useState(0);
  const browserRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [shoulders, setShoulders] = useState<{
    leftX: number;
    rightX: number;
  } | null>(null);

  const theme = useTheme();
  const bgStyle = theme.getDesktopBackground();
  const beforeStyle = theme.getDesktopBeforeStyle();
  const overlayStyle = theme.getDesktopOverlayStyle();

  const updateShoulders = useCallback(() => {
    const strip = stripRef.current;
    const tab = tabRefs.current[activeTab];
    if (!strip || !tab) return;

    const stripRect = strip.getBoundingClientRect();
    const tabRect = tab.getBoundingClientRect();

    setShoulders({
      leftX: tabRect.left - stripRect.left - 8,
      rightX: tabRect.right - stripRect.left,
    });
  }, [activeTab]);

  useLayoutEffect(() => {
    updateShoulders();
  }, [updateShoulders]);

  useEffect(() => {
    window.addEventListener("resize", updateShoulders);
    return () => window.removeEventListener("resize", updateShoulders);
  }, [updateShoulders]);

  useEffect(() => {
    const browser = browserRef.current;
    if (!browser) return;

    const handleWheel = (e: WheelEvent) => {
      const content = contentRef.current;
      if (!content || !content.contains(e.target as Node)) return;

      // Let tabs that manage their own wheel events handle it (Graffiti zoom, Art orbit, etc.)
      const target = e.target as HTMLElement;
      if (target.closest(".graffiti-canvas, .art-scene, canvas")) return;

      const panel = content.querySelector(
        ".pb-panel-active",
      ) as HTMLElement | null;
      if (e.deltaY < 0 && (!panel || panel.scrollTop <= 0)) return;

      e.preventDefault();
      if (panel) panel.scrollTop += e.deltaY;
    };

    browser.addEventListener("wheel", handleWheel, { passive: false });
    return () => browser.removeEventListener("wheel", handleWheel);
  }, []);

  return (
    <div className="pseudo-browser" ref={browserRef}>
      <div
        className="pb-tab-strip"
        ref={stripRef}
        style={{ backgroundColor: "#c0c0c0", ...bgStyle }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            overflow: "hidden",
            pointerEvents: "none",
            zIndex: 0,
          }}
        >
          {beforeStyle.display !== "none" && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                backgroundImage: beforeStyle.backgroundImage,
                backgroundRepeat: beforeStyle.backgroundRepeat as string,
                backgroundPosition: beforeStyle.backgroundPosition as string,
                backgroundSize: beforeStyle.backgroundSize as string,
                filter: beforeStyle.filter,
                pointerEvents: "none",
              }}
            />
          )}
          {overlayStyle.display !== "none" && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                backgroundColor: overlayStyle.backgroundColor,
                pointerEvents: "none",
                mixBlendMode: "multiply",
                opacity: 0.6,
              }}
            />
          )}
        </div>

        {shoulders && (
          <>
            <span
              className="pb-shoulder pb-shoulder-left"
              style={{ left: shoulders.leftX }}
            />
            <span
              className="pb-shoulder pb-shoulder-right"
              style={{ left: shoulders.rightX }}
            />
          </>
        )}

        <div className="pb-tab-strip-inner">
          {TABS.map((tab, idx) => (
            <button
              key={tab.id}
              ref={(el) => {
                tabRefs.current[idx] = el;
              }}
              className={`pb-tab${idx === activeTab ? " pb-tab-active" : ""}`}
              onClick={() => setActiveTab(idx)}
            >
              <span className="pb-tab-favicon" aria-hidden="true" />
              <span className="pb-tab-label">{tab.label}</span>
              <span className="pb-tab-close" aria-hidden="true">
                ×
              </span>
            </button>
          ))}
          <button className="pb-tab-new" aria-label="New tab">
            +
          </button>
        </div>
      </div>

      <div className="pb-toolbar">
        <button className="pb-nav-btn" aria-label="Back">
          ←
        </button>
        <button className="pb-nav-btn" aria-label="Forward">
          →
        </button>
        <button className="pb-nav-btn" aria-label="Refresh">
          ↻
        </button>
        <div className="pb-address-bar">
          <span className="pb-lock" aria-hidden="true">
            🔒
          </span>
          <span className="pb-url">{TABS[activeTab].url}</span>
        </div>
        <button className="pb-nav-btn pb-menu-btn" aria-label="Menu">
          ⋮
        </button>
      </div>

      <div className="pb-content" ref={contentRef}>
        {TABS.map((tab, idx) => {
          const TabContent = TAB_COMPONENTS[tab.id];
          return (
            <div
              key={tab.id}
              className={`pb-panel${idx === activeTab ? " pb-panel-active" : ""}`}
              data-tab={tab.id}
            >
              {TabContent && <TabContent />}
            </div>
          );
        })}
      </div>
    </div>
  );
}
