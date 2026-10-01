import React, { useEffect, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import type { ReadoutData, PlayerState, WorldConfig } from '../../types/lesson';

interface GameCanvasProps {
  updateFn: ((state: Record<string, unknown>, keys: Record<string, boolean>, dt: number, world: Record<string, unknown>) => void) | null;
  statusMessage: string;
  isError: boolean;
  lessonId: string;
  onSuccess?: () => void;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  life: number;
  maxLife: number;
  size: number;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  updateFn,
  statusMessage,
  isError,
  lessonId,
  onSuccess
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [readout, setReadout] = useState<ReadoutData>({ x: 0, y: 0, vx: 0, vy: 0, fps: 60 });
  const particlesRef = useRef<Particle[]>([]);

  // Simulation State
  const stateRef = useRef<PlayerState>({
    x: 40,
    y: 40,
    vx: 0,
    vy: 0,
    width: 22,
    height: 22,
    onGround: false,
    enemyX: 400,
    enemyY: 70,
    score: 0,
    coins: [
      { x: 320, y: 110, collected: false },
      { x: 200, y: 190, collected: false },
      { x: 410, y: 200, collected: false }
    ]
  });

  const keysRef = useRef<Record<string, boolean>>({
    left: false,
    right: false,
    up: false,
    down: false
  });

  const worldConfig: WorldConfig = {
    width: 480,
    height: 280,
    groundY: 240,
    platform: { x: 280, y: 145, w: 100, h: 18 },
    goal: { x: 420, y: 190, w: 32, h: 48 }
  };

  // Reset state when lesson changes
  useEffect(() => {
    stateRef.current = {
      x: 40,
      y: 40,
      vx: 0,
      vy: 0,
      width: 22,
      height: 22,
      onGround: false,
      enemyX: 400,
      enemyY: 70,
      score: 0,
      coins: [
        { x: 320, y: 110, collected: false },
        { x: 200, y: 190, collected: false },
        { x: 410, y: 200, collected: false }
      ]
    };
    particlesRef.current = [];
  }, [lessonId]);

  // Keyboard Event Listeners
  useEffect(() => {
    const isTypingInEditor = () => {
      const active = document.activeElement;
      if (!active) return false;
      const tag = active.tagName.toLowerCase();
      if (tag === 'input' || tag === 'textarea') return true;
      if (active.closest('.cm-editor') || active.closest('.cm-content')) return true;
      return false;
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key;
      const lower = key.toLowerCase();

      // If user is editing code in CodeMirror, don't hijack WASD letters
      if (isTypingInEditor()) {
        return;
      }

      if (['arrowleft', 'arrowright', 'arrowup', 'arrowdown', ' ', 'spacebar'].includes(lower)) {
        e.preventDefault();
      }

      if (key === 'ArrowLeft' || lower === 'a') keysRef.current.left = true;
      if (key === 'ArrowRight' || lower === 'd') keysRef.current.right = true;
      if (key === 'ArrowUp' || lower === 'w' || key === ' ' || key === 'Spacebar') keysRef.current.up = true;
      if (key === 'ArrowDown' || lower === 's') keysRef.current.down = true;
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key;
      const lower = key.toLowerCase();

      if (key === 'ArrowLeft' || lower === 'a') keysRef.current.left = false;
      if (key === 'ArrowRight' || lower === 'd') keysRef.current.right = false;
      if (key === 'ArrowUp' || lower === 'w' || key === ' ' || key === 'Spacebar') keysRef.current.up = false;
      if (key === 'ArrowDown' || lower === 's') keysRef.current.down = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Main Render Loop
  useEffect(() => {
    let rafId: number;
    let lastTime = 0;
    let fpsSmooth = 60;
    let isWon = false;

    const loop = (timestamp: number) => {
      rafId = requestAnimationFrame(loop);
      if (!lastTime) lastTime = timestamp;
      const dt = Math.min((timestamp - lastTime) / 1000, 0.05);
      lastTime = timestamp;

      fpsSmooth = fpsSmooth * 0.9 + (1 / Math.max(dt, 0.001)) * 0.1;

      const state = stateRef.current;
      const keys = keysRef.current;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Execute code update function
      if (updateFn) {
        try {
          updateFn(
            state as unknown as Record<string, unknown>,
            keys,
            dt,
            worldConfig as unknown as Record<string, unknown>
          );
        } catch {
          // Runtime error handled by parent status
        }
      }

      // Add movement trail particles
      if (Math.abs(state.vx) > 10 || Math.abs(state.vy) > 10) {
        if (Math.random() < 0.3) {
          particlesRef.current.push({
            x: state.x + state.width / 2,
            y: state.y + state.height / 2,
            vx: (Math.random() - 0.5) * 20,
            vy: (Math.random() - 0.5) * 20,
            color: 'rgba(240, 169, 78, 0.4)',
            life: 1,
            maxLife: 0.3,
            size: Math.random() * 3 + 2
          });
        }
      }

      // Capstone Win Condition Check
      if (lessonId === 'capstone' && !isWon) {
        const allCoinsCollected = state.coins.every(c => c.collected);
        if (allCoinsCollected && state.x > worldConfig.goal.x - 10) {
          isWon = true;
          confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
          if (onSuccess) onSuccess();
        }
      }

      // Clear Canvas
      ctx.clearRect(0, 0, worldConfig.width, worldConfig.height);

      // Draw Grid Background
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
      ctx.lineWidth = 1;
      for (let x = 0; x < worldConfig.width; x += 20) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, worldConfig.height);
        ctx.stroke();
      }
      for (let y = 0; y < worldConfig.height; y += 20) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(worldConfig.width, y);
        ctx.stroke();
      }

      // Draw Ground
      ctx.strokeStyle = '#252B3B';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, worldConfig.groundY + 0.5);
      ctx.lineTo(worldConfig.width, worldConfig.groundY + 0.5);
      ctx.stroke();

      ctx.fillStyle = 'rgba(37, 43, 59, 0.2)';
      ctx.fillRect(0, worldConfig.groundY, worldConfig.width, worldConfig.height - worldConfig.groundY);

      // Draw Platform (Collision & Capstone lessons)
      if (['collision', 'capstone'].includes(lessonId)) {
        const p = worldConfig.platform;
        ctx.fillStyle = '#181C29';
        ctx.strokeStyle = '#4FD1C5';
        ctx.lineWidth = 1.5;
        ctx.fillRect(p.x, p.y, p.w, p.h);
        ctx.strokeRect(p.x + 0.5, p.y + 0.5, p.w - 1, p.h - 1);

        // Platform top glow
        ctx.strokeStyle = 'rgba(79, 209, 197, 0.6)';
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x + p.w, p.y);
        ctx.stroke();
      }

      // Draw Coins / Energy Gems (Capstone lesson)
      if (lessonId === 'capstone' && state.coins) {
        state.coins.forEach(coin => {
          if (!coin.collected) {
            ctx.fillStyle = '#4FD1C5';
            ctx.shadowColor = 'rgba(79, 209, 197, 0.8)';
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.arc(coin.x, coin.y, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
          }
        });

        // Draw Portal Goal
        const g = worldConfig.goal;
        ctx.fillStyle = 'rgba(0, 255, 136, 0.15)';
        ctx.strokeStyle = '#00ff88';
        ctx.lineWidth = 2;
        ctx.shadowColor = 'rgba(0, 255, 136, 0.6)';
        ctx.shadowBlur = 15;
        ctx.fillRect(g.x, g.y, g.w, g.h);
        ctx.strokeRect(g.x, g.y, g.w, g.h);
        ctx.shadowBlur = 0;
      }

      // Draw Enemy (Chase AI & Capstone)
      if (['chase', 'capstone'].includes(lessonId)) {
        ctx.fillStyle = '#F0616B';
        ctx.shadowColor = 'rgba(240, 97, 107, 0.8)';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(state.enemyX, state.enemyY, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // Draw Particles
      particlesRef.current.forEach((p, idx) => {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= dt;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (p.life / p.maxLife), 0, Math.PI * 2);
        ctx.fill();
        if (p.life <= 0) {
          particlesRef.current.splice(idx, 1);
        }
      });

      // Draw Player Square
      ctx.fillStyle = '#F0A94E';
      ctx.shadowColor = 'rgba(240, 169, 78, 0.6)';
      ctx.shadowBlur = 12;
      ctx.fillRect(state.x, state.y, state.width, state.height);
      ctx.shadowBlur = 0;

      // Update Readouts state
      setReadout({
        x: Math.round(state.x),
        y: Math.round(state.y),
        vx: Math.round(state.vx || 0),
        vy: Math.round(state.vy || 0),
        fps: Math.round(fpsSmooth)
      });
    };

    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, [updateFn, lessonId, onSuccess]);

  return (
    <div className="panel canvas-panel">
      <div className="panel-head">
        <div className="label">
          <span>simulation canvas</span>
        </div>
        <div className="keys-hint">
          <span className="key">← → ↑ ↓</span>
          <span className="key">WASD</span>
          <span className="key">Space: Jump</span>
        </div>
      </div>

      <div className="sim-body">
        <canvas
          ref={canvasRef}
          width={worldConfig.width}
          height={worldConfig.height}
          tabIndex={0}
        />

        <div className="readout">
          <span>
            x <b className="val-teal">{readout.x}</b>
          </span>
          <span>
            y <b className="val-teal">{readout.y}</b>
          </span>
          <span>
            vx <b className="val-teal">{readout.vx}</b>
          </span>
          <span>
            vy <b className="val-teal">{readout.vy}</b>
          </span>
          <span>
            fps <b className="val-teal">{readout.fps}</b>
          </span>
        </div>

        <div className={`status ${isError ? 'err' : ''}`}>
          {statusMessage}
        </div>
      </div>
    </div>
  );
};
