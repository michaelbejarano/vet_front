import { httpClient } from './httpClient';

import type {
    EmployeeSchedule,
    CreateEmployeeScheduleRequest,
    CreateEmployeeScheduleResponse,
    UpdateEmployeeScheduleRequest,
} from '@/types/employeeSchedule.types';

export const employeeScheduleService = {

    // ========================================
    // LISTAR TODOS LOS HORARIOS
    // ========================================

    async getAll(): Promise<EmployeeSchedule[]> {

        const response =
            await httpClient.get<EmployeeSchedule[]>(
                '/employee-schedules'
            );

        return response.data;
    },

    // ========================================
    // OBTENER HORARIO POR ID
    // ========================================

    async getById(id: number): Promise<EmployeeSchedule> {

        const response =
            await httpClient.get<EmployeeSchedule>(
                `/employee-schedules/${id}`
            );

        return response.data;
    },

    // ========================================
    // HORARIOS POR TRABAJADOR
    // ========================================

    async getByEmployee(
        employeeId: number
    ): Promise<EmployeeSchedule[]> {

        const response =
            await httpClient.get<EmployeeSchedule[]>(
                `/employee-schedules/employee/${employeeId}`
            );

        return response.data;
    },

    // ========================================
    // REGISTRAR HORARIO
    // ========================================

    async create(
        request: CreateEmployeeScheduleRequest
    ): Promise<CreateEmployeeScheduleResponse> {

        const response =
            await httpClient.post<CreateEmployeeScheduleResponse>(
                '/employee-schedules',
                request
            );

        return response.data;
    },

    // ========================================
    // ACTUALIZAR HORARIO
    // ========================================

    async update(
        request: UpdateEmployeeScheduleRequest
    ): Promise<void> {

        const { id, ...body } = request;

        await httpClient.put(
            `/employee-schedules/${id}`,
            body
        );
    },

    // ========================================
    // ELIMINAR HORARIO
    // ========================================

    async remove(id: number): Promise<void> {

        await httpClient.delete(
            `/employee-schedules/${id}`
        );
    },
};