import type { Weekday } from '@/types/employeeSchedule.types';

export const WEEK_DAYS = [
    { value: 1, label: 'Lunes', shortLabel: 'Lun' },
    { value: 2, label: 'Martes', shortLabel: 'Mar' },
    { value: 3, label: 'Miércoles', shortLabel: 'Mié' },
    { value: 4, label: 'Jueves', shortLabel: 'Jue' },
    { value: 5, label: 'Viernes', shortLabel: 'Vie' },
    { value: 6, label: 'Sábado', shortLabel: 'Sáb' },
    { value: 7, label: 'Domingo', shortLabel: 'Dom' },
] as const;

export const WEEK_DAY_OPTIONS = WEEK_DAYS.map(day => ({
    value: day.value,
    label: day.label,
}));

export function getWeekdayLabel(weekday: Weekday): string {
    return WEEK_DAYS.find(day => day.value === weekday)?.label
        ?? 'Día desconocido';
}