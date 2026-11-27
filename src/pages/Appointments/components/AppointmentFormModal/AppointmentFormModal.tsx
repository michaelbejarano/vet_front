
import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';

import {
  CalendarDays,
  Clock,
  Search,
  CheckCircle2,
} from 'lucide-react';

import Modal from '@/components/common/Modal';
import Button from '@/components/common/Button';
import SelectField from '@/components/common/SelectField';
import TextField from '@/components/common/TextField';

import { appointmentService } from '@/services/appointmentService';
import { employeeService } from '@/services/employeeService';
import { serviceService } from '@/services/serviceService';
import {
  employeeServiceAssignmentService,
} from '@/services/employeeServiceAssignmentService';

import { getApiError } from '@/utils/apiError';

import {
  APPOINTMENT_DEPOSIT_PERCENT,
  APPOINTMENT_TIME_ZONE,
} from '@/config/appointmentStatuses';

import type {
  AppointmentPet,
  AppointmentSlot,
} from '@/types/appointment.types';

import type { Employee } from '@/types/employee.types';
import type { Service } from '@/types/service.types';
import type {
  EmployeeServiceAssignment,
} from '@/types/employeeService.types';

import styles from './AppointmentFormModal.module.css';

interface AppointmentFormModalProps {
  open: boolean;
  initialDate?: string;
  onClose: () => void;
  onCreated: (appointmentId: number) => void;
}

const currencyFormatter = new Intl.NumberFormat('es-PE', {
  style: 'currency',
  currency: 'PEN',
});

const timeFormatter = new Intl.DateTimeFormat('es-PE', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
  timeZone: APPOINTMENT_TIME_ZONE,
});

function getToday(): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: APPOINTMENT_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());

  const year = parts.find((p) => p.type === 'year')?.value;
  const month = parts.find((p) => p.type === 'month')?.value;
  const day = parts.find((p) => p.type === 'day')?.value;

  return `${year}-${month}-${day}`;
}

