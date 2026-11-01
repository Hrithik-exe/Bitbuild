import { useEffect, useState, useRef, useCallback } from 'react';
import { blipAudio } from '../services/BlipAudio';

interface GhostBoxData {
  id: number;
  x: number;
  y: number;
  w: number;
  h: number;
  opacity: number;
  label: string;
}

interface DetectedBox {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
  color: string;
  isSuppressed?: boolean;
}

export function YoloMouseElements() {
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0, w: 34, h: 34 });
  const [cursorLabel, setCursorLabel] = useState('cursor 0.99');
  const [cursorHint, setCursorHint] = useState('');
  const [cursorColor, setCursorColor] = useState('#e6ff00');
  const [isSnapping, setIsSnapping] = useState(false);
  const [ghosts, setGhosts] = useState<GhostBoxData[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [detectedBoxes, setDetectedBoxes] = useState<DetectedBox[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const mouseRef = useRef({ x: 0, y: 0, lastX: 0, lastY: 0, active: false });
  const targetBoxRef = useRef({ x: 0, y: 0, w: 34, h: 34, label: 'cursor 0.99', hint: '', color: '#e6ff00' });
  const currentBoxRef = useRef({ x: 0, y: 0, w: 34, h: 34 });
  const ghostPoolRef = useRef<GhostBoxData[]>(
    Array.from({ length: 12 }, (_, i) => ({ id: i, x: 0, y: 0, w: 34, h: 34, opacity: 0, label: 'cursor? 0.42' }))
  );
  const ghostIdxRef = useRef(0);

  // 1. Mouse movement tracking & target detection
  useEffect(() => {
    // Only activate custom cursor on fine pointer devices
    const finePointer = window.matchMedia('(pointer: fine)').matches;
    if (finePointer) {
      document.body.classList.add('fancy-cursor');
    }

    const onMouseMove = (e: MouseEvent) => {
      mouseRef.current.active = true;
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;

      // Check what element is under the cursor
      const target = document.elementFromPoint(e.clientX, e.clientY);
      let foundBox = false;

      if (target) {
        // Find closest element with data-yolo or interactive element
        const match = target.closest('[data-yolo], button, .btn-primary, .btn-ghost, .lang-tag, .chapter-node, .mentor-card, textarea, .try-panel, .card, .eyeball-wrapper') as HTMLElement | null;

        if (match && !match.classList.contains('hp-root')) {
          const rect = match.getBoundingClientRect();
          const yoloType = match.dataset.yolo || match.tagName.toLowerCase();
          const conf = (0.92 + Math.random() * 0.07).toFixed(2);
          
          let color = '#e6ff00'; // neon acid yellow default
          if (yoloType === 'eyeball') color = '#ff2bd6';
          else if (yoloType === 'button' || match.tagName === 'BUTTON') color = '#00f0ff';
          else if (yoloType === 'editor' || match.tagName === 'TEXTAREA') color = '#4FD1C5';
          else if (yoloType === 'mentor') color = '#a78bfa';

          targetBoxRef.current = {
            x: rect.left - 4,
            y: rect.top - 4,
            w: rect.width + 8,
            h: rect.height + 8,
            label: `${yoloType} ${conf}`,
            hint: match.getAttribute('title') || '',
            color,
          };
          foundBox = true;
        }
      }

      if (!foundBox) {
        // Free cursor mode
        targetBoxRef.current = {
          x: e.clientX - 17,
          y: e.clientY - 17,
          w: 34,
          h: 34,
          label: 'cursor 0.99',
          hint: '',
          color: '#e6ff00',
        };

        // Spawn trailing ghost box when moving fast
        const speed = Math.hypot(e.clientX - mouseRef.current.lastX, e.clientY - mouseRef.current.lastY);
        if (speed > 24) {
          const ghost = ghostPoolRef.current[ghostIdxRef.current];
          ghostIdxRef.current = (ghostIdxRef.current + 1) % ghostPoolRef.current.length;
          const jitter = (Math.random() - 0.5) * 16;
          const sizeJitter = 1 + (Math.random() - 0.5) * 0.3;
          ghost.x = e.clientX - 17 + jitter;
          ghost.y = e.clientY - 17 + jitter;
          ghost.w = 34 * sizeJitter;
          ghost.h = 34 * sizeJitter;
          ghost.opacity = 0.55;
          ghost.label = `cursor? ${(0.3 + Math.random() * 0.45).toFixed(2)}`;
        }
      }

      mouseRef.current.lastX = e.clientX;
      mouseRef.current.lastY = e.clientY;
    };

    const onClick = () => {
      setIsSnapping(false);
      requestAnimationFrame(() => setIsSnapping(true));
      setTimeout(() => setIsSnapping(false), 350);
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('click', onClick);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('click', onClick);
      document.body.classList.remove('fancy-cursor');
    };
  }, []);

  // 2. Smooth Lerp Cursor Animation Frame
  useEffect(() => {
    let rafId = 0;

    const loop = () => {
      // Lerp cursor box to target position
      const t = targetBoxRef.current;
      const c = currentBoxRef.current;

      const lerpSpeed = t.w > 40 ? 0.22 : 0.4;
      c.x += (t.x - c.x) * lerpSpeed;
      c.y += (t.y - c.y) * lerpSpeed;
      c.w += (t.w - c.w) * 0.25;
      c.h += (t.h - c.h) * 0.25;

      setCursorPos({ x: c.x, y: c.y, w: c.w, h: c.h });
      setCursorLabel(t.label);
      setCursorHint(t.hint);
      setCursorColor(t.color);

      // Fade out ghost boxes
      ghostPoolRef.current.forEach(g => {
        if (g.opacity > 0) {
          g.opacity -= 0.025;
        }
      });
      setGhosts([...ghostPoolRef.current.filter(g => g.opacity > 0.02)]);

      rafId = requestAnimationFrame(loop);
    };

    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, []);

  // 3. "Look Once" Full-Screen Object Detection Scanner
  const triggerLookOnce = useCallback(() => {
    if (isScanning) return;
    setIsScanning(true);
    blipAudio.playBlip();

    // Collect all detectable targets on page
    const foundElements = document.querySelectorAll(
      '[data-yolo], button, .btn-primary, .btn-ghost, .lang-tag, .chapter-node, .mentor-card, .try-panel, .eyeball-wrapper'
    );

    const boxes: DetectedBox[] = [];
    foundElements.forEach((el, index) => {
      const rect = el.getBoundingClientRect();
      // Only keep elements visible in current viewport
      if (
        rect.width > 20 &&
        rect.height > 15 &&
        rect.top < window.innerHeight &&
        rect.bottom > 0 &&
        rect.left < window.innerWidth &&
        rect.right > 0
      ) {
        const type = (el as HTMLElement).dataset.yolo || el.tagName.toLowerCase();
        const conf = (0.85 + Math.random() * 0.14).toFixed(2);
        const colors = ['#e6ff00', '#00f0ff', '#ff2bd6', '#4FD1C5'];
        const color = colors[index % colors.length];

        boxes.push({
          id: `${type}-${index}`,
          x: rect.left - 2,
          y: rect.top - 2,
          w: rect.width + 4,
          h: rect.height + 4,
          label: `${type} ${conf}`,
          color,
          isSuppressed: false,
        });
      }
    });

    setDetectedBoxes(boxes);
    setToastMessage(`👁 SCANNED: ${boxes.length} OBJECTS IN 1 LOOK (45 FPS)`);

    // Reset scan state after animation
    setTimeout(() => {
      setIsScanning(false);
      setTimeout(() => {
        setDetectedBoxes([]);
        setToastMessage(null);
      }, 2400);
    }, 600);
  }, [isScanning]);

  // Keyboard shortcut: Press "L" to Look Once
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'l' || e.key === 'L') && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        triggerLookOnce();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [triggerLookOnce]);

  return (
    <>
      {/* CRT Scanline Overlay */}
      <div className="scanlines" aria-hidden="true" />

      {/* Floating HUD "Look Once" Button */}
      <div className="yolo-hud-look">
        <button
          className="look-btn"
          onClick={triggerLookOnce}
          data-yolo="look"
          title="Scan whole screen in one pass [L]"
        >
          👁 Look once <kbd>L</kbd>
        </button>
      </div>

      {/* Trailing Ghost Proposal Boxes */}
      <div id="ghosts" aria-hidden="true">
        {ghosts.map(g => (
          <div
            key={g.id}
            className="ghost-box"
            style={{
              opacity: g.opacity,
              transform: `translate(${g.x}px, ${g.y}px)`,
              width: `${g.w}px`,
              height: `${g.h}px`,
            }}
          >
            <b>{g.label}</b>
          </div>
        ))}
      </div>

      {/* Fancy Cursor HUD Box */}
      <div
        className={`cursor-box ${isSnapping ? 'snap' : ''}`}
        style={{
          transform: `translate(${cursorPos.x}px, ${cursorPos.y}px)`,
          width: `${cursorPos.w}px`,
          height: `${cursorPos.h}px`,
          ['--cc' as string]: cursorColor,
        }}
        aria-hidden="true"
      >
        <b>{cursorLabel}</b>
        {cursorHint && <i>{cursorHint}</i>}
      </div>

      {/* Full-Screen Laser Sweep Scanner */}
      {isScanning && (
        <div className="look-layer" aria-hidden="true">
          <div className="look-sweep" />
        </div>
      )}

      {/* Detected Bounding Boxes on Sweep */}
      {detectedBoxes.length > 0 && (
        <div className="look-layer" aria-hidden="true">
          {detectedBoxes.map(b => (
            <div
              key={b.id}
              className="look-box"
              style={{
                left: `${b.x}px`,
                top: `${b.y}px`,
                width: `${b.w}px`,
                height: `${b.h}px`,
                ['--lc' as string]: b.color,
              }}
            >
              <b>{b.label}</b>
            </div>
          ))}
        </div>
      )}

      {/* Look Toast Notification */}
      <div className={`look-toast ${toastMessage ? 'show' : ''}`} role="status">
        {toastMessage}
      </div>
    </>
  );
}

