export interface DemoUser {
  id: string;
  name: string;
  role: 'Boss' | 'Employee A' | 'Employee B' | 'Employee C' | 'Employee D';
  username: string;
  password: string;
}

export const DEMO_USERS: DemoUser[] = [
  { id: 'boss-1', name: 'Sadiq Sir', role: 'Boss', username: 'admin', password: 'admin123' },
  { id: 'boss-2', name: 'Sabnam Mam', role: 'Boss', username: 'admin2', password: 'admin123' },
  { id: 'employee-a', name: 'Gokulbhai', role: 'Employee A', username: 'empa', password: 'empa123' },
  { id: 'employee-b', name: 'Parthbhai', role: 'Employee B', username: 'empb', password: 'empb123' },
  { id: 'employee-c', name: 'Yougeshbhai', role: 'Employee C', username: 'empc', password: 'empc123' },
  { id: 'employee-d', name: 'Kushalbhai', role: 'Employee D', username: 'empd', password: 'empd123' },
  { id: 'rnd-1', name: 'R&D', role: 'Employee A', username: 'rnd', password: 'rnd123' },
];
