
import type {
  AppointmentStatus,
  PaymentMethod,
  RescheduleStatus,
} from '../types/appointment.types';

type BadgeVariant =
  | 'success'
  | 'danger'
  | 'warning'
  | 'info'
  | 'neutral';

interface AppointmentStatusConfig {
  label: string;
  color: string;
  backgroundColor: string;
  borderColor: string;
  variant: BadgeVariant;
}

export const APPOINTMENT_STATUSES: Record<
  AppointmentStatus,
  AppointmentStatusConfig
> = {
  PENDING_PAYMENT: {
    label: 'Pendiente de pago',
    color: '#92400e',
    backgroundColor: '#fef3c7',
    borderColor: '#f59e0b',
    variant: 'warning',
  },

  CONFIRMED: {
    label: 'Confirmada',
    color: '#166534',
    backgroundColor: '#dcfce7',
    borderColor: '#22c55e',
    variant: 'success',
  },

  IN_PROGRESS: {
    label: 'En atención',
    color: '#1d4ed8',
    backgroundColor: '#dbeafe',
    borderColor: '#3b82f6',
    variant: 'info',
  },

  COMPLETED: {
    label: 'Completada',
    color: '#6b21a8',
    backgroundColor: '#f3e8ff',
    borderColor: '#a855f7',
    variant: 'success',
  },

  CANCELLED: {
    label: 'Cancelada',
    color: '#991b1b',
    backgroundColor: '#fee2e2',
    borderColor: '#ef4444',
    variant: 'danger',
  },

  NO_SHOW: {
    label: 'No asistió',
    color: '#9a3412',
    backgroundColor: '#ffedd5',
    borderColor: '#f97316',
    variant: 'danger',
  },

  EXPIRED: {
    label: 'Expirada',
    color: '#475569',
    backgroundColor: '#f1f5f9',
    borderColor: '#94a3b8',
    variant: 'neutral',
  },
};

export const APPOINTMENT_STATUS_OPTIONS =
  Object.entries(APPOINTMENT_STATUSES).map(
    ([value, config]) => ({
      value,
      label: config.label,
    }),
  );

export const PAYMENT_METHODS: Record<
  PaymentMethod,
  string
> = {
  CASH: 'Efectivo',
  YAPE: 'Yape',
  PLIN: 'Plin',
  CARD: 'Tarjeta',
  BANK_TRANSFER: 'Transferencia bancaria',
};

export const PAYMENT_METHOD_OPTIONS =
  Object.entries(PAYMENT_METHODS).map(
    ([value, label]) => ({
      value,
      label,
    }),
  );

export const RESCHEDULE_STATUS_LABELS: Record<
  RescheduleStatus,
  string
> = {
  PENDING_PAYMENT: 'Pendiente de pago',
  APPROVED: 'Aprobada',
  CANCELLED: 'Cancelada',
  EXPIRED: 'Expirada',
};

export const APPOINTMENT_DEPOSIT_PERCENT = 30;
export const APPOINTMENT_RESCHEDULE_FEE = 10;
export const APPOINTMENT_SLOT_MINUTES = 15;
export const APPOINTMENT_TIME_ZONE = 'America/Lima';
