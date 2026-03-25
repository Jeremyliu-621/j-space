import { useRef, useState, useCallback, useEffect } from "react";

interface ImageNode {
  id: number;
  x: number;
  y: number;
  w: number;
  h: number;
  rotation: number;
  label: string;
  zIndex: number;
}

const INITIAL_NODES: ImageNode[] = [
  { id: 1, x: 120, y: 80, w: 320, h: 240, rotation: -3, label: "[IMAGE: Wildstyle burner / Leake Street, London / 2024]", zIndex: 1 },
  { id: 2, x: 520, y: 300, w: 260, h: 340, rotation: 5, label: "[IMAGE: Character portrait / Hosier Lane, Melbourne / 2023]", zIndex: 2 },
  { id: 3, x: 60, y: 420, w: 380, h: 260, rotation: -1.5, label: "[IMAGE: Abstract fill-in / Wynwood Walls, Miami / 2024]", zIndex: 3 },
  { id: 4, x: 850, y: 60, w: 280, h: 200, rotation: 4, label: "[IMAGE: Throw-up series / 5Pointz archive / 2022]", zIndex: 4 },
  { id: 5, x: 700, y: 500, w: 340, h: 280, rotation: -6, label: "[IMAGE: Stencil layer work / Brick Lane, London / 2023]", zIndex: 5 },
  { id: 6, x: 1100, y: 320, w: 240, h: 320, rotation: 2.5, label: "[IMAGE: Freehand sketch / Bushwick Collective, NYC / 2024]", zIndex: 6 },
  { id: 7, x: 380, y: 680, w: 300, h: 220, rotation: -4.5, label: "[IMAGE: Handstyle practice / local yard wall / 2024]", zIndex: 7 },
  { id: 8, x: 950, y: 620, w: 260, h: 190, rotation: 7, label: "[IMAGE: Collaboration mural / Art Basel side street / 2023]", zIndex: 8 },
];

type HandleDir = "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "rotate";

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

