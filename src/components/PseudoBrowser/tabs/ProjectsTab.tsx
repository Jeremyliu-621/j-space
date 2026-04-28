import type { ReactElement } from "react";
import { useRef, useState, useCallback, useEffect } from "react";
import { projects } from "../../../lib/content";
import Media from "../../Media";

/* ── Image map: project image key → public file ── */
const IMAGE_MAP: Record<string, string> = {
  sinatra: "/projects/sinatrademo.mp4",
  lockblock: "/projects/lockblock.webp",
  "ufc-search": "/projects/ufc_elo.webp",
};

/* ── Sidebar tools (same as ArtTab) ── */
type ElementType = "shape" | "text";
type ShapeKind = "rect" | "circle" | "triangle" | "line" | "arrow" | "star";

interface CanvasElement {
  id: number;
  type: ElementType;
  x: number;
  y: number;
  w: number;
  h: number;
  rotation: number;
  zIndex: number;
  shape?: ShapeKind;
  content?: string;
  fontSize?: number;
  fontFamily?: string;
  fontColor?: string;
}

interface SidebarTool {
  type: ElementType;
  shape?: ShapeKind;
  label: string;
}

const SIDEBAR_TOOLS: SidebarTool[] = [
  { type: "shape", shape: "rect", label: "Rectangle" },
  { type: "shape", shape: "circle", label: "Circle" },
  { type: "shape", shape: "triangle", label: "Triangle" },
  { type: "shape", shape: "line", label: "Line" },
  { type: "shape", shape: "arrow", label: "Arrow" },
  { type: "shape", shape: "star", label: "Star" },
  { type: "text", label: "Text" },
];

const SHAPE_ICONS: Record<string, ReactElement> = {
  rect: (
    <svg
      viewBox="0 0 24 24"
      width="22"
      height="22"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <rect x="3" y="3" width="18" height="18" rx="1" />
    </svg>
  ),
  circle: (
    <svg
      viewBox="0 0 24 24"
      width="22"
      height="22"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <circle cx="12" cy="12" r="9" />
    </svg>
  ),
  triangle: (
    <svg
      viewBox="0 0 24 24"
      width="22"
      height="22"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <polygon points="12,3 22,21 2,21" />
    </svg>
  ),
  line: (
    <svg
      viewBox="0 0 24 24"
      width="22"
      height="22"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <line x1="4" y1="20" x2="20" y2="4" />
    </svg>
  ),
  arrow: (
    <svg
      viewBox="0 0 24 24"
      width="22"
      height="22"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <line x1="4" y1="12" x2="20" y2="12" />
      <polyline points="14,6 20,12 14,18" />
    </svg>
  ),
  star: (
    <svg
      viewBox="0 0 24 24"
      width="22"
      height="22"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <polygon points="12,2 15,9 22,9 16.5,14 18.5,21 12,17 5.5,21 7.5,14 2,9 9,9" />
    </svg>
  ),
  text: (
    <svg
      viewBox="0 0 24 24"
      width="22"
      height="22"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <text
        x="6"
        y="18"
        fontSize="16"
        fontWeight="bold"
        fill="currentColor"
        stroke="none"
      >
        T
      </text>
    </svg>
  ),
};

/* ── Subtle intro shake ── */
function randTilt(max: number) {
  return ((Math.random() - 0.5) * 2 * max).toFixed(1) + "deg";
}

