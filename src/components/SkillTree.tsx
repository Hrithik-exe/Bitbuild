import React from 'react';
import { Award, Lock, CheckCircle, ArrowRight, ShieldAlert } from 'lucide-react';
import type { Lesson, Chapter } from '../types/lesson';

interface SkillTreeProps {
  chapters: Chapter[];
  lessons: Lesson[];
  completedLessonIds: string[];
  currentLessonId: string;
  onSelectLesson: (lessonId: string) => void;
}

export const SkillTree: React.FC<SkillTreeProps> = ({
  chapters,
  lessons,
  completedLessonIds,
  currentLessonId,
  onSelectLesson
}) => {
  return (
    <div className="skilltree-container">
      <div className="skilltree-header">
        <h2>Skill Tree & Learning Roadmap</h2>
        <p>Progress through sequentially unlocked game development modules to master game loop physics and AI.</p>
      </div>

      <div className="chapters-grid">
        {chapters.map((chap, cIdx) => {
          const chapterLessons = lessons.filter(l => l.chapter === chap.id);
          const isCapstoneChapter = chap.lessons.includes('capstone');

          return (
            <div key={chap.id} className={`chapter-card ${isCapstoneChapter ? 'capstone-chapter' : ''}`}>
              <div className="chapter-header">
                <span className="chapter-badge">Chapter 0{cIdx + 1}</span>
                <h3>{chap.title}</h3>
                <p>{chap.description}</p>
              </div>

              <div className="nodes-list">
                {chapterLessons.map((l) => {
                  const isCompleted = completedLessonIds.includes(l.id);
                  const isCurrent = currentLessonId === l.id;
                  const isLocked = !isCompleted && !isCurrent && cIdx > 0 && !completedLessonIds.includes('move');

                  return (
                    <div
                      key={l.id}
                      className={`node-item ${isCompleted ? 'status-completed' : ''} ${isCurrent ? 'status-current' : ''} ${isLocked ? 'status-locked' : ''}`}
                      onClick={() => !isLocked && onSelectLesson(l.id)}
                    >
                      <div className="node-icon">
                        {isCompleted ? (
                          <CheckCircle size={18} className="text-success" />
                        ) : isLocked ? (
                          <Lock size={18} className="text-muted" />
                        ) : l.id === 'capstone' ? (
                          <ShieldAlert size={18} className="text-amber" />
                        ) : (
                          <Award size={18} className="text-teal" />
                        )}
                      </div>

                      <div className="node-details">
                        <div className="node-title">
                          <span className="node-num">{l.num}</span> {l.label}
                        </div>
                        <span className="node-xp">+{l.xp} XP</span>
                      </div>

                      {!isLocked && (
                        <ArrowRight size={16} className="node-arrow" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
