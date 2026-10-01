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
          BITBUILD
        </div>

        <div className="header-actions">
          <div className="xp-badge">
            <Sparkles size={13} className="xp-icon" />
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

          <div className="view-switch">
            <button
              className={`view-btn ${activeView === 'sandbox' ? 'active' : ''}`}
              onClick={() => setActiveView('sandbox')}
            >
              <Code2 size={14} />
              <span>Sandbox</span>
            </button>
            <button
              className={`view-btn ${activeView === 'skilltree' ? 'active' : ''}`}
              onClick={() => setActiveView('skilltree')}
            >
              <Network size={14} />
              <span>Skill Tree</span>
            </button>
          </div>

          <button className="icon-btn" onClick={toggleMute} title={isMuted ? 'Unmute' : 'Mute'}>
            {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
          </button>

          <button className="explain-bug-btn" onClick={onExplainBug}>
            <ShieldAlert size={13} />
            <span>Explain Bug</span>
          </button>
        </div>
      </div>
    </header>
  );
};
