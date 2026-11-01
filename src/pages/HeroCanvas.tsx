import { useEffect, useRef } from 'react';

/* ────────────────────────────────────────────────────────────────
   HeroCanvas — CSS3D + Canvas particle field.
   Floating code symbols drift through 3D-projected space.
   Mouse parallax tilts the field slightly.
   ──────────────────────────────────────────────────────────────── */

const SYMBOLS = [
  '{}', '()', '=>', '[]', '&&', '||', '+=', '<=',
  'state', 'delta', 'vx', 'vy', 'fn()', 'for', 'if',
  '0xff', '#include', 'void', 'print()', 'return',
  '01', '00', '10', '11', 'x++', 'i=0',
];

interface Particle {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  text: string;
  size: number;
  opacity: number;
  hue: number; // 0=amber, 1=teal, 2=purple, 3=dimmer
}

const HUES = [
  'rgba(240,169,78,',     // amber
  'rgba(79,209,197,',     // teal
  'rgba(167,139,250,',    // purple
  'rgba(90,100,128,',     // muted
];

export function HeroCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let W = 0, H = 0;
    let mouseX = 0, mouseY = 0;
    let rafId = 0;

    // Build particles
    const COUNT = 80;
    const particles: Particle[] = Array.from({ length: COUNT }, () => ({
      x: (Math.random() - 0.5) * 2000,
      y: (Math.random() - 0.5) * 1200,
      z: Math.random() * 1800 + 200,
      vx: (Math.random() - 0.5) * 0.25,
      vy: (Math.random() - 0.5) * 0.15,
      vz: -(Math.random() * 0.4 + 0.15),
      text: SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
      size: Math.random() * 5 + 9,
      opacity: Math.random() * 0.4 + 0.08,
      hue: Math.floor(Math.random() * 4),
    }));

    function resize() {
      W = canvas!.width = canvas!.offsetWidth;
      H = canvas!.height = canvas!.offsetHeight;
    }

    function project(p: Particle, parallaxX: number, parallaxY: number): [number, number, number] {
      const focalLength = 600;
      const scale = focalLength / (focalLength + p.z);
      const screenX = W / 2 + (p.x + parallaxX * 0.3) * scale;
      const screenY = H / 2 + (p.y + parallaxY * 0.2) * scale;
      return [screenX, screenY, scale];
    }

    function draw() {
      ctx!.clearRect(0, 0, W, H);

      const parallaxX = (mouseX - W / 2) * 0.04;
      const parallaxY = (mouseY - H / 2) * 0.03;

      for (const p of particles) {
        // Update position
        p.x += p.vx;
        p.y += p.vy;
        p.z += p.vz;

        // Reset when too close or out of view
        if (p.z < 10 || p.z > 2200) {
          p.z = 2200;
          p.x = (Math.random() - 0.5) * 2000;
          p.y = (Math.random() - 0.5) * 1200;
          p.text = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
        }

        const [sx, sy, scale] = project(p, parallaxX, parallaxY);
        if (sx < -100 || sx > W + 100 || sy < -100 || sy > H + 100) continue;

        const alpha = p.opacity * scale;
        const fontSize = p.size * scale;

        ctx!.save();
        ctx!.globalAlpha = Math.min(alpha, 0.65);
        ctx!.font = `${Math.max(fontSize, 7)}px 'JetBrains Mono', monospace`;
        ctx!.fillStyle = HUES[p.hue] + '1)';
        ctx!.fillText(p.text, sx, sy);
        ctx!.restore();
      }

      // Central glow spot
      const grad = ctx!.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.min(W, H) * 0.5);
      grad.addColorStop(0, 'rgba(240,169,78,0.04)');
      grad.addColorStop(1, 'transparent');
      ctx!.fillStyle = grad;
      ctx!.fillRect(0, 0, W, H);

      rafId = requestAnimationFrame(draw);
    }

    const onResize = () => resize();
    const onMouse = (e: MouseEvent) => { mouseX = e.clientX; mouseY = e.clientY; };

    window.addEventListener('resize', onResize);
    window.addEventListener('mousemove', onMouse);

    resize();
    draw();

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('mousemove', onMouse);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="hero-canvas"
      style={{ width: '100%', height: '100%' }}
      aria-hidden="true"
    />
  );
}

