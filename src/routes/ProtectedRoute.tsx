import {
  Navigate,
  Outlet,
} from 'react-router-dom';

import { useAuth } from '@/hooks/useAuth';

import {
  hasPermission,
} from '@/config/permissions';

import type {
  Permission,
} from '@/config/permissions';

import { PATHS } from './paths';

interface ProtectedRouteProps {
  permission?: Permission;
}

export default function ProtectedRoute({
  permission,
}: ProtectedRouteProps) {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return (
      <Navigate
        to={PATHS.LOGIN}
        replace
      />
    );
  }

  if (
    permission &&
    !hasPermission(user.roleName, permission)
  ) {
    return (
      <Navigate
        to={PATHS.FORBIDDEN}
        replace
      />
    );
  }

  return <Outlet />;
}