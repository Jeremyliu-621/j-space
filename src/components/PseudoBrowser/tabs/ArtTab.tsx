import {
  useRef,
  useState,
  useCallback,
  useEffect,
  useLayoutEffect,
} from "react";

/* ══════════════════════════════════════════════════════════════
   IMAGE CONFIG — edit positions / sizes here
   ══════════════════════════════════════════════════════════════ */
const ART_IMAGES = [
  { file: "almond-blossoms.jpg", width: 280, height: 210, x: 80, y: 30 },
  { file: "sunflowers.JPG", width: 180, height: 240, x: 400, y: 15 },
  { file: "guernica.jpg", width: 340, height: 170, x: 30, y: 280 },
  { file: "impression-sunrise.jpg", width: 220, height: 170, x: 620, y: 50 },
  { file: "spiderverse.JPG", width: 260, height: 175, x: 870, y: 20 },
  { file: "BR0D4R.jpg", width: 195, height: 250, x: 880, y: 230 },
  { file: "drool.jpg", width: 175, height: 220, x: 1100, y: 60 },
  { file: "resk12tag.png", width: 130, height: 100, x: 410, y: 270 },
  { file: "zephyr_tag.jpg", width: 200, height: 150, x: 680, y: 260 },
  { file: "annalauraart.PNG", width: 165, height: 215, x: 1110, y: 310 },
  { file: "beetlemoses.jpg", width: 215, height: 165, x: 50, y: 490 },
  { file: "sundown-sails.png", width: 255, height: 185, x: 310, y: 470 },
  { file: "Jesus.jpg", width: 155, height: 205, x: 600, y: 440 },
  { file: "third-of-may.jpg", width: 275, height: 195, x: 790, y: 460 },
  { file: "yohji.jpg", width: 165, height: 225, x: 1090, y: 540 },
  { file: "rams.jpg", width: 200, height: 150, x: 420, y: 680 },
];

/* ══════════════════════════════════════════════════════════════
   TYPES
   ══════════════════════════════════════════════════════════════ */
type ElementType = "image" | "shape" | "text";
type ShapeKind = "rect" | "circle" | "triangle" | "line" | "arrow" | "star";
type HandleDir = "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "rotate";

interface CanvasElement {
  id: number;
  type: ElementType;
  x: number;
  y: number;
  w: number;
  h: number;
  rotation: number;
  zIndex: number;
  file?: string;
  shape?: ShapeKind;
  content?: string;
  fontSize?: number;
  fontFamily?: string;
  fontColor?: string;
}

/* ── Build initial elements from image config + a default text ── */
const INITIAL_ELEMENTS: CanvasElement[] = [
  ...ART_IMAGES.map((img, i) => ({
    id: i + 1,
    type: "image" as const,
    x: img.x,
    y: img.y,
    w: img.width,
    h: img.height,
    rotation:
      [-3, 2, -1.5, 4, -2, 1.5, -4, 3, -1, 2.5, -3.5, 1, -2.5, 3.5, -1, 2][i] ??
      0,
    zIndex: i + 1,
    file: img.file,
  })),
  {
    id: ART_IMAGES.length + 1,
    type: "text" as const,
    x: 380,
    y: 380,
    w: 300,
    h: 64,
    rotation: -2,
    zIndex: ART_IMAGES.length + 1,
    content: "everything is a canvas",
    fontSize: 26,
    fontFamily: "'Playfair Display', Georgia, serif",
    fontColor: "#1a1a1a",
  },
];

/* ══════════════════════════════════════════════════════════════
   SIDEBAR TOOL DEFINITIONS
   ══════════════════════════════════════════════════════════════ */
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

/* ══════════════════════════════════════════════════════════════
   GEOMETRY HELPERS
   ══════════════════════════════════════════════════════════════ */
const HANDLE_CURSORS: Record<HandleDir, string> = {
  nw: "nwse-resize",
  n: "ns-resize",
  ne: "nesw-resize",
  e: "ew-resize",
  se: "nwse-resize",
  s: "ns-resize",
  sw: "nesw-resize",
  w: "ew-resize",
  rotate: "crosshair",
};

function getHandlePosition(dir: HandleDir, w: number, h: number) {
  const map: Record<HandleDir, { x: number; y: number }> = {
    nw: { x: 0, y: 0 },
    n: { x: w / 2, y: 0 },
    ne: { x: w, y: 0 },
    e: { x: w, y: h / 2 },
    se: { x: w, y: h },
    s: { x: w / 2, y: h },
    sw: { x: 0, y: h },
    w: { x: 0, y: h / 2 },
    rotate: { x: w / 2, y: -28 },
  };
  return map[dir];
}

function getAnchorLocal(dir: string, w: number, h: number) {
  const ax = dir.includes("e") ? 0 : dir.includes("w") ? w : w / 2;
  const ay = dir.includes("s") ? 0 : dir.includes("n") ? h : h / 2;
  return { x: ax, y: ay };
}

