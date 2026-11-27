import { httpClient } from './httpClient';

import type {
    EmployeeServiceAssignment,
    AssignServiceRequest,
    AssignServiceResponse,
    ServiceEmployee,
} from '@/types/employeeService.types';

export const employeeServiceAssignmentService = {

    async getAll(): Promise<EmployeeServiceAssignment[]> {
        const response =
            await httpClient.get<EmployeeServiceAssignment[]>(
                '/employee-services'
            );

        return response.data;
    },

    async getByService(
        serviceId: number
    ): Promise<ServiceEmployee[]> {
        const response =
            await httpClient.get<ServiceEmployee[]>(
                `/employee-services/service/${serviceId}`
            );

        return response.data;
    },

    async assign(
        request: AssignServiceRequest
    ): Promise<AssignServiceResponse> {
        const response =
            await httpClient.post<AssignServiceResponse>(
                '/employee-services',
                request
            );

        return response.data;
    },

    async disable(id: number): Promise<void> {
        await httpClient.patch(
            `/employee-services/${id}/disable`
        );
    },
};