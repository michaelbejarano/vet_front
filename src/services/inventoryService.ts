
import { httpClient } from './httpClient';

import type {
    ProductStock,
    InventoryMovement,
    ExpiringBatch
} from '@/types/inventory.types';

export const inventoryService = {

    async getProductStock(id: number): Promise<ProductStock> {
        const response = await httpClient.get<ProductStock>(
            `/inventory/products/${id}/stock`
        );

        return response.data;
    },

    async getMovements(
        productId?: number
    ): Promise<InventoryMovement[]> {
        const response = await httpClient.get<InventoryMovement[]>(
            '/inventory/movements',
            {
                params: productId ? { productId } : undefined
            }
        );

        return response.data;
    },

    async getExpiringBatches(
        days = 30
    ): Promise<ExpiringBatch[]> {
        const response = await httpClient.get<ExpiringBatch[]>(
            '/inventory/expiring-batches',
            {
                params: {
                    days,
                    includeExpired: true
                }
            }
        );

        return response.data;
    },

    async registerEntry(payload: {
        batchId: number;
        quantity: number;
        reference: string;
    }): Promise<void> {
        await httpClient.post('/inventory/entries', payload);
    },

    async registerAdjustment(payload: {
        batchId: number;
        type: 'ADJUSTMENT_IN' | 'ADJUSTMENT_OUT';
        quantity: number;
        reference: string;
    }): Promise<void> {
        await httpClient.post('/inventory/adjustments', payload);
    }

};
