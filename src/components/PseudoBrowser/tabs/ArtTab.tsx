import { useRef, useState, useCallback, useEffect } from "react";

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
const HANDLE_DIRS: HandleDir[] = ["nw", "n", "ne", "e", "se", "s", "sw", "w"];

export default function ArtTab() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [elements, setElements] = useState<CanvasElement[]>(INITIAL_ELEMENTS);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [rotationTooltip, setRotationTooltip] = useState<{
    angle: number;
    x: number;
    y: number;
  } | null>(null);
  const nextIdRef = useRef(INITIAL_ELEMENTS.length + 1);
  const topZRef = useRef(INITIAL_ELEMENTS.length + 1);

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
  } | null>(null);

  /* ── Helpers ── */
  const bringToFront = useCallback((id: number) => {
    const z = ++topZRef.current;
    setElements((prev) =>
      prev.map((el) => (el.id === id ? { ...el, zIndex: z } : el)),
    );
  }, []);

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
        ...(type === "text" ? { content: "Double-click to edit" } : {}),
      };
      setElements((prev) => [...prev, newEl]);
      setSelectedId(id);
      setEditingId(null);
      return id;
    },
    [],
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
      const rad = (d.startRotation * Math.PI) / 180;
      const cosR = Math.cos(rad),
        sinR = Math.sin(rad);
      const localDx = dx * cosR + dy * sinR;
      const localDy = -dx * sinR + dy * cosR;

      setElements((prev) =>
        prev.map((el) => {
          if (el.id !== d.nodeId) return el;
          let newW = d.startNodeW,
            newH = d.startNodeH;
          if (dir.includes("e")) newW = Math.max(40, d.startNodeW + localDx);
          if (dir.includes("w")) newW = Math.max(40, d.startNodeW - localDx);
          if (dir.includes("s")) newH = Math.max(20, d.startNodeH + localDy);
          if (dir.includes("n")) newH = Math.max(20, d.startNodeH - localDy);
          if (isCorner && e.shiftKey) {
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
    dragRef.current = null;
    setRotationTooltip(null);
  }, []);

  /* ── Shift key tracking ── */
  useEffect(() => {
    const onKey = () => {}; // shift is read directly from event in onPointerMove
    window.addEventListener("keydown", onKey);
    window.addEventListener("keyup", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("keyup", onKey);
    };
  }, []);

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
  const onTextBlur = useCallback((id: number, text: string) => {
    setElements((prev) =>
      prev.map((el) => (el.id === id ? { ...el, content: text } : el)),
    );
    setEditingId(null);
  }, []);

  /* ── Render ── */
  return (
    <div className="art-container">
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
        {elements.map((el) => (
          <div
            key={el.id}
            className={`art-element${el.id === selectedId ? " art-element--selected" : ""}`}
            data-element-id={el.id}
            style={{
              left: el.x,
              top: el.y,
              width: el.w,
              height: el.h,
              zIndex: el.zIndex,
              transform: `rotate(${el.rotation}deg)`,
            }}
          >
            {/* Image */}
            {el.type === "image" && (
              <img
                src={`/art/${el.file}`}
                alt=""
                draggable={false}
                className="art-element-img"
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
                style={{ fontSize: Math.max(12, el.h * 0.4) }}
              >
                {el.content}
              </div>
            )}

            {/* Selection UI */}
            {el.id === selectedId && (
              <div className="art-selection" style={{ pointerEvents: "none" }}>
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
        ))}

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
