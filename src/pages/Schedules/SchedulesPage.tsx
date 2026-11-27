import { useCallback, useEffect, useState } from 'react';

import {
    Plus,
    Clock,
    UsersRound,
    CalendarDays,
    Pencil,
    Trash2,
} from 'lucide-react';

import Button from '@/components/common/Button';
import PageHeader from '@/components/common/PageHeader';
import StatCard from '@/components/common/StatCard';
import DataTable from '@/components/common/DataTable';
import type { Column } from '@/components/common/DataTable';
import SelectField from '@/components/common/SelectField';
import Modal from '@/components/common/Modal';
import ConfirmDialog from '@/components/common/ConfirmDialog';

import WeeklySchedule from './components/WeeklySchedule';
import ScheduleForm from './components/ScheduleForm';

import { employeeService } from '@/services/employeeService';
import { employeeScheduleService } from '@/services/employeeScheduleService';

import type { Employee } from '@/types/employee.types';

import type {
    EmployeeSchedule,
    Weekday,
} from '@/types/employeeSchedule.types';

import {
    WEEK_DAY_OPTIONS,
    getWeekdayLabel,
} from '@/config/weekDays';

import { getEmployeeTypeLabel } from '@/config/employeeTypes';
import { formatScheduleTime } from '@/utils/scheduleTime';
import { getApiError } from '@/utils/apiError';

import styles from './SchedulesPage.module.css';

