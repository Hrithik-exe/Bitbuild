// Client Authentication & Progress Persistence Service for BitBuild
import type { User, UserProgressData } from '../types/lesson';

const TOKEN_KEY = 'bitbuild_auth_token';
const GUEST_PROGRESS_KEY = 'bitbuild_guest_progress';

class AuthService {
  private token: string | null = null;
  private currentUser: User | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem(TOKEN_KEY);
    }
  }

  public getToken(): string | null {
    return this.token;
  }

  public setToken(token: string | null) {
    this.token = token;
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem(TOKEN_KEY, token);
      } else {
        localStorage.removeItem(TOKEN_KEY);
      }
    }
  }

  public getCurrentUser(): User | null {
    return this.currentUser;
  }

  public async getMe(): Promise<User | null> {
    if (!this.token) return null;
    try {
      const res = await fetch('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${this.token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        this.currentUser = data.user;
        return data.user;
      }
      this.setToken(null);
      this.currentUser = null;
      return null;
    } catch {
      return null;
    }
  }

  public async register(username: string, email: string, password: string): Promise<{ user: User; token: string }> {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password })
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to register account');
    }
    this.setToken(data.token);
    this.currentUser = data.user;

    // Migrate any guest progress into the newly registered account
    const guestData = this.getGuestProgress();
    if (guestData && (guestData.currentXp > 0 || guestData.completedLessonIds.length > 0)) {
      await this.saveProgress(guestData);
    }

    return data;
  }

  public async login(usernameOrEmail: string, password: string): Promise<{ user: User; token: string }> {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usernameOrEmail, password })
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to log in');
    }
    this.setToken(data.token);
    this.currentUser = data.user;
    return data;
  }

  public async logout(): Promise<void> {
    if (this.token) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${this.token}` }
        });
      } catch {
        // Ignore network errors on logout
      }
    }
    this.setToken(null);
    this.currentUser = null;
  }

  public async getProgress(): Promise<UserProgressData | null> {
    if (!this.token) {
      return this.getGuestProgress();
    }
    try {
      const res = await fetch('/api/progress', {
        headers: { Authorization: `Bearer ${this.token}` }
      });
      if (res.ok) {
        const data = await res.json();
        return data.progress;
      }
      return this.getGuestProgress();
    } catch {
      return this.getGuestProgress();
    }
  }

  public async saveProgress(progress: UserProgressData): Promise<void> {
    // Always persist to local guest storage as immediate fallback
    this.saveGuestProgress(progress);

    // If authenticated, persist to SQLite database via backend
    if (this.token) {
      try {
        await fetch('/api/progress', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.token}`
          },
          body: JSON.stringify(progress)
        });
      } catch (err) {
        console.warn('[BitBuild Auth] Failed to sync progress to database:', err);
      }
    }
  }

  private getGuestProgress(): UserProgressData {
    if (typeof window === 'undefined') {
      return { currentXp: 0, completedLessonIds: [], completedPieceIds: [], currentLessonId: 'move' };
    }
    try {
      const raw = localStorage.getItem(GUEST_PROGRESS_KEY);
      if (raw) return JSON.parse(raw);
    } catch {
      // Ignore
    }
    return { currentXp: 0, completedLessonIds: [], completedPieceIds: [], currentLessonId: 'move' };
  }

  private saveGuestProgress(progress: UserProgressData) {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(GUEST_PROGRESS_KEY, JSON.stringify(progress));
    } catch {
      // Ignore
    }
  }
}

export const authService = new AuthService();

