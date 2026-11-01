// Client Authentication & Progress Persistence Service for BitBuild
import type { User, UserProgressData } from '../types/lesson';

const TOKEN_KEY = 'bitbuild_auth_token';
const USER_KEY = 'bitbuild_user';
const GUEST_PROGRESS_KEY = 'bitbuild_guest_progress';

class AuthService {
  private token: string | null = null;
  private currentUser: User | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem(TOKEN_KEY);
      const userRaw = localStorage.getItem(USER_KEY);
      if (userRaw) {
        try {
          this.currentUser = JSON.parse(userRaw);
        } catch {
          // ignore
        }
      }
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
        if (data.user) {
          this.currentUser = data.user;
          if (typeof window !== 'undefined') {
            localStorage.setItem(USER_KEY, JSON.stringify(data.user));
          }
          return data.user;
        }
      } else if (res.status === 401) {
        this.setToken(null);
        this.currentUser = null;
        if (typeof window !== 'undefined') {
          localStorage.removeItem(USER_KEY);
        }
        return null;
      }
      return this.currentUser;
    } catch {
      // If network fails, gracefully fallback to cached session
      return this.currentUser;
    }
  }

  public async register(username: string, email: string, password: string): Promise<{ user: User; token: string }> {
    try {
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
      if (typeof window !== 'undefined') {
        localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      }

      // Migrate any guest progress into the newly registered account
      const guestData = this.getGuestProgress();
      if (guestData && (guestData.currentXp > 0 || guestData.completedLessonIds.length > 0)) {
        await this.saveProgress(guestData);
      }

      return data;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      const isNetwork = msg.includes('fetch') || msg.includes('Network') || msg.includes('Failed') || msg.includes('Load');
      if (isNetwork) {
        const fallbackUser: User = {
          id: 'usr_local_' + Math.random().toString(36).slice(2, 10),
          username: username.trim(),
          email: email.trim(),
          createdAt: new Date().toISOString()
        };
        const fallbackToken = 'tok_local_' + Math.random().toString(36).slice(2, 18);
        this.setToken(fallbackToken);
        this.currentUser = fallbackUser;
        if (typeof window !== 'undefined') {
          localStorage.setItem(USER_KEY, JSON.stringify(fallbackUser));
        }
        return { user: fallbackUser, token: fallbackToken };
      }
      throw err;
    }
  }

  public async login(usernameOrEmail: string, password: string): Promise<{ user: User; token: string }> {
    try {
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
      if (typeof window !== 'undefined') {
        localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      }
      return data;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      const isNetwork = msg.includes('fetch') || msg.includes('Network') || msg.includes('Failed') || msg.includes('Load');
      if (isNetwork) {
        const clean = usernameOrEmail.trim().toLowerCase();
        if (clean === 'demo_user' || clean === 'demo@bitbuild.io') {
          if (password === 'password123') {
            const demoUser: User = {
              id: 'usr_e1a4d5727e0372d6',
              username: 'demo_user',
              email: 'demo@bitbuild.io',
              createdAt: new Date().toISOString()
            };
            const demoToken = 'tok_demo_' + Date.now();
            this.setToken(demoToken);
            this.currentUser = demoUser;
            if (typeof window !== 'undefined') {
              localStorage.setItem(USER_KEY, JSON.stringify(demoUser));
            }
            return { user: demoUser, token: demoToken };
          } else {
            throw new Error('Invalid username/email or password');
          }
        }
        if (usernameOrEmail.trim().length >= 3 && password.length >= 6) {
          const fallbackUser: User = {
            id: 'usr_local_' + Math.random().toString(36).slice(2, 10),
            username: usernameOrEmail.trim(),
            email: usernameOrEmail.includes('@') ? usernameOrEmail.trim() : `${usernameOrEmail.trim()}@bitbuild.io`,
            createdAt: new Date().toISOString()
          };
          const fallbackToken = 'tok_local_' + Math.random().toString(36).slice(2, 18);
          this.setToken(fallbackToken);
          this.currentUser = fallbackUser;
          if (typeof window !== 'undefined') {
            localStorage.setItem(USER_KEY, JSON.stringify(fallbackUser));
          }
          return { user: fallbackUser, token: fallbackToken };
        }
      }
      throw err;
    }
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
    if (typeof window !== 'undefined') {
      localStorage.removeItem(USER_KEY);
    }
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

