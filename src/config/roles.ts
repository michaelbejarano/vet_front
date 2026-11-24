export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  VETERINARIAN: 'VETERINARIAN',
  RECEPTIONIST: 'RECEPTIONIST',
  SPECIALIST: 'SPECIALIST',
} as const;

export type Role =
  (typeof ROLES)[keyof typeof ROLES];

export const ROLE_LABELS: Record<Role, string> = {
  [ROLES.SUPER_ADMIN]: 'Superadministrador',
  [ROLES.ADMIN]: 'Administrador',
  [ROLES.VETERINARIAN]: 'Veterinario',
  [ROLES.RECEPTIONIST]: 'Recepcionista',
  [ROLES.SPECIALIST]: 'Especialista',
};