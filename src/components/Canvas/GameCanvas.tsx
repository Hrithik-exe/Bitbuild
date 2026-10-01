import React, { useEffect, useRef, useState, useCallback } from 'react';
import confetti from 'canvas-confetti';
import type { ReadoutData, PlayerState, WorldConfig } from '../../types/lesson';
import { blipAudio } from '../../services/BlipAudio';

interface GameCanvasProps {
  updateFn: ((state: Record<string, unknown>, keys: Record<string, boolean>, dt: number, world: Record<string, unknown>) => void) | null;
  statusMessage: string;
  isError: boolean;
  lessonId: string;
  onSuccess?: () => void;
}

interface DebrisParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  updateFn,
  statusMessage,
  isError,
  lessonId,
  onSuccess
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [coordMode, setCoordMode] = useState<'screen' | 'math'>('math');
  const [showCoordExplainer, setShowCoordExplainer] = useState(false);
  const coordModeRef = useRef<'screen' | 'math'>('math');
  coordModeRef.current = coordMode;

  const [readout, setReadout] = useState<ReadoutData>({ x: 40, y: 0, vx: 0, vy: 0, fps: 60 });
  const [isGameOver, setIsGameOver] = useState(false);

  // Initialize World Config with entities driven dynamically by user code
  const initWorld = useCallback((currentLessonId: string): WorldConfig => {
    const isGroundless = currentLessonId === 'move' || currentLessonId === 'gravity-1';
    return {
      width: 480,
      height: 280,
      groundY: isGroundless ? -1 : 240,
      platform: ['collision', 'capstone'].includes(currentLessonId) ? { x: 250, y: 145, w: 120, h: 20 } : null,
      goal: currentLessonId === 'capstone' ? { x: 416, y: 175, w: 38, h: 65 } : null
    };
  }, []);

  const worldRef = useRef<WorldConfig>(initWorld(lessonId));

  // Simulation State: Player starts at (60,60) for free movement, or grounded on floor for physics
  const isMoveLesson = lessonId === 'move';
  const isAirborne = ['move', 'gravity-1', 'gravity-2'].includes(lessonId);
  const stateRef = useRef<PlayerState>({
    x: 60,
    y: lessonId === 'gravity-1' ? 30 : lessonId === 'gravity-2' ? 40 : isMoveLesson ? 60 : 218,
    vx: 0,
    vy: 0,
    width: 22,
    height: 22,
    onGround: !isAirborne,
    enemyX: 400,
    enemyY: 70,
    enemyRadius: 10,
    score: 0,
    coins: [
      { x: 300, y: 115, collected: false },
      { x: 160, y: 185, collected: false },
      { x: 360, y: 215, collected: false }
    ]
  });

  const keysRef = useRef<Record<string, boolean>>({
    left: false,
    right: false,
    up: false,
    down: false
  });

  const isGameOverRef = useRef(false);
  const deathParticlesRef = useRef<DebrisParticle[]>([]);
  const shakeTimeRef = useRef(0);
  const lessonIdRef = useRef(lessonId);
  lessonIdRef.current = lessonId;

  // Respawn / Reset Player Function
  const respawn = useCallback(() => {
    isGameOverRef.current = false;
    setIsGameOver(false);
    deathParticlesRef.current = [];
    shakeTimeRef.current = 0;

    // Reset world entities according to current lesson defaults
    worldRef.current = initWorld(lessonIdRef.current);

    const gY = typeof worldRef.current.groundY === 'number' && worldRef.current.groundY > 0
      ? worldRef.current.groundY
      : 240;
    const pH = stateRef.current.height || 22;

    if (lessonIdRef.current === 'move') {
      stateRef.current.x = 60;
      stateRef.current.y = 60;
      stateRef.current.onGround = false;
    } else if (lessonIdRef.current === 'gravity-1') {
      stateRef.current.x = 60;
      stateRef.current.y = 30; // High in the air to demonstrate free fall
      stateRef.current.onGround = false;
    } else if (lessonIdRef.current === 'gravity-2') {
      stateRef.current.x = 60;
      stateRef.current.y = 40; // Mid-air to demonstrate landing on the floor
      stateRef.current.onGround = false;
    } else {
      stateRef.current.x = 40;
      stateRef.current.y = gY - pH; // Spawn grounded flush on the floor (218)
      stateRef.current.onGround = true;
    }
    stateRef.current.vx = 0;
    stateRef.current.vy = 0;
    stateRef.current.width = 22;
    stateRef.current.height = 22;
    stateRef.current.enemyX = 400;
    stateRef.current.enemyY = 70;
    stateRef.current.enemyRadius = 10;

    if (lessonIdRef.current === 'capstone') {
      stateRef.current.coins = [
        { x: 300, y: 115, collected: false },
        { x: 160, y: 185, collected: false },
        { x: 360, y: 215, collected: false }
      ];
      stateRef.current.score = 0;
    }

    keysRef.current.left = false;
    keysRef.current.right = false;
    keysRef.current.up = false;
    keysRef.current.down = false;
  }, [initWorld]);

  // Trigger Death Sequence
  const triggerDeath = useCallback(() => {
    if (isGameOverRef.current) return;
    isGameOverRef.current = true;
    setIsGameOver(true);
    shakeTimeRef.current = 0.45;
    blipAudio.playDeathTone();

    const px = stateRef.current.x + (stateRef.current.width || 22) / 2;
    const py = stateRef.current.y + (stateRef.current.height || 22) / 2;
    const particles: DebrisParticle[] = [];
    const colors = ['#F0A94E', '#F0616B', '#FFD166', '#FF4757', '#FFFFFF', '#FFA07A'];

    for (let i = 0; i < 36; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 40 + Math.random() * 240;
      particles.push({
        x: px,
        y: py,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 50,
        size: 2.5 + Math.random() * 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1,
        life: 0,
        maxLife: 0.5 + Math.random() * 0.7
      });
    }
    deathParticlesRef.current = particles;
  }, []);

  // Reset state when lesson changes
  useEffect(() => {
    respawn();
  }, [lessonId, respawn]);

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

      // If game is over, Space, Enter, or R respawns
      if (isGameOverRef.current) {
        if (key === ' ' || key === 'Spacebar' || key === 'Enter' || lower === 'r') {
          e.preventDefault();
          respawn();
          return;
        }
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
  }, [respawn]);

  // Main Render Loop
  useEffect(() => {
    let rafId: number;
    let lastTime = 0;
    let lastReadoutTime = 0;
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

      const world = worldRef.current;
      const worldW = world.width || 480;
      const worldH = world.height || 280;

      // Update simulation if player is alive
      if (!isGameOverRef.current) {
        // Execute code update function: passes mutable state and mutable world
        if (updateFn) {
          try {
            updateFn(
              state as unknown as Record<string, unknown>,
              keys,
              dt,
              world as unknown as Record<string, unknown>
            );
          } catch {
            // Runtime error handled by parent status
          }
        }

        // Check Enemy Collision (Death Animation Trigger)
        const hasEnemy = typeof state.enemyX === 'number' && typeof state.enemyY === 'number' &&
          (['chase', 'capstone'].includes(lessonId) || state.enemyX > 0);
        if (hasEnemy && !isWon) {
          const px = state.x + (state.width || 22) / 2;
          const py = state.y + (state.height || 22) / 2;
          const distToEnemy = Math.hypot(px - state.enemyX, py - state.enemyY);
          const hitRadius = ((state.width || 22) / 2) + (state.enemyRadius || 10) - 3;
          if (distToEnemy < hitRadius) {
            triggerDeath();
          }
        }

        // Capstone Win Condition Check (Dynamic portal hitbox)
        const currentGoal = world.goal;
        if (currentGoal && lessonId === 'capstone' && !isWon) {
          const playerHitsGoal =
            state.x < currentGoal.x + currentGoal.w &&
            state.x + (state.width || 22) > currentGoal.x &&
            state.y < currentGoal.y + currentGoal.h &&
            state.y + (state.height || 22) > currentGoal.y;

          const allCoinsCollected = Boolean(state.coins && state.coins.length > 0 && state.coins.every(c => c.collected));

          if (playerHitsGoal && allCoinsCollected) {
            isWon = true;
            confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
            if (onSuccess) onSuccess();
          }
        }
      }

      // Update Screen Shake Timer
      if (shakeTimeRef.current > 0) {
        shakeTimeRef.current = Math.max(0, shakeTimeRef.current - dt);
      }

      // Clear Canvas
      ctx.clearRect(0, 0, worldW, worldH);

      // Save context for camera shake
      ctx.save();
      if (shakeTimeRef.current > 0) {
        const intensity = (shakeTimeRef.current / 0.45) * 10;
        const offsetX = (Math.random() - 0.5) * intensity * 2;
        const offsetY = (Math.random() - 0.5) * intensity * 2;
        ctx.translate(offsetX, offsetY);
      }

      // Draw Grid Background
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
      ctx.lineWidth = 1;
      for (let x = 0; x < worldW; x += 20) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, worldH);
        ctx.stroke();
      }
      for (let y = 0; y < worldH; y += 20) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(worldW, y);
        ctx.stroke();
      }

      // Draw Ground (Driven dynamically by world.groundY - only for lessons with ground physics)
      const hasGround = !['move', 'gravity-1'].includes(lessonId) && typeof world.groundY === 'number' && world.groundY > 0;
      if (hasGround) {
        const groundY = world.groundY;
        ctx.strokeStyle = '#252B3B';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, groundY + 0.5);
        ctx.lineTo(worldW, groundY + 0.5);
        ctx.stroke();

        ctx.fillStyle = 'rgba(37, 43, 59, 0.2)';
        ctx.fillRect(0, groundY, worldW, worldH - groundY);

        // Draw Visual Coordinate Axis Widget (Origin & Direction Indicators)
        const axisOriginX = 24;
        ctx.save();
        if (coordModeRef.current === 'math') {
          // Math / Cartesian mode: Origin is at ground level, +Y points UP
          const axisOriginY = groundY;

          ctx.strokeStyle = 'rgba(79, 209, 197, 0.65)';
          ctx.fillStyle = '#4FD1C5';
          ctx.lineWidth = 1.5;

          // Vertical +Y Axis (Pointing UP from ground)
          ctx.beginPath();
          ctx.moveTo(axisOriginX, axisOriginY);
          ctx.lineTo(axisOriginX, axisOriginY - 55);
          ctx.stroke();

          // Arrow head UP
          ctx.beginPath();
          ctx.moveTo(axisOriginX - 3.5, axisOriginY - 48);
          ctx.lineTo(axisOriginX, axisOriginY - 57);
          ctx.lineTo(axisOriginX + 3.5, axisOriginY - 48);
          ctx.stroke();

          // Label +Y UP
          ctx.font = 'bold 9px "JetBrains Mono", monospace';
          ctx.fillText('+Y (UP)', axisOriginX + 6, axisOriginY - 48);

          // Horizontal +X Axis (Pointing RIGHT along ground)
          ctx.beginPath();
          ctx.moveTo(axisOriginX, axisOriginY);
          ctx.lineTo(axisOriginX + 55, axisOriginY);
          ctx.stroke();

          // Arrow head RIGHT
          ctx.beginPath();
          ctx.moveTo(axisOriginX + 48, axisOriginY - 3.5);
          ctx.lineTo(axisOriginX + 57, axisOriginY);
          ctx.lineTo(axisOriginX + 48, axisOriginY + 3.5);
          ctx.stroke();

          // Label +X RIGHT
          ctx.fillText('+X', axisOriginX + 48, axisOriginY - 5);

          // Origin circle (0,0) at Ground
          ctx.beginPath();
          ctx.arc(axisOriginX, axisOriginY, 3, 0, Math.PI * 2);
          ctx.fill();
          ctx.font = 'bold 8px "JetBrains Mono", monospace';
          ctx.fillText('(0,0) GROUND', axisOriginX + 6, axisOriginY + 11);
        } else {
          // Screen / Raster mode: Origin is at top-left roof, +Y points DOWN
          const axisOriginY = 18;

          ctx.strokeStyle = 'rgba(240, 169, 78, 0.65)';
          ctx.fillStyle = '#F0A94E';
          ctx.lineWidth = 1.5;

          // Vertical +Y Axis (Pointing DOWN from roof)
          ctx.beginPath();
          ctx.moveTo(axisOriginX, axisOriginY);
          ctx.lineTo(axisOriginX, axisOriginY + 50);
          ctx.stroke();

          // Arrow head DOWN
          ctx.beginPath();
          ctx.moveTo(axisOriginX - 3.5, axisOriginY + 44);
          ctx.lineTo(axisOriginX, axisOriginY + 52);
          ctx.lineTo(axisOriginX + 3.5, axisOriginY + 44);
          ctx.stroke();

          // Label +Y DOWN
          ctx.font = 'bold 9px "JetBrains Mono", monospace';
          ctx.fillText('+Y (DOWN)', axisOriginX + 6, axisOriginY + 48);

          // Horizontal +X Axis (Pointing RIGHT along roof)
          ctx.beginPath();
          ctx.moveTo(axisOriginX, axisOriginY);
          ctx.lineTo(axisOriginX + 50, axisOriginY);
          ctx.stroke();

          // Arrow head RIGHT
          ctx.beginPath();
          ctx.moveTo(axisOriginX + 44, axisOriginY - 3.5);
          ctx.lineTo(axisOriginX + 52, axisOriginY);
          ctx.lineTo(axisOriginX + 44, axisOriginY + 3.5);
          ctx.stroke();

          // Label +X
          ctx.fillText('+X', axisOriginX + 45, axisOriginY - 4);

          // Origin circle (0,0) at Roof
          ctx.beginPath();
          ctx.arc(axisOriginX, axisOriginY, 3, 0, Math.PI * 2);
          ctx.fill();
          ctx.font = 'bold 8px "JetBrains Mono", monospace';
          ctx.fillText('(0,0) ROOF', axisOriginX + 6, axisOriginY + 11);
        }
        ctx.restore();
      }

      // Draw Platform (Collision Box: Driven dynamically by world.platform)
      const p = world.platform;
      if (p && typeof p.x === 'number' && typeof p.y === 'number' && typeof p.w === 'number' && typeof p.h === 'number') {
        ctx.fillStyle = '#181C29';
        ctx.strokeStyle = '#4FD1C5';
        ctx.lineWidth = 1.5;
        ctx.fillRect(p.x, p.y, p.w, p.h);
        ctx.strokeRect(p.x + 0.5, p.y + 0.5, p.w - 1, p.h - 1);

        // Platform top glow line
        ctx.strokeStyle = 'rgba(79, 209, 197, 0.7)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x + p.w, p.y);
        ctx.stroke();

        // Box dimensions indicator showing exact code-defined values
        ctx.fillStyle = '#4FD1C5';
        ctx.font = 'bold 8.5px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`BOX: ${Math.round(p.w)}×${Math.round(p.h)}`, p.x + p.w / 2, p.y + p.h / 2 + 3);

        // Solid collision box corner markers
        ctx.fillStyle = '#4FD1C5';
        ctx.fillRect(p.x, p.y, 2.5, 2.5);
        ctx.fillRect(p.x + p.w - 2.5, p.y, 2.5, 2.5);
        ctx.fillRect(p.x, p.y + p.h - 2.5, 2.5, 2.5);
        ctx.fillRect(p.x + p.w - 2.5, p.y + p.h - 2.5, 2.5, 2.5);
      }

      // Draw Coins / Energy Gems (Driven dynamically by state.coins)
      if (state.coins && state.coins.length > 0) {
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
      }

      // Draw Portal Goal (Driven dynamically by world.goal)
      const g = world.goal;
      if (g && typeof g.x === 'number' && typeof g.y === 'number' && typeof g.w === 'number' && typeof g.h === 'number') {
        const allCoinsCollected = Boolean(state.coins && state.coins.length > 0 && state.coins.every(c => c.collected));
        const coinsCollectedCount = state.coins ? state.coins.filter(c => c.collected).length : 0;
        const totalCoins = state.coins ? state.coins.length : 3;

        if (allCoinsCollected) {
          // Open Radiant Green Portal
          ctx.fillStyle = 'rgba(0, 255, 136, 0.2)';
          ctx.strokeStyle = '#00ff88';
          ctx.lineWidth = 2.5;
          ctx.shadowColor = 'rgba(0, 255, 136, 0.8)';
          ctx.shadowBlur = 18;
          ctx.fillRect(g.x, g.y, g.w, g.h);
          ctx.strokeRect(g.x + 0.5, g.y + 0.5, g.w - 1, g.h - 1);
          ctx.shadowBlur = 0;

          // Inner portal label
          ctx.fillStyle = '#00ff88';
          ctx.font = 'bold 9px monospace';
          ctx.textAlign = 'center';
          ctx.fillText('PORTAL', g.x + g.w / 2, g.y + g.h / 2 - 2);
          ctx.fillText('OPEN', g.x + g.w / 2, g.y + g.h / 2 + 10);
        } else {
          // Locked Amber Portal
          ctx.fillStyle = 'rgba(240, 169, 78, 0.1)';
          ctx.strokeStyle = '#F0A94E';
          ctx.lineWidth = 1.5;
          ctx.shadowColor = 'rgba(240, 169, 78, 0.4)';
          ctx.shadowBlur = 8;
          ctx.fillRect(g.x, g.y, g.w, g.h);
          ctx.strokeRect(g.x + 0.5, g.y + 0.5, g.w - 1, g.h - 1);
          ctx.shadowBlur = 0;

          // Locked label showing progress
          ctx.fillStyle = '#F0A94E';
          ctx.font = 'bold 9px monospace';
          ctx.textAlign = 'center';
          ctx.fillText('PORTAL', g.x + g.w / 2, g.y + g.h / 2 - 2);
          ctx.fillText(state.coins && state.coins.length > 0 ? `${coinsCollectedCount}/${totalCoins}` : 'EXIT', g.x + g.w / 2, g.y + g.h / 2 + 10);
        }
      }

      // Draw Enemy (Driven dynamically by state.enemyX, state.enemyY, state.enemyRadius)
      if (typeof state.enemyX === 'number' && typeof state.enemyY === 'number' && (['chase', 'capstone'].includes(lessonId) || state.enemyX > 0)) {
        const enemyR = typeof state.enemyRadius === 'number' ? state.enemyRadius : 10;
        ctx.fillStyle = '#F0616B';
        ctx.shadowColor = 'rgba(240, 97, 107, 0.8)';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(state.enemyX, state.enemyY, enemyR, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // Draw Player Square (Driven dynamically by state.x, state.y, state.width, state.height, state.color)
      if (!isGameOverRef.current) {
        const pw = state.width || 22;
        const ph = state.height || 22;
        ctx.fillStyle = state.color || '#F0A94E';
        ctx.shadowColor = 'rgba(240, 169, 78, 0.6)';
        ctx.shadowBlur = 12;
        ctx.fillRect(state.x, state.y, pw, ph);
        ctx.shadowBlur = 0;
      }

      // Update and Draw Death Particles
      if (deathParticlesRef.current.length > 0) {
        for (let i = deathParticlesRef.current.length - 1; i >= 0; i--) {
          const p = deathParticlesRef.current[i];
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.vy += 320 * dt; // gravity on debris
          p.life += dt;
          p.alpha = Math.max(0, 1 - p.life / p.maxLife);

          ctx.save();
          ctx.globalAlpha = p.alpha;
          ctx.fillStyle = p.color;
          ctx.shadowColor = p.color;
          ctx.shadowBlur = 8;
          ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
          ctx.restore();
        }
        deathParticlesRef.current = deathParticlesRef.current.filter(p => p.life < p.maxLife);
      }

      // Restore camera shake transform
      ctx.restore();

      // Render Game Over Overlay Card on Canvas
      if (isGameOverRef.current) {
        ctx.fillStyle = 'rgba(9, 11, 16, 0.78)';
        ctx.fillRect(0, 0, worldW, worldH);

        const cardW = 280;
        const cardH = 138;
        const cardX = (worldW - cardW) / 2;
        const cardY = (worldH - cardH) / 2;

        // Card background
        ctx.fillStyle = '#121622';
        ctx.fillRect(cardX, cardY, cardW, cardH);

        // Card border with red glow
        ctx.strokeStyle = '#F0616B';
        ctx.lineWidth = 1.5;
        ctx.shadowColor = 'rgba(240, 97, 107, 0.7)';
        ctx.shadowBlur = 14;
        ctx.strokeRect(cardX + 0.5, cardY + 0.5, cardW - 1, cardH - 1);
        ctx.shadowBlur = 0;

        // Top header stripe
        ctx.fillStyle = '#F0616B';
        ctx.fillRect(cardX, cardY, cardW, 3);

        // Heading
        ctx.fillStyle = '#F0616B';
        ctx.font = 'bold 20px "Space Grotesk", sans-serif';
        ctx.textAlign = 'center';
        ctx.shadowColor = 'rgba(240, 97, 107, 0.8)';
        ctx.shadowBlur = 10;
        ctx.fillText('☠ GAME OVER', cardX + cardW / 2, cardY + 40);
        ctx.shadowBlur = 0;

        // Subtitle
        ctx.fillStyle = '#8E9AA8';
        ctx.font = '11.5px "JetBrains Mono", monospace';
        ctx.fillText('CAUGHT BY PURSUER AI', cardX + cardW / 2, cardY + 64);

        // Pulsing retry prompt
        const pulse = Math.sin(timestamp / 180) * 0.25 + 0.75;
        ctx.fillStyle = `rgba(240, 169, 78, ${pulse})`;
        ctx.font = 'bold 11px "JetBrains Mono", monospace';
        ctx.fillText('↺ PRESS [SPACE] OR CLICK TO RETRY', cardX + cardW / 2, cardY + 104);

        ctx.strokeStyle = `rgba(240, 169, 78, ${pulse * 0.5})`;
        ctx.lineWidth = 1;
        ctx.strokeRect(cardX + 18, cardY + 87, cardW - 36, 26);
      }

      // Update Readouts state (throttled at 10Hz to prevent React re-render stutter)
      if (timestamp - lastReadoutTime > 100) {
        lastReadoutTime = timestamp;
        const gY = typeof world.groundY === 'number' ? world.groundY : 240;
        const pH = state.height || 22;

        let displayY = Math.round(state.y);
        let displayVy = Math.round(isGameOverRef.current ? 0 : state.vy || 0);

        if (coordModeRef.current === 'math') {
          // In math mode: Ground level is altitude 0. Going up is +Y.
          displayY = Math.round((gY - pH) - state.y);
          // Moving up in canvas is -vy, which is +vy in math coordinates!
          displayVy = -displayVy;
        }

        setReadout({
          x: Math.round(state.x),
          y: displayY,
          vx: Math.round(isGameOverRef.current ? 0 : state.vx || 0),
          vy: displayVy,
          fps: Math.round(fpsSmooth)
        });
      }
    };

    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, [updateFn, lessonId, onSuccess, triggerDeath]);

  return (
    <div className="panel canvas-panel">
      <div className="panel-head">
        <div className="label">
          <span>simulation canvas</span>
        </div>

        {/* Coordinate Mode Toggle (Math Cartesian vs Screen Raster) - only when ground physics is used */}
        {!['move', 'gravity-1'].includes(lessonId) && (
          <div className="canvas-header-controls">
            <div className="coord-mode-selector">
              <button
                type="button"
                className={`coord-btn ${coordMode === 'math' ? 'active' : ''}`}
                onClick={() => setCoordMode('math')}
                title="Cartesian Math Mode: Ground = 0, +Y is UP"
              >
                📐 Math (+Y Up)
              </button>
              <button
                type="button"
                className={`coord-btn ${coordMode === 'screen' ? 'active' : ''}`}
                onClick={() => setCoordMode('screen')}
                title="Screen / Raster Mode: Roof = 0, +Y is DOWN"
              >
                🖥️ Screen (+Y Down)
              </button>
            </div>
            <button
              type="button"
              className="coord-info-btn"
              onClick={() => setShowCoordExplainer(prev => !prev)}
              title="Learn why 2D graphics traditionally use Roof = 0"
            >
              ?
            </button>
          </div>
        )}

        <div className="keys-hint">
          <span className="key">← → ↑ ↓</span>
          <span className="key">WASD</span>
          {['gravity-3', 'gravity-4', 'collision', 'chase', 'capstone'].includes(lessonId) && (
            <span className="key">Space: Jump</span>
          )}
        </div>
      </div>

      <div className="sim-body">
        {/* Educational Coordinate System Explainer Dropdown */}
        {showCoordExplainer && (
          <div className="coord-explainer-card">
            <div className="coord-explainer-header">
              <span className="coord-explainer-title">📐 Why does 2D Computer Graphics use Roof = 0?</span>
              <button type="button" className="coord-explainer-close" onClick={() => setShowCoordExplainer(false)}>✕</button>
            </div>
            <p>
              In <strong>Mathematics & Physics (Cartesian)</strong>, <code>(0,0)</code> is at the ground level and <code>+Y</code> points <strong>UP</strong>.
            </p>
            <p>
              In <strong>2D Computer Graphics (HTML5 Canvas, Pygame, Godot 2D)</strong>, <code>(0,0)</code> is at the top-left ceiling (roof) and <code>+Y</code> points <strong>DOWN</strong>. This originated from cathode-ray tube (CRT) television monitors scanning pixels row-by-row from top to bottom!
            </p>
            <p className="coord-explainer-tip">
              💡 <strong>BitBuild Feature:</strong> Toggle between <strong>Math Mode</strong> (Ground = 0, +Y Up) and <strong>Screen Mode</strong> (Roof = 0, +Y Down) above to see both perspectives live!
            </p>
          </div>
        )}

        <div className="canvas-container">
          <canvas
            ref={canvasRef}
            width={worldRef.current.width || 480}
            height={worldRef.current.height || 280}
            tabIndex={0}
            onClick={() => {
              if (isGameOverRef.current) respawn();
            }}
            style={{ cursor: isGameOver ? 'pointer' : 'default' }}
          />

          {isGameOver && (
            <div className="game-over-banner" onClick={respawn}>
              <span className="game-over-text">☠ Caught by pursuer!</span>
              <button
                className="btn-game-over-retry"
                onClick={(e) => {
                  e.stopPropagation();
                  respawn();
                }}
              >
                ↺ Try Again <kbd>SPACE</kbd>
              </button>
            </div>
          )}
        </div>

        <div className="readout">
          <span>
            x <b className="val-teal">{readout.x}</b>
          </span>
          <span>
            y <b className="val-teal">{readout.y}</b>{' '}
            {!['move', 'gravity-1'].includes(lessonId) && (
              <span style={{ fontSize: '10px', opacity: 0.7 }}>
                {coordMode === 'math' ? '(altitude ↑)' : '(screen ↓)'}
              </span>
            )}
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

        <div className={`status ${isGameOver ? 'err' : isError ? 'err' : ''}`}>
          {isGameOver ? '☠ SIGNAL LOST — Caught by enemy dot! Press [SPACE] or click canvas to retry.' : statusMessage}
        </div>
      </div>
    </div>
  );
};
