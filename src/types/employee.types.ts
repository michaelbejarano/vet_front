import type { EmployeeType } from '@/config/employeeTypes';

// ========================================
// RESPUESTA DEL BACKEND
// ========================================

export interface Employee {
    id: number;
    userId: number | null;
    firstNames: string;
    lastNames: string;
    documentNumber: string | null;
    phone: string | null;
    type: EmployeeType;
    licenseNumber: string | null;
    specialty: string | null;
    monthlySalary: number | null;
    isActive: boolean;
}

// ========================================
// REGISTRAR TRABAJADOR
// ========================================

export interface CreateEmployeeRequest {
    userId: number | null;
    firstNames: string;
    lastNames: string;
    documentNumber: string | null;
    phone: string | null;
    type: EmployeeType;
    licenseNumber: string | null;
    specialty: string | null;
    monthlySalary: number;
}

// ========================================
// ACTUALIZAR TRABAJADOR
// ========================================

export interface UpdateEmployeeRequest
    extends CreateEmployeeRequest {
    id: number;
}

// ========================================
// RESPUESTA DE REGISTRO
// ========================================

export interface CreateEmployeeResponse {
    id: number;
}