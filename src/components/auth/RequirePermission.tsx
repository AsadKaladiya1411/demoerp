import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth, type Permission } from '@/context/AuthContext';

export function RequirePermission({ permission, children }: { permission: Permission; children: React.ReactNode }) {
  const { canAccess, currentUser } = useAuth();

  if (canAccess(permission)) return <>{children}</>;

  return (
    <div className="mx-auto max-w-xl">
      <Card>
        <CardHeader>
          <CardTitle>Access Denied</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {currentUser.name} does not have permission to open this section.
          </p>
          <Button asChild>
            <Link to="/">Go to Dashboard</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
