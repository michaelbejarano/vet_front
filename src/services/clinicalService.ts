
import { httpClient } from '@/services/httpClient';

export interface VetAppointment {
  id: number;
  petId: number;
  petName: string;
  employeeId: number;
  employeeName: string;
  startAt: string;
  endAt: string;
  status: string;
}

export interface ConsultationPayload {
  weightKg: number | null;
  reason: string;
  anamnesis: string | null;
  physicalExam: string | null;
  instructions: string | null;
}

export interface TreatmentPayload {
  description: string;
  dosage: string | null;
  frequency: string | null;
  duration: string | null;
  instructions: string | null;
}

export interface ClinicalTreatment extends TreatmentPayload {
  id: number;
}

export interface ClinicalDiagnosis {
  id: number;
  description: string;
  isPrimary: boolean;
}

export interface ClinicalConsultation extends ConsultationPayload {
  id: number;
  appointmentId: number;
  visitId: number;
  petId: number;
  veterinarianId: number;
  date: string;
  visitStatus: string;
  diagnosis: ClinicalDiagnosis | null;
  treatments: ClinicalTreatment[];
}

export interface ClinicalPet {
  id: number;
  name: string;
  ownerName: string;
  speciesName: string;
  breedName: string | null;
  isActive: boolean;
}

export interface ClinicalHistoryItem extends ConsultationPayload {
  consultationId: number;
  appointmentId: number | null;
  visitId: number;
  veterinarianId: number;
  date: string;
  diagnosis: ClinicalDiagnosis | null;
  treatments: ClinicalTreatment[];
  services: {
    visitServiceId: number;
    serviceName: string;
    employeeId: number;
  }[];
}

export interface ClinicalHistory {
  petId: number;
  totalConsultations: number;
  history: ClinicalHistoryItem[];
}

async function get<T>(url: string): Promise<T> {
  const response = await httpClient.get<T>(url);
  return response.data;
}

export const clinicalService = {
  getAppointments: () =>
    get<VetAppointment[]>('/appointments'),

  startAppointment: (id: number) =>
    httpClient.patch(`/appointments/${id}/start`),

  completeAppointment: (id: number) =>
    httpClient.patch(`/appointments/${id}/complete`),

  getConsultation: (id: number) =>
    get<ClinicalConsultation>(
      `/appointments/${id}/consultation`
    ),

  saveConsultation: (
    id: number,
    data: ConsultationPayload,
    editing: boolean
  ) =>
    editing
      ? httpClient.put(`/appointments/${id}/consultation`, data)
      : httpClient.post(`/appointments/${id}/consultation`, data),

  saveDiagnosis: (
    id: number,
    description: string,
    editing: boolean
  ) =>
    editing
      ? httpClient.put(
          `/appointments/${id}/consultation/diagnosis`,
          { description }
        )
      : httpClient.post(
          `/appointments/${id}/consultation/diagnosis`,
          { description }
        ),

  saveTreatment: (
    id: number,
    data: TreatmentPayload,
    treatmentId?: number
  ) =>
    treatmentId
      ? httpClient.put(
          `/appointments/${id}/consultation/treatments/${treatmentId}`,
          data
        )
      : httpClient.post(
          `/appointments/${id}/consultation/treatments`,
          data
        ),

  deleteTreatment: (id: number, treatmentId: number) =>
    httpClient.delete(
      `/appointments/${id}/consultation/treatments/${treatmentId}`
    ),

  getPets: () => get<ClinicalPet[]>('/pets'),

  getHistory: (petId: number) =>
    get<ClinicalHistory>(`/pets/${petId}/clinical-history`),
};
