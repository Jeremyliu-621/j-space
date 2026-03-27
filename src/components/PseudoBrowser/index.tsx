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
  { id: "me", label: "Me.exe", url: "C:\\Jeremy\\me" },
  { id: "art", label: "Art.exe", url: "C:\\Jeremy\\art" },
  { id: "sports", label: "Sports.exe", url: "C:\\Jeremy\\sports" },
  { id: "bjj", label: "BJJ.exe", url: "C:\\Jeremy\\bjj" },
];

const TAB_PROPS: Record<string, ArtTabProps> = {
  me: {
    imageFolder: "/me",
    images: [
      { file: "mesmiling.jpeg", width: 300, height: 300, x: 60, y: 75 },
      { file: "mustache.jpg", width: 160, height: 160, x: 130, y: 210 },
      { file: "4guys.png", width: 300, height: 220, x: 700, y: 30 },
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
      { file: "bjj.JPG", width: 300, height: 225, x: 60, y: 40 },
      { file: "charles-ufc.jpg", width: 260, height: 195, x: 420, y: 20 },
      { file: "powerlifting.png", width: 240, height: 200, x: 740, y: 30 },
      {
        file: "alex-rockclimbing.png",
        width: 220,
        height: 280,
        x: 1020,
        y: 15,
      },
      { file: "bikepacking.jpg", width: 310, height: 210, x: 100, y: 320 },
      {
        file: "Hans-longboarding.jpg",
        width: 270,
        height: 200,
        x: 480,
        y: 300,
      },
    ],
    defaultText: {
      content: "I like sports that take me places",
      x: 800,
      y: 340,
      w: 380,
      fontSize: 22,
    },
    extraTexts: [
      {
        content:
          "BJJ — White belt @ UofT Grappling Club. 400+ hours in. My favourite sport — a testament of passion and work ethic.",
        x: 60,
        y: 275,
        w: 300,
        fontSize: 13,
      },
      {
        content:
          "UFC — I love how athletes use multiple disciplines to tackle the same challenge. Fav fighters: Oliveira, Khabib, Merab.",
        x: 420,
        y: 225,
        w: 260,
        fontSize: 13,
      },
      {
        content:
          "Powerlifting — All about dedication and optimizing routines. Squat: 200, Bench: 195, Deadlift: 300 lbs.",
        x: 740,
        y: 240,
        w: 240,
        fontSize: 13,
      },
      {
        content:
          "Rock Climbing — I would've been a climber in another universe. Makes me feel more present than anything else.",
        x: 1020,
        y: 305,
        w: 220,
        fontSize: 13,
      },
      {
        content:
          "Bikepacking — Captures how free I want my life to be. One day, I want to travel to all the countries of the world.",
        x: 100,
        y: 540,
        w: 310,
        fontSize: 13,
      },
      {
        content:
          "Longboarding — My favourite way to commute. I feel more at ease doing it than any other sport.",
        x: 480,
        y: 510,
        w: 270,
        fontSize: 13,
      },
    ],
  },
  bjj: {},
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
