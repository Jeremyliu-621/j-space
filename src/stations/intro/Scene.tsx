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

const cursorRef = { current: { x: 0, y: 0 } };

if (typeof window !== 'undefined') {
  window.addEventListener('mousemove', (e) => {
    cursorRef.current.x = (e.clientX / window.innerWidth) * 2 - 1;
    cursorRef.current.y = (e.clientY / window.innerHeight) * 2 - 1;
  }, { passive: true });
}

// ---------------------------------------------------------------------------
// AGENT — procedural voxel character ported directly from straw's AgentCharacter.
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
        <lineBasicMaterial color={OUTLINE_COLOR} linewidth={1} />
      </lineSegments>
    </group>
  );
}

function VoxelAgent({ seed = 'jeremy' }: { seed?: string }) {
  const groupRef = useRef<THREE.Group>(null);
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

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const cx = cursorRef.current.x;
    const cy = cursorRef.current.y;
    if (headRef.current) {
      const targetYaw = THREE.MathUtils.clamp(cx * 0.7, -1.0, 1.0);
      const targetPitch = THREE.MathUtils.clamp(-cy * 0.4, -0.4, 0.4);
      headRef.current.rotation.y += (targetYaw - headRef.current.rotation.y) * 0.12;
      headRef.current.rotation.x += (targetPitch - headRef.current.rotation.x) * 0.12;
    }
    if (torsoRef.current) {
      const lean = cx * 0.08;
      torsoRef.current.rotation.z += (lean - torsoRef.current.rotation.z) * 0.06;
    }
    if (leftArmRef.current) {
      const a = -cx * 0.12;
      leftArmRef.current.rotation.x += (a - leftArmRef.current.rotation.x) * 0.08;
    }
    if (rightArmRef.current) {
      const a = cx * 0.12;
      rightArmRef.current.rotation.x += (a - rightArmRef.current.rotation.x) * 0.08;
    }
    if (groupRef.current) {
      groupRef.current.position.y = Math.sin(t * 1.5) * 0.5;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Head + hair + eyes */}
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
      {/* Torso */}
      <group ref={torsoRef} position={[0, 58, 0]}>
        <BoxWithEdges size={[20, 28, 14]} position={[0, 0, 0]} color={colors.top} />
      </group>
      {/* Arms */}
      <group ref={leftArmRef} position={[-14, 68, 0]}>
        <BoxWithEdges size={[8, 24, 10]} position={[0, -12, 0]} color={colors.top} />
        <BoxWithEdges size={[7, 6, 8]} position={[0, -26, 0]} color={colors.skin} />
      </group>
      <group ref={rightArmRef} position={[14, 68, 0]}>
        <BoxWithEdges size={[8, 24, 10]} position={[0, -12, 0]} color={colors.top} />
        <BoxWithEdges size={[7, 6, 8]} position={[0, -26, 0]} color={colors.skin} />
      </group>
      {/* Legs */}
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
// FURNITURE — load straw's GLBs from /public/office-assets/. Tint adapted
// for our gray-blue theme. Black `EdgesGeometry` outline added in mesh
// traversal — same look as straw's BWEffects.
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

  useEffect(() => {
    const g = groupRef.current;
    if (!g) return;
    g.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (!mesh.isMesh) return;
      // Apply tint, lerping original color toward our TINT_TARGET so it sits
      // on the gray-blue panel without clashing.
      const mat = mesh.material as THREE.MeshStandardMaterial;
      if (mat && mat.color) {
        if (tint) {
          mat.color = new THREE.Color(tint).lerp(new THREE.Color(TINT_TARGET), 0.25);
        } else {
          mat.color.lerp(new THREE.Color(TINT_TARGET), 0.2);
        }
        mat.needsUpdate = true;
      }
      // Add black edge outline overlay
      if (mesh.geometry && !mesh.userData.__hasEdge) {
        const edges = new THREE.LineSegments(
          new THREE.EdgesGeometry(mesh.geometry, 18),
          new THREE.LineBasicMaterial({ color: OUTLINE_COLOR }),
        );
        mesh.add(edges);
        mesh.userData.__hasEdge = true;
      }
    });
  }, [scene, tint]);

  // Clone scene so each instance is independent
  const cloned = useMemo(() => scene.clone(true), [scene]);

  return (
    <group ref={groupRef} position={position} rotation={rotation} scale={scale}>
      <primitive object={cloned} />
    </group>
  );
}

// ---------------------------------------------------------------------------
// SCENE COMPOSITION
// ---------------------------------------------------------------------------

/**
 * Camera rig — straw's exact isometric preset, scaled up to match our world
 * units. Straw's preset (`position [14,16,19], zoom 22, target [0,0,0]`) is
 * tuned for objects sized ~0.2 world units; we keep the same direction +
 * proportions but multiply the position out so our larger meshes fit.
 */
/**
 * Camera rig — straw's exact isometric direction (14:16:19), positioned far
 * enough away to fit our object scale. Looks at a point ABOVE the floor so
 * the 3D scene composes below the central panel rather than colliding with it.
 */
