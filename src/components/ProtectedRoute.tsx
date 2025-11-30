import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';

type AppRole = 
  | 'sirket_sahibi'
  | 'genel_mudur'
  | 'muhasebe'
  | 'uretim_sefi'
  | 'teknisyen'
  | 'servis_personeli'
  | 'saha_montaj'
  | 'uretim_personeli';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: AppRole[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, loading, hasAnyRole } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (allowedRoles && !hasAnyRole(allowedRoles)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}