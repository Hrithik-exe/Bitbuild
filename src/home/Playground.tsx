import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { usePrefersReducedMotion } from './useStoryScroll';

const LiveLab = lazy(() => import('./LiveLab'));

type SimState = Record<string, unknown>;
type UpdateFn = (state: SimState, keys: Record<string, boolean>, dt: number, world: Record<string, unknown>) => void;

const WORLD = { width: 480, height: 280, groundY: 250 };
const NO_KEYS = { left: false, right: false, up: false, down: false };

const freshState = (): SimState => ({ x: 40, y: 60, vx: 0, vy: 0, width: 26, height: 26 });

const RECIPES = [
  {
    id: 'drift',
    label: 'DRIFT',
    code: `// Give it a speed. Let time move it.
state.x += 90 * dt;
if (state.x > world.width) state.x = -state.width;`,
  },
  {
    id: 'bounce',
    label: 'BOUNCE',
    code: `state.vy += 700 * dt;      // gravity pulls down
state.y += state.vy * dt;
state.x += 70 * dt;
if (state.x > world.width) state.x = 0;
if (state.y > world.groundY - state.height) {
  state.y = world.groundY - state.height;
  state.vy = -420;         // jump back up
}`,
  },
  {
    id: 'orbit',
    label: 'ORBIT',
    code: `state.t = (state.t || 0) + dt;
state.x = world.width / 2 + Math.cos(state.t * 2) * 110;
state.y = 110 + Math.sin(state.t * 2) * 60;`,
  },
];

function errMsg(e: unknown) {
  return e instanceof Error ? e.message : String(e);
}

/* ── Demo A: code → creation ───────────────────────────────────────── */
function DemoCode() {
  const reduced = usePrefersReducedMotion();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [code, setCode] = useState(RECIPES[0].code);
  const [active, setActive] = useState('drift');
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(!reduced);
  const fnRef = useRef<UpdateFn | null>(null);
  const stateRef = useRef<SimState>(freshState());
  const trailRef = useRef<Array<{ x: number; y: number }>>([]);
  const runningRef = useRef(running);
  runningRef.current = running;
  const visibleRef = useRef(false);

  const reset = useCallback(() => {
    stateRef.current = freshState();
    trailRef.current = [];
  }, []);

  const compile = useCallback((src: string) => {
    try {
      const fn = new Function('state', 'keys', 'dt', 'world', `${src}\nreturn state;`) as UpdateFn;
      fn(freshState(), NO_KEYS, 0.016, WORLD); // same sanity pass the real app does
      fnRef.current = fn;
      setError(null);
    } catch (e) {
      fnRef.current = null;
      setError(errMsg(e));
    }
  }, []);

  useEffect(() => {
    compile(code);
  }, [code, compile]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const S = 2;
    canvas.width = WORLD.width * S;
    canvas.height = WORLD.height * S;
    ctx.setTransform(S, 0, 0, S, 0, 0);
    let raf = 0;
    let last = performance.now();

    const draw = () => {
      const s = stateRef.current;
      const x = Number(s.x) || 0;
      const y = Number(s.y) || 0;
      const w = Number(s.width) || 26;
      const h = Number(s.height) || 26;
      ctx.fillStyle = '#090812';
      ctx.fillRect(0, 0, WORLD.width, WORLD.height);
      ctx.strokeStyle = 'rgba(167,139,250,0.10)';
      ctx.lineWidth = 1;
      for (let gx = 0; gx <= WORLD.width; gx += 40) {
        ctx.beginPath();
        ctx.moveTo(gx + 0.5, 0);
        ctx.lineTo(gx + 0.5, WORLD.height);
        ctx.stroke();
      }
      for (let gy = 0; gy <= WORLD.height; gy += 40) {
        ctx.beginPath();
        ctx.moveTo(0, gy + 0.5);
        ctx.lineTo(WORLD.width, gy + 0.5);
        ctx.stroke();
      }
      ctx.fillStyle = 'rgba(34,211,238,0.9)';
      ctx.fillRect(0, WORLD.groundY, WORLD.width, 1.5);
      const trail = trailRef.current;
      trail.forEach((p, i) => {
        ctx.fillStyle = `rgba(124,58,237,${((i + 1) / trail.length) * 0.35})`;
        ctx.fillRect(p.x, p.y, w, h);
      });
      ctx.fillStyle = '#22d3ee';
      ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = 'rgba(255,255,255,0.85)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
      ctx.fillStyle = 'rgba(200,205,235,0.75)';
      ctx.font = '11px "JetBrains Mono", monospace';
      ctx.textBaseline = 'top';
      ctx.fillText(`x ${Math.round(x)}   y ${Math.round(y)}`, 10, 8);
    };

    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      const dt = Math.min((now - last) / 1000, 0.04);
      last = now;
      if (!visibleRef.current) return;
      if (runningRef.current && fnRef.current) {
        const s = stateRef.current;
        try {
          fnRef.current(s, NO_KEYS, dt, WORLD);
        } catch (e) {
          fnRef.current = null;
          setError(errMsg(e));
        }
        const x = Number(s.x);
        const y = Number(s.y);
        if (!Number.isFinite(x) || !Number.isFinite(y)) {
          reset();
        } else {
          const trail = trailRef.current;
          trail.push({ x, y });
          if (trail.length > 26) trail.shift();
        }
      }
      draw();
    };
    raf = requestAnimationFrame(loop);
    const io = new IntersectionObserver(
      ([e]) => {
        visibleRef.current = e.isIntersecting;
      },
      { threshold: 0.1 },
    );
    io.observe(canvas);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
    };
  }, [reset]);

  const run = () => {
    reset();
    compile(code);
    setRunning(true);
  };

  return (
    <article className="bb-demo">
      <header className="bb-demo-head">
        <span className="bb-demo-tag">A</span>
        <div>
          <h3>Code becomes a creation</h3>
          <p>Change a number. The square obeys. Same <code>update(state, keys, dt, world)</code> shape the real editor uses.</p>
        </div>
      </header>
      <div className="bb-demo-body">
        <div className="bb-editor">
          <div className="bb-chips" role="group" aria-label="Example programs">
            {RECIPES.map((r) => (
              <button
                key={r.id}
                type="button"
                className="bb-chip"
                aria-pressed={active === r.id}
                onClick={() => {
                  setActive(r.id);
                  setCode(r.code);
                  reset();
                  setRunning(true);
                }}
              >
                {r.label}
              </button>
            ))}
          </div>
          <textarea
            className="bb-code"
            value={code}
            spellCheck={false}
            aria-label="Editable game code"
            onChange={(e) => {
              setActive('');
              setCode(e.target.value);
            }}
          />
          <div className="bb-editor-foot">
            <span className={error ? 'bb-err' : 'bb-ok'} role="status">
              {error ? error : 'compiles'}
            </span>
            <button type="button" className="bb-btn bb-btn--small" onClick={run}>
              RUN
            </button>
          </div>
        </div>
        <canvas ref={canvasRef} className="bb-sim" aria-label="Live preview of your code: a square moving" />
      </div>
    </article>
  );
}

