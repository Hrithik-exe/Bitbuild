import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { HeroCanvas } from './HeroCanvas';
import { ThreeEyeball } from './ThreeEyeball';
import { YoloMouseElements } from './YoloMouseElements';
import { Ticker } from './Ticker';
import { MiniGameCanvas, type MiniGameCanvasHandle } from './MiniGameCanvas';
import { blipAudio } from '../services/BlipAudio';
import './home.css';

/* ─────────────────────────────────────────────────────────────────
   useInView — IntersectionObserver hook for scroll reveals
   ───────────────────────────────────────────────────────────────── */
function useInView(threshold = 0.15) {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setVisible(true); obs.disconnect(); }
    }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible } as { ref: React.RefObject<HTMLElement>; visible: boolean };
}

/* ─────────────────────────────────────────────────────────────────
   Typewriter hook
   ───────────────────────────────────────────────────────────────── */
function useTypewriter(text: string, speed = 24, active = true) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);
  useEffect(() => {
    if (!active) return;
    setDisplayed('');
    setDone(false);
    let i = 0;
    const id = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) { clearInterval(id); setDone(true); }
    }, speed);
    return () => clearInterval(id);
  }, [text, speed, active]);
  return { displayed, done };
}

/* ─────────────────────────────────────────────────────────────────
   Chapter data with authentic game dev & engineering curriculum
   ───────────────────────────────────────────────────────────────── */
const CHAPTERS = [
  {
    num: '01',
    title: 'Movement & Vector Kinematics',
    desc: 'Scalar vs vector displacement, Cartesian coordinate spaces, and frame-rate independent delta time (dt).',
    xp: '+50 XP',
    completed: true,
  },
  {
    num: '02',
    title: 'Euler Physics & Jump Impulses',
    desc: 'Gravitational acceleration constants, Euler integration loops, terminal velocity caps, and ground normal reactions.',
    xp: '+75 XP',
    completed: true,
  },
  {
    num: '03',
    title: 'Spatial Collision (AABB Overlap)',
    desc: 'Axis-Aligned Bounding Box theorems, penetration restitution, coordinate clamping, and item collection volumes.',
    xp: '+75 XP',
    completed: false,
    active: true,
  },
  {
    num: '04',
    title: 'Autonomous Steering & Enemy AI',
    desc: "Craig Reynolds' steering vectors, distance estimation, predator pursuit algorithms, and dynamic state machines.",
    xp: '+100 XP',
    completed: false,
  },
];

/* ─────────────────────────────────────────────────────────────────
   The Tutorial Trap items — authentic, witty developer reality
   ───────────────────────────────────────────────────────────────── */
const HELL_ITEMS = [
  {
    num: '01',
    title: '40-Hour Video Comas',
    desc: 'Staring at an instructor typing code while your brain goes completely numb. You retain 0% the next morning.',
    icon: '💤',
  },
  {
    num: '02',
    title: 'Copy-Paste Amnesia',
    desc: "Copying StackOverflow solutions you cannot explain. It runs, but you have no clue why or how to change it.",
    icon: '📋',
  },
  {
    num: '03',
    title: 'The LeetCode Desert',
    desc: 'Inverting binary trees for hypothetical technical interviews while still not knowing how to make a character jump.',
    icon: '🌵',
  },
  {
    num: '04',
    title: 'Syntax Error Limbo',
    desc: 'Losing four hours to a missing closing bracket on line 142 because traditional terminal outputs speak in riddles.',
    icon: '🛑',
  },
  {
    num: '05',
    title: 'Imposter Spiral',
    desc: 'Wondering if real engineers are born with mechanical keyboards and superpowers that you somehow missed.',
    icon: '🌀',
  },
  {
    num: '06',
    title: 'The Infinite Restart Loop',
    desc: 'Quitting in frustration, waiting three months, buying another course, and starting over at "Hello World".',
    icon: '🔁',
  },
];

/* ─────────────────────────────────────────────────────────────────
   Preset Physics Experiments for Section 06
   ───────────────────────────────────────────────────────────────── */
