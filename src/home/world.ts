import * as THREE from 'three';
import type { StoryState } from './story';
import { clamp01, smooth } from './story';

/* ─────────────────────────────────────────────────────────────────────────
   BitBuild world — one persistent WebGL scene driven by scroll.

   Layout (world space, camera flies along -Z):
     hub      z =    0   chapter 00 (and again at the end, relocated)
     idea     z =  -40   chapter 01
     play     z =  -80   chapter 02
     journey  z = -112 … -215   chapter 03 (skill tree, guides, error, wins)
     hub'     z = -232   chapter 04 (hub relocated while hidden, plus portal)
   Only the 'three' core package is used (no addons, no post-processing);
   glow is faked with additive sprites to keep it light and dependency-free.
   ───────────────────────────────────────────────────────────────────────── */

export interface LessonNode {
  id: string;
  num: string;
  label: string;
  xp: number;
}

export interface WorldOptions {
  canvas: HTMLCanvasElement;
  story: StoryState;
  lessons: LessonNode[];
  codeLines: string[];
  lite: boolean;
  reduced: boolean;
  onLost?: () => void;
}

export interface World {
  resize: () => void;
  dispose: () => void;
}

const C_PURPLE = 0x7c3aed;
const C_VIOLET = 0xa78bfa;
const C_CYAN = 0x22d3ee;
const C_BLUE = 0x3b82f6;
const C_RED = 0xff4d6d;
const MONO = '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace';
const HUB_END_Z = -232;

/* ── helpers ─────────────────────────────────────────────────────────── */

function textTexture(text: string, size = 44, color = '#e8eaf6', weight = 500) {
  const c = document.createElement('canvas');
  const g = c.getContext('2d')!;
  g.font = `${weight} ${size}px ${MONO}`;
  const w = Math.ceil(g.measureText(text).width) + 24;
  const h = Math.ceil(size * 1.7);
  c.width = w;
  c.height = h;
  g.font = `${weight} ${size}px ${MONO}`;
  g.textBaseline = 'middle';
  g.fillStyle = color;
  g.fillText(text, 12, h / 2 + 1);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return { tex, aspect: w / h };
}

function glowTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d')!;
  const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, 'rgba(255,255,255,1)');
  gr.addColorStop(0.25, 'rgba(255,255,255,0.32)');
  gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr;
  g.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

const KEYWORDS = new Set(['if', 'const', 'let', 'return', 'function', 'else', 'for']);
const ENGINE = new Set(['state', 'keys', 'dt', 'world']);

