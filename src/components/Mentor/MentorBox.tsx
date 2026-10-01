import React, { useEffect, useState } from 'react';
import { Bot, Terminal } from 'lucide-react';
import type { DialogueLine } from '../../types/lesson';
import { blipAudio } from '../../services/BlipAudio';

interface MentorBoxProps {
  dialogueLines: DialogueLine[];
  onTrigger?: string;
  onNextLesson?: () => void;
  onPrevLesson?: () => void;
  hasNextLesson?: boolean;
  hasPrevLesson?: boolean;
  nextLessonLabel?: string;
  prevLessonLabel?: string;
}

export const MentorBox: React.FC<MentorBoxProps> = ({
  dialogueLines,
  onNextLesson,
  onPrevLesson,
  hasNextLesson = false,
  hasPrevLesson = false,
  nextLessonLabel = '',
  prevLessonLabel = ''
}) => {
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const activeLine = dialogueLines[currentLineIndex] || dialogueLines[0];

  useEffect(() => {
    if (!activeLine) return;
    setDisplayedText('');
    setIsTyping(true);
    let charIdx = 0;

    const interval = setInterval(() => {
      if (charIdx < activeLine.text.length) {
        const nextChar = activeLine.text[charIdx];
        setDisplayedText(prev => prev + nextChar);
        charIdx++;

        if (nextChar !== ' ') {
          blipAudio.playBlip(activeLine.speaker, activeLine.blipPitch);
        }
      } else {
        setIsTyping(false);
        clearInterval(interval);
      }
    }, 28);

    return () => clearInterval(interval);
  }, [activeLine, currentLineIndex]);

  const nextDialogue = () => {
    if (currentLineIndex < dialogueLines.length - 1) {
      setCurrentLineIndex(prev => prev + 1);
    } else {
      setCurrentLineIndex(0);
    }
  };

  if (!activeLine) return null;

  const isPixel = activeLine.speaker === 'mentorA';

  return (
    <div className={`mentor-box ${isPixel ? 'speaker-pixel' : 'speaker-byte'}`}>
      <div className="mentor-header">
        <div className="mentor-avatar">
          {isPixel ? <Bot size={16} className="icon-pixel" /> : <Terminal size={16} className="icon-byte" />}
        </div>
        <div className="mentor-info">
          <span className="mentor-name">{isPixel ? 'Mentor Pixel' : 'Mentor Byte'}</span>
          <span className="mentor-role">{isPixel ? 'Game Physics Mentor' : 'Systems & AI Mentor'}</span>
        </div>

        {/* Inline navigation in mentor header */}
        <div className="mentor-step-nav">
          {hasPrevLesson && (
            <button className="btn-step-prev" onClick={onPrevLesson} title={`Previous: ${prevLessonLabel}`}>
              ← {prevLessonLabel}
            </button>
          )}
          {dialogueLines.length > 1 && (
            <button className="btn-next-dialogue" onClick={nextDialogue}>
              Next Tip ({currentLineIndex + 1}/{dialogueLines.length})
            </button>
          )}
          {hasNextLesson && (
            <button className="btn-step-next" onClick={onNextLesson} title={`Next: ${nextLessonLabel}`}>
              Next: {nextLessonLabel} →
            </button>
          )}
        </div>
      </div>

      <div className="mentor-body">
        <p className="typewriter-text">
          {displayedText}
          {isTyping && <span className="cursor-blink">|</span>}
        </p>
      </div>
    </div>
  );
};
