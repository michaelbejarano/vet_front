
import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  History,
  CalendarDays,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  ArrowDownLeft,
  ArrowUpRight,
  Wallet,
} from 'lucide-react';

import Button from '@/components/common/Button';
import StatusBadge from '@/components/common/StatusBadge';

import { getApiError } from '@/utils/apiError';

import {
  cashService,
} from '@/services/cashService';

import type {
  CashRegister,
  CashSession,
  CashSummary,
  CashMovement,
  CashSessionFilters,
} from '@/services/cashService';

import styles from './CashHistory.module.css';

interface CashHistoryProps {
  registers: CashRegister[];
  refreshKey: number;
}

type StatusFilter = 'ALL' | 'OPEN' | 'CLOSED';

const TIME_ZONE = 'America/Lima';

const currencyFormatter = new Intl.NumberFormat('es-PE', {
  style: 'currency',
  currency: 'PEN',
});

function money(value: number): string {
  return currencyFormatter.format(value);
}

function formatDate(value: string | null): string {
  if (!value) return 'Sin registrar';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Fecha no disponible';
  }

  return new Intl.DateTimeFormat('es-PE', {
    timeZone: TIME_ZONE,
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

function getDayKey(value: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(value));
}

function getDayTitle(value: string): string {
  return new Intl.DateTimeFormat('es-PE', {
    timeZone: TIME_ZONE,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(value));
}

function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    DEPOSIT: 'Ingreso externo',
    EXPENSE: 'Egreso externo',
    WITHDRAWAL: 'Retiro de efectivo',
    ADJUSTMENT: 'Ajuste de caja',
  };

  return labels[category] ?? category;
}

function getMethodLabel(method: string): string {
  const labels: Record<string, string> = {
    CASH: 'Efectivo',
    YAPE: 'Yape',
    PLIN: 'Plin',
    CARD: 'Tarjeta',
    BANK_TRANSFER: 'Transferencia',
  };

  return labels[method] ?? method;
}

