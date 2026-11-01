import React, { useState } from 'react';
import { X, User, Lock, Mail, Eye, EyeOff, Sparkles, LogIn, UserPlus, AlertCircle, CheckCircle } from 'lucide-react';
import { authService } from '../../services/AuthService';
import type { User as UserType } from '../../types/lesson';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: UserType) => void;
  initialMode?: 'login' | 'register';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onAuthSuccess,
  initialMode = 'login'
}) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (mode === 'register') {
      if (!username || username.trim().length < 3) {
        setError('Username must be at least 3 characters');
        return;
      }
      if (!email || !email.includes('@')) {
        setError('Please enter a valid email address');
        return;
      }
      if (!password || password.length < 6) {
        setError('Password must be at least 6 characters');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }

      setIsLoading(true);
      try {
        const { user } = await authService.register(username.trim(), email.trim(), password);
        setSuccessMsg('Account created successfully! Logging in...');
        setTimeout(() => {
          onAuthSuccess(user);
          onClose();
        }, 600);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setIsLoading(false);
      }
    } else {
      if (!username) {
        setError('Please enter your username or email');
        return;
      }
      if (!password) {
        setError('Please enter your password');
        return;
      }

      setIsLoading(true);
      try {
        const { user } = await authService.login(username.trim(), password);
        setSuccessMsg('Welcome back, ' + user.username + '!');
        setTimeout(() => {
          onAuthSuccess(user);
          onClose();
        }, 500);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content auth-modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <Sparkles size={18} className="text-amber" />
            <span>{mode === 'login' ? 'Sign In to BitBuild' : 'Create BitBuild Account'}</span>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="auth-tab-row">
          <button
            type="button"
            className={`auth-tab ${mode === 'login' ? 'active' : ''}`}
            onClick={() => { setMode('login'); setError(null); }}
          >
            <LogIn size={14} />
            <span>Sign In</span>
          </button>
          <button
            type="button"
            className={`auth-tab ${mode === 'register' ? 'active' : ''}`}
            onClick={() => { setMode('register'); setError(null); }}
          >
            <UserPlus size={14} />
            <span>Register</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && (
            <div className="auth-alert error-alert">
              <AlertCircle size={15} />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="auth-alert success-alert">
              <CheckCircle size={15} />
              <span>{successMsg}</span>
            </div>
          )}

          <div className="form-group">
            <label>{mode === 'login' ? 'Username or Email' : 'Username'}</label>
            <div className="input-wrapper">
              <User size={15} className="input-icon" />
              <input
                type="text"
                placeholder={mode === 'login' ? 'e.g. alex or alex@example.com' : 'Choose a unique handle'}
                value={username}
                onChange={e => setUsername(e.target.value)}
                autoFocus
                required
              />
            </div>
          </div>

          {mode === 'register' && (
            <div className="form-group">
              <label>Email Address</label>
              <div className="input-wrapper">
                <Mail size={15} className="input-icon" />
                <input
                  type="email"
                  placeholder="name@domain.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>
          )}

          <div className="form-group">
            <label>Password</label>
            <div className="input-wrapper">
              <Lock size={15} className="input-icon" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder={mode === 'register' ? 'At least 6 characters' : 'Enter your password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="toggle-password-btn"
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {mode === 'register' && (
            <div className="form-group">
              <label>Confirm Password</label>
              <div className="input-wrapper">
                <Lock size={15} className="input-icon" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            </div>
          )}

          <div className="auth-actions">
            <button type="submit" className="btn-auth-submit" disabled={isLoading}>
              {isLoading ? (
                <span>Processing...</span>
              ) : mode === 'login' ? (
                <>
                  <LogIn size={15} />
                  <span>Sign In</span>
                </>
              ) : (
                <>
                  <UserPlus size={15} />
                  <span>Create Account</span>
                </>
              )}
            </button>
          </div>

          <div className="auth-footer-note">
            <p>
              🔒 Local SQLite persistence active. Your completed levels, badges, code drafts, and XP will be permanently saved to your account.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

