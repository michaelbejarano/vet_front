export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  VETERINARIAN: 'VETERINARIAN',
  RECEPTIONIST: 'RECEPTIONIST',
  SPECIALIST: 'SPECIALIST',
} as const;

export type Role =
  (typeof ROLES)[keyof typeof ROLES];

// Nombres visibles de los roles
export const ROLE_LABELS: Record<Role, string> = {
  [ROLES.SUPER_ADMIN]: 'Superadministrador',
  [ROLES.ADMIN]: 'Administrador',
  [ROLES.VETERINARIAN]: 'Veterinario',
  [ROLES.RECEPTIONIST]: 'Recepcionista',
  [ROLES.SPECIALIST]: 'Especialista',
};

// IDs reales de PostgreSQL
export const ROLE_IDS: Record<Role, number> = {
  [ROLES.ADMIN]: 1,
  [ROLES.VETERINARIAN]: 2,
  [ROLES.RECEPTIONIST]: 3,
  [ROLES.SPECIALIST]: 4,
  [ROLES.SUPER_ADMIN]: 5,
};

// Obtener el nombre visible mediante el ID
export function getRoleLabel(roleId: number): string {
  const role = (Object.keys(ROLE_IDS) as Role[])
    .find((role) => ROLE_IDS[role] === roleId);

  return role
    ? ROLE_LABELS[role]
    : `Rol #${roleId}`;
}

// Obtener los roles que puede asignar el usuario autenticado
export function getAssignableRoles(role: Role): Role[] {
  if (role === ROLES.SUPER_ADMIN) {
    return Object.values(ROLES);
  }

  if (role === ROLES.ADMIN) {
    return [
      ROLES.VETERINARIAN,
      ROLES.RECEPTIONIST,
      ROLES.SPECIALIST,
    ];
  }

  return [];
}

export function canManageUser(
  currentRole: Role,
  currentUserId: number,
  targetUserId: number,
  targetRoleId: number
): boolean {
  // No puede administrar su propia cuenta.
  if (currentUserId === targetUserId) {
    return false;
  }

  // Comprobar los roles que puede administrar.
  return getAssignableRoles(currentRole).some(
    (role) => ROLE_IDS[role] === targetRoleId
  );
}