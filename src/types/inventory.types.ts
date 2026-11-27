
export interface Product {
    id: number;
    sku: string | null;
    name: string;
    type: 'PRODUCT' | 'MEDICINE' | 'VACCINE' | 'SUPPLY';
    unit: string;
    salePrice: number;
    trackBatches: boolean;
    isActive: boolean;
}

export type ProductPayload = Omit<Product, 'id' | 'isActive'>;

export interface ProductBatch {
    id: number;
    productId: number;
    batchCode: string;
    expiryDate: string | null;
    unitCost: number;
}

export interface StockBatch {
    batchId: number;
    batchCode: string;
    expiryDate: string | null;
    unitCost: number;
    stock: number;
    isExpired: boolean;
}

export interface ProductStock {
    productId: number;
    productName: string;
    unit: string;
    isActive: boolean;
    totalStock: number;
    availableStock: number;
    expiredStock: number;
    batches: StockBatch[];
}

export interface InventoryMovement {
    id: number;
    batchId: number;
    productId: number;
    batchCode: string;
    type: string;
    quantity: number;
    unitCost: number;
    totalCost: number;
    reference: string | null;
    date: string;
}

export interface ExpiringBatch {
    batchId: number;
    productId: number;
    productName: string;
    batchCode: string;
    expiryDate: string;
    stock: number;
    daysRemaining: number;
    status: string;
}
