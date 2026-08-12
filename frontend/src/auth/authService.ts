import type { AppUser, Role } from './types';

const STORAGE_KEY = 'jolly_auth_user';

export type StoredSession = AppUser & { token: string };

const roles = new Set<Role>(['Boss', 'Employee A', 'Employee B', 'Employee C', 'Employee D']);

export function saveAuthenticatedUser(user: AppUser, token: string) {
  const payload = { id: user.id, name: user.name, role: user.role, token };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

export function loadAuthenticatedUser(): StoredSession | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as Partial<StoredSession>;
    if (!value.id || !value.name || !value.token || !value.role || !roles.has(value.role)) return null;
    return value as StoredSession;
  } catch {
    return null;
  }
}

export function clearAuthenticatedUser() {
  localStorage.removeItem(STORAGE_KEY);
}
