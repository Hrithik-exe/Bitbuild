import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { gsap } from 'gsap';
import { createWorld } from './world';
import type { World } from './world';
import { createStory } from './story';
import { JOURNEY_SPAN, usePrefersReducedMotion, useStoryScroll } from './useStoryScroll';
import { ArrowIcon, MenuIcon, Wordmark } from './brand';
import { Playground } from './Playground';
import { JourneyOverlay } from './Journey';
import { lessons } from '../data/lessons';
import { blipAudio } from '../services/BlipAudio';
import { authService } from '../services/AuthService';
import { AuthModal } from '../components/Auth/AuthModal';
import type { User } from '../types/lesson';
import './home.css';

const IDS = ['ch-intro', 'ch-idea', 'ch-play', 'ch-journey', 'ch-enter'];
const NAV = [
  { n: '00', t: 'INTRO' },
  { n: '01', t: 'IDEA' },
  { n: '02', t: 'PLAYGROUND' },
  { n: '03', t: 'JOURNEY' },
  { n: '04', t: 'ENTER' },
];
const IDEA_LINES = ['EVERY GREAT BUILDER STARTS SOMEWHERE.', 'WHAT IF YOU COULD LEARN BY DOING?', 'WELCOME TO BITBUILD.'];
const JUMP_J = [0.05, 0.28, 0.52, 0.86];

const vi = (i: number) => ({ '--i': i }) as CSSProperties;

function detectLite() {
  if (typeof window === 'undefined') return false;
  const nav = navigator as Navigator & { deviceMemory?: number };
  return (
    window.innerWidth <= 820 ||
    (nav.hardwareConcurrency !== undefined && nav.hardwareConcurrency <= 4) ||
    (nav.deviceMemory !== undefined && nav.deviceMemory <= 4)
  );
}

