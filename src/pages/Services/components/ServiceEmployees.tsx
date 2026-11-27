import {
    useCallback,
    useEffect,
    useState,
} from 'react';

import {
    Users,
    UserRound,
    UserPlus,
    Power,
    Info,
} from 'lucide-react';

import Button from '@/components/common/Button';
import SelectField from '@/components/common/SelectField';
import StatusBadge from '@/components/common/StatusBadge';

import { employeeService } from '@/services/employeeService';

import {
    employeeServiceAssignmentService,
} from '@/services/employeeServiceAssignmentService';

import {
    getEmployeeTypeLabel,
} from '@/config/employeeTypes';

import { getApiError } from '@/utils/apiError';

import type { Service } from '@/types/service.types';
import type { Employee } from '@/types/employee.types';

import type {
    EmployeeServiceAssignment,
} from '@/types/employeeService.types';

import styles from './ServiceEmployees.module.css';

interface ServiceEmployeesProps {
    service: Service;
    onClose: () => void;
    onBusyChange: (busy: boolean) => void;
}

export default function ServiceEmployees({
    service,
    onClose,
    onBusyChange,
}: ServiceEmployeesProps) {

    // ========================================
    // ESTADOS
    // ========================================

    const [employees, setEmployees] =
        useState<Employee[]>([]);

    const [assignments, setAssignments] =
        useState<EmployeeServiceAssignment[]>([]);

    const [employeeId, setEmployeeId] = useState('');

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [loadFailed, setLoadFailed] = useState(false);

    const [selectedAssignment, setSelectedAssignment] =
        useState<EmployeeServiceAssignment>();

    // ========================================
    // CARGAR INFORMACIÓN
    // ========================================

    const loadData = useCallback(async () => {

        setLoading(true);
        setError('');
        setLoadFailed(false);

        try {
            const [employeeData, assignmentData] =
                await Promise.all([
                    employeeService.getAll(),
                    employeeServiceAssignmentService.getAll(),
                ]);

            setEmployees(employeeData);

            setAssignments(
                assignmentData.filter(
                    assignment =>
                        assignment.serviceId === service.id
                )
            );

        } catch (err) {
            setLoadFailed(true);

            setError(
                getApiError(
                    err,
                    'No se pudieron cargar las asignaciones.'
                )
            );
        } finally {
            setLoading(false);
        }

    }, [service.id]);

    useEffect(() => {
        void loadData();
    }, [loadData]);

    // ========================================
    // TRABAJADORES DISPONIBLES
    // ========================================

    function isEligible(employee: Employee): boolean {
        return (
            service.isActive &&
            employee.isActive &&
            (
                !service.isClinical ||
                employee.type === 'VETERINARIAN'
            )
        );
    }

    const availableEmployees = employees
        .filter(employee => {

            if (!isEligible(employee)) {
                return false;
            }

            // Excluir asignaciones existentes.
            // Las deshabilitadas se reactivan desde la lista.

            const alreadyAssigned = assignments.some(
                assignment =>
                    assignment.employeeId === employee.id
            );

            return !alreadyAssigned;

        })
        .sort((a, b) =>
            `${a.firstNames} ${a.lastNames}`.localeCompare(
                `${b.firstNames} ${b.lastNames}`,
                'es'
            )
        );

    const employeeOptions = availableEmployees.map(
        employee => ({
            value: employee.id.toString(),
            label:
                `${employee.firstNames} ${employee.lastNames}` +
                ` — ${getEmployeeTypeLabel(employee.type)}`,
        })
    );

    const enabledCount = assignments.filter(
        assignment => assignment.isEnabled
    ).length;

    const availableCount = assignments.filter(
        assignment => {
            const employee = employees.find(
                item => item.id === assignment.employeeId
            );

            return (
                assignment.isEnabled &&
                employee !== undefined &&
                isEligible(employee)
            );
        }
    ).length;

    // ========================================
    // ASIGNAR TRABAJADOR
    // ========================================

    async function handleAssign() {

        if (saving || loading || loadFailed) return;

        setError('');
        setSuccess('');

        const selectedEmployee = availableEmployees.find(
            employee =>
                employee.id === Number(employeeId)
        );

        if (!selectedEmployee) {
            setError(
                'Seleccione un trabajador disponible.'
            );
            return;
        }

        setSaving(true);
        onBusyChange(true);

        try {
            await employeeServiceAssignmentService.assign({
                employeeId: selectedEmployee.id,
                serviceId: service.id,
            });

            setEmployeeId('');

            setSuccess(
                'Trabajador asignado correctamente.'
            );

            await loadData();

        } catch (err) {
            setError(
                getApiError(
                    err,
                    'No se pudo asignar el trabajador.'
                )
            );
        } finally {
            setSaving(false);
            onBusyChange(false);
        }
    }

    // ========================================
    // HABILITAR O DESHABILITAR
    // ========================================

    async function handleChangeStatus() {

        if (
            !selectedAssignment ||
            saving ||
            loading ||
            loadFailed
        ) return;

        setError('');
        setSuccess('');

        if (!selectedAssignment.isEnabled) {

            const employee = employees.find(
                item =>
                    item.id === selectedAssignment.employeeId
            );

            if (!employee || !isEligible(employee)) {
                setError(
                    'El trabajador no cumple las condiciones ' +
                    'para realizar este servicio.'
                );

                setSelectedAssignment(undefined);
                return;
            }
        }

        setSaving(true);
        onBusyChange(true);

        try {
            if (selectedAssignment.isEnabled) {

                await employeeServiceAssignmentService.disable(
                    selectedAssignment.id
                );

                setSuccess(
                    'Asignación deshabilitada correctamente.'
                );

            } else {

                await employeeServiceAssignmentService.assign({
                    employeeId: selectedAssignment.employeeId,
                    serviceId: service.id,
                });

                setSuccess(
                    'Asignación reactivada correctamente.'
                );
            }

            setSelectedAssignment(undefined);

            await loadData();

        } catch (err) {
            setError(
                getApiError(
                    err,
                    'No se pudo cambiar el estado de la asignación.'
                )
            );
        } finally {
            setSaving(false);
            onBusyChange(false);
        }
    }

    // ========================================
    // INTERFAZ
    // ========================================

    return (
        <div className={styles.container}>

            {/* INFORMACIÓN DEL SERVICIO */}

            <div className={styles.serviceSummary}>

                <div>
                    <strong>{service.name}</strong>

                    <p>
                        S/ {service.basePrice.toFixed(2)}
                        {' · '}
                        {service.durationMinutes} minutos
                    </p>
                </div>

                <StatusBadge
                    label={
                        service.isClinical
                            ? 'Clínico'
                            : 'No clínico'
                    }
                    variant={
                        service.isClinical
                            ? 'info'
                            : 'neutral'
                    }
                />

            </div>

            {error && (
                <div
                    className={styles.error}
                    role="alert"
                >
                    {error}

                    {loadFailed && (
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => void loadData()}
                            disabled={saving}
                        >
                            Reintentar
                        </Button>
                    )}
                </div>
            )}

            {success && (
                <div
                    className={styles.success}
                    role="status"
                >
                    {success}
                </div>
            )}

            {/* ASIGNAR TRABAJADOR */}

            {!loading && !loadFailed && (
                <>

                    <section className={styles.assignSection}>

                        <h3>
                            <UserPlus size={18} />
                            Asignar trabajador
                        </h3>

                        <div className={styles.assignFields}>

                            <SelectField
                                label="Trabajador"
                                placeholder="Seleccionar trabajador"
                                value={employeeId}
                                options={employeeOptions}
                                onChange={event =>
                                    setEmployeeId(event.target.value)
                                }
                                disabled={
                                    saving ||
                                    !service.isActive ||
                                    availableEmployees.length === 0
                                }
                            />

                            <Button
                                leftIcon={<UserPlus size={16} />}
                                onClick={() => void handleAssign()}
                                loading={saving && !selectedAssignment}
                                disabled={
                                    saving ||
                                    !employeeId ||
                                    !service.isActive ||
                                    Boolean(selectedAssignment)
                                }
                            >
                                Asignar
                            </Button>

                        </div>

                        <div className={styles.information}>

                            <Info size={18} />

                            <span>
                                {!service.isActive
                                    ? 'El servicio está inactivo. No se permiten nuevas asignaciones ni reactivaciones.'
                                    : service.isClinical
                                        ? 'Solo se pueden asignar veterinarios activos a servicios clínicos.'
                                        : 'Se pueden asignar trabajadores activos a este servicio.'}
                            </span>

                        </div>

                        {service.isActive &&
                            availableEmployees.length === 0 && (
                                <p className={styles.empty}>
                                    No hay nuevos trabajadores
                                    disponibles para asignar.
                                </p>
                            )}

                    </section>

                    {/* LISTADO DE ASIGNACIONES */}

                    <section className={styles.listSection}>

                        <div className={styles.listHeader}>

                            <h3>
                                <Users size={18} />
                                Trabajadores asignados
                            </h3>

                            <span>
                                {enabledCount} habilitados
                            </span>

                        </div>

                        <p className={styles.availability}>
                            {availableCount} trabajadores activos
                            y aptos según su tipo laboral.
                        </p>

                        {assignments.length === 0 ? (

                            <div className={styles.emptyState}>
                                <Users size={32} />

                                <strong>
                                    Sin trabajadores asignados
                                </strong>

                                <p>
                                    Selecciona un trabajador
                                    para comenzar.
                                </p>
                            </div>

                        ) : (

                            <div className={styles.employeeList}>

                                {assignments.map(assignment => {

                                    const employee = employees.find(
                                        item =>
                                            item.id === assignment.employeeId
                                    );

                                    const canReactivate =
                                        employee !== undefined &&
                                        isEligible(employee);

                                    return (
                                        <div
                                            key={assignment.id}
                                            className={styles.employeeRow}
                                        >

                                            <div className={styles.avatar}>
                                                <UserRound size={20} />
                                            </div>

                                            <div className={styles.employeeInfo}>

                                                <strong>
                                                    {assignment.employeeName ||
                                                        `Trabajador #${assignment.employeeId}`}
                                                </strong>

                                                <span>
                                                    {employee
                                                        ? getEmployeeTypeLabel(
                                                            employee.type
                                                        )
                                                        : 'Trabajador no disponible'}
                                                </span>

                                                {employee &&
                                                    !employee.isActive && (
                                                        <small className={styles.warning}>
                                                            Trabajador inactivo
                                                        </small>
                                                    )}

                                                {employee &&
                                                    service.isClinical &&
                                                    employee.type !== 'VETERINARIAN' && (
                                                        <small className={styles.warning}>
                                                            No apto para servicio clínico
                                                        </small>
                                                    )}

                                            </div>

                                            <StatusBadge
                                                label={
                                                    assignment.isEnabled
                                                        ? 'Habilitado'
                                                        : 'Deshabilitado'
                                                }
                                                variant={
                                                    assignment.isEnabled
                                                        ? 'success'
                                                        : 'neutral'
                                                }
                                            />

                                            <button
                                                type="button"
                                                className={
                                                    assignment.isEnabled
                                                        ? styles.disableButton
                                                        : styles.enableButton
                                                }
                                                title={
                                                    assignment.isEnabled
                                                        ? 'Deshabilitar asignación'
                                                        : 'Reactivar asignación'
                                                }
                                                aria-label={
                                                    assignment.isEnabled
                                                        ? 'Deshabilitar asignación'
                                                        : 'Reactivar asignación'
                                                }
                                                disabled={
                                                    saving ||
                                                    Boolean(selectedAssignment) ||
                                                    (
                                                        !assignment.isEnabled &&
                                                        !canReactivate
                                                    )
                                                }
                                                onClick={() => {
                                                    setError('');
                                                    setSuccess('');
                                                    setSelectedAssignment(
                                                        assignment
                                                    );
                                                }}
                                            >
                                                <Power size={17} />
                                            </button>

                                        </div>
                                    );
                                })}

                            </div>
                        )}

                    </section>

                </>
            )}

            {loading && (
                <p className={styles.empty}>
                    Cargando trabajadores...
                </p>
            )}

            {/* CONFIRMAR CAMBIO DE ESTADO */}

            {selectedAssignment && (
                <div className={styles.confirmation}>

                    <strong>
                        {selectedAssignment.isEnabled
                            ? 'Deshabilitar asignación'
                            : 'Reactivar asignación'}
                    </strong>

                    <p>
                        ¿Deseas{' '}
                        {selectedAssignment.isEnabled
                            ? 'deshabilitar'
                            : 'reactivar'}
                        {' la asignación de '}
                        {selectedAssignment.employeeName}
                        {' para este servicio?'}
                    </p>

                    <div className={styles.confirmActions}>

                        <Button
                            variant="outline"
                            size="sm"
                            disabled={saving}
                            onClick={() =>
                                setSelectedAssignment(undefined)
                            }
                        >
                            Cancelar
                        </Button>

                        <Button
                            size="sm"
                            variant={
                                selectedAssignment.isEnabled
                                    ? 'danger'
                                    : 'primary'
                            }
                            loading={saving}
                            disabled={loading || loadFailed}
                            onClick={() =>
                                void handleChangeStatus()
                            }
                        >
                            Confirmar
                        </Button>

                    </div>

                </div>
            )}

            <div className={styles.footer}>
                <Button
                    variant="outline"
                    onClick={onClose}
                    disabled={saving}
                >
                    Cerrar
                </Button>
            </div>

        </div>
    );
}