export interface Service {
    id: number;
    name: string;
    description: string | null;
    basePrice: number;
    durationMinutes: number;
    isClinical: boolean;
    isActive: boolean;
}

export interface CreateServiceRequest {
    name: string;
    description: string | null;
    basePrice: number;
    durationMinutes: number;
    isClinical: boolean;
}

export interface UpdateServiceRequest
    extends CreateServiceRequest {
    id: number;
}

export interface CreateServiceResponse {
    id: number;
}