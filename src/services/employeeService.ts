import { httpClient } from './httpClient';

import type {
    Employee,
    CreateEmployeeRequest,
    CreateEmployeeResponse,
    UpdateEmployeeRequest,
} from '@/types/employee.types';

export const employeeService = {

    // ========================================
    // LISTAR TRABAJADORES
    // ========================================

    async getAll(isActive?: boolean): Promise<Employee[]> {

        if (isActive !== undefined) {
            const response = await httpClient.get<Employee[]>(
                '/employees',
                {
                    params: { isActive },
                }
            );

            return response.data;
        }

        // Recuperar activos e inactivos en paralelo
        const [activeResponse, inactiveResponse] =
            await Promise.all([
                httpClient.get<Employee[]>('/employees', {
                    params: { isActive: true },
                }),

                httpClient.get<Employee[]>('/employees', {
                    params: { isActive: false },
                }),
            ]);

        return [
            ...activeResponse.data,
            ...inactiveResponse.data,
        ].sort((a, b) => a.id - b.id);
    },

    // ========================================
    // OBTENER POR ID
    // ========================================

    async getById(id: number): Promise<Employee> {
        const response = await httpClient.get<Employee>(
            `/employees/${id}`
        );

        return response.data;
    },

    // ========================================
    // REGISTRAR
    // ========================================

    async create(
        request: CreateEmployeeRequest
    ): Promise<CreateEmployeeResponse> {

        const response =
            await httpClient.post<CreateEmployeeResponse>(
                '/employees',
                request
            );

        return response.data;
    },

    // ========================================
    // ACTUALIZAR
    // ========================================

    async update(
        request: UpdateEmployeeRequest
    ): Promise<void> {

        const { id, ...body } = request;

        await httpClient.put(
            `/employees/${id}`,
            body
        );
    },

    // ========================================
    // DESACTIVAR
    // ========================================

    async remove(id: number): Promise<void> {
        await httpClient.delete(`/employees/${id}`);
    },

    // ========================================
    // REACTIVAR
    // ========================================

    async activate(id: number): Promise<void> {
        await httpClient.patch(
            `/employees/${id}/activate`
        );
    },
};