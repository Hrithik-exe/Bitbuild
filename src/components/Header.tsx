import React from 'react';
import { Link } from 'react-router-dom';
import { Volume2, VolumeX, Sparkles, Network, Code2, ShieldAlert, User as UserIcon, LogOut, LogIn } from 'lucide-react';
import type { Language, User } from '../types/lesson';

interface HeaderProps {
  currentXp: number;
  activeView: 'sandbox' | 'skilltree';
  setActiveView: (view: 'sandbox' | 'skilltree') => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  isMuted: boolean;
  toggleMute: () => void;
  onExplainBug: () => void;
  user: User | null;
  onOpenAuth: () => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentXp,
  activeView,
  setActiveView,
  language,
  setLanguage,
  isMuted,
  toggleMute,
  onExplainBug,
  user,
  onOpenAuth,
  onLogout
}) => {
  return (
    <header className="header-container">
      <div className="header-top">
        <Link to="/" className="eyebrow" style={{ textDecoration: 'none', cursor: 'pointer' }} title="Return to BITBUILD.EXE Homepage">
          <span className="live-dot" />
          BITBUILD.EXE
        </Link>

        <div className="header-actions">
          {/* User Account / Auth Section */}
          {user ? (
            <div className="user-account-badge">
              <UserIcon size={13} className="user-icon" />
              <span className="user-name">{user.username}</span>
              <button className="btn-header-logout" onClick={onLogout} title="Log Out">
                <LogOut size={12} />
              </button>
            </div>
          ) : (
            <button className="btn-header-signin" onClick={onOpenAuth} title="Sign In or Register for Persistent Cloud / SQLite Storage">
              <LogIn size={13} />
              <span>Sign In</span>
            </button>
          )}

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
