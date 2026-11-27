
export type AppointmentStatus =
  | 'PENDING_PAYMENT'
  | 'CONFIRMED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'NO_SHOW'
  | 'EXPIRED';

export type PaymentMethod =
  | 'CASH'
  | 'YAPE'
  | 'PLIN'
  | 'CARD'
  | 'BANK_TRANSFER';

export type RescheduleStatus =
  | 'PENDING_PAYMENT'
  | 'APPROVED'
  | 'CANCELLED'
  | 'EXPIRED';

// Cita para listado y calendario
export interface Appointment {
  id: number;
  petId: number;
  petName: string;
  employeeId: number;
  employeeName: string;
  startAt: string;
  endAt: string;
  status: AppointmentStatus;
  reservedPrice: number;
  requiredDeposit: number;
}

// Servicios reservados
export interface AppointmentServiceDetail {
  serviceId: number;
  serviceName: string;
  agreedPrice: number;
  durationMinutes: number;
}

// Detalle completo de una cita
export interface AppointmentDetail extends Appointment {
  depositPercent: number;
  paymentExpiresAt: string | null;
  createdAt: string;
  services: AppointmentServiceDetail[];
}

// Crear una cita
export interface CreateAppointmentRequest {
  petId: number;
  employeeId: number;
  serviceIds: number[];
  startAt: string;
  endAt: string;
}

export interface CreateAppointmentResponse {
  id: number;
}

// Consultar disponibilidad
export interface AppointmentAvailabilityRequest {
  employeeId: number;
  serviceIds: number[];
  date: string;
  petId?: number;
}

export interface AppointmentSlot {
  startAt: string;
  endAt: string;
}

// Registrar adelanto
export interface RegisterDepositRequest {
  cashSessionId: number;
  amount: number;
  method: PaymentMethod;
  reference?: string | null;
}

export interface RegisterDepositResponse {
  paymentId: number;
  message: string;
}

// Registrar inasistencia
export interface NoShowResponse {
  appointmentId: number;
  status: AppointmentStatus;
  forfeitedDeposit: number;
}

// Iniciar atención
export interface StartAppointmentResponse {
  visitId: number;
  message: string;
}

// Reprogramaciones
export interface AppointmentReschedule {
  id: number;
  appointmentId: number;
  previousStart: string;
  previousEnd: string;
  newStart: string;
  newEnd: string;
  fee: number;
  status: RescheduleStatus;
  paymentExpiresAt: string | null;
  createdAt: string;
}

export interface CreateRescheduleRequest {
  appointmentId: number;
  newStart: string;
  newEnd: string;
}

export interface CreateRescheduleResponse {
  id: number;
  message: string;
}

export interface PayRescheduleRequest {
  cashSessionId: number;
  amount: number;
  method: PaymentMethod;
  reference?: string | null;
}

export interface MessageResponse {
  message: string;
}

export interface AppointmentPet {
  id: number;
  ownerId: number;
  ownerName: string;
  name: string;
  speciesName: string;
  isActive: boolean;
}
