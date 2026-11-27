import { useState } from 'react';
import type { FormEvent } from 'react';

import Button from '@/components/common/Button';
import TextField from '@/components/common/TextField';
import SelectField from '@/components/common/SelectField';


import { getRoleLabel } from '@/config/roles';

import {
    EMPLOYEE_TYPES,
    EMPLOYEE_TYPE_OPTIONS,
    getSuggestedEmployeeType,
    getEmployeeTypeLabel,
} from '@/config/employeeTypes';


import type { EmployeeType } from '@/config/employeeTypes';

import type {
    Employee,
    CreateEmployeeRequest,
} from '@/types/employee.types';

import type { User } from '@/types/user.types';

import { employeeService } from '@/services/employeeService';
import { getApiError } from '@/utils/apiError';

import styles from './EmployeeForm.module.css';

interface EmployeeFormProps {
    initialEmployee?: Employee;
    employees: Employee[];
    users: User[];
    onCancel: () => void;
    onSuccess: (message: string) => void;
    onBusyChange: (busy: boolean) => void;
}

export default function EmployeeForm({
    initialEmployee,
    employees,
    users,
    onCancel,
    onSuccess,
    onBusyChange,
}: EmployeeFormProps) {

    const isEditing = Boolean(initialEmployee);

    // ========================================
    // ESTADOS DEL FORMULARIO
    // ========================================

    const [firstNames, setFirstNames] = useState(
        initialEmployee?.firstNames ?? ''
    );

    const [lastNames, setLastNames] = useState(
        initialEmployee?.lastNames ?? ''
    );

    const [documentNumber, setDocumentNumber] = useState(
        initialEmployee?.documentNumber ?? ''
    );

    const [phone, setPhone] = useState(
        initialEmployee?.phone ?? ''
    );

    const [type, setType] = useState<EmployeeType>(
        initialEmployee?.type ?? EMPLOYEE_TYPES.VETERINARIAN
    );

    const [licenseNumber, setLicenseNumber] = useState(
        initialEmployee?.licenseNumber ?? ''
    );

    const [specialty, setSpecialty] = useState(
        initialEmployee?.specialty ?? ''
    );

    const [monthlySalary, setMonthlySalary] = useState(
        initialEmployee?.monthlySalary?.toString() ??
        (isEditing ? '' : '0')
    );

    const [userId, setUserId] = useState(
        initialEmployee?.userId?.toString() ?? ''
    );

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
// ========================================
// USUARIOS DISPONIBLES
// ========================================

const linkedUserIds = new Set(
    employees
        .filter(employee =>
            employee.id !== initialEmployee?.id &&
            employee.userId !== null
        )
        .map(employee => employee.userId)
);

const availableUsers = users.filter(user => {

    // Conservar el usuario del trabajador que editamos
    if (user.id === initialEmployee?.userId) {
        return true;
    }

    // Excluir usuarios inactivos o vinculados
    return user.isActive && !linkedUserIds.has(user.id);
});

const userOptions = [
    {
        value: '',
        label: 'Sin usuario vinculado',
    },
    ...availableUsers.map(user => ({
        value: user.id.toString(),
        label: `${user.email} — ${getRoleLabel(user.roleId)}`,
    })),
];

// ========================================
// ROL Y PUESTO SUGERIDO
// ========================================

const selectedUser = availableUsers.find(
    user => user.id.toString() === userId
);

const suggestedType = selectedUser
    ? getSuggestedEmployeeType(selectedUser.roleId)
    : null;

const hasDifferentType =
    suggestedType !== null &&
    suggestedType !== type;

// ========================================
// SELECCIONAR USUARIO
// ========================================

function handleUserChange(value: string) {

    setUserId(value);

    // Al editar conservamos el puesto laboral
    if (isEditing) return;

    const user = availableUsers.find(
        item => item.id.toString() === value
    );

    if (!user) return;

    const suggested = getSuggestedEmployeeType(
        user.roleId
    );

    if (suggested !== null) {
        setType(suggested);
    }
}

    // ========================================
    // REGISTRAR O ACTUALIZAR
    // ========================================

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (saving) return;

        setError('');

        if (!firstNames.trim() || !lastNames.trim()) {
            setError('Los nombres y apellidos son obligatorios.');
            return;
        }

        if (monthlySalary.trim() === '') {
            setError('Debe ingresar el sueldo mensual.');
            return;
        }

        const salary = Number(monthlySalary);

        if (!Number.isFinite(salary) || salary < 0) {
            setError('El sueldo mensual debe ser mayor o igual a cero.');
            return;
        }

        const request: CreateEmployeeRequest = {
            firstNames: firstNames.trim(),
            lastNames: lastNames.trim(),
            documentNumber: documentNumber.trim() || null,
            phone: phone.trim() || null,
            type,
            licenseNumber: licenseNumber.trim() || null,
            specialty: specialty.trim() || null,
            monthlySalary: salary,
            userId: userId ? Number(userId) : null,
        };

        setSaving(true);
        onBusyChange(true);

        try {
            if (initialEmployee) {
                await employeeService.update({
                    id: initialEmployee.id,
                    ...request,
                });

                onSuccess('Trabajador actualizado correctamente.');
            } else {
                await employeeService.create(request);

                onSuccess('Trabajador registrado correctamente.');
            }
        } catch (err) {
            setError(
                getApiError(
                    err,
                    'No se pudo guardar el trabajador.'
                )
            );
        } finally {
            setSaving(false);
            onBusyChange(false);
        }
    }

    // ========================================
    // FORMULARIO
    // ========================================

    return (
        <form
            className={styles.form}
            onSubmit={handleSubmit}
        >
            {error && (
                <div className={styles.error} role="alert">
                    {error}
                </div>
            )}

            <section className={styles.section}>
                <h3 className={styles.sectionTitle}>
                    Información personal
                </h3>

                <div className={styles.fields}>
                    <TextField
                        label="Nombres"
                        value={firstNames}
                        onChange={event =>
                            setFirstNames(event.target.value)
                        }
                        placeholder="Ingrese los nombres"
                        required
                        disabled={saving}
                    />

                    <TextField
                        label="Apellidos"
                        value={lastNames}
                        onChange={event =>
                            setLastNames(event.target.value)
                        }
                        placeholder="Ingrese los apellidos"
                        required
                        disabled={saving}
                    />

                    <TextField
                        label="Documento de identidad (DNI)"
                        type="text"
                        inputMode="numeric"
                        maxLength={8}
                        pattern="[0-9]{8}"
                        value={documentNumber}
                        onChange={event =>
                            setDocumentNumber(
                                event.target.value
                                    .replace(/[^0-9]/g, '')
                                    .slice(0, 8)
                            )
                        }
                        placeholder="Ingrese 8 dígitos"
                        disabled={saving}
                    />

                    <TextField
                        label="Número de celular"
                        type="tel"
                        inputMode="numeric"
                        maxLength={9}
                        pattern="[0-9]{9}"
                        value={phone}
                        onChange={event =>
                            setPhone(
                                event.target.value
                                    .replace(/[^0-9]/g, '')
                                    .slice(0, 9)
                            )
                        }
                        placeholder="Ingrese 9 dígitos"
                        disabled={saving}
                    />
                </div>
            </section>

            <section className={styles.section}>
                <h3 className={styles.sectionTitle}>
                    Información laboral
                </h3>

                <div className={styles.fields}>
                    <SelectField
                        label="Tipo de trabajador"
                        value={type}
                        options={EMPLOYEE_TYPE_OPTIONS}
                        onChange={event =>
                            setType(
                                event.target.value as EmployeeType
                            )
                        }
                        required
                        disabled={saving}
                    />

                    <TextField
                        label="Sueldo mensual (S/)"
                        type="number"
                        min="0"
                        step="0.01"
                        value={monthlySalary}
                        onChange={event =>
                            setMonthlySalary(event.target.value)
                        }
                        required
                        disabled={saving}
                    />

                    <TextField
                        label="Número de colegiatura"
                        value={licenseNumber}
                        onChange={event =>
                            setLicenseNumber(event.target.value)
                        }
                        placeholder="Opcional"
                        disabled={saving}
                    />

                    <TextField
                        label="Especialidad"
                        value={specialty}
                        onChange={event =>
                            setSpecialty(event.target.value)
                        }
                        placeholder="Ej. Cirugía veterinaria"
                        disabled={saving}
                    />
                </div>
            </section>

            <section className={styles.section}>
                <h3 className={styles.sectionTitle}>
                    Cuenta de acceso
                </h3>

                <SelectField
                    label="Usuario vinculado"
                    value={userId}
                    options={userOptions}
                    onChange={event =>
                        handleUserChange(event.target.value)
                    }
                    disabled={saving}
                />

                {selectedUser && (
                    <div className={styles.roleInfo}>
                        <span>Rol de acceso al sistema:</span>

                        <strong>
                            {getRoleLabel(selectedUser.roleId)}
                        </strong>
                    </div>
                )}

                {hasDifferentType && suggestedType && (
                    <div className={styles.roleWarning}>
                        El rol del usuario tiene como puesto sugerido
                        {' '}
                        <strong>
                            {getEmployeeTypeLabel(suggestedType)}
                        </strong>.
                        El puesto seleccionado es diferente, pero
                        los permisos del usuario no serán modificados.
                    </div>
                )}

                <p className={styles.help}>
                    Vincular un usuario es opcional.
                    El trabajador puede registrarse sin tener
                    una cuenta de acceso al sistema.
                </p>
            </section>

            <div className={styles.actions}>
                <Button
                    variant="outline"
                    onClick={onCancel}
                    disabled={saving}
                >
                    Cancelar
                </Button>

                <Button
                    type="submit"
                    loading={saving}
                >
                    {isEditing
                        ? 'Guardar cambios'
                        : 'Registrar trabajador'}
                </Button>
            </div>
        </form>
    );
}