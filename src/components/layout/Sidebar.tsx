import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { LayoutDashboard, Package, Tag, Factory, Settings, FileText, PackageOpen, ClipboardList } from 'lucide-react';
import { useAuth, type Permission } from '@/context/AuthContext';

export function Sidebar() {
  const location = useLocation();
  const { canAccess, currentUser } = useAuth();

  const defaultLinks: { name: string; href: string; icon: typeof LayoutDashboard; permission: Permission }[] = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard, permission: 'dashboard' },
    { name: 'Product Categories', href: '/masters/categories', icon: Tag, permission: 'categories' },
    { name: 'Products', href: '/masters/products', icon: Package, permission: 'products' },
    
    { name: 'Manufacturers', href: '/masters/manufacturers', icon: Factory, permission: 'manufacturers' },
    { name: 'Material Master', href: '/masters/materials', icon: Settings, permission: 'materials' },
    
    { name: 'Reports', href: '/reports', icon: FileText, permission: 'reports' },
    { name: 'Master Report', href: '/master-report', icon: FileText, permission: 'masterReport' },
  ];
  const employeeBLinks: { name: string; href: string; icon: typeof LayoutDashboard; permission: Permission }[] = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard, permission: 'dashboard' },
    { name: 'RM Requirement', href: '/employee-b/rm-requirement', icon: PackageOpen, permission: 'employeeBRm' },
    { name: 'PM Requirement', href: '/employee-b/pm-requirement', icon: ClipboardList, permission: 'employeeBPm' },
    { name: 'Reports', href: '/reports', icon: FileText, permission: 'reports' },
  ];
  const links = currentUser.role === 'Employee B' ? employeeBLinks : defaultLinks;

  return (
    <div className="flex h-screen w-64 flex-col border-r bg-card text-card-foreground">
      <div className="flex h-16 shrink-0 items-center border-b px-6">
        <span className="text-lg font-bold text-primary">Jolly ERP</span>
      </div>
      <div className="flex-1 overflow-auto py-4">
        <nav className="grid gap-1 px-4 text-sm font-medium">
          {links.filter(link => canAccess(link.permission)).map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                to={link.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary',
                  location.pathname === link.href ? 'bg-muted text-primary' : ''
                )}
              >
                <Icon className="h-4 w-4" />
                {link.name}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
