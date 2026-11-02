import React, { useEffect, useState, useMemo } from 'react';
import { Bot, Terminal, X, ChevronRight, ChevronLeft, Sparkles, MessageSquare } from 'lucide-react';
import type { DialogueLine } from '../../types/lesson';
import { blipAudio } from '../../services/BlipAudio';
import './floatingMentors.css';

interface FloatingMentorsProps {
  dialogueLines: DialogueLine[];
  onNextLesson?: () => void;
  onPrevLesson?: () => void;
  hasNextLesson?: boolean;
  hasPrevLesson?: boolean;
  nextLessonLabel?: string;
  prevLessonLabel?: string;
  pixelOpen?: boolean;
  byteOpen?: boolean;
  onTogglePixel?: () => void;
  onToggleByte?: () => void;
  hideAvatars?: boolean;
}

export const FloatingMentors: React.FC<FloatingMentorsProps> = ({
  dialogueLines,
  onNextLesson,
  onPrevLesson,
  hasNextLesson = false,
  hasPrevLesson = false,
  nextLessonLabel = '',
  prevLessonLabel = '',
  pixelOpen: controlledPixelOpen,
  byteOpen: controlledByteOpen,
  onTogglePixel,
  onToggleByte,
  hideAvatars = false
}) => {
  // Separate lines for Pixel (mentorA) and Byte (mentorB)
  const pixelLines = useMemo(
    () => dialogueLines.filter(l => l.speaker === 'mentorA' || !l.speaker),
    [dialogueLines]
  );
  const byteLines = useMemo(
    () => dialogueLines.filter(l => l.speaker === 'mentorB'),
    [dialogueLines]
  );

  // Fallback lines if one mentor has no specific lines for a lesson
  const activePixelLines = useMemo(
    () => (pixelLines.length > 0 ? pixelLines : [{ speaker: 'mentorA' as const, text: "Keep exploring the code! Run your changes to see the simulation react." }]),
    [pixelLines]
  );
  const activeByteLines = useMemo(
    () => (byteLines.length > 0 ? byteLines : [{ speaker: 'mentorB' as const, text: "Remember to scale movement by dt for consistent physics across frame rates." }]),
    [byteLines]
  );

  // Internal state fallback if not controlled
  const [internalPixelOpen, setInternalPixelOpen] = useState(false);
  const [internalByteOpen, setInternalByteOpen] = useState(false);

  const pixelOpen = controlledPixelOpen !== undefined ? controlledPixelOpen : internalPixelOpen;
  const byteOpen = controlledByteOpen !== undefined ? controlledByteOpen : internalByteOpen;

  const togglePixel = () => {
    if (onTogglePixel) onTogglePixel();
    else setInternalPixelOpen(prev => !prev);
  };

  const toggleByte = () => {
    if (onToggleByte) onToggleByte();
    else setInternalByteOpen(prev => !prev);
  };

  // Tip indices
  const [pixelIdx, setPixelIdx] = useState(0);
  const [byteIdx, setByteIdx] = useState(0);

  // Typewriter text
  const [pixelText, setPixelText] = useState('');
  const [byteText, setByteText] = useState('');

  // Auto-open the speaking mentor when lesson/dialogue changes
  useEffect(() => {
    setPixelIdx(0);
    setByteIdx(0);

    const firstLine = dialogueLines[0];
    if (firstLine && firstLine.speaker === 'mentorB') {
      setInternalByteOpen(true);
      setInternalPixelOpen(false);
    } else {
      setInternalPixelOpen(true);
      setInternalByteOpen(false);
    }
  }, [dialogueLines]);

  // Typewriter for Pixel
  useEffect(() => {
    const line = activePixelLines[pixelIdx];
    if (!line || !pixelOpen) {
      setPixelText(line ? line.text : '');
      return;
    }

    setPixelText('');
    let charIdx = 0;
    const interval = setInterval(() => {
      if (charIdx < line.text.length) {
        const nextChar = line.text[charIdx];
        setPixelText(prev => prev + nextChar);
        charIdx++;
        if (nextChar !== ' ') {
          blipAudio.playBlip('mentorA', line.blipPitch);
        }
      } else {
        clearInterval(interval);
      }
    }, 24);

    return () => clearInterval(interval);
  }, [pixelIdx, activePixelLines, pixelOpen]);

  // Typewriter for Byte
  useEffect(() => {
    const line = activeByteLines[byteIdx];
    if (!line || !byteOpen) {
      setByteText(line ? line.text : '');
      return;
    }

    setByteText('');
    let charIdx = 0;
    const interval = setInterval(() => {
      if (charIdx < line.text.length) {
        const nextChar = line.text[charIdx];
        setByteText(prev => prev + nextChar);
        charIdx++;
        if (nextChar !== ' ') {
          blipAudio.playBlip('mentorB', line.blipPitch);
        }
      } else {
        clearInterval(interval);
      }
    }, 26);

    return () => clearInterval(interval);
  }, [byteIdx, activeByteLines, byteOpen]);

  const nextPixelTip = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPixelIdx(prev => (prev + 1) % activePixelLines.length);
  };

  const prevPixelTip = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPixelIdx(prev => (prev - 1 + activePixelLines.length) % activePixelLines.length);
  };

  const nextByteTip = (e: React.MouseEvent) => {
    e.stopPropagation();
    setByteIdx(prev => (prev + 1) % activeByteLines.length);
  };

  const prevByteTip = (e: React.MouseEvent) => {
    e.stopPropagation();
    setByteIdx(prev => (prev - 1 + activeByteLines.length) % activeByteLines.length);
  };

  return (
    <div className={`floating-mentors-anchor ${hideAvatars ? 'avatars-hidden' : ''}`} aria-label="Mentor companions">
      {/* ── PIXEL (Top-Left Floating Character) ── */}
      <div className={`mentor-float-wrapper float-left ${pixelOpen ? 'is-speaking' : ''}`}>
        {!hideAvatars && (
          <button
            type="button"
            className="mentor-avatar-btn pixel-avatar-btn"
            onClick={togglePixel}
            title={pixelOpen ? 'Click to minimize Pixel' : 'Click to talk to Pixel!'}
            aria-expanded={pixelOpen}
          >
            <div className="character-halo pixel-halo" />
            <div className="character-bob pixel-bob">
              <div className="avatar-head pixel-head">
                <Bot size={18} className="avatar-icon pixel-icon" />
                <div className="antenna-glow" />
              </div>
              <div className="avatar-nametag pixel-tag">
                <span>PIXEL</span>
              </div>
            </div>
            {!pixelOpen && (
              <div className="mentor-alert-pill pixel-alert">
                <MessageSquare size={10} />
                <span>Tip</span>
              </div>
            )}
          </button>
        )}

        {/* Pixel's Comic Speech Bubble */}
        {pixelOpen && (
          <div className="comic-balloon comic-balloon-left">
            <div className="comic-tail comic-tail-left" />
            <div className="comic-header">
              <div className="comic-badge pixel-badge">
                <Sparkles size={11} />
                <span>PIXEL'S COMIC TIP</span>
              </div>
              <div className="comic-counter">
                {pixelIdx + 1}/{activePixelLines.length}
              </div>
              <button
                type="button"
                className="comic-close-btn"
                onClick={(e) => { e.stopPropagation(); togglePixel(); }}
                title="Minimize speech bubble"
              >
                <X size={13} />
              </button>
            </div>

            <div className="comic-body">
              <p className="comic-text">
                {pixelText}
                <span className="comic-cursor" />
              </p>
            </div>

            <div className="comic-footer">
              <div className="comic-tip-controls">
                {hasPrevLesson && onPrevLesson && (
                  <button
                    type="button"
                    className="comic-arrow-btn"
                    onClick={(e) => { e.stopPropagation(); onPrevLesson(); }}
                    title={`Previous: ${prevLessonLabel}`}
                  >
                    ←
                  </button>
                )}
                {activePixelLines.length > 1 && (
                  <>
                    <button
                      type="button"
                      className="comic-arrow-btn"
                      onClick={prevPixelTip}
                      title="Previous tip"
                    >
                      <ChevronLeft size={13} />
                    </button>
                    <button
                      type="button"
                      className="comic-next-btn"
                      onClick={nextPixelTip}
                    >
                      Next Tip <ChevronRight size={13} />
                    </button>
                  </>
                )}
                {hasNextLesson && onNextLesson && (
                  <button
                    type="button"
                    className="comic-mission-btn"
                    onClick={(e) => { e.stopPropagation(); onNextLesson(); }}
                    title={`Next: ${nextLessonLabel}`}
                  >
                    Next Mission →
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── BYTE (Top-Right Floating Character) ── */}
      <div className={`mentor-float-wrapper float-right ${byteOpen ? 'is-speaking' : ''}`}>
        {!hideAvatars && (
          <button
            type="button"
            className="mentor-avatar-btn byte-avatar-btn"
            onClick={toggleByte}
            title={byteOpen ? 'Click to minimize Byte' : 'Click to talk to Byte!'}
            aria-expanded={byteOpen}
          >
            <div className="character-halo byte-halo" />
            <div className="character-bob byte-bob">
              <div className="avatar-head byte-head">
                <Terminal size={18} className="avatar-icon byte-icon" />
                <div className="antenna-glow byte-glow" />
              </div>
              <div className="avatar-nametag byte-tag">
                <span>BYTE</span>
              </div>
            </div>
            {!byteOpen && (
              <div className="mentor-alert-pill byte-alert">
                <MessageSquare size={10} />
                <span>Advice</span>
              </div>
            )}
          </button>
        )}

        {/* Byte's Comic Speech Bubble */}
        {byteOpen && (
          <div className="comic-balloon comic-balloon-right">
            <div className="comic-tail comic-tail-right" />
            <div className="comic-header">
              <div className="comic-badge byte-badge">
                <Sparkles size={11} />
                <span>BYTE'S SYSTEMS LOG</span>
              </div>
              <div className="comic-counter">
                {byteIdx + 1}/{activeByteLines.length}
              </div>
              <button
                type="button"
                className="comic-close-btn"
                onClick={(e) => { e.stopPropagation(); toggleByte(); }}
                title="Minimize speech bubble"
              >
                <X size={13} />
              </button>
            </div>

            <div className="comic-body">
              <p className="comic-text">
                {byteText}
                <span className="comic-cursor byte-cursor" />
              </p>
            </div>

            <div className="comic-footer">
              <div className="comic-tip-controls">
                {hasPrevLesson && onPrevLesson && (
                  <button
                    type="button"
                    className="comic-arrow-btn"
                    onClick={(e) => { e.stopPropagation(); onPrevLesson(); }}
                    title={`Previous: ${prevLessonLabel}`}
                  >
                    ←
                  </button>
                )}
                {activeByteLines.length > 1 && (
                  <>
                    <button
                      type="button"
                      className="comic-arrow-btn"
                      onClick={prevByteTip}
                      title="Previous tip"
                    >
                      <ChevronLeft size={13} />
                    </button>
                    <button
                      type="button"
                      className="comic-next-btn byte-next-btn"
                      onClick={nextByteTip}
                    >
                      Next Tip <ChevronRight size={13} />
                    </button>
                  </>
                )}
                {hasNextLesson && onNextLesson && (
                  <button
                    type="button"
                    className="comic-mission-btn"
                    onClick={(e) => { e.stopPropagation(); onNextLesson(); }}
                    title={`Next: ${nextLessonLabel}`}
                  >
                    Next Mission →
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
