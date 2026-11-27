
import { httpClient } from './httpClient';

import type {
    Product,
    ProductPayload,
    ProductBatch
} from '@/types/inventory.types';

export const productService = {

    async getAll(): Promise<Product[]> {
        const response = await httpClient.get<Product[]>('/products');
        return response.data;
    },

    async create(product: ProductPayload): Promise<void> {
        await httpClient.post('/products', product);
    },

    async update(
        id: number,
        product: ProductPayload
    ): Promise<void> {
        await httpClient.put(`/products/${id}`, product);
    },

    async deactivate(id: number): Promise<void> {
        await httpClient.patch(`/products/${id}/deactivate`);
    },

    async activate(id: number): Promise<void> {
        await httpClient.patch(`/products/${id}/activate`);
    },


    async getBatches(productId: number): Promise<ProductBatch[]> {
        const response = await httpClient.get<ProductBatch[]>(
            `/product-batches/product/${productId}`
        );

        return response.data;
    },

    async createBatch(payload: {
        productId: number;
        batchCode: string;
        expiryDate: string | null;
        unitCost: number;
    }): Promise<void> {
        await httpClient.post('/product-batches', payload);
    }

};
