import { Effect, EffectComposer, EffectPass, RenderPass } from "postprocessing";
import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import "./PixelBlast.css";

type PixelBlastVariant = "square" | "circle" | "triangle" | "diamond";

interface TouchPoint {
  x: number;
  y: number;
  vx: number;
  vy: number;
  force: number;
  age: number;
}

interface TouchTexture {
  canvas: HTMLCanvasElement;
  texture: THREE.Texture;
  addTouch: (norm: { x: number; y: number }) => void;
  reset: () => void;
  update: () => void;
  radiusScale: number;
  size: number;
}

type PixelBlastProps = {
  variant?: PixelBlastVariant;
  pixelSize?: number;
  color?: string;
  className?: string;
  style?: React.CSSProperties;
  antialias?: boolean;
  patternScale?: number;
  patternDensity?: number;
  liquid?: boolean;
  liquidStrength?: number;
  liquidRadius?: number;
  pixelSizeJitter?: number;
  enableRipples?: boolean;
  rippleIntensityScale?: number;
  rippleThickness?: number;
  rippleSpeed?: number;
  rippleLifetime?: number;
  liquidWobbleSpeed?: number;
  autoPauseOffscreen?: boolean;
  speed?: number;
  transparent?: boolean;
  edgeFade?: number;
  focusCenterX?: number;
  focusCenterY?: number;
  focusRadius?: number;
  focusInnerRadius?: number;
  noiseAmount?: number;
  particleLifetime?: number;
  particleRespawnDelay?: number;
  particleMotion?: number;
};

const createTouchTexture = (): TouchTexture => {
  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("2D context not available");
  }

  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const texture = new THREE.Texture(canvas);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;

  const trail: TouchPoint[] = [];
  let last: { x: number; y: number } | null = null;
  const maxAge = 38;
  let radius = 0.1 * size;
  const minDelta = 0.0012;

  const clear = () => {
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const drawPoint = (point: TouchPoint) => {
    const pos = { x: point.x * size, y: (1 - point.y) * size };
    const easeOutQuad = (t: number) => -t * (t - 2);
    const life = Math.max(0, 1 - point.age / maxAge);
    const intensity = (easeOutQuad(life) || 0) * point.force;
    const color = `${((point.vx + 1) / 2) * 255}, ${((point.vy + 1) / 2) * 255}, ${intensity * 255}`;
    const offset = size * 5;

    ctx.shadowOffsetX = offset;
    ctx.shadowOffsetY = offset;
    ctx.shadowBlur = radius;
    ctx.shadowColor = `rgba(${color},${0.22 * intensity})`;
    ctx.beginPath();
    ctx.fillStyle = "rgba(255,0,0,1)";
    ctx.arc(pos.x - offset, pos.y - offset, radius, 0, Math.PI * 2);
    ctx.fill();
  };

  const addTouch = (norm: { x: number; y: number }) => {
    if (!last) {
      last = { x: norm.x, y: norm.y };
      trail.push({ x: norm.x, y: norm.y, age: 0, force: 0.28, vx: 0, vy: 0 });
      return;
    }

    const dx = norm.x - last.x;
    const dy = norm.y - last.y;
    const dd = dx * dx + dy * dy;
    const d = Math.sqrt(dd);

    if (d < minDelta) {
      return;
    }

    const vx = dx / (d || 1);
    const vy = dy / (d || 1);
    const baseForce = Math.max(0.22, Math.min(dd * 5600, 1) * 0.88);
    const steps = Math.min(4, Math.max(1, Math.ceil(d * 36)));

    for (let step = 1; step <= steps; step += 1) {
      const progress = step / steps;
      const x = last.x + dx * progress;
      const y = last.y + dy * progress;
      const force = baseForce * (0.82 + progress * 0.18);

      trail.push({ x, y, age: 0, force, vx, vy });
    }

    last = { x: norm.x, y: norm.y };
  };

  const reset = () => {
    last = null;
  };

  const update = () => {
    clear();

    for (let i = trail.length - 1; i >= 0; i -= 1) {
      const point = trail[i];
      point.age += 1;

      if (point.age > maxAge) {
        trail.splice(i, 1);
      }
    }

    for (let i = 0; i < trail.length; i += 1) {
      drawPoint(trail[i]);
    }

    texture.needsUpdate = true;
  };

  return {
    canvas,
    texture,
    addTouch,
    reset,
    update,
    set radiusScale(value: number) {
      radius = 0.1 * size * value;
    },
    get radiusScale() {
      return radius / (0.1 * size);
    },
    size,
  };
};

