import { ROLE_IDS, ROLES } from './roles';

export const EMPLOYEE_TYPES = {
    VETERINARIAN: 'VETERINARIAN',
    GROOMING: 'GROOMING',
    RECEPTION: 'RECEPTION',
    ADMIN: 'ADMIN',
    OTHER: 'OTHER',
} as const;

export type EmployeeType =
    (typeof EMPLOYEE_TYPES)[keyof typeof EMPLOYEE_TYPES];

export const EMPLOYEE_TYPE_LABELS: Record<EmployeeType, string> = {
    VETERINARIAN: 'Veterinario',
    GROOMING: 'Estética y peluquería',
    RECEPTION: 'Recepción',
    ADMIN: 'Administrativo',
    OTHER: 'Otro',
};

export const EMPLOYEE_TYPE_OPTIONS = Object.values(
    EMPLOYEE_TYPES
).map(type => ({
    value: type,
    label: EMPLOYEE_TYPE_LABELS[type],
}));

export function getEmployeeTypeLabel(type: EmployeeType): string {
    return EMPLOYEE_TYPE_LABELS[type] ?? type;
}

// ========================================
// PUESTO SUGERIDO SEGÚN EL ROL
// ========================================

export function getSuggestedEmployeeType(
    roleId: number
): EmployeeType | null {

    switch (roleId) {

        case ROLE_IDS[ROLES.SUPER_ADMIN]:
        case ROLE_IDS[ROLES.ADMIN]:
            return EMPLOYEE_TYPES.ADMIN;

        case ROLE_IDS[ROLES.VETERINARIAN]:
            return EMPLOYEE_TYPES.VETERINARIAN;

        case ROLE_IDS[ROLES.RECEPTIONIST]:
            return EMPLOYEE_TYPES.RECEPTION;

        default:
            return null;
    }
}