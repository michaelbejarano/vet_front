import { useState } from 'react';
import type { FormEvent } from 'react';
import { Clock } from 'lucide-react';

import Button from '@/components/common/Button';
import TextField from '@/components/common/TextField';
import SelectField from '@/components/common/SelectField';

import { WEEK_DAY_OPTIONS } from '@/config/weekDays';

import type { Employee } from '@/types/employee.types';

import type {
    EmployeeSchedule,
    CreateEmployeeScheduleRequest,
    Weekday,
} from '@/types/employeeSchedule.types';

import { employeeScheduleService } from '@/services/employeeScheduleService';

import {
    formatScheduleTime,
    toApiTime,
    timeToSeconds,
    hasTimeOverlap,
} from '@/utils/scheduleTime';

import { getApiError } from '@/utils/apiError';

import styles from './ScheduleForm.module.css';

interface ScheduleFormProps {
    employees: Employee[];
    schedules: EmployeeSchedule[];

    initialSchedule?: EmployeeSchedule;
    defaultEmployeeId?: number;
    defaultWeekday?: Weekday;

    onCancel: () => void;
    onSuccess: (message: string) => void;
    onBusyChange: (busy: boolean) => void;
}

export default function ScheduleForm({
    employees,
    schedules,
    initialSchedule,
    defaultEmployeeId,
    defaultWeekday,
    onCancel,
    onSuccess,
    onBusyChange,
}: ScheduleFormProps) {

    const isEditing = Boolean(initialSchedule);

    // ========================================
    // ESTADOS
    // ========================================

    const [employeeId, setEmployeeId] = useState(
        (
            initialSchedule?.employeeId ??
            defaultEmployeeId ??
            ''
        ).toString()
    );

    const [weekday, setWeekday] = useState<Weekday>(
        initialSchedule?.weekday ??
        defaultWeekday ??
        1
    );

    const [startAt, setStartAt] = useState(
        initialSchedule
            ? formatScheduleTime(initialSchedule.startAt)
            : '08:00'
    );

    const [endAt, setEndAt] = useState(
        initialSchedule
            ? formatScheduleTime(initialSchedule.endAt)
            : '12:00'
    );

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    // ========================================
    // TRABAJADORES DISPONIBLES
    // ========================================

    const availableEmployees = employees.filter(
        employee => employee.isActive
    );

    const employeeOptions = availableEmployees.map(
        employee => ({
            value: employee.id.toString(),
            label: `${employee.firstNames} ${employee.lastNames}`,
        })
    );

    // ========================================
    // VALIDACIÓN DE SUPERPOSICIONES
    // ========================================

    const conflictingSchedule = schedules.find(
        schedule =>
            schedule.employeeId === Number(employeeId) &&
            schedule.weekday === weekday &&
            schedule.id !== initialSchedule?.id &&
            hasTimeOverlap(
                startAt,
                endAt,
                schedule.startAt,
                schedule.endAt
            )
    );

    // ========================================
    // DURACIÓN DE LA JORNADA
    // ========================================

    const durationMinutes =
        startAt && endAt
            ? (
                timeToSeconds(endAt) -
                timeToSeconds(startAt)
            ) / 60
            : 0;

    const durationHours = Math.floor(
        durationMinutes / 60
    );

    const remainingMinutes = Math.floor(
        durationMinutes % 60
    );

    // ========================================
    // GUARDAR HORARIO
    // ========================================

    async function handleSubmit(
        event: FormEvent<HTMLFormElement>
    ) {
        event.preventDefault();

        if (saving) return;

        setError('');

        if (
            !employeeId ||
            !availableEmployees.some(
                employee => employee.id === Number(employeeId)
            )
        ) {
            setError('Seleccione un trabajador activo.');
            return;
        }

        if (!startAt || !endAt) {
            setError('Ingrese las horas de entrada y salida.');
            return;
        }

        if (timeToSeconds(startAt) >= timeToSeconds(endAt)) {
            setError(
                'La hora de entrada debe ser menor que la hora de salida.'
            );
            return;
        }

        if (conflictingSchedule) {
            setError(
                'El trabajador ya tiene un horario que se superpone.'
            );
            return;
        }

        const request: CreateEmployeeScheduleRequest = {
            employeeId: Number(employeeId),
            weekday,
            startAt: toApiTime(startAt),
            endAt: toApiTime(endAt),
        };

        setSaving(true);
        onBusyChange(true);

        try {
            if (initialSchedule) {
                await employeeScheduleService.update({
                    id: initialSchedule.id,
                    ...request,
                });

                onSuccess(
                    'Horario actualizado correctamente.'
                );
            } else {
                await employeeScheduleService.create(request);

                onSuccess(
                    'Horario registrado correctamente.'
                );
            }
        } catch (err) {
            setError(
                getApiError(
                    err,
                    'No se pudo guardar el horario.'
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
                <div
                    className={styles.error}
                    role="alert"
                >
                    {error}
                </div>
            )}

            <SelectField
                label="Trabajador"
                value={employeeId}
                options={employeeOptions}
                placeholder="Seleccione un trabajador"
                onChange={event =>
                    setEmployeeId(event.target.value)
                }
                required
                disabled={saving}
            />

            <SelectField
                label="Día de la semana"
                value={weekday}
                options={WEEK_DAY_OPTIONS}
                onChange={event =>
                    setWeekday(
                        Number(event.target.value) as Weekday
                    )
                }
                required
                disabled={saving}
            />

            <div className={styles.timeFields}>
                <TextField
                    label="Hora de entrada"
                    type="time"
                    value={startAt}
                    onChange={event =>
                        setStartAt(event.target.value)
                    }
                    required
                    disabled={saving}
                />

                <TextField
                    label="Hora de salida"
                    type="time"
                    value={endAt}
                    onChange={event =>
                        setEndAt(event.target.value)
                    }
                    required
                    disabled={saving}
                />
            </div>

            {durationMinutes > 0 && (
                <div className={styles.duration}>
                    <Clock size={18} />

                    <span>
                        Duración de la jornada:{' '}
                        <strong>
                            {durationHours} h{' '}
                            {remainingMinutes} min
                        </strong>
                    </span>
                </div>
            )}

            {conflictingSchedule && durationMinutes > 0 && (
                <div
                    className={styles.warning}
                    role="alert"
                >
                    El turno se superpone con el horario de{' '}
                    <strong>
                        {formatScheduleTime(
                            conflictingSchedule.startAt
                        )}
                        {' - '}
                        {formatScheduleTime(
                            conflictingSchedule.endAt
                        )}
                    </strong>.
                </div>
            )}

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
                    disabled={
                        !employeeId ||
                        durationMinutes <= 0 ||
                        Boolean(conflictingSchedule)
                    }
                >
                    {isEditing
                        ? 'Guardar cambios'
                        : 'Registrar horario'}
                </Button>
            </div>
        </form>
    );
}