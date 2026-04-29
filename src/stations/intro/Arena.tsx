import { useRef, useState, useEffect, Suspense, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import {
  AGENT_SKIN_TONES,
  AGENT_HAIR_COLORS,
  AGENT_TOP_COLORS,
  AGENT_BOTTOM_COLORS,
  AGENT_SHOE_COLORS,
  OUTLINE_COLOR,
  TINT_TARGET,
  FURNITURE_TINT,
  hashSeed,
  pick,
} from './palette';

/**
 * A self-contained mini iso office scene — one Canvas with one agent and a
 * handful of GLB furniture pieces, viewed from straw's [14:16:19] iso angle.
 * IntroStation renders four of these, one anchored at each corner of the
 * viewport (with intentional bleed so they're partially cut off by the
 * viewport edges — like glimpsing a room from outside).
 */

const cursorRef = { current: { x: 0, y: 0 } };

if (typeof window !== 'undefined') {
  window.addEventListener('mousemove', (e) => {
    cursorRef.current.x = (e.clientX / window.innerWidth) * 2 - 1;
    cursorRef.current.y = (e.clientY / window.innerHeight) * 2 - 1;
  }, { passive: true });
}

// ---------------------------------------------------------------------------
// Procedural voxel agent — same as straw's AgentCharacter, ported.
// ---------------------------------------------------------------------------

function BoxWithEdges({
  size,
  position,
  color,
}: {
  size: [number, number, number];
  position: [number, number, number];
  color: string;
}) {
  const geom = useMemo(() => new THREE.BoxGeometry(...size), [size[0], size[1], size[2]]);
  const edges = useMemo(() => new THREE.EdgesGeometry(geom, 1), [geom]);
  return (
    <group position={position}>
      <mesh geometry={geom}>
        <meshLambertMaterial color={color} />
      </mesh>
      <lineSegments geometry={edges}>
        <lineBasicMaterial color={OUTLINE_COLOR} />
      </lineSegments>
    </group>
  );
}

function VoxelAgent({ seed = 'jeremy' }: { seed?: string }) {
  const headRef = useRef<THREE.Group>(null);
  const torsoRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);

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

  useFrame(() => {
    const cx = cursorRef.current.x;
    const cy = cursorRef.current.y;
    if (headRef.current) {
      const targetYaw = THREE.MathUtils.clamp(cx * 0.7, -1.0, 1.0);
      const targetPitch = THREE.MathUtils.clamp(-cy * 0.4, -0.4, 0.4);
      headRef.current.rotation.y += (targetYaw - headRef.current.rotation.y) * 0.12;
      headRef.current.rotation.x += (targetPitch - headRef.current.rotation.x) * 0.12;
    }
    if (torsoRef.current) {
      torsoRef.current.rotation.z += (cx * 0.06 - torsoRef.current.rotation.z) * 0.06;
    }
    if (leftArmRef.current) {
      leftArmRef.current.rotation.x += (-cx * 0.1 - leftArmRef.current.rotation.x) * 0.08;
    }
    if (rightArmRef.current) {
      rightArmRef.current.rotation.x += (cx * 0.1 - rightArmRef.current.rotation.x) * 0.08;
    }
  });

  return (
    <group>
      <group ref={headRef} position={[0, 75, 0]}>
        <BoxWithEdges size={[22, 22, 22]} position={[0, 10, 0]} color={colors.skin} />
        <BoxWithEdges size={[24, 6, 24]} position={[0, 22, 0]} color={colors.hair} />
        <mesh position={[-5, 11, 11.5]}>
          <boxGeometry args={[4, 4, 1]} />
          <meshBasicMaterial color="#1a1a1a" />
        </mesh>
        <mesh position={[5, 11, 11.5]}>
          <boxGeometry args={[4, 4, 1]} />
          <meshBasicMaterial color="#1a1a1a" />
        </mesh>
      </group>
      <group ref={torsoRef} position={[0, 58, 0]}>
        <BoxWithEdges size={[20, 28, 14]} position={[0, 0, 0]} color={colors.top} />
      </group>
      <group ref={leftArmRef} position={[-14, 68, 0]}>
        <BoxWithEdges size={[8, 24, 10]} position={[0, -12, 0]} color={colors.top} />
        <BoxWithEdges size={[7, 6, 8]} position={[0, -26, 0]} color={colors.skin} />
      </group>
      <group ref={rightArmRef} position={[14, 68, 0]}>
        <BoxWithEdges size={[8, 24, 10]} position={[0, -12, 0]} color={colors.top} />
        <BoxWithEdges size={[7, 6, 8]} position={[0, -26, 0]} color={colors.skin} />
      </group>
      <group position={[-5, 44, 0]}>
        <BoxWithEdges size={[9, 22, 10]} position={[0, -12, 0]} color={colors.bottom} />
        <BoxWithEdges size={[9, 6, 14]} position={[0, -26, 2]} color={colors.shoes} />
      </group>
      <group position={[5, 44, 0]}>
        <BoxWithEdges size={[9, 22, 10]} position={[0, -12, 0]} color={colors.bottom} />
        <BoxWithEdges size={[9, 6, 14]} position={[0, -26, 2]} color={colors.shoes} />
      </group>
    </group>
  );
}

