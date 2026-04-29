import { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
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
 * Procedural voxel-style agent character — replicates straw's AgentCharacter
 * geometry but with cursor-following animation. No GLB load, just primitive
 * boxes. Receives the live `cursor` ref (NDC-style 2D position, x∈[-1,1],
 * y∈[-1,1]) and rotates the head + leans the body toward it.
 *
 * Black `EdgesGeometry` outlines on every body part to mirror BWEffects'
 * polygon-outline aesthetic.
 */
interface CursorAgentProps {
  /** Stable seed used to derive skin/clothing colors. */
  seed?: string;
  /** Ref carrying live normalized cursor position (set by parent). */
  cursorRef: React.RefObject<{ x: number; y: number }>;
}

export default function CursorAgent({ seed = 'jeremy', cursorRef }: CursorAgentProps) {
  const groupRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const torsoRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const { viewport } = useThree();
  // DEBUG: log mount + viewport
  console.log('[CursorAgent] mount, viewport:', viewport.width, viewport.height);

  // Stable per-seed colors so the agent looks the same on every reload.
  const colors = useMemo(() => {
    const h = hashSeed(seed);
    return {
      skin: pick(AGENT_SKIN_TONES, h),
      hair: pick(AGENT_HAIR_COLORS, h >>> 5),
      top: pick(AGENT_TOP_COLORS, h >>> 9),
      bottom: pick(AGENT_BOTTOM_COLORS, h >>> 13),
      shoes: pick(AGENT_SHOE_COLORS, h >>> 15),
    };
  }, [seed]);

  // Idle frame counter — drives the very subtle breathing bob.
  const frame = useRef(0);

  useFrame(() => {
    frame.current += 1;
    if (!groupRef.current) return;

    // Cursor in normalized device coords [-1, 1].
    const cx = cursorRef.current?.x ?? 0;
    const cy = cursorRef.current?.y ?? 0;

    // Head yaw + pitch toward cursor. Cap angles so the head doesn't twist
    // beyond shoulder.
    if (headRef.current) {
      const targetYaw = THREE.MathUtils.clamp(cx * 0.7, -Math.PI / 2.5, Math.PI / 2.5);
      const targetPitch = THREE.MathUtils.clamp(-cy * 0.4, -0.4, 0.4);
      headRef.current.rotation.y += (targetYaw - headRef.current.rotation.y) * 0.12;
      headRef.current.rotation.x += (targetPitch - headRef.current.rotation.x) * 0.12;
    }

    // Torso leans subtly with the cursor — adds aliveness without rotating
    // the whole body.
    if (torsoRef.current) {
      const targetLean = cx * 0.08;
      torsoRef.current.rotation.z += (targetLean - torsoRef.current.rotation.z) * 0.08;
    }

    // Idle breath — torso bobs ~1px on a slow sine.
    const breath = Math.sin(frame.current * 0.025) * 0.4;
    if (groupRef.current) {
      groupRef.current.position.y = breath;
    }

    // Arms drift slightly with the lean (counter-rotate).
    if (leftArmRef.current) {
      const t = -cx * 0.15;
      leftArmRef.current.rotation.x += (t - leftArmRef.current.rotation.x) * 0.08;
    }
    if (rightArmRef.current) {
      const t = cx * 0.15;
      rightArmRef.current.rotation.x += (t - rightArmRef.current.rotation.x) * 0.08;
    }
  });

  // The agent is sized in straw's "world units" where the body ~120 units
  // tall. We want it visually around 1/4 of viewport height, so scale by
  // viewport-relative factor.
  const scale = viewport.height / 6 / 120;

  return (
    <group ref={groupRef} scale={[scale, scale, scale]} position={[0, -viewport.height / 4, 0]}>
      {/* Head + hair + eyes */}
      <group ref={headRef} position={[0, 75, 0]}>
        <BoxWithEdges size={[22, 22, 22]} position={[0, 10, 0]} color={colors.skin} />
        <BoxWithEdges size={[24, 6, 24]} position={[0, 22, 0]} color={colors.hair} />
        {/* Eyes — basic material, no outline (too small to outline cleanly) */}
        <mesh position={[-5, 11, 11.5]}>
          <boxGeometry args={[4, 4, 1]} />
          <meshBasicMaterial color="#1a1a1a" />
        </mesh>
        <mesh position={[5, 11, 11.5]}>
          <boxGeometry args={[4, 4, 1]} />
          <meshBasicMaterial color="#1a1a1a" />
        </mesh>
      </group>

      {/* Torso */}
      <group ref={torsoRef} position={[0, 58, 0]}>
        <BoxWithEdges size={[20, 28, 14]} position={[0, 0, 0]} color={colors.top} />
      </group>

      {/* Left arm */}
      <group ref={leftArmRef} position={[-14, 68, 0]}>
        <BoxWithEdges size={[8, 24, 10]} position={[0, -12, 0]} color={colors.top} />
        <BoxWithEdges size={[7, 6, 8]} position={[0, -26, 0]} color={colors.skin} />
      </group>

      {/* Right arm */}
      <group ref={rightArmRef} position={[14, 68, 0]}>
        <BoxWithEdges size={[8, 24, 10]} position={[0, -12, 0]} color={colors.top} />
        <BoxWithEdges size={[7, 6, 8]} position={[0, -26, 0]} color={colors.skin} />
      </group>

      {/* Left leg */}
      <group position={[-5, 44, 0]}>
        <BoxWithEdges size={[9, 22, 10]} position={[0, -12, 0]} color={colors.bottom} />
        <BoxWithEdges size={[9, 6, 14]} position={[0, -26, 2]} color={colors.shoes} />
      </group>

      {/* Right leg */}
      <group position={[5, 44, 0]}>
        <BoxWithEdges size={[9, 22, 10]} position={[0, -12, 0]} color={colors.bottom} />
        <BoxWithEdges size={[9, 6, 14]} position={[0, -26, 2]} color={colors.shoes} />
      </group>
    </group>
  );
}

/**
 * A single box mesh with a black `EdgesGeometry` outline overlay — the core
 * primitive of the BW-effects-inspired aesthetic.
 */
function BoxWithEdges({
  size,
  position,
  color,
}: {
  size: [number, number, number];
  position: [number, number, number];
  color: string;
}) {
  // Memoize the geometry so re-renders don't allocate fresh GPU buffers.
  const geom = useMemo(() => new THREE.BoxGeometry(...size), [size[0], size[1], size[2]]);
  const edgesGeom = useMemo(() => new THREE.EdgesGeometry(geom, 1), [geom]);

  return (
    <group position={position}>
      <mesh geometry={geom}>
        <meshLambertMaterial color={color} />
      </mesh>
      <lineSegments geometry={edgesGeom} renderOrder={2}>
        <lineBasicMaterial color={OUTLINE_COLOR} />
      </lineSegments>
    </group>
  );
}
