import { useRef, useEffect } from "react";
import * as THREE from "three";

/* ── Vertex + fragment shaders for CRT screen ── */

const screenVertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const screenFragmentShader = `
  uniform float uTime;
  uniform vec2 uResolution;
  varying vec2 vUv;

  /* Barrel distortion */
  vec2 barrel(vec2 uv, float k) {
    vec2 c = uv - 0.5;
    float r2 = dot(c, c);
    return uv + c * r2 * k;
  }

  /* Pseudo-random */
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  /* Smooth noise */
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }

  void main() {
    vec2 uv = barrel(vUv, 0.18);

    /* Off-screen = black */
    if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
      gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
      return;
    }

    float t = uTime;

    /* ── Late-night public access TV look ── */

    /* Dark background with subtle blue cast */
    vec3 bgColor = vec3(0.01, 0.01, 0.03);

    /* Scrolling text rows — white/cream on dark, like a public access channel */
    float scrollSpeed = 0.06;
    float row = floor((uv.y + t * scrollSpeed) * 14.0);
    float rowFrac = fract((uv.y + t * scrollSpeed) * 14.0);

    /* Which rows have text */
    float textRow = step(0.3, hash(vec2(row, 2.0)));

    /* Character generation — blocky monospace feel */
    float charX = floor(uv.x * 36.0);
    float charOn = step(0.38, hash(vec2(charX, row))) * textRow;

    /* Some rows are "header" rows — brighter, fuller */
    float isHeader = step(0.85, hash(vec2(row, 5.0)));

    /* Text color — warm white / cream, headers slightly brighter */
    vec3 textColor = mix(
      vec3(0.65, 0.62, 0.55),  /* normal text — warm cream */
      vec3(0.85, 0.82, 0.72),  /* header text — brighter cream */
      isHeader
    );

    /* Compose base image */
    vec3 col = mix(bgColor, textColor, charOn * 0.9);

    /* Lower-third bar — persistent info bar at bottom 20% */
    float lowerThird = smoothstep(0.22, 0.20, uv.y) * smoothstep(0.0, 0.02, uv.y);
    vec3 barColor = vec3(0.08, 0.10, 0.18); /* dark blue bar */
    col = mix(col, barColor, lowerThird * 0.85);

    /* Text in lower-third — Jeremy's name area */
    float ltRow = floor(uv.y * 60.0);
    float ltCharX = floor(uv.x * 48.0);
    float ltText = step(0.5, hash(vec2(ltCharX, ltRow + 100.0)));
    float ltMask = lowerThird * step(0.08, uv.x) * step(uv.x, 0.65);
    float ltRowMask = step(0.0, uv.y) * step(uv.y, 0.18);
    col += vec3(0.7, 0.68, 0.6) * ltText * ltMask * ltRowMask * 0.6;

    /* Thin bright line at top of lower-third */
    float ltLine = smoothstep(0.0, 0.003, abs(uv.y - 0.20));
    col += vec3(0.4, 0.38, 0.3) * (1.0 - ltLine) * 0.8;

    /* ── CRT effects ── */

    /* Scan lines — fine horizontal */
    float scanLine = sin(uv.y * uResolution.y * 3.14159 * 2.0) * 0.5 + 0.5;
    col *= 0.78 + 0.22 * scanLine;

    /* Horizontal scan bar that drifts down */
    float scanBar = smoothstep(0.0, 0.015, abs(fract(uv.y - t * 0.04) - 0.5) - 0.49);
    col += vec3(0.04, 0.04, 0.05) * (1.0 - scanBar);

    /* RGB phosphor sub-pixels — shadow mask pattern */
    float px = fract(uv.x * uResolution.x * 0.5);
    float py = fract(uv.y * uResolution.y * 0.5);
    vec3 phosphor = vec3(
      smoothstep(0.0, 0.33, px) - smoothstep(0.33, 0.66, px),
      smoothstep(0.33, 0.66, px) - smoothstep(0.66, 1.0, px),
      smoothstep(0.66, 1.0, px)
    );
    /* Offset every other row for shadow mask pattern */
    float rowOffset = step(0.5, py);
    vec3 phosphor2 = vec3(
      smoothstep(0.16, 0.5, px) - smoothstep(0.5, 0.83, px),
      smoothstep(0.5, 0.83, px) - smoothstep(0.83, 1.16, px),
      smoothstep(0.83, 1.16, px) + smoothstep(0.0, 0.16, px)
    );
    phosphor = mix(phosphor, phosphor2, rowOffset);
    col *= 0.72 + 0.28 * phosphor;

    /* Flicker — irregular, not a clean sine */
    float flicker = 1.0
      - 0.025 * sin(t * 8.7 + noise(vec2(t * 3.0, 0.0)) * 6.0)
      - 0.015 * sin(t * 13.1 + 2.0)
      - 0.02 * noise(vec2(t * 5.0, uv.y * 2.0));
    col *= flicker;

    /* Vignette — heavier at edges for CRT look */
    vec2 vig = uv - 0.5;
    col *= 1.0 - dot(vig, vig) * 1.6;

    /* Phosphor glow bleed — slight bloom past screen edge */
    float edgeDist = min(min(uv.x, 1.0 - uv.x), min(uv.y, 1.0 - uv.y));
    float bloom = smoothstep(0.06, 0.0, edgeDist) * 0.15;
    col += col * bloom;

    /* Static / noise */
    float n = hash(uv * uResolution + t * 137.0) * 0.035;
    col += n;

    /* Slight warm color cast — CRT phosphors lean warm */
    col *= vec3(1.04, 1.0, 0.94);

    gl_FragColor = vec4(col, 1.0);
  }
`;

