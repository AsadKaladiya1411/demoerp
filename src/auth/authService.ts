import { DEMO_USERS } from './login';
import type { DemoUser } from './login';

const STORAGE_KEY = 'jolly_auth_user';

export function findUserByUsername(username: string): DemoUser | undefined {
  return DEMO_USERS.find(u => u.username.toLowerCase() === username.toLowerCase());
}

export function validateCredentials(username: string, password: string): DemoUser | null {
  const user = findUserByUsername(username);
  if (!user) return null;
  return user.password === password ? user : null;
}

export function saveAuthenticatedUser(user: DemoUser) {
  // store minimal info
  const payload = { id: user.id, name: user.name, role: user.role };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

export function loadAuthenticatedUser(): { id: string; name: string; role: DemoUser['role'] } | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearAuthenticatedUser() {
  localStorage.removeItem(STORAGE_KEY);
}