export default function CashHistory({
  registers,
  refreshKey,
}: CashHistoryProps) {
  const [sessions, setSessions] = useState<CashSession[]>([]);

  const [registerFilter, setRegisterFilter] = useState('');
  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>('ALL');

  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const [listRefresh, setListRefresh] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [selectedId, setSelectedId] = useState<number | null>(null);

  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');
  const [detailRefresh, setDetailRefresh] = useState(0);

  const [summary, setSummary] = useState<CashSummary | null>(null);
  const [movements, setMovements] = useState<CashMovement[]>([]);

  const invalidRange = Boolean(
    fromDate && toDate && fromDate > toDate
  );

  useEffect(() => {
    let active = true;

    if (invalidRange) {
      setSessions([]);
      setError('La fecha inicial no puede ser posterior a la final.');
      setLoading(false);

      return () => {
        active = false;
      };
    }

    async function loadSessions() {
      setLoading(true);
      setError('');

      const filters: CashSessionFilters = {
        cashRegisterId: registerFilter
          ? Number(registerFilter)
          : undefined,

        status: statusFilter === 'ALL'
          ? undefined
          : statusFilter,

        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
      };

      try {
        const result = await cashService.getSessions(filters);

        if (!active) return;

        setSessions(result);
      } catch (err) {
        if (!active) return;

        setSessions([]);

        setError(
          getApiError(
            err,
            'No se pudo consultar el historial de cajas.'
          )
        );
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadSessions();

    return () => {
      active = false;
    };
  }, [
    registerFilter,
    statusFilter,
    fromDate,
    toDate,
    invalidRange,
    listRefresh,
    refreshKey,
  ]);

  useEffect(() => {
    if (selectedId === null) {
      setSummary(null);
      setMovements([]);
      setDetailError('');
      return;
    }

    let active = true;
    const sessionId = selectedId;

    async function loadDetails() {
      setDetailLoading(true);
      setDetailError('');
      setSummary(null);
      setMovements([]);

      try {
        const [resultSummary, resultMovements] =
          await Promise.all([
            cashService.getSummary(sessionId),
            cashService.getMovements(sessionId),
          ]);

        if (!active) return;

        setSummary(resultSummary);
        setMovements(resultMovements);
      } catch (err) {
        if (!active) return;

        setDetailError(
          getApiError(
            err,
            'No se pudo consultar el detalle de esta sesión.'
          )
        );
      } finally {
        if (active) setDetailLoading(false);
      }
    }

    void loadDetails();

    return () => {
      active = false;
    };
  }, [selectedId, detailRefresh, refreshKey]);

  const groupedDays = useMemo(() => {
    const orderedSessions = [...sessions].sort(
      (a, b) =>
        new Date(b.openedAt).getTime() -
        new Date(a.openedAt).getTime()
    );

    const groups = new Map<string, CashSession[]>();

    for (const session of orderedSessions) {
      const day = getDayKey(session.openedAt);
      const existing = groups.get(day) ?? [];

      existing.push(session);
      groups.set(day, existing);
    }

    return Array.from(groups.entries()).map(([key, items]) => ({
      key,
      title: getDayTitle(items[0].openedAt),
      sessions: items,
    }));
  }, [sessions]);

  const openCount = sessions.filter(
    session => session.status === 'OPEN'
  ).length;

  const closedCount = sessions.filter(
    session => session.status === 'CLOSED'
  ).length;

  function getRegisterName(registerId: number): string {
    const register = registers.find(
      item => item.id === registerId
    );

    return register?.name ?? `Caja #${registerId}`;
  }

  function changeRegister(value: string) {
    setRegisterFilter(value);
    setSelectedId(null);
  }

  function changeStatus(value: StatusFilter) {
    setStatusFilter(value);
    setSelectedId(null);
  }

  function clearFilters() {
    setRegisterFilter('');
    setStatusFilter('ALL');
    setFromDate('');
    setToDate('');
    setSelectedId(null);
  }

  function toggleDetails(sessionId: number) {
    setSelectedId(current =>
      current === sessionId ? null : sessionId
    );
  }

  return (
    <section className={styles.history}>
      <div className={styles.header}>
        <div>
          <h2>
            <History size={23} />
            Historial de cajas
          </h2>

          <p>
            Revisa las aperturas, cierres, ingresos y egresos
            registrados por día.
          </p>
        </div>

        <Button
          variant="outline"
          leftIcon={<RefreshCw size={17} />}
          disabled={loading}
          onClick={() => setListRefresh(value => value + 1)}
        >
          Actualizar historial
        </Button>
      </div>

      <div className={styles.filters}>
        <label className={styles.field}>
          Caja
          <select
            value={registerFilter}
            onChange={event =>
              changeRegister(event.target.value)
            }
          >
            <option value="">Todas las cajas</option>

            {registers.map(register => (
              <option
                key={register.id}
                value={register.id}
              >
                {register.name}
              </option>
            ))}
          </select>
        </label>

        <label className={styles.field}>
          Estado
          <select
            value={statusFilter}
            onChange={event =>
              changeStatus(event.target.value as StatusFilter)
            }
          >
            <option value="ALL">Todos los estados</option>
            <option value="OPEN">Abiertas</option>
            <option value="CLOSED">Cerradas</option>
          </select>
        </label>

        <label className={styles.field}>
          Desde
          <input
            type="date"
            value={fromDate}
            onChange={event => {
              setFromDate(event.target.value);
              setSelectedId(null);
            }}
          />
        </label>

        <label className={styles.field}>
          Hasta
          <input
            type="date"
            value={toDate}
            onChange={event => {
              setToDate(event.target.value);
              setSelectedId(null);
            }}
          />
        </label>
      </div>

      <div className={styles.filterActions}>
        <button
          type="button"
          onClick={clearFilters}
        >
          Limpiar filtros
        </button>
      </div>

      {error && (
        <div className={styles.error} role="alert">
          {error}
        </div>
      )}

      {!loading && !error && (
        <div className={styles.stats}>
          <div className={styles.stat}>
            <span>Sesiones registradas</span>
            <strong>{sessions.length}</strong>
          </div>

          <div className={styles.stat}>
            <span>Sesiones abiertas</span>
            <strong>{openCount}</strong>
          </div>

          <div className={styles.stat}>
            <span>Sesiones cerradas</span>
            <strong>{closedCount}</strong>
          </div>

          <div className={styles.stat}>
            <span>Días con actividad</span>
            <strong>{groupedDays.length}</strong>
          </div>
        </div>
      )}

      {loading && (
        <p className={styles.message}>
          Cargando historial de cajas...
        </p>
      )}

      {!loading && !error && sessions.length === 0 && (
        <div className={styles.empty}>
          <CalendarDays size={38} />

          <h3>Sin sesiones registradas</h3>

          <p>
            No existen aperturas de caja para los filtros
            seleccionados.
          </p>
        </div>
      )}

      {!loading && !error && (
        <div className={styles.days}>
          {groupedDays.map(day => (
            <div
              key={day.key}
              className={styles.dayGroup}
            >
              <div className={styles.dayHeader}>
                <CalendarDays size={18} />

                <strong>{day.title}</strong>

                <span>
                  {day.sessions.length}
                  {day.sessions.length === 1
                    ? ' sesión'
                    : ' sesiones'}
                </span>
              </div>

              {day.sessions.map(session => (
                <article
                  key={session.id}
                  className={styles.session}
                >
                  <div className={styles.sessionTop}>
                    <div>
                      <strong>
                        {getRegisterName(
                          session.cashRegisterId
                        )}
                      </strong>

                      <p>Sesión #{session.id}</p>
                    </div>

                    <StatusBadge
                      label={
                        session.status === 'OPEN'
                          ? 'Abierta'
                          : 'Cerrada'
                      }
                      variant={
                        session.status === 'OPEN'
                          ? 'success'
                          : 'neutral'
                      }
                    />
                  </div>

                  <div className={styles.sessionGrid}>
                    <div>
                      <span>Fecha de apertura</span>
                      <strong>
                        {formatDate(session.openedAt)}
                      </strong>
                    </div>

                    <div>
                      <span>Fecha de cierre</span>
                      <strong>
                        {formatDate(session.closedAt)}
                      </strong>
                    </div>

                    <div>
                      <span>Fondo inicial</span>
                      <strong>
                        {money(session.openingFloat)}
                      </strong>
                    </div>

                    <div>
                      <span>Efectivo contado</span>
                      <strong>
                        {session.countedCash === null
                          ? 'Pendiente'
                          : money(session.countedCash)}
                      </strong>
                    </div>
                  </div>

                  <div className={styles.sessionFooter}>
                    <span>
                      Abierta por usuario #
                      {session.openedByUserId}

                      {session.closedByUserId !== null && (
                        <>
                          {' · Cerrada por usuario #'}
                          {session.closedByUserId}
                        </>
                      )}
                    </span>

                    <Button
                      size="sm"
                      variant="outline"
                      leftIcon={
                        selectedId === session.id
                          ? <ChevronUp size={16} />
                          : <ChevronDown size={16} />
                      }
                      onClick={() =>
                        toggleDetails(session.id)
                      }
                    >
                      {selectedId === session.id
                        ? 'Ocultar detalle'
                        : 'Ver detalle'}
                    </Button>
                  </div>

                  {selectedId === session.id && (
                    <div className={styles.detail}>
                      <div className={styles.detailHeader}>
                        <h3>
                          Detalle de sesión #{session.id}
                        </h3>

                        <Button
                          variant="outline"
                          size="sm"
                          disabled={detailLoading}
                          onClick={() =>
                            setDetailRefresh(
                              value => value + 1
                            )
                          }
                        >
                          Actualizar detalle
                        </Button>
                      </div>

                      {detailLoading && (
                        <p className={styles.message}>
                          Cargando movimientos...
                        </p>
                      )}

                      {detailError && (
                        <div
                          className={styles.error}
                          role="alert"
                        >
                          {detailError}
                        </div>
                      )}

                      {!detailLoading && summary && (
                        <>
                          <div className={styles.summaryGrid}>
                            <div>
                              <span>Fondo inicial</span>
                              <strong>
                                {money(summary.openingFloat)}
                              </strong>
                            </div>

                            <div>
                              <span>Ingresos en efectivo</span>
                              <strong className={styles.positive}>
                                +{money(summary.cashIncome)}
                              </strong>
                            </div>

                            <div>
                              <span>Egresos en efectivo</span>
                              <strong className={styles.negative}>
                                −{money(summary.cashExpense)}
                              </strong>
                            </div>

                            <div>
                              <span>Efectivo esperado</span>
                              <strong>
                                {money(summary.expectedCash)}
                              </strong>
                            </div>

                            <div>
                              <span>Efectivo contado</span>
                              <strong>
                                {summary.countedCash === null
                                  ? 'Pendiente'
                                  : money(summary.countedCash)}
                              </strong>
                            </div>

                            <div>
                              <span>Diferencia de cierre</span>
                              <strong
                                className={
                                  summary.difference === null
                                    ? ''
                                    : summary.difference < 0
                                      ? styles.negative
                                      : styles.positive
                                }
                              >
                                {summary.difference === null
                                  ? 'Pendiente'
                                  : money(summary.difference)}
                              </strong>
                            </div>
                          </div>

                          <h3>Movimientos de la sesión</h3>

                          {movements.length === 0 ? (
                            <div className={styles.empty}>
                              <Wallet size={30} />
                              <p>
                                No hay movimientos registrados.
                              </p>
                            </div>
                          ) : (
                            <div className={styles.tableWrap}>
                              <table className={styles.table}>
                                <thead>
                                  <tr>
                                    <th>Fecha</th>
                                    <th>Tipo</th>
                                    <th>Descripción</th>
                                    <th>Método</th>
                                    <th>Monto</th>
                                  </tr>
                                </thead>

                                <tbody>
                                  {movements.map(movement => (
                                    <tr key={movement.id}>
                                      <td>
                                        {formatDate(movement.date)}
                                      </td>

                                      <td>
                                        <span
                                          className={
                                            styles.movementType
                                          }
                                        >
                                          {movement.type === 'INCOME'
                                            ? (
                                              <ArrowDownLeft
                                                size={16}
                                              />
                                            )
                                            : (
                                              <ArrowUpRight
                                                size={16}
                                              />
                                            )}

                                          {getCategoryLabel(
                                            movement.category
                                          )}
                                        </span>
                                      </td>

                                      <td>
                                        {movement.description ||
                                          'Sin descripción'}

                                        {movement.reference && (
                                          <small>
                                            Referencia:
                                            {' '}
                                            {movement.reference}
                                          </small>
                                        )}
                                      </td>

                                      <td>
                                        {getMethodLabel(
                                          movement.method
                                        )}
                                      </td>

                                      <td
                                        className={
                                          movement.type === 'INCOME'
                                            ? styles.positive
                                            : styles.negative
                                        }
                                      >
                                        {movement.type === 'INCOME'
                                          ? '+'
                                          : '−'}

                                        {money(movement.amount)}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </article>
              ))}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