interface PhysicsPreset {
  name: string;
  code: string;
  badge: string;
}

const PRESETS: PhysicsPreset[] = [
  {
    name: '🚀 Rocket Boost',
    badge: 'High Impulse',
    code: `// High vertical impulse with forward thrust
state.vx = 220;   // rapid forward velocity
state.vy = -340;  // rocket jump burst
`,
  },
  {
    name: '🛰 Zero Gravity Orbit',
    badge: 'Zero G',
    code: `// Low friction floating dynamics
state.vx = 140;   // steady coast
state.vy = -60;   // gentle float
`,
  },
  {
    name: '⚡ Hyper Pinball',
    badge: 'Elastic Bounce',
    code: `// High speed kinetic energy
state.vx = 320;   // extreme horizontal speed
state.vy = -180;  // rapid bank rebound
`,
  },
  {
    name: '🛑 Heavy Mass Damping',
    badge: 'Heavy Mass',
    code: `// Heavy inertial mass damping
state.vx = 80;    // sluggish momentum
state.vy = -120;  // heavy short hop
`,
  },
];

/* ─────────────────────────────────────────────────────────────────
   Code preview lines for Section 03
   ───────────────────────────────────────────────────────────────── */
const PREVIEW_LINES = [
  { num: '1', content: <><span className="comment">// 60 FPS deterministic game loop with delta-time</span></> },
  { num: '2', content: <><span className="kw">function</span> <span className="fn-name">update</span><span className="op">(</span><span className="kw">state</span>, <span className="kw">keys</span>, <span className="kw">dt</span>, <span className="kw">world</span><span className="op">) {'{'}</span></> },
  { num: '3', content: <><span className="op">{'  '}</span><span className="kw">if</span> <span className="op">(</span><span className="kw">keys</span><span className="op">.</span><span className="fn-name">right</span><span className="op">)</span> <span className="kw">state</span><span className="op">.</span><span className="fn-name">vx</span> <span className="op">+=</span> <span className="num-lit">140</span> <span className="op">*</span> <span className="kw">dt</span><span className="op">;</span> <span className="comment">// impulse</span></> },
  { num: '4', content: <><span className="op">{'  '}</span><span className="kw">state</span><span className="op">.</span><span className="fn-name">vy</span> <span className="op">+=</span> <span className="num-lit">450</span> <span className="op">*</span> <span className="kw">dt</span><span className="op">;</span> <span className="comment">// Euler gravity acceleration</span></> },
  { num: '5', content: <><span className="op">{'  '}</span><span className="kw">state</span><span className="op">.</span><span className="fn-name">x</span> <span className="op">+=</span> <span className="kw">state</span><span className="op">.</span><span className="fn-name">vx</span> <span className="op">*</span> <span className="kw">dt</span><span className="op">;</span> <span className="comment">// displacement</span></> },
  { num: '6', content: <><span className="op">{'  '}</span><span className="kw">state</span><span className="op">.</span><span className="fn-name">y</span> <span className="op">+=</span> <span className="kw">state</span><span className="op">.</span><span className="fn-name">vy</span> <span className="op">*</span> <span className="kw">dt</span><span className="op">;</span></> },
  { num: '7', content: <><span className="op">{'}'}</span></> },
];

/* ─────────────────────────────────────────────────────────────────
   HomePage — main component
   ───────────────────────────────────────────────────────────────── */
export function HomePage() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [activeChapter, setActiveChapter] = useState(0);
  const [soundOn, setSoundOn] = useState(false);
  const [xpAnimated, setXpAnimated] = useState(false);
  const [demoCode, setDemoCode] = useState(PRESETS[0].code);
  const [activePreset, setActivePreset] = useState(0);
  const [hasRun, setHasRun] = useState(false);
  const miniCanvasRef = useRef<MiniGameCanvasHandle>(null);

  // Section refs for chapter tracking
  const sectionRefs = useRef<(HTMLElement | null)[]>([]);

  // InView hooks for animated sections
  const hellRef = useRef<HTMLElement>(null);
  const [hellVisible, setHellVisible] = useState(false);
  const chaptersRef = useRef<HTMLElement>(null);
  const [chaptersVisible, setChaptersVisible] = useState(false);

  const { ref: bigIdeaRef, visible: bigIdeaVisible } = useInView();
  const { ref: mentorsRef, visible: mentorsVisible } = useInView(0.2);
  const { ref: tryRef, visible: tryVisible } = useInView(0.1);
  const { ref: enterRef, visible: enterVisible } = useInView(0.2);

  // Pixel & Byte typewriter dialogue
  const pixelLine = "Look, design patterns are cute, but if your player doesn't move when you tap the arrow key, you don't have a game. Multiply velocity by dt and let's go.";
  const byteLine = "Pixel brings the speed; I bring the sanity. I make sure your collisions don't tunnel through floors and your AI steering doesn't crash the heap. Let's write bulletproof logic.";
  const { displayed: pixelText } = useTypewriter(pixelLine, 20, mentorsVisible);
  const { displayed: byteText } = useTypewriter(byteLine, 20, mentorsVisible);

  // Scroll tracking
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 60);

      const sectionHeight = window.innerHeight;
      setActiveChapter(Math.min(7, Math.floor(y / sectionHeight)));

      if (hellRef.current) {
        const r = hellRef.current.getBoundingClientRect();
        if (r.top < window.innerHeight * 0.8) setHellVisible(true);
      }
      if (chaptersRef.current) {
        const r = chaptersRef.current.getBoundingClientRect();
        if (r.top < window.innerHeight * 0.85) {
          setChaptersVisible(true);
          setXpAnimated(true);
        }
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollToSection = (idx: number) => {
    sectionRefs.current[idx]?.scrollIntoView({ behavior: 'smooth' });
  };

  const toggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    if (next) {
      blipAudio.toggleMute();
      blipAudio.playBlip();
    } else {
      blipAudio.toggleMute();
    }
  };

  const handleRun = useCallback(() => {
    miniCanvasRef.current?.applyCode(demoCode);
    setHasRun(true);
    if (soundOn) blipAudio.playBlip();
  }, [demoCode, soundOn]);

  const selectPreset = (index: number) => {
    setActivePreset(index);
    setDemoCode(PRESETS[index].code);
    miniCanvasRef.current?.applyCode(PRESETS[index].code);
    setHasRun(true);
    if (soundOn) blipAudio.playBlip();
  };

  // Navigations: Guest Launch vs Auth Sign Up
  const handleLaunchGuest = () => {
    if (soundOn) blipAudio.playSuccessTone();
    navigate('/app');
  };

  const handleLaunchAuth = () => {
    if (soundOn) blipAudio.playSuccessTone();
    navigate('/app?auth=1');
  };

  const setSection = (idx: number) => (el: HTMLElement | null) => {
    sectionRefs.current[idx] = el;
  };

  return (
    <div className="hp-root" style={{ overflowY: 'auto', height: '100vh' }}>

      {/* ── YOLO Mouse Elements, HUD Cursor, Ghosts & Scanner ── */}
      <YoloMouseElements />

      {/* ── Sticky Nav ──────────────────────────────────────────── */}
      <nav className={`hp-nav ${scrolled ? 'scrolled' : ''}`}>
        <a href="/" className="hp-logo" data-yolo="logo">BITBUILD<span>.EXE</span></a>

        <div className="hp-nav-chapters">
          {['00','01','02','03','04','05','06','07'].map((n, i) => (
            <button
              key={n}
              className={`hp-chapter-dot ${activeChapter === i ? 'active' : ''}`}
              onClick={() => scrollToSection(i)}
              aria-label={`Section ${n}`}
              data-yolo={`ch${n}`}
            >
              {n}
            </button>
          ))}
        </div>

        <div className="hp-nav-controls">
          <button
            className="btn-ghost"
            style={{ padding: '6px 14px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '6px' }}
            onClick={handleLaunchAuth}
            data-yolo="auth"
            title="Sign in or register for persistent SQLite storage"
          >
            <span>🔑 SIGN IN</span>
          </button>

          <button
            className={`hp-sound-btn ${soundOn ? 'active' : ''}`}
            onClick={toggleSound}
            title={soundOn ? 'Sound: ON' : 'Sound: OFF'}
            aria-label="Toggle sound"
            data-yolo="sound"
          >
            {soundOn ? '♪' : '♩'}
          </button>
        </div>
      </nav>

      {/* ══════════════════════════════════════════════════════════
          SECTION 00 — HELLO (With 3D Following Eyeball)
          ══════════════════════════════════════════════════════════ */}
      <section
        className="hero-section"
        ref={setSection(0)}
        aria-label="Hero"
      >
        <HeroCanvas />

        <div className="hero-content">
          {/* YOLO 3D Procedural Eyeball that tracks the mouse and blinks */}
          <div className="eyeball-hero-container">
            <ThreeEyeball
              size={220}
              onPoke={() => {
                blipAudio.playBlip();
              }}
            />
          </div>

          <div className="hero-eyebrow" data-yolo="version">00 — SYSTEM BOOT / BITBUILD.EXE [PHYSICS & CODE COMPILER]</div>

          <h1 className="hero-headline" data-yolo="title">
            CODE ISN'T SYNTAX.<br />
            CODE IS <em>PHYSICS.</em>
          </h1>

          <p className="hero-sub" data-yolo="promise">
            Forget reversing linked lists on a whiteboard. Write genuine JavaScript,
            Python WASM, and C++ to command real-time velocity, survive Euler gravity,
            resolve spatial collisions, and outsmart autonomous AI steering agents.
          </p>

          {/* Engine Capability Badges */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '8px',
              marginBottom: '32px',
            }}
            data-yolo="stack"
          >
            <span className="lang-tag active">⚡ 60 FPS Engine</span>
            <span className="lang-tag">🐍 Pyodide WASM</span>
            <span className="lang-tag">⚙ C++ AST Compiler</span>
            <span className="lang-tag">💾 SQLite Progress Cloud</span>
          </div>

          <div className="hero-cta-row">
            <button className="btn-primary" onClick={handleLaunchGuest} data-yolo="button">
              LAUNCH GUEST ▶
            </button>
            <button
              className="btn-ghost"
              onClick={handleLaunchAuth}
              data-yolo="auth"
              style={{ borderColor: 'var(--hp-amber)', color: 'var(--hp-amber)' }}
            >
              SIGN UP / LOGIN 🔑
            </button>
            <button className="btn-ghost" onClick={() => scrollToSection(1)} data-yolo="button">
              HOW IT WORKS ↓
            </button>
          </div>
        </div>

        <div className="scroll-indicator" aria-hidden="true">
          <span>SCROLL</span>
          <div className="scroll-arrow" />
        </div>
      </section>

      {/* ── Ticker 1 ─────────────────────────────────────────── */}
      <Ticker />

      {/* ══════════════════════════════════════════════════════════
          SECTION 01 — THE OLD WAY (THE TUTORIAL TRAP)
          ══════════════════════════════════════════════════════════ */}
      <section
        className="old-way-section"
        ref={(el) => { setSection(1)(el); hellRef.current = el; }}
        aria-label="The tutorial trap"
      >
        <div className="old-way-inner">
          <div className="section-label" data-yolo="label">01 — THE TUTORIAL TRAP</div>

          <h2 className="old-way-headline" data-yolo="heading">
            <span className="strike">Traditional tutorials</span><br />
            trap 90% of beginners.
          </h2>

          <div className="tutorial-hell-list">
            {HELL_ITEMS.map((item, i) => (
              <div
                key={item.num}
                className={`hell-item ${hellVisible ? 'visible' : ''}`}
                style={{ transitionDelay: `${i * 0.1}s` }}
                data-yolo="hell"
              >
                <span className="hell-num">{item.num}</span>
                <div style={{ flex: 1 }}>
                  <strong style={{ color: 'var(--hp-text)', fontSize: '15px', display: 'block', marginBottom: '4px' }}>
                    {item.title}
                  </strong>
                  <span className="hell-text" style={{ fontSize: '13px', color: 'var(--hp-muted)' }}>
                    {item.desc}
                  </span>
                </div>
                <span className="hell-icon" aria-hidden="true">{item.icon}</span>
              </div>
            ))}
          </div>

          <blockquote className="big-quote" data-yolo="quote">
            "Watching someone else code is like watching someone else lift weights.<br />
            You get zero strength, unlimited boredom, and instant imposter syndrome."
          </blockquote>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          SECTION 02 — THE BIG IDEA
          ══════════════════════════════════════════════════════════ */}
      <section
        className="big-idea-section"
        ref={(el) => { setSection(2)(el); (bigIdeaRef as React.MutableRefObject<HTMLElement | null>).current = el; }}
        aria-label="The big idea"
      >
        <div className="big-idea-bg-glow" aria-hidden="true" />

        <div>
          <div className="section-label" style={{ justifyContent: 'center' }} data-yolo="label">02 — THE BIG THESIS</div>

          <p className={`big-statement fade-in-up ${bigIdeaVisible ? 'visible' : ''}`} data-yolo="shouting">
            WHAT IF CODE HAD<br />
            VELOCITY, GRAVITY &<br />
            <span className="highlight">REAL CONSEQUENCES?</span>
          </p>

          <p style={{ maxWidth: 680, margin: '24px auto 0', color: 'var(--hp-muted)', lineHeight: 1.6 }} className={`fade-in-up ${bigIdeaVisible ? 'visible' : ''}`}>
            In BitBuild, code is not an abstract assignment. It is the operating engine
            of a living world. If your vector arithmetic is flawed, your character flies into orbit.
            If your delta-time calculation is missing, your simulation falls apart on high-refresh monitors.
          </p>

          <div className={`vs-split fade-in-up ${bigIdeaVisible ? 'visible' : ''}`} style={{ transitionDelay: '0.25s' }}>
            <div className="vs-card old" data-yolo="card">
              <div className="vs-card-tag">❌ The Academic Snoozefest</div>
              <h3 className="vs-card-title">Passive Rote Memorization</h3>
              <ul className="vs-card-list">
                {['Memorize abstract definitions of pointers and loops.', 'Zero visual feedback — only dull text outputs in a console.', 'Motivation evaporates before reaching anything functional.', 'Solves arbitrary interview puzzles with no link to real software.'].map(t => (
                  <li key={t}><span className="vs-dot" />{t}</li>
                ))}
              </ul>
            </div>

            <div className="vs-divider" aria-hidden="true">VS</div>

            <div className="vs-card new" data-yolo="card">
              <div className="vs-card-tag">✦ The BitBuild Sandbox</div>
              <h3 className="vs-card-title">Active Kinetic Engineering</h3>
              <ul className="vs-card-list">
                {['Direct 60 FPS visual feedback loop with live physics.', 'Key concepts emerge naturally: dt, Euler vectors, raycasts.', 'Built-in AI Diagnostics explain *why* your simulation broke.', 'Persistent SQLite database syncs XP and unlocked skill trees.'].map(t => (
                  <li key={t}><span className="vs-dot" />{t}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── Ticker 2 (reversed) ──────────────────────────────── */}
      <Ticker reversed />

      {/* ══════════════════════════════════════════════════════════
          SECTION 03 — YOUR PLAYGROUND
          ══════════════════════════════════════════════════════════ */}
      <section
        className="playground-section"
        ref={setSection(3)}
        aria-label="Code playground"
      >
        <div className="section-label" data-yolo="label">03 — MULTI-RUNTIME PLAYGROUND</div>

        <div className="playground-header">
          <div>
            <h2 className="playground-title" data-yolo="heading">
              Real runtimes.<br />Zero toy syntax.
            </h2>
            <p style={{ color: 'var(--hp-muted)', maxWidth: 520, marginTop: 12, lineHeight: 1.6 }}>
              Switch seamlessly between V8 JavaScript, genuine Python compiled in WebAssembly via Pyodide,
              or high-performance C++ syntax trees. Executed locally inside a safe sandbox with real-time frame telemetry.
            </p>
          </div>

          <div className="lang-tags" aria-label="Supported languages">
            <span className="lang-tag active" data-yolo="badge">JavaScript (V8)</span>
            <span className="lang-tag" data-yolo="badge">Python (Pyodide WASM)</span>
            <span className="lang-tag" data-yolo="badge">C++ (AST Engine)</span>
          </div>
        </div>

        <div className="playground-split">
          {/* Left: code preview */}
          <div className="playground-panel" data-yolo="editor">
            <div className="panel-label">
              <span className="panel-dot" aria-hidden="true" />
              update.js — CODEMIRROR 6 IDE
            </div>
            <div className="code-preview" aria-label="Code example">
              {PREVIEW_LINES.map((line, i) => (
                <div
                  key={i}
                  className={`code-line ${i < 3 || (i >= 3) ? 'visible' : ''}`}
                  style={{ transitionDelay: `${i * 0.15}s` }}
                >
                  <span className="line-num">{line.num}</span>
                  <span>{line.content}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right: live mini canvas */}
          <div className="playground-panel" style={{ minHeight: 320 }} data-yolo="canvas">
            <div className="panel-label">
              <span className="panel-dot" style={{ background: 'var(--hp-teal)' }} aria-hidden="true" />
              HARDWARE-ACCELERATED CANVAS — 60 FPS
            </div>
            <div className="canvas-preview" style={{ height: 340 }}>
              <MiniGameCanvas />
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          SECTION 04 — LEVEL UP (SKILL TREE & CHAPTER PROGRESSION)
          ══════════════════════════════════════════════════════════ */}
      <section
        className="levelup-section"
        ref={(el) => { setSection(4)(el); chaptersRef.current = el; }}
        aria-label="Level up"
      >
        <div className="section-label" data-yolo="label">04 — LEVEL UP</div>

        <h2 className="levelup-headline" data-yolo="heading">
          Four arcs to mastery.<br />From vectors to autonomous AI.
        </h2>

        <div className="xp-bar-row" aria-label="XP progress" data-yolo="progress">
          <span className="xp-label">XP LEVEL 3</span>
          <div className="xp-track" role="progressbar" aria-valuenow={73} aria-valuemin={0} aria-valuemax={100}>
            <div className={`xp-fill ${xpAnimated ? 'animate' : ''}`} />
          </div>
          <span className="xp-count">365 / 500 XP</span>
        </div>

        <div className="chapter-flow" aria-label="Chapter progression">
          {CHAPTERS.map((ch, i) => (
            <div key={ch.num}>
              <div
                className={`chapter-row ${chaptersVisible ? 'visible' : ''}`}
                style={{ transitionDelay: `${i * 0.15}s` }}
              >
                <div
                  className={`chapter-node ${ch.completed ? 'completed' : ''} ${ch.active ? 'active' : ''}`}
                  aria-label={`Chapter ${ch.num}: ${ch.title}`}
                  data-yolo="chapter"
                  style={{ maxWidth: 540 }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="node-num">CHAPTER {ch.num}</span>
                    <span className="node-xp">{ch.xp}</span>
                  </div>
                  <span className="node-title">{ch.title}</span>
                  <p style={{ margin: 0, fontSize: '13px', color: 'var(--hp-muted)', lineHeight: 1.5 }}>
                    {ch.desc}
                  </p>
                  <span className="node-status" aria-hidden="true">
                    {ch.completed ? '✓' : ch.active ? '▶' : '·'}
                  </span>
                </div>

                {i < CHAPTERS.length - 1 && (
                  <div className="chapter-connector" aria-hidden="true" />
                )}
              </div>
              {i < CHAPTERS.length - 1 && (
                <div className="chapter-vconnector" aria-hidden="true" />
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          SECTION 05 — YOUR MENTORS
          ══════════════════════════════════════════════════════════ */}
      <section
        className="mentors-section"
        ref={(el) => { setSection(5)(el); (mentorsRef as React.MutableRefObject<HTMLElement | null>).current = el; }}
        aria-label="Mentors"
      >
        <div className="section-label" data-yolo="label">05 — YOUR MENTORS</div>

        <h2 className="mentors-headline" data-yolo="heading">
          Two guides.<br />Zero judgment.
        </h2>

        <div className="mentors-grid">
          <div className="mentor-card pixel" data-yolo="mentor">
            <div className="mentor-avatar" aria-hidden="true">⬡</div>
            <h3 className="mentor-name">PIXEL</h3>
            <div className="mentor-role">Kinematics · Euler Physics · Motion Vectors</div>
            <div className="mentor-dialogue" aria-live="polite">
              {pixelText}
              {mentorsVisible && pixelText.length < pixelLine.length && (
                <span className="cursor" aria-hidden="true">▋</span>
              )}
            </div>
          </div>

          <div className="mentor-card byte" data-yolo="mentor">
            <div className="mentor-avatar" aria-hidden="true">⬢</div>
            <h3 className="mentor-name">BYTE</h3>
            <div className="mentor-role">AABB Collisions · Autonomous AI · Systems</div>
            <div className="mentor-dialogue" aria-live="polite">
              {byteText}
              {mentorsVisible && byteText.length < byteLine.length && (
                <span className="cursor" aria-hidden="true">▋</span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          SECTION 06 — TRY IT (INTERACTIVE PHYSICS EXPERIMENTS)
          ══════════════════════════════════════════════════════════ */}
      <section
        className="try-section"
        ref={(el) => { setSection(6)(el); (tryRef as React.MutableRefObject<HTMLElement | null>).current = el; }}
        aria-label="Interactive test bench"
      >
        <div className="section-label" data-yolo="label">06 — LIVE EXPERIMENT BENCH</div>

        <h2 className={`try-headline fade-in-up ${tryVisible ? 'visible' : ''}`} data-yolo="heading">
          Test the physics.<br />Right in your browser.
        </h2>
        <p className={`try-sub fade-in-up ${tryVisible ? 'visible' : ''}`} style={{ transitionDelay: '0.15s' }}>
          Choose a preset below or edit velocity and gravity vectors in real time. Hit <strong>RUN</strong> to observe
          continuous Euler integration, collision restitution, and coin pickups.
        </p>

        {/* Experiment Presets */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 10,
            marginBottom: 24,
          }}
          data-yolo="presets"
        >
          {PRESETS.map((preset, idx) => (
            <button
              key={preset.name}
              onClick={() => selectPreset(idx)}
              className={`btn-ghost ${activePreset === idx ? 'active' : ''}`}
              style={{
                borderColor: activePreset === idx ? 'var(--hp-amber)' : 'var(--hp-border)',
                background: activePreset === idx ? 'rgba(240,169,78,0.12)' : 'transparent',
                color: activePreset === idx ? 'var(--hp-amber)' : 'var(--hp-text)',
                padding: '8px 16px',
                fontSize: 12,
              }}
              data-yolo="preset"
            >
              <span>{preset.name}</span>
            </button>
          ))}
        </div>

        <div className={`try-layout fade-in-up ${tryVisible ? 'visible' : ''}`} style={{ transitionDelay: '0.3s' }}>
          {/* Code editor panel */}
          <div className="try-panel" data-yolo="editor">
            <div className="try-panel-header">
              <div className="try-panel-title">
                <span className="panel-dot" aria-hidden="true" />
                kinematics.js — EDITABLE LIVE
              </div>
              <button className="run-btn" onClick={handleRun} aria-label="Run code" data-yolo="button">
                ▶ RUN CODE
              </button>
            </div>
            <div className="try-editor-area">
              <div style={{ padding: '16px' }}>
                <textarea
                  value={demoCode}
                  onChange={e => setDemoCode(e.target.value)}
                  spellCheck={false}
                  aria-label="Code editor"
                  style={{
                    width: '100%',
                    height: '320px',
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    color: '#C3E88D',
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: '13px',
                    lineHeight: 1.7,
                    resize: 'none',
                    caretColor: '#F0A94E',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Output canvas panel */}
          <div className="try-panel" data-yolo="canvas">
            <div className="try-panel-header">
              <div className="try-panel-title">
                <span className="panel-dot" style={{ background: hasRun ? 'var(--hp-teal)' : 'var(--hp-muted)' }} aria-hidden="true" />
                SIMULATION OUTPUT (HTML5 CANVAS)
              </div>
            </div>
            <div className="try-output">
              <MiniGameCanvas ref={miniCanvasRef} />
              <div className="output-status" aria-live="polite" data-yolo="status">
                {hasRun ? '● RUNNING DETERMINISTIC LOOP' : '○ READY — HIT RUN TO EXECUTE'}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Ticker 3 ─────────────────────────────────────────── */}
      <Ticker />

      {/* ══════════════════════════════════════════════════════════
          SECTION 07 — ENTER BITBUILD (LOGIN / SIGNUP REDIRECT)
          ══════════════════════════════════════════════════════════ */}
      <section
        className="enter-section"
        ref={(el) => { setSection(7)(el); (enterRef as React.MutableRefObject<HTMLElement | null>).current = el; }}
        aria-label="Enter BitBuild"
      >
        <div className="enter-bg-grid" aria-hidden="true" />

        <div className="enter-eyebrow" data-yolo="label">07 — READY FOR THE ARENA?</div>

        <h2 className="enter-headline fade-in-up" data-yolo="shouting">
          STOP WATCHING.<br />
          START <span className="amber">BUILDING.</span>
        </h2>

        <p style={{ maxWidth: 620, color: 'var(--hp-muted)', lineHeight: 1.6, marginBottom: 40 }} className="fade-in-up">
          Sign up to sync your XP to the local SQLite cloud database, unlock advanced skill nodes,
          and save custom solutions. Or jump in instantly with zero setup in guest mode.
        </p>

        {/* Dual CTA: Sign Up/Login vs Guest */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 20,
            justifyContent: 'center',
            position: 'relative',
            zIndex: 2,
          }}
        >
          {/* Sign Up / Login Redirect */}
          <button
            className={`enter-cta fade-in-up ${enterVisible ? 'visible' : ''}`}
            onClick={handleLaunchAuth}
            style={{ transitionDelay: '0.2s', background: '#F0A94E' }}
            aria-label="Sign up or log in to BitBuild"
            data-yolo="auth"
          >
            🔑 CREATE ACCOUNT / SIGN IN →
          </button>

          {/* Guest Launch */}
          <button
            className={`btn-ghost fade-in-up ${enterVisible ? 'visible' : ''}`}
            onClick={handleLaunchGuest}
            style={{
              transitionDelay: '0.3s',
              padding: '22px 36px',
              fontSize: '16px',
              fontWeight: 700,
              fontFamily: "'Space Grotesk', sans-serif",
            }}
            aria-label="Launch guest session"
            data-yolo="button"
          >
            ⚡ INSTANT PLAY (GUEST) ▶
          </button>
        </div>

        {/* Platform Guarantees */}
        <div
          style={{
            marginTop: 48,
            display: 'flex',
            flexWrap: 'wrap',
            gap: 24,
            justifyContent: 'center',
            color: 'var(--hp-muted)',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '11px',
            position: 'relative',
            zIndex: 2,
          }}
          data-yolo="guarantees"
        >
          <span>✓ Persistent SQLite XP Database</span>
          <span>✓ Built-in AI Bug Diagnostics</span>
          <span>✓ Zero Installs or Setup</span>
          <span>✓ Full Python, C++ & JS Runtimes</span>
        </div>

        <div
          style={{
            position: 'absolute',
            bottom: 24, left: 0, right: 0,
            display: 'flex',
            justifyContent: 'center',
            gap: 24,
          }}
          aria-hidden="true"
        >
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: '0.2em', color: 'var(--hp-muted)', textTransform: 'uppercase' }}>
            BITBUILD.EXE · VERSION 1.0 · REVOLUTIONARY CODE LEARNING
          </span>
        </div>
      </section>
    </div>
  );
}
