import {
  useRef,
  useState,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
} from "react";
import { projects } from "../../../lib/content";
import { useTheme } from "../../win98/ThemeProvider";
import { getImageUrl } from "../../../lib/images";

/** Project slug → public asset (matches Win98 / ProjectsTab) */
const PROJECT_IMAGE_SRC: Record<string, string> = {
  opticat: "/projects/opticat.png",
  beavertrail: "/projects/beavertailsdevpostbanner.png",
  sinatra: "/projects/sinatrademo.gif",
  lockblock: "/projects/lockblock.png",
  "ufc-search": "/projects/ufc_elo.png",
};

/** Projects tab canvas grid — cards, type scale (see V_GAP for vertical rhythm) */
const PG = {
  HEAD_Y: 32,
  HEAD_FS: 42,
  HEAD_H: 56,
  HEAD_GAP_BELOW: 32,
  CARD_W: 380,
  /** Initial frame height before layout reflow fits to content */
  CARD_H: 520,
  GRID_GAP: 28,
  GRID_COLS: 3,
  GRID_PAD_X: 52,
  PAD: 20,
  IMG_H: 200,
  /** Spacing between image bottom and title */
  IMG_PAD_BELOW: 16,
  /** Single spacing between title, desc, stacks, and link row */
  V_GAP: 10,
  /** Padding below the link row inside the card */
  CARD_BOTTOM_PAD: 16,
  TITLE_FS: 22,
  TITLE_H: 28,
  DESC_FS: 14,
  DESC_H: 54,
  META_FS: 13,
  META_LINE_H: 22,
  LINK_FS: 14,
  LINK_H: 26,
  LINK_W: 110,
  LINK_GAP_X: 12,
} as const;

const PG_GRID_PAD_Y = PG.HEAD_Y + PG.HEAD_H + PG.HEAD_GAP_BELOW;

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
  { file: "resk12tag.png", width: 100, height: 100, x: 410, y: 270 },
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
type ElementType = "image" | "shape" | "text" | "link" | "card";
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
  /** Filled rect (e.g. project card frame); omit for outline-only shapes */
  fill?: string;
  strokeColor?: string;
  /** Skip intro tilt (card backgrounds) */
  noTilt?: boolean;
  content?: string;
  fontSize?: number;
  fontFamily?: string;
  fontColor?: string;
  groupId?: number;
  href?: string;
  linkIcon?: "website" | "github";
  /** Index into the `projects` array — set when type === "card". */
  projectIdx?: number;
}

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

function computeBBox(els: CanvasElement[]) {
  if (els.length === 0) return { x: 0, y: 0, w: 0, h: 0 };
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  for (const el of els) {
    minX = Math.min(minX, el.x);
    minY = Math.min(minY, el.y);
    maxX = Math.max(maxX, el.x + el.w);
    maxY = Math.max(maxY, el.y + el.h);
  }
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
}

/** Compute the tightest bounding box aligned at angle `bboxAngle` that wraps all elements.
 *  Projects element corners onto rotated axes — no stored center needed. */
function computeAlignedBBox(els: CanvasElement[], bboxAngle: number) {
  if (els.length === 0) return { x: 0, y: 0, w: 0, h: 0, cx: 0, cy: 0 };
  const rad = (bboxAngle * Math.PI) / 180;
  const cosT = Math.cos(rad);
  const sinT = Math.sin(rad);
  let uMin = Infinity,
    uMax = -Infinity,
    vMin = Infinity,
    vMax = -Infinity;
  for (const el of els) {
    const ecx = el.x + el.w / 2;
    const ecy = el.y + el.h / 2;
    // Project element center onto rotated axes
    const cu = ecx * cosT + ecy * sinT;
    const cv = -ecx * sinT + ecy * cosT;
    // Element's own rotation relative to bbox angle
    const dRad = ((bboxAngle - (el.rotation ?? 0)) * Math.PI) / 180;
    const cosD = Math.abs(Math.cos(dRad));
    const sinD = Math.abs(Math.sin(dRad));
    // Half-extents in rotated frame accounting for element's own rotation
    const halfU = (el.w / 2) * cosD + (el.h / 2) * sinD;
    const halfV = (el.w / 2) * sinD + (el.h / 2) * cosD;
    uMin = Math.min(uMin, cu - halfU);
    uMax = Math.max(uMax, cu + halfU);
    vMin = Math.min(vMin, cv - halfV);
    vMax = Math.max(vMax, cv + halfV);
  }
  const w = uMax - uMin;
  const h = vMax - vMin;
  const uCenter = (uMin + uMax) / 2;
  const vCenter = (vMin + vMax) / 2;
  // Convert center back to canvas coordinates
  const cx = uCenter * cosT - vCenter * sinT;
  const cy = uCenter * sinT + vCenter * cosT;
  return { x: cx - w / 2, y: cy - h / 2, w, h, cx, cy };
}

/* ══════════════════════════════════════════════════════════════
   SHAPE SVG RENDERER
   ══════════════════════════════════════════════════════════════ */
function ShapeSvg({
  shape,
  w,
  h,
  fill,
  strokeColor,
}: {
  shape: ShapeKind;
  w: number;
  h: number;
  fill?: string;
  strokeColor?: string;
}) {
  const stroke = strokeColor ?? "#222";
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
            rx={fill ? 10 : 0}
            ry={fill ? 10 : 0}
            fill={fill ?? none}
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

/* ── Per-element intro tilt config (seeded once per mount) ── */
function randTilt(max: number) {
  return ((Math.random() - 0.5) * 2 * max).toFixed(1) + "deg";
}
const TILT_STEPS = 7; // steps per element

const DEFAULT_IMAGE_ROTATIONS = [
  -3, 2, -1.5, 4, -2, 1.5, -4, 3, -1, 2.5, -3.5, 1, -2.5, 3.5, -1, 2,
];

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
  canvasHeight?: number;
  tiltMagnitude?: number;
  /** Multiplies default per-image rotations (0 = level, 1 = full tilt). */
  imageRotationScale?: number;
  /** 3-column project cards from site content; canvas + sidebar unchanged. */
  projectsGrid?: boolean;
  links?: {
    label: string;
    href: string;
    icon?: "website" | "github";
    x: number;
    y: number;
    fontSize?: number;
  }[];
}

