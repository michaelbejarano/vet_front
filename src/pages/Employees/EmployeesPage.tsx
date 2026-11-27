import { useCallback, useEffect, useState } from 'react';

import {
    Plus,
    UsersRound,
    UserCheck,
    UserX,
    Pencil,
} from 'lucide-react';

import Button from '@/components/common/Button';
import PageHeader from '@/components/common/PageHeader';
import StatCard from '@/components/common/StatCard';
import DataTable from '@/components/common/DataTable';
import type { Column } from '@/components/common/DataTable';
import StatusBadge from '@/components/common/StatusBadge';
import TextField from '@/components/common/TextField';
import SelectField from '@/components/common/SelectField';
import Modal from '@/components/common/Modal';
import ConfirmDialog from '@/components/common/ConfirmDialog';

import EmployeeForm from './components/EmployeeForm';

import { employeeService } from '@/services/employeeService';
import { userService } from '@/services/userService';

import {
    EMPLOYEE_TYPE_OPTIONS,
    getEmployeeTypeLabel,
} from '@/config/employeeTypes';

import type { Employee } from '@/types/employee.types';
import type { User } from '@/types/user.types';

import { getApiError } from '@/utils/apiError';

import styles from './EmployeesPage.module.css';

const currencyFormatter = new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
});