function positionForFixedAnchor(
  oldX: number,
  oldY: number,
  oldW: number,
  oldH: number,
  newW: number,
  newH: number,
  dir: string,
  rotDeg: number,
) {
  const θ = (rotDeg * Math.PI) / 180;
  const c = Math.cos(θ),
    s = Math.sin(θ);
  const aOld = getAnchorLocal(dir, oldW, oldH);
  const aNew = getAnchorLocal(dir, newW, newH);
  const dox = aOld.x - oldW / 2,
    doy = aOld.y - oldH / 2;
  const dnx = aNew.x - newW / 2,
    dny = aNew.y - newH / 2;
  const ddx = dox - dnx,
    ddy = doy - dny;
  return {
    x: oldX + (oldW - newW) / 2 + ddx * c - ddy * s,
    y: oldY + (oldH - newH) / 2 + ddx * s + ddy * c,
  };
}

/* ══════════════════════════════════════════════════════════════
   SHAPE SVG RENDERER
   ══════════════════════════════════════════════════════════════ */
function ShapeSvg({ shape, w, h }: { shape: ShapeKind; w: number; h: number }) {
  const stroke = "#222";
  const sw = 2;
  const none = "none";

  switch (shape) {
    case "rect":
      return (
        <svg width={w} height={h} className="art-shape-svg">
          <rect
            x={sw}
            y={sw}
            width={w - sw * 2}
            height={h - sw * 2}
            fill={none}
            stroke={stroke}
            strokeWidth={sw}
          />
        </svg>
      );
    case "circle":
      return (
        <svg width={w} height={h} className="art-shape-svg">
          <ellipse
            cx={w / 2}
            cy={h / 2}
            rx={w / 2 - sw}
            ry={h / 2 - sw}
            fill={none}
            stroke={stroke}
            strokeWidth={sw}
          />
        </svg>
      );
    case "triangle":
      return (
        <svg width={w} height={h} className="art-shape-svg">
          <polygon
            points={`${w / 2},${sw} ${w - sw},${h - sw} ${sw},${h - sw}`}
            fill={none}
            stroke={stroke}
            strokeWidth={sw}
          />
        </svg>
      );
    case "line":
      return (
        <svg width={w} height={h} className="art-shape-svg">
          <line
            x1={sw}
            y1={h / 2}
            x2={w - sw}
            y2={h / 2}
            stroke={stroke}
            strokeWidth={sw}
          />
        </svg>
      );
    case "arrow":
      return (
        <svg width={w} height={h} className="art-shape-svg">
          <line
            x1={sw}
            y1={h / 2}
            x2={w - 14}
            y2={h / 2}
            stroke={stroke}
            strokeWidth={sw}
          />
          <polygon
            points={`${w - sw},${h / 2} ${w - 14},${h / 2 - 6} ${w - 14},${h / 2 + 6}`}
            fill={stroke}
            stroke={none}
          />
        </svg>
      );
    case "star": {
      const cx = w / 2,
        cy = h / 2;
      const outer = Math.min(w, h) / 2 - sw;
      const inner = outer * 0.4;
      const pts: string[] = [];
      for (let i = 0; i < 10; i++) {
        const r = i % 2 === 0 ? outer : inner;
        const a = (Math.PI / 2) * -1 + (i * Math.PI) / 5;
        pts.push(`${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`);
      }
      return (
        <svg width={w} height={h} className="art-shape-svg">
          <polygon
            points={pts.join(" ")}
            fill={none}
            stroke={stroke}
            strokeWidth={sw}
          />
        </svg>
      );
    }
  }
}

/* ══════════════════════════════════════════════════════════════
   SIDEBAR ICON RENDERER
   ══════════════════════════════════════════════════════════════ */
function SidebarIcon({ tool }: { tool: SidebarTool }) {
  const s = 22;
  const stroke = "currentColor";
  const sw = 1.5;
  const none = "none";

  if (tool.type === "text") {
    return (
      <svg width={s} height={s} viewBox="0 0 22 22" fill="none">
        <text x="4" y="17" fontFamily="serif" fontSize="18" fill={stroke}>
          T
        </text>
      </svg>
    );
  }

  switch (tool.shape) {
    case "rect":
      return (
        <svg width={s} height={s} viewBox="0 0 22 22">
          <rect
            x="3"
            y="5"
            width="16"
            height="12"
            fill={none}
            stroke={stroke}
            strokeWidth={sw}
          />
        </svg>
      );
    case "circle":
      return (
        <svg width={s} height={s} viewBox="0 0 22 22">
          <ellipse
            cx="11"
            cy="11"
            rx="8"
            ry="8"
            fill={none}
            stroke={stroke}
            strokeWidth={sw}
          />
        </svg>
      );
    case "triangle":
      return (
        <svg width={s} height={s} viewBox="0 0 22 22">
          <polygon
            points="11,3 20,19 2,19"
            fill={none}
            stroke={stroke}
            strokeWidth={sw}
          />
        </svg>
      );
    case "line":
      return (
        <svg width={s} height={s} viewBox="0 0 22 22">
          <line
            x1="3"
            y1="19"
            x2="19"
            y2="3"
            stroke={stroke}
            strokeWidth={sw}
          />
        </svg>
      );
    case "arrow":
      return (
        <svg width={s} height={s} viewBox="0 0 22 22">
          <line
            x1="3"
            y1="11"
            x2="16"
            y2="11"
            stroke={stroke}
            strokeWidth={sw}
          />
          <polygon points="19,11 14,7 14,15" fill={stroke} />
        </svg>
      );
    case "star": {
      const cx = 11,
        cy = 11,
        outer = 9,
        inner = 3.6;
      const pts: string[] = [];
      for (let i = 0; i < 10; i++) {
        const r = i % 2 === 0 ? outer : inner;
        const a = -Math.PI / 2 + (i * Math.PI) / 5;
        pts.push(`${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`);
      }
      return (
        <svg width={s} height={s} viewBox="0 0 22 22">
          <polygon
            points={pts.join(" ")}
            fill={none}
            stroke={stroke}
            strokeWidth={sw}
          />
        </svg>
      );
    }
    default:
      return null;
  }
}

