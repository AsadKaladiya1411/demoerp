export type Role = 'Boss' | 'Employee A' | 'Employee B' | 'Employee C' | 'Employee D';

export interface AppUser {
  id: string;
  name: string;
  role: Role;
}
