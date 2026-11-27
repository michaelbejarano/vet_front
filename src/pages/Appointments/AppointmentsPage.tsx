
import { useEffect, useMemo, useState } from 'react';

import {
  CalendarDays,
  CalendarCheck,
  Clock,
  Stethoscope,
  RefreshCw,
  Plus,
} from 'lucide-react';

import PageHeader from '../../components/common/PageHeader';
import Button from '../../components/common/Button';
import StatCard from '../../components/common/StatCard';
import SelectField from '../../components/common/SelectField';
import Modal from '../../components/common/Modal';
import StatusBadge from '../../components/common/StatusBadge';

import AppointmentCalendar from './components/AppointmentCalendar';
import AppointmentFormModal from './components/AppointmentFormModal';

import { appointmentService } from '../../services/appointmentService';
import { employeeService } from '../../services/employeeService';

import {
  APPOINTMENT_STATUSES,
  APPOINTMENT_STATUS_OPTIONS,
} from '../../config/appointmentStatuses';

import { getApiError } from '../../utils/apiError';

import type {
  Appointment,
  AppointmentDetail,
} from '../../types/appointment.types';

import type {
  Employee,
} from '../../types/employee.types';

import styles from './AppointmentsPage.module.css';

const currencyFormatter = new Intl.NumberFormat('es-PE', {
  style: 'currency',
  currency: 'PEN',
});

const dateFormatter = new Intl.DateTimeFormat('es-PE', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'America/Lima',
});

