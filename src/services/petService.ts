
import { httpClient } from './httpClient';

import type {
    Pet,
    PetPayload,
    Species,
    Breed
} from '@/types/veterinary.types';

export const petService = {

    // =========================================
    // LISTAR TODAS LAS MASCOTAS
    // GET /api/pets
    // =========================================

    async getAll(): Promise<Pet[]> {
        const response = await httpClient.get<Pet[]>(
            '/pets'
        );

        return response.data;
    },

    // =========================================
    // BUSCAR MASCOTA POR ID
    // GET /api/pets/{id}
    // =========================================

    async getById(id: number): Promise<Pet> {
        const response = await httpClient.get<Pet>(
            `/pets/${id}`
        );

        return response.data;
    },

    // =========================================
    // REGISTRAR NUEVA MASCOTA
    // POST /api/pets
    // =========================================

    async create(data: PetPayload): Promise<void> {
        await httpClient.post(
            '/pets',
            data
        );
    },

    // =========================================
    // ACTUALIZAR MASCOTA
    // PUT /api/pets/{id}
    // =========================================

    async update(
        id: number,
        data: PetPayload
    ): Promise<void> {
        await httpClient.put(
            `/pets/${id}`,
            data
        );
    },

    // =========================================
    // DESACTIVAR MASCOTA
    // PATCH /api/pets/{id}/deactivate
    // =========================================

    async deactivate(id: number): Promise<void> {
        await httpClient.patch(
            `/pets/${id}/deactivate`
        );
    },

    // =========================================
    // LISTAR TODAS LAS ESPECIES
    // GET /api/species
    // =========================================

    async getSpecies(): Promise<Species[]> {
        const response = await httpClient.get<Species[]>(
            '/species'
        );

        return response.data;
    },

    // =========================================
    // LISTAR RAZAS SEGUN ESPECIE
    // GET /api/species/{speciesId}/breeds
    // =========================================

    async getBreeds(speciesId: number): Promise<Breed[]> {
        const response = await httpClient.get<Breed[]>(
            `/species/${speciesId}/breeds`
        );

        return response.data;
    },

    // =========================================
    // REGISTRAR NUEVA ESPECIE
    // POST /api/species
    // =========================================

    async createSpecies(
        name: string
    ): Promise<{ id: number }> {

        const cleanName = name.trim();

        if (!cleanName) {
            throw new Error(
                'El nombre de la especie es obligatorio.'
            );
        }

        const response = await httpClient.post<{ id: number }>(
            '/species',
            {
                name: cleanName
            }
        );

        return response.data;
    },

    // =========================================
    // REGISTRAR NUEVA RAZA
    // POST /api/species/{speciesId}/breeds
    // =========================================

    async createBreed(
        speciesId: number,
        name: string
    ): Promise<{ id: number }> {

        const cleanName = name.trim();

        if (!speciesId || speciesId <= 0) {
            throw new Error(
                'Debes seleccionar una especie válida.'
            );
        }

        if (!cleanName) {
            throw new Error(
                'El nombre de la raza es obligatorio.'
            );
        }

        const response = await httpClient.post<{ id: number }>(
            `/species/${speciesId}/breeds`,
            {
                name: cleanName
            }
        );

        return response.data;
    }

};
