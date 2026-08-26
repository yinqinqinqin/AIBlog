import { useEffect, useRef } from "react";
import * as THREE from "three";

type HeroModelSceneProps = {
  reduceMotion: boolean;
  theme: "light" | "dark";
};

type SceneAppearance = {
  planet: THREE.MeshPhysicalMaterial;
  city: THREE.MeshStandardMaterial;
  grid: THREE.LineBasicMaterial;
  atmosphere: THREE.MeshBasicMaterial;
  neon: THREE.MeshBasicMaterial[];
  beams: THREE.ShaderMaterial[];
  cityLights: THREE.PointsMaterial;
  stars: THREE.PointsMaterial;
  ambient: THREE.AmbientLight;
  key: THREE.PointLight;
  rim: THREE.PointLight;
  fill: THREE.PointLight;
  renderer: THREE.WebGLRenderer;
};

const palettes = {
  dark: {
    planet: "#07040f",
    planetEmissive: "#24074f",
    city: "#171025",
    cityEmissive: "#3b0b63",
    grid: "#8b5cf6",
    atmosphere: "#7c3aed",
    neon: ["#d946ef", "#22d3ee", "#a78bfa"],
    beam: ["#e879f9", "#67e8f9", "#a78bfa"],
    stars: "#c4b5fd",
    ambient: "#7c3aed",
    key: "#f0abfc",
    rim: "#22d3ee",
    fill: "#8b5cf6",
    exposure: 1.18,
  },
  light: {
    planet: "#302554",
    planetEmissive: "#6d4ed8",
    city: "#3b2e62",
    cityEmissive: "#7c3aed",
    grid: "#7c3aed",
    atmosphere: "#8b5cf6",
    neon: ["#c026d3", "#0891b2", "#6d28d9"],
    beam: ["#c026d3", "#0e7490", "#7c3aed"],
    stars: "#7c3aed",
    ambient: "#ddd6fe",
    key: "#c084fc",
    rim: "#06b6d4",
    fill: "#7c3aed",
    exposure: 1.02,
  },
} as const;