// ---------------------------------------------------------------------------
// GLB furniture loader with our adapted tinting + black edge overlay.
// ---------------------------------------------------------------------------

function GLBFurniture({
  url,
  position,
  rotation = [0, 0, 0],
  scale = 1,
  tint,
}: {
  url: string;
  position: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  tint?: string | null;
}) {
  const { scene } = useGLTF(url);
  const groupRef = useRef<THREE.Group>(null);
  const cloned = useMemo(() => scene.clone(true), [scene]);

  useEffect(() => {
    const g = groupRef.current;
    if (!g) return;
    g.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (!mesh.isMesh) return;
      const mat = mesh.material as THREE.MeshStandardMaterial;
      if (mat && mat.color) {
        if (tint) {
          mat.color = new THREE.Color(tint).lerp(new THREE.Color(TINT_TARGET), 0.25);
        } else {
          mat.color.lerp(new THREE.Color(TINT_TARGET), 0.2);
        }
        mat.needsUpdate = true;
      }
      if (mesh.geometry && !mesh.userData.__hasEdge) {
        const edges = new THREE.LineSegments(
          new THREE.EdgesGeometry(mesh.geometry, 18),
          new THREE.LineBasicMaterial({ color: OUTLINE_COLOR }),
        );
        mesh.add(edges);
        mesh.userData.__hasEdge = true;
      }
    });
  }, [tint, cloned]);

  return (
    <group ref={groupRef} position={position} rotation={rotation} scale={scale}>
      <primitive object={cloned} />
    </group>
  );
}

// ---------------------------------------------------------------------------
// Iso camera rig — straw's [14:16:19] direction. lookAt origin so the
// arena's center stays at canvas center.
// ---------------------------------------------------------------------------

function IsoCameraRig() {
  const { camera } = useThree();
  useEffect(() => {
    camera.position.set(140, 160, 190);
    camera.lookAt(0, 0, 0);
    camera.up.set(0, 1, 0);
    type AnyCam = typeof camera & { zoom?: number; updateProjectionMatrix: () => void };
    const ac = camera as AnyCam;
    if (typeof ac.zoom === 'number') ac.zoom = 2.8;
    ac.updateProjectionMatrix();
  }, [camera]);
  return null;
}

// ---------------------------------------------------------------------------
// One full mini-arena — agent + a small set of furniture, sized to fit the
// canvas. Each variant arranges different furniture so the four corner
// arenas don't read as identical clones.
// ---------------------------------------------------------------------------

type Variant = 'desk' | 'lounge' | 'kitchen' | 'study';