export function Home() {
  const navigate = useNavigate();
  const location = useLocation();
  const story = useRef(createStory()).current;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduced = usePrefersReducedMotion();
  const lite = useMemo(detectLite, []);
  const [ready, setReady] = useState(false);
  const [progress, setProgress] = useState(0.04);
  const [noGL, setNoGL] = useState(false);
  const [menu, setMenu] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const view = useStoryScroll(story, ready, reduced);

  /* check existing user session and URL params on mount */
  useEffect(() => {
    authService.getMe().then((existingUser) => {
      if (existingUser) setUser(existingUser);
    });

    const params = new URLSearchParams(location.search);
    if (params.has('auth')) {
      setAuthMode('login');
      setAuthOpen(true);
    }
  }, [location.search]);

  /* sound is OFF by default; restore the app's default on the way out */
  useEffect(() => {
    blipAudio.setMuted(true);
    return () => blipAudio.setMuted(false);
  }, []);

  /* lock scroll while the world loads */
  useEffect(() => {
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    window.scrollTo(0, 0);
    if (!ready) document.documentElement.style.overflow = 'hidden';
    return () => {
      document.documentElement.style.overflow = '';
    };
  }, [ready]);

  /* build the world (lazy: after first paint + fonts) */
  const lessonNodes = useMemo(
    () => lessons.map((l) => ({ id: l.id, num: l.num, label: l.label, xp: l.xp })),
    [],
  );
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let world: World | null = null;
    let cancelled = false;
    let prog = 0.04;
    const started = performance.now();
    const tick = window.setInterval(() => {
      prog = Math.min(0.88, prog + 0.05);
      setProgress(prog);
    }, 90);
    const codeLines = lessons[0].code.javascript.split('\n');
    const fonts = (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).catch(() => undefined);
    const cap = new Promise((r) => window.setTimeout(r, 1500));
    let finish = 0;
    Promise.race([fonts, cap]).then(() => {
      if (cancelled) return;
      requestAnimationFrame(() => {
        if (cancelled) return;
        world = createWorld({
          canvas,
          story,
          lessons: lessonNodes,
          codeLines,
          lite,
          reduced,
          onLost: () => setNoGL(true),
        });
        if (!world) setNoGL(true);
        const wait = Math.max(0, 1600 - (performance.now() - started));
        finish = window.setTimeout(() => {
          if (cancelled) return;
          window.clearInterval(tick);
          setProgress(1);
          setReady(true);
        }, wait);
      });
    });
    const onResize = () => world?.resize();
    window.addEventListener('resize', onResize);
    return () => {
      cancelled = true;
      window.clearInterval(tick);
      window.clearTimeout(finish);
      window.removeEventListener('resize', onResize);
      world?.dispose();
    };
  }, [story, lessonNodes, lite, reduced]);

  /* opening reveal */
  useEffect(() => {
    if (!ready) return;
    const tw = gsap.to(story, { reveal: 1, duration: reduced ? 0.01 : 3.4, ease: 'power3.out' });
    return () => {
      tw.kill();
    };
  }, [ready, reduced, story]);

  const goTo = useCallback(
    (i: number) => {
      setMenu(false);
      document.getElementById(IDS[i])?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
    },
    [reduced],
  );

  const jumpBeat = useCallback(
    (b: number) => {
      const el = document.getElementById(IDS[3]);
      if (!el) return;
      const top = el.getBoundingClientRect().top + window.scrollY;
      const span = el.offsetHeight - window.innerHeight;
      window.scrollTo({ top: top + (JUMP_J[b] / JOURNEY_SPAN) * span, behavior: reduced ? 'auto' : 'smooth' });
    },
    [reduced],
  );

  /* Auth triggers right on the homepage */
  const handleOpenLogin = () => {
    setAuthMode('login');
    setAuthOpen(true);
    setMenu(false);
  };

  const handleOpenRegister = () => {
    setAuthMode('register');
    setAuthOpen(true);
    setMenu(false);
  };

  /* Strictly gated entry: users cannot enter without logging in */
  const handleEnterApp = () => {
    if (user || authService.getToken()) {
      navigate('/app');
    } else {
      setAuthMode('login');
      setAuthOpen(true);
      setMenu(false);
    }
  };

  const handleAuthSuccess = (authenticatedUser: User) => {
    setUser(authenticatedUser);
    setAuthOpen(false);
    // Seamless entrance right after authenticating
    navigate('/app');
  };

  const handleLogout = async () => {
    await authService.logout();
    setUser(null);
  };

  return (
    <div className={`bb ${ready ? 'bb--ready' : ''} ${noGL ? 'bb--nogl' : ''}`}>
      <a className="bb-skip" href="#bb-main">
        Skip to content
      </a>
      <canvas ref={canvasRef} className="bb-canvas" aria-hidden="true" />
      <div className="bb-vignette" aria-hidden="true" />

      {/* loader */}
      <AnimatePresence>
        {!ready && (
          <motion.div
            className="bb-loader"
            role="status"
            aria-live="polite"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: reduced ? 1 : 1.04 }}
            transition={{ duration: reduced ? 0 : 0.9, ease: 'easeInOut' }}
          >
            <Wordmark />
            <div className="bb-loader-bar" aria-hidden="true">
              <i style={{ transform: `scaleX(${progress})` }} />
            </div>
            <p>LOADING THE WORLD</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* nav */}
      <header className="bb-nav">
        <button type="button" className="bb-nav-brand" onClick={() => goTo(0)} aria-label="BitBuild, back to the top">
          <Wordmark />
        </button>
        <nav className="bb-nav-links" aria-label="Chapters">
          {NAV.map((c, i) => (
            <button key={c.n} type="button" className="bb-nav-link" aria-current={view.active === i ? 'true' : undefined} onClick={() => goTo(i)}>
              <span>{c.n}</span>
              {c.t}
            </button>
          ))}
        </nav>
        <div className="bb-nav-right">
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ font: '500 12px var(--bb-mono)', color: 'var(--bb-cyan)' }}>
                {user.username}
              </span>
              <button
                type="button"
                className="bb-icon-btn"
                style={{ width: 'auto', padding: '0 8px', fontSize: '11px', color: 'var(--bb-dim)' }}
                onClick={handleLogout}
                title="Log out"
              >
                LOGOUT
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="bb-nav-signin"
              onClick={handleOpenLogin}
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}
            >
              SIGN IN
            </button>
          )}
          <button type="button" className="bb-btn bb-btn--small bb-nav-cta" onClick={handleEnterApp}>
            ENTER BITBUILD
          </button>
          <button type="button" className="bb-icon-btn bb-burger" onClick={() => setMenu((m) => !m)} aria-expanded={menu} aria-controls="bb-menu" aria-label="Menu">
            <MenuIcon open={menu} />
          </button>
        </div>
        <div className="bb-progress" aria-hidden="true">
          <i data-progress />
        </div>
      </header>

      <AnimatePresence>
        {menu && (
          <motion.div
            id="bb-menu"
            className="bb-menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduced ? 0 : 0.25 }}
          >
            {NAV.map((c, i) => (
              <button key={c.n} type="button" onClick={() => goTo(i)}>
                <span>{c.n}</span>
                {c.t}
              </button>
            ))}
            {user ? (
              <button type="button" onClick={handleLogout}>
                LOG OUT ({user.username})
              </button>
            ) : (
              <button type="button" onClick={handleOpenLogin}>
                SIGN IN
              </button>
            )}
            <button type="button" className="bb-btn bb-btn--primary" onClick={handleEnterApp}>
              ENTER BITBUILD <ArrowIcon />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <main id="bb-main" className="bb-main">
        {/* 00 — INTRODUCTION */}
        <section id={IDS[0]} data-ch="0" className="bb-ch bb-ch--intro" aria-label="Introduction">
          <div className="bb-pin" data-pin>
            <div className="bb-hero">
              <p className="bb-kicker bb-rise" style={vi(0)}>
                BITBUILD PRESENTS
              </p>
              <h1 className="bb-h1" aria-label="Code. Play. Level up.">
                <span className="bb-rise" style={vi(1)}>CODE.</span>
                <span className="bb-rise" style={vi(2)}>PLAY.</span>
                <span className="bb-rise bb-grad" style={vi(3)}>LEVEL UP.</span>
              </h1>
              <p className="bb-lede bb-rise" style={vi(4)}>
                What if learning to code felt less like studying and more like exploring?
              </p>
              <div className="bb-rise" style={vi(5)}>
                <button type="button" className="bb-btn bb-btn--primary" onClick={handleEnterApp}>
                  ENTER BITBUILD <ArrowIcon />
                </button>
              </div>
            </div>
            <div className="bb-cue bb-rise" style={vi(7)} aria-hidden="true">
              <span>SCROLL TO DISCOVER</span>
              <i />
            </div>
          </div>
        </section>

        {/* 01 — THE IDEA */}
        <section id={IDS[1]} data-ch="1" className="bb-ch bb-ch--idea" aria-label="The idea">
          <div className="bb-pin" data-pin>
            <div className="bb-idea">
              <p className="bb-kicker">01 — THE IDEA</p>
              <div className="bb-idea-lines">
                {IDEA_LINES.map((t, i) => (
                  <h2 key={t} className={`bb-idea-line ${view.ideaBeat === i ? 'is-on' : ''} ${i === 2 ? 'bb-grad' : ''}`} aria-hidden={view.ideaBeat !== i}>
                    {t}
                  </h2>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* 02 — THE PLAYGROUND */}
        <section id={IDS[2]} data-ch="2" className="bb-ch bb-ch--play" aria-label="The playground">
          <div className="bb-play">
            <p className="bb-kicker">02 — THE PLAYGROUND</p>
            <h2 className="bb-h2 bb-h2--xl">WRITE IT. RUN IT. SEE IT.</h2>
            <Playground />
          </div>
        </section>

        {/* 03 — THE JOURNEY */}
        <section id={IDS[3]} data-ch="3" className="bb-ch bb-ch--journey" aria-label="The journey">
          <div className="bb-pin" data-pin>
            <JourneyOverlay beat={view.beat} reduced={reduced} onJump={jumpBeat} />
          </div>
        </section>

        {/* 04 — ENTER BITBUILD */}
        <section id={IDS[4]} data-ch="4" className="bb-ch bb-ch--enter" aria-label="Enter BitBuild">
          <div className="bb-pin" data-pin>
            <div className={`bb-enter ${view.enterOn ? 'is-on' : ''}`}>
              <p className="bb-kicker">04 — ENTER BITBUILD</p>
              <h2 className="bb-h2 bb-h2--xl">
                YOUR JOURNEY STARTS WITH <span className="bb-grad">ONE LINE OF CODE.</span>
              </h2>
              <p className="bb-lede">You've seen what you can build. Now it's your turn.</p>
              <p className="bb-lede bb-lede--dim">Sign in or create an account to save your progress and level up.</p>
              <div className="bb-enter-cta">
                <button type="button" className="bb-btn bb-btn--primary bb-btn--big" onClick={handleEnterApp}>
                  ENTER BITBUILD <ArrowIcon />
                </button>
                {!user ? (
                  <button
                    type="button"
                    className="bb-link"
                    onClick={handleOpenRegister}
                    style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    Sign in or create an account
                  </button>
                ) : (
                  <span style={{ font: '500 13px var(--bb-mono)', color: 'var(--bb-cyan)' }}>
                    Logged in as {user.username}
                  </span>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bb-footer">
        <Wordmark />
        <nav aria-label="Footer">
          <button
            type="button"
            onClick={handleEnterApp}
            style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', font: 'inherit' }}
          >
            Open the app
          </button>
          {!user ? (
            <button
              type="button"
              onClick={handleOpenLogin}
              style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', font: 'inherit' }}
            >
              Sign in
            </button>
          ) : (
            <button
              type="button"
              onClick={handleLogout}
              style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', font: 'inherit' }}
            >
              Sign out ({user.username})
            </button>
          )}
        </nav>
        <p>Code. Play. Level up.</p>
      </footer>

      {/* Embedded Sign In & Registration Modal on Homepage */}
      <AuthModal
        isOpen={authOpen}
        onClose={() => setAuthOpen(false)}
        onAuthSuccess={handleAuthSuccess}
        initialMode={authMode}
      />
    </div>
  );
}
