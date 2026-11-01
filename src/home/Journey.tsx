import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { gsap } from 'gsap';
import { BenchmarkRunner } from '../services/BenchmarkRunner';
import { chapters, lessons } from '../data/lessons';
import { ByteGlyph, CheckIcon, PixelGlyph } from './brand';

type UpdateFn = (state: Record<string, unknown>, keys: Record<string, boolean>, dt: number, world: Record<string, unknown>) => void;

export const BEATS = ['STEPS', 'GUIDES', 'ERRORS', 'WINS'];

const TOTAL_XP = lessons.reduce((sum, l) => sum + l.xp, 0);

// Lines are the app's own mentor dialogue, not invented copy.
const PIXEL_LINE = lessons[0]?.mentorLines.find((l) => l.speaker === 'mentorA')?.text ?? '';
const BYTE_LINE =
  lessons.find((l) => l.id === 'gravity')?.pieces?.[1]?.mentorLines.find((l) => l.speaker === 'mentorB')?.text ?? '';

function useTypewriter(text: string, active: boolean, instant: boolean) {
  const [shown, setShown] = useState(instant ? text : '');
  useEffect(() => {
    if (!active) return;
    if (instant) {
      setShown(text);
      return;
    }
    setShown('');
    let i = 0;
    const id = window.setInterval(() => {
      i += 1;
      setShown(text.slice(0, i));
      if (i >= text.length) window.clearInterval(id);
    }, 22);
    return () => window.clearInterval(id);
  }, [text, active, instant]);
  return shown;
}

/* Real frame-rate benchmark (the same runner Explain My Bug uses). */
const BUGGY = 'if (keys.right) state.x += 3;';
const FIXED = 'if (keys.right) state.x += 180 * dt;';

function BugDemo() {
  const [fixed, setFixed] = useState(false);
  const code = fixed ? FIXED : BUGGY;
  const result = useMemo(() => {
    try {
      const fn = new Function('state', 'keys', 'dt', 'world', `${code}\nreturn state;`) as UpdateFn;
      return BenchmarkRunner.runFrameRateBenchmark(fn, code);
    } catch {
      return null;
    }
  }, [code]);

  return (
    <div className="bb-bug">
      <div className="bb-bug-toggle" role="group" aria-label="Choose code version">
        <button type="button" className="bb-chip" aria-pressed={!fixed} onClick={() => setFixed(false)}>
          WITH THE BUG
        </button>
        <button type="button" className="bb-chip" aria-pressed={fixed} onClick={() => setFixed(true)}>
          FIXED
        </button>
      </div>
      <pre className="bb-bug-code">{code}</pre>
      {result && (
        <>
          <div className="bb-bug-rates">
            {result.rates.map((r) => (
              <div key={r.fps}>
                <span>{r.fps} FPS</span>
                <b>{r.displacement}px</b>
              </div>
            ))}
          </div>
          <p className={`bb-bug-sum ${result.passed ? 'is-pass' : 'is-fail'}`} role="status">
            {result.passed ? <CheckIcon /> : null}
            <span>{result.summary}</span>
          </p>
        </>
      )}
    </div>
  );
}

function XpCounter({ active, reduced }: { active: boolean; reduced: boolean }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!active) return;
    if (reduced) {
      setVal(TOTAL_XP);
      return;
    }
    const o = { v: 0 };
    const tw = gsap.to(o, {
      v: TOTAL_XP,
      duration: 1.6,
      ease: 'power2.out',
      onUpdate: () => setVal(Math.round(o.v)),
    });
    return () => {
      tw.kill();
    };
  }, [active, reduced]);
  return (
    <div className="bb-xp">
      <b>{val}</b>
      <span>XP across {lessons.length} lessons</span>
    </div>
  );
}

interface JourneyProps {
  beat: number;
  reduced: boolean;
  onJump: (beat: number) => void;
}

export function JourneyOverlay({ beat, reduced, onJump }: JourneyProps) {
  const pixelText = useTypewriter(PIXEL_LINE, beat === 1, reduced);
  const byteText = useTypewriter(BYTE_LINE, beat === 1, reduced);

  const dur = reduced ? 0 : 0.45;
  const anim = {
    initial: { opacity: 0, y: reduced ? 0 : 22 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: reduced ? 0 : -16 },
    transition: { duration: dur, ease: 'easeOut' as const },
  };

  return (
    <div className="bb-journey">
      <p className="bb-kicker">03 — THE JOURNEY</p>
      <div className="bb-journey-stage">
        <AnimatePresence mode="wait">
          {beat === 0 && (
            <motion.div key="b0" className="bb-beat" {...anim}>
              <h2 className="bb-h2">EVERY STEP UNLOCKS SOMETHING NEW.</h2>
              <p className="bb-p">
                {lessons.length} lessons across {chapters.length} chapters. Start with moving a sprite, finish with a boss capstone.
              </p>
              <ol className="bb-rail">
                {chapters.map((c, i) => (
                  <li key={c.id}>
                    <span>{String(i + 1).padStart(2, '0')}</span>
                    {c.title.replace(/^Chapter \d+:\s*/, '')}
                  </li>
                ))}
              </ol>
            </motion.div>
          )}
          {beat === 1 && (
            <motion.div key="b1" className="bb-beat" {...anim}>
              <h2 className="bb-h2">PIXEL &amp; BYTE</h2>
              <p className="bb-p">Your guides along the journey.</p>
              <div className="bb-talk">
                <div className="bb-talk-row bb-talk-row--pixel">
                  <PixelGlyph size={44} />
                  <div>
                    <b>PIXEL</b>
                    <p>{pixelText}</p>
                  </div>
                </div>
                <div className="bb-talk-row bb-talk-row--byte">
                  <ByteGlyph size={44} />
                  <div>
                    <b>BYTE</b>
                    <p>{byteText}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
          {beat === 2 && (
            <motion.div key="b2" className="bb-beat" {...anim}>
              <h2 className="bb-h2">ERRORS ARE NOT THE END.</h2>
              <p className="bb-p">
                Explain My Bug breaks down what went wrong, suggests a fix, and benchmarks your code at 30, 60 and 120 FPS. Try the benchmark below.
              </p>
              <BugDemo />
            </motion.div>
          )}
          {beat === 3 && (
            <motion.div key="b3" className="bb-beat" {...anim}>
              <h2 className="bb-h2">EVERY LITTLE WIN COUNTS.</h2>
              <p className="bb-p">Finish a piece, earn +25 XP. Finish a lesson, earn its full reward.</p>
              <XpCounter active={beat === 3} reduced={reduced} />
              <ul className="bb-wins">
                {lessons.map((l) => (
                  <li key={l.id}>
                    <span>{l.num}</span>
                    {l.label}
                    <b>+{l.xp} XP</b>
                  </li>
                ))}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <div className="bb-beats" role="group" aria-label="Journey steps">
        {BEATS.map((b, i) => (
          <button key={b} type="button" className="bb-beat-dot" aria-current={beat === i ? 'step' : undefined} onClick={() => onJump(i)}>
            <i />
            {b}
          </button>
        ))}
      </div>
    </div>
  );
}
