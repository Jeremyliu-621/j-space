import { useEffect, useRef, useState } from 'react';
import {
  AGENT_SKIN_TONES,
  AGENT_HAIR_COLORS,
  AGENT_TOP_COLORS,
  AGENT_BOTTOM_COLORS,
  AGENT_SHOE_COLORS,
  OUTLINE_COLOR,
  hashSeed,
  pick,
} from './palette';

/**
 * 2D SVG voxel-style character that follows the cursor — port of straw's
 * AgentCharacter.tsx into static SVG. Same proportions, same black-outline-
 * on-color aesthetic from straw's BWEffects pass.
 *
 * Animation uses requestAnimationFrame + SVG transform attributes — simple,
 * smooth, and sidesteps the WebGL/R3F rendering issues we hit.
 *
 * Coordinate system (y goes DOWN, x goes RIGHT):
 *   y=0 at the agent's "neck base" (top of torso)
 *   feet at y=88, head top at y=-32
 */
interface CursorAgentProps {
  seed?: string;
  /** CSS px from the agent's feet to the bottom of the parent. */
  bottomOffset?: number;
  /** Visual size scaling factor — 1.0 = ~150px tall. */
  scale?: number;
}

export default function CursorAgent({
  seed = 'jeremy',
  bottomOffset = 60,
  scale = 1,
}: CursorAgentProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const headRef = useRef<SVGGElement>(null);
  const torsoRef = useRef<SVGGElement>(null);
  const leftArmRef = useRef<SVGGElement>(null);
  const rightArmRef = useRef<SVGGElement>(null);
  const eyeLPupilRef = useRef<SVGRectElement>(null);
  const eyeRPupilRef = useRef<SVGRectElement>(null);
  const wholeBodyRef = useRef<SVGGElement>(null);

  const [colors] = useState(() => {
    const h = hashSeed(seed);
    return {
      skin: pick(AGENT_SKIN_TONES, h),
      hair: pick(AGENT_HAIR_COLORS, h >>> 5),
      top: pick(AGENT_TOP_COLORS, h >>> 9),
      bottom: pick(AGENT_BOTTOM_COLORS, h >>> 13),
      shoes: pick(AGENT_SHOE_COLORS, h >>> 15),
    };
  });

  useEffect(() => {
    const cursor = { x: 0, y: 0 };
    const smoothed = { headYaw: 0, headPitch: 0, lean: 0, armL: 0, armR: 0, eyeX: 0, eyeY: 0, drift: 0 };

    function onMove(e: MouseEvent) {
      const wrapper = wrapperRef.current;
      if (!wrapper) return;
      const r = wrapper.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      // Normalize so a sweep across the page = ~[-1.5, 1.5]
      cursor.x = (e.clientX - cx) / (window.innerWidth / 2);
      cursor.y = (e.clientY - cy) / (window.innerHeight / 2);
    }
    window.addEventListener('mousemove', onMove, { passive: true });

    let raf = 0;
    let frame = 0;
    function tick() {
      frame++;
      const cx = Math.max(-1.5, Math.min(1.5, cursor.x));
      const cy = Math.max(-1, Math.min(1, cursor.y));

      const headYawTarget = cx * 16;
      const headPitchTarget = cy * 6;
      smoothed.headYaw += (headYawTarget - smoothed.headYaw) * 0.12;
      smoothed.headPitch += (headPitchTarget - smoothed.headPitch) * 0.12;

      smoothed.lean += (cx * 3 - smoothed.lean) * 0.06;
      smoothed.armL += (-cx * 6 - smoothed.armL) * 0.07;
      smoothed.armR += (cx * 6 - smoothed.armR) * 0.07;

      // Eye pupils dart toward cursor direction (in head-local coords).
      smoothed.eyeX += (cx * 1.5 - smoothed.eyeX) * 0.18;
      smoothed.eyeY += (cy * 1.0 - smoothed.eyeY) * 0.18;

      // Subtle horizontal drift toward cursor + breathing bob
      smoothed.drift += (cx * 4 - smoothed.drift) * 0.04;
      const breath = Math.sin(frame * 0.025) * 0.5;

      if (wholeBodyRef.current) {
        wholeBodyRef.current.setAttribute(
          'transform',
          `translate(${smoothed.drift} ${breath})`,
        );
      }
      // Head pivots around the neck (0, 0)
      if (headRef.current) {
        headRef.current.setAttribute(
          'transform',
          `rotate(${smoothed.headYaw} 0 0) translate(0 ${smoothed.headPitch * 0.15})`,
        );
      }
      if (torsoRef.current) {
        torsoRef.current.setAttribute(
          'transform',
          `rotate(${smoothed.lean * 0.4} 0 14)`,
        );
      }
      if (leftArmRef.current) {
        leftArmRef.current.setAttribute(
          'transform',
          `rotate(${smoothed.armL} -10 4)`,
        );
      }
      if (rightArmRef.current) {
        rightArmRef.current.setAttribute(
          'transform',
          `rotate(${smoothed.armR} 10 4)`,
        );
      }
      if (eyeLPupilRef.current) {
        eyeLPupilRef.current.setAttribute('x', String(-6.5 + smoothed.eyeX));
        eyeLPupilRef.current.setAttribute('y', String(-19.5 + smoothed.eyeY));
      }
      if (eyeRPupilRef.current) {
        eyeRPupilRef.current.setAttribute('x', String(2.5 + smoothed.eyeX));
        eyeRPupilRef.current.setAttribute('y', String(-19.5 + smoothed.eyeY));
      }

      raf = requestAnimationFrame(tick);
    }
    tick();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('mousemove', onMove);
    };
  }, []);

  const stroke = OUTLINE_COLOR;
  const sw = 1.2;

  // Final size: roughly 130 SVG units tall × 60 wide. Display size
  // scales linearly with `scale` prop — at 1.0, ~180px tall on screen.
  const dispW = 110 * scale;
  const dispH = 200 * scale;

  return (
    <div
      ref={wrapperRef}
      style={{
        position: 'absolute',
        left: '50%',
        bottom: bottomOffset,
        transform: 'translateX(-50%)',
        width: dispW,
        height: dispH,
        pointerEvents: 'none',
        zIndex: 1,
      }}
    >
      <svg
        viewBox="-30 -42 60 100"
        width="100%"
        height="100%"
        style={{ overflow: 'visible' }}
      >
        <g ref={wholeBodyRef}>
          {/* LEGS — drawn first so torso/arms overlap on top.
              Coords: torso bottom is y=22, legs from y=22 → y=44, shoes y=44 → y=50 */}
          <g>
            {/* Left leg */}
            <rect x="-7" y="22" width="6" height="22" fill={colors.bottom} stroke={stroke} strokeWidth={sw} />
            {/* Left shoe */}
            <rect x="-7.5" y="44" width="7" height="6" fill={colors.shoes} stroke={stroke} strokeWidth={sw} />
            {/* Right leg */}
            <rect x="1" y="22" width="6" height="22" fill={colors.bottom} stroke={stroke} strokeWidth={sw} />
            {/* Right shoe */}
            <rect x="0.5" y="44" width="7" height="6" fill={colors.shoes} stroke={stroke} strokeWidth={sw} />
          </g>

          {/* TORSO — origin at the NECK BASE (top of torso). Pivots around y=14
              (mid-torso) for a subtle lean. */}
          <g ref={torsoRef}>
            <rect x="-9" y="0" width="18" height="22" fill={colors.top} stroke={stroke} strokeWidth={sw} />
          </g>

          {/* ARMS — drawn AFTER torso so they're slightly in front of it */}
          <g ref={leftArmRef} style={{ transformOrigin: '-10px 4px' }}>
            <rect x="-15" y="2" width="6" height="20" fill={colors.top} stroke={stroke} strokeWidth={sw} />
            {/* Hand */}
            <rect x="-15" y="22" width="6" height="5" fill={colors.skin} stroke={stroke} strokeWidth={sw} />
          </g>
          <g ref={rightArmRef} style={{ transformOrigin: '10px 4px' }}>
            <rect x="9" y="2" width="6" height="20" fill={colors.top} stroke={stroke} strokeWidth={sw} />
            <rect x="9" y="22" width="6" height="5" fill={colors.skin} stroke={stroke} strokeWidth={sw} />
          </g>

          {/* HEAD — pivots around the neck (0, 0). */}
          <g ref={headRef}>
            {/* Neck */}
            <rect x="-3" y="-3" width="6" height="3" fill={colors.skin} stroke={stroke} strokeWidth={sw} />
            {/* Head box */}
            <rect x="-9" y="-25" width="18" height="22" fill={colors.skin} stroke={stroke} strokeWidth={sw} />
            {/* Hair (sits on top of head, slight overhang on each side) */}
            <rect x="-10" y="-30" width="20" height="6" fill={colors.hair} stroke={stroke} strokeWidth={sw} />
            {/* Eye sockets — small white squares with dark pupils that move */}
            <rect x="-7" y="-20" width="4" height="4" fill="#fff" stroke={stroke} strokeWidth="0.7" />
            <rect ref={eyeLPupilRef} x="-6.5" y="-19.5" width="2" height="2" fill="#1a1a1a" />
            <rect x="3" y="-20" width="4" height="4" fill="#fff" stroke={stroke} strokeWidth="0.7" />
            <rect ref={eyeRPupilRef} x="3.5" y="-19.5" width="2" height="2" fill="#1a1a1a" />
            {/* Mouth — tiny line */}
            <rect x="-2" y="-9" width="4" height="0.8" fill={stroke} />
          </g>
        </g>
      </svg>
    </div>
  );
}
