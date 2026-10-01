import React from 'react';
import { Volume2, VolumeX, Sparkles, Network, Code2, ShieldAlert } from 'lucide-react';
import type { Language } from '../types/lesson';

interface HeaderProps {
  currentXp: number;
  activeView: 'sandbox' | 'skilltree';
  setActiveView: (view: 'sandbox' | 'skilltree') => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  isMuted: boolean;
  toggleMute: () => void;
  onExplainBug: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentXp,
  activeView,
  setActiveView,
  language,
  setLanguage,
  isMuted,
  toggleMute,
  onExplainBug
}) => {
  return (
    <header className="header-container">
      <div className="header-top">
        <div className="eyebrow">
          <span className="live-dot" />
          BITBUILD — INTERACTIVE GAME CODE LAB
        </div>

        <div className="header-actions">
          <div className="xp-badge">
            <Sparkles size={14} className="xp-icon" />
            <span>{currentXp} XP</span>
          </div>

          <div className="language-selector">
            <button
              className={`lang-btn ${language === 'javascript' ? 'active' : ''}`}
              onClick={() => setLanguage('javascript')}
            >
              JS
            </button>
            <button
              className={`lang-btn ${language === 'python' ? 'active' : ''}`}
              onClick={() => setLanguage('python')}
            >
              Python
            </button>
            <button
              className={`lang-btn ${language === 'cpp' ? 'active' : ''}`}
              onClick={() => setLanguage('cpp')}
            >
              C++
            </button>
          </div>

          <button className="icon-btn" onClick={toggleMute} title={isMuted ? 'Unmute Sound' : 'Mute Sound'}>
            {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>

          <button className="explain-bug-btn" onClick={onExplainBug}>
            <ShieldAlert size={14} />
            <span>Explain My Bug</span>
          </button>
        </div>
      </div>

      <div className="header-main">
        <div>
          <h1 className="title-text">Learn game programming by editing the game</h1>
          <p className="subtitle-text">
            Every lesson is real code driving the live simulation. Change the code, hit Run ▶, and watch physics, collision, and AI behavior update instantly.
          </p>
        </div>

        <div className="view-switch">
          <button
            className={`view-btn ${activeView === 'sandbox' ? 'active' : ''}`}
            onClick={() => setActiveView('sandbox')}
          >
            <Code2 size={15} />
            <span>Sandbox Workspace</span>
          </button>
          <button
            className={`view-btn ${activeView === 'skilltree' ? 'active' : ''}`}
            onClick={() => setActiveView('skilltree')}
          >
            <Network size={15} />
            <span>Skill Tree Map</span>
          </button>
        </div>
      </div>
    </header>
  );
};
