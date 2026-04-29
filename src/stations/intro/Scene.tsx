import { useEffect, useRef } from 'react';
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
 * Plain THREE.js scene mounted into a manually-managed canvas. Bypasses
 * @react-three/fiber because v9 was failing to render in this project's
 * setup (canvas mounted, but no draw calls reached the framebuffer).
 *
 * Owns:
 *  - the canvas DOM element
 *  - the WebGLRenderer
 *  - a procedural voxel agent (boxes + outline edges)
 *  - the render loop
 *  - cursor tracking + head-tracking animation
 */
export default function Scene() {
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    // ---------- WebGL setup ----------
    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'display: block; width: 100%; height: 100%;';
    wrapper.appendChild(canvas);

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: false,  // DEBUG: opaque
      antialias: true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0xff0000, 1); // DEBUG: bright red clear color

    const scene = new THREE.Scene();

    // Orthographic camera so the agent reads as flat / pixel-style with
    // consistent screen-space size regardless of zoom level.
    const camera = new THREE.OrthographicCamera(-100, 100, 100, -100, 0.1, 1000);
    camera.position.set(0, 0, 100);
    camera.lookAt(0, 0, 0);

    // ---------- Lighting ----------
    scene.add(new THREE.AmbientLight(0xffffff, 0.85));
    const dir = new THREE.DirectionalLight(0xffffff, 0.9);
    dir.position.set(5, 10, 8);
    scene.add(dir);

    // DEBUG: hot-pink basic-material box at origin to confirm rendering
    const dbgBox = new THREE.Mesh(
      new THREE.BoxGeometry(40, 40, 40),
      new THREE.MeshBasicMaterial({ color: 0xff00ff }),
    );
    scene.add(dbgBox);
    console.log('[Scene] init complete', { sceneChildren: scene.children.length });

    // ---------- Procedural voxel agent ----------
    const seed = 'jeremy';
    const h = hashSeed(seed);
    const colors = {
      skin: pick(AGENT_SKIN_TONES, h),
      hair: pick(AGENT_HAIR_COLORS, h >>> 5),
      top: pick(AGENT_TOP_COLORS, h >>> 9),
      bottom: pick(AGENT_BOTTOM_COLORS, h >>> 13),
      shoes: pick(AGENT_SHOE_COLORS, h >>> 15),
    };

    function makeBoxWithEdges(
      w: number,
      h: number,
      d: number,
      color: string,
    ): THREE.Group {
      const g = new THREE.Group();
      const geom = new THREE.BoxGeometry(w, h, d);
      const mat = new THREE.MeshLambertMaterial({ color });
      g.add(new THREE.Mesh(geom, mat));
      const edges = new THREE.LineSegments(
        new THREE.EdgesGeometry(geom, 1),
        new THREE.LineBasicMaterial({ color: OUTLINE_COLOR }),
      );
      g.add(edges);
      return g;
    }

    const agent = new THREE.Group();

    // Head + hair + eyes (grouped so we can rotate around the neck)
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 75, 0);
    const head = makeBoxWithEdges(22, 22, 22, colors.skin);
    head.position.set(0, 10, 0);
    headGroup.add(head);
    const hair = makeBoxWithEdges(24, 6, 24, colors.hair);
    hair.position.set(0, 22, 0);
    headGroup.add(hair);
    // Eyes — small, no outline
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x1a1a1a });
    const eyeGeom = new THREE.BoxGeometry(4, 4, 1);
    const eyeL = new THREE.Mesh(eyeGeom, eyeMat);
    eyeL.position.set(-5, 11, 11.5);
    headGroup.add(eyeL);
    const eyeR = new THREE.Mesh(eyeGeom, eyeMat);
    eyeR.position.set(5, 11, 11.5);
    headGroup.add(eyeR);
    agent.add(headGroup);

    // Torso
    const torsoGroup = new THREE.Group();
    torsoGroup.position.set(0, 58, 0);
    const torso = makeBoxWithEdges(20, 28, 14, colors.top);
    torsoGroup.add(torso);
    agent.add(torsoGroup);

    // Arms
    const leftArm = new THREE.Group();
    leftArm.position.set(-14, 68, 0);
    const lUpper = makeBoxWithEdges(8, 24, 10, colors.top);
    lUpper.position.set(0, -12, 0);
    leftArm.add(lUpper);
    const lHand = makeBoxWithEdges(7, 6, 8, colors.skin);
    lHand.position.set(0, -26, 0);
    leftArm.add(lHand);
    agent.add(leftArm);

    const rightArm = new THREE.Group();
    rightArm.position.set(14, 68, 0);
    const rUpper = makeBoxWithEdges(8, 24, 10, colors.top);
    rUpper.position.set(0, -12, 0);
    rightArm.add(rUpper);
    const rHand = makeBoxWithEdges(7, 6, 8, colors.skin);
    rHand.position.set(0, -26, 0);
    rightArm.add(rHand);
    agent.add(rightArm);

    // Legs
    const leftLeg = new THREE.Group();
    leftLeg.position.set(-5, 44, 0);
    const lLeg = makeBoxWithEdges(9, 22, 10, colors.bottom);
    lLeg.position.set(0, -12, 0);
    leftLeg.add(lLeg);
    const lShoe = makeBoxWithEdges(9, 6, 14, colors.shoes);
    lShoe.position.set(0, -26, 2);
    leftLeg.add(lShoe);
    agent.add(leftLeg);

    const rightLeg = new THREE.Group();
    rightLeg.position.set(5, 44, 0);
    const rLeg = makeBoxWithEdges(9, 22, 10, colors.bottom);
    rLeg.position.set(0, -12, 0);
    rightLeg.add(rLeg);
    const rShoe = makeBoxWithEdges(9, 6, 14, colors.shoes);
    rShoe.position.set(0, -26, 2);
    rightLeg.add(rShoe);
    agent.add(rightLeg);

    scene.add(agent);

    // ---------- Cursor tracking ----------
    const cursor = { x: 0, y: 0 };
    function onMouseMove(e: MouseEvent) {
      cursor.x = (e.clientX / window.innerWidth) * 2 - 1;
      cursor.y = (e.clientY / window.innerHeight) * 2 - 1;
    }
    window.addEventListener('mousemove', onMouseMove, { passive: true });

    // ---------- Resize handling ----------
    function resize() {
      const r = wrapper!.getBoundingClientRect();
      const w = Math.max(1, Math.round(r.width));
      const h = Math.max(1, Math.round(r.height));
      renderer.setSize(w, h, false);

      // Orthographic frustum: keep agent height ~25% of viewport regardless
      // of aspect. We anchor the world by viewport HEIGHT so the agent is
      // a stable size on tall vs wide windows.
      const viewportHeight = 200; // world units visible top-to-bottom
      const aspect = w / h;
      const viewportWidth = viewportHeight * aspect;
      camera.left = -viewportWidth / 2;
      camera.right = viewportWidth / 2;
      camera.top = viewportHeight / 2;
      camera.bottom = -viewportHeight / 2;
      camera.updateProjectionMatrix();

      // Position the agent at the bottom-center (~lower third of viewport).
      // Scale set so its 120-unit body height ≈ 50 world units (1/4 of vp).
      const targetBodyHeight = viewportHeight * 0.25;
      const s = targetBodyHeight / 120;
      agent.scale.set(s, s, s);
      agent.position.y = -viewportHeight * 0.18;
    }
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrapper);

    // ---------- Render loop ----------
    let frameId = 0;
    let frame = 0;
    function tick() {
      frame++;
      // Head tracks cursor
      const targetYaw = THREE.MathUtils.clamp(cursor.x * 0.7, -1.2, 1.2);
      const targetPitch = THREE.MathUtils.clamp(-cursor.y * 0.4, -0.4, 0.4);
      headGroup.rotation.y += (targetYaw - headGroup.rotation.y) * 0.12;
      headGroup.rotation.x += (targetPitch - headGroup.rotation.x) * 0.12;

      // Torso lean
      const targetLean = cursor.x * 0.08;
      torsoGroup.rotation.z += (targetLean - torsoGroup.rotation.z) * 0.08;

      // Subtle breath on the whole body
      agent.position.x = cursor.x * 6; // tiny horizontal drift toward cursor
      // (keep y as set in resize)

      // Arms counter-rotate slightly
      const armT = -cursor.x * 0.15;
      leftArm.rotation.x += (armT - leftArm.rotation.x) * 0.08;
      rightArm.rotation.x += (-armT - rightArm.rotation.x) * 0.08;

      renderer.render(scene, camera);
      if (frame === 1 || frame === 60) {
        console.log('[Scene] render frame', frame, {
          rendererSize: renderer.getSize(new THREE.Vector2()).toArray(),
          cameraFrustum: { l: camera.left, r: camera.right, t: camera.top, b: camera.bottom },
        });
      }
      frameId = requestAnimationFrame(tick);
    }
    tick();

    // ---------- Cleanup ----------
    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('mousemove', onMouseMove);
      ro.disconnect();
      renderer.dispose();
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry?.dispose();
          if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
          else obj.material?.dispose();
        }
      });
      canvas.remove();
    };
  }, []);

  return (
    <div
      ref={wrapperRef}
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 1,
      }}
    />
  );
}
