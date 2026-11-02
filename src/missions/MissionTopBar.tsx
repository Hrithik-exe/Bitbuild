import React from 'react';
import { getMission } from './missionData';
import { Check, ChevronRight } from 'lucide-react';
import './missions.css';

export interface MissionTopBarProps {
  lessonId: string;
  doneIds: string[];
  rewardXp?: number;
  hasNext?: boolean;
  nextLabel?: string;
  onNext?: () => void;
  onSelectTask?: (taskId: string) => void;
  activeTaskId?: string | null;
}

function WireframeCube() {
  return (
    <div className="ms-cube-wire" aria-hidden="true">
      <svg viewBox="0 0 40 40" width="38" height="38" fill="none">
        {/* Outer Hexagon with subtle translucent violet glow */}
        <polygon
          points="20,2 37,11 37,29 20,38 3,29 3,11"
          stroke="#9333ea"
          strokeWidth="1.8"
          strokeLinejoin="round"
          fill="rgba(147, 51, 234, 0.14)"
        />
        {/* Inner Isometric Triad */}
        <line x1="20" y1="20" x2="20" y2="38" stroke="#a855f7" strokeWidth="1.6" />
        <line x1="20" y1="20" x2="3" y2="11" stroke="#a855f7" strokeWidth="1.6" />
        <line x1="20" y1="20" x2="37" y2="11" stroke="#a855f7" strokeWidth="1.6" />
        {/* Dotted depth lines */}
        <line x1="20" y1="2" x2="20" y2="20" stroke="#c084fc" strokeWidth="1.2" strokeDasharray="2 2" opacity="0.65" />
      </svg>
    </div>
  );
}

export const MissionTopBar: React.FC<MissionTopBarProps> = ({
  lessonId,
  doneIds,
  rewardXp,
  hasNext,
  nextLabel,
  onNext,
  onSelectTask,
  activeTaskId
}) => {
  const mission = getMission(lessonId);
  if (!mission) return null;

  const total = mission.tasks.length;
  const count = mission.tasks.filter((t) => doneIds.includes(t.id)).length;
  const complete = count === total;
  const currentActiveId = activeTaskId ?? mission.tasks.find((t) => !doneIds.includes(t.id))?.id ?? null;

  return (
    <header className={`ms-topbar ${complete ? 'is-complete' : ''}`}>
      <div className="ms-topbar-left">
        <WireframeCube />
        <div className="ms-topbar-info">
          <div className="ms-topbar-eyebrow">
            M{mission.code} • {mission.world}
          </div>
          <h2 className="ms-topbar-title">{mission.title}</h2>
          <p className="ms-topbar-story">{mission.story}</p>
        </div>
      </div>

      <div className="ms-topbar-right">
        <div className="ms-tasks-header">
          <span className="ms-tasks-title">Tasks ({count}/{total})</span>
          {complete && typeof rewardXp === 'number' && rewardXp > 0 && (
            <span className="ms-topbar-reward">+{rewardXp} XP</span>
          )}
          {complete && hasNext && onNext && (
            <button type="button" className="ms-topbar-next-btn" onClick={onNext}>
              <span>{nextLabel ? `Next: ${nextLabel}` : 'Next Mission'}</span>
              <ChevronRight size={13} />
            </button>
          )}
        </div>

        <div className="ms-task-pills">
          {mission.tasks.map((task) => {
            const isDone = doneIds.includes(task.id);
            const isActive = task.id === currentActiveId && !isDone;
            return (
              <button
                key={task.id}
                type="button"
                className={`ms-task-pill ${isDone ? 'is-done' : ''} ${isActive ? 'is-active' : ''}`}
                onClick={() => onSelectTask?.(task.id)}
                title={task.detail}
              >
                <span className="ms-pill-radio">
                  {isDone ? (
                    <Check size={11} className="ms-pill-check" />
                  ) : (
                    <span className="ms-pill-dot" />
                  )}
                </span>
                <span className="ms-pill-text">{task.title}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
