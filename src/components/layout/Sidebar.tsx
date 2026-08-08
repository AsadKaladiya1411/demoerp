import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { LayoutDashboard, Package, Tag, Factory, Settings, FileText, PackageOpen, ClipboardList, Inbox, ArrowRightLeft, CornerDownLeft, Shuffle, FlaskConical, Store, BookOpen, History, CheckCircle, Microscope } from 'lucide-react';
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
    { name: 'Vendor Management', href: '/masters/vendors', icon: Store, permission: 'vendors' },
    
    { name: 'Reports', href: '/reports', icon: FileText, permission: 'reports' },
    { name: 'Master Report', href: '/master-report', icon: FileText, permission: 'masterReport' },
  ];
  const rndLinks: { name: string; href: string; icon: typeof LayoutDashboard; permission: Permission }[] = [
    { name: 'Dashboard', href: '/rnd', icon: Microscope, permission: 'rnd' },
    { name: 'Sample Inventory', href: '/rnd/sample-inventory', icon: PackageOpen, permission: 'rnd' },
    { name: 'Base Formulation', href: '/rnd/base-formulation', icon: Settings, permission: 'rnd' },
    { name: 'Trial Worksheet', href: '/rnd/trial-worksheet', icon: ClipboardList, permission: 'rnd' },
    { name: 'Trial Assessment', href: '/rnd/trial-assessment', icon: CheckCircle, permission: 'rnd' },
    { name: 'Trial History', href: '/rnd/trial-history', icon: History, permission: 'rnd' },
    { name: 'Formula Library', href: '/rnd/formula-library', icon: BookOpen, permission: 'rnd' },
    { name: 'R&D Reports', href: '/rnd/reports', icon: FileText, permission: 'rnd' },
  ];
  const employeeBLinks: { name: string; href: string; icon: typeof LayoutDashboard; permission: Permission }[] = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard, permission: 'dashboard' },
    { name: 'Vendor Management', href: '/masters/vendors', icon: Store, permission: 'vendors' },
    { name: 'RM Requirement', href: '/employee-b/rm-requirement', icon: PackageOpen, permission: 'employeeBRm' },
    { name: 'PM Requirement', href: '/employee-b/pm-requirement', icon: ClipboardList, permission: 'employeeBPm' },
    { name: 'R&D Sample Requirement', href: '/employee-b/rnd-sample-requirement', icon: PackageOpen, permission: 'employeeBSampleRequirement' },
    { name: 'Reports', href: '/reports', icon: FileText, permission: 'reports' },
    { name: 'Master Report', href: '/employee-b/master-report', icon: FileText, permission: 'employeeBMasterReport' },
  ];
  
  const employeeCLinks: { name: string; href: string; icon: typeof LayoutDashboard; permission: Permission }[] = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard, permission: 'dashboard' },
    { name: 'Vendor Management', href: '/masters/vendors', icon: Store, permission: 'vendors' },
    { name: 'Goods Receipt', href: '/employee-c/goods-receipt', icon: Inbox, permission: 'employeeCGrn' },
    { name: 'Production Issue', href: '/employee-c/production-issue', icon: ArrowRightLeft, permission: 'employeeCIssue' },
    { name: 'Production Return', href: '/employee-c/production-return', icon: CornerDownLeft, permission: 'employeeCReturn' },
    { name: 'Inventory Movement', href: '/inventory-movement', icon: Shuffle, permission: 'inventoryMovement' },
    { name: 'Material Master', href: '/masters/materials', icon: Settings, permission: 'materials' },
  ];
  const employeeDLinks: { name: string; href: string; icon: typeof LayoutDashboard; permission: Permission }[] = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard, permission: 'dashboard' },
    { name: 'Vendor Management', href: '/masters/vendors', icon: Store, permission: 'vendors' },
    { name: 'Pending Material Tests', href: '/employee-d/pending-material-tests', icon: FlaskConical, permission: 'employeeDPendingTests' },
  ];
  // Build employee A links by selecting relevant core links (Employee A permissions)
  const employeeALinkPermissions: Permission[] = ['dashboard', 'categories', 'products', 'recipes', 'assortedConfiguration', 'reports', 'masterReport'];
  const employeeALinks = defaultLinks.filter(l => employeeALinkPermissions.includes(l.permission));

  const links = currentUser.role === 'Employee B' ? employeeBLinks : currentUser.role === 'Employee C' ? employeeCLinks : currentUser.role === 'Employee D' ? employeeDLinks : defaultLinks;
  const showRndSection = currentUser.role === 'Boss' || currentUser.role === 'Employee A';

  const renderLinks = (items: { name: string; href: string; icon: typeof LayoutDashboard; permission: Permission }[]) => (
    <div className="grid gap-1">
      {items.filter(link => canAccess(link.permission)).map((link) => {
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
    </div>
  );

  return (
    <div className="flex h-screen w-64 flex-col border-r bg-card text-card-foreground">
      <div className="flex h-16 shrink-0 items-center border-b px-6">
        <span className="text-lg font-bold text-primary">Jolly ERP</span>
      </div>
      <div className="flex-1 overflow-auto py-4">
        <nav className="space-y-4 px-4 text-sm font-medium">
          {currentUser.role === 'Boss' ? (
            <>
              <div className="space-y-1">
                <div className="px-3 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Core</div>
                {renderLinks(defaultLinks)}
              </div>

              <div className="space-y-1">
                <div className="px-3 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Gokulbhai</div>
                {renderLinks(employeeALinks)}
              </div>

              <div className="space-y-1">
                <div className="px-3 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Parthbhai</div>
                {renderLinks(employeeBLinks)}
              </div>

              <div className="space-y-1">
                <div className="px-3 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Yougeshbhai</div>
                {renderLinks(employeeCLinks)}
              </div>

              <div className="space-y-1">
                <div className="px-3 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Kushalbhai</div>
                {renderLinks(employeeDLinks)}
              </div>

              {showRndSection && (
                <div className="space-y-1">
                  <div className="px-3 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Research & Development</div>
                  {renderLinks(rndLinks)}
                </div>
              )}
            </>
          ) : (
            <>
              <div className="space-y-1">
                <div className="px-3 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Core</div>
                {renderLinks(links)}
              </div>

              {showRndSection && (
                <div className="space-y-1">
                  <div className="px-3 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Research & Development</div>
                  {renderLinks(rndLinks)}
                </div>
              )}
            </>
          )}
        </nav>
      </div>
    </div>
  );
}
