
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

export type OwnerPayload = Pick<
    Owner,
    | 'firstNames'
    | 'documentType'
    | 'documentNumber'
    | 'phone'
    | 'email'
    | 'address'
>;

export interface Pet {
    id: number;
    ownerId: number;
    ownerName: string;
    speciesId: number;
    speciesName: string;
    breedId: number | null;
    breedName: string | null;
    name: string;
    sexo: 'M' | 'F' | null;
    birthDate: string | null;
    notes: string | null;
    isActive: boolean;
}

export type PetPayload = Pick<
    Pet,
    | 'ownerId'
    | 'speciesId'
    | 'breedId'
    | 'name'
    | 'sexo'
    | 'birthDate'
    | 'notes'
>;

export interface Species {
    id: number;
    name: string;
}

export interface Breed {
    id: number;
    speciesId: number;
    name: string;
}
