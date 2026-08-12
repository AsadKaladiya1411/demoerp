import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoginForm } from '@/components/auth/LoginForm';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) navigate('/', { replace: true });
  }, [isAuthenticated, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-sky-50 to-white">
      <LoginForm />
    </div>
  );
}
