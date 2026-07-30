import { User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/context/AuthContext';

export function TopNav() {
  const { currentUser, users, setCurrentUserId } = useAuth();

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b bg-card px-6">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-semibold">Manufacturing Prototype</h1>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right">
          <div className="text-sm font-medium">{currentUser.name}</div>
          <div className="text-xs text-muted-foreground">{currentUser.role}</div>
        </div>
        <Select value={currentUser.id} onValueChange={setCurrentUserId}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {users.map(user => (
              <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="ghost" size="icon" className="rounded-full">
          <User className="h-5 w-5" />
          <span className="sr-only">Profile</span>
        </Button>
      </div>
    </header>
  );
}