function ArenaScene({ variant, seed }: { variant: Variant; seed: string }) {
  return (
    <>
      <IsoCameraRig />
      <ambientLight intensity={0.7} />
      <directionalLight position={[10, 18, 14]} intensity={1.0} />
      <directionalLight position={[-8, 4, -6]} intensity={0.35} />

      {/* Agent — center of this arena, follows cursor */}
      <group position={[0, 0, 0]} scale={0.5}>
        <VoxelAgent seed={seed} />
      </group>

      <Suspense fallback={null}>
        {variant === 'desk' && (
          <>
            <GLBFurniture
              url="/office-assets/models/furniture/desk.glb"
              position={[-50, 0, -10]}
              rotation={[0, Math.PI / 4, 0]}
              scale={36}
              tint={FURNITURE_TINT.desk}
            />
            <GLBFurniture
              url="/office-assets/models/furniture/computerScreen.glb"
              position={[-52, 22, -10]}
              rotation={[0, Math.PI / 4, 0]}
              scale={20}
              tint={FURNITURE_TINT.computer}
            />
            <GLBFurniture
              url="/office-assets/models/furniture/chairDesk.glb"
              position={[-22, 0, 30]}
              rotation={[0, -Math.PI / 4, 0]}
              scale={26}
              tint={FURNITURE_TINT.chair}
            />
            <GLBFurniture
              url="/office-assets/models/furniture/lampRoundFloor.glb"
              position={[60, 0, -50]}
              scale={34}
              tint={FURNITURE_TINT.lamp}
            />
          </>
        )}

        {variant === 'lounge' && (
          <>
            <GLBFurniture
              url="/office-assets/models/furniture/loungeSofa.glb"
              position={[-50, 0, -20]}
              rotation={[0, Math.PI / 4, 0]}
              scale={32}
              tint={FURNITURE_TINT.chair}
            />
            <GLBFurniture
              url="/office-assets/models/furniture/tableCoffee.glb"
              position={[10, 0, 30]}
              scale={26}
              tint={FURNITURE_TINT.desk}
            />
            <GLBFurniture
              url="/office-assets/models/furniture/pottedPlant.glb"
              position={[60, 0, -10]}
              scale={28}
              tint={null}
            />
          </>
        )}

        {variant === 'kitchen' && (
          <>
            <GLBFurniture
              url="/office-assets/models/furniture/kitchenCabinet.glb"
              position={[-50, 0, -30]}
              rotation={[0, Math.PI / 4, 0]}
              scale={32}
              tint={FURNITURE_TINT.desk}
            />
            <GLBFurniture
              url="/office-assets/models/furniture/kitchenFridgeSmall.glb"
              position={[60, 0, -40]}
              rotation={[0, -Math.PI / 6, 0]}
              scale={32}
              tint={FURNITURE_TINT.lamp}
            />
            <GLBFurniture
              url="/office-assets/models/furniture/kitchenCoffeeMachine.glb"
              position={[-10, 0, 40]}
              scale={22}
              tint={FURNITURE_TINT.computer}
            />
          </>
        )}

        {variant === 'study' && (
          <>
            <GLBFurniture
              url="/office-assets/models/furniture/bookcaseClosed.glb"
              position={[-60, 0, -20]}
              rotation={[0, Math.PI / 4, 0]}
              scale={36}
              tint={FURNITURE_TINT.bookshelf}
            />
            <GLBFurniture
              url="/office-assets/models/furniture/loungeDesignChair.glb"
              position={[40, 0, 10]}
              rotation={[0, -Math.PI / 4, 0]}
              scale={28}
              tint={FURNITURE_TINT.chair}
            />
            <GLBFurniture
              url="/office-assets/models/furniture/lampRoundFloor.glb"
              position={[20, 0, -40]}
              scale={32}
              tint={FURNITURE_TINT.lamp}
            />
          </>
        )}
      </Suspense>
    </>
  );
}

// ---------------------------------------------------------------------------
// Public component — Arena with own Canvas + ResizeObserver. Caller wraps
// it in a positioned container; we just fill our wrapper.
// ---------------------------------------------------------------------------

export default function Arena({
  variant = 'desk',
  seed = 'jeremy',
}: {
  variant?: Variant;
  seed?: string;
}) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const update = () => {
      const r = el.getBoundingClientRect();
      setSize({ w: Math.max(1, Math.round(r.width)), h: Math.max(1, Math.round(r.height)) });
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={wrapperRef} style={{ width: '100%', height: '100%' }}>
      {size && (
        <Canvas
          orthographic
          camera={{ position: [140, 160, 190], zoom: 2.8, near: 1, far: 2000 }}
          dpr={[1, 2]}
          frameloop="always"
          gl={{ alpha: true, antialias: true }}
          style={{
            background: 'transparent',
            width: `${size.w}px`,
            height: `${size.h}px`,
          }}
        >
          <Suspense fallback={null}>
            <ArenaScene variant={variant} seed={seed} />
          </Suspense>
        </Canvas>
      )}
    </div>
  );
}

// Preload everything used across all four arena variants
const PRELOAD = [
  'desk', 'computerScreen', 'chairDesk', 'lampRoundFloor',
  'loungeSofa', 'tableCoffee', 'pottedPlant',
  'kitchenCabinet', 'kitchenFridgeSmall', 'kitchenCoffeeMachine',
  'bookcaseClosed', 'loungeDesignChair',
];
PRELOAD.forEach((n) => useGLTF.preload(`/office-assets/models/furniture/${n}.glb`));