export default function AppointmentsPage() {
  const [appointments, setAppointments] =
    useState<Appointment[]>([]);

  const [employees, setEmployees] =
    useState<Employee[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [employeeFilter, setEmployeeFilter] =
    useState('');

  const [statusFilter, setStatusFilter] =
    useState('');

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');

  const [selectedAppointment, setSelectedAppointment] =
    useState<AppointmentDetail | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');

  // ========================================
  // CARGAR CITAS Y TRABAJADORES
  // ========================================

  async function loadData() {
    setLoading(true);
    setError('');

    try {
      const [appointmentData, employeeData] =
        await Promise.all([
          appointmentService.getAll(),
          employeeService.getAll(),
        ]);

      setAppointments(appointmentData);
      setEmployees(employeeData);
    } catch (err) {
      setError(
        getApiError(
          err,
          'No se pudieron cargar las citas.',
        ),
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  // ========================================
  // FILTRAR CITAS
  // ========================================

  const filteredAppointments = useMemo(() => {
    return appointments.filter((appointment) => {
      const matchesEmployee =
        !employeeFilter ||
        String(appointment.employeeId) === employeeFilter;

      const matchesStatus =
        !statusFilter ||
        appointment.status === statusFilter;

      return matchesEmployee && matchesStatus;
    });
  }, [appointments, employeeFilter, statusFilter]);

  // ========================================
  // ESTADÍSTICAS
  // ========================================

  const stats = useMemo(() => {
    return {
      total: filteredAppointments.length,

      pending: filteredAppointments.filter(
        (item) => item.status === 'PENDING_PAYMENT',
      ).length,

      confirmed: filteredAppointments.filter(
        (item) => item.status === 'CONFIRMED',
      ).length,

      inProgress: filteredAppointments.filter(
        (item) => item.status === 'IN_PROGRESS',
      ).length,
    };
  }, [filteredAppointments]);

  // ========================================
  // OBTENER DETALLE DE CITA
  // ========================================

  async function handleAppointmentClick(id: number) {
    setSelectedAppointment(null);
    setDetailError('');
    setDetailOpen(true);
    setDetailLoading(true);

    try {
      const detail = await appointmentService.getById(id);

      setSelectedAppointment(detail);
    } catch (err) {
      setDetailError(
        getApiError(
          err,
          'No se pudo obtener el detalle de la cita.',
        ),
      );
    } finally {
      setDetailLoading(false);
    }
  }

  // ========================================
  // ABRIR FORMULARIO DESDE EL CALENDARIO
  // ========================================

  function handleDateClick(date: string) {
    setSelectedDate(date);
    setFormOpen(true);
  }

  // ========================================
  // ABRIR FORMULARIO DE NUEVA CITA
  // ========================================

  function handleNewAppointment() {
    setSelectedDate('');
    setFormOpen(true);
  }

  // ========================================
  // CITA REGISTRADA CORRECTAMENTE
  // ========================================

  async function handleAppointmentCreated(id: number) {
    // Cerrar formulario
    setFormOpen(false);

    // Limpiar fecha seleccionada
    setSelectedDate('');

    // Limpiar filtros para mostrar la nueva cita
    setEmployeeFilter('');
    setStatusFilter('');

    // Actualizar calendario
    await loadData();

    // Mostrar detalle de la cita registrada
    await handleAppointmentClick(id);
  }

  // ========================================
  // LIMPIAR FILTROS
  // ========================================

  function handleClearFilters() {
    setEmployeeFilter('');
    setStatusFilter('');
  }

  return (
    <div className={styles.page}>

      {/* ENCABEZADO */}

      <PageHeader
        title="Citas"
        description="Gestiona las reservas y atenciones veterinarias."
        actions={
          <div className={styles.actions}>
            <Button
              variant="outline"
              leftIcon={<RefreshCw size={16} />}
              onClick={() => void loadData()}
              loading={loading}
            >
              Actualizar
            </Button>

            <Button
              leftIcon={<Plus size={18} />}
              onClick={handleNewAppointment}
            >
              Nueva cita
            </Button>
          </div>
        }
      />

      {/* ESTADÍSTICAS */}

      <section className={styles.stats}>
        <StatCard
          label="Total citas"
          value={stats.total}
          description="Según los filtros"
          icon={CalendarDays}
          variant="primary"
        />

        <StatCard
          label="Pendientes de pago"
          value={stats.pending}
          description="Reservas por confirmar"
          icon={Clock}
          variant="warning"
        />

        <StatCard
          label="Confirmadas"
          value={stats.confirmed}
          description="Adelanto registrado"
          icon={CalendarCheck}
          variant="success"
        />

        <StatCard
          label="En atención"
          value={stats.inProgress}
          description="Atenciones iniciadas"
          icon={Stethoscope}
          variant="info"
        />
      </section>

      {/* CALENDARIO */}

      <section className={styles.calendarCard}>
        <div className={styles.sectionHeader}>
          <div>
            <h2>Agenda de citas</h2>

            <p>
              Consulta las reservas de los trabajadores.
            </p>
          </div>
        </div>

        {/* FILTROS */}

        <div className={styles.filters}>
          <SelectField
            label="Trabajador"
            value={employeeFilter}
            onChange={(event) =>
              setEmployeeFilter(event.target.value)
            }
            options={[
              {
                value: '',
                label: 'Todos los trabajadores',
              },
              ...employees.map((employee) => ({
                value: String(employee.id),
                label:
                  `${employee.firstNames} ${employee.lastNames}`,
              })),
            ]}
          />

          <SelectField
            label="Estado"
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value)
            }
            options={[
              {
                value: '',
                label: 'Todos los estados',
              },
              ...APPOINTMENT_STATUS_OPTIONS,
            ]}
          />

          <Button
            variant="ghost"
            onClick={handleClearFilters}
          >
            Limpiar filtros
          </Button>
        </div>

        {/* LEYENDA DE ESTADOS */}

        <div className={styles.legend}>
          {Object.entries(APPOINTMENT_STATUSES).map(
            ([status, config]) => (
              <div
                key={status}
                className={styles.legendItem}
              >
                <span
                  className={styles.legendDot}
                  style={{
                    backgroundColor: config.borderColor,
                  }}
                />

                <span>{config.label}</span>
              </div>
            ),
          )}
        </div>

        {/* ERRORES */}

        {error && (
          <div className={styles.error} role="alert">
            {error}
          </div>
        )}

        {/* AGENDA */}

        {loading ? (
          <div className={styles.loading}>
            Cargando agenda de citas...
          </div>
        ) : (
          <AppointmentCalendar
            appointments={filteredAppointments}
            onAppointmentClick={(id) =>
              void handleAppointmentClick(id)
            }
            onDateClick={handleDateClick}
          />
        )}
      </section>

      {/* ========================================
          FORMULARIO REAL DE NUEVA CITA
          ======================================== */}

      <AppointmentFormModal
        open={formOpen}
        initialDate={selectedDate}
        onClose={() => setFormOpen(false)}
        onCreated={(id) =>
          void handleAppointmentCreated(id)
        }
      />

      {/* ========================================
          DETALLE DE CITA
          ======================================== */}

      <Modal
        open={detailOpen}
        title="Detalle de cita"
        onClose={() => setDetailOpen(false)}
      >
        {detailLoading && (
          <p>Cargando información...</p>
        )}

        {detailError && (
          <div className={styles.error} role="alert">
            {detailError}
          </div>
        )}

        {!detailLoading && selectedAppointment && (
          <div className={styles.detail}>

            {/* ESTADO DE CITA */}

            <div className={styles.detailHeader}>
              <h3>Cita #{selectedAppointment.id}</h3>

              <StatusBadge
                label={
                  APPOINTMENT_STATUSES[
                    selectedAppointment.status
                  ].label
                }
                variant={
                  APPOINTMENT_STATUSES[
                    selectedAppointment.status
                  ].variant
                }
              />
            </div>

            {/* INFORMACIÓN GENERAL */}

            <div className={styles.detailGrid}>
              <div>
                <span>Mascota</span>

                <strong>
                  {selectedAppointment.petName}
                </strong>
              </div>

              <div>
                <span>Trabajador</span>

                <strong>
                  {selectedAppointment.employeeName}
                </strong>
              </div>

              <div>
                <span>Inicio</span>

                <strong>
                  {dateFormatter.format(
                    new Date(selectedAppointment.startAt),
                  )}
                </strong>
              </div>

              <div>
                <span>Fin</span>

                <strong>
                  {dateFormatter.format(
                    new Date(selectedAppointment.endAt),
                  )}
                </strong>
              </div>
            </div>

            {/* SERVICIOS RESERVADOS */}

            <h4>Servicios reservados</h4>

            <div className={styles.services}>
              {selectedAppointment.services.map(
                (service) => (
                  <div
                    key={service.serviceId}
                    className={styles.serviceItem}
                  >
                    <div>
                      <strong>{service.serviceName}</strong>

                      <small>
                        {service.durationMinutes} minutos
                      </small>
                    </div>

                    <strong>
                      {currencyFormatter.format(
                        service.agreedPrice,
                      )}
                    </strong>
                  </div>
                ),
              )}
            </div>

            {/* RESUMEN ECONÓMICO */}

            <div className={styles.paymentSummary}>
              <div>
                <span>Precio reservado</span>

                <strong>
                  {currencyFormatter.format(
                    selectedAppointment.reservedPrice,
                  )}
                </strong>
              </div>

              <div>
                <span>
                  Adelanto requerido (
                  {selectedAppointment.depositPercent}%)
                </span>

                <strong>
                  {currencyFormatter.format(
                    selectedAppointment.requiredDeposit,
                  )}
                </strong>
              </div>

              {selectedAppointment.status ===
                'PENDING_PAYMENT' &&
                selectedAppointment.paymentExpiresAt && (
                  <div>
                    <span>Vencimiento del pago</span>

                    <strong>
                      {dateFormatter.format(
                        new Date(
                          selectedAppointment.paymentExpiresAt,
                        ),
                      )}
                    </strong>
                  </div>
                )}
            </div>

            {/* CERRAR DETALLE */}

            <Button
              variant="outline"
              fullWidth
              onClick={() => setDetailOpen(false)}
            >
              Cerrar
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
}
