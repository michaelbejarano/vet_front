
import { useEffect, useState } from 'react';

import {
  Clock,
  Wallet,
  CalendarClock,
  Stethoscope,
  UserX,
  XCircle,
  CheckCircle2,
} from 'lucide-react';

import Modal from '../../../../components/common/Modal';
import Button from '../../../../components/common/Button';
import StatusBadge from '../../../../components/common/StatusBadge';

import { appointmentService } from '../../../../services/appointmentService';
import { APPOINTMENT_STATUSES } from '../../../../config/appointmentStatuses';
import { getApiError } from '../../../../utils/apiError';

import type {
  AppointmentDetail,
} from '../../../../types/appointment.types';

import styles from './AppointmentDetailModal.module.css';

interface AppointmentDetailModalProps {
  open: boolean;
  appointmentId: number | null;
  onClose: () => void;
  onUpdated: () => void;
  onDeposit?: (appointment: AppointmentDetail) => void;
  onReschedule?: (appointment: AppointmentDetail) => void;
  onManageVisit?: (appointment: AppointmentDetail) => void;
}

type AppointmentAction =
  | 'cancel'
  | 'no-show'
  | 'start'
  | 'complete';

const currencyFormatter = new Intl.NumberFormat('es-PE', {
  style: 'currency',
  currency: 'PEN',
});

const dateFormatter = new Intl.DateTimeFormat('es-PE', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'America/Lima',
});

const ACTION_CONFIG = {
  cancel: {
    title: 'Cancelar cita',
    description:
      '¿Estás seguro de cancelar esta cita? Si existe un adelanto registrado, no será reembolsado.',
    button: 'Confirmar cancelación',
  },
  'no-show': {
    title: 'Registrar inasistencia',
    description:
      'La cita será marcada como no asistida y el adelanto no será reembolsado.',
    button: 'Confirmar inasistencia',
  },
  start: {
    title: 'Iniciar atención',
    description:
      'Se iniciará la atención y se registrarán los servicios reservados.',
    button: 'Iniciar atención',
  },
  complete: {
    title: 'Finalizar atención',
    description:
      'Verifica que los servicios y las consultas requeridas estén completados.',
    button: 'Finalizar atención',
  },
};

function formatCountdown(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return (
    `${String(minutes).padStart(2, '0')}:` +
    `${String(remainingSeconds).padStart(2, '0')}`
  );
}