export default function EmployeesPage() {

    // ========================================
    // ESTADOS
    // ========================================

    const [employees, setEmployees] = useState<Employee[]>([]);
    const [users, setUsers] = useState<User[]>([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');

    const [formOpen, setFormOpen] = useState(false);
    const [formBusy, setFormBusy] = useState(false);

    const [editingEmployee, setEditingEmployee] =
        useState<Employee | undefined>();

    const [selectedEmployee, setSelectedEmployee] =
        useState<Employee | null>(null);

    const [confirmBusy, setConfirmBusy] = useState(false);
    const [confirmError, setConfirmError] = useState('');

    // ========================================
    // CARGAR DATOS
    // ========================================

    const loadEmployees = useCallback(async () => {
        setLoading(true);
        setError('');

        try {
            const [employeeData, userData] = await Promise.all([
                employeeService.getAll(),
                userService.getAll(),
            ]);

            setEmployees(employeeData);
            setUsers(userData);
        } catch (err) {
            setError(
                getApiError(
                    err,
                    'No se pudieron cargar los trabajadores.'
                )
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadEmployees();
    }, [loadEmployees]);

    // ========================================
    // INDICADORES
    // ========================================

    const totalEmployees = employees.length;

    const activeEmployees = employees.filter(
        employee => employee.isActive
    ).length;

    const inactiveEmployees =
        totalEmployees - activeEmployees;

    // ========================================
    // FILTROS
    // ========================================

    const filteredEmployees = employees.filter(employee => {
        const query = search.trim().toLowerCase();

        const fullName =
            `${employee.firstNames} ${employee.lastNames}`
                .toLowerCase();

        const matchesSearch =
            fullName.includes(query) ||
            (employee.documentNumber ?? '')
                .toLowerCase().includes(query) ||
            (employee.phone ?? '').includes(query);

        const matchesType =
            typeFilter === 'all' ||
            employee.type === typeFilter;

        const matchesStatus =
            statusFilter === 'all' ||
            (statusFilter === 'active' && employee.isActive) ||
            (statusFilter === 'inactive' && !employee.isActive);

        return matchesSearch && matchesType && matchesStatus;
    });

    // ========================================
    // ABRIR FORMULARIOS
    // ========================================

    function handleCreate() {
        setEditingEmployee(undefined);
        setSuccess('');
        setFormOpen(true);
    }

    function handleEdit(employee: Employee) {
        if (employee.monthlySalary == null) {
            setError(
                'No se pudo recuperar el sueldo del trabajador.'
            );
            return;
        }

        setEditingEmployee(employee);
        setSuccess('');
        setFormOpen(true);
    }

    function handleCloseForm() {
        if (formBusy) return;

        setFormOpen(false);
        setEditingEmployee(undefined);
    }

    function handleFormSuccess(message: string) {
        setFormOpen(false);
        setEditingEmployee(undefined);
        setSuccess(message);

        setSearch('');
        setTypeFilter('all');
        setStatusFilter('all');

        void loadEmployees();
    }

    // ========================================
    // ACTIVAR Y DESACTIVAR
    // ========================================

    function handleChangeStatus(employee: Employee) {
        setSelectedEmployee(employee);
        setConfirmError('');
        setSuccess('');
    }

    function handleCancelConfirm() {
        if (confirmBusy) return;

        setSelectedEmployee(null);
        setConfirmError('');
    }

    async function handleConfirmStatus() {
        if (!selectedEmployee || confirmBusy) return;

        setConfirmBusy(true);
        setConfirmError('');

        try {
            if (selectedEmployee.isActive) {
                await employeeService.remove(
                    selectedEmployee.id
                );

                setSuccess(
                    'Trabajador desactivado correctamente.'
                );
            } else {
                await employeeService.activate(
                    selectedEmployee.id
                );

                setSuccess(
                    'Trabajador reactivado correctamente.'
                );
            }

            setSelectedEmployee(null);

            await loadEmployees();
        } catch (err) {
            setConfirmError(
                getApiError(
                    err,
                    'No se pudo cambiar el estado del trabajador.'
                )
            );
        } finally {
            setConfirmBusy(false);
        }
    }

    // ========================================
    // COLUMNAS DE LA TABLA
    // ========================================

    const columns: Column<Employee>[] = [
        {
            key: 'employee',
            header: 'Trabajador',
            render: employee => (
                <div className={styles.employeeInfo}>
                    <span className={styles.employeeName}>
                        {employee.firstNames} {employee.lastNames}
                    </span>

                    <span className={styles.secondaryText}>
                        {employee.documentNumber ?? 'Sin documento'}
                    </span>
                </div>
            ),
        },
        {
            key: 'type',
            header: 'Tipo',
            render: employee =>
                getEmployeeTypeLabel(employee.type),
        },
        {
            key: 'phone',
            header: 'Teléfono',
            render: employee => employee.phone || '—',
        },
        {
            key: 'specialty',
            header: 'Especialidad',
            render: employee => employee.specialty || '—',
        },
        {
            key: 'salary',
            header: 'Sueldo mensual',
            align: 'right',
            render: employee => (
                <span className={styles.salary}>
                    {employee.monthlySalary == null
                        ? '—'
                        : currencyFormatter.format(
                            employee.monthlySalary
                        )}
                </span>
            ),
        },
        {
            key: 'status',
            header: 'Estado',
            render: employee => (
                <StatusBadge
                    label={
                        employee.isActive
                            ? 'Activo'
                            : 'Inactivo'
                    }
                    variant={
                        employee.isActive
                            ? 'success'
                            : 'danger'
                    }
                />
            ),
        },
        {
            key: 'actions',
            header: 'Acciones',
            align: 'center',
            render: employee => (
                <div className={styles.rowActions}>
                    <button
                        type="button"
                        className={styles.editButton}
                        title="Editar trabajador"
                        aria-label="Editar trabajador"
                        onClick={() => handleEdit(employee)}
                    >
                        <Pencil size={17} />
                    </button>

                    <button
                        type="button"
                        className={
                            employee.isActive
                                ? styles.deactivateButton
                                : styles.activateButton
                        }
                        title={
                            employee.isActive
                                ? 'Desactivar trabajador'
                                : 'Reactivar trabajador'
                        }
                        aria-label={
                            employee.isActive
                                ? 'Desactivar trabajador'
                                : 'Reactivar trabajador'
                        }
                        onClick={() =>
                            handleChangeStatus(employee)
                        }
                    >
                        {employee.isActive
                            ? <UserX size={17} />
                            : <UserCheck size={17} />}
                    </button>
                </div>
            ),
        },
    ];

    // ========================================
    // VISTA PRINCIPAL
    // ========================================

    return (
        <div className={styles.page}>

            <PageHeader
                title="Trabajadores"
                description="Gestiona el personal de la clínica veterinaria."
                actions={
                    <Button
                        leftIcon={<Plus size={18} />}
                        onClick={handleCreate}
                        disabled={loading || Boolean(error)}
                    >
                        Nuevo trabajador
                    </Button>
                }
            />

            {success && (
                <div className={styles.success} role="status">
                    {success}
                </div>
            )}

            {error && (
                <div className={styles.error} role="alert">
                    <span>{error}</span>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => void loadEmployees()}
                    >
                        Reintentar
                    </Button>
                </div>
            )}

            <div className={styles.stats}>
                <StatCard
                    label="Total trabajadores"
                    value={loading ? '—' : totalEmployees}
                    description="Personal registrado"
                    icon={UsersRound}
                    variant="primary"
                />

                <StatCard
                    label="Trabajadores activos"
                    value={loading ? '—' : activeEmployees}
                    description="Personal habilitado"
                    icon={UserCheck}
                    variant="success"
                />

                <StatCard
                    label="Trabajadores inactivos"
                    value={loading ? '—' : inactiveEmployees}
                    description="Personal deshabilitado"
                    icon={UserX}
                    variant="warning"
                />
            </div>

            <section className={styles.section}>
                <div className={styles.sectionHeader}>
                    <h2>Listado de trabajadores</h2>

                    <p>
                        Consulta y administra el personal registrado.
                    </p>
                </div>

                <div className={styles.filters}>
                    <TextField
                        label="Buscar trabajador"
                        placeholder="Nombre, documento o teléfono..."
                        value={search}
                        onChange={event =>
                            setSearch(event.target.value)
                        }
                    />

                    <SelectField
                        label="Tipo de trabajador"
                        value={typeFilter}
                        onChange={event =>
                            setTypeFilter(event.target.value)
                        }
                        options={[
                            {
                                value: 'all',
                                label: 'Todos los tipos',
                            },
                            ...EMPLOYEE_TYPE_OPTIONS,
                        ]}
                    />

                    <SelectField
                        label="Estado"
                        value={statusFilter}
                        onChange={event =>
                            setStatusFilter(event.target.value)
                        }
                        options={[
                            {
                                value: 'all',
                                label: 'Todos los estados',
                            },
                            {
                                value: 'active',
                                label: 'Activos',
                            },
                            {
                                value: 'inactive',
                                label: 'Inactivos',
                            },
                        ]}
                    />
                </div>

                {loading ? (
                    <div className={styles.loading}>
                        Cargando trabajadores...
                    </div>
                ) : (
                    <DataTable
                        columns={columns}
                        data={filteredEmployees}
                        rowKey={employee => employee.id}
                        ariaLabel="Listado de trabajadores"
                        emptyMessage="No se encontraron trabajadores."
                    />
                )}

                {!loading && !error && (
                    <p className={styles.results}>
                        Mostrando {filteredEmployees.length} de{' '}
                        {totalEmployees} trabajadores.
                    </p>
                )}
            </section>

            <Modal
                open={formOpen}
                title={
                    editingEmployee
                        ? 'Editar trabajador'
                        : 'Nuevo trabajador'
                }
                description={
                    editingEmployee
                        ? 'Actualiza la información del trabajador.'
                        : 'Completa los datos del nuevo trabajador.'
                }
                busy={formBusy}
                onClose={handleCloseForm}
            >
                {formOpen && (
                    <EmployeeForm
                        key={editingEmployee?.id ?? 'new'}
                        initialEmployee={editingEmployee}
                        employees={employees}
                        users={users}
                        onCancel={handleCloseForm}
                        onSuccess={handleFormSuccess}
                        onBusyChange={setFormBusy}
                    />
                )}
            </Modal>

            <ConfirmDialog
                open={selectedEmployee !== null}
                title={
                    selectedEmployee?.isActive
                        ? 'Desactivar trabajador'
                        : 'Reactivar trabajador'
                }
                description={
                    selectedEmployee?.isActive
                        ? `¿Deseas desactivar a ${selectedEmployee.firstNames} ${selectedEmployee.lastNames}?`
                        : `¿Deseas reactivar a ${selectedEmployee?.firstNames ?? ''} ${selectedEmployee?.lastNames ?? ''}?`
                }
                confirmLabel={
                    selectedEmployee?.isActive
                        ? 'Desactivar'
                        : 'Reactivar'
                }
                variant={
                    selectedEmployee?.isActive
                        ? 'danger'
                        : 'primary'
                }
                loading={confirmBusy}
                error={confirmError}
                onConfirm={handleConfirmStatus}
                onCancel={handleCancelConfirm}
            />
        </div>
    );
}