function IsoCameraRig() {
  const { camera } = useThree();
  useEffect(() => {
    // Iso direction vector (matches straw's [14, 16, 19] proportions).
    // We shift BOTH camera and target up the same amount so the camera-to-
    // target vector stays iso-aligned while the world's screen-center moves
    // up — which puts our floor-level objects in the bottom half of the view.
    // Iso direction (matches straw's [14:16:19]).
    const iso: [number, number, number] = [140, 160, 190];
    // yShift sets where the world's screen-center sits in world Y. The
    // visible world Y range is [yShift - halfVisibleY, yShift + halfVisibleY].
    // We pick yShift so the floor (y=0) lands at the BOTTOM edge of the
    // canvas — the office sits on a floor at screen-bottom, agent above.
    const yShift = 50;
    camera.position.set(iso[0], iso[1] + yShift, iso[2]);
    camera.lookAt(0, yShift, 0);
    camera.up.set(0, 1, 0);
    type AnyCam = typeof camera & { zoom?: number; updateProjectionMatrix: () => void };
    const ac = camera as AnyCam;
    if (typeof ac.zoom === 'number') ac.zoom = 2.6;
    ac.updateProjectionMatrix();
  }, [camera]);
  return null;
}

function SceneContent() {
  // World coords are now CAMERA-CENTERED at origin (iso looks at 0,0,0).
  // Place objects on a notional floor at y=0, with the agent at the center
  // and furniture spread around it on the same plane.

  return (
    <>
      <IsoCameraRig />

      <ambientLight intensity={0.7} />
      {/* Key light from upper-front-right (matches iso camera angle) */}
      <directionalLight position={[10, 18, 14]} intensity={1.0} />
      {/* Fill from opposite side */}
      <directionalLight position={[-8, 4, -6]} intensity={0.35} />

      {/* AGENT — center of the scene, slightly forward of origin */}
      <group position={[0, 0, 20]} scale={0.5}>
        <VoxelAgent seed="jeremy" />
      </group>

      {/* OFFICE FURNITURE — tight cluster around the agent on the iso "floor".
          Coords in world units; iso projects back-left → upper-left on screen. */}

      {/* LEFT workstation cluster: lamp behind, desk + computer + chair.
          Positions tuned so all four read as one workstation when projected
          to iso, without overlapping the central agent. */}
      <Suspense fallback={null}>
        <GLBFurniture
          url="/office-assets/models/furniture/lampRoundFloor.glb"
          position={[-130, 0, -10]}
          scale={36}
          tint={FURNITURE_TINT.lamp}
        />
        <GLBFurniture
          url="/office-assets/models/furniture/desk.glb"
          position={[-100, 0, 30]}
          rotation={[0, Math.PI / 4, 0]}
          scale={32}
          tint={FURNITURE_TINT.desk}
        />
        <GLBFurniture
          url="/office-assets/models/furniture/computerScreen.glb"
          position={[-102, 18, 30]}
          rotation={[0, Math.PI / 4, 0]}
          scale={18}
          tint={FURNITURE_TINT.computer}
        />
        <GLBFurniture
          url="/office-assets/models/furniture/chairDesk.glb"
          position={[-72, 0, 55]}
          rotation={[0, -Math.PI / 4, 0]}
          scale={24}
          tint={FURNITURE_TINT.chair}
        />
      </Suspense>

      {/* RIGHT cluster: bookshelf back, potted plant front */}
      <Suspense fallback={null}>
        <GLBFurniture
          url="/office-assets/models/furniture/bookcaseClosed.glb"
          position={[100, 0, -40]}
          rotation={[0, -Math.PI / 6, 0]}
          scale={34}
          tint={FURNITURE_TINT.bookshelf}
        />
        <GLBFurniture
          url="/office-assets/models/furniture/pottedPlant.glb"
          position={[90, 0, 40]}
          scale={28}
          tint={null}
        />
      </Suspense>
    </>
  );
}

export default function Scene() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);

  // Manual ResizeObserver — R3F's built-in observer is unreliable when the
  // station's parent has `content-visibility: auto` (scroll snap stations).
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
    <div
      ref={wrapperRef}
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        // Above the body::before noise overlay (z-index 9999) so the WebGL
        // composition isn't multiplied/darkened by it.
        zIndex: 10000,
      }}
    >
      {size && (
        <Canvas
          orthographic
          camera={{ position: [140, 210, 190], zoom: 2.6, near: 1, far: 2000 }}
          dpr={[1, 2]}
          frameloop="always"
          gl={{ alpha: true, antialias: true, preserveDrawingBuffer: false }}
          style={{
            background: 'transparent',
            width: `${size.w}px`,
            height: `${size.h}px`,
          }}
        >
          <Suspense fallback={null}>
            <SceneContent />
          </Suspense>
        </Canvas>
      )}
    </div>
  );
}

// Preload GLBs so the user doesn't see a pop-in
useGLTF.preload('/office-assets/models/furniture/desk.glb');
useGLTF.preload('/office-assets/models/furniture/chairDesk.glb');
useGLTF.preload('/office-assets/models/furniture/computerScreen.glb');
useGLTF.preload('/office-assets/models/furniture/lampRoundFloor.glb');
useGLTF.preload('/office-assets/models/furniture/bookcaseClosed.glb');
useGLTF.preload('/office-assets/models/furniture/pottedPlant.glb');
useGLTF.preload('/office-assets/models/furniture/plantSmall1.glb');