function panelTexture(title: string, lines: string[]) {
  const W = 720;
  const H = 440;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const g = c.getContext('2d')!;
  g.fillStyle = 'rgba(12,9,28,0.62)';
  g.fillRect(0, 0, W, H);
  g.strokeStyle = 'rgba(34,211,238,0.75)';
  g.lineWidth = 3;
  g.strokeRect(2, 2, W - 4, H - 4);
  g.fillStyle = 'rgba(124,58,237,0.28)';
  g.fillRect(3, 3, W - 6, 46);
  g.font = `600 22px ${MONO}`;
  g.textBaseline = 'middle';
  g.fillStyle = '#c4b5fd';
  g.fillText(title, 20, 27);
  g.font = `500 24px ${MONO}`;
  let y = 84;
  for (const raw of lines.slice(0, 10)) {
    const line = raw.length > 38 ? raw.slice(0, 37) + '…' : raw;
    let x = 20;
    if (line.trim().startsWith('//')) {
      g.fillStyle = '#6b7394';
      g.fillText(line, x, y);
    } else {
      const tokens = line.split(/(\s+|[(){};.,=+\-*<>!&|[\]]+)/).filter((s) => s.length > 0);
      for (const tok of tokens) {
        if (KEYWORDS.has(tok)) g.fillStyle = '#a78bfa';
        else if (/^\d/.test(tok)) g.fillStyle = '#22d3ee';
        else if (ENGINE.has(tok)) g.fillStyle = '#60a5fa';
        else g.fillStyle = '#cbd5e1';
        g.fillText(tok, x, y);
        x += g.measureText(tok).width;
      }
    }
    y += 34;
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function gridLines(size: number, step: number, color: number, opacity: number) {
  const pts: number[] = [];
  const h = size / 2;
  for (let v = -h; v <= h + 0.001; v += step) {
    pts.push(-h, 0, v, h, 0, v, v, 0, -h, v, 0, h);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
  return new THREE.LineSegments(
    g,
    new THREE.LineBasicMaterial({ color, transparent: true, opacity, depthWrite: false }),
  );
}

function edgeBox(w: number, h: number, d: number, color: number, opacity = 1) {
  return new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.BoxGeometry(w, h, d)),
    new THREE.LineBasicMaterial({ color, transparent: true, opacity }),
  );
}

function rand(a: number, b: number) {
  return a + Math.random() * (b - a);
}

interface Anchor {
  pos: THREE.Vector3;
  look: THREE.Vector3;
}

/* ── world ───────────────────────────────────────────────────────────── */

export function createWorld(opts: WorldOptions): World | null {
  const { canvas, story, lessons, codeLines, lite, reduced } = opts;

  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: !lite,
      alpha: false,
      powerPreference: 'high-performance',
    });
  } catch {
    return null;
  }

  const maxDpr = lite ? 1.25 : 1.75;
  const dpr = () => Math.min(window.devicePixelRatio || 1, maxDpr);
  renderer.setPixelRatio(dpr());
  renderer.setClearColor(0x06050c, 1);

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x06050c, 0.017);

  const camera = new THREE.PerspectiveCamera(58, 1, 0.1, 400);
  scene.add(camera);
  const camLight = new THREE.PointLight(0x9d7bff, 14, 40, 1.6);
  camLight.position.set(0, 2, 2);
  camera.add(camLight);
  scene.add(new THREE.AmbientLight(0x2a2450, 0.9));

  const glow = glowTexture();
  const disposables: THREE.Texture[] = [glow];

  const spriteText = (text: string, h: number, color = '#e8eaf6', tint = 0xffffff, size = 44, weight = 500) => {
    const { tex, aspect } = textTexture(text, size, color, weight);
    disposables.push(tex);
    const mat = new THREE.SpriteMaterial({
      map: tex,
      color: tint,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const s = new THREE.Sprite(mat);
    s.scale.set(aspect * h, h, 1);
    return s;
  };

  const haloSprite = (color: number, scale: number, opacity: number) => {
    const s = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: glow,
        color,
        transparent: true,
        opacity,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    );
    s.scale.set(scale, scale, 1);
    return s;
  };

  /* ── particles (whole run, long field) ─────────────────────────────── */
  const PCOUNT = lite ? 650 : 1700;
  const pPos = new Float32Array(PCOUNT * 3);
  const pCol = new Float32Array(PCOUNT * 3);
  const pSeed = new Float32Array(PCOUNT);
  const palette = [new THREE.Color(C_PURPLE), new THREE.Color(C_CYAN), new THREE.Color(C_BLUE), new THREE.Color(0xdde3ff)];
  for (let i = 0; i < PCOUNT; i++) {
    pPos[i * 3] = rand(-34, 34);
    pPos[i * 3 + 1] = rand(-14, 16);
    pPos[i * 3 + 2] = rand(-260, 26);
    const c = palette[Math.floor(Math.random() * palette.length)];
    pCol[i * 3] = c.r;
    pCol[i * 3 + 1] = c.g;
    pCol[i * 3 + 2] = c.b;
    pSeed[i] = Math.random();
  }
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
  pGeo.setAttribute('aColor', new THREE.BufferAttribute(pCol, 3));
  pGeo.setAttribute('aSeed', new THREE.BufferAttribute(pSeed, 1));
  const pMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: { uTime: { value: 0 }, uPx: { value: dpr() * 2.2 } },
    vertexShader: `
      attribute float aSeed; attribute vec3 aColor;
      uniform float uTime; uniform float uPx;
      varying vec3 vC; varying float vA;
      void main(){
        vec3 p = position;
        p.x += sin(uTime*0.15 + aSeed*20.0)*0.9;
        p.y += cos(uTime*0.12 + aSeed*31.0)*0.9;
        vec4 mv = modelViewMatrix*vec4(p,1.0);
        gl_Position = projectionMatrix*mv;
        float d = -mv.z;
        gl_PointSize = clamp(uPx*(0.6+aSeed*1.2)*(32.0/max(d,1.0)), 1.0, 22.0);
        vC = aColor;
        vA = smoothstep(2.0,9.0,d)*smoothstep(120.0,45.0,d);
      }`,
    fragmentShader: `
      varying vec3 vC; varying float vA;
      void main(){
        float r = length(gl_PointCoord-0.5);
        float a = smoothstep(0.5,0.0,r);
        gl_FragColor = vec4(vC, a*vA*0.85);
      }`,
  });
  scene.add(new THREE.Points(pGeo, pMat));

  /* ── HUB: opening world + closing portal ───────────────────────────── */
  const hub = new THREE.Group();
  scene.add(hub);

  // central focal object
  const core = new THREE.Group();
  hub.add(core);
  const coreMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: {
      uTime: { value: 0 },
      uA: { value: new THREE.Color(C_PURPLE) },
      uB: { value: new THREE.Color(C_CYAN) },
      uOpacity: { value: 1 },
    },
    vertexShader: `
      varying vec3 vN; varying vec3 vV;
      void main(){
        vec4 mv = modelViewMatrix*vec4(position,1.0);
        vN = normalize(normalMatrix*normal);
        vV = normalize(-mv.xyz);
        gl_Position = projectionMatrix*mv;
      }`,
    fragmentShader: `
      uniform float uTime; uniform vec3 uA; uniform vec3 uB; uniform float uOpacity;
      varying vec3 vN; varying vec3 vV;
      void main(){
        float f = pow(1.0 - max(dot(normalize(vN), normalize(vV)), 0.0), 2.2);
        float band = 0.5 + 0.5*sin(uTime*0.8 + vN.y*4.0);
        vec3 c = mix(uA, uB, band);
        gl_FragColor = vec4(c*(0.14 + f*1.5), (0.2 + f*0.8)*uOpacity);
      }`,
  });
  const coreBody = new THREE.Mesh(new THREE.IcosahedronGeometry(1.5, 1), coreMat);
  core.add(coreBody);
  const coreWire = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(1.95, 1)),
    new THREE.LineBasicMaterial({ color: C_CYAN, transparent: true, opacity: 0.55 }),
  );
  core.add(coreWire);
  const coreSeed = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.46, 0),
    new THREE.MeshBasicMaterial({ color: 0xe9f9ff }),
  );
  core.add(coreSeed);
  core.add(haloSprite(C_PURPLE, 7, 0.5));

  const ringDefs: Array<[number, number, number]> = [
    [2.9, C_PURPLE, 0.6],
    [3.7, C_CYAN, 0.5],
    [4.6, C_BLUE, 0.4],
  ];
  const rings: THREE.Mesh[] = ringDefs.map(([r, color, op], i) => {
    const m = new THREE.Mesh(
      new THREE.TorusGeometry(r, 0.014, 8, 140),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: op, depthWrite: false }),
    );
    m.rotation.set(Math.PI / 2 + i * 0.5, i * 0.7, 0);
    core.add(m);
    return m;
  });

  // floating platforms with glowing edges
  const platformGroup = new THREE.Group();
  hub.add(platformGroup);
  const platGeo = new THREE.BoxGeometry(2.4, 0.18, 2.4);
  const platMat = new THREE.MeshStandardMaterial({
    color: 0x12101f,
    roughness: 0.55,
    metalness: 0.4,
    emissive: 0x1a1140,
    emissiveIntensity: 0.6,
  });
  const platEdgeGeo = new THREE.EdgesGeometry(platGeo);
  const platforms: Array<{ m: THREE.Group; baseY: number; phase: number }> = [];
  const PLAT_N = lite ? 9 : 14;
  for (let i = 0; i < PLAT_N; i++) {
    const a = (i / PLAT_N) * Math.PI * 2 + rand(-0.2, 0.2);
    const r = rand(6.5, 13);
    const g = new THREE.Group();
    g.add(new THREE.Mesh(platGeo, platMat));
    g.add(
      new THREE.LineSegments(
        platEdgeGeo,
        new THREE.LineBasicMaterial({ color: i % 3 === 0 ? C_CYAN : C_VIOLET, transparent: true, opacity: 0.85 }),
      ),
    );
    const baseY = rand(-3.5, 3.5);
    g.position.set(Math.cos(a) * r, baseY, Math.sin(a) * r * 0.75 - 2);
    g.rotation.y = rand(0, Math.PI);
    const s = rand(0.7, 1.5);
    g.scale.set(s, 1, s);
    platformGroup.add(g);
    platforms.push({ m: g, baseY, phase: rand(0, 6) });
  }

  // glowing pathways between platforms, with travelling pulses
  const pulses: Array<{ curve: THREE.CatmullRomCurve3; sprite: THREE.Sprite; speed: number; off: number }> = [];
  const pathMat = new THREE.MeshBasicMaterial({
    color: C_CYAN,
    transparent: true,
    opacity: 0.5,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const PATHS = lite ? 3 : 5;
  for (let i = 0; i < PATHS; i++) {
    const a = platforms[(i * 2) % platforms.length].m.position;
    const b = platforms[(i * 2 + 3) % platforms.length].m.position;
    const mid = a.clone().add(b).multiplyScalar(0.5);
    mid.y += rand(1.5, 3.2);
    const curve = new THREE.CatmullRomCurve3([a.clone(), mid, b.clone()]);
    platformGroup.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 40, 0.022, 5, false), pathMat));
    const sp = haloSprite(0xbdf3ff, 0.75, 0.95);
    platformGroup.add(sp);
    pulses.push({ curve, sprite: sp, speed: rand(0.08, 0.16), off: Math.random() });
  }

  // code fragments
  const fragStrings = [
    ...codeLines.filter((l) => l.trim().length > 3 && !l.trim().startsWith('//')).slice(0, 8).map((l) => l.trim().slice(0, 34)),
    'state.x += speed * dt;',
    'keys.right',
    'return state;',
    '{ }',
    '=>',
    'dt',
  ];
  const fragments: Array<{ s: THREE.Sprite; base: THREE.Vector3; ph: number }> = [];
  const FRAG_N = lite ? 12 : 22;
  for (let i = 0; i < FRAG_N; i++) {
    const text = fragStrings[i % fragStrings.length];
    const col = i % 3 === 0 ? '#67e8f9' : i % 3 === 1 ? '#c4b5fd' : '#93c5fd';
    const s = spriteText(text, rand(0.32, 0.55), col, 0xffffff, 40);
    (s.material as THREE.SpriteMaterial).opacity = rand(0.35, 0.8);
    const a = rand(0, Math.PI * 2);
    const r = rand(5, 15);
    const base = new THREE.Vector3(Math.cos(a) * r, rand(-4, 5), Math.sin(a) * r * 0.7 - 3);
    s.position.copy(base);
    hub.add(s);
    fragments.push({ s, base, ph: rand(0, 6) });
  }

  // holographic panels
  const panelDefs = lite ? 2 : 4;
  const panels: Array<{ m: THREE.Mesh; baseRot: number; phase: number }> = [];
  for (let i = 0; i < panelDefs; i++) {
    const tex = panelTexture(i % 2 === 0 ? 'update.js' : 'world.js', codeLines.slice(i * 2, i * 2 + 9));
    disposables.push(tex);
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(3.6, 2.2),
      new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.DoubleSide, depthWrite: false, opacity: 0.9 }),
    );
    const a = (i / panelDefs) * Math.PI * 2 + 0.6;
    m.position.set(Math.cos(a) * 8.5, rand(-1, 2.5), Math.sin(a) * 6 - 2);
    m.rotation.y = -a + Math.PI / 2 + 0.4;
    hub.add(m);
    panels.push({ m, baseRot: m.rotation.y, phase: rand(0, 6) });
  }

  // closing portal
  const portal = new THREE.Group();
  portal.position.set(0, 0.2, 0);
  hub.add(portal);
  const portalMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    uniforms: { uTime: { value: 0 }, uOpacity: { value: 0 } },
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
    fragmentShader: `
      uniform float uTime; uniform float uOpacity; varying vec2 vUv;
      void main(){
        vec2 p = vUv - 0.5;
        float r = length(p)*2.0;
        float a = atan(p.y, p.x);
        float s = sin(a*5.0 + r*8.0 - uTime*1.6)*0.5 + 0.5;
        vec3 c = mix(vec3(0.49,0.23,0.93), vec3(0.13,0.83,0.93), s);
        float edge = smoothstep(1.0, 0.8, r);
        float core = smoothstep(0.0, 0.9, r);
        gl_FragColor = vec4(c*(0.25 + 0.9*s*core), edge*(0.1 + 0.55*core)*uOpacity);
      }`,
  });
  portal.add(new THREE.Mesh(new THREE.CircleGeometry(3.1, 72), portalMat));
  const portalRings: THREE.Mesh[] = [3.3, 4.1, 5.0, 6.0].map((r, i) => {
    const m = new THREE.Mesh(
      new THREE.TorusGeometry(r, i === 0 ? 0.07 : 0.03, 10, 120),
      new THREE.MeshBasicMaterial({
        color: i % 2 === 0 ? C_CYAN : C_PURPLE,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    );
    portal.add(m);
    return m;
  });
  portal.visible = false;

  /* ── IDEA: crowded code collapses into a playable object ───────────── */
  const idea = new THREE.Group();
  idea.position.set(0, 0, -40);
  scene.add(idea);
  const ideaFloor = gridLines(26, 2, C_VIOLET, 0.28);
  ideaFloor.position.y = -2.2;
  idea.add(ideaFloor);

  const IDEA_N = lite ? 34 : 64;
  const ideaTexts = [...codeLines.filter((l) => l.trim().length > 3).map((l) => l.trim().slice(0, 36)), 'if (hit) { score++ }', 'while (alive)', 'update(dt);', 'state.vy += g * dt;'];
  const crowd: Array<{
    s: THREE.Sprite;
    start: THREE.Vector3;
    tight: THREE.Vector3;
    ph: number;
    sc: number;
  }> = [];
  for (let i = 0; i < IDEA_N; i++) {
    const text = ideaTexts[i % ideaTexts.length];
    const s = spriteText(text, 0.5, '#d9defa', 0xffffff, 38);
    const ang = rand(0, Math.PI * 2);
    const start = new THREE.Vector3(Math.cos(ang) * rand(5, 15), rand(-5, 6), rand(-7, 7));
    const tight = new THREE.Vector3(rand(-2.6, 2.6), rand(-1.8, 1.8), rand(-2.2, 2.2));
    s.position.copy(start);
    idea.add(s);
    crowd.push({ s, start, tight, ph: rand(0, 6), sc: s.scale.x });
  }

  const cube = new THREE.Group();
  const cubeBody = new THREE.Mesh(
    new THREE.BoxGeometry(1.4, 1.4, 1.4),
    new THREE.MeshBasicMaterial({ color: 0x1a1236, transparent: true, opacity: 0.92 }),
  );
  cube.add(cubeBody);
  cube.add(edgeBox(1.4, 1.4, 1.4, C_CYAN, 1));
  cube.add(edgeBox(0.7, 0.7, 0.7, C_VIOLET, 0.8));
  cube.add(haloSprite(C_CYAN, 4.5, 0.4));
  cube.scale.setScalar(0.001);
  idea.add(cube);

  const ghosts: THREE.LineSegments[] = [];
  for (let i = 0; i < 5; i++) {
    const g = edgeBox(1.4, 1.4, 1.4, C_CYAN, 0.32 / (i + 1));
    g.visible = false;
    idea.add(g);
    ghosts.push(g);
  }
  const lineOfCode = spriteText('state.x += 120 * dt;', 0.62, '#67e8f9', 0xffffff, 44, 600);
  lineOfCode.material.opacity = 0;
  idea.add(lineOfCode);
  const beamGeo = new THREE.BufferGeometry();
  beamGeo.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, 0, 0, 0], 3));
  const beam = new THREE.Line(
    beamGeo,
    new THREE.LineBasicMaterial({ color: C_CYAN, transparent: true, opacity: 0, depthWrite: false }),
  );
  idea.add(beam);
  idea.visible = false;

  /* ── PLAYGROUND: cartesian stage behind the demos ──────────────────── */
  const play = new THREE.Group();
  play.position.set(0, 0, -80);
  scene.add(play);
  const stage = gridLines(44, 2, C_CYAN, 0.22);
  stage.position.y = -3;
  play.add(stage);
  const axisMat = (c: number) => new THREE.LineBasicMaterial({ color: c, transparent: true, opacity: 0.9 });
  const axisX = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-22, -3, 0), new THREE.Vector3(22, -3, 0)]), axisMat(C_VIOLET));
  const axisY = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, -3, 0), new THREE.Vector3(0, 9, 0)]), axisMat(C_CYAN));
  play.add(axisX, axisY);
  const playRing = new THREE.Mesh(
    new THREE.TorusGeometry(6, 0.02, 8, 128),
    new THREE.MeshBasicMaterial({ color: C_BLUE, transparent: true, opacity: 0.5, depthWrite: false }),
  );
  playRing.position.y = 2;
  play.add(playRing);
  const playCube = new THREE.Group();
  playCube.add(edgeBox(1, 1, 1, C_CYAN, 1));
  playCube.add(haloSprite(C_PURPLE, 3.2, 0.35));
  play.add(playCube);
  play.visible = false;

  /* ── JOURNEY: skill-tree flight ────────────────────────────────────── */
  const journey = new THREE.Group();
  scene.add(journey);
  journey.visible = false;

  const nodes: Array<{ mesh: THREE.Mesh; edges: THREE.LineSegments; z: number; label: THREE.Sprite; xp: THREE.Sprite; ring: THREE.Mesh }> = [];
  const nodePos: THREE.Vector3[] = [];
  const lessonList = lessons.length > 0 ? lessons : [];
  const xs = [0, -3.2, 3.2, -3.2, 0];
  const ys = [0, 0.7, 0, 0.8, 1.4];
  lessonList.forEach((l, i) => {
    const pos = new THREE.Vector3(xs[i % xs.length], ys[i % ys.length], -116 - i * 7.5);
    nodePos.push(pos);
    const mesh = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.72, 0),
      new THREE.MeshBasicMaterial({ color: 0x241a4d, transparent: true, opacity: 0.95 }),
    );
    mesh.position.copy(pos);
    const edges = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.OctahedronGeometry(0.72, 0)),
      new THREE.LineBasicMaterial({ color: C_VIOLET, transparent: true, opacity: 0.5 }),
    );
    edges.position.copy(pos);
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(1.15, 0.018, 8, 64),
      new THREE.MeshBasicMaterial({ color: C_CYAN, transparent: true, opacity: 0, depthWrite: false }),
    );
    ring.position.copy(pos);
    const label = spriteText(`${l.num}  ${l.label.toUpperCase()}`, 0.5, '#f1f3ff', 0xffffff, 46, 600);
    label.position.set(pos.x, pos.y + 1.55, pos.z);
    const xp = spriteText(`+${l.xp} XP`, 0.36, '#67e8f9', 0xffffff, 40);
    xp.position.set(pos.x, pos.y - 1.35, pos.z);
    journey.add(mesh, edges, ring, label, xp);
    nodes.push({ mesh, edges, z: pos.z, label, xp, ring });
  });
  const treeEdges: THREE.Mesh[] = [];
  for (let i = 0; i < nodePos.length - 1; i++) {
    const a = nodePos[i];
    const b = nodePos[i + 1];
    const mid = a.clone().add(b).multiplyScalar(0.5);
    mid.y += 0.9;
    const tube = new THREE.Mesh(
      new THREE.TubeGeometry(new THREE.CatmullRomCurve3([a, mid, b]), 32, 0.03, 6, false),
      new THREE.MeshBasicMaterial({ color: C_VIOLET, transparent: true, opacity: 0.25, depthWrite: false, blending: THREE.AdditiveBlending }),
    );
    journey.add(tube);
    treeEdges.push(tube);
  }

  // guides
  const pixel = new THREE.Group();
  pixel.add(
    new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(0.95, 0)),
      new THREE.LineBasicMaterial({ color: C_CYAN }),
    ),
  );
  pixel.add(new THREE.Mesh(new THREE.OctahedronGeometry(0.28, 0), new THREE.MeshBasicMaterial({ color: 0xcffafe })));
  pixel.add(haloSprite(C_CYAN, 4, 0.35));
  pixel.position.set(-3.4, 1.2, -153);
  const pixelLabel = spriteText('PIXEL', 0.5, '#67e8f9', 0xffffff, 46, 700);
  pixelLabel.position.set(-3.4, 2.7, -153);
  const byte = new THREE.Group();
  byte.add(edgeBox(1.3, 1.3, 1.3, C_VIOLET, 1));
  byte.add(new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.4), new THREE.MeshBasicMaterial({ color: 0xede9fe })));
  byte.add(haloSprite(C_VIOLET, 4, 0.35));
  byte.position.set(3.4, 1.2, -153);
  const byteLabel = spriteText('BYTE', 0.5, '#c4b5fd', 0xffffff, 46, 700);
  byteLabel.position.set(3.4, 2.7, -153);
  journey.add(pixel, pixelLabel, byte, byteLabel);

  // error → understood
  const errGroup = new THREE.Group();
  errGroup.position.set(0, 0.6, -178);
  const errEdgesMat = new THREE.LineBasicMaterial({ color: C_RED });
  errGroup.add(new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(1.5, 1.5, 1.5)), errEdgesMat));
  const errCoreMat = new THREE.MeshBasicMaterial({ color: C_RED, transparent: true, opacity: 0.35 });
  errGroup.add(new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.9, 0.9), errCoreMat));
  const errHalo = haloSprite(C_RED, 5, 0.4);
  errGroup.add(errHalo);
  const errBars: THREE.Mesh[] = [];
  for (let i = 0; i < 6; i++) {
    const bar = new THREE.Mesh(
      new THREE.PlaneGeometry(rand(1.5, 3.2), 0.08),
      new THREE.MeshBasicMaterial({ color: C_RED, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }),
    );
    bar.position.set(rand(-1.4, 1.4), rand(-1.2, 1.2), 0.8);
    errGroup.add(bar);
    errBars.push(bar);
  }
  const errText = spriteText('ReferenceError: dt is not defined', 0.46, '#ff8fa3', 0xffffff, 42, 600);
  errText.position.set(0, 1.9, 0);
  const okText = spriteText('multiply by dt  →  runs the same at any frame rate', 0.42, '#67e8f9', 0xffffff, 42, 600);
  okText.position.set(0, 1.9, 0);
  (okText.material as THREE.SpriteMaterial).opacity = 0;
  errGroup.add(errText, okText);
  journey.add(errGroup);

  // wins: ascending steps that light up, XP floats up
  const steps: Array<{ edges: THREE.LineSegments; fill: THREE.Mesh; xp: THREE.Sprite; baseY: number }> = [];
  const stepXp = [25, 25, 25, 50, 75];
  for (let i = 0; i < 5; i++) {
    const g = new THREE.Group();
    g.position.set((i % 2 === 0 ? -1 : 1) * 0.9, i * 0.95, -196 - i * 3);
    const edges = edgeBox(2.4, 0.22, 2.4, C_CYAN, 0.35);
    const fill = new THREE.Mesh(
      new THREE.BoxGeometry(2.4, 0.22, 2.4),
      new THREE.MeshBasicMaterial({ color: C_PURPLE, transparent: true, opacity: 0.05 }),
    );
    const xp = spriteText(`+${stepXp[i]} XP`, 0.5, '#e0f7ff', 0xffffff, 46, 700);
    xp.position.set(0, 1.2, 0);
    (xp.material as THREE.SpriteMaterial).opacity = 0;
    g.add(fill, edges, xp);
    journey.add(g);
    steps.push({ edges, fill, xp, baseY: 1.2 });
  }

  // burst particles
  const BN = lite ? 80 : 180;
  const bPos = new Float32Array(BN * 3);
  const bVel = new Float32Array(BN * 3);
  const bGeo = new THREE.BufferGeometry();
  bGeo.setAttribute('position', new THREE.BufferAttribute(bPos, 3));
  const bMat = new THREE.PointsMaterial({
    color: 0xbdf3ff,
    size: 0.16,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const burstPts = new THREE.Points(bGeo, bMat);
  burstPts.frustumCulled = false;
  journey.add(burstPts);
  let burstAge = 99;
  let lastBurst = story.burst;
  const burstOrigin = new THREE.Vector3(0, 3.5, -206);

  /* ── camera path ───────────────────────────────────────────────────── */
  const A: Anchor[] = [
    { pos: new THREE.Vector3(0, 1.6, 15), look: new THREE.Vector3(0, 0.4, 0) },
    { pos: new THREE.Vector3(0, 0.2, -26), look: new THREE.Vector3(0, 0, -40) },
    { pos: new THREE.Vector3(0, 3.2, -64), look: new THREE.Vector3(0, 0.5, -80) },
    { pos: new THREE.Vector3(0, 0, 0), look: new THREE.Vector3(0, 0, 0) }, // replaced by journey(0)
    { pos: new THREE.Vector3(0, 1.4, HUB_END_Z + 15), look: new THREE.Vector3(0, 0.4, HUB_END_Z) },
  ];
  const jPos = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-6, 3, -108),
    new THREE.Vector3(4, 2, -138),
    new THREE.Vector3(-3, 1.8, -164),
    new THREE.Vector3(3.2, 4, -192),
    new THREE.Vector3(0.4, 2.8, -214),
  ]);
  const jLook = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-1, 0, -126),
    new THREE.Vector3(0, 1, -152),
    new THREE.Vector3(0, 0.6, -178),
    new THREE.Vector3(0, 3, -204),
    new THREE.Vector3(0, 1.5, -228),
  ]);
  const tPos = new THREE.Vector3();
  const tLook = new THREE.Vector3();
  const nPos = new THREE.Vector3();
  const nLook = new THREE.Vector3();
  const portalDolly = new THREE.Vector3(0, 0.6, HUB_END_Z + 6.5);

  const sample = (i: number, jt: number, outPos: THREE.Vector3, outLook: THREE.Vector3, exit: boolean) => {
    if (i === 3) {
      jPos.getPoint(exit ? 1 : jt, outPos);
      jLook.getPoint(exit ? 1 : jt, outLook);
    } else {
      outPos.copy(A[i].pos);
      outLook.copy(A[i].look);
    }
  };

  /* ── sizing ────────────────────────────────────────────────────────── */
  const resize = () => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    renderer.setPixelRatio(dpr());
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.fov = w / h < 0.8 ? 74 : 58;
    camera.updateProjectionMatrix();
    pMat.uniforms.uPx.value = dpr() * 2.2;
  };
  resize();

  const onLost = (e: Event) => {
    e.preventDefault();
    opts.onLost?.();
  };
  canvas.addEventListener('webglcontextlost', onLost);

  /* ── frame loop ────────────────────────────────────────────────────── */
  let last = performance.now();
  const speed = reduced ? 0.25 : 1;
  let T = 0;
  let ps = 0;
  let js = 0;
  let ideaS = 0;
  let mx = 0;
  let my = 0;

  const frame = () => {
    const now = performance.now();
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    T += dt * speed;
    const follow = reduced ? 1 : Math.min(1, dt * 9.0);
    ps += (story.p - ps) * follow;
    js += (story.j - js) * follow;
    ideaS += (story.idea - ideaS) * follow;
    mx += (story.mx - mx) * Math.min(1, dt * 3);
    my += (story.my - my) * Math.min(1, dt * 3);
    const reveal = story.reveal;
    const rv = smooth(reveal);

    pMat.uniforms.uTime.value = T;
    coreMat.uniforms.uTime.value = T;
    portalMat.uniforms.uTime.value = T;

    // visibility by chapter
    const hubVisible = ps < 1.5 || ps > 3.3;
    hub.visible = hubVisible;
    hub.position.z = ps > 2.5 ? HUB_END_Z : 0;
    idea.visible = ps > 0.4 && ps < 2.3;
    play.visible = ps > 1.3 && ps < 3.2;
    journey.visible = ps > 2.4 && ps < 4.2;

    /* hub */
    if (hubVisible) {
      core.rotation.y = T * 0.25;
      coreWire.rotation.y = -T * 0.18;
      coreWire.rotation.x = T * 0.1;
      coreSeed.rotation.y = T * 1.2;
      coreSeed.scale.setScalar(1 + Math.sin(T * 2) * 0.06);
      core.scale.setScalar(0.15 + rv * 0.85);
      coreMat.uniforms.uOpacity.value = rv;
      rings.forEach((r, i) => {
        r.rotation.z = T * (0.12 + i * 0.07) * (i % 2 === 0 ? 1 : -1);
      });
      platformGroup.position.y = -(1 - rv) * 9;
      platforms.forEach((p, i) => {
        p.m.position.y = p.baseY + Math.sin(T * 0.6 + p.phase) * 0.25;
        p.m.rotation.y += dt * 0.05 * (i % 2 === 0 ? 1 : -1) * speed;
      });
      pulses.forEach((p) => {
        const t = (T * p.speed + p.off) % 1;
        p.curve.getPoint(t, p.sprite.position);
      });
      fragments.forEach((f) => {
        f.s.position.set(f.base.x, f.base.y + Math.sin(T * 0.45 + f.ph) * 0.45, f.base.z + Math.cos(T * 0.3 + f.ph) * 0.5);
      });
      panels.forEach((p) => {
        p.m.rotation.y = p.baseRot + Math.sin(T * 0.3 + p.phase) * 0.08;
        p.m.position.y += Math.sin(T * 0.5 + p.phase) * 0.0025;
      });

      const pa = smooth((ps - 3.35) / 0.55);
      portal.visible = pa > 0.001;
      if (portal.visible) {
        portalMat.uniforms.uOpacity.value = pa;
        portalRings.forEach((r, i) => {
          (r.material as THREE.MeshBasicMaterial).opacity = pa * (i === 0 ? 0.95 : 0.5);
          r.rotation.z = T * (0.2 + i * 0.1) * (i % 2 === 0 ? 1 : -1);
          r.scale.setScalar(0.7 + pa * 0.3);
        });
        core.scale.setScalar((0.15 + rv * 0.85) * (1 - pa * 0.55));
      }
    }

    /* idea */
    if (idea.visible) {
      const it = ideaS;
      const gather = smooth(it / 0.4);
      const collapse = smooth((it - 0.4) / 0.22);
      crowd.forEach((c) => {
        const mat = c.s.material as THREE.SpriteMaterial;
        if (collapse >= 1) {
          c.s.visible = false;
          return;
        }
        c.s.visible = true;
        c.s.position.lerpVectors(c.start, c.tight, gather);
        c.s.position.x += Math.sin(T * 0.8 + c.ph) * (0.5 - gather * 0.3);
        c.s.position.y += Math.cos(T * 0.7 + c.ph) * (0.4 - gather * 0.25);
        c.s.position.multiplyScalar(1 - collapse);
        mat.opacity = (0.35 + gather * 0.55) * (1 - collapse);
        // calm cyan-white → agitated pink as it gets crowded
        mat.color.setRGB(1, 1 - gather * 0.45, 1 - gather * 0.2);
      });

      const cs = smooth((it - 0.46) / 0.18);
      const act = smooth((it - 0.68) / 0.1);
      cube.scale.setScalar(Math.max(0.001, cs));
      const px = Math.sin(T * 1.1) * 4.2 * act;
      cube.position.set(px, Math.abs(Math.sin(T * 2.2)) * 0.55 * act, 0);
      cube.rotation.y = T * 0.6 * (1 - act * 0.8);
      ghosts.forEach((g, i) => {
        g.visible = act > 0.05;
        const gx = Math.sin((T - 0.11 * (i + 1)) * 1.1) * 4.2 * act;
        g.position.set(gx, Math.abs(Math.sin((T - 0.11 * (i + 1)) * 2.2)) * 0.55 * act, 0);
        g.scale.setScalar(cs);
      });
      lineOfCode.position.set(px, 2.6, 0);
      lineOfCode.material.opacity = act;
      const bp = beamGeo.attributes.position as THREE.BufferAttribute;
      bp.setXYZ(0, px, 2.3, 0);
      bp.setXYZ(1, px, cube.position.y + 0.8, 0);
      bp.needsUpdate = true;
      (beam.material as THREE.LineBasicMaterial).opacity = act * 0.8;
    }

    /* playground */
    if (play.visible) {
      playRing.rotation.x = Math.PI / 2 + Math.sin(T * 0.3) * 0.2;
      playRing.rotation.z = T * 0.1;
      playCube.position.set(Math.sin(T * 0.8) * 7, 3 + Math.cos(T * 1.1) * 1.4, -4);
      playCube.rotation.set(T * 0.5, T * 0.7, 0);
    }

    /* journey */
    const camZ = camera.position.z;
    if (journey.visible) {
      nodes.forEach((n, i) => {
        const lit = smooth((n.z + 14 - camZ) / 7);
        const cur = i === 1;
        const col = new THREE.Color(0x241a4d).lerp(new THREE.Color(cur ? C_CYAN : C_PURPLE), lit);
        (n.mesh.material as THREE.MeshBasicMaterial).color.copy(col);
        (n.edges.material as THREE.LineBasicMaterial).color.set(cur ? C_CYAN : C_VIOLET);
        (n.edges.material as THREE.LineBasicMaterial).opacity = 0.35 + lit * 0.65;
        n.mesh.rotation.y = T * 0.5 + i;
        n.edges.rotation.y = n.mesh.rotation.y;
        (n.label.material as THREE.SpriteMaterial).opacity = 0.25 + lit * 0.75;
        (n.xp.material as THREE.SpriteMaterial).opacity = 0.2 + lit * 0.8;
        (n.ring.material as THREE.MeshBasicMaterial).opacity = cur ? lit * (0.5 + Math.sin(T * 3) * 0.25) : 0;
        n.ring.rotation.x = Math.PI / 2;
        n.ring.scale.setScalar(1 + (cur ? Math.sin(T * 3) * 0.06 : 0));
      });
      treeEdges.forEach((e, i) => {
        const lit = smooth((nodes[i + 1]?.z + 14 - camZ) / 7);
        (e.material as THREE.MeshBasicMaterial).opacity = 0.12 + lit * 0.6;
      });
      pixel.rotation.y = T * 0.7;
      pixel.position.y = 1.2 + Math.sin(T * 1.1) * 0.25;
      byte.rotation.y = -T * 0.55;
      byte.rotation.x = Math.sin(T * 0.6) * 0.2;
      byte.position.y = 1.2 + Math.cos(T * 1.0) * 0.25;
      pixelLabel.position.y = pixel.position.y + 1.5;
      byteLabel.position.y = byte.position.y + 1.5;

      // error is understood
      const fixed = smooth((js - 0.6) / 0.09);
      const errAmt = 1 - fixed;
      const jitter = reduced ? 0 : errAmt * 0.12;
      errGroup.position.x = (Math.random() - 0.5) * jitter;
      errGroup.rotation.y = T * 0.5;
      errGroup.rotation.z = (Math.random() - 0.5) * jitter * 0.6;
      const col = new THREE.Color(C_CYAN).lerp(new THREE.Color(C_RED), errAmt);
      errEdgesMat.color.copy(col);
      errCoreMat.color.copy(col);
      (errHalo.material as THREE.SpriteMaterial).color.copy(col);
      errBars.forEach((b) => {
        const m = b.material as THREE.MeshBasicMaterial;
        m.opacity = !reduced && Math.random() > 0.55 ? errAmt * 0.5 : 0;
        if (m.opacity > 0) b.position.y = rand(-1.2, 1.2);
      });
      (errText.material as THREE.SpriteMaterial).opacity = errAmt;
      (okText.material as THREE.SpriteMaterial).opacity = fixed;

      // wins
      steps.forEach((s, i) => {
        const lit = clamp01(smooth((js - 0.76) / 0.2) * 5.4 - i);
        (s.edges.material as THREE.LineBasicMaterial).opacity = 0.3 + lit * 0.7;
        (s.fill.material as THREE.MeshBasicMaterial).opacity = 0.05 + lit * 0.4;
        const xpMat = s.xp.material as THREE.SpriteMaterial;
        xpMat.opacity = lit;
        s.xp.position.y = s.baseY + lit * 0.6 + Math.sin(T * 1.4 + i) * 0.08;
      });

      // burst
      if (story.burst !== lastBurst) {
        lastBurst = story.burst;
        burstAge = 0;
        for (let i = 0; i < BN; i++) {
          bPos[i * 3] = burstOrigin.x;
          bPos[i * 3 + 1] = burstOrigin.y;
          bPos[i * 3 + 2] = burstOrigin.z;
          const th = Math.random() * Math.PI * 2;
          const ph = Math.acos(rand(-1, 1));
          const sp = rand(2.5, 7);
          bVel[i * 3] = Math.sin(ph) * Math.cos(th) * sp;
          bVel[i * 3 + 1] = Math.cos(ph) * sp + 1;
          bVel[i * 3 + 2] = Math.sin(ph) * Math.sin(th) * sp;
        }
      }
      if (burstAge < 2) {
        burstAge += dt;
        for (let i = 0; i < BN; i++) {
          bPos[i * 3] += bVel[i * 3] * dt;
          bPos[i * 3 + 1] += bVel[i * 3 + 1] * dt;
          bPos[i * 3 + 2] += bVel[i * 3 + 2] * dt;
          bVel[i * 3 + 1] -= 3.2 * dt;
        }
        (bGeo.attributes.position as THREE.BufferAttribute).needsUpdate = true;
        bMat.opacity = Math.max(0, 1 - burstAge / 2);
      } else {
        bMat.opacity = 0;
      }
    }

    /* camera */
    const i = Math.min(4, Math.floor(ps));
    const local = ps - i;
    if (i === 4) {
      sample(4, 0, tPos, tLook, false);
      tPos.lerp(portalDolly, smooth(local));
    } else {
      sample(i, js, tPos, tLook, false);
      const w = smooth((local - 0.82) / 0.18);
      if (w > 0) {
        sample(i + 1, 0, nPos, nLook, false);
        tPos.lerp(nPos, w);
        tLook.lerp(nLook, w);
        const arc = Math.sin(w * Math.PI);
        tPos.x += arc * (i % 2 === 0 ? 7 : -7);
        tPos.y += arc * 1.6;
      }
    }
    if (i < 1) tPos.z += (1 - rv) * 18;
    const par = reduced ? 0 : rv;
    tPos.x += mx * 1.5 * par;
    tPos.y += my * 0.9 * par;
    camera.position.copy(tPos);
    camera.lookAt(tLook);
    camera.rotateZ(-mx * 0.025 * par);

    renderer.render(scene, camera);
  };

  renderer.setAnimationLoop(frame);

  return {
    resize,
    dispose: () => {
      renderer.setAnimationLoop(null);
      canvas.removeEventListener('webglcontextlost', onLost);
      scene.traverse((o) => {
        const mesh = o as THREE.Mesh;
        if (mesh.geometry) mesh.geometry.dispose();
        const m = mesh.material as THREE.Material | THREE.Material[] | undefined;
        if (Array.isArray(m)) m.forEach((x) => x.dispose());
        else if (m) m.dispose();
      });
      disposables.forEach((t) => t.dispose());
      renderer.dispose();
    },
  };
}
