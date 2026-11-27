
import { httpClient } from './httpClient';
import type {
  AppointmentPet,
} from '../types/appointment.types';
import type {
  Appointment,
  AppointmentDetail,
  AppointmentAvailabilityRequest,
  AppointmentSlot,
  CreateAppointmentRequest,
  CreateAppointmentResponse,
  RegisterDepositRequest,
  RegisterDepositResponse,
  StartAppointmentResponse,
  AppointmentReschedule,
  CreateRescheduleRequest,
  CreateRescheduleResponse,
  PayRescheduleRequest,
  MessageResponse,
} from '../types/appointment.types';

const APPOINTMENTS_URL = '/appointments';
const RESCHEDULES_URL = '/appointment-reschedules';

export const appointmentService = {
  // Obtener todas las citas
  async getAll(): Promise<Appointment[]> {
    const { data } = await httpClient.get<Appointment[]>(
      APPOINTMENTS_URL,
    );

    return data;
  },

  // Obtener detalle de una cita
  async getById(id: number): Promise<AppointmentDetail> {
    const { data } =
      await httpClient.get<AppointmentDetail>(
        `${APPOINTMENTS_URL}/${id}`,
      );

    return data;
  },

  // Crear una cita
  async create(
    request: CreateAppointmentRequest,
  ): Promise<CreateAppointmentResponse> {
    const { data } =
      await httpClient.post<CreateAppointmentResponse>(
        APPOINTMENTS_URL,
        request,
      );

    return data;
  },

  // Consultar horarios disponibles
  async getAvailability(
    request: AppointmentAvailabilityRequest,
  ): Promise<AppointmentSlot[]> {
    const params = new URLSearchParams();

    params.append(
      'employeeId',
      String(request.employeeId),
    );

    params.append('date', request.date);

    request.serviceIds.forEach((serviceId) => {
      params.append('serviceIds', String(serviceId));
    });

    if (request.petId !== undefined) {
      params.append('petId', String(request.petId));
    }

    const { data } =
      await httpClient.get<AppointmentSlot[]>(
        `${APPOINTMENTS_URL}/availability`,
        { params },
      );

    return data;
  },

  // Registrar adelanto
  async registerDeposit(
    appointmentId: number,
    request: RegisterDepositRequest,
  ): Promise<RegisterDepositResponse> {
    const { data } =
      await httpClient.post<RegisterDepositResponse>(
        `${APPOINTMENTS_URL}/${appointmentId}/deposit`,
        request,
      );

    return data;
  },

  // Cancelar cita
  async cancel(
    appointmentId: number,
  ): Promise<MessageResponse> {
    const { data } =
      await httpClient.patch<MessageResponse>(
        `${APPOINTMENTS_URL}/${appointmentId}/cancel`,
      );

    return data;
  },

  // Registrar inasistencia
  async markNoShow(
    appointmentId: number,
  ): Promise<void> {
    await httpClient.patch(
      `${APPOINTMENTS_URL}/${appointmentId}/no-show`,
    );
  },

  // Iniciar atención
  async start(
    appointmentId: number,
  ): Promise<StartAppointmentResponse> {
    const { data } =
      await httpClient.patch<StartAppointmentResponse>(
        `${APPOINTMENTS_URL}/${appointmentId}/start`,
      );

    return data;
  },

  // Completar atención
  async complete(
    appointmentId: number,
  ): Promise<void> {
    await httpClient.patch(
      `${APPOINTMENTS_URL}/${appointmentId}/complete`,
    );
  },

  // Obtener historial de reprogramaciones
  async getReschedules(
    appointmentId: number,
  ): Promise<AppointmentReschedule[]> {
    const { data } =
      await httpClient.get<AppointmentReschedule[]>(
        `${RESCHEDULES_URL}/appointment/${appointmentId}`,
      );

    return data;
  },

  // Solicitar reprogramación
  async createReschedule(
    request: CreateRescheduleRequest,
  ): Promise<CreateRescheduleResponse> {
    const { data } =
      await httpClient.post<CreateRescheduleResponse>(
        RESCHEDULES_URL,
        request,
      );

    return data;
  },

  // Pagar reprogramación
  async payReschedule(
    rescheduleId: number,
    request: PayRescheduleRequest,
  ): Promise<RegisterDepositResponse> {
    const { data } =
      await httpClient.post<RegisterDepositResponse>(
        `${RESCHEDULES_URL}/${rescheduleId}/pay`,
        request,
      );

    return data;
  },

  // Cancelar solicitud de reprogramación
  async cancelReschedule(
    rescheduleId: number,
  ): Promise<MessageResponse> {
    const { data } =
      await httpClient.patch<MessageResponse>(
        `${RESCHEDULES_URL}/${rescheduleId}/cancel`,
      );

    return data;
  },

    async getActivePets(): Promise<AppointmentPet[]> {
    const { data } = await httpClient.get<AppointmentPet[]>(
        '/pets',
    );

    return data
        .filter((pet) => pet.isActive)
        .sort((a, b) => a.name.localeCompare(b.name));
    },
};
