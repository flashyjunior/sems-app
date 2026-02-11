import { db } from '@/lib/db';
import type { User, AuthState } from '@/types';

const STORAGE_KEY = 'sems_auth_session';
const AUTH_TOKEN_KEY = 'authToken';
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

export class AuthService {
  async login(username: string, pin: string): Promise<User | null> {
    // In production, this would validate against Supabase or backend
    // For demo, accept any non-empty PIN
    if (!pin || pin.trim().length === 0) {
      throw new Error('PIN is required');
    }

    try {
      // Call the login API endpoint
      const loginResponse = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: username.includes('@') ? username : `${username}@sems.local`,
          password: pin,
        }),
      });

      if (!loginResponse.ok) {
        const errorData = await loginResponse.json();
        throw new Error(errorData.error || 'Login failed');
      }

      const { token, user: userData } = await loginResponse.json();

      // Determine the role from the response
      const roleStr = typeof userData.role === 'string' 
        ? userData.role 
        : userData.role?.name || 'pharmacist';

      // Create user object for store
      const user: User = {
        id: userData.id,
        username: username,
        role: roleStr as any,
        email: userData.email,
        createdAt: Date.now(),
        pharmacyId: userData.pharmacyId,
        pharmacy: userData.pharmacy,
      };

      // Store session
      const session: AuthState = {
        user,
        isAuthenticated: true,
        lastLogin: Date.now(),
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
      localStorage.setItem(AUTH_TOKEN_KEY, token);
      
      return user;
    } catch (error) {
      console.error('Login failed:', error);
      return null;
    }
  }

  async logout(): Promise<void> {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {
      // ignore network errors
    }

    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(AUTH_TOKEN_KEY);
  }

  getSession(): AuthState | null {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;

    try {
      const session: AuthState = JSON.parse(stored);

      // Check session timeout
      if (session.lastLogin && Date.now() - session.lastLogin > SESSION_TIMEOUT) {
        this.logout();
        return null;
      }

      return session;
    } catch {
      return null;
    }
  }

  isAuthenticated(): boolean {
    return this.getSession()?.isAuthenticated ?? false;
  }

  getCurrentUser(): User | null {
    return this.getSession()?.user ?? null;
  }

  async requiresPinForAction(actionType: string): Promise<boolean> {
    const highRiskActions = ['delete', 'override_warning', 'bulk_edit'];
    return highRiskActions.includes(actionType);
  }

  async verifyPin(pin: string): Promise<boolean> {
    // In production, compare against hashed PIN from backend
    return pin.length >= 4;
  }
}

export const authService = new AuthService();
