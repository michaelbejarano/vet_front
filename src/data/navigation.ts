import {
  LayoutDashboard,
  UsersRound,
  ContactRound,
  UserRound,
  PawPrint,
  CalendarDays,
  Clock,
  ClipboardList,
  Stethoscope,
  HeartPulse,
  Package,
  Warehouse,
  ShoppingCart,
  Wallet,
  HandCoins,
  ChartNoAxesCombined,
} from 'lucide-react';

import type { LucideIcon } from 'lucide-react';

import { PATHS } from '@/routes/paths';

import {
  PERMISSIONS,
} from '@/config/permissions';

import type {
  Permission,
} from '@/config/permissions';

export interface NavigationItem {
  label: string;
  path: string;
  icon: LucideIcon;
  permission: Permission;
}

export interface NavigationGroup {
  title: string;
  items: NavigationItem[];
}

export const navigation: NavigationGroup[] = [
  {
    title: 'General',
    items: [
      {
        label: 'Dashboard',
        path: PATHS.DASHBOARD,
        icon: LayoutDashboard,
        permission: PERMISSIONS.DASHBOARD,
      },
    ],
  },

  {
    title: 'Administración',
    items: [
      {
        label: 'Usuarios',
        path: PATHS.USERS,
        icon: UsersRound,
        permission: PERMISSIONS.USERS,
      },
      {
        label: 'Trabajadores',
        path: PATHS.EMPLOYEES,
        icon: ContactRound,
        permission: PERMISSIONS.EMPLOYEES,
      },
      {
        label: 'Horarios',
        path: PATHS.SCHEDULES,
        icon: Clock,
        permission: PERMISSIONS.SCHEDULES,
      },
      {
        label: 'Servicios',
        path: PATHS.SERVICES,
        icon: ClipboardList,
        permission: PERMISSIONS.SERVICES,
      },
    ],
  },

  {
    title: 'Gestión veterinaria',
    items: [
      {
        label: 'Propietarios',
        path: PATHS.OWNERS,
        icon: UserRound,
        permission: PERMISSIONS.OWNERS,
      },
      {
        label: 'Mascotas',
        path: PATHS.PETS,
        icon: PawPrint,
        permission: PERMISSIONS.PETS,
      },
      {
        label: 'Citas',
        path: PATHS.APPOINTMENTS,
        icon: CalendarDays,
        permission: PERMISSIONS.APPOINTMENTS,
      },
      {
        label: 'Atenciones',
        path: PATHS.VISITS,
        icon: Stethoscope,
        permission: PERMISSIONS.VISITS,
      },
      {
        label: 'Historial clínico',
        path: PATHS.MEDICAL_HISTORY,
        icon: HeartPulse,
        permission: PERMISSIONS.MEDICAL_HISTORY,
      },
    ],
  },

  {
    title: 'Inventario',
    items: [
      {
        label: 'Productos',
        path: PATHS.PRODUCTS,
        icon: Package,
        permission: PERMISSIONS.PRODUCTS,
      },
      {
        label: 'Control de stock',
        path: PATHS.INVENTORY,
        icon: Warehouse,
        permission: PERMISSIONS.INVENTORY,
      },
    ],
  },

  {
    title: 'Finanzas',
    items: [
      {
        label: 'Ventas',
        path: PATHS.SALES,
        icon: ShoppingCart,
        permission: PERMISSIONS.SALES,
      },
      {
        label: 'Caja',
        path: PATHS.CASH,
        icon: Wallet,
        permission: PERMISSIONS.CASH,
      },
      {
        label: 'Comisiones',
        path: PATHS.COMMISSIONS,
        icon: HandCoins,
        permission: PERMISSIONS.COMMISSIONS,
      },
    ],
  },

  {
    title: 'Análisis',
    items: [
      {
        label: 'Reportes',
        path: PATHS.REPORTS,
        icon: ChartNoAxesCombined,
        permission: PERMISSIONS.REPORTS,
      },
    ],
  },
];