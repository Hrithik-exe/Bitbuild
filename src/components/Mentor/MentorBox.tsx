import React, { useEffect, useState } from 'react';
import { Bot, Terminal, Volume2 } from 'lucide-react';
import type { DialogueLine } from '../../types/lesson';
import { blipAudio } from '../../services/BlipAudio';

interface MentorBoxProps {
  dialogueLines: DialogueLine[];
  onTrigger?: string;
}

export const MentorBox: React.FC<MentorBoxProps> = ({ dialogueLines }) => {
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

        // Trigger procedural blip audio tone per character
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
          {isPixel ? <Bot size={18} className="icon-pixel" /> : <Terminal size={18} className="icon-byte" />}
        </div>
        <div className="mentor-info">
          <span className="mentor-name">{isPixel ? 'Mentor Pixel' : 'Mentor Byte'}</span>
          <span className="mentor-role">{isPixel ? 'Game Physics Mentor' : 'Systems & AI Mentor'}</span>
        </div>

        <div className="blip-indicator">
          <Volume2 size={12} className="blip-pulse" />
          <span>WebAudio Voice Blip</span>
        </div>
      </div>

      <div className="mentor-body">
        <p className="typewriter-text">
          {displayedText}
          {isTyping && <span className="cursor-blink">|</span>}
        </p>
      </div>

      {dialogueLines.length > 1 && (
        <div className="mentor-footer">
          <span className="dialogue-counter">
            Line {currentLineIndex + 1} of {dialogueLines.length}
          </span>
          <button className="btn-next-dialogue" onClick={nextDialogue}>
            Next Tip →
          </button>
        </div>
      )}
    </div>
  );
};