/* ── Demo B: screen vs Cartesian ───────────────────────────────────── */
const COLS = 8;
const ROWS = 5;
const CELL = 40;
const CW = 720;
const CH = 300;
const LEFT_X = 24;
const RIGHT_X = 376;
const TOP_Y = 64;

function DemoCoords() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pt, setPt] = useState({ x: 3, y: 2 });
  const ptRef = useRef(pt);
  ptRef.current = pt;
  const visibleRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const S = 2;
    canvas.width = CW * S;
    canvas.height = CH * S;
    ctx.setTransform(S, 0, 0, S, 0, 0);
    let raf = 0;
    let t0 = 0;

    const grid = (ox: number, grow: number) => {
      ctx.strokeStyle = 'rgba(167,139,250,0.22)';
      ctx.lineWidth = 1;
      const wFull = COLS * CELL;
      const hFull = ROWS * CELL;
      for (let c = 0; c <= COLS; c++) {
        const k = Math.min(1, Math.max(0, grow * 1.6 - (c / COLS) * 0.6));
        ctx.beginPath();
        ctx.moveTo(ox + c * CELL + 0.5, TOP_Y);
        ctx.lineTo(ox + c * CELL + 0.5, TOP_Y + hFull * k);
        ctx.stroke();
      }
      for (let r = 0; r <= ROWS; r++) {
        const k = Math.min(1, Math.max(0, grow * 1.6 - (r / ROWS) * 0.6));
        ctx.beginPath();
        ctx.moveTo(ox, TOP_Y + r * CELL + 0.5);
        ctx.lineTo(ox + wFull * k, TOP_Y + r * CELL + 0.5);
        ctx.stroke();
      }
    };

    const arrow = (x1: number, y1: number, x2: number, y2: number, color: string) => {
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      const a = Math.atan2(y2 - y1, x2 - x1);
      ctx.beginPath();
      ctx.moveTo(x2, y2);
      ctx.lineTo(x2 - 8 * Math.cos(a - 0.45), y2 - 8 * Math.sin(a - 0.45));
      ctx.lineTo(x2 - 8 * Math.cos(a + 0.45), y2 - 8 * Math.sin(a + 0.45));
      ctx.closePath();
      ctx.fill();
    };

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      if (!visibleRef.current) {
        t0 = 0;
        return;
      }
      if (!t0) t0 = now;
      const el = (now - t0) / 1000;
      const grow = Math.min(1, el / 1.1);
      const { x, y } = ptRef.current;
      ctx.clearRect(0, 0, CW, CH);

      ctx.font = '600 11px "JetBrains Mono", monospace';
      ctx.textBaseline = 'alphabetic';
      ctx.fillStyle = '#a78bfa';
      ctx.fillText('SCREEN  ·  origin top-left, y grows DOWN', LEFT_X, 30);
      ctx.fillStyle = '#22d3ee';
      ctx.fillText('CARTESIAN  ·  origin bottom-left, y grows UP', RIGHT_X, 30);

      grid(LEFT_X, grow);
      grid(RIGHT_X, grow);

      // axes
      arrow(LEFT_X, TOP_Y, LEFT_X + 70, TOP_Y, '#a78bfa');
      arrow(LEFT_X, TOP_Y, LEFT_X, TOP_Y + 70, '#a78bfa');
      const by = TOP_Y + ROWS * CELL;
      arrow(RIGHT_X, by, RIGHT_X + 70, by, '#22d3ee');
      arrow(RIGHT_X, by, RIGHT_X, by - 70, '#22d3ee');

      ctx.fillStyle = 'rgba(200,205,235,0.8)';
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.fillText('(0,0)', LEFT_X + 6, TOP_Y + 14);
      ctx.fillText('+x', LEFT_X + 74, TOP_Y + 4);
      ctx.fillText('+y', LEFT_X + 6, TOP_Y + 84);
      ctx.fillText('(0,0)', RIGHT_X + 6, by - 6);
      ctx.fillText('+x', RIGHT_X + 74, by + 4);
      ctx.fillText('+y', RIGHT_X + 6, by - 76);

      // the same (x, y) on both
      const sx = LEFT_X + x * CELL;
      const sy = TOP_Y + y * CELL;
      const cx = RIGHT_X + x * CELL;
      const cy = by - y * CELL;
      const pulse = 7 + Math.sin(now / 280) * 2;
      for (const [px, py, col] of [
        [sx, sy, '#a78bfa'],
        [cx, cy, '#22d3ee'],
      ] as Array<[number, number, string]>) {
        ctx.strokeStyle = col;
        ctx.globalAlpha = 0.35;
        ctx.beginPath();
        ctx.arc(px, py, pulse + 6, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
        ctx.fillStyle = col;
        ctx.beginPath();
        ctx.arc(px, py, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = '600 11px "JetBrains Mono", monospace';
        ctx.fillText(`(${x}, ${y})`, px + 12, py - 10);
      }
    };
    raf = requestAnimationFrame(frame);
    const io = new IntersectionObserver(
      ([e]) => {
        visibleRef.current = e.isIntersecting;
      },
      { threshold: 0.15 },
    );
    io.observe(canvas);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
    };
  }, []);

  const onPointer = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (e.buttons === 0 && e.type !== 'pointerdown') return;
    const rect = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * CW;
    const py = ((e.clientY - rect.top) / rect.height) * CH;
    const by = TOP_Y + ROWS * CELL;
    let x: number;
    let y: number;
    if (px < (LEFT_X + RIGHT_X + COLS * CELL) / 2) {
      x = (px - LEFT_X) / CELL;
      y = (py - TOP_Y) / CELL;
    } else {
      x = (px - RIGHT_X) / CELL;
      y = (by - py) / CELL;
    }
    setPt({
      x: Math.min(COLS, Math.max(0, Math.round(x * 2) / 2)),
      y: Math.min(ROWS, Math.max(0, Math.round(y * 2) / 2)),
    });
  };

  return (
    <article className="bb-demo">
      <header className="bb-demo-head">
        <span className="bb-demo-tag">B</span>
        <div>
          <h3>Two ways to see the same point</h3>
          <p>
            Game screens count <b>down</b> from the top. Maths counts <b>up</b> from the ground. The real simulation canvas has this exact toggle in later lessons.
          </p>
        </div>
      </header>
      <div className="bb-demo-body bb-demo-body--stack">
        <canvas
          ref={canvasRef}
          className="bb-coords"
          aria-label="Two grids showing the same point in screen coordinates and Cartesian coordinates"
          onPointerDown={onPointer}
          onPointerMove={onPointer}
        />
        <div className="bb-sliders">
          <label>
            <span>x</span>
            <input type="range" min={0} max={COLS} step={0.5} value={pt.x} onChange={(e) => setPt((p) => ({ ...p, x: Number(e.target.value) }))} />
            <output>{pt.x}</output>
          </label>
          <label>
            <span>y</span>
            <input type="range" min={0} max={ROWS} step={0.5} value={pt.y} onChange={(e) => setPt((p) => ({ ...p, y: Number(e.target.value) }))} />
            <output>{pt.y}</output>
          </label>
        </div>
      </div>
    </article>
  );
}

/* ── Demo C: the real environment (lazy, only while on screen) ─────── */
function DemoLab() {
  const ref = useRef<HTMLDivElement>(null);
  const [live, setLive] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setLive(e.isIntersecting), { threshold: 0.35 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <article className="bb-demo">
      <header className="bb-demo-head">
        <span className="bb-demo-tag">C</span>
        <div>
          <h3>The real environment</h3>
          <p>
            This is BitBuild's own editor and simulation canvas, running lesson 01. Edit the code, press Run, then move with the arrow keys or WASD.
          </p>
        </div>
      </header>
      <div className="bb-lab" ref={ref}>
        {live ? (
          <Suspense fallback={<div className="bb-lab-wait">Loading editor…</div>}>
            <LiveLab />
          </Suspense>
        ) : (
          <div className="bb-lab-wait">Scroll here to start the live editor</div>
        )}
      </div>
    </article>
  );
}

export function Playground() {
  return (
    <div className="bb-demos">
      <DemoCode />
      <DemoCoords />
      <DemoLab />
    </div>
  );
}
