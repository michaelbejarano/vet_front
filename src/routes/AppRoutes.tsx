
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

// ========================================
// COMPONENTES PRINCIPALES
// ========================================

import DashboardLayout
  from '@/components/layout/DashboardLayout';

import PlaceholderPage
  from '@/components/common/PlaceholderPage';

// ========================================
// PAGINAS DEL SISTEMA
// ========================================

import LoginPage
  from '@/pages/Login/LoginPage';

import DashboardPage
  from '@/pages/Dashboard/DashboardPage';

import ForbiddenPage
  from '@/pages/Forbidden/ForbiddenPage';

// ========================================
// USUARIOS Y EMPLEADOS
// ========================================

import UsersPage
  from '@/pages/Users/UsersPage';

import EmployeesPage
  from '@/pages/Employees/EmployeesPage';

// ========================================
// HORARIOS Y SERVICIOS
// ========================================

import SchedulesPage
  from '@/pages/Schedules/SchedulesPage';

import ServicesPage
  from '@/pages/Services/ServicesPage';

// ========================================
// PRODUCTOS E INVENTARIO
// ========================================

import ProductsPage
  from '@/pages/Products/ProductsPage';

import InventoryPage
  from '@/pages/Inventory/InventoryPage';

// ========================================
// PROPIETARIOS Y MASCOTAS
// ========================================

import OwnersPage
  from '@/pages/Owners/OwnersPage';

import PetsPage
  from '@/pages/Pets/PetsPage';

// ========================================
// RUTAS DINAMICAS
// ========================================

const moduleRoutes = navigation
  .flatMap((group) => group.items)
  .filter((item) => item.path !== PATHS.DASHBOARD);

// ========================================
// COMPONENTE PRINCIPAL
// ========================================

export default function AppRoutes() {
  return (
    <Routes>

      {/* ==================================
          RUTA PRINCIPAL
      ================================== */}

      <Route
        path={PATHS.ROOT}
        element={
          <Navigate
            to={PATHS.DASHBOARD}
            replace
          />
        }
      />

      {/* ==================================
          RUTAS PUBLICAS
      ================================== */}

      <Route element={<PublicRoute />}>

        <Route
          path={PATHS.LOGIN}
          element={<LoginPage />}
        />

      </Route>

      {/* ==================================
          RUTAS AUTENTICADAS
      ================================== */}

      <Route element={<ProtectedRoute />}>

        <Route element={<DashboardLayout />}>

          {/* ==============================
              DASHBOARD
          ============================== */}

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

          {/* ==============================
              MODULOS DEL SISTEMA
          ============================== */}

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

                  // USUARIOS
                  item.path === PATHS.USERS
                    ? <UsersPage />

                    // EMPLEADOS
                    : item.path === PATHS.EMPLOYEES
                      ? <EmployeesPage />

                      // HORARIOS
                      : item.path === PATHS.SCHEDULES
                        ? <SchedulesPage />

                        // SERVICIOS
                        : item.path === PATHS.SERVICES
                          ? <ServicesPage />

                          // PRODUCTOS
                          : item.path === PATHS.PRODUCTS
                            ? <ProductsPage />

                            // CONTROL DE STOCK
                            : item.path === PATHS.INVENTORY
                              ? <InventoryPage />

                              // PROPIETARIOS
                              : item.path === PATHS.OWNERS
                                ? <OwnersPage />

                                // MASCOTAS
                                : item.path === PATHS.PETS
                                  ? <PetsPage />

                                  // MODULOS PENDIENTES
                                  : <PlaceholderPage
                                    title={item.label}
                                  />
                }
              />

            </Route>

          ))}

          {/* ==============================
              ACCESO DENEGADO
          ============================== */}

          <Route
            path={PATHS.FORBIDDEN}
            element={<ForbiddenPage />}
          />

        </Route>

      </Route>

      {/* ==================================
          RUTA DESCONOCIDA
      ================================== */}

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
