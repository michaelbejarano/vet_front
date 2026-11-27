export type Weekday = 1 | 2 | 3 | 4 | 5 | 6 | 7;

// ========================================
// RESPUESTA DEL BACKEND
// ========================================

export interface EmployeeSchedule {
    id: number;
    employeeId: number;
    weekday: Weekday;
    startAt: string;
    endAt: string;
}

// ========================================
// REGISTRAR HORARIO
// ========================================

export interface CreateEmployeeScheduleRequest {
    employeeId: number;
    weekday: Weekday;
    startAt: string;
    endAt: string;
}

// ========================================
// ACTUALIZAR HORARIO
// ========================================

export interface UpdateEmployeeScheduleRequest
    extends CreateEmployeeScheduleRequest {
    id: number;
}

// ========================================
// RESPUESTA DE REGISTRO
// ========================================

export interface CreateEmployeeScheduleResponse {
    id: number;
}