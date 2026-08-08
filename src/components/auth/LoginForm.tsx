import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/context/AuthContext';

export function LoginForm() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError(null);
    setLoading(true);
    const res = await login(username.trim(), password);
    setLoading(false);
    if (!res.success) setError(res.message || 'Invalid username or password.');
    // successful login will be handled by page redirect
  };

  return (
    <form onSubmit={submit} className="w-full max-w-md rounded-lg bg-white/80 p-8 shadow-lg">
      <div className="flex flex-col items-center gap-2 mb-6">
        <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center text-primary font-black text-2xl">J</div>
        <h2 className="text-2xl font-semibold">Jolly ERP</h2>
        <p className="text-sm text-muted-foreground">Sign in to continue</p>
      </div>
      {error && <div className="mb-4 text-sm text-red-600">{error}</div>}
      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Username</label>
          <Input value={username} onChange={e => setUsername(e.target.value)} placeholder="username" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Password</label>
          <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="password" />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Signing in...' : 'Login'}</Button>
      </div>
    </form>
  );
}