export default function ArtTab({
  images,
  imageFolder = "/art",
  defaultText,
  extraTexts,
  canvasHeight,
  tiltMagnitude,
  imageRotationScale,
  projectsGrid,
  links,
}: ArtTabProps = {}) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const theme = useTheme();
  const cardBtnStyle = theme.getButtonStyle();
  const websiteIconUrl = getImageUrl("website-icon") ?? "";
  const githubIconUrl = getImageUrl("github-icon") ?? "";

  const imgList = projectsGrid ? [] : (images ?? ART_IMAGES);
  const txt = defaultText ?? {
    content: "everything is a canvas",
    x: 380,
    y: 380,
    w: 300,
    fontSize: 26,
  };

  const rotScale = imageRotationScale ?? 1;

  /* ── Build initial elements ── */
  const initialElements: CanvasElement[] = (() => {
    if (projectsGrid) {
      const els: CanvasElement[] = [];
      let id = 1;

      els.push({
        id: id++,
        type: "text",
        x: PG.GRID_PAD_X,
        y: PG.HEAD_Y,
        w: 300,
        h: PG.HEAD_H,
        rotation: 0,
        zIndex: 1,
        content: "My Builds",
        fontSize: PG.HEAD_FS,
        fontFamily: "'Playfair Display', Georgia, serif",
        fontColor: "#1a1a1a",
      });

      const CARD_W = 300;
      const CARD_H = 340;
      const GRID_GAP = 24;
      for (let pi = 0; pi < projects.length; pi++) {
        const cx = PG.GRID_PAD_X + (pi % PG.GRID_COLS) * (CARD_W + GRID_GAP);
        const cy =
          PG_GRID_PAD_Y +
          Math.floor(pi / PG.GRID_COLS) * (CARD_H + GRID_GAP);
        els.push({
          id: id++,
          type: "card",
          x: cx,
          y: cy,
          w: CARD_W,
          h: CARD_H,
          rotation: 0,
          zIndex: id,
          projectIdx: pi,
          noTilt: true,
        });
      }
      return els;
    }

    return [
      ...imgList.map((img, i) => ({
        id: i + 1,
        type: "image" as const,
        x: img.x,
        y: img.y,
        w: img.width,
        h: img.height,
        rotation: (DEFAULT_IMAGE_ROTATIONS[i] ?? 0) * rotScale,
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
      ...(extraTexts ?? []).map((et, i) => ({
        id: imgList.length + 2 + i,
        type: "text" as const,
        x: et.x,
        y: et.y,
        w: et.w,
        h: 80,
        rotation: 0,
        zIndex: imgList.length + 2 + i,
        content: et.content,
        fontSize: et.fontSize,
        fontFamily: "'Playfair Display', Georgia, serif",
        fontColor: "#1a1a1a",
        noTilt: true,
      })),
    ];
  })();

  const tiltConfigRef = useRef<Record<
    number,
    { angles: string[]; isText: boolean }
  > | null>(null);
  if (tiltConfigRef.current === null) {
    tiltConfigRef.current = {};
    for (const el of initialElements) {
      if (el.noTilt) {
        tiltConfigRef.current[el.id] = { angles: ["0deg"], isText: false };
        continue;
      }
      const isText = el.type === "text";
      const mag = tiltMagnitude ?? (isText ? 2.5 : 1.8);
      const steps = isText ? TILT_STEPS * 2 : TILT_STEPS;
      tiltConfigRef.current[el.id] = {
        angles: Array.from({ length: steps }, () => randTilt(mag)),
        isText,
      };
    }
  }

  const [elements, setElements] = useState<CanvasElement[]>(initialElements);

  const projectsGridMinCanvasHeight = useMemo(() => {
    if (!projectsGrid) return 0;
    const cards = elements.filter((e) => e.type === "card");
    if (cards.length === 0) return 0;
    const bottom = Math.max(...cards.map((c) => c.y + c.h));
    return bottom + 72;
  }, [projectsGrid, elements]);

  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [activeGroupId, setActiveGroupId] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [popupPos, setPopupPos] = useState<{ x: number; y: number } | null>(
    null,
  );
  const [groupRotationOverride, setGroupRotationOverride] = useState<
    number | null
  >(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [rotationTooltip, setRotationTooltip] = useState<{
    angle: number;
    x: number;
    y: number;
  } | null>(null);
  const [marquee, setMarquee] = useState<{
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
  } | null>(null);
  const nextIdRef = useRef(initialElements.length + 1);
  const topZRef = useRef(initialElements.length + 1);
  const maxInitGroup = Math.max(
    0,
    ...initialElements.map((el) => el.groupId ?? 0),
  );
  const nextGroupIdRef = useRef(maxInitGroup + 1);
  const groupDataRef = useRef<
    Map<number, { rotation: number; cx: number; cy: number }>
  >(null!);
  if (groupDataRef.current === null) {
    const m = new Map<number, { rotation: number; cx: number; cy: number }>();
    const gids = new Set<number>();
    for (const el of initialElements)
      if (el.groupId != null) gids.add(el.groupId);
    for (const gid of gids) {
      const groupEls = initialElements.filter((el) => el.groupId === gid);
      const bbox = computeBBox(groupEls);
      m.set(gid, {
        rotation: 0,
        cx: bbox.x + bbox.w / 2,
        cy: bbox.y + bbox.h / 2,
      });
    }
    groupDataRef.current = m;
  }
  const elementsRef = useRef(elements);
  elementsRef.current = elements;

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
          for (const id of newIds) {
            const cfg = tiltConfigRef.current?.[id];
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

    elRefsForObserver.current.forEach((div, id) => {
      const el = elementsRef.current.find((e) => e.id === id);
      if (el?.noTilt) return;
      observer.observe(div);
    });

    return () => {
      observer.disconnect();
      timers.forEach(clearTimeout);
    };
  }, []);

  const registerElRef = useCallback(
    (id: number, node: HTMLDivElement | null) => {
      if (node) {
        elRefsForObserver.current.set(id, node);
        const el = elementsRef.current.find((e) => e.id === id);
        if (observerRef.current && !firedIds.current.has(id) && !el?.noTilt) {
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
    const STEP_MS = 160;

    for (const id of tiltingIds) {
      if (tiltIntervalsRef.current.has(id)) continue;
      const cfg = tiltConfigRef.current?.[id];
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
  const historyRef = useRef<CanvasElement[][]>([initialElements]);
  const historyIndexRef = useRef(0);

  const pushHistory = useCallback((snapshot: CanvasElement[]) => {
    const idx = historyIndexRef.current;
    historyRef.current = historyRef.current.slice(0, idx + 1);
    historyRef.current.push(snapshot);
    historyIndexRef.current = historyRef.current.length - 1;
  }, []);

  const undo = useCallback(() => {
    if (historyIndexRef.current <= 0) return;
    historyIndexRef.current--;
    const snapshot = historyRef.current[historyIndexRef.current];
    setElements(snapshot);
    setSelectedIds([]);
    setActiveGroupId(null);
    setEditingId(null);
  }, []);

  const redo = useCallback(() => {
    if (historyIndexRef.current >= historyRef.current.length - 1) return;
    historyIndexRef.current++;
    const snapshot = historyRef.current[historyIndexRef.current];
    setElements(snapshot);
    setSelectedIds([]);
    setActiveGroupId(null);
    setEditingId(null);
  }, []);

  const syncHistoryHead = useCallback((current: CanvasElement[]) => {
    historyRef.current[historyIndexRef.current] = current;
  }, []);

  /* ── Drag state ── */
  const dragRef = useRef<{
    type: "move" | "resize" | "rotate" | "marquee";
    startX: number;
    startY: number;
    didMove: boolean;
    startPositions?: Map<number, { x: number; y: number }>;
    handleDir?: HandleDir;
    nodeId?: number;
    startNodeX?: number;
    startNodeY?: number;
    startNodeW?: number;
    startNodeH?: number;
    startRotation?: number;
    startAngle?: number;
    aspectRatio?: number;
    centerScreenX?: number;
    centerScreenY?: number;
    startFontSize?: number;
    startElements?: Map<
      number,
      {
        x: number;
        y: number;
        w: number;
        h: number;
        rotation: number;
        fontSize?: number;
      }
    >;
    groupBBox?: { x: number; y: number; w: number; h: number };
    rotatingGroupId?: number | null;
    baseGroupRotation?: number;
    lastRotationDelta?: number;
  } | null>(null);

  /* ── Helpers ── */
  const bringToFront = useCallback(
    (idOrIds: number | number[]) => {
      const ids = Array.isArray(idOrIds) ? idOrIds : [idOrIds];
      setElements((prev) => {
        const sorted = [...ids].sort((a, b) => {
          const za = prev.find((e) => e.id === a)?.zIndex ?? 0;
          const zb = prev.find((e) => e.id === b)?.zIndex ?? 0;
          return za - zb;
        });
        const baseZ = topZRef.current + 1;
        topZRef.current += ids.length;
        const zMap = new Map(sorted.map((sid, i) => [sid, baseZ + i]));
        const next = prev.map((el) => {
          const newZ = zMap.get(el.id);
          return newZ != null ? { ...el, zIndex: newZ } : el;
        });
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
        link: { w: 120, h: 28 },
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
        ...(type === "link"
          ? {
              content: "Link",
              fontSize: 14,
              fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif",
              fontColor: "#0b57d0",
              href: "#",
              linkIcon: "website" as const,
            }
          : {}),
      };
      setElements((prev) => {
        const next = [...prev, newEl];
        pushHistory(next);
        return next;
      });
      setSelectedIds([id]);
      setActiveGroupId(null);
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
            link: { w: 120, h: 28 },
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

  /* ── Canvas pointer handlers (move / resize / rotate / marquee) ── */
  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      const target = e.target as HTMLElement;

      if (editingId != null && target.closest("[data-editing]")) return;

      setIsDragging(true);

      const handleEl = target.closest(
        "[data-handle-dir]",
      ) as HTMLElement | null;
      const isMultiHandle = !!handleEl?.closest("[data-multi-bbox]");
      const nodeEl = target.closest("[data-element-id]") as HTMLElement | null;

      /* ── Handle drag (resize / rotate) ── */
      if (handleEl && selectedIds.length > 0) {
        const dir = handleEl.dataset.handleDir as HandleDir;

        if (isMultiHandle || selectedIds.length > 1) {
          const selectedEls = elements.filter((n) =>
            selectedIds.includes(n.id),
          );
          const bbox = computeBBox(selectedEls);

          if (dir === "rotate") {
            const canvas = canvasRef.current;
            if (!canvas) return;
            const cr = canvas.getBoundingClientRect();
            const gd =
              activeGroupId != null
                ? groupDataRef.current.get(activeGroupId)
                : null;
            const baseGRot = gd?.rotation ?? 0;
            // Compute rotation pivot from aligned bbox
            const aligned = computeAlignedBBox(selectedEls, baseGRot);
            const pivotX = aligned.cx;
            const pivotY = aligned.cy;
            const csx = cr.left + pivotX;
            const csy = cr.top + pivotY;
            const startAngle = Math.atan2(e.clientY - csy, e.clientX - csx);
            const startEls = new Map<
              number,
              {
                x: number;
                y: number;
                w: number;
                h: number;
                rotation: number;
                fontSize?: number;
              }
            >();
            for (const sel of selectedEls)
              startEls.set(sel.id, {
                x: sel.x,
                y: sel.y,
                w: sel.w,
                h: sel.h,
                rotation: sel.rotation,
                fontSize: sel.fontSize,
              });
            dragRef.current = {
              type: "rotate",
              startX: e.clientX,
              startY: e.clientY,
              didMove: false,
              startAngle,
              centerScreenX: csx,
              centerScreenY: csy,
              startElements: startEls,
              groupBBox: {
                x: pivotX - aligned.w / 2,
                y: pivotY - aligned.h / 2,
                w: aligned.w,
                h: aligned.h,
              },
              rotatingGroupId: activeGroupId,
              baseGroupRotation: baseGRot,
              lastRotationDelta: 0,
            };
            setGroupRotationOverride(baseGRot);
          } else {
            const startEls = new Map<
              number,
              {
                x: number;
                y: number;
                w: number;
                h: number;
                rotation: number;
                fontSize?: number;
              }
            >();
            for (const sel of selectedEls)
              startEls.set(sel.id, {
                x: sel.x,
                y: sel.y,
                w: sel.w,
                h: sel.h,
                rotation: sel.rotation,
                fontSize: sel.fontSize,
              });
            dragRef.current = {
              type: "resize",
              startX: e.clientX,
              startY: e.clientY,
              didMove: false,
              handleDir: dir,
              startElements: startEls,
              groupBBox: bbox,
              aspectRatio: bbox.w / bbox.h,
            };
          }
        } else {
          const el = elements.find((n) => n.id === selectedIds[0]);
          if (!el) return;

          if (dir === "rotate") {
            const center = getElScreenCenter(el);
            const startAngle = Math.atan2(
              e.clientY - center.y,
              e.clientX - center.x,
            );
            dragRef.current = {
              type: "rotate",
              nodeId: el.id,
              startX: e.clientX,
              startY: e.clientY,
              didMove: false,
              startNodeX: el.x,
              startNodeY: el.y,
              startNodeW: el.w,
              startNodeH: el.h,
              startRotation: el.rotation,
              startAngle,
              aspectRatio: el.w / el.h,
              centerScreenX: center.x,
              centerScreenY: center.y,
            };
          } else {
            dragRef.current = {
              type: "resize",
              nodeId: el.id,
              handleDir: dir,
              startX: e.clientX,
              startY: e.clientY,
              didMove: false,
              startNodeX: el.x,
              startNodeY: el.y,
              startNodeW: el.w,
              startNodeH: el.h,
              startRotation: el.rotation,
              aspectRatio: el.w / el.h,
              startFontSize: el.fontSize,
            };
          }
        }
        (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
        e.stopPropagation();
        return;
      }

      /* ── Click on element (select + start move) ── */
      if (nodeEl) {
        const id = Number(nodeEl.dataset.elementId);
        const el = elements.find((n) => n.id === id);
        if (!el) return;

        let idsToSelect: number[];
        let newActiveGid: number | null;

        if (el.groupId != null && activeGroupId === el.groupId) {
          const groupMembers = elements.filter((e) => e.groupId === el.groupId);
          const isGroupUnit =
            selectedIds.length > 1 &&
            groupMembers.every((m) => selectedIds.includes(m.id));
          if (isGroupUnit) {
            idsToSelect = selectedIds;
            newActiveGid = activeGroupId;
          } else {
            idsToSelect = [id];
            newActiveGid = activeGroupId;
          }
        } else if (selectedIds.includes(id) && activeGroupId == null) {
          idsToSelect = selectedIds;
          newActiveGid = null;
        } else if (el.groupId != null) {
          idsToSelect = elements
            .filter((e) => e.groupId === el.groupId)
            .map((e) => e.id);
          newActiveGid = el.groupId;
        } else {
          idsToSelect = [id];
          newActiveGid = null;
        }

        setActiveGroupId(newActiveGid);
        bringToFront(idsToSelect);
        setSelectedIds(idsToSelect);
        setEditingId(null);

        if (newActiveGid != null && idsToSelect.length > 1) {
          const rect = canvasRef.current?.getBoundingClientRect();
          if (rect)
            setPopupPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
        } else {
          setPopupPos(null);
        }

        const startPositions = new Map<number, { x: number; y: number }>();
        for (const sid of idsToSelect) {
          const sel = elements.find((e) => e.id === sid);
          if (sel) startPositions.set(sid, { x: sel.x, y: sel.y });
        }

        dragRef.current = {
          type: "move",
          startX: e.clientX,
          startY: e.clientY,
          didMove: false,
          startPositions,
        };
        (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
        return;
      }

      /* ── Click on empty canvas — check if inside a group bbox first ── */
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        const sx = e.clientX - rect.left;
        const sy = e.clientY - rect.top;

        // Collect all group IDs from elements
        const groupIds = [
          ...new Set(
            elements
              .filter((el) => el.groupId != null)
              .map((el) => el.groupId as number),
          ),
        ];
        for (const gid of groupIds) {
          const groupEls = elements.filter((el) => el.groupId === gid);
          const bbox = computeBBox(groupEls);
          if (
            sx >= bbox.x &&
            sx <= bbox.x + bbox.w &&
            sy >= bbox.y &&
            sy <= bbox.y + bbox.h
          ) {
            const idsToSelect = groupEls.map((el) => el.id);
            setActiveGroupId(gid);
            bringToFront(idsToSelect);
            setSelectedIds(idsToSelect);
            setEditingId(null);
            setPopupPos({ x: sx, y: sy });
            const startPositions = new Map<number, { x: number; y: number }>();
            for (const sid of idsToSelect) {
              const sel = elements.find((el) => el.id === sid);
              if (sel) startPositions.set(sid, { x: sel.x, y: sel.y });
            }
            dragRef.current = {
              type: "move",
              startX: e.clientX,
              startY: e.clientY,
              didMove: false,
              startPositions,
            };
            (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
            return;
          }
        }
      }

      /* ── Click on truly empty canvas — start marquee ── */
      setSelectedIds([]);
      setActiveGroupId(null);
      setPopupPos(null);
      setEditingId(null);
      setRotationTooltip(null);
      if (rect) {
        const sx = e.clientX - rect.left;
        const sy = e.clientY - rect.top;
        dragRef.current = {
          type: "marquee",
          startX: e.clientX,
          startY: e.clientY,
          didMove: false,
        };
        setMarquee({ startX: sx, startY: sy, currentX: sx, currentY: sy });
      }
    },
    [
      elements,
      selectedIds,
      editingId,
      activeGroupId,
      bringToFront,
      getElScreenCenter,
    ],
  );

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d) return;
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;
    if (dx !== 0 || dy !== 0) d.didMove = true;

    /* ── Marquee ── */
    if (d.type === "marquee") {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        setMarquee((prev) =>
          prev
            ? {
                ...prev,
                currentX: e.clientX - rect.left,
                currentY: e.clientY - rect.top,
              }
            : null,
        );
      }
      return;
    }

    /* ── Move ── */
    if (d.type === "move" && d.startPositions) {
      setElements((prev) =>
        prev.map((el) => {
          const start = d.startPositions!.get(el.id);
          if (!start) return el;
          return { ...el, x: start.x + dx, y: start.y + dy };
        }),
      );
      return;
    }

    /* ── Resize ── */
    if (d.type === "resize") {
      if (d.startElements && d.groupBBox) {
        const dir = d.handleDir!;
        const ob = d.groupBBox;
        let newBX = ob.x,
          newBY = ob.y,
          newBW = ob.w,
          newBH = ob.h;
        if (dir.includes("e")) newBW = Math.max(40, ob.w + dx);
        if (dir.includes("w")) {
          newBW = Math.max(40, ob.w - dx);
          newBX = ob.x + ob.w - newBW;
        }
        if (dir.includes("s")) newBH = Math.max(20, ob.h + dy);
        if (dir.includes("n")) {
          newBH = Math.max(20, ob.h - dy);
          newBY = ob.y + ob.h - newBH;
        }
        if (["nw", "ne", "se", "sw"].includes(dir)) {
          const ar = d.aspectRatio ?? ob.w / ob.h;
          if (Math.abs(dx) > Math.abs(dy)) {
            newBH = newBW / ar;
            if (dir.includes("n")) newBY = ob.y + ob.h - newBH;
          } else {
            newBW = newBH * ar;
            if (dir.includes("w")) newBX = ob.x + ob.w - newBW;
          }
        }
        const scaleX = newBW / ob.w;
        const scaleY = newBH / ob.h;
        setElements((prev) =>
          prev.map((el) => {
            const start = d.startElements!.get(el.id);
            if (!start) return el;
            return {
              ...el,
              x: newBX + (start.x - ob.x) * scaleX,
              y: newBY + (start.y - ob.y) * scaleY,
              w: Math.max(10, start.w * scaleX),
              h: Math.max(10, start.h * scaleY),
              ...(start.fontSize != null
                ? {
                    fontSize: Math.max(
                      6,
                      start.fontSize * Math.min(scaleX, scaleY),
                    ),
                  }
                : {}),
            };
          }),
        );
      } else if (d.handleDir && d.nodeId != null) {
        const dir = d.handleDir;
        const isCorner = ["nw", "ne", "se", "sw"].includes(dir);
        const isSideOnly = dir === "e" || dir === "w";
        const rad = ((d.startRotation ?? 0) * Math.PI) / 180;
        const cosR = Math.cos(rad),
          sinR = Math.sin(rad);
        const localDx = dx * cosR + dy * sinR;
        const localDy = -dx * sinR + dy * cosR;

        setElements((prev) =>
          prev.map((el) => {
            if (el.id !== d.nodeId) return el;
            const isText = el.type === "text";

            if (isText && isCorner) {
              const scale = Math.max(
                0.3,
                1 +
                  (dir.includes("e") || dir.includes("s") ? 1 : -1) *
                    (Math.abs(localDx) > Math.abs(localDy)
                      ? localDx / d.startNodeW!
                      : localDy / d.startNodeH!),
              );
              const newW = Math.max(40, d.startNodeW! * scale);
              const newH = Math.max(20, d.startNodeH! * scale);
              const newFontSize = Math.max(8, (d.startFontSize ?? 22) * scale);
              const pos = positionForFixedAnchor(
                d.startNodeX!,
                d.startNodeY!,
                d.startNodeW!,
                d.startNodeH!,
                newW,
                newH,
                dir,
                d.startRotation ?? 0,
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
              let newW = d.startNodeW!;
              if (dir === "e") newW = Math.max(40, d.startNodeW! + localDx);
              if (dir === "w") newW = Math.max(40, d.startNodeW! - localDx);
              const pos = positionForFixedAnchor(
                d.startNodeX!,
                d.startNodeY!,
                d.startNodeW!,
                d.startNodeH!,
                newW,
                d.startNodeH!,
                dir,
                d.startRotation ?? 0,
              );
              return { ...el, x: pos.x, y: pos.y, w: newW };
            }

            let newW = d.startNodeW!,
              newH = d.startNodeH!;
            if (dir.includes("e")) newW = Math.max(40, d.startNodeW! + localDx);
            if (dir.includes("w")) newW = Math.max(40, d.startNodeW! - localDx);
            if (dir.includes("s")) newH = Math.max(20, d.startNodeH! + localDy);
            if (dir.includes("n")) newH = Math.max(20, d.startNodeH! - localDy);
            if (isCorner && (el.type === "image" || e.shiftKey)) {
              const ar = d.aspectRatio ?? el.w / el.h;
              if (Math.abs(localDx) > Math.abs(localDy)) newH = newW / ar;
              else newW = newH * ar;
            }
            const pos = positionForFixedAnchor(
              d.startNodeX!,
              d.startNodeY!,
              d.startNodeW!,
              d.startNodeH!,
              newW,
              newH,
              dir,
              d.startRotation ?? 0,
            );
            return { ...el, x: pos.x, y: pos.y, w: newW, h: newH };
          }),
        );
      }
      return;
    }

    /* ── Rotate ── */
    if (d.type === "rotate") {
      if (d.startElements && d.groupBBox) {
        const csx = d.centerScreenX!;
        const csy = d.centerScreenY!;
        const currentAngle = Math.atan2(e.clientY - csy, e.clientX - csx);
        const angleDelta = (currentAngle - d.startAngle!) * (180 / Math.PI);
        let newRot = angleDelta;
        for (const snap of [0, 90, 180, 270, -90, -180, -270]) {
          if (Math.abs(newRot - snap) < 3) {
            newRot = snap;
            break;
          }
        }
        const rad = (newRot * Math.PI) / 180;
        const gcx = d.groupBBox.x + d.groupBBox.w / 2;
        const gcy = d.groupBBox.y + d.groupBBox.h / 2;
        setElements((prev) =>
          prev.map((el) => {
            const start = d.startElements!.get(el.id);
            if (!start) return el;
            const elCX = start.x + start.w / 2;
            const elCY = start.y + start.h / 2;
            const dxr = elCX - gcx;
            const dyr = elCY - gcy;
            const newCX = gcx + dxr * Math.cos(rad) - dyr * Math.sin(rad);
            const newCY = gcy + dxr * Math.sin(rad) + dyr * Math.cos(rad);
            return {
              ...el,
              x: newCX - start.w / 2,
              y: newCY - start.h / 2,
              rotation: start.rotation + newRot,
            };
          }),
        );
        d.lastRotationDelta = newRot;
        const baseGRot = d.baseGroupRotation ?? 0;
        setRotationTooltip({
          angle: Math.round((baseGRot + newRot) * 10) / 10,
          x: e.clientX,
          y: e.clientY,
        });
        setGroupRotationOverride(baseGRot + newRot);
      } else if (d.nodeId != null) {
        const currentAngle = Math.atan2(
          e.clientY - d.centerScreenY!,
          e.clientX - d.centerScreenX!,
        );
        const angleDelta = (currentAngle - d.startAngle!) * (180 / Math.PI);
        let newRot = (d.startRotation ?? 0) + angleDelta;
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
    }
  }, []);

  const onPointerUp = useCallback(
    (e: React.PointerEvent) => {
      const d = dragRef.current;
      if (d) {
        if (d.type === "marquee") {
          setMarquee((m) => {
            if (!m) return null;
            const mx1 = Math.min(m.startX, m.currentX);
            const my1 = Math.min(m.startY, m.currentY);
            const mx2 = Math.max(m.startX, m.currentX);
            const my2 = Math.max(m.startY, m.currentY);
            if (mx2 - mx1 > 5 || my2 - my1 > 5) {
              const cur = elementsRef.current;
              const hit = cur.filter((el) => {
                return (
                  el.x < mx2 &&
                  el.x + el.w > mx1 &&
                  el.y < my2 &&
                  el.y + el.h > my1
                );
              });
              if (hit.length > 0) {
                setSelectedIds(hit.map((el) => el.id));
                setPopupPos({ x: m.currentX, y: m.currentY });
              }
            }
            return null;
          });
          dragRef.current = null;
          setIsDragging(false);
          setActiveGroupId(null);
          return;
        }
        if (
          d.type === "rotate" &&
          d.rotatingGroupId != null &&
          d.lastRotationDelta != null
        ) {
          const gd = groupDataRef.current.get(d.rotatingGroupId);
          if (gd) {
            gd.rotation = (d.baseGroupRotation ?? 0) + d.lastRotationDelta;
            // Sync stored center from current element positions
            const cur = elementsRef.current;
            const groupEls = cur.filter(
              (el) => el.groupId === d.rotatingGroupId,
            );
            if (groupEls.length > 0) {
              const aligned = computeAlignedBBox(groupEls, gd.rotation);
              gd.cx = aligned.cx;
              gd.cy = aligned.cy;
            }
          }
        }
        // Update stored group center after move/resize
        if ((d.type === "move" || d.type === "resize") && d.didMove) {
          const ids =
            d.type === "move" && d.startPositions
              ? [...d.startPositions.keys()]
              : d.startElements
                ? [...d.startElements.keys()]
                : [];
          if (ids.length > 0) {
            const cur = elementsRef.current;
            const firstEl = cur.find((el) => ids.includes(el.id));
            if (firstEl?.groupId != null) {
              const gd = groupDataRef.current.get(firstEl.groupId);
              if (gd) {
                const groupEls = cur.filter((el) => ids.includes(el.id));
                const aligned = computeAlignedBBox(groupEls, gd.rotation);
                gd.cx = aligned.cx;
                gd.cy = aligned.cy;
              }
            }
          }
        }
        const moved = d.didMove;
        dragRef.current = null;
        setIsDragging(false);
        setRotationTooltip(null);
        setGroupRotationOverride(null);
        if (moved) {
          const rect = canvasRef.current?.getBoundingClientRect();
          if (rect)
            setPopupPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
          setElements((cur) => {
            pushHistory(cur);
            return cur;
          });
        }
      } else {
        setRotationTooltip(null);
      }
    },
    [pushHistory],
  );

  /* ── Keyboard shortcuts (undo/redo + delete) ── */
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
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
        if (selectedIds.length > 0) {
          e.preventDefault();
          const idSet = new Set(selectedIds);
          const next = elements.filter((el) => !idSet.has(el.id));
          pushHistory(next);
          setElements(next);
          setSelectedIds([]);
          setActiveGroupId(null);
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [undo, redo, selectedIds, elements, pushHistory]);

  /* ── Double-click to enter group / edit text / open link ── */
  const onDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      const target = e.target as HTMLElement;
      const nodeEl = target.closest("[data-element-id]") as HTMLElement | null;
      if (!nodeEl) return;
      const id = Number(nodeEl.dataset.elementId);
      const el = elements.find((n) => n.id === id);

      if (
        el?.groupId != null &&
        activeGroupId === el.groupId &&
        selectedIds.length > 1
      ) {
        setSelectedIds([id]);
        e.stopPropagation();
        return;
      }

      if (el?.type === "text") {
        setEditingId(id);
        setSelectedIds([id]);
        e.stopPropagation();
      } else if (el?.type === "link" && el.href) {
        window.open(el.href, "_blank");
        e.stopPropagation();
      }
    },
    [elements, activeGroupId, selectedIds],
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

  /* ── Measure text, reflow project cards (tight stack), fit frames ── */
  const textElRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  useLayoutEffect(() => {
    if (!projectsGrid) {
      setElements((prev) => {
        const next = [...prev];
        let changed = false;
        textElRefs.current.forEach((div, id) => {
          const idx = next.findIndex((e) => e.id === id);
          if (idx < 0) return;
          const el = next[idx];
          if (el.type !== "text") return;
          const measuredH = div.offsetHeight;
          if (measuredH > 0 && Math.abs(measuredH - el.h) > 2) {
            if (
              dragRef.current?.startPositions?.has(id) ||
              dragRef.current?.nodeId === id
            )
              return;
            next[idx] = { ...el, h: measuredH };
            changed = true;
          }
        });
        return changed ? next : prev;
      });
      return;
    }

    const drag = dragRef.current;
    if (
      drag?.type === "move" ||
      drag?.type === "resize" ||
      drag?.type === "rotate"
    )
      return;
    if (editingId != null) return;

    setElements((prev) => {
      let next = prev.map((e) => ({ ...e }));
      let changed = false;

      const setH = (id: number, h: number) => {
        const idx = next.findIndex((e) => e.id === id);
        if (idx < 0) return;
        if (Math.abs(next[idx].h - h) > 1) {
          next[idx] = { ...next[idx], h };
          changed = true;
        }
      };

      textElRefs.current.forEach((div, id) => {
        const el = next.find((e) => e.id === id);
        if (!el || el.type !== "text") return;
        if (
          dragRef.current?.startPositions?.has(id) ||
          dragRef.current?.nodeId === id
        )
          return;
        const measuredH = div.offsetHeight;
        if (measuredH > 0) setH(id, measuredH);
      });

      const { V_GAP, IMG_H, IMG_PAD_BELOW, LINK_H, CARD_BOTTOM_PAD } = PG;

      const gids = new Set<number>();
      for (const e of next) if (e.groupId != null) gids.add(e.groupId);

      for (const gid of gids) {
        const group = next.filter((e) => e.groupId === gid);
        const frame = group.find((e) => e.type === "shape" && e.fill);
        if (!frame) continue;

        const cy = frame.y;
        const mobile = group
          .filter((e) => e.type !== "shape")
          .sort((a, b) => a.y - b.y);

        let cursorY = cy + IMG_H + IMG_PAD_BELOW;
        let i = 0;
        while (i < mobile.length) {
          const el = mobile[i];
          if (el.type === "image") {
            i++;
            continue;
          }
          if (el.type === "link") {
            let j = i;
            while (j < mobile.length && mobile[j].type === "link") j++;
            const links = mobile.slice(i, j);
            const linkY = cursorY;
            for (const link of links) {
              const idx = next.findIndex((e) => e.id === link.id);
              if (idx >= 0 && Math.abs(next[idx].y - linkY) > 0.5) {
                next[idx] = { ...next[idx], y: linkY };
                changed = true;
              }
            }
            cursorY += LINK_H + CARD_BOTTOM_PAD;
            i = j;
            continue;
          }
          const idx = next.findIndex((e) => e.id === el.id);
          if (idx >= 0) {
            const h = next[idx].h;
            if (Math.abs(next[idx].y - cursorY) > 0.5) {
              next[idx] = { ...next[idx], y: cursorY };
              changed = true;
            }
            cursorY += h + V_GAP;
          }
          i++;
        }

        const frameIdx = next.findIndex((e) => e.id === frame.id);
        if (frameIdx >= 0) {
          const newH = Math.max(PG.IMG_H + 100, cursorY - cy);
          if (Math.abs(next[frameIdx].h - newH) > 1) {
            next[frameIdx] = { ...next[frameIdx], h: newH };
            changed = true;
          }
        }
      }

      return changed ? next : prev;
    });
  }, [elements, projectsGrid, editingId]);

  /* ── Text toolbar helpers ── */
  const singleSelectedEl =
    selectedIds.length === 1
      ? elements.find((el) => el.id === selectedIds[0])
      : undefined;
  const showTextToolbar = singleSelectedEl?.type === "text";
  const [fontSelectOpen, setFontSelectOpen] = useState(false);

  const updateTextProp = useCallback(
    (prop: "fontSize" | "fontFamily" | "fontColor", value: string | number) => {
      if (selectedIds.length !== 1) return;
      const sid = selectedIds[0];
      setElements((prev) => {
        const next = prev.map((el) =>
          el.id === sid ? { ...el, [prop]: value } : el,
        );
        pushHistory(next);
        return next;
      });
    },
    [selectedIds, pushHistory],
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

  /* ── Group / Ungroup ── */
  const handleGroup = useCallback(() => {
    const gid = nextGroupIdRef.current++;
    const groupEls = elements.filter((el) => selectedIds.includes(el.id));
    const bbox = computeBBox(groupEls);
    groupDataRef.current.set(gid, {
      rotation: 0,
      cx: bbox.x + bbox.w / 2,
      cy: bbox.y + bbox.h / 2,
    });
    setElements((prev) => {
      const idSet = new Set(selectedIds);
      const next = prev.map((el) =>
        idSet.has(el.id) ? { ...el, groupId: gid } : el,
      );
      pushHistory(next);
      return next;
    });
    setActiveGroupId(gid);
  }, [selectedIds, elements, pushHistory]);

  const handleUngroup = useCallback(() => {
    const sel = elements.filter((el) => selectedIds.includes(el.id));
    const gid = sel[0]?.groupId;
    if (gid != null) groupDataRef.current.delete(gid);
    setElements((prev) => {
      const idSet = new Set(selectedIds);
      const next = prev.map((el) =>
        idSet.has(el.id) ? { ...el, groupId: undefined } : el,
      );
      pushHistory(next);
      return next;
    });
    setActiveGroupId(null);
  }, [selectedIds, elements, pushHistory]);

  /* ── Multi-selection bounding box ── */
  const multiBBox = (() => {
    if (selectedIds.length <= 1) return null;
    const selectedEls = elements.filter((el) => selectedIds.includes(el.id));
    const gd =
      activeGroupId != null ? groupDataRef.current.get(activeGroupId) : null;
    const rot = groupRotationOverride ?? gd?.rotation ?? 0;
    if (rot !== 0) {
      const aligned = computeAlignedBBox(selectedEls, rot);
      return { ...aligned, rotation: rot };
    }
    const aabb = computeBBox(selectedEls);
    return { ...aabb, rotation: 0 };
  })();

  const allSameGroup = (() => {
    if (selectedIds.length < 2) return false;
    const sel = elements.filter((el) => selectedIds.includes(el.id));
    return sel.every(
      (el) => el.groupId != null && el.groupId === sel[0].groupId,
    );
  })();

  /* ── Render ── */
  return (
    <div className="art-container">
      {/* ── Text Toolbar (sticky within panel scroll so it stays visible) ── */}
      {showTextToolbar && singleSelectedEl && (
        <div className="art-text-toolbar-sticky">
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
                  singleSelectedEl.fontFamily ??
                  "'Playfair Display', Georgia, serif"
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
                    Math.max(8, (singleSelectedEl.fontSize ?? 22) - 2),
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
                value={Math.round(singleSelectedEl.fontSize ?? 22)}
                onChange={(e) =>
                  updateTextProp(
                    "fontSize",
                    Math.max(8, Number(e.target.value)),
                  )
                }
              />
              <button
                className="art-toolbar-btn"
                onClick={() =>
                  updateTextProp(
                    "fontSize",
                    Math.min(200, (singleSelectedEl.fontSize ?? 22) + 2),
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
                value={singleSelectedEl.fontColor ?? "#1a1a1a"}
                onChange={(e) => updateTextProp("fontColor", e.target.value)}
              />
            </div>
          </div>
        </div>
      )}
      <div className="art-body">
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
          style={
            projectsGrid
              ? {
                  minHeight: Math.max(
                    projectsGridMinCanvasHeight,
                    canvasHeight ?? 0,
                  ),
                  height: Math.max(
                    projectsGridMinCanvasHeight,
                    canvasHeight ?? 0,
                  ),
                }
              : canvasHeight
                ? { minHeight: canvasHeight, height: canvasHeight }
                : undefined
          }
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onDoubleClick={onDoubleClick}
        >
          {elements.map((el) => {
            const isTilting = tiltingIds.has(el.id);
            const cfg = tiltConfigRef.current?.[el.id];
            const isTiltText = isTilting && cfg?.isText;
            const isSelected = selectedIds.includes(el.id);
            const isSingleSelected = selectedIds.length === 1 && isSelected;
            return (
              <div
                key={el.id}
                ref={(node) => registerElRef(el.id, node)}
                className={`art-element${isSelected ? " art-element--selected" : ""}${isTilting ? " art-element--tilting" : ""}${isTiltText ? " art-element--tilt-selected" : ""}${selectedIds.length > 1 && isSelected && activeGroupId == null ? " art-element--in-selection" : ""}`}
                data-element-id={el.id}
                style={{
                  left: el.x,
                  top: el.y,
                  width: el.w,
                  height: el.type === "text" ? "auto" : el.h,
                  minHeight:
                    el.type === "text" && projectsGrid && el.groupId != null
                      ? undefined
                      : el.type === "text"
                        ? el.h
                        : undefined,
                  zIndex: el.zIndex,
                  transform: `rotate(${el.rotation}deg)`,
                }}
              >
                {/* Image */}
                {el.type === "image" && (
                  <img
                    src={
                      el.file?.startsWith("/") || el.file?.startsWith("http")
                        ? el.file
                        : `${imageFolder}/${el.file}`
                    }
                    alt=""
                    draggable={false}
                    className={
                      projectsGrid
                        ? "art-element-img art-element-img--projects-grid"
                        : "art-element-img"
                    }
                    onLoad={(e) => {
                      if (projectsGrid) return;
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
                  <ShapeSvg
                    shape={el.shape}
                    w={el.w}
                    h={el.h}
                    fill={el.fill}
                    strokeColor={el.strokeColor}
                  />
                )}

                {/* Text */}
                {el.type === "text" && (
                  <div
                    className={
                      projectsGrid && el.groupId == null
                        ? "art-text-content art-text-content--projects-page-title"
                        : projectsGrid && el.groupId != null
                          ? [
                              "art-text-content",
                              "art-text-content--projects-grid",
                              (el.fontSize ?? 22) <= 17
                                ? "art-text-content--project-desc"
                                : "",
                            ]
                              .filter(Boolean)
                              .join(" ")
                          : "art-text-content"
                    }
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

                {/* Link */}
                {el.type === "link" && (
                  <div
                    className={
                      projectsGrid && el.groupId != null
                        ? "art-link-content art-link-content--projects-grid"
                        : "art-link-content"
                    }
                    onPointerDown={(e) => {
                      if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        e.stopPropagation();
                        if (el.href) window.open(el.href, "_blank");
                      }
                    }}
                    style={{
                      fontSize: el.fontSize ?? 14,
                      fontFamily:
                        el.fontFamily ??
                        "system-ui, -apple-system, 'Segoe UI', sans-serif",
                      color: el.fontColor ?? "#0b57d0",
                    }}
                  >
                    {el.linkIcon === "website" && (
                      <svg
                        viewBox="0 0 24 24"
                        width="16"
                        height="16"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        aria-hidden
                      >
                        <circle cx="12" cy="12" r="10" />
                        <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                      </svg>
                    )}
                    {el.linkIcon === "github" && (
                      <svg
                        viewBox="0 0 24 24"
                        width="16"
                        height="16"
                        fill="currentColor"
                        aria-hidden
                      >
                        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
                      </svg>
                    )}
                    {el.content}
                  </div>
                )}

                {/* Project card */}
                {el.type === "card" &&
                  el.projectIdx != null &&
                  projects[el.projectIdx] &&
                  (() => {
                    const p = projects[el.projectIdx];
                    const slug = p.image;
                    const imgSrc = slug
                      ? PROJECT_IMAGE_SRC[slug] ?? `/projects/${slug}.png`
                      : null;
                    return (
                      <div className="art-card">
                        <div className="project-card">
                          {imgSrc && (
                            <img
                              src={imgSrc}
                              className="project-card-image"
                              alt={p.title}
                              draggable={false}
                            />
                          )}
                          <h3 className="project-card-title">{p.title}</h3>
                          <p className="project-card-description">
                            {p.description}
                          </p>
                          <div className="project-card-buttons">
                            {p.website && (
                              <a
                                href={p.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="social-btn"
                                style={cardBtnStyle}
                                onPointerDown={(e) => e.stopPropagation()}
                                onClick={(e) => e.stopPropagation()}
                              >
                                {websiteIconUrl && (
                                  <img src={websiteIconUrl} alt="web" />
                                )}{" "}
                                web
                              </a>
                            )}
                            {p.github && (
                              <a
                                href={p.github}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="social-btn"
                                style={cardBtnStyle}
                                onPointerDown={(e) => e.stopPropagation()}
                                onClick={(e) => e.stopPropagation()}
                              >
                                {githubIconUrl && (
                                  <img src={githubIconUrl} alt="git" />
                                )}{" "}
                                git
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                {/* Selection UI — single selection: full handles */}
                {(isSingleSelected || isTiltText) && (
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

                {/* Selection UI — multi selection: highlight border only (hidden in group-unit mode) */}
                {selectedIds.length > 1 &&
                  isSelected &&
                  !isTiltText &&
                  activeGroupId == null && (
                    <div
                      className="art-selection art-selection--multi"
                      style={{ pointerEvents: "none" }}
                    >
                      <div className="art-selection-box" />
                    </div>
                  )}
              </div>
            );
          })}

          {/* Multi-selection bounding box with handles */}
          {(() => {
            if (!multiBBox || selectedIds.length <= 1) return null;
            const bw = multiBBox.w + 2;
            const bh = multiBBox.h + 2;
            const rot = multiBBox.rotation;
            return (
              <div
                data-multi-bbox
                style={{
                  position: "absolute",
                  left: multiBBox.x - 1,
                  top: multiBBox.y - 1,
                  width: bw,
                  height: bh,
                  pointerEvents: "none",
                  zIndex: 99998,
                  transform: rot !== 0 ? `rotate(${rot}deg)` : undefined,
                  transformOrigin: "center center",
                }}
              >
                <div className="art-multi-bbox-border" />
                {HANDLE_DIRS.map((dir) => {
                  const pos = getHandlePosition(dir, bw, bh);
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
                    left: bw / 2,
                    top: -28,
                    height: 28,
                    pointerEvents: "none",
                  }}
                />
                <div
                  className="art-handle art-handle--rotate"
                  data-handle-dir="rotate"
                  style={{
                    left: bw / 2 - HANDLE_SIZE / 2,
                    top: -28 - HANDLE_SIZE / 2,
                    width: HANDLE_SIZE,
                    height: HANDLE_SIZE,
                    cursor: HANDLE_CURSORS.rotate,
                    pointerEvents: "auto",
                  }}
                />
              </div>
            );
          })()}

          {/* Group / Ungroup popup */}
          {selectedIds.length > 1 && multiBBox && !isDragging && popupPos && (
            <div
              className="art-group-popup"
              style={{
                position: "absolute",
                left: popupPos.x + 16,
                top: popupPos.y - 40,
                zIndex: 99999,
              }}
              onPointerDown={(e) => e.stopPropagation()}
            >
              {allSameGroup ? (
                <button className="art-group-popup-btn" onClick={handleUngroup}>
                  Ungroup
                </button>
              ) : (
                <button className="art-group-popup-btn" onClick={handleGroup}>
                  Group
                </button>
              )}
            </div>
          )}

          {/* Clickable links (absolute-positioned tabs only) */}
          {!projectsGrid &&
            links?.map((link, i) => (
              <a
                key={i}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="art-link"
                style={{
                  position: "absolute",
                  left: link.x,
                  top: link.y,
                  fontSize: link.fontSize ?? 15,
                  zIndex: 9999,
                }}
              >
                {link.icon === "website" && (
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
                )}
                {link.icon === "github" && (
                  <svg
                    viewBox="0 0 24 24"
                    width="16"
                    height="16"
                    fill="currentColor"
                  >
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
                  </svg>
                )}
                {link.label}
              </a>
            ))}

          {/* Marquee selection rectangle */}
          {marquee && (
            <div
              className="art-marquee"
              style={{
                left: Math.min(marquee.startX, marquee.currentX),
                top: Math.min(marquee.startY, marquee.currentY),
                width: Math.abs(marquee.currentX - marquee.startX),
                height: Math.abs(marquee.currentY - marquee.startY),
              }}
            />
          )}

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
    </div>
  );
}
