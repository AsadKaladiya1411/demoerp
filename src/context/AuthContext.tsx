import React, { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

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
  setCurrentUserId: (userId: string) => void;
  canAccess: (permission: Permission) => boolean;
}

const users: AppUser[] = [
  { id: 'boss-1', name: 'Boss 1', role: 'Boss' },
  { id: 'boss-2', name: 'Boss 2', role: 'Boss' },
  { id: 'employee-a', name: 'Employee A', role: 'Employee A' },
  { id: 'employee-b', name: 'Employee B', role: 'Employee B' },
  { id: 'employee-c', name: 'Employee C', role: 'Employee C' },
  { id: 'employee-d', name: 'Employee D', role: 'Employee D' },
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
  const [currentUserId, setCurrentUserId] = useState('employee-a');
  const currentUser = users.find(user => user.id === currentUserId) || users[2];

  const value = useMemo<AuthContextType>(() => ({
    currentUser,
    users,
    setCurrentUserId,
    canAccess: permission => rolePermissions[currentUser.role].includes(permission),
  }), [currentUser]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