/* ══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════════════════════ */
const HANDLE_SIZE = 8;
const HANDLE_DIRS: HandleDir[] = ["nw", "ne", "se", "sw"];

/* ── Per-element intro tilt config (seeded once) ── */
function randTilt(max: number) {
  return ((Math.random() - 0.5) * 2 * max).toFixed(1) + "deg";
}
const TILT_STEPS = 7; // steps per element
const TILT_CONFIG: Record<number, { angles: string[]; isText: boolean }> = {};
for (const el of INITIAL_ELEMENTS) {
  const isText = el.type === "text";
  const mag = isText ? 2.5 : 1.8;
  const steps = isText ? TILT_STEPS * 2 : TILT_STEPS;
  TILT_CONFIG[el.id] = {
    angles: Array.from({ length: steps }, () => randTilt(mag)),
    isText,
  };
}

export interface ArtTabProps {
  images?: {
    file: string;
    width: number;
    height: number;
    x: number;
    y: number;
  }[];
  imageFolder?: string;
  defaultText?: {
    content: string;
    x: number;
    y: number;
    w: number;
    fontSize: number;
  };
  extraTexts?: {
    content: string;
    x: number;
    y: number;
    w: number;
    fontSize: number;
  }[];
}

export default function ArtTab({
  images,
  imageFolder = "/art",
  defaultText,
  extraTexts = [],
}: ArtTabProps = {}) {
  const canvasRef = useRef<HTMLDivElement>(null);

  const imgList = images ?? ART_IMAGES;
  const txt = defaultText ?? {
    content: "everything is a canvas",
    x: 380,
    y: 380,
    w: 300,
    fontSize: 26,
  };

  const initialElements: CanvasElement[] = [
    ...imgList.map((img, i) => ({
      id: i + 1,
      type: "image" as const,
      x: img.x,
      y: img.y,
      w: img.width,
      h: img.height,
      rotation:
        [-3, 2, -1.5, 4, -2, 1.5, -4, 3, -1, 2.5, -3.5, 1, -2.5, 3.5, -1, 2][
          i
        ] ?? 0,
      zIndex: i + 1,
      file: img.file,
    })),
    {
      id: imgList.length + 1,
      type: "text" as const,
      x: txt.x,
      y: txt.y,
      w: txt.w,
      h: 64,
      rotation: -2,
      zIndex: imgList.length + 1,
      content: txt.content,
      fontSize: txt.fontSize,
      fontFamily: "'Playfair Display', Georgia, serif",
      fontColor: "#1a1a1a",
    },
    ...extraTexts.map((et, i) => ({
      id: imgList.length + 2 + i,
      type: "text" as const,
      x: et.x,
      y: et.y,
      w: et.w,
      h: 64,
      rotation: 0,
      zIndex: imgList.length + 2 + i,
      content: et.content,
      fontSize: et.fontSize,
      fontFamily: "'Playfair Display', Georgia, serif",
      fontColor: "#1a1a1a",
    })),
  ];

  const [elements, setElements] = useState<CanvasElement[]>(initialElements);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [rotationTooltip, setRotationTooltip] = useState<{
    angle: number;
    x: number;
    y: number;
  } | null>(null);
  const nextIdRef = useRef(initialElements.length + 1);
  const topZRef = useRef(initialElements.length + 1);

  /* ── Per-element intro tilt: each triggers when it enters viewport ── */
  const [tiltingIds, setTiltingIds] = useState<Set<number>>(new Set());
  const firedIds = useRef<Set<number>>(new Set());
  const elRefsForObserver = useRef<Map<number, HTMLDivElement>>(new Map());
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    const observer = new IntersectionObserver(
      (entries) => {
        const newIds: number[] = [];
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const id = Number((entry.target as HTMLElement).dataset.elementId);
          if (!id || firedIds.current.has(id)) continue;
          firedIds.current.add(id);
          newIds.push(id);
          observer.unobserve(entry.target);
        }
        if (newIds.length > 0) {
          setTiltingIds((prev) => {
            const next = new Set(prev);
            for (const id of newIds) next.add(id);
            return next;
          });
          // Clear each element's tilt after its steps finish (steps * 80ms + buffer)
          for (const id of newIds) {
            const cfg = TILT_CONFIG[id];
            const dur = (cfg?.angles.length ?? TILT_STEPS) * 160 + 200;
            timers.push(
              setTimeout(() => {
                setTiltingIds((prev) => {
                  const next = new Set(prev);
                  next.delete(id);
                  return next;
                });
              }, dur),
            );
          }
        }
      },
      { threshold: 0.15 },
    );
    observerRef.current = observer;

    // Observe any already-registered elements
    elRefsForObserver.current.forEach((div) => observer.observe(div));

    return () => {
      observer.disconnect();
      timers.forEach(clearTimeout);
    };
  }, []);

  const registerElRef = useCallback(
    (id: number, node: HTMLDivElement | null) => {
      if (node) {
        elRefsForObserver.current.set(id, node);
        if (observerRef.current && !firedIds.current.has(id)) {
          observerRef.current.observe(node);
        }
      } else {
        const prev = elRefsForObserver.current.get(id);
        if (prev) observerRef.current?.unobserve(prev);
        elRefsForObserver.current.delete(id);
      }
    },
    [],
  );

  /* ── Step through tilt angles for each tilting element ── */
  const tiltIntervalsRef = useRef<Map<number, ReturnType<typeof setInterval>>>(
    new Map(),
  );
  useEffect(() => {
    const STEP_MS = 160; // choppy frame rate

    for (const id of tiltingIds) {
      if (tiltIntervalsRef.current.has(id)) continue; // already running
      const cfg = TILT_CONFIG[id];
      if (!cfg) continue;
      let step = 0;
      const iv = setInterval(() => {
        const div = elRefsForObserver.current.get(id);
        if (!div || step >= cfg.angles.length) {
          clearInterval(iv);
          tiltIntervalsRef.current.delete(id);
          if (div) div.style.rotate = "";
          return;
        }
        div.style.rotate = cfg.angles[step];
        step++;
      }, STEP_MS);
      tiltIntervalsRef.current.set(id, iv);
    }

    // Clean up intervals for elements no longer tilting
    for (const [id, iv] of tiltIntervalsRef.current) {
      if (!tiltingIds.has(id)) {
        clearInterval(iv);
        tiltIntervalsRef.current.delete(id);
        const div = elRefsForObserver.current.get(id);
        if (div) div.style.rotate = "";
      }
    }
  }, [tiltingIds]);

  /* ── Undo / Redo history ── */
  const historyRef = useRef<CanvasElement[][]>([INITIAL_ELEMENTS]);
  const historyIndexRef = useRef(0);

  const pushHistory = useCallback((snapshot: CanvasElement[]) => {
    const idx = historyIndexRef.current;
    // Discard any redo states beyond current position
    historyRef.current = historyRef.current.slice(0, idx + 1);
    historyRef.current.push(snapshot);
    historyIndexRef.current = historyRef.current.length - 1;
  }, []);

  const undo = useCallback(() => {
    if (historyIndexRef.current <= 0) return;
    historyIndexRef.current--;
    const snapshot = historyRef.current[historyIndexRef.current];
    setElements(snapshot);
    setSelectedId(null);
    setEditingId(null);
  }, []);

  const redo = useCallback(() => {
    if (historyIndexRef.current >= historyRef.current.length - 1) return;
    historyIndexRef.current++;
    const snapshot = historyRef.current[historyIndexRef.current];
    setElements(snapshot);
    setSelectedId(null);
    setEditingId(null);
  }, []);

  /* Sync history head with current elements so cosmetic changes
     (like bringToFront zIndex bumps) don't cause phantom undo steps */
  const syncHistoryHead = useCallback((current: CanvasElement[]) => {
    historyRef.current[historyIndexRef.current] = current;
  }, []);

  /* ── Drag state ── */
  const dragRef = useRef<{
    type: "move" | "resize" | "rotate";
    nodeId: number;
    handleDir?: HandleDir;
    startX: number;
    startY: number;
    startNodeX: number;
    startNodeY: number;
    startNodeW: number;
    startNodeH: number;
    startRotation: number;
    startAngle: number;
    aspectRatio: number;
    centerScreenX: number;
    centerScreenY: number;
    didMove: boolean;
    startFontSize?: number;
  } | null>(null);

  /* ── Helpers ── */
  const bringToFront = useCallback(
    (id: number) => {
      const z = ++topZRef.current;
      setElements((prev) => {
        const next = prev.map((el) =>
          el.id === id ? { ...el, zIndex: z } : el,
        );
        syncHistoryHead(next);
        return next;
      });
    },
    [syncHistoryHead],
  );

  const getElScreenCenter = useCallback((el: CanvasElement) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return { x: rect.left + el.x + el.w / 2, y: rect.top + el.y + el.h / 2 };
  }, []);

  /* ── Create new element (from sidebar) ── */
  const addElement = useCallback(
    (type: ElementType, shape?: ShapeKind, x?: number, y?: number): number => {
      const id = ++nextIdRef.current;
      const z = ++topZRef.current;
      const defaults: Record<string, { w: number; h: number }> = {
        rect: { w: 120, h: 90 },
        circle: { w: 100, h: 100 },
        triangle: { w: 100, h: 100 },
        line: { w: 180, h: 4 },
        arrow: { w: 180, h: 24 },
        star: { w: 100, h: 100 },
        text: { w: 240, h: 56 },
      };
      const size = defaults[shape ?? type] ?? { w: 100, h: 100 };
      const newEl: CanvasElement = {
        id,
        type,
        x: x ?? 200,
        y: y ?? 200,
        w: size.w,
        h: size.h,
        rotation: 0,
        zIndex: z,
        ...(type === "shape" ? { shape } : {}),
        ...(type === "text"
          ? {
              content: "Double-click to edit",
              fontSize: 22,
              fontFamily: "'Playfair Display', Georgia, serif",
              fontColor: "#1a1a1a",
            }
          : {}),
      };
      setElements((prev) => {
        const next = [...prev, newEl];
        pushHistory(next);
        return next;
      });
      setSelectedId(id);
      setEditingId(null);
      return id;
    },
    [pushHistory],
  );

  /* ── Sidebar pointer-down: supports click-to-add & drag-to-add ── */
  const onSidebarPointerDown = useCallback(
    (tool: SidebarTool, e: React.PointerEvent) => {
      e.stopPropagation();
      e.preventDefault();

      const startX = e.clientX;
      const startY = e.clientY;
      let created = false;
      let elId: number | null = null;

      const onMove = (ev: PointerEvent) => {
        const dx = ev.clientX - startX;
        const dy = ev.clientY - startY;
        if (!created && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) {
          const rect = canvasRef.current?.getBoundingClientRect();
          if (!rect) return;
          const defaults: Record<string, { w: number; h: number }> = {
            rect: { w: 120, h: 90 },
            circle: { w: 100, h: 100 },
            triangle: { w: 100, h: 100 },
            line: { w: 180, h: 4 },
            arrow: { w: 180, h: 24 },
            star: { w: 100, h: 100 },
            text: { w: 240, h: 56 },
          };
          const size = defaults[tool.shape ?? tool.type] ?? { w: 100, h: 100 };
          elId = addElement(
            tool.type,
            tool.shape,
            ev.clientX - rect.left - size.w / 2,
            ev.clientY - rect.top - size.h / 2,
          );
          created = true;
        }
        if (created && elId != null) {
          const rect = canvasRef.current?.getBoundingClientRect();
          if (!rect) return;
          setElements((prev) =>
            prev.map((el) =>
              el.id === elId
                ? {
                    ...el,
                    x: ev.clientX - rect.left - el.w / 2,
                    y: ev.clientY - rect.top - el.h / 2,
                  }
                : el,
            ),
          );
        }
      };

      const onUp = () => {
        if (!created) {
          const rect = canvasRef.current?.getBoundingClientRect();
          if (rect) {
            addElement(
              tool.type,
              tool.shape,
              rect.width / 2 - 60,
              rect.height / 2 - 40,
            );
          }
        }
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
      };

      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
    },
    [addElement],
  );

  /* ── Canvas pointer handlers (move / resize / rotate) ── */
  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      const target = e.target as HTMLElement;

      // If editing text, let the contenteditable handle clicks
      if (editingId != null && target.closest("[data-editing]")) return;

      const handleEl = target.closest(
        "[data-handle-dir]",
      ) as HTMLElement | null;
      const nodeEl = target.closest("[data-element-id]") as HTMLElement | null;

      if (handleEl && selectedId != null) {
        const dir = handleEl.dataset.handleDir as HandleDir;
        const el = elements.find((n) => n.id === selectedId);
        if (!el) return;

        if (dir === "rotate") {
          const center = getElScreenCenter(el);
          const startAngle = Math.atan2(
            e.clientY - center.y,
            e.clientX - center.x,
          );
          dragRef.current = {
            type: "rotate",
            nodeId: selectedId,
            handleDir: dir,
            startX: e.clientX,
            startY: e.clientY,
            startNodeX: el.x,
            startNodeY: el.y,
            startNodeW: el.w,
            startNodeH: el.h,
            startRotation: el.rotation,
            startAngle,
            aspectRatio: el.w / el.h,
            centerScreenX: center.x,
            centerScreenY: center.y,
            didMove: false,
          };
        } else {
          dragRef.current = {
            type: "resize",
            nodeId: selectedId,
            handleDir: dir,
            startX: e.clientX,
            startY: e.clientY,
            startNodeX: el.x,
            startNodeY: el.y,
            startNodeW: el.w,
            startNodeH: el.h,
            startRotation: el.rotation,
            startAngle: 0,
            aspectRatio: el.w / el.h,
            centerScreenX: 0,
            centerScreenY: 0,
            didMove: false,
            startFontSize: el.fontSize,
          };
        }
        (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
        e.stopPropagation();
        return;
      }

      if (nodeEl) {
        const id = Number(nodeEl.dataset.elementId);
        const el = elements.find((n) => n.id === id);
        if (!el) return;
        bringToFront(id);
        setSelectedId(id);
        setEditingId(null);
        dragRef.current = {
          type: "move",
          nodeId: id,
          startX: e.clientX,
          startY: e.clientY,
          startNodeX: el.x,
          startNodeY: el.y,
          startNodeW: el.w,
          startNodeH: el.h,
          startRotation: el.rotation,
          startAngle: 0,
          aspectRatio: el.w / el.h,
          centerScreenX: 0,
          centerScreenY: 0,
          didMove: false,
        };
        (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
        return;
      }

      // Click on empty canvas — deselect
      setSelectedId(null);
      setEditingId(null);
      setRotationTooltip(null);
    },
    [elements, selectedId, editingId, bringToFront, getElScreenCenter],
  );

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d) return;
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;
    if (dx !== 0 || dy !== 0) d.didMove = true;

    if (d.type === "move") {
      setElements((prev) =>
        prev.map((el) =>
          el.id === d.nodeId
            ? { ...el, x: d.startNodeX + dx, y: d.startNodeY + dy }
            : el,
        ),
      );
    } else if (d.type === "resize" && d.handleDir) {
      const dir = d.handleDir;
      const isCorner = ["nw", "ne", "se", "sw"].includes(dir);
      const isSideOnly = dir === "e" || dir === "w";
      const rad = (d.startRotation * Math.PI) / 180;
      const cosR = Math.cos(rad),
        sinR = Math.sin(rad);
      const localDx = dx * cosR + dy * sinR;
      const localDy = -dx * sinR + dy * cosR;

      setElements((prev) =>
        prev.map((el) => {
          if (el.id !== d.nodeId) return el;
          const isText = el.type === "text";

          if (isText && isCorner) {
            // Corner drag on text: scale container and font proportionally
            const scale = Math.max(
              0.3,
              1 +
                (dir.includes("e") || dir.includes("s") ? 1 : -1) *
                  (Math.abs(localDx) > Math.abs(localDy)
                    ? localDx / d.startNodeW
                    : localDy / d.startNodeH),
            );
            const newW = Math.max(40, d.startNodeW * scale);
            const newH = Math.max(20, d.startNodeH * scale);
            const newFontSize = Math.max(8, (d.startFontSize ?? 22) * scale);
            const pos = positionForFixedAnchor(
              d.startNodeX,
              d.startNodeY,
              d.startNodeW,
              d.startNodeH,
              newW,
              newH,
              dir,
              d.startRotation,
            );
            return {
              ...el,
              x: pos.x,
              y: pos.y,
              w: newW,
              h: newH,
              fontSize: newFontSize,
            };
          }

          if (isText && isSideOnly) {
            // Side drag on text: change width only, height auto-adjusts via CSS
            let newW = d.startNodeW;
            if (dir === "e") newW = Math.max(40, d.startNodeW + localDx);
            if (dir === "w") newW = Math.max(40, d.startNodeW - localDx);
            const pos = positionForFixedAnchor(
              d.startNodeX,
              d.startNodeY,
              d.startNodeW,
              d.startNodeH,
              newW,
              d.startNodeH,
              dir,
              d.startRotation,
            );
            return { ...el, x: pos.x, y: pos.y, w: newW };
          }

          // Non-text elements: original behavior
          let newW = d.startNodeW,
            newH = d.startNodeH;
          if (dir.includes("e")) newW = Math.max(40, d.startNodeW + localDx);
          if (dir.includes("w")) newW = Math.max(40, d.startNodeW - localDx);
          if (dir.includes("s")) newH = Math.max(20, d.startNodeH + localDy);
          if (dir.includes("n")) newH = Math.max(20, d.startNodeH - localDy);
          if (isCorner && (el.type === "image" || e.shiftKey)) {
            const ar = d.aspectRatio;
            if (Math.abs(localDx) > Math.abs(localDy)) newH = newW / ar;
            else newW = newH * ar;
          }
          const pos = positionForFixedAnchor(
            d.startNodeX,
            d.startNodeY,
            d.startNodeW,
            d.startNodeH,
            newW,
            newH,
            dir,
            d.startRotation,
          );
          return { ...el, x: pos.x, y: pos.y, w: newW, h: newH };
        }),
      );
    } else if (d.type === "rotate") {
      const currentAngle = Math.atan2(
        e.clientY - d.centerScreenY,
        e.clientX - d.centerScreenX,
      );
      const angleDelta = (currentAngle - d.startAngle) * (180 / Math.PI);
      let newRot = d.startRotation + angleDelta;
      for (const snap of [0, 90, 180, 270, -90, -180, -270]) {
        if (Math.abs(newRot - snap) < 3) {
          newRot = snap;
          break;
        }
      }
      setElements((prev) =>
        prev.map((el) =>
          el.id === d.nodeId ? { ...el, rotation: newRot } : el,
        ),
      );
      setRotationTooltip({
        angle: Math.round(newRot * 10) / 10,
        x: e.clientX,
        y: e.clientY,
      });
    }
  }, []);

  const onPointerUp = useCallback(() => {
    const d = dragRef.current;
    if (d) {
      const moved = d.didMove;
      dragRef.current = null;
      setRotationTooltip(null);
      if (moved) {
        setElements((cur) => {
          pushHistory(cur);
          return cur;
        });
      }
    } else {
      setRotationTooltip(null);
    }
  }, [pushHistory]);

  /* ── Keyboard shortcuts (undo/redo + delete) ── */
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // Only handle when this tab's canvas is in focus area
      if ((e.target as HTMLElement).closest?.("[contenteditable=true]")) return;

      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if (
        ((e.ctrlKey || e.metaKey) && e.key === "z" && e.shiftKey) ||
        ((e.ctrlKey || e.metaKey) && e.key === "y")
      ) {
        e.preventDefault();
        redo();
      } else if (e.key === "Backspace" || e.key === "Delete") {
        const tag = (e.target as HTMLElement).tagName;
        if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
        if (selectedId != null) {
          e.preventDefault();
          const next = elements.filter((el) => el.id !== selectedId);
          pushHistory(next);
          setElements(next);
          setSelectedId(null);
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [undo, redo, selectedId, elements, pushHistory]);

  /* ── Double-click to edit text ── */
  const onDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      const target = e.target as HTMLElement;
      const nodeEl = target.closest("[data-element-id]") as HTMLElement | null;
      if (!nodeEl) return;
      const id = Number(nodeEl.dataset.elementId);
      const el = elements.find((n) => n.id === id);
      if (el?.type === "text") {
        setEditingId(id);
        setSelectedId(id);
        e.stopPropagation();
      }
    },
    [elements],
  );

  /* ── Save text on blur ── */
  const onTextBlur = useCallback(
    (id: number, text: string) => {
      setElements((prev) => {
        const next = prev.map((el) =>
          el.id === id ? { ...el, content: text } : el,
        );
        pushHistory(next);
        return next;
      });
      setEditingId(null);
    },
    [pushHistory],
  );

  /* ── Measure text element heights and sync back ── */
  const textElRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  useLayoutEffect(() => {
    textElRefs.current.forEach((div, id) => {
      const el = elements.find((e) => e.id === id);
      if (!el || el.type !== "text") return;
      const measuredH = div.offsetHeight;
      if (measuredH > 0 && Math.abs(measuredH - el.h) > 2) {
        // Only update h if not currently dragging this element
        if (dragRef.current?.nodeId === id) return;
        setElements((prev) =>
          prev.map((e) => (e.id === id ? { ...e, h: measuredH } : e)),
        );
      }
    });
  });

  /* ── Text toolbar helpers ── */
  const selectedEl = elements.find((el) => el.id === selectedId);
  const showTextToolbar = selectedEl?.type === "text";
  const [fontSelectOpen, setFontSelectOpen] = useState(false);

  const updateTextProp = useCallback(
    (prop: "fontSize" | "fontFamily" | "fontColor", value: string | number) => {
      if (selectedId == null) return;
      setElements((prev) => {
        const next = prev.map((el) =>
          el.id === selectedId ? { ...el, [prop]: value } : el,
        );
        pushHistory(next);
        return next;
      });
    },
    [selectedId, pushHistory],
  );

  const FONT_OPTIONS = [
    { label: "Playfair Display", value: "'Playfair Display', Georgia, serif" },
    { label: "Arial", value: "Arial, Helvetica, sans-serif" },
    { label: "Georgia", value: "Georgia, serif" },
    { label: "Courier New", value: "'Courier New', monospace" },
    { label: "Times New Roman", value: "'Times New Roman', serif" },
    { label: "Verdana", value: "Verdana, sans-serif" },
    { label: "Impact", value: "Impact, sans-serif" },
    { label: "Comic Sans MS", value: "'Comic Sans MS', cursive" },
  ];

  /* ── Render ── */
  return (
    <div className="art-container">
      {/* ── Text Toolbar ── */}
      {showTextToolbar && selectedEl && (
        <div
          className="art-text-toolbar"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <div
            className={`art-toolbar-select-wrap${fontSelectOpen ? " art-toolbar-select-wrap--open" : ""}`}
          >
            <select
              className="art-toolbar-select"
              value={
                selectedEl.fontFamily ?? "'Playfair Display', Georgia, serif"
              }
              onChange={(e) => {
                updateTextProp("fontFamily", e.target.value);
                e.target.blur();
              }}
              onFocus={() => setFontSelectOpen(true)}
              onBlur={() => setFontSelectOpen(false)}
            >
              {FONT_OPTIONS.map((f) => (
                <option
                  key={f.value}
                  value={f.value}
                  style={{ fontFamily: f.value }}
                >
                  {f.label}
                </option>
              ))}
            </select>
          </div>
          <div className="art-toolbar-divider" />
          <div className="art-toolbar-size">
            <button
              className="art-toolbar-btn"
              onClick={() =>
                updateTextProp(
                  "fontSize",
                  Math.max(8, (selectedEl.fontSize ?? 22) - 2),
                )
              }
            >
              −
            </button>
            <input
              className="art-toolbar-size-input"
              type="number"
              min={8}
              max={200}
              value={Math.round(selectedEl.fontSize ?? 22)}
              onChange={(e) =>
                updateTextProp("fontSize", Math.max(8, Number(e.target.value)))
              }
            />
            <button
              className="art-toolbar-btn"
              onClick={() =>
                updateTextProp(
                  "fontSize",
                  Math.min(200, (selectedEl.fontSize ?? 22) + 2),
                )
              }
            >
              +
            </button>
          </div>
          <div className="art-toolbar-divider" />
          <div className="art-toolbar-color-wrap">
            <input
              className="art-toolbar-color"
              type="color"
              value={selectedEl.fontColor ?? "#1a1a1a"}
              onChange={(e) => updateTextProp("fontColor", e.target.value)}
            />
          </div>
        </div>
      )}
      {/* ── Sidebar ── */}
      <div className="art-sidebar">
        {SIDEBAR_TOOLS.map((tool) => (
          <button
            key={tool.shape ?? tool.type}
            className="art-sidebar-item"
            title={tool.label}
            onPointerDown={(e) => onSidebarPointerDown(tool, e)}
          >
            <SidebarIcon tool={tool} />
          </button>
        ))}
      </div>

      {/* ── Canvas ── */}
      <div
        ref={canvasRef}
        className="art-canvas"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onDoubleClick={onDoubleClick}
      >
        {elements.map((el) => {
          const isTilting = tiltingIds.has(el.id);
          const cfg = TILT_CONFIG[el.id];
          const isTiltText = isTilting && cfg?.isText;
          return (
            <div
              key={el.id}
              ref={(node) => registerElRef(el.id, node)}
              className={`art-element${el.id === selectedId ? " art-element--selected" : ""}${isTilting ? " art-element--tilting" : ""}${isTiltText ? " art-element--tilt-selected" : ""}`}
              data-element-id={el.id}
              style={{
                left: el.x,
                top: el.y,
                width: el.w,
                height: el.type === "text" ? "auto" : el.h,
                minHeight: el.type === "text" ? el.h : undefined,
                zIndex: el.zIndex,
                transform: `rotate(${el.rotation}deg)`,
              }}
            >
              {/* Image */}
              {el.type === "image" && (
                <img
                  src={`${imageFolder}/${el.file}`}
                  alt=""
                  draggable={false}
                  className="art-element-img"
                  onLoad={(e) => {
                    const img = e.currentTarget;
                    const natW = img.naturalWidth;
                    const natH = img.naturalHeight;
                    if (natW && natH) {
                      const ar = natW / natH;
                      setElements((prev) =>
                        prev.map((p) =>
                          p.id === el.id ? { ...p, h: p.w / ar } : p,
                        ),
                      );
                    }
                  }}
                />
              )}

              {/* Shape */}
              {el.type === "shape" && el.shape && (
                <ShapeSvg shape={el.shape} w={el.w} h={el.h} />
              )}

              {/* Text */}
              {el.type === "text" && (
                <div
                  className="art-text-content"
                  ref={(node) => {
                    if (node) textElRefs.current.set(el.id, node);
                    else textElRefs.current.delete(el.id);
                  }}
                  contentEditable={editingId === el.id}
                  suppressContentEditableWarning
                  data-editing={editingId === el.id ? "true" : undefined}
                  onBlur={(e) =>
                    onTextBlur(el.id, e.currentTarget.textContent ?? "")
                  }
                  onPointerDown={
                    editingId === el.id
                      ? (e: React.PointerEvent) => e.stopPropagation()
                      : undefined
                  }
                  style={{
                    fontSize: el.fontSize ?? 22,
                    fontFamily:
                      el.fontFamily ?? "'Playfair Display', Georgia, serif",
                    color: el.fontColor ?? "#1a1a1a",
                  }}
                >
                  {el.content}
                </div>
              )}

              {/* Selection UI */}
              {(el.id === selectedId || isTiltText) && (
                <div
                  className="art-selection"
                  style={{ pointerEvents: "none" }}
                >
                  <div className="art-selection-box" />
                  {HANDLE_DIRS.map((dir) => {
                    const pos = getHandlePosition(dir, el.w, el.h);
                    return (
                      <div
                        key={dir}
                        className="art-handle"
                        data-handle-dir={dir}
                        style={{
                          left: pos.x - HANDLE_SIZE / 2,
                          top: pos.y - HANDLE_SIZE / 2,
                          width: HANDLE_SIZE,
                          height: HANDLE_SIZE,
                          cursor: HANDLE_CURSORS[dir],
                          pointerEvents: "auto",
                        }}
                      />
                    );
                  })}
                  <div
                    className="art-rotate-line"
                    style={{
                      left: el.w / 2,
                      top: -28,
                      height: 28,
                      pointerEvents: "none",
                    }}
                  />
                  <div
                    className="art-handle art-handle--rotate"
                    data-handle-dir="rotate"
                    style={{
                      left: el.w / 2 - HANDLE_SIZE / 2,
                      top: -28 - HANDLE_SIZE / 2,
                      width: HANDLE_SIZE,
                      height: HANDLE_SIZE,
                      cursor: HANDLE_CURSORS.rotate,
                      pointerEvents: "auto",
                    }}
                  />
                </div>
              )}
            </div>
          );
        })}

        {/* Rotation tooltip */}
        {rotationTooltip && (
          <div
            className="art-rotation-tooltip"
            style={{
              left: rotationTooltip.x + 16,
              top: rotationTooltip.y - 12,
            }}
          >
            {rotationTooltip.angle}°
          </div>
        )}
      </div>
    </div>
  );
}
