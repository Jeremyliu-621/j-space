import { useRef, useEffect, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

const OBJECT_DATA = [
  { name: "Twisted torus knot", label: "Distortion study — after Anish Kapoor's material inversions" },
  { name: "Crumpled plane", label: "Wabi-sabi form — the beauty in imperfect surfaces" },
  { name: "Geodesic fragment", label: "Buckminster Fuller obsession — tensegrity in geometry" },
  { name: "Möbius surface", label: "Topology sketch — single-sided manifold, infinite loop" },
  { name: "Low-poly erosion", label: "Entropy object — digital decay as sculptural process" },
];

export default function ArtTab() {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<{
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    controls: OrbitControls;
    objects: THREE.Mesh[];
    raycaster: THREE.Raycaster;
    mouse: THREE.Vector2;
    animId: number;
    hoveredIdx: number;
  } | null>(null);
  const [label, setLabel] = useState<{ text: string; x: number; y: number } | null>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const w = container.clientWidth;
    const h = container.clientHeight;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0a);
    scene.fog = new THREE.FogExp2(0x0a0a0a, 0.04);

    // Camera
    const camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 100);
    camera.position.set(0, 2, 8);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.8;
    container.appendChild(renderer.domElement);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 3;
    controls.maxDistance = 15;
    controls.maxPolarAngle = Math.PI * 0.85;
    controls.target.set(0, 0.5, 0);

    // Floor
    const floorGeo = new THREE.PlaneGeometry(30, 30);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x111111,
      roughness: 0.95,
      metalness: 0,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -1.5;
    floor.receiveShadow = true;
    scene.add(floor);

    // Lighting — warm key, cool fill, low ambient
    const ambient = new THREE.AmbientLight(0x222222, 0.3);
    scene.add(ambient);

    const keyLight = new THREE.PointLight(0xffeedd, 40, 20);
    keyLight.position.set(3, 5, 2);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(1024, 1024);
    scene.add(keyLight);

    const fillLight = new THREE.PointLight(0xaabbff, 15, 18);
    fillLight.position.set(-4, 3, -1);
    scene.add(fillLight);

    // Objects
    const objects: THREE.Mesh[] = [];
    const baseMat = (color: number) =>
      new THREE.MeshStandardMaterial({
        color,
        roughness: 0.85,
        metalness: 0.05,
      });

    // 1. Twisted torus knot
    const tk = new THREE.Mesh(
      new THREE.TorusKnotGeometry(0.6, 0.18, 128, 24, 3, 5),
      baseMat(0x1a1a1a)
    );
    tk.position.set(-2.5, 0.8, -1);
    tk.castShadow = true;
    scene.add(tk);
    objects.push(tk);

    // 2. Crumpled plane — deformed plane
    const cpGeo = new THREE.PlaneGeometry(1.8, 1.8, 32, 32);
    const posAttr = cpGeo.attributes.position;
    for (let i = 0; i < posAttr.count; i++) {
      const x = posAttr.getX(i);
      const y = posAttr.getY(i);
      posAttr.setZ(
        i,
        Math.sin(x * 3.7) * Math.cos(y * 2.9) * 0.3 +
          Math.sin(x * 7 + y * 5) * 0.08
      );
    }
    cpGeo.computeVertexNormals();
    const cp = new THREE.Mesh(cpGeo, baseMat(0x333333));
    cp.position.set(0, 1.2, 0.5);
    cp.rotation.set(-0.3, 0.4, 0.1);
    cp.castShadow = true;
    scene.add(cp);
    objects.push(cp);

    // 3. Geodesic fragment — icosahedron detail 1, partial
    const icoGeo = new THREE.IcosahedronGeometry(0.8, 1);
    const ico = new THREE.Mesh(icoGeo, baseMat(0xd4d0c8));
    ico.position.set(2.2, 0.4, -0.5);
    ico.castShadow = true;
    scene.add(ico);
    objects.push(ico);

    // 4. Möbius-like surface (parametric via buffer geometry)
    const mobiusVerts: number[] = [];
    const mobiusIdx: number[] = [];
    const segs = 120;
    const strips = 20;
    for (let i = 0; i <= segs; i++) {
      const t = (i / segs) * Math.PI * 2;
      for (let j = 0; j <= strips; j++) {
        const s = (j / strips - 0.5) * 0.7;
        const x = (1 + s * Math.cos(t / 2)) * Math.cos(t);
        const y = (1 + s * Math.cos(t / 2)) * Math.sin(t);
        const z = s * Math.sin(t / 2);
        mobiusVerts.push(x, z, y);
      }
    }
    for (let i = 0; i < segs; i++) {
      for (let j = 0; j < strips; j++) {
        const a = i * (strips + 1) + j;
        const b = a + strips + 1;
        mobiusIdx.push(a, b, a + 1, b, b + 1, a + 1);
      }
    }
    const mGeo = new THREE.BufferGeometry();
    mGeo.setAttribute("position", new THREE.Float32BufferAttribute(mobiusVerts, 3));
    mGeo.setIndex(mobiusIdx);
    mGeo.computeVertexNormals();
    const mobius = new THREE.Mesh(
      mGeo,
      new THREE.MeshStandardMaterial({
        color: 0x2a2a2a,
        roughness: 0.9,
        metalness: 0,
        side: THREE.DoubleSide,
      })
    );
    mobius.scale.setScalar(0.55);
    mobius.position.set(-0.8, -0.3, -2);
    mobius.castShadow = true;
    scene.add(mobius);
    objects.push(mobius);

    // 5. Low-poly eroded form — dodecahedron with vertex noise
    const dodGeo = new THREE.DodecahedronGeometry(0.65, 0);
    const dodPos = dodGeo.attributes.position;
    for (let i = 0; i < dodPos.count; i++) {
      dodPos.setX(i, dodPos.getX(i) + (Math.random() - 0.5) * 0.15);
      dodPos.setY(i, dodPos.getY(i) + (Math.random() - 0.5) * 0.15);
      dodPos.setZ(i, dodPos.getZ(i) + (Math.random() - 0.5) * 0.15);
    }
    dodGeo.computeVertexNormals();
    const dod = new THREE.Mesh(dodGeo, baseMat(0x444444));
    dod.position.set(1.5, 1.8, 1.5);
    dod.castShadow = true;
    scene.add(dod);
    objects.push(dod);

    // Raycasting
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2(-999, -999);

    const state = {
      renderer,
      scene,
      camera,
      controls,
      objects,
      raycaster,
      mouse,
      animId: 0,
      hoveredIdx: -1,
    };
    sceneRef.current = state;

    // Click handler
    const onClick = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      state.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      state.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      state.raycaster.setFromCamera(state.mouse, state.camera);
      const hits = state.raycaster.intersectObjects(state.objects);
      if (hits.length > 0) {
        const idx = state.objects.indexOf(hits[0].object as THREE.Mesh);
        if (idx >= 0) {
          const obj = state.objects[idx];
          const pos = obj.position.clone().project(state.camera);
          const sx = ((pos.x + 1) / 2) * rect.width;
          const sy = ((-pos.y + 1) / 2) * rect.height;
          setLabel((prev) =>
            prev && prev.text === OBJECT_DATA[idx].label
              ? null
              : { text: OBJECT_DATA[idx].label, x: sx, y: sy }
          );
        }
      } else {
        setLabel(null);
      }
    };

    // Hover handler
    const onMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      state.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      state.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    };

    container.addEventListener("click", onClick);
    container.addEventListener("mousemove", onMove);

    // Animation
    const animate = () => {
      state.animId = requestAnimationFrame(animate);
      const t = performance.now() * 0.001;

      // Subtle float/rotate
      objects.forEach((obj, i) => {
        obj.position.y += Math.sin(t * 0.5 + i * 1.7) * 0.0005;
        obj.rotation.y += 0.001;
      });

      // Hover highlight
      state.raycaster.setFromCamera(state.mouse, state.camera);
      const hits = state.raycaster.intersectObjects(state.objects);
      const hitIdx = hits.length > 0
        ? state.objects.indexOf(hits[0].object as THREE.Mesh)
        : -1;

      if (hitIdx !== state.hoveredIdx) {
        // Reset old
        if (state.hoveredIdx >= 0) {
          const mat = state.objects[state.hoveredIdx].material as THREE.MeshStandardMaterial;
          mat.emissive.setHex(0x000000);
        }
        // Set new
        if (hitIdx >= 0) {
          const mat = state.objects[hitIdx].material as THREE.MeshStandardMaterial;
          mat.emissive.setHex(0x222222);
        }
        state.hoveredIdx = hitIdx;
      }

      state.controls.update();
      state.renderer.render(state.scene, state.camera);
    };
    animate();

    // Resize
    const onResize = () => {
      const nw = container.clientWidth;
      const nh = container.clientHeight;
      state.camera.aspect = nw / nh;
      state.camera.updateProjectionMatrix();
      state.renderer.setSize(nw, nh);
    };
    const ro = new ResizeObserver(onResize);
    ro.observe(container);

    return () => {
      cancelAnimationFrame(state.animId);
      container.removeEventListener("click", onClick);
      container.removeEventListener("mousemove", onMove);
      ro.disconnect();
      state.renderer.dispose();
      state.controls.dispose();
      if (container.contains(state.renderer.domElement)) {
        container.removeChild(state.renderer.domElement);
      }
    };
  }, []);

  return (
    <div ref={mountRef} className="art-scene" style={{ width: "100%", height: "100%", position: "relative" }}>
      {label && (
        <div
          className="art-label"
          style={{
            left: Math.min(label.x, (mountRef.current?.clientWidth ?? 600) - 260),
            top: label.y + 12,
          }}
        >
          {label.text}
        </div>
      )}
    </div>
  );
}