function getHandlePosition(
  dir: HandleDir,
  w: number,
  h: number
): { x: number; y: number } {
  const positions: Record<HandleDir, { x: number; y: number }> = {
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
  return positions[dir];
}

export default function GraffitiTab() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [nodes, setNodes] = useState<ImageNode[]>(INITIAL_NODES);
  const [camera, setCamera] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [, setTopZ] = useState(INITIAL_NODES.length + 1);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [rotationTooltip, setRotationTooltip] = useState<{ angle: number; x: number; y: number } | null>(null);

  // Drag state refs
  const dragRef = useRef<{
    type: "pan" | "move" | "resize" | "rotate";
    nodeId?: number;
    handleDir?: HandleDir;
    startX: number;
    startY: number;
    startCamX: number;
    startCamY: number;
    startNodeX: number;
    startNodeY: number;
    startNodeW: number;
    startNodeH: number;
    startRotation: number;
    startAngle: number;
    shiftHeld: boolean;
    aspectRatio: number;
    // Center of node in screen space for rotation calc
    centerScreenX: number;
    centerScreenY: number;
  } | null>(null);

  // Bring node to front
  const bringToFront = useCallback((id: number) => {
    setTopZ((z) => {
      const next = z + 1;
      setNodes((prev) =>
        prev.map((n) => (n.id === id ? { ...n, zIndex: next } : n))
      );
      return next;
    });
  }, []);

  // Get node center in screen coordinates
  const getNodeScreenCenter = useCallback(
    (node: ImageNode) => {
      const container = containerRef.current;
      if (!container) return { x: 0, y: 0 };
      const rect = container.getBoundingClientRect();
      const cx = node.x + node.w / 2;
      const cy = node.y + node.h / 2;
      return {
        x: rect.left + camera.x + cx * zoom,
        y: rect.top + camera.y + cy * zoom,
      };
    },
    [camera, zoom]
  );

  // Pointer handlers
  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      const target = e.target as HTMLElement;
      const handleEl = target.closest("[data-handle-dir]") as HTMLElement | null;
      const nodeEl = target.closest("[data-node-id]") as HTMLElement | null;
      const isOldResize = target.classList.contains("graffiti-resize-handle");

      // Handle click on selection handle
      if (handleEl && selectedId != null) {
        const dir = handleEl.dataset.handleDir as HandleDir;
        const node = nodes.find((n) => n.id === selectedId);
        if (!node) return;

        if (dir === "rotate") {
          const center = getNodeScreenCenter(node);
          const startAngle = Math.atan2(
            e.clientY - center.y,
            e.clientX - center.x
          );
          dragRef.current = {
            type: "rotate",
            nodeId: selectedId,
            handleDir: dir,
            startX: e.clientX,
            startY: e.clientY,
            startCamX: 0,
            startCamY: 0,
            startNodeX: node.x,
            startNodeY: node.y,
            startNodeW: node.w,
            startNodeH: node.h,
            startRotation: node.rotation,
            startAngle,
            shiftHeld: e.shiftKey,
            aspectRatio: node.w / node.h,
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
            startCamX: 0,
            startCamY: 0,
            startNodeX: node.x,
            startNodeY: node.y,
            startNodeW: node.w,
            startNodeH: node.h,
            startRotation: node.rotation,
            startAngle: 0,
            shiftHeld: e.shiftKey,
            aspectRatio: node.w / node.h,
            centerScreenX: 0,
            centerScreenY: 0,
          };
        }

        (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
        e.stopPropagation();
        return;
      }

      if (nodeEl && !isOldResize) {
        const id = Number(nodeEl.dataset.nodeId);
        const node = nodes.find((n) => n.id === id);
        if (!node) return;
        bringToFront(id);
        setSelectedId(id);
        dragRef.current = {
          type: "move",
          nodeId: id,
          startX: e.clientX,
          startY: e.clientY,
          startCamX: 0,
          startCamY: 0,
          startNodeX: node.x,
          startNodeY: node.y,
          startNodeW: node.w,
          startNodeH: node.h,
          startRotation: node.rotation,
          startAngle: 0,
          shiftHeld: false,
          aspectRatio: node.w / node.h,
          centerScreenX: 0,
          centerScreenY: 0,
        };
      } else if (isOldResize && nodeEl) {
        // Legacy resize handle — treat as SE resize
        const id = Number(nodeEl.dataset.nodeId);
        const node = nodes.find((n) => n.id === id);
        if (!node) return;
        bringToFront(id);
        setSelectedId(id);
        dragRef.current = {
          type: "resize",
          nodeId: id,
          handleDir: "se",
          startX: e.clientX,
          startY: e.clientY,
          startCamX: 0,
          startCamY: 0,
          startNodeX: node.x,
          startNodeY: node.y,
          startNodeW: node.w,
          startNodeH: node.h,
          startRotation: node.rotation,
          startAngle: 0,
          shiftHeld: e.shiftKey,
          aspectRatio: node.w / node.h,
          centerScreenX: 0,
          centerScreenY: 0,
        };
      } else {
        // Click on empty space — deselect + pan
        setSelectedId(null);
        setRotationTooltip(null);
        dragRef.current = {
          type: "pan",
          startX: e.clientX,
          startY: e.clientY,
          startCamX: camera.x,
          startCamY: camera.y,
          startNodeX: 0,
          startNodeY: 0,
          startNodeW: 0,
          startNodeH: 0,
          startRotation: 0,
          startAngle: 0,
          shiftHeld: false,
          aspectRatio: 1,
          centerScreenX: 0,
          centerScreenY: 0,
        };
      }

      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    },
    [nodes, camera, bringToFront, selectedId, getNodeScreenCenter]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      const d = dragRef.current;
      if (!d) return;
      const dx = e.clientX - d.startX;
      const dy = e.clientY - d.startY;

      if (d.type === "pan") {
        setCamera({ x: d.startCamX + dx, y: d.startCamY + dy });
      } else if (d.type === "move" && d.nodeId != null) {
        setNodes((prev) =>
          prev.map((n) =>
            n.id === d.nodeId
              ? { ...n, x: d.startNodeX + dx / zoom, y: d.startNodeY + dy / zoom }
              : n
          )
        );
      } else if (d.type === "resize" && d.nodeId != null && d.handleDir) {
        const dir = d.handleDir;
        const sdx = dx / zoom;
        const sdy = dy / zoom;
        const isShift = e.shiftKey;
        const isCorner = ["nw", "ne", "se", "sw"].includes(dir);

        setNodes((prev) =>
          prev.map((n) => {
            if (n.id !== d.nodeId) return n;

            let newX = d.startNodeX;
            let newY = d.startNodeY;
            let newW = d.startNodeW;
            let newH = d.startNodeH;

            // Apply resize based on direction
            if (dir.includes("e")) {
              newW = Math.max(80, d.startNodeW + sdx);
            }
            if (dir.includes("w")) {
              const dw = Math.min(sdx, d.startNodeW - 80);
              newX = d.startNodeX + dw;
              newW = d.startNodeW - dw;
            }
            if (dir.includes("s")) {
              newH = Math.max(60, d.startNodeH + sdy);
            }
            if (dir.includes("n")) {
              const dh = Math.min(sdy, d.startNodeH - 60);
              newY = d.startNodeY + dh;
              newH = d.startNodeH - dh;
            }

            // Proportional constraint on corners when shift held
            if (isCorner && isShift) {
              const ar = d.aspectRatio;
              if (Math.abs(sdx) > Math.abs(sdy)) {
                newH = newW / ar;
                if (dir.includes("n")) {
                  newY = d.startNodeY + d.startNodeH - newH;
                }
              } else {
                newW = newH * ar;
                if (dir.includes("w")) {
                  newX = d.startNodeX + d.startNodeW - newW;
                }
              }
            }

            return { ...n, x: newX, y: newY, w: newW, h: newH };
          })
        );
      } else if (d.type === "rotate" && d.nodeId != null) {
        const currentAngle = Math.atan2(
          e.clientY - d.centerScreenY,
          e.clientX - d.centerScreenX
        );
        const angleDelta = (currentAngle - d.startAngle) * (180 / Math.PI);
        let newRotation = d.startRotation + angleDelta;

        // Snap to 0/90/180/270 if within 3 degrees
        const snapAngles = [0, 90, 180, 270, -90, -180, -270];
        for (const snap of snapAngles) {
          if (Math.abs(newRotation - snap) < 3) {
            newRotation = snap;
            break;
          }
        }

        setNodes((prev) =>
          prev.map((n) =>
            n.id === d.nodeId ? { ...n, rotation: newRotation } : n
          )
        );

        setRotationTooltip({
          angle: Math.round(newRotation * 10) / 10,
          x: e.clientX,
          y: e.clientY,
        });
      }
    },
    [zoom]
  );

  const onPointerUp = useCallback(() => {
    dragRef.current = null;
    setRotationTooltip(null);
  }, []);

  // Track shift key changes during drag
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (dragRef.current) {
        dragRef.current.shiftHeld = e.shiftKey;
      }
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("keyup", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("keyup", onKey);
    };
  }, []);

  // Zoom with scroll wheel
  const onWheel = useCallback((e: React.WheelEvent) => {
    e.stopPropagation();
    setZoom((z) => Math.min(2, Math.max(0.4, z - e.deltaY * 0.001)));
  }, []);

  const resetView = useCallback(() => {
    setCamera({ x: 0, y: 0 });
    setZoom(1);
  }, []);

  const HANDLE_SIZE = 8;
  const HANDLE_DIRS: HandleDir[] = ["nw", "n", "ne", "e", "se", "s", "sw", "w"];

  return (
    <div
      ref={containerRef}
      className="graffiti-canvas"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onWheel={onWheel}
      style={{ width: "100%", height: "100%", position: "relative", overflow: "hidden", touchAction: "none" }}
    >
      {/* Dot pattern background */}
      <div className="graffiti-dots" />

      {/* Transformed canvas layer */}
      <div
        className="graffiti-world"
        style={{
          transform: `translate(${camera.x}px, ${camera.y}px) scale(${zoom})`,
          transformOrigin: "0 0",
        }}
      >
        {nodes.map((node) => (
          <div
            key={node.id}
            className={`graffiti-node${node.id === selectedId ? " graffiti-node--selected" : ""}`}
            data-node-id={node.id}
            style={{
              left: node.x,
              top: node.y,
              width: node.w,
              height: node.h,
              zIndex: node.zIndex,
              transform: `rotate(${node.rotation}deg)`,
            }}
          >
            <div className="graffiti-node-inner">
              <span className="graffiti-node-label">{node.label}</span>
            </div>

            {/* Selection UI — only on selected node */}
            {node.id === selectedId && (
              <div className="graffiti-selection" style={{ pointerEvents: "none" }}>
                {/* Blue bounding box */}
                <div className="graffiti-selection-box" />

                {/* 8 resize handles */}
                {HANDLE_DIRS.map((dir) => {
                  const pos = getHandlePosition(dir, node.w, node.h);
                  return (
                    <div
                      key={dir}
                      className="graffiti-handle"
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

                {/* Rotation handle — line + circle above top center */}
                <div
                  className="graffiti-rotate-line"
                  style={{
                    left: node.w / 2,
                    top: -28,
                    height: 28,
                    pointerEvents: "none",
                  }}
                />
                <div
                  className="graffiti-handle graffiti-handle--rotate"
                  data-handle-dir="rotate"
                  style={{
                    left: node.w / 2 - HANDLE_SIZE / 2,
                    top: -28 - HANDLE_SIZE / 2,
                    width: HANDLE_SIZE,
                    height: HANDLE_SIZE,
                    cursor: HANDLE_CURSORS.rotate,
                    pointerEvents: "auto",
                  }}
                />
              </div>
            )}

            <div className="graffiti-resize-handle" />
          </div>
        ))}
      </div>

      {/* Rotation tooltip */}
      {rotationTooltip && (
        <div
          className="graffiti-rotation-tooltip"
          style={{
            left: rotationTooltip.x + 16,
            top: rotationTooltip.y - 12,
          }}
        >
          {rotationTooltip.angle}°
        </div>
      )}

      {/* HUD */}
      <div className="graffiti-hud">
        <span className="graffiti-hud-zoom">{Math.round(zoom * 100)}%</span>
        <button className="graffiti-hud-reset" onClick={resetView}>
          Reset
        </button>
      </div>
    </div>
  );
}
