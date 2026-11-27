import { httpClient } from './httpClient';

import type {
    Service,
    CreateServiceRequest,
    CreateServiceResponse,
    UpdateServiceRequest,
} from '@/types/service.types';

export const serviceService = {

    async getAll(): Promise<Service[]> {
        const response =
            await httpClient.get<Service[]>('/services');

        return response.data;
    },

    async getById(id: number): Promise<Service> {
        const response =
            await httpClient.get<Service>(
                `/services/${id}`
            );

        return response.data;
    },

    async create(
        request: CreateServiceRequest
    ): Promise<CreateServiceResponse> {
        const response =
            await httpClient.post<CreateServiceResponse>(
                '/services',
                request
            );

        return response.data;
    },

    async update(
        request: UpdateServiceRequest
    ): Promise<void> {
        const { id, ...body } = request;

        await httpClient.put(
            `/services/${id}`,
            body
        );
    },

    async deactivate(id: number): Promise<void> {
        await httpClient.patch(
            `/services/${id}/deactivate`
        );
    },

    async activate(id: number): Promise<void> {
        await httpClient.patch(
            `/services/${id}/activate`
        );
    },
};