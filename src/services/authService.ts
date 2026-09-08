import type { User } from '../types';

const CURRENT_USER_KEY = 'findlostpuppy_session_v1';
const USERS_KEY = 'findlostpuppy_registered_users_v1';

class AuthService {
  private users: User[] = [];
  private currentUser: User | null = null;

  constructor() {
    this.init();
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        if (e.key === CURRENT_USER_KEY) {
          try {
            this.currentUser = e.newValue ? JSON.parse(e.newValue) : null;
          } catch {
            this.currentUser = null;
          }
          window.dispatchEvent(new CustomEvent('findlostpuppy_session_updated', { detail: this.currentUser }));
        }
      });
    }
  }

  private init() {
    try {
      const storedUsers = localStorage.getItem(USERS_KEY);
      this.users = storedUsers ? JSON.parse(storedUsers) : [];

      const storedSession = localStorage.getItem(CURRENT_USER_KEY);
      this.currentUser = storedSession ? JSON.parse(storedSession) : null;
    } catch {
      this.users = [];
      this.currentUser = null;
    }
  }

  private saveUsers() {
    try {
      localStorage.setItem(USERS_KEY, JSON.stringify(this.users));
    } catch (e) {
      console.warn('Failed to save users:', e);
    }
  }

  private saveSession(user: User | null) {
    this.currentUser = user;
    try {
      if (user) {
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
      } else {
        localStorage.removeItem(CURRENT_USER_KEY);
      }
    } catch (e) {
      console.warn('Failed to persist session:', e);
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('findlostpuppy_session_updated', { detail: user }));
    }
  }

  getCurrentUser(): User | null {
    try {
      const storedSession = typeof localStorage !== 'undefined' ? localStorage.getItem(CURRENT_USER_KEY) : null;
      if (storedSession) {
        this.currentUser = JSON.parse(storedSession);
      } else {
        this.currentUser = null;
      }
    } catch {
      // Fall back to memory state
    }
    return this.currentUser;
  }

  isAuthenticated(): boolean {
    return !!this.getCurrentUser();
  }

  // Pure Email Authentication with persistent remembrance
  async loginWithEmail(email: string, name?: string): Promise<{ success: boolean; user?: User; error?: string }> {
    await new Promise((resolve) => setTimeout(resolve, 300));

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { success: false, error: 'Please enter a valid email address.' };
    }

    let user = this.users.find((u) => u.email.toLowerCase() === cleanEmail);

    if (!user) {
      const derivedName = name?.trim() || cleanEmail.split('@')[0].replace(/[^a-zA-Z]/g, ' ') || 'Pet Parent';
      const formattedName = derivedName.charAt(0).toUpperCase() + derivedName.slice(1);

      user = {
        id: `user-${Date.now()}`,
        name: formattedName,
        email: cleanEmail,
        createdAt: new Date().toISOString(),
      };

      this.users.push(user);
      this.saveUsers();
    } else if (name && name.trim()) {
      user.name = name.trim();
      this.saveUsers();
    }

    // Persist session to remember user across refreshes and visits
    this.saveSession(user);
    return { success: true, user };
  }

  logout() {
    this.saveSession(null);
  }
}

export const authService = new AuthService();
