
import {
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';

import { PATHS } from './paths';

import ProtectedRoute from './ProtectedRoute';
import PublicRoute from './PublicRoute';

import { PERMISSIONS } from '@/config/permissions';
import { navigation } from '@/data/navigation';

import DashboardLayout
  from '@/components/layout/DashboardLayout';

import PlaceholderPage
  from '@/components/common/PlaceholderPage';

import LoginPage
  from '@/pages/Login/LoginPage';

import DashboardPage
  from '@/pages/Dashboard/DashboardPage';

import ForbiddenPage
  from '@/pages/Forbidden/ForbiddenPage';

import EmployeesPage
  from '@/pages/Employees/EmployeesPage';

import UsersPage
  from '@/pages/Users/UsersPage';

// Modulo de Productos
import ProductsPage
  from '@/pages/Products/ProductsPage';

// Modulo de Control de Stock
import InventoryPage
  from '@/pages/Inventory/InventoryPage';

const moduleRoutes = navigation
  .flatMap((group) => group.items)
  .filter((item) => item.path !== PATHS.DASHBOARD);

export default function AppRoutes() {
  return (
    <Routes>

      {/* Ruta principal */}

      <Route
        path={PATHS.ROOT}
        element={
          <Navigate
            to={PATHS.DASHBOARD}
            replace
          />
        }
      />

      {/* Rutas publicas */}

      <Route element={<PublicRoute />}>
        <Route
          path={PATHS.LOGIN}
          element={<LoginPage />}
        />
      </Route>

      {/* Rutas autenticadas */}

      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>

          {/* Dashboard */}

          <Route
            element={
              <ProtectedRoute
                permission={PERMISSIONS.DASHBOARD}
              />
            }
          >
            <Route
              path={PATHS.DASHBOARD}
              element={<DashboardPage />}
            />
          </Route>

          {/* Modulos del sistema */}

          {moduleRoutes.map((item) => (
            <Route
              key={item.path}
              element={
                <ProtectedRoute
                  permission={item.permission}
                />
              }
            >
              <Route
                path={item.path}
                element={
                  item.path === PATHS.USERS
                    ? <UsersPage />

                    : item.path === PATHS.EMPLOYEES
                      ? <EmployeesPage />

                      : item.path === PATHS.PRODUCTS
                        ? <ProductsPage />

                        : item.path === PATHS.INVENTORY
                          ? <InventoryPage />

                          : <PlaceholderPage title={item.label} />
                }
              />
            </Route>
          ))}

          {/* Acceso denegado */}

          <Route
            path={PATHS.FORBIDDEN}
            element={<ForbiddenPage />}
          />

        </Route>
      </Route>

      {/* Ruta desconocida */}

      <Route
        path="*"
        element={
          <Navigate
            to={PATHS.ROOT}
            replace
          />
        }
      />

    </Routes>
  );
}
