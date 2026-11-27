
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

import AppointmentCalendar from './components/AppointmentCalendar';
import AppointmentFormModal from './components/AppointmentFormModal';
import AppointmentDetailModal from './components/AppointmentDetailModal';

import { appointmentService } from '../../services/appointmentService';
import { employeeService } from '../../services/employeeService';

import {
  APPOINTMENT_STATUSES,
  APPOINTMENT_STATUS_OPTIONS,
} from '../../config/appointmentStatuses';

import { getApiError } from '../../utils/apiError';

import type {
  Appointment,
} from '../../types/appointment.types';

import type {
  Employee,
} from '../../types/employee.types';

import styles from './AppointmentsPage.module.css';

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

  const [detailOpen, setDetailOpen] =
    useState(false);

  const [selectedAppointmentId, setSelectedAppointmentId] =
    useState<number | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');

  // ========================================
  // CARGAR DATOS
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
  // ACTUALIZAR CITAS
  // ========================================

  async function refreshAppointments() {
    try {
      const result =
        await appointmentService.getAll();

      setAppointments(result);
      setError('');
    } catch (err) {
      setError(
        getApiError(
          err,
          'No se pudo actualizar la agenda.',
        ),
      );
    }
  }

  // ========================================
  // FILTROS
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
  // ABRIR DETALLE
  // ========================================

  function handleAppointmentClick(id: number) {
    setSelectedAppointmentId(id);
    setDetailOpen(true);
  }

  function handleCloseDetail() {
    setDetailOpen(false);
    setSelectedAppointmentId(null);
  }

  // ========================================
  // NUEVA CITA
  // ========================================

  function handleDateClick(date: string) {
    setSelectedDate(date);
    setFormOpen(true);
  }

  function handleNewAppointment() {
    setSelectedDate('');
    setFormOpen(true);
  }

  // ========================================
  // CITA REGISTRADA
  // ========================================

  async function handleAppointmentCreated(id: number) {
    setFormOpen(false);
    setSelectedDate('');
    setEmployeeFilter('');
    setStatusFilter('');

    await refreshAppointments();

    handleAppointmentClick(id);
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

        {/* LEYENDA */}

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
            onAppointmentClick={handleAppointmentClick}
            onDateClick={handleDateClick}
          />
        )}
      </section>

      {/* FORMULARIO DE RESERVA */}

      <AppointmentFormModal
        open={formOpen}
        initialDate={selectedDate}
        onClose={() => setFormOpen(false)}
        onCreated={(id) =>
          void handleAppointmentCreated(id)
        }
      />

      {/* DETALLE Y ACCIONES DE CITA */}

      <AppointmentDetailModal
        open={detailOpen}
        appointmentId={selectedAppointmentId}
        onClose={handleCloseDetail}
        onUpdated={() => void refreshAppointments()}
      />
    </div>
  );
}