const createLiquidEffect = (
  texture: THREE.Texture,
  opts?: { strength?: number; freq?: number },
) => {
  const fragment = `
    uniform sampler2D uTexture;
    uniform float uStrength;
    uniform float uTime;
    uniform float uFreq;

    void mainUv(inout vec2 uv) {
      vec4 tex = texture2D(uTexture, uv);
      float vx = tex.r * 2.0 - 1.0;
      float vy = tex.g * 2.0 - 1.0;
      float intensity = tex.b;
      float wave = 0.5 + 0.5 * sin(uTime * uFreq + intensity * 6.2831853);
      float amt = uStrength * intensity * wave;
      uv += vec2(vx, vy) * amt;
    }
  `;

  return new Effect("LiquidEffect", fragment, {
    uniforms: new Map<string, THREE.Uniform>([
      ["uTexture", new THREE.Uniform(texture)],
      ["uStrength", new THREE.Uniform(opts?.strength ?? 0.025)],
      ["uTime", new THREE.Uniform(0)],
      ["uFreq", new THREE.Uniform(opts?.freq ?? 4.5)],
    ]),
  });
};

const SHAPE_MAP: Record<PixelBlastVariant, number> = {
  square: 0,
  circle: 1,
  triangle: 2,
  diamond: 3,
};

const VERTEX_SRC = `
void main() {
  gl_Position = vec4(position, 1.0);
}
`;