function createSeededRandom(seed = 2606) {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

export default function HeroModelScene({ reduceMotion, theme }: HeroModelSceneProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const appearanceRef = useRef<SceneAppearance | null>(null);
  const initialThemeRef = useRef(theme);
  const reduceMotionRef = useRef(reduceMotion);

  useEffect(() => {
    reduceMotionRef.current = reduceMotion;
  }, [reduceMotion]);

  useEffect(() => {
    const appearance = appearanceRef.current;
    if (!appearance) return;

    const palette = palettes[theme];
    appearance.planet.color.set(palette.planet);
    appearance.planet.emissive.set(palette.planetEmissive);
    appearance.planet.emissiveIntensity = theme === "dark" ? 0.36 : 0.22;
    appearance.city.color.set(palette.city);
    appearance.city.emissive.set(palette.cityEmissive);
    appearance.city.emissiveIntensity = theme === "dark" ? 0.52 : 0.32;
    appearance.grid.color.set(palette.grid);
    appearance.atmosphere.color.set(palette.atmosphere);
    appearance.neon.forEach((material, index) => material.color.set(palette.neon[index]));
    appearance.beams.forEach((material, index) => {
      (material.uniforms.uColor.value as THREE.Color).set(palette.beam[index]);
      material.uniforms.uOpacity.value = theme === "dark" ? 0.11 : 0.07;
    });
    appearance.cityLights.color.set(palette.neon[0]);
    appearance.stars.color.set(palette.stars);
    appearance.ambient.color.set(palette.ambient);
    appearance.ambient.intensity = theme === "dark" ? 1.1 : 1.7;
    appearance.key.color.set(palette.key);
    appearance.rim.color.set(palette.rim);
    appearance.fill.color.set(palette.fill);
    appearance.renderer.toneMappingExposure = palette.exposure;
  }, [theme]);

  useEffect(() => {
    const host = hostRef.current;
    if (
      !host ||
      typeof window === "undefined" ||
      typeof WebGLRenderingContext === "undefined" ||
      /jsdom/i.test(navigator.userAgent)
    ) {
      return undefined;
    }

    const palette = palettes[initialThemeRef.current];
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
    camera.position.set(0, 0.04, 5.25);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.35));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = palette.exposure;
    renderer.domElement.setAttribute("aria-hidden", "true");
    host.appendChild(renderer.domElement);

    const world = new THREE.Group();
    world.rotation.set(-0.16, 0.48, -0.08);
    scene.add(world);

    const planetGeometry = new THREE.SphereGeometry(0.96, 64, 48);
    const planetMaterial = new THREE.MeshPhysicalMaterial({
      color: palette.planet,
      emissive: palette.planetEmissive,
      emissiveIntensity: initialThemeRef.current === "dark" ? 0.36 : 0.22,
      metalness: 0.72,
      roughness: 0.34,
      clearcoat: 0.82,
      clearcoatRoughness: 0.2,
    });
    world.add(new THREE.Mesh(planetGeometry, planetMaterial));

    const gridMaterial = new THREE.LineBasicMaterial({
      color: palette.grid,
      opacity: 0.18,
      transparent: true,
      toneMapped: false,
    });
    const grid = new THREE.LineSegments(
      new THREE.WireframeGeometry(new THREE.SphereGeometry(0.978, 24, 16)),
      gridMaterial,
    );
    world.add(grid);

    const atmosphereMaterial = new THREE.MeshBasicMaterial({
      color: palette.atmosphere,
      opacity: 0.09,
      side: THREE.BackSide,
      transparent: true,
      toneMapped: false,
    });
    const atmosphere = new THREE.Mesh(new THREE.SphereGeometry(1.075, 40, 28), atmosphereMaterial);
    world.add(atmosphere);

    const buildingCount = 180;
    const buildingGeometry = new THREE.BoxGeometry(1, 1, 1);
    const cityMaterial = new THREE.MeshStandardMaterial({
      color: palette.city,
      emissive: palette.cityEmissive,
      emissiveIntensity: initialThemeRef.current === "dark" ? 0.52 : 0.32,
      metalness: 0.82,
      roughness: 0.28,
    });
    const buildings = new THREE.InstancedMesh(buildingGeometry, cityMaterial, buildingCount);
    buildings.instanceMatrix.setUsage(THREE.StaticDrawUsage);
    world.add(buildings);

    const neonMaterials = palette.neon.map((color) => new THREE.MeshBasicMaterial({
      color,
      toneMapped: false,
    }));
    const capGeometry = new THREE.BoxGeometry(1, 1, 1);
    const caps = neonMaterials.map((material) => {
      const mesh = new THREE.InstancedMesh(capGeometry, material, Math.ceil(buildingCount / 3));
      mesh.instanceMatrix.setUsage(THREE.StaticDrawUsage);
      world.add(mesh);
      return mesh;
    });

    const random = createSeededRandom();
    const up = new THREE.Vector3(0, 1, 0);
    const normal = new THREE.Vector3();
    const position = new THREE.Vector3();
    const quaternion = new THREE.Quaternion();
    const scale = new THREE.Vector3();
    const matrix = new THREE.Matrix4();
    const cityLightPositions = new Float32Array(buildingCount * 3);
    const capCounts = [0, 0, 0];

    for (let index = 0; index < buildingCount; index += 1) {
      const vertical = 1 - (2 * (index + 0.5)) / buildingCount;
      const radial = Math.sqrt(Math.max(0, 1 - vertical * vertical));
      const angle = index * Math.PI * (3 - Math.sqrt(5)) + (random() - 0.5) * 0.18;
      normal.set(Math.cos(angle) * radial, vertical, Math.sin(angle) * radial).normalize();

      const footprint = 0.045 + random() * 0.07;
      const depth = footprint * (0.72 + random() * 0.52);
      const towerBoost = random() > 0.86 ? 0.28 + random() * 0.28 : 0;
      const height = 0.075 + Math.pow(random(), 1.7) * 0.32 + towerBoost;
      quaternion.setFromUnitVectors(up, normal);

      position.copy(normal).multiplyScalar(0.955 + height / 2);
      scale.set(footprint, height, depth);
      matrix.compose(position, quaternion, scale);
      buildings.setMatrixAt(index, matrix);

      const capIndex = index % 3;
      const capSlot = capCounts[capIndex];
      capCounts[capIndex] += 1;
      position.copy(normal).multiplyScalar(0.96 + height + 0.009);
      scale.set(footprint * 1.12, 0.018, depth * 1.12);
      matrix.compose(position, quaternion, scale);
      caps[capIndex].setMatrixAt(capSlot, matrix);

      cityLightPositions[index * 3] = position.x;
      cityLightPositions[index * 3 + 1] = position.y;
      cityLightPositions[index * 3 + 2] = position.z;
    }

    buildings.instanceMatrix.needsUpdate = true;
    caps.forEach((mesh, index) => {
      mesh.count = capCounts[index];
      mesh.instanceMatrix.needsUpdate = true;
    });

    const cityLightsGeometry = new THREE.BufferGeometry();
    cityLightsGeometry.setAttribute("position", new THREE.BufferAttribute(cityLightPositions, 3));
    const cityLightsMaterial = new THREE.PointsMaterial({
      color: palette.neon[0],
      opacity: 0.9,
      size: 0.025,
      sizeAttenuation: true,
      transparent: true,
      toneMapped: false,
    });
    world.add(new THREE.Points(cityLightsGeometry, cityLightsMaterial));

    const antennaPositions: number[] = [];
    for (let index = 0; index < buildingCount; index += 17) {
      const offset = index * 3;
      const tip = new THREE.Vector3(
        cityLightPositions[offset],
        cityLightPositions[offset + 1],
        cityLightPositions[offset + 2],
      );
      const antennaTip = tip.clone().multiplyScalar(1.09);
      antennaPositions.push(tip.x, tip.y, tip.z, antennaTip.x, antennaTip.y, antennaTip.z);
    }
    const antennaGeometry = new THREE.BufferGeometry();
    antennaGeometry.setAttribute("position", new THREE.Float32BufferAttribute(antennaPositions, 3));
    const antennaMaterial = new THREE.LineBasicMaterial({
      color: palette.neon[1],
      opacity: 0.72,
      transparent: true,
      toneMapped: false,
    });
    world.add(new THREE.LineSegments(antennaGeometry, antennaMaterial));

    const orbitMaterial = new THREE.MeshBasicMaterial({
      color: palette.neon[1],
      opacity: 0.22,
      transparent: true,
      toneMapped: false,
    });
    const orbit = new THREE.Mesh(new THREE.TorusGeometry(1.42, 0.008, 6, 160), orbitMaterial);
    orbit.rotation.set(1.08, 0.22, 0.46);
    world.add(orbit);

    const beamVertexShader = /* glsl */ `
      varying vec2 vUv;

      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;
    const beamFragmentShader = /* glsl */ `
      uniform vec3 uColor;
      uniform float uTime;
      uniform float uPhase;
      uniform float uOpacity;
      varying vec2 vUv;

      float noise21(vec2 value) {
        return fract(sin(dot(value, vec2(12.9898, 78.233))) * 43758.5453);
      }

      void main() {
        float lengthFade = pow(sin(clamp(vUv.y, 0.0, 1.0) * 3.14159265), 0.72);
        float sideFade = 0.58 + 0.42 * pow(sin(vUv.x * 3.14159265), 2.0);
        float flow = 0.82 + 0.18 * sin(vUv.y * 19.0 - uTime * 1.45 + uPhase);
        float grain = 0.9 + noise21(gl_FragCoord.xy + uTime * 17.0) * 0.1;
        float alpha = uOpacity * lengthFade * sideFade * flow * grain;
        gl_FragColor = vec4(uColor, alpha);
      }
    `;

    const beamGroup = new THREE.Group();
    scene.add(beamGroup);
    const beamDefinitions = [
      { source: [0.58, 0.34, 0.12], direction: [0.92, 0.7, 0.62], length: 3.05, radius: 0.72 },
      { source: [-0.62, 0.1, 0.08], direction: [-0.98, 0.42, 0.58], length: 2.8, radius: 0.62 },
      { source: [0.02, -0.62, 0.1], direction: [0.22, -1.0, 0.64], length: 2.65, radius: 0.58 },
    ];
    const beamMaterials: THREE.ShaderMaterial[] = [];
    const beams = beamDefinitions.map((definition, index) => {
      const material = new THREE.ShaderMaterial({
        blending: THREE.AdditiveBlending,
        depthTest: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        transparent: true,
        uniforms: {
          uColor: { value: new THREE.Color(palette.beam[index]) },
          uTime: { value: 0 },
          uPhase: { value: index * 1.7 },
          uOpacity: { value: initialThemeRef.current === "dark" ? 0.11 : 0.07 },
        },
        vertexShader: beamVertexShader,
        fragmentShader: beamFragmentShader,
      });
      beamMaterials.push(material);

      const beam = new THREE.Mesh(
        new THREE.ConeGeometry(definition.radius, definition.length, 28, 1, true),
        material,
      );
      const source = new THREE.Vector3(...definition.source as [number, number, number]);
      const direction = new THREE.Vector3(...definition.direction as [number, number, number]).normalize();
      beam.position.copy(source).addScaledVector(direction, definition.length / 2);
      beam.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), direction);
      beamGroup.add(beam);
      return beam;
    });

    const starCount = 120;
    const starPositions = new Float32Array(starCount * 3);
    for (let index = 0; index < starCount; index += 1) {
      const radius = 1.8 + random() * 1.45;
      const theta = random() * Math.PI * 2;
      const phi = Math.acos(2 * random() - 1);
      starPositions[index * 3] = radius * Math.sin(phi) * Math.cos(theta);
      starPositions[index * 3 + 1] = radius * Math.cos(phi) * 0.7;
      starPositions[index * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
    }
    const starGeometry = new THREE.BufferGeometry();
    starGeometry.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));
    const starMaterial = new THREE.PointsMaterial({
      color: palette.stars,
      opacity: 0.42,
      size: 0.022,
      sizeAttenuation: true,
      transparent: true,
      toneMapped: false,
    });
    const stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);

    const ambient = new THREE.AmbientLight(palette.ambient, initialThemeRef.current === "dark" ? 1.1 : 1.7);
    const key = new THREE.PointLight(palette.key, 28, 12, 2);
    key.position.set(2.7, 2.8, 3.8);
    const rim = new THREE.PointLight(palette.rim, 24, 12, 2);
    rim.position.set(-3.1, 0.1, 2.7);
    const fill = new THREE.PointLight(palette.fill, 18, 10, 2);
    fill.position.set(0.2, -3.2, 2.2);
    scene.add(ambient, key, rim, fill);

    appearanceRef.current = {
      planet: planetMaterial,
      city: cityMaterial,
      grid: gridMaterial,
      atmosphere: atmosphereMaterial,
      neon: neonMaterials,
      beams: beamMaterials,
      cityLights: cityLightsMaterial,
      stars: starMaterial,
      ambient,
      key,
      rim,
      fill,
      renderer,
    };

    let dragging = false;
    let visible = true;
    let pointerId: number | null = null;
    let previousX = 0;
    let previousY = 0;
    let currentX = world.rotation.x;
    let currentY = world.rotation.y;
    let targetX = currentX;
    let targetY = currentY;
    let raf = 0;
    let lastTime = performance.now();

    const resize = () => {
      const { width, height } = host.getBoundingClientRect();
      if (width <= 0 || height <= 0) return;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };

    const handlePointerDown = (event: PointerEvent) => {
      event.preventDefault();
      dragging = true;
      pointerId = event.pointerId;
      previousX = event.clientX;
      previousY = event.clientY;
      host.classList.add("is-dragging");
      host.setPointerCapture?.(event.pointerId);
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (!dragging || event.pointerId !== pointerId) return;
      event.preventDefault();
      const deltaX = event.clientX - previousX;
      const deltaY = event.clientY - previousY;
      previousX = event.clientX;
      previousY = event.clientY;
      targetY += deltaX * 0.008;
      targetX = THREE.MathUtils.clamp(targetX + deltaY * 0.007, -1.08, 1.08);
    };

    const handlePointerUp = (event: PointerEvent) => {
      if (event.pointerId !== pointerId) return;
      event.preventDefault();
      dragging = false;
      pointerId = null;
      host.classList.remove("is-dragging");
      host.releasePointerCapture?.(event.pointerId);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      const step = event.shiftKey ? 0.24 : 0.12;
      if (event.key === "ArrowLeft") targetY -= step;
      else if (event.key === "ArrowRight") targetY += step;
      else if (event.key === "ArrowUp") targetX = Math.max(-1.08, targetX - step);
      else if (event.key === "ArrowDown") targetX = Math.min(1.08, targetX + step);
      else return;
      event.preventDefault();
    };

    const render = (time: number) => {
      raf = window.requestAnimationFrame(render);
      if (!visible || document.hidden) {
        lastTime = time;
        return;
      }

      const delta = Math.min(0.05, Math.max(0, (time - lastTime) / 1000));
      lastTime = time;
      if (!dragging && !reduceMotionRef.current) targetY += delta * 0.12;
      currentX += (targetX - currentX) * Math.min(1, delta * 9);
      currentY += (targetY - currentY) * Math.min(1, delta * 9);
      world.rotation.x = currentX;
      world.rotation.y = currentY;
      orbit.rotation.z += delta * 0.04;
      stars.rotation.y -= delta * 0.018;
      beamGroup.rotation.z = Math.sin(time * 0.00022) * 0.075;
      beamGroup.rotation.x = Math.cos(time * 0.00017) * 0.045;
      beams.forEach((beam, index) => {
        const pulse = 1 + Math.sin(time * 0.0011 + index * 2.1) * 0.055;
        beam.scale.x = pulse;
        beam.scale.z = pulse;
        beamMaterials[index].uniforms.uTime.value = time * 0.001;
      });
      key.position.x = 2.7 + Math.sin(time * 0.00042) * 0.75;
      key.position.y = 2.4 + Math.cos(time * 0.00035) * 0.55;
      key.intensity = 25 + Math.sin(time * 0.0012) * 4;
      rim.position.y = Math.sin(time * 0.00038) * 1.2;
      rim.intensity = 21 + Math.cos(time * 0.00105) * 3.5;
      fill.position.x = Math.cos(time * 0.00031) * 1.2;
      fill.intensity = 16 + Math.sin(time * 0.00088 + 1.4) * 3;
      renderer.render(scene, camera);
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(host);
    const intersectionObserver = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    }, { rootMargin: "120px 0px" });
    intersectionObserver.observe(host);
    host.addEventListener("pointerdown", handlePointerDown);
    host.addEventListener("pointermove", handlePointerMove);
    host.addEventListener("pointerup", handlePointerUp);
    host.addEventListener("pointercancel", handlePointerUp);
    host.addEventListener("keydown", handleKeyDown);
    resize();
    raf = window.requestAnimationFrame(render);

    return () => {
      window.cancelAnimationFrame(raf);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      host.removeEventListener("pointerdown", handlePointerDown);
      host.removeEventListener("pointermove", handlePointerMove);
      host.removeEventListener("pointerup", handlePointerUp);
      host.removeEventListener("pointercancel", handlePointerUp);
      host.removeEventListener("keydown", handleKeyDown);
      appearanceRef.current = null;

      const disposedMaterials = new Set<THREE.Material>();
      scene.traverse((object) => {
        if (!(object instanceof THREE.Mesh || object instanceof THREE.Line || object instanceof THREE.Points)) return;
        object.geometry?.dispose();
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        materials.forEach((material) => {
          if (!disposedMaterials.has(material)) {
            material.dispose();
            disposedMaterials.add(material);
          }
        });
      });
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return (
    <div
      aria-label="赛博朋克球形城市，可拖动鼠标或使用方向键旋转"
      className="hero-model"
      ref={hostRef}
      tabIndex={0}
    />
  );
}
