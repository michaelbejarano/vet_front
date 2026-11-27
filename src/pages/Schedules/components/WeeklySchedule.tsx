import { Plus, Pencil, Clock } from 'lucide-react';

import { WEEK_DAYS } from '@/config/weekDays';

import type {
    EmployeeSchedule,
    Weekday,
} from '@/types/employeeSchedule.types';

import {
    formatScheduleTime,
    timeToSeconds,
} from '@/utils/scheduleTime';

import styles from './WeeklySchedule.module.css';

interface WeeklyScheduleProps {
    schedules: EmployeeSchedule[];
    employeeId: number;
    onCreate: (weekday: Weekday) => void;
    onEdit: (schedule: EmployeeSchedule) => void;
}

export default function WeeklySchedule({
    schedules,
    employeeId,
    onCreate,
    onEdit,
}: WeeklyScheduleProps) {

    const employeeSchedules = schedules.filter(
        schedule => schedule.employeeId === employeeId
    );

    const totalMinutes = employeeSchedules.reduce(
        (total, schedule) =>
            total +
            (
                timeToSeconds(schedule.endAt) -
                timeToSeconds(schedule.startAt)
            ) / 60,
        0
    );

    const totalHours = Math.floor(totalMinutes / 60);
    const remainingMinutes = Math.floor(totalMinutes % 60);

    return (
        <div className={styles.container}>

            <div className={styles.header}>
                <div>
                    <h3 className={styles.title}>
                        Horario laboral semanal
                    </h3>

                    <p className={styles.description}>
                        Selecciona un día para asignar un turno
                        o pulsa un horario para editarlo.
                    </p>
                </div>

                <div className={styles.totalHours}>
                    <Clock size={18} />

                    <span>
                        {totalHours} h {remainingMinutes} min / semana
                    </span>
                </div>
            </div>

            <div className={styles.scrollContainer}>
                <div className={styles.calendar}>

                    {WEEK_DAYS.map(day => {

                        const daySchedules = employeeSchedules
                            .filter(
                                schedule =>
                                    schedule.weekday === day.value
                            )
                            .sort(
                                (a, b) =>
                                    timeToSeconds(a.startAt) -
                                    timeToSeconds(b.startAt)
                            );

                        return (
                            <div
                                key={day.value}
                                className={styles.day}
                            >
                                <div className={styles.dayHeader}>
                                    {day.label}
                                </div>

                                <div className={styles.dayContent}>

                                    {daySchedules.map(schedule => (
                                        <button
                                            key={schedule.id}
                                            type="button"
                                            className={styles.shift}
                                            onClick={() =>
                                                onEdit(schedule)
                                            }
                                            title="Editar horario"
                                        >
                                            <div className={styles.shiftHeader}>
                                                <Clock size={14} />
                                                <Pencil size={13} />
                                            </div>

                                            <strong>
                                                {formatScheduleTime(
                                                    schedule.startAt
                                                )}
                                            </strong>

                                            <span>hasta</span>

                                            <strong>
                                                {formatScheduleTime(
                                                    schedule.endAt
                                                )}
                                            </strong>
                                        </button>
                                    ))}

                                    {daySchedules.length === 0 ? (
                                        <button
                                            type="button"
                                            className={styles.emptyDay}
                                            onClick={() =>
                                                onCreate(day.value)
                                            }
                                        >
                                            <Plus size={22} />

                                            <strong>Libre</strong>

                                            <span>
                                                Asignar horario
                                            </span>
                                        </button>
                                    ) : (
                                        <button
                                            type="button"
                                            className={styles.addShift}
                                            onClick={() =>
                                                onCreate(day.value)
                                            }
                                        >
                                            <Plus size={16} />
                                            Agregar turno
                                        </button>
                                    )}

                                </div>
                            </div>
                        );
                    })}

                </div>
            </div>

            <div className={styles.legend}>
                <span>
                    <i className={styles.assignedIndicator} />
                    Jornada asignada
                </span>

                <span>
                    <i className={styles.freeIndicator} />
                    Sin horario asignado
                </span>
            </div>

        </div>
    );
}