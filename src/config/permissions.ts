import { ROLES } from './roles';
import type { Role } from './roles';

export const PERMISSIONS = {
  DASHBOARD: 'dashboard.view',

  USERS: 'users.view',
  EMPLOYEES: 'employees.view',
  OWNERS: 'owners.view',
  PETS: 'pets.view',

  APPOINTMENTS: 'appointments.view',
  SCHEDULES: 'schedules.view',
  SERVICES: 'services.view',

  VISITS: 'visits.view',
  MEDICAL_HISTORY: 'medical_history.view',

  PRODUCTS: 'products.view',
  INVENTORY: 'inventory.view',

  SALES: 'sales.view',
  CASH: 'cash.view',
  COMMISSIONS: 'commissions.view',

  REPORTS: 'reports.view',
} as const;

export type Permission =
  (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

const ROLE_PERMISSIONS: Record<
  Role,
  readonly Permission[]
> = {
  [ROLES.SUPER_ADMIN]: Object.values(PERMISSIONS),

  [ROLES.ADMIN]: [
    PERMISSIONS.DASHBOARD,
  ],

  [ROLES.VETERINARIAN]: [
    PERMISSIONS.DASHBOARD,
  ],

  [ROLES.RECEPTIONIST]: [
    PERMISSIONS.DASHBOARD,
  ],

  [ROLES.SPECIALIST]: [
    PERMISSIONS.DASHBOARD,
  ],
};

export function hasPermission(
  role: Role,
  permission: Permission
): boolean {
  return ROLE_PERMISSIONS[role]?.includes(
    permission
  ) ?? false;
}