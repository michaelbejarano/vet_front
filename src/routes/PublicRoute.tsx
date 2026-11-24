import {
  Navigate,
  Outlet,
} from 'react-router-dom';

import { useAuth } from '@/hooks/useAuth';

import { PATHS } from './paths';

export default function PublicRoute() {
  const { isAuthenticated } = useAuth();

  return isAuthenticated
    ? <Navigate to={PATHS.DASHBOARD} replace />
    : <Outlet />;
}