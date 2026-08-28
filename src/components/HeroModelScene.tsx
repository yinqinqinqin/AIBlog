import { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

type HeroModelSceneProps = {
  reduceMotion: boolean;
  theme: "light" | "dark";
};

type ModelMaterialBinding = {
  material: THREE.MeshPhysicalMaterial;
  variant: number;
};

type SceneAppearance = {
  core: THREE.MeshPhysicalMaterial;
  kernel: THREE.MeshBasicMaterial;
  shell: THREE.MeshPhysicalMaterial;
  atmosphere: THREE.ShaderMaterial;
  lattice: THREE.LineBasicMaterial;
  surface: THREE.PointsMaterial;
  rings: THREE.MeshBasicMaterial[];
  flows: THREE.MeshBasicMaterial[];
  beacons: THREE.MeshBasicMaterial[];
  modelEdges: THREE.LineBasicMaterial[];
  haze: THREE.ShaderMaterial[];
  stars: THREE.PointsMaterial;
  modelMaterials: ModelMaterialBinding[];
  ambient: THREE.AmbientLight;
  key: THREE.PointLight;
  rim: THREE.PointLight;
  fill: THREE.PointLight;
  renderer: THREE.WebGLRenderer;
};

type ModelPlacement = {
  latitude: number;
  longitude: number;
  modelIndex: number;
  variant: number;
  height: number;
  footprint: number;
  spin: number;
};

type NormalizedModel = {
  template: THREE.Group;
  height: number;
  footprint: number;
};

const MODEL_PATHS = [
  "/assets/hero-world/industrial/building-a.glb",
  "/assets/hero-world/industrial/building-c.glb",
  "/assets/hero-world/industrial/building-e.glb",
  "/assets/hero-world/industrial/building-g.glb",
  "/assets/hero-world/industrial/building-i.glb",
  "/assets/hero-world/industrial/building-k.glb",
  "/assets/hero-world/industrial/building-m.glb",
  "/assets/hero-world/industrial/building-o.glb",
  "/assets/hero-world/industrial/building-q.glb",
  "/assets/hero-world/industrial/building-s.glb",
] as const;

const palettes = {
  dark: {
    core: "#07070d",
    coreEmissive: "#211238",
    kernel: "#d8b4fe",
    shell: "#171225",
    shellEmissive: "#39245c",
    atmosphere: "#9e8cff",
    lattice: "#8f7ed8",
    surface: "#b9a8ff",
    architecture: ["#29253b", "#222a38", "#30243b"],
    architectureEmissive: ["#b6a5ff", "#72c6d4", "#d8a7d6"],
    rings: ["#a38cf2", "#68c1ce", "#c69ad9"],
    flows: ["#d9c8ff", "#8edce6", "#deb9e6"],
    beacons: ["#f0e8ff", "#9deaf2", "#f1cbed"],
    haze: ["#b58cff", "#8d7ee8", "#6ecbd8"],
    stars: "#b9a8ff",
    ambient: "#7e64bd",
    key: "#ddc9ff",
    rim: "#7fd7df",
    fill: "#9a83de",
    exposure: 1.08,
  },
  light: {
    core: "#2b2242",
    coreEmissive: "#5d4a8f",
    kernel: "#f4dcff",
    shell: "#6f6288",
    shellEmissive: "#a18ad2",
    atmosphere: "#b9a4f2",
    lattice: "#9d8bc8",
    surface: "#a894d5",
    architecture: ["#6b607d", "#75677f", "#625d78"],
    architectureEmissive: ["#a992e6", "#d8a6c8", "#8fc8d4"],
    rings: ["#a78bda", "#d6a2c6", "#83bfcc"],
    flows: ["#b49bef", "#e2b3d2", "#9fd2da"],
    beacons: ["#efe3ff", "#f3c4da", "#b8edf2"],
    haze: ["#c2a9f4", "#e4b8d4", "#a9d6df"],
    stars: "#b79ee8",
    ambient: "#efe7fb",
    key: "#d9c8f4",
    rim: "#e5b4d2",
    fill: "#b9d7e0",
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

function sphericalPoint(radius: number, latitudeDeg: number, longitudeDeg: number) {
  const latitude = THREE.MathUtils.degToRad(latitudeDeg);
  const longitude = THREE.MathUtils.degToRad(longitudeDeg);
  const cosLatitude = Math.cos(latitude);

  return new THREE.Vector3(
    radius * cosLatitude * Math.cos(longitude),
    radius * Math.sin(latitude),
    radius * cosLatitude * Math.sin(longitude),
  );
}

function buildArcCurve(
  radius: number,
  startLat: number,
  startLon: number,
  endLat: number,
  endLon: number,
  lift: number,
  twist: number,
) {
  const start = sphericalPoint(radius, startLat, startLon);
  const end = sphericalPoint(radius, endLat, endLon);
  const axis = start.clone().cross(end);

  if (axis.lengthSq() < 0.00001) {
    axis.set(0, 1, 0);
  } else {
    axis.normalize();
  }

  const midA = start.clone().lerp(end, 0.32).normalize();
  midA.addScaledVector(axis, twist).normalize().multiplyScalar(radius + lift);

  const midB = start.clone().lerp(end, 0.68).normalize();
  midB.addScaledVector(axis, -twist * 0.72).normalize().multiplyScalar(radius + lift * 1.12);

  return new THREE.CatmullRomCurve3([start, midA, midB, end], false, "catmullrom", 0.16);
}

function createHazeMaterial(color: string, opacity: number, phase: number) {
  return new THREE.ShaderMaterial({
    blending: THREE.AdditiveBlending,
    depthTest: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    transparent: true,
    toneMapped: false,
    uniforms: {
      uColor: { value: new THREE.Color(color) },
      uOpacity: { value: opacity },
      uPhase: { value: phase },
      uTime: { value: 0 },
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv;

      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      uniform float uOpacity;
      uniform float uPhase;
      uniform float uTime;
      varying vec2 vUv;

      float hash21(vec2 value) {
        return fract(sin(dot(value, vec2(27.619, 91.173))) * 43758.5453);
      }

      void main() {
        vec2 centered = vUv - 0.5;
        float shaft = pow(max(0.0, 1.0 - abs(centered.x) * 2.0), 2.8);
        float vertical = smoothstep(0.0, 0.14, vUv.y) * (1.0 - smoothstep(0.58, 1.0, vUv.y));
        float halo = smoothstep(1.02, 0.14, length(centered * vec2(1.7, 0.82)));
        float ripple = 0.88 + 0.12 * sin(vUv.y * 15.0 - uTime * 0.85 + uPhase);
        float grain = 0.95 + hash21(floor(gl_FragCoord.xy * 0.65) + uTime * 11.0) * 0.05;
        float alpha = uOpacity * shaft * vertical * halo * ripple * grain;

        gl_FragColor = vec4(uColor, alpha);
      }
    `,
  });
}

function createAtmosphereMaterial(color: string, opacity: number) {
  return new THREE.ShaderMaterial({
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    transparent: true,
    toneMapped: false,
    uniforms: {
      uColor: { value: new THREE.Color(color) },
      uOpacity: { value: opacity },
    },
    vertexShader: /* glsl */ `
      varying vec3 vNormalView;
      varying vec3 vViewDirection;

      void main() {
        vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
        vNormalView = normalize(normalMatrix * normal);
        vViewDirection = normalize(-viewPosition.xyz);
        gl_Position = projectionMatrix * viewPosition;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      uniform float uOpacity;
      varying vec3 vNormalView;
      varying vec3 vViewDirection;

      void main() {
        float rim = pow(1.0 - max(dot(vNormalView, vViewDirection), 0.0), 2.7);
        float alpha = smoothstep(0.06, 0.96, rim) * uOpacity;
        gl_FragColor = vec4(uColor, alpha);
      }
    `,
  });
}

function normalizeModelTemplate(source: THREE.Object3D) {
  const clone = source.clone(true);
  clone.updateMatrixWorld(true);
  const bounds = new THREE.Box3().setFromObject(clone);
  const size = bounds.getSize(new THREE.Vector3());
  const center = bounds.getCenter(new THREE.Vector3());
  const normalized = new THREE.Group();

  clone.position.x -= center.x;
  clone.position.z -= center.z;
  clone.position.y -= bounds.min.y;
  normalized.add(clone);

  return {
    template: normalized,
    height: Math.max(size.y, 0.001),
    footprint: Math.max(size.x, size.z, 0.001),
  };
}

function buildModelPlacements(random: () => number) {
  const placements: ModelPlacement[] = [];
  const bands = [
    { latitude: -52, count: 3 },
    { latitude: -27, count: 4 },
    { latitude: 0, count: 5 },
    { latitude: 29, count: 4 },
    { latitude: 55, count: 3 },
  ];

  bands.forEach(({ latitude, count }, bandIndex) => {
    const bandCount = count;

    for (let segment = 0; segment < bandCount; segment += 1) {
      const longitudeOffset = bandIndex % 2 === 0 ? 0 : 180 / bandCount;
      const longitude = (segment / bandCount) * 360 + longitudeOffset + (random() - 0.5) * 7;
      const skylineBias = 1 - Math.min(1, Math.abs(latitude) / 72);

      placements.push({
        latitude: latitude + (random() - 0.5) * 3,
        longitude,
        modelIndex: (bandIndex * 2 + segment * 3) % MODEL_PATHS.length,
        variant: (segment + bandIndex) % 3,
        height: 0.18 + skylineBias * 0.11 + random() * 0.045,
        footprint: 0.14 + random() * 0.04,
        spin: random() * Math.PI * 2,
      });
    }
  });

  return placements;
}

function applyThemeToAppearance(appearance: SceneAppearance, theme: "light" | "dark") {
  const palette = palettes[theme];

  appearance.core.color.set(palette.core);
  appearance.core.emissive.set(palette.coreEmissive);
  appearance.core.emissiveIntensity = theme === "dark" ? 0.46 : 0.34;
  appearance.kernel.color.set(palette.kernel);
  appearance.kernel.opacity = theme === "dark" ? 0.62 : 0.44;
  appearance.shell.color.set(palette.shell);
  appearance.shell.emissive.set(palette.shellEmissive);
  appearance.shell.emissiveIntensity = theme === "dark" ? 0.28 : 0.2;
  appearance.shell.opacity = theme === "dark" ? 0.3 : 0.24;
  (appearance.atmosphere.uniforms.uColor.value as THREE.Color).set(palette.atmosphere);
  appearance.atmosphere.uniforms.uOpacity.value = theme === "dark" ? 0.52 : 0.34;
  appearance.lattice.color.set(palette.lattice);
  appearance.lattice.opacity = theme === "dark" ? 0.13 : 0.1;
  appearance.surface.color.set(palette.surface);
  appearance.surface.opacity = theme === "dark" ? 0.34 : 0.24;

  appearance.rings.forEach((material, index) => {
    material.color.set(palette.rings[index % palette.rings.length]);
    material.opacity = theme === "dark" ? 0.2 : 0.14;
  });

  appearance.flows.forEach((material, index) => {
    material.color.set(palette.flows[index % palette.flows.length]);
    material.opacity = theme === "dark" ? 0.34 : 0.24;
  });

  appearance.beacons.forEach((material, index) => {
    material.color.set(palette.beacons[index % palette.beacons.length]);
    material.opacity = theme === "dark" ? 0.86 : 0.68;
  });

  appearance.modelEdges.forEach((material, index) => {
    material.color.set(palette.architectureEmissive[index % palette.architectureEmissive.length]);
    material.opacity = theme === "dark" ? 0.2 : 0.13;
  });

  appearance.haze.forEach((material, index) => {
    (material.uniforms.uColor.value as THREE.Color).set(palette.haze[index % palette.haze.length]);
    material.uniforms.uOpacity.value = theme === "dark" ? 0.12 : 0.075;
  });

  appearance.modelMaterials.forEach(({ material, variant }) => {
    material.color.set(palette.architecture[variant % palette.architecture.length]);
    material.emissive.set(palette.architectureEmissive[variant % palette.architectureEmissive.length]);
    material.emissiveIntensity = theme === "dark" ? 0.2 : 0.1;
    material.metalness = theme === "dark" ? 0.9 : 0.76;
    material.roughness = theme === "dark" ? 0.31 : 0.4;
    material.clearcoat = theme === "dark" ? 0.92 : 0.76;
    material.clearcoatRoughness = theme === "dark" ? 0.16 : 0.24;
    material.opacity = 1;
    material.transparent = false;
  });

  appearance.stars.color.set(palette.stars);
  appearance.stars.opacity = theme === "dark" ? 0.42 : 0.3;
  appearance.ambient.color.set(palette.ambient);
  appearance.ambient.intensity = theme === "dark" ? 1.08 : 1.52;
  appearance.key.color.set(palette.key);
  appearance.rim.color.set(palette.rim);
  appearance.fill.color.set(palette.fill);
  appearance.renderer.toneMappingExposure = palette.exposure;
}

export default function HeroModelScene({ reduceMotion, theme }: HeroModelSceneProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const appearanceRef = useRef<SceneAppearance | null>(null);
  const reduceMotionRef = useRef(reduceMotion);
  const themeRef = useRef(theme);

  useEffect(() => {
    reduceMotionRef.current = reduceMotion;
  }, [reduceMotion]);

  useEffect(() => {
    themeRef.current = theme;
    const appearance = appearanceRef.current;

    if (appearance) {
      applyThemeToAppearance(appearance, theme);
    }
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

    const palette = palettes[themeRef.current];
    const random = createSeededRandom();
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
    camera.position.set(0, 0.02, 5.45);

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
    world.rotation.set(-0.18, 0.56, -0.08);
    scene.add(world);

    const orbitalField = new THREE.Group();
    const structures = new THREE.Group();
    const beaconField = new THREE.Group();
    world.add(orbitalField, structures, beaconField);

    const core = new THREE.Mesh(
      new THREE.SphereGeometry(0.82, 72, 54),
      new THREE.MeshPhysicalMaterial({
        color: palette.core,
        emissive: palette.coreEmissive,
        emissiveIntensity: themeRef.current === "dark" ? 0.46 : 0.34,
        metalness: 0.86,
        roughness: 0.24,
        clearcoat: 0.96,
        clearcoatRoughness: 0.14,
        side: THREE.DoubleSide,
      }),
    );
    world.add(core);

    const kernel = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.3, 2),
      new THREE.MeshBasicMaterial({
        color: palette.kernel,
        opacity: themeRef.current === "dark" ? 0.62 : 0.44,
        transparent: true,
        toneMapped: false,
        side: THREE.DoubleSide,
      }),
    );
    world.add(kernel);

    const innerShell = new THREE.Mesh(
      new THREE.SphereGeometry(1.01, 64, 48),
      new THREE.MeshPhysicalMaterial({
        color: palette.shell,
        emissive: palette.shellEmissive,
        emissiveIntensity: themeRef.current === "dark" ? 0.28 : 0.2,
        metalness: 0.48,
        roughness: 0.38,
        transparent: true,
        opacity: 0.2,
        transmission: 0.08,
        thickness: 0.6,
        clearcoat: 0.84,
        side: THREE.DoubleSide,
      }),
    );
    world.add(innerShell);

    const latticeMaterial = new THREE.LineBasicMaterial({
      color: palette.lattice,
      opacity: themeRef.current === "dark" ? 0.13 : 0.1,
      transparent: true,
      toneMapped: false,
    });
    const lattice = new THREE.LineSegments(
      new THREE.WireframeGeometry(new THREE.SphereGeometry(1.05, 26, 20)),
      latticeMaterial,
    );
    world.add(lattice);

    const surfaceCount = 560;
    const surfacePositions = new Float32Array(surfaceCount * 3);
    const goldenAngle = Math.PI * (3 - Math.sqrt(5));
    for (let index = 0; index < surfaceCount; index += 1) {
      const vertical = 1 - (index / (surfaceCount - 1)) * 2;
      const radial = Math.sqrt(Math.max(0, 1 - vertical * vertical));
      const angle = index * goldenAngle;
      const radius = 1.068 + (random() - 0.5) * 0.014;
      surfacePositions[index * 3] = Math.cos(angle) * radial * radius;
      surfacePositions[index * 3 + 1] = vertical * radius;
      surfacePositions[index * 3 + 2] = Math.sin(angle) * radial * radius;
    }
    const surfaceGeometry = new THREE.BufferGeometry();
    surfaceGeometry.setAttribute("position", new THREE.BufferAttribute(surfacePositions, 3));
    const surfaceMaterial = new THREE.PointsMaterial({
      color: palette.surface,
      opacity: themeRef.current === "dark" ? 0.34 : 0.24,
      size: 0.012,
      sizeAttenuation: true,
      transparent: true,
      toneMapped: false,
    });
    const surface = new THREE.Points(surfaceGeometry, surfaceMaterial);
    world.add(surface);

    const atmosphere = new THREE.Mesh(
      new THREE.SphereGeometry(1.16, 48, 36),
      createAtmosphereMaterial(
        palette.atmosphere,
        themeRef.current === "dark" ? 0.52 : 0.34,
      ),
    );
    world.add(atmosphere);

    const ringMaterials = palette.rings.map((color) => new THREE.MeshBasicMaterial({
      color,
      opacity: themeRef.current === "dark" ? 0.2 : 0.14,
      transparent: true,
      toneMapped: false,
      side: THREE.DoubleSide,
    }));
    const ringDefinitions = [
      { radius: 1.3, tube: 0.009, rotation: [1.08, 0.18, 0.4], materialIndex: 0 },
      { radius: 1.46, tube: 0.007, rotation: [0.34, 1.1, -0.24], materialIndex: 1 },
      { radius: 0.58, tube: 0.007, rotation: [1.34, 0.42, -0.48], materialIndex: 2 },
    ] as const;
    const rings = ringDefinitions.map((definition) => {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(definition.radius, definition.tube, 10, 220),
        ringMaterials[definition.materialIndex],
      );
      ring.rotation.set(definition.rotation[0], definition.rotation[1], definition.rotation[2]);
      world.add(ring);
      return ring;
    });

    const flowMaterials = palette.flows.map((color) => new THREE.MeshBasicMaterial({
      color,
      opacity: themeRef.current === "dark" ? 0.34 : 0.24,
      transparent: true,
      toneMapped: false,
      side: THREE.DoubleSide,
    }));
    const flowDefinitions = [
      { start: [48, -16], end: [-38, 82], lift: 0.26, twist: 0.18, materialIndex: 0, radius: 1.16, tube: 0.012 },
      { start: [32, 136], end: [-18, -34], lift: 0.22, twist: -0.14, materialIndex: 1, radius: 1.12, tube: 0.01 },
      { start: [10, -118], end: [56, 26], lift: 0.18, twist: 0.16, materialIndex: 2, radius: 1.08, tube: 0.009 },
      { start: [-52, 34], end: [14, 164], lift: 0.24, twist: -0.12, materialIndex: 1, radius: 1.18, tube: 0.011 },
    ] as const;
    const flowGroup = new THREE.Group();
    world.add(flowGroup);
    flowDefinitions.forEach((definition) => {
      const curve = buildArcCurve(
        definition.radius,
        definition.start[0],
        definition.start[1],
        definition.end[0],
        definition.end[1],
        definition.lift,
        definition.twist,
      );
      const tube = new THREE.Mesh(
        new THREE.TubeGeometry(curve, 96, definition.tube, 12, false),
        flowMaterials[definition.materialIndex],
      );
      flowGroup.add(tube);
    });

    const beaconMaterials = palette.beacons.map((color) => new THREE.MeshBasicMaterial({
      color,
      opacity: themeRef.current === "dark" ? 0.86 : 0.68,
      transparent: true,
      toneMapped: false,
      side: THREE.DoubleSide,
    }));
    const beaconPlacements = buildModelPlacements(createSeededRandom(514)).filter((_, index) => index % 2 === 0);
    const beaconMeshes = beaconMaterials.map((material) => {
      const mesh = new THREE.InstancedMesh(
        new THREE.SphereGeometry(1, 12, 12),
        material,
        Math.ceil(beaconPlacements.length / beaconMaterials.length),
      );
      mesh.instanceMatrix.setUsage(THREE.StaticDrawUsage);
      beaconField.add(mesh);
      return mesh;
    });

    const matrix = new THREE.Matrix4();
    const beaconCounts = beaconMeshes.map(() => 0);
    beaconPlacements.forEach((placement, index) => {
      const normal = sphericalPoint(1, placement.latitude, placement.longitude).normalize();
      const beaconIndex = index % beaconMeshes.length;
      const slot = beaconCounts[beaconIndex];
      beaconCounts[beaconIndex] += 1;
      matrix.compose(
        normal.multiplyScalar(1.18 + placement.height * 0.58),
        new THREE.Quaternion(),
        new THREE.Vector3().setScalar(0.013 + (index % 4) * 0.0025),
      );
      beaconMeshes[beaconIndex].setMatrixAt(slot, matrix);
    });
    beaconMeshes.forEach((mesh, index) => {
      mesh.count = beaconCounts[index];
      mesh.instanceMatrix.needsUpdate = true;
    });

    const hazeMaterials = palette.haze.map((color, index) =>
      createHazeMaterial(color, themeRef.current === "dark" ? 0.12 : 0.075, index * 1.4),
    );
    const hazeGroup = new THREE.Group();
    scene.add(hazeGroup);
    const hazeDefinitions = [
      { position: [-1.48, 0.16, -0.82], rotation: [0.08, 0.18, 0.31], size: [1.9, 3.8], materialIndex: 0 },
      { position: [1.44, -0.04, -0.76], rotation: [-0.06, -0.18, -0.26], size: [1.8, 3.6], materialIndex: 1 },
      { position: [0.08, 1.08, -1.08], rotation: [0.24, 0.02, 0.0], size: [2.1, 2.45], materialIndex: 2 },
    ] as const;
    const hazePlanes = hazeDefinitions.map((definition) => {
      const plane = new THREE.Mesh(
        new THREE.PlaneGeometry(definition.size[0], definition.size[1], 1, 1),
        hazeMaterials[definition.materialIndex],
      );
      plane.position.set(definition.position[0], definition.position[1], definition.position[2]);
      plane.rotation.set(definition.rotation[0], definition.rotation[1], definition.rotation[2]);
      hazeGroup.add(plane);
      return plane;
    });

    const starCount = 84;
    const starPositions = new Float32Array(starCount * 3);
    for (let index = 0; index < starCount; index += 1) {
      const radius = 1.95 + random() * 1.4;
      const latitude = THREE.MathUtils.radToDeg(Math.asin(2 * random() - 1));
      const longitude = random() * 360;
      const point = sphericalPoint(radius, latitude, longitude);
      starPositions[index * 3] = point.x;
      starPositions[index * 3 + 1] = point.y * 0.8;
      starPositions[index * 3 + 2] = point.z;
    }
    const starGeometry = new THREE.BufferGeometry();
    starGeometry.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));
    const starMaterial = new THREE.PointsMaterial({
      color: palette.stars,
      opacity: themeRef.current === "dark" ? 0.42 : 0.3,
      size: 0.022,
      sizeAttenuation: true,
      transparent: true,
      toneMapped: false,
    });
    const stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);

    const ambient = new THREE.AmbientLight(palette.ambient, themeRef.current === "dark" ? 1.08 : 1.52);
    const key = new THREE.PointLight(palette.key, 28, 12, 2);
    key.position.set(2.8, 2.6, 4.0);
    const rim = new THREE.PointLight(palette.rim, 24, 12, 2);
    rim.position.set(-3.0, 0.4, 2.6);
    const fill = new THREE.PointLight(palette.fill, 18, 10, 2);
    fill.position.set(0.4, -2.8, 2.2);
    scene.add(ambient, key, rim, fill);

    const modelMaterials: ModelMaterialBinding[] = [];
    const modelEdgeMaterials = palette.architectureEmissive.map((color) => new THREE.LineBasicMaterial({
      color,
      opacity: themeRef.current === "dark" ? 0.2 : 0.13,
      transparent: true,
      depthWrite: false,
      toneMapped: false,
    }));
    appearanceRef.current = {
      core: core.material as THREE.MeshPhysicalMaterial,
      kernel: kernel.material as THREE.MeshBasicMaterial,
      shell: innerShell.material as THREE.MeshPhysicalMaterial,
      atmosphere: atmosphere.material as THREE.ShaderMaterial,
      lattice: latticeMaterial,
      surface: surfaceMaterial,
      rings: ringMaterials,
      flows: flowMaterials,
      beacons: beaconMaterials,
      modelEdges: modelEdgeMaterials,
      haze: hazeMaterials,
      stars: starMaterial,
      modelMaterials,
      ambient,
      key,
      rim,
      fill,
      renderer,
    };

    const loader = new GLTFLoader();
    const up = new THREE.Vector3(0, 1, 0);
    const edgeGeometryCache = new Map<THREE.BufferGeometry, THREE.EdgesGeometry>();
    let cancelled = false;

    void Promise.allSettled(MODEL_PATHS.map((path) => loader.loadAsync(path))).then((results) => {
      if (cancelled) {
        return;
      }

      const models: NormalizedModel[] = results.flatMap((result) => {
        if (result.status !== "fulfilled") {
          return [];
        }

        return [normalizeModelTemplate(result.value.scene)];
      });

      if (!models.length) {
        return;
      }

      const placements = buildModelPlacements(createSeededRandom(514));
      placements.forEach((placement, placementIndex) => {
        const model = models[placement.modelIndex % models.length];
        const instance = model.template.clone(true);
        const heightScale = placement.height / model.height;
        const footprintScale = Math.min(heightScale, placement.footprint / model.footprint);

        instance.scale.set(footprintScale, heightScale, footprintScale);
        instance.position.y = 0.015;

        instance.traverse((object) => {
          if (!(object instanceof THREE.Mesh)) {
            return;
          }

          const material = new THREE.MeshPhysicalMaterial({
            color: palette.architecture[placement.variant % palette.architecture.length],
            emissive: palette.architectureEmissive[placement.variant % palette.architectureEmissive.length],
            emissiveIntensity: themeRef.current === "dark" ? 0.2 : 0.1,
            metalness: themeRef.current === "dark" ? 0.9 : 0.76,
            roughness: themeRef.current === "dark" ? 0.31 : 0.4,
            clearcoat: themeRef.current === "dark" ? 0.92 : 0.76,
            clearcoatRoughness: themeRef.current === "dark" ? 0.16 : 0.24,
            side: THREE.DoubleSide,
          });

          object.material = material;
          let edgeGeometry = edgeGeometryCache.get(object.geometry);
          if (!edgeGeometry) {
            edgeGeometry = new THREE.EdgesGeometry(object.geometry, 38);
            edgeGeometryCache.set(object.geometry, edgeGeometry);
          }
          const outline = new THREE.LineSegments(
            edgeGeometry,
            modelEdgeMaterials[placement.variant % modelEdgeMaterials.length],
          );
          outline.renderOrder = 2;
          object.add(outline);
          modelMaterials.push({
            material,
            variant: placement.variant,
          });
        });

        const normal = sphericalPoint(1, placement.latitude, placement.longitude).normalize();
        const anchor = new THREE.Group();
        anchor.position.copy(normal.clone().multiplyScalar(1.035));
        anchor.quaternion.setFromUnitVectors(up, normal);
        anchor.rotateY(placement.spin);

        if (placementIndex % 5 === 0) {
          anchor.rotateX(0.06);
        }

        anchor.add(instance);
        structures.add(anchor);
      });

      const appearance = appearanceRef.current;
      if (appearance) {
        applyThemeToAppearance(appearance, themeRef.current);
      }
    });

    let dragging = false;
    let visible = true;
    let pointerId: number | null = null;
    let previousX = 0;
    let previousY = 0;
    const currentRotation = world.quaternion.clone();
    const targetRotation = world.quaternion.clone();
    const yawAxis = new THREE.Vector3(0, 1, 0);
    const pitchAxis = new THREE.Vector3(1, 0, 0);
    const yawDelta = new THREE.Quaternion();
    const pitchDelta = new THREE.Quaternion();
    let raf = 0;
    let lastTime = performance.now();

    const resize = () => {
      const { width, height } = host.getBoundingClientRect();

      if (width <= 0 || height <= 0) {
        return;
      }

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
      if (!dragging || event.pointerId !== pointerId) {
        return;
      }

      event.preventDefault();
      const deltaX = event.clientX - previousX;
      const deltaY = event.clientY - previousY;
      previousX = event.clientX;
      previousY = event.clientY;
      yawDelta.setFromAxisAngle(yawAxis, deltaX * 0.0078);
      pitchDelta.setFromAxisAngle(pitchAxis, deltaY * 0.0066);
      targetRotation.premultiply(yawDelta).premultiply(pitchDelta).normalize();
    };

    const handlePointerUp = (event: PointerEvent) => {
      if (event.pointerId !== pointerId) {
        return;
      }

      event.preventDefault();
      dragging = false;
      pointerId = null;
      host.classList.remove("is-dragging");
      host.releasePointerCapture?.(event.pointerId);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      const step = event.shiftKey ? 0.22 : 0.12;

      if (event.key === "ArrowLeft") {
        yawDelta.setFromAxisAngle(yawAxis, -step);
        targetRotation.premultiply(yawDelta).normalize();
      } else if (event.key === "ArrowRight") {
        yawDelta.setFromAxisAngle(yawAxis, step);
        targetRotation.premultiply(yawDelta).normalize();
      } else if (event.key === "ArrowUp") {
        pitchDelta.setFromAxisAngle(pitchAxis, -step);
        targetRotation.premultiply(pitchDelta).normalize();
      } else if (event.key === "ArrowDown") {
        pitchDelta.setFromAxisAngle(pitchAxis, step);
        targetRotation.premultiply(pitchDelta).normalize();
      } else {
        return;
      }

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

      if (!dragging && !reduceMotionRef.current) {
        yawDelta.setFromAxisAngle(yawAxis, delta * 0.1);
        targetRotation.premultiply(yawDelta).normalize();
      }

      currentRotation.slerp(targetRotation, Math.min(1, delta * 8));
      world.quaternion.copy(currentRotation);

      if (!reduceMotionRef.current) {
        kernel.rotation.x += delta * 0.4;
        kernel.rotation.y -= delta * 0.3;
        const kernelScale = 1 + Math.sin(time * 0.0012) * 0.06;
        kernel.scale.setScalar(kernelScale);

        innerShell.rotation.y -= delta * 0.05;
        lattice.rotation.y += delta * 0.08;
        lattice.rotation.z += delta * 0.03;
        surface.rotation.y -= delta * 0.025;
        orbitalField.rotation.y -= delta * 0.06;
        flowGroup.rotation.y += delta * 0.08;
        flowGroup.rotation.x = Math.sin(time * 0.00022) * 0.05;

        rings[0].rotation.z += delta * 0.05;
        rings[1].rotation.x -= delta * 0.04;
        rings[2].rotation.y += delta * 0.06;

        hazeGroup.rotation.z = Math.sin(time * 0.00018) * 0.08;
        hazePlanes.forEach((plane, index) => {
          plane.position.y += Math.sin(time * 0.00055 + index * 1.6) * 0.0009;
          plane.rotation.z += Math.sin(time * 0.0002 + index) * 0.00028;
          hazeMaterials[index].uniforms.uTime.value = time * 0.001;
        });

        key.position.x = 2.6 + Math.sin(time * 0.00042) * 0.7;
        key.position.y = 2.4 + Math.cos(time * 0.00034) * 0.5;
        key.intensity = 26 + Math.sin(time * 0.00105) * 3.5;
        rim.position.y = 0.4 + Math.sin(time * 0.0004) * 0.8;
        rim.intensity = 23 + Math.cos(time * 0.00095) * 3;
        fill.position.x = 0.4 + Math.cos(time * 0.00033) * 0.9;
        fill.intensity = 17 + Math.sin(time * 0.00082 + 1.4) * 2.4;
        stars.rotation.y -= delta * 0.016;
      }

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
      cancelled = true;
      window.cancelAnimationFrame(raf);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      host.removeEventListener("pointerdown", handlePointerDown);
      host.removeEventListener("pointermove", handlePointerMove);
      host.removeEventListener("pointerup", handlePointerUp);
      host.removeEventListener("pointercancel", handlePointerUp);
      host.removeEventListener("keydown", handleKeyDown);
      appearanceRef.current = null;

      const disposedGeometries = new Set<THREE.BufferGeometry>();
      const disposedMaterials = new Set<THREE.Material>();
      scene.traverse((object) => {
        if (!(object instanceof THREE.Mesh || object instanceof THREE.Line || object instanceof THREE.Points)) {
          return;
        }

        if (object.geometry && !disposedGeometries.has(object.geometry)) {
          object.geometry.dispose();
          disposedGeometries.add(object.geometry);
        }

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
      aria-label="球形数字世界模型，可拖动鼠标或使用方向键旋转"
      className="hero-model"
      ref={hostRef}
      tabIndex={0}
    />
  );
}
