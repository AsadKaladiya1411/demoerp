import React, { createContext, useContext, useMemo, useState, useEffect, type ReactNode } from 'react';
import { DEMO_USERS } from './login';
import { validateCredentials, saveAuthenticatedUser, loadAuthenticatedUser, clearAuthenticatedUser } from './authService';

export type Role = 'Boss' | 'Employee A' | 'Employee B' | 'Employee C' | 'Employee D';
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

export interface AppUser {
  id: string;
  name: string;
  role: Role;
}

interface AuthContextType {
  currentUser: AppUser;
  users: AppUser[];
  login: (username: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  setCurrentUserId: (userId: string) => void; // demo mode switch
  canAccess: (permission: Permission) => boolean;
  isAuthenticated: boolean;
}

const users: AppUser[] = DEMO_USERS.map(u => ({ id: u.id, name: u.name, role: u.role }));

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
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const stored = loadAuthenticatedUser();
    if (stored) {
      setCurrentUserId(stored.id);
      setCurrentUser({ id: stored.id, name: stored.name, role: stored.role });
      setIsAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    const u = users.find(x => x.id === currentUserId) || users[2];
    setCurrentUser(u);
  }, [currentUserId]);

  const login = async (username: string, password: string) => {
    const user = validateCredentials(username, password);
    if (!user) return { success: false, message: 'Invalid username or password.' };
    saveAuthenticatedUser(user);
    setCurrentUserId(user.id);
    setIsAuthenticated(true);
    return { success: true };
  };

  const logout = () => {
    clearAuthenticatedUser();
    setCurrentUserId('employee-a');
    setIsAuthenticated(false);
  };

  const setDemoCurrentUserId = (userId: string) => {
    // allow demo switching without persisting as "authenticated" session
    setCurrentUserId(userId);
  };

  const value = useMemo<AuthContextType>(() => ({
    currentUser,
    users,
    login,
    logout,
    setCurrentUserId: setDemoCurrentUserId,
    canAccess: permission => rolePermissions[currentUser.role].includes(permission),
    isAuthenticated,
  }), [currentUser, isAuthenticated]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