export default function ProjectsTab() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const nextIdRef = useRef(1);
  const topZRef = useRef(1);

  /* ── Canvas overlay elements (shapes/text added by user) ── */
  const [elements, setElements] = useState<CanvasElement[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);

  /* ── Intro tilt for project cards ── */
  const [tiltAngles, setTiltAngles] = useState<Record<number, string>>({});
  const firedIds = useRef<Set<number>>(new Set());

  useEffect(() => {
    const cards = containerRef.current?.querySelectorAll(".project-card");
    if (!cards) return;

    const timers: ReturnType<typeof setTimeout>[] = [];
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const idx = Number((entry.target as HTMLElement).dataset.idx);
          if (firedIds.current.has(idx)) continue;
          firedIds.current.add(idx);
          observer.unobserve(entry.target);

          // Subtle shake: 4 steps at low magnitude
          const angles = Array.from({ length: 4 }, () => randTilt(0.8));
          let step = 0;
          const interval = setInterval(() => {
            if (step < angles.length) {
              setTiltAngles((prev) => ({ ...prev, [idx]: angles[step] }));
              step++;
            } else {
              clearInterval(interval);
              setTiltAngles((prev) => ({ ...prev, [idx]: "0deg" }));
            }
          }, 120);
          timers.push(setTimeout(() => clearInterval(interval), 800));
        }
      },
      { threshold: 0.15 },
    );

    cards.forEach((card) => observer.observe(card));
    return () => {
      observer.disconnect();
      timers.forEach(clearTimeout);
    };
  }, []);

  /* ── Add shape/text from sidebar ── */
  const addElement = useCallback((tool: SidebarTool) => {
    const scroll = containerRef.current?.scrollTop ?? 0;
    const id = nextIdRef.current++;
    const z = topZRef.current++;
    const el: CanvasElement = {
      id,
      type: tool.type,
      x: 200 + Math.random() * 300,
      y: scroll + 150 + Math.random() * 200,
      w: tool.type === "text" ? 180 : 100,
      h: tool.type === "text" ? 40 : 100,
      rotation: 0,
      zIndex: z,
      shape: tool.shape,
      content: tool.type === "text" ? "type here" : undefined,
      fontSize: 18,
      fontFamily: "'Playfair Display', Georgia, serif",
      fontColor: "#1a1a1a",
    };
    setElements((prev) => [...prev, el]);
    setSelectedId(id);
  }, []);

  /* ── Drag state ── */
  const dragRef = useRef<{
    id: number;
    startX: number;
    startY: number;
    elX: number;
    elY: number;
  } | null>(null);

  const onPointerDown = useCallback(
    (e: React.PointerEvent, id: number) => {
      e.preventDefault();
      e.stopPropagation();
      const el = elements.find((x) => x.id === id);
      if (!el) return;
      dragRef.current = {
        id,
        startX: e.clientX,
        startY: e.clientY,
        elX: el.x,
        elY: el.y,
      };
      setSelectedId(id);
      topZRef.current++;
      setElements((prev) =>
        prev.map((x) => (x.id === id ? { ...x, zIndex: topZRef.current } : x)),
      );
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    [elements],
  );

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    setElements((prev) =>
      prev.map((x) =>
        x.id === dragRef.current!.id
          ? { ...x, x: dragRef.current!.elX + dx, y: dragRef.current!.elY + dy }
          : x,
      ),
    );
  }, []);

  const onPointerUp = useCallback(() => {
    dragRef.current = null;
  }, []);

  /* ── Render shapes ── */
  const renderShape = (el: CanvasElement) => {
    const s = el.shape;
    const style: React.CSSProperties = { width: "100%", height: "100%" };
    if (s === "rect")
      return <div style={{ ...style, border: "2px solid #1a1a1a" }} />;
    if (s === "circle")
      return (
        <div
          style={{ ...style, border: "2px solid #1a1a1a", borderRadius: "50%" }}
        />
      );
    if (s === "triangle")
      return (
        <svg viewBox="0 0 100 100" style={style}>
          <polygon
            points="50,5 95,95 5,95"
            fill="none"
            stroke="#1a1a1a"
            strokeWidth="2"
          />
        </svg>
      );
    if (s === "line")
      return (
        <svg viewBox="0 0 100 100" style={style}>
          <line
            x1="5"
            y1="95"
            x2="95"
            y2="5"
            stroke="#1a1a1a"
            strokeWidth="2"
          />
        </svg>
      );
    if (s === "arrow")
      return (
        <svg viewBox="0 0 100 100" style={style}>
          <line
            x1="5"
            y1="50"
            x2="85"
            y2="50"
            stroke="#1a1a1a"
            strokeWidth="2"
          />
          <polyline
            points="70,35 85,50 70,65"
            fill="none"
            stroke="#1a1a1a"
            strokeWidth="2"
          />
        </svg>
      );
    if (s === "star")
      return (
        <svg viewBox="0 0 100 100" style={style}>
          <polygon
            points="50,5 61,38 95,38 68,58 79,91 50,71 21,91 32,58 5,38 39,38"
            fill="none"
            stroke="#1a1a1a"
            strokeWidth="2"
          />
        </svg>
      );
    return null;
  };

  return (
    <div className="projects-tab-container" ref={containerRef}>
      {/* ── Sidebar ── */}
      <div className="art-sidebar">
        {SIDEBAR_TOOLS.map((tool) => (
          <button
            key={tool.label}
            className="art-sidebar-btn"
            title={tool.label}
            onClick={() => addElement(tool)}
          >
            {SHAPE_ICONS[tool.shape ?? tool.type]}
          </button>
        ))}
      </div>

      {/* ── Project cards ── */}
      <div className="projects-scroll-area">
        <h1 className="projects-heading">My Projects</h1>

        {projects.map((project, idx) => (
          <div
            key={project.title}
            className="project-card"
            data-idx={idx}
            style={{ transform: `rotate(${tiltAngles[idx] ?? "0deg"})` }}
          >
            <div className="project-card-image">
              {project.image && (
                <Media
                  src={
                    IMAGE_MAP[project.image] ?? `/projects/${project.image}.png`
                  }
                  alt={project.title}
                  draggable={false}
                />
              )}
            </div>
            <div className="project-card-info">
              <h2 className="project-card-title">{project.title}</h2>
              <p className="project-card-desc">{project.description}</p>
              <div className="project-card-links">
                {project.website && (
                  <a
                    href={project.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="project-link"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      width="16"
                      height="16"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                    </svg>
                    Website
                  </a>
                )}
                {project.github && (
                  <a
                    href={project.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="project-link"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      width="16"
                      height="16"
                      fill="currentColor"
                    >
                      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
                    </svg>
                    GitHub
                  </a>
                )}
                {project.additionalInfo && (
                  <a
                    href="#"
                    className="project-link"
                    onClick={(e) => e.preventDefault()}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      width="16"
                      height="16"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="16" x2="12" y2="12" />
                      <line x1="12" y1="8" x2="12.01" y2="8" />
                    </svg>
                    Specifics
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* ── Canvas overlay for user-added elements ── */}
        <div
          className="projects-canvas-overlay"
          ref={canvasRef}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onClick={() => {
            setSelectedId(null);
            setEditingId(null);
          }}
        >
          {elements.map((el) => (
            <div
              key={el.id}
              className={`art-element${selectedId === el.id ? " art-element-selected" : ""}`}
              style={{
                position: "absolute",
                left: el.x,
                top: el.y,
                width: el.w,
                height: el.h,
                transform: `rotate(${el.rotation}deg)`,
                zIndex: el.zIndex,
                cursor: "grab",
              }}
              onPointerDown={(e) => onPointerDown(e, el.id)}
              onClick={(e) => e.stopPropagation()}
              onDoubleClick={() => {
                if (el.type === "text") setEditingId(el.id);
              }}
            >
              {el.type === "shape" && renderShape(el)}
              {el.type === "text" &&
                (editingId === el.id ? (
                  <textarea
                    autoFocus
                    defaultValue={el.content}
                    style={{
                      width: "100%",
                      height: "100%",
                      fontSize: el.fontSize,
                      fontFamily: el.fontFamily,
                      color: el.fontColor,
                      background: "transparent",
                      border: "1px dashed #888",
                      resize: "none",
                      outline: "none",
                    }}
                    onBlur={(e) => {
                      setElements((prev) =>
                        prev.map((x) =>
                          x.id === el.id
                            ? { ...x, content: e.target.value }
                            : x,
                        ),
                      );
                      setEditingId(null);
                    }}
                  />
                ) : (
                  <div
                    style={{
                      fontSize: el.fontSize,
                      fontFamily: el.fontFamily,
                      color: el.fontColor,
                      whiteSpace: "pre-wrap",
                      userSelect: "none",
                    }}
                  >
                    {el.content}
                  </div>
                ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
