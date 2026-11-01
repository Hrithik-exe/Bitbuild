import { useEffect, useState } from 'react';
import type { StoryState } from './story';
import { clamp01, smooth } from './story';

export interface StoryView {
  /** index of the chapter currently on screen (0..4) */
  active: number;
  /** which of the three Idea lines is showing */
  ideaBeat: number;
  /** which of the four Journey beats is showing */
  beat: number;
  /** closing chapter copy visible */
  enterOn: boolean;
}

export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() =>
    typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false,
  );
  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const on = () => setReduced(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return reduced;
}

/** Journey beat thresholds along story.j (camera path parameter). */
export const BEAT_J = [0, 0.2, 0.4, 0.66];
/** Share of the Journey section's scroll range used by the camera path. */
export const JOURNEY_SPAN = 0.82;

/**
 * Reads the DOM sections ([data-ch]) on scroll and writes continuous story
 * values into the shared `story` object the 3D world reads every frame.
 * React state only changes when a discrete beat changes.
 */
export function useStoryScroll(story: StoryState, enabled: boolean, reduced: boolean): StoryView {
  const [view, setView] = useState<StoryView>({ active: 0, ideaBeat: 0, beat: 0, enterOn: false });

  useEffect(() => {
    if (!enabled) return;
    let queued = false;
    let raf = 0;
    let burstArmed = true;

    const compute = () => {
      queued = false;
      const vh = window.innerHeight;
      const els = Array.from(document.querySelectorAll<HTMLElement>('[data-ch]'));
      let active = 0;
      let p = 0;
      let ideaLocal = 0;
      let journeyLocal = 0;
      let enterLocal = 0;

      els.forEach((el, i) => {
        const r = el.getBoundingClientRect();
        const span = Math.max(1, r.height - vh);
        const local = clamp01(-r.top / span);
        if (r.top <= 1) {
          active = i;
          p = i + local;
        }
        if (i === 1) ideaLocal = local;
        if (i === 3) journeyLocal = local;
        if (i === 4) enterLocal = local;

        const inner = el.querySelector<HTMLElement>('[data-pin]');
        if (inner) {
          const fin = i === 0 ? 1 : smooth(local / 0.1);
          const fout = i === els.length - 1 ? 1 : 1 - smooth((local - 0.74) / 0.2);
          const op = Math.min(fin, fout);
          inner.style.opacity = op.toFixed(3);
          inner.style.visibility = op < 0.01 ? 'hidden' : 'visible';
          inner.style.pointerEvents = op > 0.25 ? 'auto' : 'none';
          if (!reduced) {
            const dy = (1 - fin) * 28 - (1 - fout) * 28;
            inner.style.transform = `translate3d(0, ${dy.toFixed(1)}px, 0)`;
          } else {
            inner.style.transform = 'none';
          }
        }
      });

      const idea = clamp01(ideaLocal / 0.8);
      const j = clamp01(journeyLocal / JOURNEY_SPAN);
      story.p = p;
      story.idea = idea;
      story.j = j;

      if (j > 0.8 && burstArmed) {
        burstArmed = false;
        story.burst += 1;
      } else if (j < 0.7) {
        burstArmed = true;
      }

      let beat = 0;
      for (let b = BEAT_J.length - 1; b >= 0; b--) {
        if (j >= BEAT_J[b]) {
          beat = b;
          break;
        }
      }
      story.beat = beat;
      const ideaBeat = idea < 0.3 ? 0 : idea < 0.62 ? 1 : 2;
      const enterOn = enterLocal > 0.24;

      const bar = document.querySelector<HTMLElement>('[data-progress]');
      if (bar) bar.style.transform = `scaleX(${clamp01(p / 5).toFixed(4)})`;

      setView((v) =>
        v.active === active && v.ideaBeat === ideaBeat && v.beat === beat && v.enterOn === enterOn
          ? v
          : { active, ideaBeat, beat, enterOn },
      );
    };

    const schedule = () => {
      if (queued) return;
      queued = true;
      raf = requestAnimationFrame(compute);
    };

    const onMove = (e: PointerEvent) => {
      story.mx = (e.clientX / window.innerWidth - 0.5) * 2;
      story.my = -(e.clientY / window.innerHeight - 0.5) * 2;
    };

    compute();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    window.addEventListener('pointermove', onMove, { passive: true });
    // layout can settle after fonts / lazy demos mount
    const settle = window.setTimeout(schedule, 400);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(settle);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      window.removeEventListener('pointermove', onMove);
    };
  }, [story, enabled, reduced]);

  return view;
}
