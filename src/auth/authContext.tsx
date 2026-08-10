import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { saveAuthenticatedUser, loadAuthenticatedUser, clearAuthenticatedUser } from './authService';
import type { AppUser, Role } from './types';

export type { AppUser, Role } from './types';
export type Permission =
  | 'dashboard'
  | 'categories'
  | 'products'
  | 'recipes'
  | 'assortedConfiguration'
  | 'manufacturers'
  | 'materials'
  | 'vendors'
  | 'reports'
  | 'masterReport'
  | 'rnd'
  | 'employeeASampleInventory'
  | 'employeeBRm'
  | 'employeeBPm'
  | 'employeeBSampleRequirement'
  | 'employeeBMasterReport'
  | 'employeeCGrn'
  | 'employeeCIssue'
  | 'employeeCReturn'
  | 'inventoryMovement'
  | 'employeeDPendingTests';

interface AuthContextType {
  currentUser: AppUser;
  users: AppUser[];
  login: (username: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  setCurrentUserId: (userId: string) => void; // demo mode switch
  canAccess: (permission: Permission) => boolean;
  isAuthenticated: boolean;
  isReady: boolean;
}

const users: AppUser[] = [
  { id: 'boss-1', name: 'Sadiq Sir', role: 'Boss' },
  { id: 'boss-2', name: 'Sabnam Mam', role: 'Boss' },
  { id: 'employee-a', name: 'Gokulbhai', role: 'Employee A' },
  { id: 'employee-b', name: 'Parthbhai', role: 'Employee B' },
  { id: 'employee-c', name: 'Yougeshbhai', role: 'Employee C' },
  { id: 'employee-d', name: 'Kushalbhai', role: 'Employee D' },
  { id: 'rnd-1', name: 'R&D', role: 'Employee A' },
];

const rolePermissions: Record<Role, Permission[]> = {
  Boss: ['dashboard', 'categories', 'products', 'recipes', 'assortedConfiguration', 'manufacturers', 'materials', 'vendors', 'reports', 'masterReport', 'rnd', 'employeeASampleInventory', 'employeeBRm', 'employeeBPm', 'employeeBSampleRequirement', 'employeeBMasterReport', 'employeeCGrn', 'employeeCIssue', 'employeeCReturn', 'inventoryMovement', 'employeeDPendingTests'],
  'Employee A': ['dashboard', 'categories', 'products', 'recipes', 'assortedConfiguration', 'reports', 'masterReport', 'rnd', 'employeeASampleInventory'],
  'Employee B': ['dashboard', 'vendors', 'employeeBRm', 'employeeBPm', 'employeeBSampleRequirement', 'reports', 'employeeBMasterReport'],
  'Employee C': ['dashboard', 'vendors', 'materials', 'masterReport', 'employeeCGrn', 'employeeCIssue', 'employeeCReturn', 'inventoryMovement'],
  'Employee D': ['dashboard', 'vendors', 'employeeDPendingTests'],
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUserId, setCurrentUserId] = useState<string>('employee-a');
  const [currentUser, setCurrentUser] = useState<AppUser>(users[2]);
  const [authenticatedUser, setAuthenticatedUser] = useState<AppUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const stored = loadAuthenticatedUser();
    const restoreSession = async () => {
      if (!stored) {
        if (!cancelled) setIsReady(true);
        return;
      }
      try {
        const apiUrl = (import.meta as ImportMeta & { env: Record<string, string | undefined> }).env?.VITE_API_URL || '';
        const response = await fetch(`${apiUrl.replace(/\/$/, '')}/api/session`, { headers: { Authorization: `Bearer ${stored.token}` } });
        if (!response.ok) throw new Error('Session expired');
        const body = await response.json() as { user?: AppUser };
        if (!body.user || cancelled) return;
        setAuthenticatedUser(body.user);
        setCurrentUserId(body.user.id);
        setCurrentUser(body.user);
        setIsAuthenticated(true);
      } catch {
        clearAuthenticatedUser();
      } finally {
        if (!cancelled) setIsReady(true);
      }
    };
    void restoreSession();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const u = users.find(x => x.id === currentUserId) || users[2];
    setCurrentUser(u);
  }, [currentUserId]);

  const login = async (username: string, password: string) => {
    try {
      const apiUrl = (import.meta as ImportMeta & { env: Record<string, string | undefined> }).env?.VITE_API_URL || '';
      if (!apiUrl) return { success: false, message: 'VITE_API_URL not configured' };
      const res = await fetch(`${apiUrl.replace(/\/$/, '')}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) return { success: false, message: 'Invalid username or password.' };
      const body = await res.json() as { token?: string; user?: AppUser };
      const { token, user } = body;
      if (!user || !token) return { success: false, message: 'Login failed' };
      saveAuthenticatedUser(user, token);
      setAuthenticatedUser(user);
      setCurrentUserId(user.id);
      setCurrentUser({ id: user.id, name: user.name, role: user.role });
      setIsAuthenticated(true);
      return { success: true };
    } catch {
      return { success: false, message: 'Login failed' };
    }
  };

  const logout = () => {
    clearAuthenticatedUser();
    setAuthenticatedUser(null);
    setCurrentUserId('employee-a');
    setIsAuthenticated(false);
  };

  const setDemoCurrentUserId = (userId: string) => {
    if (authenticatedUser?.role !== 'Boss') return;
    setCurrentUserId(userId);
  };

  const availableUsers = authenticatedUser?.role === 'Boss' ? users : authenticatedUser ? [authenticatedUser] : [];

  const value: AuthContextType = {
    currentUser,
    users: availableUsers,
    login,
    logout,
    setCurrentUserId: setDemoCurrentUserId,
    canAccess: permission => (rolePermissions[currentUser.role] || []).includes(permission),
    isAuthenticated,
    isReady,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
