import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { isTokenExpired } from '../utils/jwt';
import type { ReactNode } from 'react';

interface Props {
  permission?: string;
  children?: ReactNode;
  redirectTo?: string;
}

const ProtectedRoute = ({ children, permission, redirectTo = '/login' }: Props) => {
  const { token, hasPermission } = useAuthStore();
  const location = useLocation();

  if (!token || isTokenExpired(token)) {
    if (token) {
      setTimeout(() => useAuthStore.getState().logout(), 0);
    }
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  if (permission && !hasPermission(permission)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
