
import { httpClient } from './httpClient';

export interface Owner {
    id: number;
    firstNames: string;
    documentType: string | null;
    documentNumber: string | null;
    phone: string | null;
    email: string | null;
    address: string | null;
    createdAt: string;
}

export interface OwnerPayload {
    firstNames: string;
    documentType: string | null;
    documentNumber: string | null;
    phone: string | null;
    email: string | null;
    address: string | null;
}

export const ownerService = {
    async getAll(search?: string): Promise<Owner[]> {
        const response = await httpClient.get<Owner[]>(
            '/owners',
            {
                params: search?.trim()
                    ? { search: search.trim() }
                    : undefined
            }
        );

        return response.data;
    },

    async getById(id: number): Promise<Owner> {
        const response = await httpClient.get<Owner>(
            `/owners/${id}`
        );

        return response.data;
    },

    async create(data: OwnerPayload): Promise<void> {
        await httpClient.post('/owners', data);
    },

    async update(
        id: number,
        data: OwnerPayload
    ): Promise<void> {
        await httpClient.put(`/owners/${id}`, data);
    }
};