/* ── Procedural plastic bump normal map ── */
function createPlasticBumpMap(size: number = 256): THREE.Texture {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;

  /* Fill with medium gray (flat = 128) */
  ctx.fillStyle = "#808080";
  ctx.fillRect(0, 0, size, size);

  /* Add fine noise grain — simulates injection-molded plastic texture */
  const imageData = ctx.getImageData(0, 0, size, size);
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const grain = (Math.random() - 0.5) * 18;
    data[i] = Math.max(0, Math.min(255, 128 + grain));
    data[i + 1] = Math.max(0, Math.min(255, 128 + grain));
    data[i + 2] = 255; /* Z component stays high for subtle bump */
  }
  ctx.putImageData(imageData, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 4);
  return texture;
}

export default function TVHero() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let w = container.clientWidth;
    let h = container.clientHeight;

    /* ── Scene — no background, transparent ── */
    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(38, w / h, 0.1, 50);
    camera.position.set(0, 0.25, 4.4);
    camera.lookAt(0, 0.05, 0);

    /* Transparent renderer */
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });
    renderer.setClearColor(0x000000, 0);
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.85;
    container.appendChild(renderer.domElement);

    /* ── Bump map for plastic texture ── */
    const plasticBump = createPlasticBumpMap();

    /* ── TV body material (warm off-white plastic with texture) ── */
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0xc8bfb0,
      roughness: 0.72,
      metalness: 0.0,
      bumpMap: plasticBump,
      bumpScale: 0.012,
    });

    const darkPlasticMat = new THREE.MeshStandardMaterial({
      color: 0x2e2a26,
      roughness: 0.78,
      metalness: 0.0,
      bumpMap: plasticBump,
      bumpScale: 0.008,
    });

    /* ── TV body — frustum shape ── */
    const bodyW = 2.4;
    const bodyH = 1.85;
    const bodyD = 1.6;

    const bodyShape = new THREE.Shape();
    const bR = 0.08; /* tighter corners — real CRTs aren't very round */
    bodyShape.moveTo(-bodyW / 2 + bR, -bodyH / 2);
    bodyShape.lineTo(bodyW / 2 - bR, -bodyH / 2);
    bodyShape.quadraticCurveTo(bodyW / 2, -bodyH / 2, bodyW / 2, -bodyH / 2 + bR);
    bodyShape.lineTo(bodyW / 2, bodyH / 2 - bR);
    bodyShape.quadraticCurveTo(bodyW / 2, bodyH / 2, bodyW / 2 - bR, bodyH / 2);
    bodyShape.lineTo(-bodyW / 2 + bR, bodyH / 2);
    bodyShape.quadraticCurveTo(-bodyW / 2, bodyH / 2, -bodyW / 2, bodyH / 2 - bR);
    bodyShape.lineTo(-bodyW / 2, -bodyH / 2 + bR);
    bodyShape.quadraticCurveTo(-bodyW / 2, -bodyH / 2, -bodyW / 2 + bR, -bodyH / 2);

    const bodyGeo = new THREE.ExtrudeGeometry(bodyShape, {
      depth: bodyD,
      bevelEnabled: true,
      bevelThickness: 0.03,
      bevelSize: 0.03,
      bevelSegments: 2,
    });
    bodyGeo.translate(0, 0, -bodyD / 2);

    /* Taper toward back — frustum, wider at front */
    const bodyPos = bodyGeo.attributes.position;
    for (let i = 0; i < bodyPos.count; i++) {
      const z = bodyPos.getZ(i);
      const t = Math.max(0, (-z - bodyD * 0.1) / (bodyD * 0.9));
      const scale = 1 - t * 0.25; /* shrink to 75% at rear */
      bodyPos.setX(i, bodyPos.getX(i) * scale);
      bodyPos.setY(i, bodyPos.getY(i) * scale);
    }
    bodyGeo.computeVertexNormals();

    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.castShadow = true;
    body.receiveShadow = true;
    scene.add(body);

    /* ── Bezel — complex profile with lip/ridge ── */
    const bezelInset = 0.2;
    const screenW = bodyW - bezelInset * 2 - 0.32;
    const screenH = bodyH - bezelInset * 2 - 0.28;

    /* Outer bezel frame — slightly recessed dark plastic */
    const bezelOuterGeo = new THREE.BoxGeometry(screenW + 0.16, screenH + 0.16, 0.08);
    const bezelOuter = new THREE.Mesh(bezelOuterGeo, darkPlasticMat);
    bezelOuter.position.set(-0.06, 0.04, bodyD / 2 + 0.005);
    scene.add(bezelOuter);

    /* Inner bezel lip — thin ridge where glass meets bezel */
    const lipMat = new THREE.MeshStandardMaterial({
      color: 0x1a1816,
      roughness: 0.6,
      metalness: 0.05,
    });
    const bezelLipGeo = new THREE.BoxGeometry(screenW + 0.06, screenH + 0.06, 0.03);
    const bezelLip = new THREE.Mesh(bezelLipGeo, lipMat);
    bezelLip.position.set(-0.06, 0.04, bodyD / 2 + 0.045);
    scene.add(bezelLip);

    /* Horizontal groove/ridge across bezel below screen */
    const grooveGeo = new THREE.BoxGeometry(screenW + 0.12, 0.025, 0.02);
    const grooveMat = new THREE.MeshStandardMaterial({
      color: 0xb5ad9f,
      roughness: 0.85,
      metalness: 0.0,
    });
    const groove = new THREE.Mesh(grooveGeo, grooveMat);
    groove.position.set(-0.06, -screenH / 2 - 0.12, bodyD / 2 + 0.04);
    scene.add(groove);

    /* Second subtle groove line */
    const groove2 = new THREE.Mesh(
      new THREE.BoxGeometry(screenW + 0.12, 0.012, 0.015),
      grooveMat
    );
    groove2.position.set(-0.06, -screenH / 2 - 0.16, bodyD / 2 + 0.04);
    scene.add(groove2);

    /* ── Screen (CRT shader) ── */
    const screenUniforms = {
      uTime: { value: 0 },
      uResolution: { value: new THREE.Vector2(screenW * 220, screenH * 220) },
    };

    const screenMat = new THREE.ShaderMaterial({
      vertexShader: screenVertexShader,
      fragmentShader: screenFragmentShader,
      uniforms: screenUniforms,
    });

    /* Slightly curved screen — convex CRT bulge */
    const screenGeo = new THREE.PlaneGeometry(screenW, screenH, 40, 40);
    const screenPos = screenGeo.attributes.position;
    for (let i = 0; i < screenPos.count; i++) {
      const x = screenPos.getX(i) / (screenW / 2);
      const y = screenPos.getY(i) / (screenH / 2);
      const bulge = 0.07 * (1 - x * x) * (1 - y * y);
      screenPos.setZ(i, bulge);
    }
    screenGeo.computeVertexNormals();

    const screenMesh = new THREE.Mesh(screenGeo, screenMat);
    screenMesh.position.set(-0.06, 0.04, bodyD / 2 + 0.055);
    scene.add(screenMesh);

    /* ── Glass overlay — CRT glass with slight green tint ── */
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0x1a2a1a, /* slight green tint — CRT glass characteristic */
      transparent: true,
      opacity: 0.06,
      roughness: 0.15,
      metalness: 0.0,
      clearcoat: 0.8,
      clearcoatRoughness: 0.1,
      envMapIntensity: 0.3,
    });
    const glassGeo = new THREE.PlaneGeometry(screenW + 0.02, screenH + 0.02, 20, 20);
    /* Match screen curvature */
    const glassPos = glassGeo.attributes.position;
    for (let i = 0; i < glassPos.count; i++) {
      const x = glassPos.getX(i) / ((screenW + 0.02) / 2);
      const y = glassPos.getY(i) / ((screenH + 0.02) / 2);
      const bulge = 0.075 * (1 - x * x) * (1 - y * y);
      glassPos.setZ(i, bulge);
    }
    glassGeo.computeVertexNormals();

    const glass = new THREE.Mesh(glassGeo, glassMat);
    glass.position.set(-0.06, 0.04, bodyD / 2 + 0.062);
    scene.add(glass);

    /* ── Right-side panel (controls area) ── */
    const panelGeo = new THREE.BoxGeometry(0.24, bodyH * 0.55, 0.05);
    const panel = new THREE.Mesh(panelGeo, darkPlasticMat);
    panel.position.set(bodyW / 2 - 0.19, -0.05, bodyD / 2 + 0.015);
    scene.add(panel);

    /* ── Buttons / knobs — actual cylindrical geometry ── */
    /* Power button — slightly larger, recessed look */
    const btnGeo = new THREE.CylinderGeometry(0.038, 0.042, 0.04, 16);
    const btnMat = new THREE.MeshStandardMaterial({
      color: 0x222020,
      roughness: 0.7,
      metalness: 0.05,
    });
    const btn = new THREE.Mesh(btnGeo, btnMat);
    btn.rotation.x = Math.PI / 2;
    btn.position.set(bodyW / 2 - 0.19, 0.28, bodyD / 2 + 0.06);
    scene.add(btn);

    /* Volume knob — ridged cylinder */
    const knobGeo = new THREE.CylinderGeometry(0.048, 0.048, 0.05, 24);
    const knobMat = new THREE.MeshStandardMaterial({
      color: 0x1a1818,
      roughness: 0.65,
      metalness: 0.1,
    });
    const volKnob = new THREE.Mesh(knobGeo, knobMat);
    volKnob.rotation.x = Math.PI / 2;
    volKnob.position.set(bodyW / 2 - 0.19, 0.02, bodyD / 2 + 0.06);
    scene.add(volKnob);

    /* Channel knob */
    const chanKnob = new THREE.Mesh(knobGeo, knobMat);
    chanKnob.rotation.x = Math.PI / 2;
    chanKnob.position.set(bodyW / 2 - 0.19, -0.22, bodyD / 2 + 0.06);
    scene.add(chanKnob);

    /* Knob indicator lines — tiny boxes on knob faces */
    [volKnob, chanKnob].forEach((k) => {
      const indGeo = new THREE.BoxGeometry(0.003, 0.035, 0.002);
      const indMat = new THREE.MeshStandardMaterial({ color: 0xcccccc });
      const ind = new THREE.Mesh(indGeo, indMat);
      ind.position.set(0, 0, 0.026);
      k.add(ind);
    });

    /* ── Feet — 4 small rubber pads at corners ── */
    const footGeo = new THREE.BoxGeometry(0.1, 0.04, 0.12);
    const footMat = new THREE.MeshStandardMaterial({
      color: 0x2a2a2a,
      roughness: 0.95,
      metalness: 0.0,
    });
    const footPositions = [
      [-0.7, -0.08],
      [0.7, -0.08],
      [-0.7, 0.35],
      [0.7, 0.35],
    ];
    footPositions.forEach(([x, z]) => {
      const foot = new THREE.Mesh(footGeo, footMat);
      foot.position.set(x, -bodyH / 2 - 0.02, z);
      foot.castShadow = true;
      scene.add(foot);
    });

    /* ── Antennae (rabbit ears) — separate base points, V shape ── */
    const antMat = new THREE.MeshStandardMaterial({
      color: 0x999999,
      roughness: 0.4,
      metalness: 0.4,
    });
    [-1, 1].forEach((side) => {
      /* Base mount — small cylinder on top-rear of body */
      const baseGeo = new THREE.CylinderGeometry(0.025, 0.03, 0.04, 12);
      const base = new THREE.Mesh(baseGeo, antMat);
      base.position.set(side * 0.35, bodyH / 2 + 0.02, -0.35);
      scene.add(base);

      /* Antenna rod — thin cylinder */
      const antGeo = new THREE.CylinderGeometry(0.008, 0.006, 1.1, 8);
      const ant = new THREE.Mesh(antGeo, antMat);
      ant.position.set(side * 0.35, bodyH / 2 + 0.55, -0.35);
      ant.rotation.z = side * -0.3; /* angle outward in V */
      ant.rotation.x = -0.12; /* tilt back slightly */
      scene.add(ant);

      /* Spherical tip */
      const tipGeo = new THREE.SphereGeometry(0.016, 12, 12);
      const tip = new THREE.Mesh(tipGeo, antMat);
      const tipY = bodyH / 2 + 0.55 + Math.cos(0.3) * 0.55;
      const tipX = side * 0.35 + side * Math.sin(0.3) * 0.55;
      const tipZ = -0.35 + Math.sin(0.12) * 0.55;
      tip.position.set(tipX, tipY, tipZ);
      scene.add(tip);
    });

    /* ── Brand label area — subtle raised rectangle on bezel ── */
    const brandGeo = new THREE.BoxGeometry(0.35, 0.06, 0.005);
    const brandMat = new THREE.MeshStandardMaterial({
      color: 0xb0a898,
      roughness: 0.7,
      metalness: 0.02,
    });
    const brand = new THREE.Mesh(brandGeo, brandMat);
    brand.position.set(-0.06, -screenH / 2 - 0.06, bodyD / 2 + 0.05);
    scene.add(brand);

    /* ── Ventilation slots on top ── */
    for (let i = 0; i < 6; i++) {
      const slotGeo = new THREE.BoxGeometry(0.25, 0.003, 0.015);
      const slotMat = new THREE.MeshStandardMaterial({
        color: 0x1a1816,
        roughness: 0.9,
      });
      const slot = new THREE.Mesh(slotGeo, slotMat);
      slot.position.set(-0.3 + i * 0.12, bodyH / 2 + 0.01, -0.1);
      slot.rotation.x = -Math.PI / 2;
      scene.add(slot);
    }

    /* ── Lighting — warm, no green ── */

    /* Soft ambient — very dim warm */
    scene.add(new THREE.AmbientLight(0x1a1815, 0.3));

    /* Key light — faint warm overhead, defines top surface */
    const keyLight = new THREE.PointLight(0xffeedd, 0.6, 12);
    keyLight.position.set(0.5, 3, 2);
    scene.add(keyLight);

    /* Subtle fill from below-left */
    const fillLight = new THREE.PointLight(0xddd8cc, 0.2, 8);
    fillLight.position.set(-2, -1, 2);
    scene.add(fillLight);

    /* Screen glow — soft blue-white, cast on surroundings */
    const screenGlow = new THREE.PointLight(0xb8c4d8, 2.5, 5);
    screenGlow.position.set(-0.06, 0.04, bodyD / 2 + 1.2);
    screenGlow.castShadow = true;
    screenGlow.shadow.mapSize.set(512, 512);
    scene.add(screenGlow);

    /* Secondary screen glow — wider, softer */
    const screenGlow2 = new THREE.PointLight(0xa0aec0, 1.0, 7);
    screenGlow2.position.set(0, -0.3, bodyD / 2 + 0.6);
    scene.add(screenGlow2);

    /* Subtle rim light from behind — separates TV from background */
    const rimLight = new THREE.PointLight(0x444455, 0.4, 6);
    rimLight.position.set(0, 0.5, -2);
    scene.add(rimLight);

    /* ── Specular highlight on bezel top edge ── */
    /* (Achieved via the key light positioning + material roughness) */

    /* ── Animation loop ── */
    let animId = 0;
    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      /* Update screen shader */
      screenUniforms.uTime.value = t;

      /* Subtle TV idle bob — very slight */
      body.position.y = Math.sin(t * 0.7) * 0.0015;
      body.scale.setScalar(1 + Math.sin(t * 1.1) * 0.0005);

      /* Screen glow flicker — irregular, warm */
      const flickerBase = Math.sin(t * 8.7) * 0.2
        + Math.sin(t * 13.1) * 0.1
        + Math.sin(t * 5.3 + Math.sin(t * 2.1)) * 0.15;
      screenGlow.intensity = 2.5 + flickerBase;
      screenGlow2.intensity = 1.0 + flickerBase * 0.4;

      renderer.render(scene, camera);
    };
    animate();

    /* ── Resize ── */
    const ro = new ResizeObserver(() => {
      w = container.clientWidth;
      h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });
    ro.observe(container);

    return () => {
      cancelAnimationFrame(animId);
      ro.disconnect();
      renderer.dispose();
      plasticBump.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <section className="tv-hero" ref={mountRef}>
      <div className="tv-scroll-cue">
        <span className="tv-scroll-cue-text">CH&#9660;</span>
      </div>
    </section>
  );
}
