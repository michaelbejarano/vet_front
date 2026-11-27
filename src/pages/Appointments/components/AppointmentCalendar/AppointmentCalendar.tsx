
import { useMemo } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import luxonPlugin from '@fullcalendar/luxon3';

import esLocale from '@fullcalendar/core/locales/es';

import type {
  EventInput,
  EventClickArg,
} from '@fullcalendar/core';

import type { DateClickArg } from '@fullcalendar/interaction';

import {
  APPOINTMENT_STATUSES,
  APPOINTMENT_TIME_ZONE,
} from '../../../../config/appointmentStatuses';

import type {
  Appointment,
} from '../../../../types/appointment.types';

import styles from './AppointmentCalendar.module.css';

interface AppointmentCalendarProps {
  appointments: Appointment[];
  onAppointmentClick: (appointmentId: number) => void;
  onDateClick: (date: string) => void;
}

export default function AppointmentCalendar({
  appointments,
  onAppointmentClick,
  onDateClick,
}: AppointmentCalendarProps) {
  const events = useMemo<EventInput[]>(() => {
    return appointments.map((appointment) => {
      const status =
        APPOINTMENT_STATUSES[appointment.status];

      return {
        id: String(appointment.id),

        title:
          `${appointment.petName} · ${appointment.employeeName}`,

        start: appointment.startAt,
        end: appointment.endAt,

        backgroundColor: status.backgroundColor,
        borderColor: status.borderColor,
        textColor: status.color,

        allDay: false,

        extendedProps: {
          appointmentId: appointment.id,
          petName: appointment.petName,
          employeeName: appointment.employeeName,
          statusLabel: status.label,
          status: appointment.status,
        },
      };
    });
  }, [appointments]);

  function handleEventClick(info: EventClickArg) {
    onAppointmentClick(Number(info.event.id));
  }

  function handleDateClick(info: DateClickArg) {
    onDateClick(info.dateStr);
  }

  return (
    <div className={styles.calendar}>
      <FullCalendar
        plugins={[
          dayGridPlugin,
          timeGridPlugin,
          interactionPlugin,
          listPlugin,
          luxonPlugin,
        ]}
        locale={esLocale}
        timeZone={APPOINTMENT_TIME_ZONE}
        initialView="timeGridWeek"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek',
        }}
        buttonText={{
          today: 'Hoy',
          month: 'Mes',
          week: 'Semana',
          day: 'Día',
          list: 'Lista',
        }}
        events={events}
        firstDay={1}
        weekends={true}
        nowIndicator={true}
        allDaySlot={false}
        slotDuration="00:15:00"
        slotLabelInterval="01:00:00"
        slotMinTime="00:00:00"
        slotMaxTime="24:00:00"
        scrollTime="08:00:00"
        slotLabelFormat={{
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        }}
        eventTimeFormat={{
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        }}
        height="auto"
        dayMaxEvents={3}
        editable={false}
        selectable={false}
        eventClick={handleEventClick}
        dateClick={handleDateClick}
        eventContent={(info) => (
          <div className={styles.eventContent}>
            {info.timeText && (
              <span className={styles.eventTime}>
                {info.timeText}
              </span>
            )}

            <strong className={styles.eventTitle}>
              {info.event.extendedProps.petName}
            </strong>

            <span className={styles.eventEmployee}>
              {info.event.extendedProps.employeeName}
            </span>

            <span className={styles.eventStatus}>
              {info.event.extendedProps.statusLabel}
            </span>
          </div>
        )}
      />
    </div>
  );
}