export default function AppointmentFormModal({
  open,
  initialDate,
  onClose,
  onCreated,
}: AppointmentFormModalProps) {
  const [pets, setPets] = useState<AppointmentPet[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [services, setServices] = useState<Service[]>([]);

  const [assignments, setAssignments] =
    useState<EmployeeServiceAssignment[]>([]);

  const [petId, setPetId] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [serviceIds, setServiceIds] = useState<number[]>([]);

  const [date, setDate] = useState(getToday());

  const [slots, setSlots] = useState<AppointmentSlot[]>([]);

  const [selectedSlot, setSelectedSlot] =
    useState<AppointmentSlot | null>(null);

  const [loading, setLoading] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState('');

  // ========================================
  // CARGAR DATOS DEL FORMULARIO
  // ========================================

  useEffect(() => {
    if (!open) return;

    let active = true;

    const today = getToday();
    const requestedDate = initialDate?.slice(0, 10);

    setPetId('');
    setEmployeeId('');
    setServiceIds([]);
    setSlots([]);
    setSelectedSlot(null);
    setSearched(false);
    setError('');

    setDate(
      requestedDate && requestedDate >= today
        ? requestedDate
        : today,
    );

    async function loadData() {
      setLoading(true);

      try {
        const [
          petData,
          employeeData,
          serviceData,
          assignmentData,
        ] = await Promise.all([
          appointmentService.getActivePets(),
          employeeService.getAll(true),
          serviceService.getAll(),
          employeeServiceAssignmentService.getAll(),
        ]);

        if (!active) return;

        setPets(petData);

        setEmployees(
          employeeData.filter((employee) => employee.isActive),
        );

        setServices(
          serviceData.filter((service) => service.isActive),
        );

        setAssignments(
          assignmentData.filter(
            (assignment) => assignment.isEnabled,
          ),
        );
      } catch (err) {
        if (!active) return;

        setError(
          getApiError(
            err,
            'No se pudieron cargar los datos de la reserva.',
          ),
        );
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadData();

    return () => {
      active = false;
    };
  }, [open, initialDate]);

  // ========================================
  // TRABAJADORES CON SERVICIOS HABILITADOS
  // ========================================

  const availableEmployees = useMemo(() => {
    return employees.filter((employee) =>
      assignments.some(
        (assignment) =>
          assignment.employeeId === employee.id &&
          services.some(
            (service) =>
              service.id === assignment.serviceId &&
              (!service.isClinical ||
                employee.type === 'VETERINARIAN'),
          ),
      ),
    );
  }, [employees, assignments, services]);

  // ========================================
  // SERVICIOS DEL TRABAJADOR
  // ========================================

  const availableServices = useMemo(() => {
    const employee = employees.find(
      (item) => item.id === Number(employeeId),
    );

    if (!employee) return [];

    return services.filter(
      (service) =>
        assignments.some(
          (assignment) =>
            assignment.employeeId === employee.id &&
            assignment.serviceId === service.id,
        ) &&
        (!service.isClinical ||
          employee.type === 'VETERINARIAN'),
    );
  }, [employeeId, employees, services, assignments]);

  // ========================================
  // SERVICIOS SELECCIONADOS
  // ========================================

  const selectedServices = useMemo(() => {
    return availableServices.filter(
      (service) => serviceIds.includes(service.id),
    );
  }, [availableServices, serviceIds]);

  const totalPrice = selectedServices.reduce(
    (total, service) => total + service.basePrice,
    0,
  );

  const totalDuration = selectedServices.reduce(
    (total, service) => total + service.durationMinutes,
    0,
  );

  const requiredDeposit =
    Math.round(
      totalPrice * APPOINTMENT_DEPOSIT_PERCENT,
    ) / 100;

  const remainingBalance =
    Math.round((totalPrice - requiredDeposit) * 100) / 100;

  const busy = loadingSlots || saving;

  const canSearch =
    Boolean(petId) &&
    Boolean(employeeId) &&
    serviceIds.length > 0 &&
    Boolean(date) &&
    date >= getToday() &&
    totalPrice > 0 &&
    totalDuration > 0;

  // ========================================
  // LIMPIAR DISPONIBILIDAD
  // ========================================

  function resetAvailability() {
    setSlots([]);
    setSelectedSlot(null);
    setSearched(false);
    setError('');
  }

  function handleEmployeeChange(value: string) {
    setEmployeeId(value);
    setServiceIds([]);
    resetAvailability();
  }

  function handleServiceChange(serviceId: number) {
    setServiceIds((previous) =>
      previous.includes(serviceId)
        ? previous.filter((id) => id !== serviceId)
        : [...previous, serviceId],
    );

    resetAvailability();
  }

  // ========================================
  // CONSULTAR HORARIOS DISPONIBLES
  // ========================================

  async function handleSearchAvailability() {
    if (!canSearch || busy) return;

    setLoadingSlots(true);
    setSelectedSlot(null);
    setSlots([]);
    setSearched(false);
    setError('');

    try {
      const result =
        await appointmentService.getAvailability({
          employeeId: Number(employeeId),
          petId: Number(petId),
          serviceIds,
          date,
        });

      const futureSlots = result.filter(
        (slot) =>
          new Date(slot.startAt).getTime() > Date.now(),
      );

      setSlots(futureSlots);
      setSearched(true);

      // Preseleccionar la hora pulsada en el calendario,
      // únicamente si el backend confirma disponibilidad.
      if (initialDate?.includes('T')) {
        const requestedTime =
          new Date(initialDate).getTime();

        const matchingSlot = futureSlots.find(
          (slot) =>
            new Date(slot.startAt).getTime() === requestedTime,
        );

        if (matchingSlot) {
          setSelectedSlot(matchingSlot);
        }
      }
    } catch (err) {
      setError(
        getApiError(
          err,
          'No se pudo consultar la disponibilidad.',
        ),
      );
    } finally {
      setLoadingSlots(false);
    }
  }

  // ========================================
  // REGISTRAR RESERVA
  // ========================================

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    if (!canSearch || !selectedSlot || busy) return;

    if (
      new Date(selectedSlot.startAt).getTime() <= Date.now()
    ) {
      resetAvailability();
      setError(
        'El horario seleccionado ya pasó. Consulta nuevamente.',
      );
      return;
    }

    setSaving(true);
    setError('');

    try {
      const result = await appointmentService.create({
        petId: Number(petId),
        employeeId: Number(employeeId),
        serviceIds,
        startAt: selectedSlot.startAt,
        endAt: selectedSlot.endAt,
      });

      onCreated(result.id);
    } catch (err) {
      resetAvailability();

      setError(
        getApiError(
          err,
          'No se pudo registrar la cita. Consulta nuevamente la disponibilidad.',
        ),
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      title="Nueva cita"
      description="Selecciona los datos y consulta los horarios disponibles."
      onClose={onClose}
      busy={busy}
    >
      {loading ? (
        <div className={styles.loading}>
          Cargando datos de la reserva...
        </div>
      ) : (
        <form
          className={styles.form}
          onSubmit={handleSubmit}
        >
          {error && (
            <div className={styles.error} role="alert">
              {error}
            </div>
          )}

          {/* MASCOTA */}

          <SelectField
            label="Mascota"
            value={petId}
            disabled={busy}
            required
            placeholder="Selecciona una mascota"
            options={pets.map((pet) => ({
              value: String(pet.id),
              label: `${pet.name} — ${pet.ownerName}`,
            }))}
            onChange={(event) => {
              setPetId(event.target.value);
              resetAvailability();
            }}
          />

          {pets.length === 0 && (
            <p className={styles.help}>
              No hay mascotas activas disponibles.
            </p>
          )}

          {/* TRABAJADOR */}

          <SelectField
            label="Trabajador"
            value={employeeId}
            disabled={busy}
            required
            placeholder="Selecciona un trabajador"
            options={availableEmployees.map((employee) => ({
              value: String(employee.id),
              label:
                `${employee.firstNames} ${employee.lastNames}`,
            }))}
            onChange={(event) =>
              handleEmployeeChange(event.target.value)
            }
          />

          {/* SERVICIOS */}

          {employeeId && (
            <section className={styles.section}>
              <h4>Servicios disponibles</h4>

              <p className={styles.help}>
                Puedes seleccionar varios servicios del mismo
                trabajador.
              </p>

              <div className={styles.serviceList}>
                {availableServices.map((service) => (
                  <label
                    key={service.id}
                    className={`${styles.serviceItem} ${
                      serviceIds.includes(service.id)
                        ? styles.serviceSelected
                        : ''
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={serviceIds.includes(service.id)}
                      disabled={busy}
                      onChange={() =>
                        handleServiceChange(service.id)
                      }
                    />

                    <div className={styles.serviceInfo}>
                      <strong>{service.name}</strong>

                      <small>
                        {service.durationMinutes} minutos
                      </small>
                    </div>

                    <strong className={styles.servicePrice}>
                      {currencyFormatter.format(
                        service.basePrice,
                      )}
                    </strong>
                  </label>
                ))}

                {availableServices.length === 0 && (
                  <p className={styles.help}>
                    No hay servicios disponibles.
                  </p>
                )}
              </div>
            </section>
          )}

          {/* FECHA */}

          <TextField
            label="Fecha de atención"
            type="date"
            value={date}
            min={getToday()}
            disabled={busy}
            required
            onChange={(event) => {
              setDate(event.target.value);
              resetAvailability();
            }}
          />

          <Button
            variant="outline"
            fullWidth
            leftIcon={<Search size={16} />}
            disabled={!canSearch || busy}
            loading={loadingSlots}
            onClick={() => void handleSearchAvailability()}
          >
            Consultar disponibilidad
          </Button>

          {/* HORARIOS */}

          {searched && (
            <section className={styles.section}>
              <h4>
                <CalendarDays size={17} />
                Horarios disponibles
              </h4>

              {slots.length === 0 ? (
                <div className={styles.emptySlots}>
                  No hay horarios disponibles para esta fecha.
                  Selecciona otro día o trabajador.
                </div>
              ) : (
                <div className={styles.slots}>
                  {slots.map((slot) => (
                    <button
                      key={slot.startAt}
                      type="button"
                      disabled={busy}
                      aria-pressed={
                        selectedSlot?.startAt === slot.startAt
                      }
                      className={`${styles.slot} ${
                        selectedSlot?.startAt === slot.startAt
                          ? styles.slotSelected
                          : ''
                      }`}
                      onClick={() => setSelectedSlot(slot)}
                    >
                      <strong>
                        {timeFormatter.format(
                          new Date(slot.startAt),
                        )}
                      </strong>

                      <small>
                        Hasta{' '}
                        {timeFormatter.format(
                          new Date(slot.endAt),
                        )}
                      </small>
                    </button>
                  ))}
                </div>
              )}
            </section>
          )}

          {selectedSlot && (
            <div className={styles.selectedTime}>
              <CheckCircle2 size={18} />

              <span>
                Horario seleccionado:{' '}
                <strong>
                  {timeFormatter.format(
                    new Date(selectedSlot.startAt),
                  )}
                  {' - '}
                  {timeFormatter.format(
                    new Date(selectedSlot.endAt),
                  )}
                </strong>
              </span>
            </div>
          )}

          {/* RESUMEN ECONÓMICO */}

          {selectedServices.length > 0 && (
            <section className={styles.summary}>
              <h4>Resumen de reserva</h4>

              <div className={styles.summaryRow}>
                <span>Servicios seleccionados</span>
                <strong>{selectedServices.length}</strong>
              </div>

              <div className={styles.summaryRow}>
                <span>Duración total</span>
                <strong>{totalDuration} min</strong>
              </div>

              <div className={styles.summaryRow}>
                <span>Precio estimado</span>
                <strong>
                  {currencyFormatter.format(totalPrice)}
                </strong>
              </div>

              <div className={styles.deposit}>
                <span>
                  Adelanto ({APPOINTMENT_DEPOSIT_PERCENT}%)
                </span>

                <strong>
                  {currencyFormatter.format(requiredDeposit)}
                </strong>
              </div>

              <div className={styles.summaryRow}>
                <span>Saldo restante estimado</span>

                <strong>
                  {currencyFormatter.format(remainingBalance)}
                </strong>
              </div>
            </section>
          )}

          {/* INFORMACIÓN DE PAGO */}

          <div className={styles.notice}>
            <Clock size={19} />

            <p>
              La cita quedará pendiente de pago. El adelanto
              deberá registrarse en un máximo de 15 minutos
              y antes del inicio de la cita.
            </p>
          </div>

          {/* ACCIONES */}

          <div className={styles.actions}>
            <Button
              variant="outline"
              disabled={busy}
              onClick={onClose}
            >
              Cancelar
            </Button>

            <Button
              type="submit"
              disabled={!canSearch || !selectedSlot || busy}
              loading={saving}
            >
              Registrar cita
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