export default function SchedulesPage() {

    // ========================================
    // ESTADOS
    // ========================================

    const [employees, setEmployees] = useState<Employee[]>([]);
    const [schedules, setSchedules] = useState<EmployeeSchedule[]>([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [employeeFilter, setEmployeeFilter] = useState('');
    const [dayFilter, setDayFilter] = useState('');

    const [formOpen, setFormOpen] = useState(false);
    const [formBusy, setFormBusy] = useState(false);

    const [editingSchedule, setEditingSchedule] =
        useState<EmployeeSchedule>();

    const [defaultWeekday, setDefaultWeekday] =
        useState<Weekday>(1);

    const [selectedSchedule, setSelectedSchedule] =
        useState<EmployeeSchedule>();

    const [confirmBusy, setConfirmBusy] = useState(false);
    const [confirmError, setConfirmError] = useState('');

    // ========================================
    // CARGAR INFORMACIÓN
    // ========================================

    const loadSchedules = useCallback(async () => {

        setLoading(true);
        setError('');

        try {
            const [employeeData, scheduleData] =
                await Promise.all([
                    employeeService.getAll(),
                    employeeScheduleService.getAll(),
                ]);

            setEmployees(employeeData);
            setSchedules(scheduleData);

            setEmployeeFilter(current => {

                const activeEmployees = employeeData.filter(
                    employee => employee.isActive
                );

                if (
                    activeEmployees.some(
                        employee =>
                            employee.id.toString() === current
                    )
                ) {
                    return current;
                }

                return activeEmployees[0]?.id.toString() ?? '';
            });

        } catch (err) {
            setError(
                getApiError(
                    err,
                    'No se pudieron cargar los horarios.'
                )
            );
        } finally {
            setLoading(false);
        }

    }, []);

    useEffect(() => {
        void loadSchedules();
    }, [loadSchedules]);

    // ========================================
    // TRABAJADORES Y FILTROS
    // ========================================

    const activeEmployees = employees.filter(
        employee => employee.isActive
    );

    const employeeOptions = activeEmployees.map(employee => ({
        value: employee.id.toString(),
        label:
            `${employee.firstNames} ${employee.lastNames}` +
            ` — ${getEmployeeTypeLabel(employee.type)}`,
    }));

    const filteredSchedules = schedules.filter(schedule => {

        const matchesEmployee =
            !employeeFilter ||
            schedule.employeeId === Number(employeeFilter);

        const matchesDay =
            !dayFilter ||
            schedule.weekday === Number(dayFilter);

        return matchesEmployee && matchesDay;
    });

    const selectedEmployee = activeEmployees.find(
        employee => employee.id === Number(employeeFilter)
    );

    // ========================================
    // ESTADÍSTICAS
    // ========================================

    const assignedEmployees = activeEmployees.filter(
        employee =>
            schedules.some(
                schedule => schedule.employeeId === employee.id
            )
    ).length;

    const unassignedEmployees =
        activeEmployees.length - assignedEmployees;

    // ========================================
    // REGISTRAR Y EDITAR
    // ========================================

    function handleCreate(weekday: Weekday = 1) {
        setSuccess('');
        setEditingSchedule(undefined);
        setDefaultWeekday(weekday);
        setFormOpen(true);
    }

    function handleEdit(schedule: EmployeeSchedule) {
        setSuccess('');
        setEditingSchedule(schedule);
        setFormOpen(true);
    }

    function handleCloseForm() {
        if (formBusy) return;

        setFormOpen(false);
        setEditingSchedule(undefined);
    }

    function handleFormSuccess(message: string) {
        setFormOpen(false);
        setEditingSchedule(undefined);
        setSuccess(message);

        void loadSchedules();
    }

    // ========================================
    // ELIMINAR HORARIO
    // ========================================

    function handleDelete(schedule: EmployeeSchedule) {
        setSuccess('');
        setConfirmError('');
        setSelectedSchedule(schedule);
    }

    async function confirmDelete() {

        if (!selectedSchedule || confirmBusy) return;

        setConfirmBusy(true);
        setConfirmError('');

        try {
            await employeeScheduleService.remove(
                selectedSchedule.id
            );

            setSelectedSchedule(undefined);
            setSuccess('Horario eliminado correctamente.');

            await loadSchedules();

        } catch (err) {
            setConfirmError(
                getApiError(
                    err,
                    'No se pudo eliminar el horario.'
                )
            );
        } finally {
            setConfirmBusy(false);
        }
    }

    // ========================================
    // COLUMNAS
    // ========================================

    const columns: Column<EmployeeSchedule>[] = [
        {
            key: 'employee',
            header: 'Trabajador',
            render: schedule => {

                const employee = employees.find(
                    item => item.id === schedule.employeeId
                );

                return employee
                    ? `${employee.firstNames} ${employee.lastNames}`
                    : `Trabajador #${schedule.employeeId}`;
            },
        },
        {
            key: 'weekday',
            header: 'Día',
            render: schedule =>
                getWeekdayLabel(schedule.weekday),
        },
        {
            key: 'startAt',
            header: 'Entrada',
            render: schedule =>
                formatScheduleTime(schedule.startAt),
        },
        {
            key: 'endAt',
            header: 'Salida',
            render: schedule =>
                formatScheduleTime(schedule.endAt),
        },
        {
            key: 'actions',
            header: 'Acciones',
            align: 'center',
            render: schedule => (
                <div className={styles.rowActions}>

                    <button
                        type="button"
                        className={styles.editButton}
                        title="Editar horario"
                        aria-label="Editar horario"
                        onClick={() => handleEdit(schedule)}
                    >
                        <Pencil size={17} />
                    </button>

                    <button
                        type="button"
                        className={styles.deleteButton}
                        title="Eliminar horario"
                        aria-label="Eliminar horario"
                        onClick={() => handleDelete(schedule)}
                    >
                        <Trash2 size={17} />
                    </button>

                </div>
            ),
        },
    ];

    // ========================================
    // INTERFAZ
    // ========================================

    return (
        <div className={styles.page}>

            <PageHeader
                title="Horarios"
                description="Gestiona las jornadas laborales del personal."
                actions={
                    <Button
                        leftIcon={<Plus size={18} />}
                        onClick={() => handleCreate()}
                        disabled={
                            loading ||
                            Boolean(error) ||
                            activeEmployees.length === 0
                        }
                    >
                        Nuevo horario
                    </Button>
                }
            />

            {success && (
                <div
                    className={styles.success}
                    role="status"
                >
                    {success}
                </div>
            )}

            {error && (
                <div
                    className={styles.error}
                    role="alert"
                >
                    <span>{error}</span>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => void loadSchedules()}
                    >
                        Reintentar
                    </Button>
                </div>
            )}

            <div className={styles.stats}>

                <StatCard
                    label="Turnos registrados"
                    value={schedules.length}
                    description="Jornadas laborales"
                    icon={Clock}
                    variant="primary"
                />

                <StatCard
                    label="Trabajadores con horario"
                    value={assignedEmployees}
                    description="Personal activo asignado"
                    icon={UsersRound}
                    variant="success"
                />

                <StatCard
                    label="Sin horario asignado"
                    value={unassignedEmployees}
                    description="Trabajadores activos pendientes"
                    icon={CalendarDays}
                    variant="warning"
                />

            </div>

            {!error && (
                <>
                    <section className={styles.panel}>

                        <div className={styles.employeeSelector}>
                            <SelectField
                                label="Seleccionar trabajador"
                                value={employeeFilter}
                                options={employeeOptions}
                                placeholder="Seleccione un trabajador"
                                onChange={event =>
                                    setEmployeeFilter(
                                        event.target.value
                                    )
                                }
                                disabled={loading}
                            />
                        </div>

                        {loading ? (
                            <p className={styles.empty}>
                                Cargando horarios...
                            </p>
                        ) : selectedEmployee ? (
                            <WeeklySchedule
                                employeeId={selectedEmployee.id}
                                schedules={schedules}
                                onCreate={handleCreate}
                                onEdit={handleEdit}
                            />
                        ) : (
                            <p className={styles.empty}>
                                No hay trabajadores activos disponibles.
                            </p>
                        )}

                    </section>

                    <section className={styles.panel}>

                        <div className={styles.tableHeader}>
                            <div>
                                <h3 className={styles.title}>
                                    Listado de horarios
                                </h3>

                                <p className={styles.description}>
                                    Consulta y administra los turnos
                                    registrados.
                                </p>
                            </div>

                            <SelectField
                                label="Filtrar por día"
                                value={dayFilter}
                                options={[
                                    {
                                        value: '',
                                        label: 'Todos los días',
                                    },
                                    ...WEEK_DAY_OPTIONS,
                                ]}
                                onChange={event =>
                                    setDayFilter(event.target.value)
                                }
                                disabled={loading}
                            />
                        </div>

                        {loading ? (
                            <p className={styles.empty}>
                                Cargando registros...
                            </p>
                        ) : (
                            <>
                                <DataTable
                                    columns={columns}
                                    data={filteredSchedules}
                                    rowKey={schedule => schedule.id}
                                    emptyMessage="No se encontraron horarios registrados."
                                    ariaLabel="Horarios de trabajadores"
                                />

                                <p className={styles.results}>
                                    {filteredSchedules.length}{' '}
                                    horarios encontrados
                                </p>
                            </>
                        )}

                    </section>
                </>
            )}

            <Modal
                open={formOpen}
                title={
                    editingSchedule
                        ? 'Editar horario'
                        : 'Asignar horario laboral'
                }
                description="Configura el día y las horas de trabajo."
                onClose={handleCloseForm}
                busy={formBusy}
            >
                {formOpen && (
                    <ScheduleForm
                        key={editingSchedule?.id ?? 'new'}
                        employees={employees}
                        schedules={schedules}
                        initialSchedule={editingSchedule}
                        defaultEmployeeId={
                            employeeFilter
                                ? Number(employeeFilter)
                                : undefined
                        }
                        defaultWeekday={defaultWeekday}
                        onCancel={handleCloseForm}
                        onSuccess={handleFormSuccess}
                        onBusyChange={setFormBusy}
                    />
                )}
            </Modal>

            <ConfirmDialog
                open={Boolean(selectedSchedule)}
                title="Eliminar horario"
                description={
                    selectedSchedule
                        ? `¿Deseas eliminar el turno del ${
                            getWeekdayLabel(
                                selectedSchedule.weekday
                            )
                        } de ${
                            formatScheduleTime(
                                selectedSchedule.startAt
                            )
                        } a ${
                            formatScheduleTime(
                                selectedSchedule.endAt
                            )
                        }? Esta acción no se puede deshacer.`
                        : ''
                }
                confirmLabel="Eliminar horario"
                variant="danger"
                loading={confirmBusy}
                error={confirmError}
                onConfirm={() => void confirmDelete()}
                onCancel={() => {
                    if (!confirmBusy) {
                        setSelectedSchedule(undefined);
                    }
                }}
            />

        </div>
    );
}