import {
  useState,
  useRef,
  useEffect,
  useLayoutEffect,
  useCallback,
} from "react";
import { useTheme } from "../win98/ThemeProvider";
import ArtTab, { ArtTabProps } from "./tabs/ArtTab";
const TABS = [
  { id: "projects", label: "Projects", url: "C:\\Jeremy\\projects" },
  { id: "me", label: "Me", url: "C:\\Jeremy\\me" },
  { id: "art", label: "Art I Love", url: "C:\\Jeremy\\art" },
  { id: "sports", label: "Sports", url: "C:\\Jeremy\\sports" },
];

const TAB_PROPS: Record<string, ArtTabProps> = {
  projects: {
    imageFolder: "/projects",
    canvasHeight: 1000,
    projectsGrid: true,
  },
  me: {
    imageFolder: "/me",
    images: [
      { file: "mesmiling.jpeg", width: 300, height: 300, x: 60, y: 75 },
      { file: "mustache.jpg", width: 160, height: 160, x: 130, y: 210 },
      { file: "yohjishirt.png", width: 420, height: 300, x: 12, y: 305 },
      { file: "4guys.png", width: 285, height: 245, x: 845, y: 190 },
      { file: "kimeowra.jpg", width: 285, height: 390, x: 1140, y: 10 },
      { file: "thefalsemirror.png", width: 315, height: 170, x: 815, y: 20 },
      { file: "neverenough.png", width: 400, height: 245, x: 1100, y: 360 },
      { file: "uoftsticker.png", width: 500, height: 500, x: 700, y: 300 },
    ],
    defaultText: {
      content: "builder of things",
      x: 20,
      y: 50,
      w: 360,
      fontSize: 40,
    },
  },
  art: {},
  sports: {
    imageFolder: "/sports",
    images: [
      { file: "bjj.JPG", width: 320, height: 245, x: 450, y: 65 },
      { file: "Hans-longboarding.jpg", width: 230, height: 152, x: 840, y: 88 },
      {
        file: "alex-rockclimbing.png",
        width: 230,
        height: 195,
        x: 1120,
        y: 65,
      },
      { file: "charles-ufc.jpg", width: 275, height: 162, x: 480, y: 418 },
      { file: "bikepacking.jpg", width: 230, height: 175, x: 822, y: 402 },
      { file: "powerlifting.png", width: 200, height: 200, x: 1145, y: 328 },
    ],
    defaultText: {
      content: "I like sports that take me places",
      x: 78,
      y: 268,
      w: 270,
      fontSize: 40,
    },
    extraTexts: [
      {
        content: "UofT Grappling Club. 400+ hours in.",
        x: 450,
        y: 318,
        w: 320,
        fontSize: 13,
      },
      {
        content: "My favourite way to commute.",
        x: 840,
        y: 262,
        w: 230,
        fontSize: 13,
      },
      {
        content: "I would've been a climber in another universe.",
        x: 1120,
        y: 218,
        w: 230,
        fontSize: 13,
      },
      {
        content: "Fav UFC fighters: Oliveira, Khabib, Merab.",
        x: 480,
        y: 580,
        w: 275,
        fontSize: 13,
      },
      {
        content: "Captures how free I want my life to be.",
        x: 822,
        y: 570,
        w: 230,
        fontSize: 13,
      },
      {
        content: "Squat: 200, Bench: 195, Deadlift: 300 lbs.",
        x: 1145,
        y: 536,
        w: 200,
        fontSize: 13,
      },
    ],
  },
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

      const target = e.target as HTMLElement;
      if (target.closest(".art-canvas, canvas")) return;

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
              onClick={() => {
                setActiveTab(idx);
                browserRef.current?.scrollIntoView({
                  behavior: "smooth",
                  block: "nearest",
                });
              }}
            >
              <span className="pb-tab-favicon" aria-hidden="true" />
              <span className="pb-tab-label">{tab.label}</span>
              <span className="pb-tab-close" aria-hidden="true">
                ×
              </span>
            </button>
          ))}
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
        {TABS.map((tab, idx) => (
          <div
            key={tab.id}
            className={`pb-panel${idx === activeTab ? " pb-panel-active" : ""}`}
            data-tab={tab.id}
          >
            <ArtTab {...(TAB_PROPS[tab.id] ?? {})} />
          </div>
        ))}
      </div>
    </div>
  );
}
