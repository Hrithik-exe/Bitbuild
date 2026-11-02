import { useEffect, useRef, useState } from 'react';
import type { CSSProperties, PointerEvent as ReactPointerEvent } from 'react';
import { getMission } from './missionData';
import { blipAudio } from '../services/BlipAudio';
import './missions.css';

export interface MissionPanelProps {
  /** simulation id, the same value you pass to <GameCanvas lessonId=...> */
  lessonId: string;
  /** ids of finished tasks, from GameCanvas onMissionProgress */
  doneIds: string[];
  /** shown on the completion banner, for example 25 or 75 */
  rewardXp?: number;
  hasNext?: boolean;
  nextLabel?: string;
  onNext?: () => void;
}

const SPARKS = Array.from({ length: 8 }, (_, i) => i);

function Cube({ lit, complete }: { lit: number; complete: boolean }) {
  return (
    <div className={`ms-cube ${complete ? 'is-complete' : ''}`} aria-hidden="true">
      <div className="ms-cube-in">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <i key={i} className={`ms-face ms-f${i} ${i < lit ? 'is-lit' : ''}`} />
        ))}
      </div>
    </div>
  );
}

function Tick() {
  return (
    <svg className="ms-tick-svg" viewBox="0 0 28 28" aria-hidden="true" focusable="false">
      <circle className="ms-ring" cx="14" cy="14" r="11" />
      <path className="ms-tick" d="M8.5 14.5l4 4 7-8.5" />
    </svg>
  );
}

export function MissionPanel({ lessonId, doneIds, rewardXp, hasNext, nextLabel, onNext }: MissionPanelProps) {
  const mission = getMission(lessonId);
  const prevDone = useRef<string[]>([]);
  const prevLesson = useRef(lessonId);
  const [fresh, setFresh] = useState<string[]>([]);
  const [hintFor, setHintFor] = useState<string | null>(null);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (prevLesson.current !== lessonId) {
      prevLesson.current = lessonId;
      prevDone.current = [];
      setFresh([]);
      setHintFor(null);
    }
    const added = doneIds.filter((id) => !prevDone.current.includes(id));
    prevDone.current = doneIds;
    if (added.length > 0) {
      setFresh(added);
      blipAudio.playSuccessTone();
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setFresh([]), 1600);
    }
  }, [lessonId, doneIds]);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  if (!mission) return null;

  const total = mission.tasks.length;
  const count = mission.tasks.filter((t) => doneIds.includes(t.id)).length;
  const complete = count === total;
  const activeId = mission.tasks.find((t) => !doneIds.includes(t.id))?.id ?? null;
  const lit = complete ? 6 : Math.round((count / total) * 6);

  const tilt = (e: ReactPointerEvent<HTMLLIElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    e.currentTarget.style.setProperty('--rx', `${(-y * 7).toFixed(2)}deg`);
    e.currentTarget.style.setProperty('--ry', `${(x * 9).toFixed(2)}deg`);
  };
  const untilt = (e: ReactPointerEvent<HTMLLIElement>) => {
    e.currentTarget.style.setProperty('--rx', '0deg');
    e.currentTarget.style.setProperty('--ry', '0deg');
  };

  return (
    <aside className={`ms-panel ${complete ? 'is-complete' : ''}`} aria-label={`Mission: ${mission.title}`}>
      <header className="ms-head">
        <Cube lit={lit} complete={complete} />
        <div className="ms-head-text">
          <span className="ms-eyebrow">
            MISSION {mission.code} · {mission.world}
          </span>
          <h3>{mission.title}</h3>
        </div>
        <span className="ms-count" aria-label={`${count} of ${total} tasks done`}>
          {count}/{total}
        </span>
      </header>

      <p className="ms-story">{mission.story}</p>

      <div className="ms-bar" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={count}>
        <i style={{ width: `${(count / total) * 100}%` }} />
      </div>

      <ol className="ms-tasks">
        {mission.tasks.map((t, i) => {
          const done = doneIds.includes(t.id);
          const active = t.id === activeId;
          const isFresh = fresh.includes(t.id);
          return (
            <li
              key={t.id}
              className={`ms-task ${done ? 'is-done' : ''} ${active ? 'is-active' : ''} ${isFresh ? 'is-fresh' : ''}`}
              onPointerMove={tilt}
              onPointerLeave={untilt}
            >
              <span className="ms-check">
                <Tick />
                <span className="ms-sparks" aria-hidden="true">
                  {SPARKS.map((s) => (
                    <i key={s} style={{ ['--a' as string]: `${s * 45}deg` } as CSSProperties} />
                  ))}
                </span>
              </span>
              <div className="ms-task-body">
                <span className="ms-task-num">TASK {i + 1}</span>
                <strong>{t.title}</strong>
                {active && <p>{t.detail}</p>}
                {active && (
                  <button type="button" className="ms-hint-btn" onClick={() => setHintFor(hintFor === t.id ? null : t.id)} aria-expanded={hintFor === t.id}>
                    {hintFor === t.id ? 'HIDE HINT' : 'NEED A HINT?'}
                  </button>
                )}
                {active && hintFor === t.id && <pre className="ms-hint">{t.hint}</pre>}
              </div>
              {done && <span className="ms-stamp">DONE</span>}
              <span className="sr-only-ms">{done ? 'completed' : active ? 'current task' : 'not started'}</span>
            </li>
          );
        })}
      </ol>

      {complete && (
        <div className="ms-complete" role="status">
          <div className="ms-coin" aria-hidden="true">
            <div className="ms-coin-in">
              <svg viewBox="0 0 24 24">
                <path d="M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.6 6.6 19.5l1.2-6L3.3 9.3l6.1-.7z" />
              </svg>
            </div>
          </div>
          <div>
            <strong>MISSION COMPLETE</strong>
            {typeof rewardXp === 'number' && rewardXp > 0 && <span className="ms-xp">+{rewardXp} XP</span>}
          </div>
          {hasNext && onNext && (
            <button type="button" className="ms-next" onClick={onNext}>
              {nextLabel ? `NEXT: ${nextLabel}` : 'NEXT MISSION'}
            </button>
          )}
        </div>
      )}
    </aside>
  );
}
