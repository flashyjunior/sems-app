/**
 * Local Authentication Service
 * Uses SQLite for offline-first authentication in Tauri app
 */

import { getDatabase, hashPassword, verifyPassword } from '@/lib/tauri-db';
import type { User, AuthState } from '@/types';

const STORAGE_KEY = 'sems_auth_session';
const AUTH_TOKEN_KEY = 'authToken';
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

export class LocalAuthService {
  /**
   * Login using local SQLite database
   */
  async login(username: string, pin: string): Promise<User | null> {
    if (!pin || pin.trim().length === 0) {
      throw new Error('PIN is required');
    }

    try {
      const db = getDatabase();
      
      // Find user by email or username
      const email = username.includes('@') ? username : `${username}@sems.local`;
      const users = (await db.select<unknown>(
        'SELECT * FROM users WHERE email = ? LIMIT 1',
        [email]
      )) as {
        id: number;
        email: string;
        password: string;
        isActive: number;
        fullName: string;
        role: string;
      }[];

      if (users.length === 0) {
        throw new Error('Invalid credentials');
      }

      const user = users[0];

      if (!user.isActive) {
        throw new Error('User account is inactive');
      }

      // Verify password
      if (!verifyPassword(pin, user.password)) {
        throw new Error('Invalid credentials');
      }

      // Create user object for store
      const appUser: User = {
        id: user.id.toString(),
        username: username,
        role: (user.role || 'pharmacist') as any,
        email: user.email,
        createdAt: Date.now(),
      };

      // Generate a simple JWT-like token (demo purposes)
      const token = Buffer.from(
        JSON.stringify({
          userId: user.id,
          email: user.email,
          role: user.role,
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + 86400, // 24 hours
        })
      ).toString('base64');

      // Store session
      const session: AuthState = {
        user: appUser,
        isAuthenticated: true,
        lastLogin: Date.now(),
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
      localStorage.setItem(AUTH_TOKEN_KEY, token);

      console.log('✓ User logged in locally:', email);
      return appUser;
    } catch (error) {
      console.error('Local login failed:', error);
      throw error;
    }
  }

  /**
   * Register a new user in local database
   */
  async register(userData: {
    email: string;
    fullName: string;
    password: string;
    role?: string;
    licenseNumber?: string;
  }): Promise<User | null> {
    try {
      const db = getDatabase();
      const now = Date.now();

      // Check if user already exists
      const existing = (await db.select<unknown>(
        'SELECT id FROM users WHERE email = ? LIMIT 1',
        [userData.email]
      )) as { id: number }[];

      if (existing.length > 0) {
        throw new Error('User already exists');
      }

      // Insert new user
      await db.execute(
        `INSERT INTO users (email, fullName, password, role, licenseNumber, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          userData.email,
          userData.fullName,
          hashPassword(userData.password),
          userData.role || 'pharmacist',
          userData.licenseNumber || '',
          now,
          now,
        ]
      );

      console.log('✓ User registered:', userData.email);
      return null; // Return null to indicate user should now login
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  }

  /**
   * Logout (clear local session)
   */
  async logout(): Promise<void> {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(AUTH_TOKEN_KEY);
  }

  /**
   * Get current session from localStorage
   */
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

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.getSession()?.isAuthenticated ?? false;
  }

  /**
   * Get current user
   */
  getCurrentUser(): User | null {
    return this.getSession()?.user ?? null;
  }
}

export const localAuthService = new LocalAuthService();