const FRAGMENT_SRC = `
precision highp float;

uniform vec3  uColor;
uniform vec2  uResolution;
uniform float uTime;
uniform float uParticleTime;
uniform float uPixelSize;
uniform float uScale;
uniform float uDensity;
uniform float uPixelJitter;
uniform int   uEnableRipples;
uniform float uRippleSpeed;
uniform float uRippleThickness;
uniform float uRippleIntensity;
uniform float uRippleLifetime;
uniform float uEdgeFade;
uniform int   uFocusEnabled;
uniform vec2  uFocusCenter;
uniform float uFocusRadius;
uniform float uFocusInnerRadius;
uniform float uParticleLifetime;
uniform float uParticleRespawnDelay;
uniform float uParticleMotion;

uniform int   uShapeType;
const int SHAPE_SQUARE   = 0;
const int SHAPE_CIRCLE   = 1;
const int SHAPE_TRIANGLE = 2;
const int SHAPE_DIAMOND  = 3;

const int MAX_CLICKS = 10;

uniform vec2  uClickPos[MAX_CLICKS];
uniform float uClickTimes[MAX_CLICKS];

out vec4 fragColor;

float Bayer2(vec2 a) {
  a = floor(a);
  return fract(a.x / 2. + a.y * a.y * .75);
}
#define Bayer4(a) (Bayer2(.5*(a))*0.25 + Bayer2(a))
#define Bayer8(a) (Bayer4(.5*(a))*0.25 + Bayer2(a))

#define FBM_OCTAVES 5
#define FBM_LACUNARITY 1.25
#define FBM_GAIN 1.0

float hash11(float n){ return fract(sin(n)*43758.5453); }

float saturate(float value) {
  return clamp(value, 0.0, 1.0);
}

float particleLifecycle(vec2 id, float time, out float ageNorm) {
  float birthSeed = hash11(dot(id, vec2(17.17, 43.13)) + 11.0);
  float restSeed = hash11(dot(id, vec2(91.7, 13.3)) + 29.0);
  float life = max(0.12, uParticleLifetime * (0.7 + birthSeed * 0.55));
  float rest = max(0.0, uParticleRespawnDelay * (0.35 + restSeed));
  float cycle = life + rest;
  float phase = mod(time + birthSeed * cycle, cycle);

  ageNorm = saturate(phase / life);

  float alive = 1.0 - step(life, phase);
  float fadeIn = smoothstep(0.0, 0.16, ageNorm);
  float fadeOut = 1.0 - smoothstep(0.68, 1.0, ageNorm);

  return alive * fadeIn * fadeOut;
}

vec2 particleDrift(vec2 id, float ageNorm) {
  float angle = hash11(dot(id, vec2(53.7, 31.1)) + 7.0) * 6.2831853;
  float speed = 0.2 + hash11(dot(id, vec2(23.3, 71.9)) + 19.0) * 0.8;
  return vec2(cos(angle), sin(angle)) * uParticleMotion * speed * ageNorm * ageNorm;
}

float vnoise(vec3 p){
  vec3 ip = floor(p);
  vec3 fp = fract(p);
  float n000 = hash11(dot(ip + vec3(0.0,0.0,0.0), vec3(1.0,57.0,113.0)));
  float n100 = hash11(dot(ip + vec3(1.0,0.0,0.0), vec3(1.0,57.0,113.0)));
  float n010 = hash11(dot(ip + vec3(0.0,1.0,0.0), vec3(1.0,57.0,113.0)));
  float n110 = hash11(dot(ip + vec3(1.0,1.0,0.0), vec3(1.0,57.0,113.0)));
  float n001 = hash11(dot(ip + vec3(0.0,0.0,1.0), vec3(1.0,57.0,113.0)));
  float n101 = hash11(dot(ip + vec3(1.0,0.0,1.0), vec3(1.0,57.0,113.0)));
  float n011 = hash11(dot(ip + vec3(0.0,1.0,1.0), vec3(1.0,57.0,113.0)));
  float n111 = hash11(dot(ip + vec3(1.0,1.0,1.0), vec3(1.0,57.0,113.0)));
  vec3 w = fp*fp*fp*(fp*(fp*6.0-15.0)+10.0);
  float x00 = mix(n000, n100, w.x);
  float x10 = mix(n010, n110, w.x);
  float x01 = mix(n001, n101, w.x);
  float x11 = mix(n011, n111, w.x);
  float y0 = mix(x00, x10, w.y);
  float y1 = mix(x01, x11, w.y);
  return mix(y0, y1, w.z) * 2.0 - 1.0;
}

float fbm2(vec2 uv, float t){
  vec3 p = vec3(uv * uScale, t);
  float amp = 1.0;
  float freq = 1.0;
  float sum = 1.0;
  for (int i = 0; i < FBM_OCTAVES; ++i){
    sum += amp * vnoise(p * freq);
    freq *= FBM_LACUNARITY;
    amp *= FBM_GAIN;
  }
  return sum * 0.5 + 0.5;
}

float maskCircle(vec2 p, float cov){
  float r = sqrt(cov) * .25;
  float d = length(p - 0.5) - r;
  float aa = 0.5 * fwidth(d);
  return cov * (1.0 - smoothstep(-aa, aa, d * 2.0));
}

float maskTriangle(vec2 p, vec2 id, float cov){
  bool flip = mod(id.x + id.y, 2.0) > 0.5;
  if (flip) p.x = 1.0 - p.x;
  float r = sqrt(cov);
  float d = p.y - r * (1.0 - p.x);
  float aa = fwidth(d);
  return cov * clamp(0.5 - d / aa, 0.0, 1.0);
}

float maskDiamond(vec2 p, float cov){
  float r = sqrt(cov) * 0.564;
  return step(abs(p.x - 0.49) + abs(p.y - 0.49), r);
}

void main(){
  float pixelSize = uPixelSize;
  vec2 fragCoord = gl_FragCoord.xy - uResolution * .5;
  float aspectRatio = uResolution.x / uResolution.y;

  vec2 pixelId = floor(fragCoord / pixelSize);
  float particleAge = 0.0;
  float particleLife = particleLifecycle(pixelId, uParticleTime * 0.74, particleAge);
  vec2 driftedFragCoord = fragCoord - particleDrift(pixelId, particleAge) * pixelSize;
  vec2 pixelUV = fract(driftedFragCoord / pixelSize);

  float cellPixelSize = 8.0 * pixelSize;
  vec2 cellId = floor(fragCoord / cellPixelSize);
  vec2 cellCoord = cellId * cellPixelSize;
  vec2 uv = cellCoord / uResolution * vec2(aspectRatio, 1.0);

  float base = fbm2(uv, uTime * 0.05);
  base = base * 0.5 - 0.65;
  float feed = base + (uDensity - 0.5) * 0.3;

  if (uEnableRipples == 1) {
    float speed = uRippleSpeed;
    float thickness = uRippleThickness;
    const float dampT = 1.0;
    const float dampR = 10.0;

    for (int i = 0; i < MAX_CLICKS; ++i) {
      vec2 pos = uClickPos[i];
      if (pos.x < 0.0) continue;
      float localCellPixelSize = 8.0 * pixelSize;
      vec2 cuv = (((pos - uResolution * .5 - localCellPixelSize * .5) / (uResolution))) * vec2(aspectRatio, 1.0);
      float t = max(uTime - uClickTimes[i], 0.0);
      if (t > uRippleLifetime) continue;
      float r = distance(uv, cuv);
      float waveR = speed * t;
      float ring = exp(-pow((r - waveR) / thickness, 2.0));
      float atten = exp(-dampT * t) * exp(-dampR * r);
      feed = max(feed, ring * atten * uRippleIntensity);
    }
  }

  float bayer = Bayer8(fragCoord / uPixelSize) - 0.5;
  float bw = step(0.5, feed + bayer);

  float h = fract(sin(dot(floor(fragCoord / uPixelSize), vec2(127.1, 311.7))) * 43758.5453);
  float jitterScale = 1.0 + (h - 0.5) * uPixelJitter;
  float coverage = bw * jitterScale * particleLife;

  float M;
  if (uShapeType == SHAPE_CIRCLE) M = maskCircle(pixelUV, coverage);
  else if (uShapeType == SHAPE_TRIANGLE) M = maskTriangle(pixelUV, pixelId, coverage);
  else if (uShapeType == SHAPE_DIAMOND) M = maskDiamond(pixelUV, coverage);
  else M = coverage;

  if (uFocusEnabled == 1) {
    vec2 focusCenter = uFocusCenter * uResolution;
    float focusDistance = distance(gl_FragCoord.xy, focusCenter);
    float focusOuterRadius = uFocusRadius * min(uResolution.x, uResolution.y);
    float normalizedDistance = focusDistance / max(focusOuterRadius, 0.0001);
    float focusDensity = 1.0 - smoothstep(uFocusInnerRadius, 1.0, normalizedDistance);
    float focusNoise = hash11(dot(pixelId, vec2(127.1, 311.7)) + 17.0);
    float focusBalanceNoise = hash11(dot(pixelId, vec2(41.3, 289.1)) + 91.0);
    float focusAge = 0.0;
    float focusLife = particleLifecycle(pixelId + vec2(97.0, 31.0), uParticleTime * 0.82, focusAge);
    vec2 focusPixelUV = fract((fragCoord - particleDrift(pixelId + vec2(97.0, 31.0), focusAge) * pixelSize) / pixelSize);
    float focusCoverage = step(focusBalanceNoise, focusDensity * 0.08) * focusLife;
    float insideFocus = 1.0 - step(1.0, normalizedDistance);
    float focusM;

    if (uShapeType == SHAPE_CIRCLE) focusM = maskCircle(focusPixelUV, focusCoverage);
    else if (uShapeType == SHAPE_TRIANGLE) focusM = maskTriangle(focusPixelUV, pixelId, focusCoverage);
    else if (uShapeType == SHAPE_DIAMOND) focusM = maskDiamond(focusPixelUV, focusCoverage);
    else focusM = focusCoverage;

    M = max(M * insideFocus * step(focusNoise, focusDensity), focusM * insideFocus);
  }

  if (uEdgeFade > 0.0) {
    vec2 norm = gl_FragCoord.xy / uResolution;
    float edge = min(min(norm.x, norm.y), min(1.0 - norm.x, 1.0 - norm.y));
    float fade = smoothstep(0.0, uEdgeFade, edge);
    M *= fade;
  }

  vec3 color = uColor;
  vec3 srgbColor = mix(
    color * 12.92,
    1.055 * pow(color, vec3(1.0 / 2.4)) - 0.055,
    step(0.0031308, color)
  );

  fragColor = vec4(srgbColor, M);
}
`;

