import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopNav } from './TopNav';

export function AppLayout() {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <TopNav />
        <main className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden bg-muted/20 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
