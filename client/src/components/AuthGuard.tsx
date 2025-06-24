import { useAuth } from '@/hooks/useAuth';
import Login from '@/pages/Login';
import LoadingSpinner from './LoadingSpinner';

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  // const { user, loading } = useAuth();

  // if (loading) {
  //   return <LoadingSpinner />;
  // }

  // if (!user) {
  //   return <Login />;
  // }

  return <>{children}</>;
}
