import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import type { ReactNode } from 'react';

interface Props {
  permission?: string;
  children?: ReactNode;
  redirectTo?: string;
}

const ProtectedRoute = ({ children, redirectTo = '/login' }: Props) => {
  const { token } = useAuthStore();
  const location = useLocation();

  if (!token) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