const MAX_CLICKS = 10;

const PixelBlast: React.FC<PixelBlastProps> = ({
  variant = "square",
  pixelSize = 3,
  color = "#C08BFF",
  className,
  style,
  antialias = true,
  patternScale = 2,
  patternDensity = 1,
  liquid = false,
  liquidStrength = 0.1,
  liquidRadius = 1,
  pixelSizeJitter = 0,
  enableRipples = true,
  rippleIntensityScale = 1,
  rippleThickness = 0.1,
  rippleSpeed = 0.3,
  rippleLifetime = 3.1,
  liquidWobbleSpeed = 4.5,
  autoPauseOffscreen = true,
  speed = 0.5,
  transparent = true,
  edgeFade = 0.5,
  focusCenterX = 0.5,
  focusCenterY = 0.5,
  focusRadius = 0,
  focusInnerRadius = 0.46,
  noiseAmount = 0,
  particleLifetime = 2.8,
  particleRespawnDelay = 1.15,
  particleMotion = 0.82,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const visibilityRef = useRef({ visible: true });
  const viewportVisibilityRef = useRef({ visible: true });
  const speedRef = useRef(speed);
  const pixelSizeRef = useRef(pixelSize);
  const autoPauseOffscreenRef = useRef(autoPauseOffscreen);
  const optionsRef = useRef({
    antialias,
    color,
    edgeFade,
    enableRipples,
    focusCenterX,
    focusCenterY,
    focusInnerRadius,
    focusRadius,
    liquid,
    liquidRadius,
    liquidStrength,
    liquidWobbleSpeed,
    noiseAmount,
    patternDensity,
    patternScale,
    particleLifetime,
    particleMotion,
    particleRespawnDelay,
    pixelSize,
    pixelSizeJitter,
    rippleIntensityScale,
    rippleLifetime,
    rippleSpeed,
    rippleThickness,
    speed,
    transparent,
    variant,
  });
  optionsRef.current = {
    antialias,
    color,
    edgeFade,
    enableRipples,
    focusCenterX,
    focusCenterY,
    focusInnerRadius,
    focusRadius,
    liquid,
    liquidRadius,
    liquidStrength,
    liquidWobbleSpeed,
    noiseAmount,
    patternDensity,
    patternScale,
    particleLifetime,
    particleMotion,
    particleRespawnDelay,
    pixelSize,
    pixelSizeJitter,
    rippleIntensityScale,
    rippleLifetime,
    rippleSpeed,
    rippleThickness,
    speed,
    transparent,
    variant,
  };
  const threeRef = useRef<{
    renderer: THREE.WebGLRenderer;
    material: THREE.ShaderMaterial;
    clickIx: number;
    uniforms: {
      uResolution: { value: THREE.Vector2 };
      uTime: { value: number };
      uParticleTime: { value: number };
      uColor: { value: THREE.Color };
      uClickPos: { value: THREE.Vector2[] };
      uClickTimes: { value: Float32Array };
      uShapeType: { value: number };
      uPixelSize: { value: number };
      uScale: { value: number };
      uDensity: { value: number };
      uPixelJitter: { value: number };
      uEnableRipples: { value: number };
      uRippleSpeed: { value: number };
      uRippleThickness: { value: number };
      uRippleIntensity: { value: number };
      uRippleLifetime: { value: number };
      uEdgeFade: { value: number };
      uFocusEnabled: { value: number };
      uFocusCenter: { value: THREE.Vector2 };
      uFocusRadius: { value: number };
      uFocusInnerRadius: { value: number };
      uParticleLifetime: { value: number };
      uParticleRespawnDelay: { value: number };
      uParticleMotion: { value: number };
    };
    resizeObserver?: ResizeObserver;
    quad?: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>;
    composer?: EffectComposer;
    touch?: ReturnType<typeof createTouchTexture>;
    liquidEffect?: Effect;
  } | null>(null);
  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return undefined;
    }

    const {
      antialias,
      color,
      edgeFade,
      enableRipples,
      focusCenterX,
      focusCenterY,
      focusInnerRadius,
      focusRadius,
      liquid,
      liquidRadius,
      liquidStrength,
      liquidWobbleSpeed,
      noiseAmount,
      patternDensity,
      patternScale,
      particleLifetime,
      particleMotion,
      particleRespawnDelay,
      pixelSize,
      pixelSizeJitter,
      rippleIntensityScale,
      rippleLifetime,
      rippleSpeed,
      rippleThickness,
      speed,
      transparent,
      variant,
    } = optionsRef.current;
    speedRef.current = speed;
    pixelSizeRef.current = pixelSize;
      const canvas = document.createElement("canvas");
      const renderer = new THREE.WebGLRenderer({
        canvas,
        antialias,
        alpha: true,
        powerPreference: "high-performance",
      });

      renderer.domElement.style.width = "100%";
      renderer.domElement.style.height = "100%";
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      container.appendChild(renderer.domElement);

      if (transparent) {
        renderer.setClearAlpha(0);
      } else {
        renderer.setClearColor(0x000000, 1);
      }

      const uniforms = {
        uResolution: { value: new THREE.Vector2(0, 0) },
        uTime: { value: 0 },
        uParticleTime: { value: 0 },
        uColor: { value: new THREE.Color(color) },
        uClickPos: {
          value: Array.from({ length: MAX_CLICKS }, () => new THREE.Vector2(-1, -1)),
        },
        uClickTimes: { value: new Float32Array(MAX_CLICKS) },
        uShapeType: { value: SHAPE_MAP[variant] ?? 0 },
        uPixelSize: { value: pixelSize * renderer.getPixelRatio() },
        uScale: { value: patternScale },
        uDensity: { value: patternDensity },
        uPixelJitter: { value: pixelSizeJitter },
        uEnableRipples: { value: enableRipples ? 1 : 0 },
        uRippleSpeed: { value: rippleSpeed },
        uRippleThickness: { value: rippleThickness },
        uRippleIntensity: { value: rippleIntensityScale },
        uRippleLifetime: { value: rippleLifetime },
        uEdgeFade: { value: edgeFade },
        uFocusEnabled: { value: focusRadius > 0 ? 1 : 0 },
        uFocusCenter: { value: new THREE.Vector2(focusCenterX, focusCenterY) },
        uFocusRadius: { value: focusRadius },
        uFocusInnerRadius: { value: focusInnerRadius },
        uParticleLifetime: { value: particleLifetime },
        uParticleRespawnDelay: { value: particleRespawnDelay },
        uParticleMotion: { value: particleMotion },
      };

      const scene = new THREE.Scene();
      const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
      const material = new THREE.ShaderMaterial({
        vertexShader: VERTEX_SRC,
        fragmentShader: FRAGMENT_SRC,
        uniforms,
        transparent: true,
        depthTest: false,
        depthWrite: false,
        glslVersion: THREE.GLSL3,
      });

      const quadGeom = new THREE.PlaneGeometry(2, 2);
      const quad = new THREE.Mesh(quadGeom, material);
      scene.add(quad);

      const clock = new THREE.Clock();
      const setSize = () => {
        const width = container.clientWidth || 1;
        const height = container.clientHeight || 1;
        renderer.setSize(width, height, false);
        uniforms.uResolution.value.set(renderer.domElement.width, renderer.domElement.height);

        if (threeRef.current?.composer) {
          threeRef.current.composer.setSize(renderer.domElement.width, renderer.domElement.height);
        }

        uniforms.uPixelSize.value = pixelSizeRef.current * renderer.getPixelRatio();
      };

      setSize();

      const resizeObserver = new ResizeObserver(setSize);
      resizeObserver.observe(container);

      const randomFloat = () => {
        if (typeof window !== "undefined" && window.crypto?.getRandomValues) {
          const buffer = new Uint32Array(1);
          window.crypto.getRandomValues(buffer);
          return buffer[0] / 0xffffffff;
        }

        return Math.random();
      };

      const timeOffset = randomFloat() * 1000;
      let composer: EffectComposer | undefined;
      let touch: ReturnType<typeof createTouchTexture> | undefined;
      let liquidEffect: Effect | undefined;

      if (liquid) {
        touch = createTouchTexture();
        touch.radiusScale = liquidRadius;
        composer = new EffectComposer(renderer);

        const renderPass = new RenderPass(scene, camera);
        liquidEffect = createLiquidEffect(touch.texture, {
          strength: liquidStrength,
          freq: liquidWobbleSpeed,
        });

        const effectPass = new EffectPass(camera, liquidEffect);
        effectPass.renderToScreen = true;
        composer.addPass(renderPass);
        composer.addPass(effectPass);
      }

      if (noiseAmount > 0) {
        if (!composer) {
          composer = new EffectComposer(renderer);
          composer.addPass(new RenderPass(scene, camera));
        }

        const noiseEffect = new Effect(
          "NoiseEffect",
          `uniform float uTime; uniform float uAmount; float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453);} void mainUv(inout vec2 uv){} void mainImage(const in vec4 inputColor,const in vec2 uv,out vec4 outputColor){ float n=hash(floor(uv*vec2(1920.0,1080.0))+floor(uTime*60.0)); float g=(n-0.5)*uAmount; outputColor=inputColor+vec4(vec3(g),0.0);} `,
          {
            uniforms: new Map<string, THREE.Uniform>([
              ["uTime", new THREE.Uniform(0)],
              ["uAmount", new THREE.Uniform(noiseAmount)],
            ]),
          },
        );

        const noisePass = new EffectPass(camera, noiseEffect);
        noisePass.renderToScreen = true;

        if (composer && composer.passes.length > 0) {
          composer.passes.forEach((pass) => {
            const currentPass = pass as { renderToScreen?: boolean };
            currentPass.renderToScreen = false;
          });
        }

        composer.addPass(noisePass);
      }

      if (composer) {
        composer.setSize(renderer.domElement.width, renderer.domElement.height);
      }

      const mapToPixels = (event: PointerEvent) => {
        const rect = renderer.domElement.getBoundingClientRect();
        const scaleX = renderer.domElement.width / rect.width;
        const scaleY = renderer.domElement.height / rect.height;
        const fx = (event.clientX - rect.left) * scaleX;
        const fy = (rect.height - (event.clientY - rect.top)) * scaleY;
        return { fx, fy, w: renderer.domElement.width, h: renderer.domElement.height };
      };

      const isInsideCanvas = (event: PointerEvent) => {
        const rect = renderer.domElement.getBoundingClientRect();
        return (
          event.clientX >= rect.left &&
          event.clientX <= rect.right &&
          event.clientY >= rect.top &&
          event.clientY <= rect.bottom
        );
      };

      const onPointerDown = (event: PointerEvent) => {
        if (!isInsideCanvas(event)) {
          return;
        }

        const { fx, fy } = mapToPixels(event);
        const ix = threeRef.current?.clickIx ?? 0;
        uniforms.uClickPos.value[ix].set(fx, fy);
        uniforms.uClickTimes.value[ix] = uniforms.uTime.value;

        if (threeRef.current) {
          threeRef.current.clickIx = (ix + 1) % MAX_CLICKS;
        }
      };

      const onPointerMove = (event: PointerEvent) => {
        if (!touch) {
          return;
        }

        if (!isInsideCanvas(event)) {
          touch.reset();
          return;
        }

        const { fx, fy, w, h } = mapToPixels(event);
        touch.addTouch({ x: fx / w, y: fy / h });
        touch.update();
      };

      const onPointerLeave = () => {
        touch?.reset();
      };

      window.addEventListener("pointerdown", onPointerDown, { passive: true });
      window.addEventListener("pointermove", onPointerMove, { passive: true });
      window.addEventListener("pointercancel", onPointerLeave, { passive: true });
      window.addEventListener("blur", onPointerLeave);
      const removePointerListeners = () => {
        window.removeEventListener("pointerdown", onPointerDown);
        window.removeEventListener("pointermove", onPointerMove);
        window.removeEventListener("pointercancel", onPointerLeave);
        window.removeEventListener("blur", onPointerLeave);
      };

      let raf = 0;
      const animate = () => {
        if (
          autoPauseOffscreenRef.current &&
          (!visibilityRef.current.visible || !viewportVisibilityRef.current.visible)
        ) {
          raf = requestAnimationFrame(animate);
          return;
        }

        const elapsedTime = clock.getElapsedTime();
        uniforms.uTime.value = timeOffset + elapsedTime * speedRef.current;
        uniforms.uParticleTime.value = timeOffset + elapsedTime;

        for (let index = 0; index < MAX_CLICKS; index += 1) {
          const clickPos = uniforms.uClickPos.value[index];

          if (
            clickPos.x >= 0 &&
            uniforms.uTime.value - uniforms.uClickTimes.value[index] > uniforms.uRippleLifetime.value
          ) {
            clickPos.set(-1, -1);
          }
        }

        if (liquidEffect) {
          const currentLiquid = liquidEffect as Effect & {
            uniforms: Map<string, THREE.Uniform>;
          };
          const timeUniform = currentLiquid.uniforms.get("uTime");

          if (timeUniform) {
            timeUniform.value = uniforms.uTime.value;
          }
        }

        if (composer) {
          if (touch) {
            touch.update();
          }

          composer.passes.forEach((pass) => {
            const currentPass = pass as {
              effects?: Array<Effect & { uniforms: Map<string, THREE.Uniform> }>;
            };

            if (currentPass.effects) {
              currentPass.effects.forEach((effect) => {
                const timeUniform = effect.uniforms?.get("uTime");
                if (timeUniform) {
                  timeUniform.value = uniforms.uTime.value;
                }
              });
            }
          });

          composer.render();
        } else {
          renderer.render(scene, camera);
        }

        raf = requestAnimationFrame(animate);
      };

      raf = requestAnimationFrame(animate);
      threeRef.current = {
        renderer,
        material,
        clickIx: 0,
        uniforms,
        resizeObserver,
        quad,
        composer,
        touch,
        liquidEffect,
      };

    return () => {
      removePointerListeners?.();
      cancelAnimationFrame(raf);

      if (!threeRef.current) {
        return;
      }

      const three = threeRef.current;
      three.resizeObserver?.disconnect();
      three.quad?.geometry.dispose();
      three.material.dispose();
      three.composer?.dispose();
      three.touch?.texture.dispose();
      three.renderer.dispose();

      if (three.renderer.domElement.parentElement === container) {
        container.removeChild(three.renderer.domElement);
      }

      threeRef.current = null;
    };
  }, [antialias, liquid, noiseAmount]);

  useEffect(() => {
    speedRef.current = speed;
    pixelSizeRef.current = pixelSize;
    autoPauseOffscreenRef.current = autoPauseOffscreen;

    const three = threeRef.current;
    if (!three) {
      return;
    }

    three.uniforms.uShapeType.value = SHAPE_MAP[variant] ?? 0;
    three.uniforms.uPixelSize.value = pixelSize * three.renderer.getPixelRatio();
    three.uniforms.uColor.value.set(color);
    three.uniforms.uScale.value = patternScale;
    three.uniforms.uDensity.value = patternDensity;
    three.uniforms.uPixelJitter.value = pixelSizeJitter;
    three.uniforms.uEnableRipples.value = enableRipples ? 1 : 0;
    three.uniforms.uRippleIntensity.value = rippleIntensityScale;
    three.uniforms.uRippleLifetime.value = rippleLifetime;
    three.uniforms.uRippleThickness.value = rippleThickness;
    three.uniforms.uRippleSpeed.value = rippleSpeed;
    three.uniforms.uEdgeFade.value = edgeFade;
    three.uniforms.uFocusEnabled.value = focusRadius > 0 ? 1 : 0;
    three.uniforms.uFocusCenter.value.set(focusCenterX, focusCenterY);
    three.uniforms.uFocusRadius.value = focusRadius;
    three.uniforms.uFocusInnerRadius.value = focusInnerRadius;
    three.uniforms.uParticleLifetime.value = particleLifetime;
    three.uniforms.uParticleRespawnDelay.value = particleRespawnDelay;
    three.uniforms.uParticleMotion.value = particleMotion;

    if (transparent) {
      three.renderer.setClearAlpha(0);
    } else {
      three.renderer.setClearColor(0x000000, 1);
    }

    if (three.liquidEffect) {
      const currentLiquid = three.liquidEffect as Effect & {
        uniforms: Map<string, THREE.Uniform>;
      };
      const strengthUniform = currentLiquid.uniforms.get("uStrength");
      const freqUniform = currentLiquid.uniforms.get("uFreq");

      if (strengthUniform) {
        strengthUniform.value = liquidStrength;
      }

      if (freqUniform) {
        freqUniform.value = liquidWobbleSpeed;
      }
    }

    if (three.touch) {
      three.touch.radiusScale = liquidRadius;
    }
  }, [
    autoPauseOffscreen,
    color,
    edgeFade,
    enableRipples,
    focusCenterX,
    focusCenterY,
    focusInnerRadius,
    focusRadius,
    liquidRadius,
    liquidStrength,
    liquidWobbleSpeed,
    patternDensity,
    patternScale,
    particleLifetime,
    particleMotion,
    particleRespawnDelay,
    pixelSize,
    pixelSizeJitter,
    rippleIntensityScale,
    rippleLifetime,
    rippleSpeed,
    rippleThickness,
    speed,
    transparent,
    variant,
  ]);

  useEffect(() => {
    if (!autoPauseOffscreen) {
      viewportVisibilityRef.current.visible = true;
      return undefined;
    }

    const container = containerRef.current;
    if (!container) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        viewportVisibilityRef.current.visible = entry.isIntersecting;
      },
      { rootMargin: "120px 0px" },
    );

    observer.observe(container);

    return () => observer.disconnect();
  }, [autoPauseOffscreen]);

  useEffect(() => {
    if (!autoPauseOffscreen) {
      visibilityRef.current.visible = true;
      return undefined;
    }

    const onVisibilityChange = () => {
      visibilityRef.current.visible = document.visibilityState !== "hidden";
    };

    onVisibilityChange();
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [autoPauseOffscreen]);

  return (
    <div
      ref={containerRef}
      aria-label="PixelBlast interactive background"
      className={`pixel-blast-container ${className ?? ""}`}
      style={style}
    />
  );
};

export default PixelBlast;