export default function AppointmentDetailModal({
  open,
  appointmentId,
  onClose,
  onUpdated,
  onDeposit,
  onReschedule,
  onManageVisit,
}: AppointmentDetailModalProps) {
  const [appointment, setAppointment] =
    useState<AppointmentDetail | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [action, setAction] =
    useState<AppointmentAction | null>(null);

  const [now, setNow] = useState(Date.now);

  // ========================================
  // CARGAR DETALLE
  // ========================================

  useEffect(() => {
    if (!open || appointmentId === null) return;

    let active = true;

    setAppointment(null);
    setError('');
    setSuccess('');
    setAction(null);
    setLoading(true);
    setNow(Date.now());

    async function loadDetail(id: number) {
      try {
        const result =
          await appointmentService.getById(id);

        if (active) {
          setAppointment(result);
        }
      } catch (err) {
        if (active) {
          setError(
            getApiError(
              err,
              'No se pudo cargar el detalle de la cita.',
            ),
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadDetail(appointmentId);

    return () => {
      active = false;
    };
  }, [open, appointmentId]);

  // ========================================
  // RELOJ
  // ========================================

  useEffect(() => {
    if (!open) return;

    const interval = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => {
      window.clearInterval(interval);
    };
  }, [open]);

  // ========================================
  // ESTADOS Y VENCIMIENTO
  // ========================================

  const isPending =
    appointment?.status === 'PENDING_PAYMENT';

  const isConfirmed =
    appointment?.status === 'CONFIRMED';

  const isInProgress =
    appointment?.status === 'IN_PROGRESS';

  const startTime = appointment
    ? new Date(appointment.startAt).getTime()
    : 0;

  const endTime = appointment
    ? new Date(appointment.endAt).getTime()
    : 0;

  const expirationTime = appointment?.paymentExpiresAt
    ? Math.min(
        new Date(appointment.paymentExpiresAt).getTime(),
        startTime,
      )
    : startTime;

  const remainingSeconds = isPending
    ? Math.max(
        0,
        Math.ceil((expirationTime - now) / 1000),
      )
    : 0;

  const paymentExpired =
    isPending && remainingSeconds === 0;

  const canDeposit =
    isPending && !paymentExpired;

  const canCancel =
    isConfirmed || (isPending && !paymentExpired);

  const canReschedule =
    isConfirmed && now < startTime;

  const canStart =
    isConfirmed && now >= startTime && now < endTime;

  const canMarkNoShow =
    isConfirmed && now >= endTime;

  const isFinal =
    appointment?.status === 'COMPLETED' ||
    appointment?.status === 'CANCELLED' ||
    appointment?.status === 'NO_SHOW' ||
    appointment?.status === 'EXPIRED';

  // ========================================
  // ACTUALIZAR DETALLE
  // ========================================

  async function refreshDetail() {
    if (appointmentId === null || saving) return;

    setLoading(true);
    setError('');

    try {
      const result =
        await appointmentService.getById(appointmentId);

      setAppointment(result);
      setNow(Date.now());
      onUpdated();
    } catch (err) {
      setError(
        getApiError(
          err,
          'No se pudo actualizar la cita.',
        ),
      );
    } finally {
      setLoading(false);
    }
  }

  // ========================================
  // SELECCIONAR ACCIÓN
  // ========================================

  function requestAction(value: AppointmentAction) {
    setError('');
    setSuccess('');
    setAction(value);
  }

  // ========================================
  // EJECUTAR ACCIÓN
  // ========================================

  async function executeAction() {
    if (!appointment || !action || saving) return;

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      switch (action) {
        case 'cancel':
          await appointmentService.cancel(appointment.id);
          break;

        case 'no-show':
          await appointmentService.markNoShow(appointment.id);
          break;

        case 'start':
          await appointmentService.start(appointment.id);
          break;

        case 'complete':
          await appointmentService.complete(appointment.id);
          break;
      }

      setAction(null);
      setSuccess('La operación se realizó correctamente.');

      onUpdated();

      try {
        const updated =
          await appointmentService.getById(appointment.id);

        setAppointment(updated);
        setNow(Date.now());
      } catch {
        setAppointment(null);

        setError(
          'La operación fue registrada, pero no se pudo actualizar el detalle. Pulsa Actualizar estado.',
        );
      }
    } catch (err) {
      setError(
        getApiError(
          err,
          'No se pudo realizar la operación.',
        ),
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      title="Detalle de cita"
      busy={saving || loading}
      onClose={onClose}
    >
      <div className={styles.detail}>

        {loading && (
          <div className={styles.loading}>
            Cargando información...
          </div>
        )}

        {error && (
          <div className={styles.error} role="alert">
            {error}
          </div>
        )}

        {success && (
          <div className={styles.success} role="status">
            <CheckCircle2 size={18} />
            <span>{success}</span>
          </div>
        )}

        {!loading && !appointment && (
          <Button
            variant="outline"
            fullWidth
            disabled={saving}
            onClick={() => void refreshDetail()}
          >
            Actualizar estado
          </Button>
        )}

        {!loading && appointment && (
          <>
            {/* ENCABEZADO */}

            <div className={styles.detailHeader}>
              <h3>Cita #{appointment.id}</h3>

              <StatusBadge
                label={
                  APPOINTMENT_STATUSES[
                    appointment.status
                  ].label
                }
                variant={
                  APPOINTMENT_STATUSES[
                    appointment.status
                  ].variant
                }
              />
            </div>

            {/* INFORMACIÓN GENERAL */}

            <div className={styles.detailGrid}>
              <div>
                <span>Mascota</span>
                <strong>{appointment.petName}</strong>
              </div>

              <div>
                <span>Trabajador</span>
                <strong>{appointment.employeeName}</strong>
              </div>

              <div>
                <span>Inicio</span>
                <strong>
                  {dateFormatter.format(
                    new Date(appointment.startAt),
                  )}
                </strong>
              </div>

              <div>
                <span>Fin</span>
                <strong>
                  {dateFormatter.format(
                    new Date(appointment.endAt),
                  )}
                </strong>
              </div>
            </div>

            {/* SERVICIOS */}

            <section className={styles.section}>
              <h4>Servicios reservados</h4>

              <div className={styles.services}>
                {appointment.services.map((service) => (
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
                ))}
              </div>
            </section>

            {/* RESUMEN ECONÓMICO */}

            <section className={styles.paymentSummary}>
              <h4>Resumen económico</h4>

              <div className={styles.paymentRow}>
                <span>Precio reservado</span>

                <strong>
                  {currencyFormatter.format(
                    appointment.reservedPrice,
                  )}
                </strong>
              </div>

              <div className={styles.paymentRow}>
                <span>
                  Adelanto requerido (
                  {appointment.depositPercent}%)
                </span>

                <strong>
                  {currencyFormatter.format(
                    appointment.requiredDeposit,
                  )}
                </strong>
              </div>

              {(isPending || isConfirmed || isInProgress) && (
                <div className={styles.paymentRow}>
                  <span>Saldo tras aplicar adelanto</span>

                  <strong>
                    {currencyFormatter.format(
                      appointment.reservedPrice -
                        appointment.requiredDeposit,
                    )}
                  </strong>
                </div>
              )}

              {isPending && (
                <div className={styles.paymentRow}>
                  <span>Vencimiento del pago</span>

                  <strong>
                    {dateFormatter.format(
                      new Date(expirationTime),
                    )}
                  </strong>
                </div>
              )}
            </section>

            {/* CONTADOR DE VENCIMIENTO */}

            {isPending && (
              <div
                className={`${styles.countdown} ${
                  paymentExpired
                    ? styles.countdownExpired
                    : ''
                }`}
              >
                <Clock size={23} />

                <div>
                  <span>
                    {paymentExpired
                      ? 'Plazo de pago vencido'
                      : 'Tiempo restante para pagar'}
                  </span>

                  <strong>
                    {formatCountdown(remainingSeconds)}
                  </strong>
                </div>
              </div>
            )}

            {paymentExpired && (
              <div className={styles.notice}>
                El plazo de pago terminó. Actualiza el estado
                para consultar si el servidor ya expiró la cita.
              </div>
            )}

            {/* ACCIONES SEGÚN ESTADO */}

            {!action && (
              <section className={styles.section}>
                <h4>Acciones disponibles</h4>

                <div className={styles.actions}>

                  {canDeposit && (
                    <>
                      <Button
                        fullWidth
                        disabled={saving || !onDeposit}
                        leftIcon={<Wallet size={18} />}
                        onClick={() =>
                          onDeposit?.(appointment)
                        }
                      >
                        Registrar adelanto
                      </Button>

                      {!onDeposit && (
                        <p className={styles.help}>
                          Pendiente de integración con caja.
                        </p>
                      )}
                    </>
                  )}

                  {isConfirmed && (
                    <>
                      <Button
                        fullWidth
                        disabled={saving || !canStart}
                        leftIcon={<Stethoscope size={18} />}
                        onClick={() =>
                          requestAction('start')
                        }
                      >
                        Iniciar atención
                      </Button>

                      {now < startTime && (
                        <p className={styles.help}>
                          Disponible desde la hora de inicio
                          de la cita.
                        </p>
                      )}

                      {now >= endTime && (
                        <p className={styles.help}>
                          El horario de la cita terminó.
                        </p>
                      )}
                    </>
                  )}

                  {canReschedule && (
                    <>
                      <Button
                        variant="outline"
                        fullWidth
                        disabled={saving || !onReschedule}
                        leftIcon={<CalendarClock size={18} />}
                        onClick={() =>
                          onReschedule?.(appointment)
                        }
                      >
                        Reprogramar cita
                      </Button>

                      {!onReschedule && (
                        <p className={styles.help}>
                          Formulario de reprogramación pendiente.
                        </p>
                      )}
                    </>
                  )}

                  {canCancel && (
                    <Button
                      variant="danger"
                      fullWidth
                      disabled={saving}
                      leftIcon={<XCircle size={18} />}
                      onClick={() =>
                        requestAction('cancel')
                      }
                    >
                      Cancelar cita
                    </Button>
                  )}

                  {canMarkNoShow && (
                    <Button
                      variant="outline"
                      fullWidth
                      disabled={saving}
                      leftIcon={<UserX size={18} />}
                      onClick={() =>
                        requestAction('no-show')
                      }
                    >
                      Marcar no asistió
                    </Button>
                  )}

                  {isInProgress && (
                    <>
                      <Button
                        fullWidth
                        disabled={saving || !onManageVisit}
                        leftIcon={<Stethoscope size={18} />}
                        onClick={() =>
                          onManageVisit?.(appointment)
                        }
                      >
                        Gestionar atención
                      </Button>

                      <Button
                        variant="outline"
                        fullWidth
                        disabled={saving}
                        leftIcon={<CheckCircle2 size={18} />}
                        onClick={() =>
                          requestAction('complete')
                        }
                      >
                        Finalizar atención
                      </Button>
                    </>
                  )}

                  {isFinal && (
                    <div className={styles.notice}>
                      La cita se encuentra en un estado final.
                      No se permiten más cambios.
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* CONFIRMACIÓN DE OPERACIÓN */}

            {action && (
              <section className={styles.confirmation}>
                <h4>{ACTION_CONFIG[action].title}</h4>

                <p>{ACTION_CONFIG[action].description}</p>

                <div className={styles.confirmationActions}>
                  <Button
                    variant="outline"
                    disabled={saving}
                    onClick={() => {
                      setAction(null);
                      setError('');
                    }}
                  >
                    Volver
                  </Button>

                  <Button
                    variant={
                      action === 'cancel' ||
                      action === 'no-show'
                        ? 'danger'
                        : 'primary'
                    }
                    loading={saving}
                    disabled={saving}
                    onClick={() => void executeAction()}
                  >
                    {ACTION_CONFIG[action].button}
                  </Button>
                </div>
              </section>
            )}
          </>
        )}

        {/* ACCIONES GENERALES */}

        {!loading && !action && (
          <div className={styles.footer}>
            {appointment && (
              <Button
                variant="outline"
                fullWidth
                disabled={saving}
                onClick={() => void refreshDetail()}
              >
                Actualizar estado
              </Button>
            )}

            <Button
              variant="ghost"
              fullWidth
              disabled={saving}
              onClick={onClose}
            >
              Cerrar
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
}
