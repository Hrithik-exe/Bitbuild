import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';

/* ─────────────────────────────────────────────────────────────────
   MiniGameCanvas — a lightweight canvas for the homepage Try It section.
   Renders a simple bouncing dot simulation so visitors can see
   the game loop respond to run code without loading the full app.
   ───────────────────────────────────────────────────────────────── */

export interface MiniGameCanvasHandle {
  applyCode: (code: string) => void;
}

const DEFAULT_CODE = `
// Move the ball!
state.vx = 120;       // pixels per second
state.vy = -80;
`;

const MiniGameCanvas = forwardRef<MiniGameCanvasHandle>((_, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ x: 80, y: 120, vx: 60, vy: -40, r: 14, score: 0 });
  const codeRef = useRef(DEFAULT_CODE);
  const frameRef = useRef(0);
  const lastTimeRef = useRef(0);

  useImperativeHandle(ref, () => ({
    applyCode(code: string) {
      codeRef.current = code;
    }
  }));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctxOrNull = canvas.getContext('2d');
    if (!ctxOrNull) return;
    const ctx: CanvasRenderingContext2D = ctxOrNull;

    const W = canvas.width = 480;
    const H = canvas.height = 300;
    const COINS = [
      { x: 200, y: 80, collected: false },
      { x: 340, y: 130, collected: false },
      { x: 120, y: 200, collected: false },
    ];

    function resetCoins() {
      COINS.forEach(c => { c.collected = false; });
    }

    function loop(ts: number) {
      const dt = Math.min((ts - lastTimeRef.current) / 1000, 0.04);
      lastTimeRef.current = ts;

      const s = stateRef.current;

      // Run user code safely
      try {
        const fn = new Function('state', 'dt', codeRef.current);
        fn(s, dt);
      } catch { /* ignore code errors in preview */ }

      // Physics
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.vy += 280 * dt; // gravity

      // Bounce off walls
      if (s.x - s.r < 0) { s.x = s.r; s.vx = Math.abs(s.vx) * 0.85; }
      if (s.x + s.r > W) { s.x = W - s.r; s.vx = -Math.abs(s.vx) * 0.85; }
      if (s.y + s.r > H - 24) {
        s.y = H - 24 - s.r;
        s.vy = -Math.abs(s.vy) * 0.72;
        if (Math.abs(s.vy) < 20) s.vy = 0;
      }
      if (s.y - s.r < 0) { s.y = s.r; s.vy = Math.abs(s.vy) * 0.8; }

      // Coin collection
      COINS.forEach(c => {
        if (!c.collected && Math.hypot(s.x - c.x, s.y - c.y) < s.r + 10) {
          c.collected = true;
          s.score += 10;
        }
      });
      if (COINS.every(c => c.collected)) {
        resetCoins();
      }

      // Draw
      ctx.fillStyle = '#0D1119';
      ctx.fillRect(0, 0, W, H);

      // Grid
      ctx.strokeStyle = 'rgba(255,255,255,0.03)';
      ctx.lineWidth = 1;
      for (let gx = 0; gx < W; gx += 40) { ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, H); ctx.stroke(); }
      for (let gy = 0; gy < H; gy += 40) { ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke(); }

      // Ground
      ctx.fillStyle = 'rgba(240,169,78,0.12)';
      ctx.fillRect(0, H - 24, W, 24);
      ctx.fillStyle = '#F0A94E';
      ctx.fillRect(0, H - 24, W, 1);

      // Coins
      COINS.forEach(c => {
        if (c.collected) return;
        ctx.beginPath();
        ctx.arc(c.x, c.y, 8, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(240,169,78,0.15)';
        ctx.fill();
        ctx.strokeStyle = '#F0A94E';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.fillStyle = '#F0A94E';
        ctx.font = '10px JetBrains Mono';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('$', c.x, c.y);
      });

      // Ball glow
      const grd = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r * 2.5);
      grd.addColorStop(0, 'rgba(79,209,197,0.25)');
      grd.addColorStop(1, 'transparent');
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r * 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Ball
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = '#4FD1C5';
      ctx.fill();

      // Score
      ctx.font = '11px JetBrains Mono';
      ctx.fillStyle = '#F0A94E';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(`SCORE: ${s.score}`, 10, 8);

      // Velocity vector
      const mag = Math.hypot(s.vx, s.vy);
      if (mag > 5) {
        ctx.save();
        ctx.translate(s.x, s.y);
        ctx.strokeStyle = 'rgba(240,169,78,0.5)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo((s.vx / mag) * 28, (s.vy / mag) * 28);
        ctx.stroke();
        ctx.restore();
      }

      frameRef.current = requestAnimationFrame(loop);
    }

    lastTimeRef.current = performance.now();
    frameRef.current = requestAnimationFrame(loop);

    return () => cancelAnimationFrame(frameRef.current);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="try-output-canvas"
      style={{ background: '#0D1119', display: 'block' }}
    />
  );
});

MiniGameCanvas.displayName = 'MiniGameCanvas';
export { MiniGameCanvas };
