import { Navigate, Outlet } from 'react-router-dom';
import type { UserRole } from '@drone/shared';
import { useAuthStore } from '../features/auth/authStore';

export function ProtectedRoute({ allow }: { allow: UserRole[] }) {
  const user = useAuthStore((s) => s.user);

  if (!user) return <Navigate to="/login" replace />;
  if (!allow.includes(user.role)) return <Navigate to="/" replace />;
  return <Outlet />;
}
