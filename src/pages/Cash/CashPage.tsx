
import {
  useCallback,
  useEffect,
  useState,
} from 'react';

import type {
  FormEvent,
} from 'react';

import {
  Wallet,
  ArrowDownToLine,
  ArrowUpFromLine,
  RefreshCw,
  LockKeyhole,
  LockOpen,
  Banknote,
} from 'lucide-react';

import Button from '@/components/common/Button';
import PageHeader from '@/components/common/PageHeader';
import StatCard from '@/components/common/StatCard';
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
  ManualMovement,
} from '@/services/cashService';

import CashHistory from './CashHistory';

import styles from './CashPage.module.css';

type MovementKind = ManualMovement['category'];

const currencyFormatter = new Intl.NumberFormat('es-PE', {
  style: 'currency',
  currency: 'PEN',
});

function money(value: number): string {
  return currencyFormatter.format(value);
}

function parseMoney(
  value: string,
  allowZero = false
): number | null {
  const normalized = value.trim().replace(',', '.');

  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) {
    return null;
  }

  const amount = Number(normalized);

  if (!Number.isFinite(amount)) {
    return null;
  }

  if (allowZero ? amount < 0 : amount <= 0) {
    return null;
  }

  return amount;
}

function formatDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Fecha no disponible';
  }

  return date.toLocaleString('es-PE', {
    timeZone: 'America/Lima',
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export default function CashPage() {
  // ========================================
  // DATOS DE CAJA
  // ========================================

  const [registers, setRegisters] =
    useState<CashRegister[]>([]);

  const [registerId, setRegisterId] = useState('');

  const [session, setSession] =
    useState<CashSession | null>(null);

  const [summary, setSummary] =
    useState<CashSummary | null>(null);

  const [movements, setMovements] =
    useState<CashMovement[]>([]);

  // ========================================
  // ESTADOS DE CARGA
  // ========================================

  const [loading, setLoading] = useState(true);
  const [loadingSession, setLoadingSession] = useState(false);

  const [sessionKnown, setSessionKnown] = useState(false);

  const [busy, setBusy] = useState(false);
  const [revision, setRevision] = useState(0);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // ========================================
  // FORMULARIOS
  // ========================================

  const [openingAmount, setOpeningAmount] = useState('');

  const [movementKind, setMovementKind] =
    useState<MovementKind>('DEPOSIT');

  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [reference, setReference] = useState('');

  const [countedCash, setCountedCash] = useState('');

  const currentRegister = registers.find(
    item => String(item.id) === registerId
  );

  // ========================================
  // CONSULTAR CAJAS
  // ========================================

  const loadRegisters = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const result = await cashService.getRegisters();

      setRegisters(result);

      setRegisterId(current => {
        const exists = result.some(
          register =>
            register.isActive &&
            String(register.id) === current
        );

        if (exists) {
          return current;
        }

        const firstActive = result.find(
          register => register.isActive
        );

        return firstActive
          ? String(firstActive.id)
          : '';
      });
    } catch (err) {
      setError(
        getApiError(
          err,
          'No se pudieron consultar las cajas.'
        )
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRegisters();
  }, [loadRegisters]);

  // ========================================
  // CONSULTAR SESION ABIERTA
  // ========================================

  useEffect(() => {
    if (!registerId) {
      setSession(null);
      setSummary(null);
      setMovements([]);
      setSessionKnown(false);
      return;
    }

    let active = true;

    async function loadSession() {
      setLoadingSession(true);
      setSessionKnown(false);
      setSession(null);
      setSummary(null);
      setMovements([]);
      setError('');

      try {
        const current = await cashService.getOpenSession(
          Number(registerId)
        );

        if (!active) return;

        setSession(current);
        setSessionKnown(true);

        if (!current) {
          return;
        }

        const [
          resultSummary,
          resultMovements,
        ] = await Promise.all([
          cashService.getSummary(current.id),
          cashService.getMovements(current.id),
        ]);

        if (!active) return;

        setSummary(resultSummary);
        setMovements(resultMovements);
      } catch (err) {
        if (!active) return;

        setError(
          getApiError(
            err,
            'No se pudo recuperar el estado de la caja.'
          )
        );
      } finally {
        if (active) {
          setLoadingSession(false);
        }
      }
    }

    void loadSession();

    return () => {
      active = false;
    };
  }, [registerId, revision]);

  // ========================================
  // EJECUTAR OPERACIONES
  // ========================================

  async function execute(
    action: () => Promise<unknown>,
    successMessage: string
  ): Promise<boolean> {
    if (busy) return false;

    setBusy(true);
    setError('');
    setSuccess('');

    try {
      await action();

      setSuccess(successMessage);

      setRevision(current => current + 1);

      return true;
    } catch (err) {
      setError(
        getApiError(
          err,
          'No se pudo realizar la operación.'
        )
      );

      return false;
    } finally {
      setBusy(false);
    }
  }

  // ========================================
  // ABRIR CAJA
  // ========================================

  async function handleOpen(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const id = currentRegister?.id;

    if (!id || busy || !sessionKnown || session) {
      return;
    }

    const initialAmount =
      openingAmount.trim() === ''
        ? 0
        : parseMoney(openingAmount, true);

    if (initialAmount === null) {
      setError(
        'Ingresa un fondo inicial válido desde S/ 0.00.'
      );
      return;
    }

    const saved = await execute(
      () => cashService.open(id, initialAmount),
      `Caja abierta con ${money(initialAmount)} de fondo inicial.`
    );

    if (saved) {
      setOpeningAmount('');
    }
  }

  // ========================================
  // INGRESOS Y EGRESOS
  // ========================================

  async function handleMovement(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const id = session?.id;

    if (!id || !summary || busy) {
      return;
    }

    const movementAmount = parseMoney(amount);

    if (movementAmount === null) {
      setError(
        'El monto debe ser mayor que cero y tener máximo dos decimales.'
      );
      return;
    }

    if (!description.trim()) {
      setError(
        'Debes indicar el motivo del movimiento.'
      );
      return;
    }

    if (reference.trim().length > 120) {
      setError(
        'La referencia admite máximo 120 caracteres.'
      );
      return;
    }

    const isIncome = movementKind === 'DEPOSIT';

    if (
      !isIncome &&
      movementAmount > summary.expectedCash
    ) {
      setError(
        'No puedes registrar un egreso superior al efectivo disponible.'
      );
      return;
    }

    const payload: ManualMovement = {
      type: isIncome
        ? 'INCOME'
        : 'EXPENSE',

      category: movementKind,

      amount: movementAmount,

      description: description.trim(),

      reference: reference.trim() || undefined,
    };

    const saved = await execute(
      () => cashService.addMovement(id, payload),

      isIncome
        ? 'Ingreso registrado correctamente.'
        : 'Egreso registrado correctamente.'
    );

    if (saved) {
      setAmount('');
      setDescription('');
      setReference('');
    }
  }

  // ========================================
  // CERRAR CAJA
  // ========================================

  async function handleClose(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const id = session?.id;

    if (!id || busy) return;

    const counted = parseMoney(
      countedCash,
      true
    );

    if (counted === null) {
      setError(
        'Ingresa el monto real contado en caja.'
      );
      return;
    }

    const confirmed = window.confirm(
      '¿Deseas cerrar esta caja? ' +
      'Se registrará el efectivo contado y ' +
      'la diferencia respecto al saldo esperado.'
    );

    if (!confirmed) return;

    const saved = await execute(
      () => cashService.close(id, counted),
      'La caja se cerró correctamente. Puedes revisar el cierre en el historial.'
    );

    if (saved) {
      setCountedCash('');
    }
  }

  // ========================================
  // ACTUALIZAR
  // ========================================

  function refresh() {
    if (busy) return;

    setSuccess('');
    void loadRegisters();

    setRevision(current => current + 1);
  }

  // ========================================
  // INTERFAZ
  // ========================================

  return (
    <div className={styles.page}>
      <PageHeader
        title="Caja"
        description="Control de efectivo, aperturas, ingresos, egresos y cierres diarios."
        actions={
          <Button
            variant="outline"
            leftIcon={<RefreshCw size={17} />}
            onClick={refresh}
            disabled={
              loading ||
              loadingSession ||
              busy
            }
          >
            Actualizar
          </Button>
        }
      />

      {error && (
        <div
          className={styles.error}
          role="alert"
        >
          {error}
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

      {/* ==================================
          SELECCION DE CAJA
      ================================== */}

      <section className={styles.panel}>
        <div className={styles.heading}>
          <div>
            <h2>Control de caja</h2>

            <p>
              Selecciona una caja para consultar
              su saldo y movimientos.
            </p>
          </div>

          {session ? (
            <StatusBadge
              label="Caja abierta"
              variant="success"
            />
          ) : (
            <StatusBadge
              label="Sin sesión abierta"
              variant="neutral"
            />
          )}
        </div>

        <label className={styles.field}>
          Caja registrada

          <select
            value={registerId}
            onChange={event =>
              setRegisterId(event.target.value)
            }
            disabled={loading || busy}
          >
            <option value="">
              Selecciona una caja
            </option>

            {registers
              .filter(register => register.isActive)
              .map(register => (
                <option
                  key={register.id}
                  value={register.id}
                >
                  {register.name} — #{register.id}
                </option>
              ))}
          </select>
        </label>

        {loading && (
          <p className={styles.muted}>
            Cargando cajas registradas...
          </p>
        )}

        {!loading &&
          registers.every(register => !register.isActive) &&
          (
            <div className={styles.notice}>
              No hay cajas activas disponibles.
              Un administrador debe crear o habilitar una caja.
            </div>
          )}

        {loadingSession && (
          <p className={styles.muted}>
            Consultando sesión, saldo y movimientos...
          </p>
        )}
      </section>

      {/* ==================================
          APERTURA DE CAJA
      ================================== */}

      {!loadingSession &&
        currentRegister &&
        sessionKnown &&
        !session &&
        (
          <section className={styles.openingPanel}>
            <div className={styles.openingIcon}>
              <LockOpen size={29} />
            </div>

            <div className={styles.openingContent}>
              <h2>Apertura de caja</h2>

              <p>
                Puedes iniciar con S/ 0.00 o
                establecer un fondo inicial.
              </p>

              <form
                onSubmit={event =>
                  void handleOpen(event)
                }
              >
                <label className={styles.field}>
                  Fondo inicial (S/)

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Ejemplo: 150.00"
                    value={openingAmount}
                    onChange={event =>
                      setOpeningAmount(
                        event.target.value
                      )
                    }
                    disabled={busy}
                  />
                </label>

                <p className={styles.hint}>
                  Si dejas el campo vacío,
                  se abrirá con S/ 0.00.
                </p>

                <Button
                  type="submit"
                  leftIcon={<LockOpen size={17} />}
                  loading={busy}
                >
                  Abrir caja
                </Button>
              </form>
            </div>
          </section>
        )}

      {/* ==================================
          CAJA ACTIVA
      ================================== */}

      {session && !summary && !loadingSession && (
        <div className={styles.notice}>
          La caja tiene una sesión abierta,
          pero todavía no se pudo consultar su saldo.
          Presiona Actualizar para reintentar.
        </div>
      )}

      {session && summary && (
        <>
          {/* ==================================
              INDICADORES
          ================================== */}

          <div className={styles.stats}>
            <StatCard
              label="Fondo inicial"
              value={money(summary.openingFloat)}
              description="Monto de apertura"
              icon={Wallet}
              variant="primary"
            />

            <StatCard
              label="Ingresos en efectivo"
              value={money(summary.cashIncome)}
              description="Entradas registradas"
              icon={ArrowDownToLine}
              variant="success"
            />

            <StatCard
              label="Egresos en efectivo"
              value={money(summary.cashExpense)}
              description="Salidas registradas"
              icon={ArrowUpFromLine}
              variant="warning"
            />

            <StatCard
              label="Efectivo esperado"
              value={money(summary.expectedCash)}
              description="Saldo calculado por la API"
              icon={Banknote}
              variant="info"
            />
          </div>

          <div className={styles.columns}>
            {/* ==================================
                NUEVO MOVIMIENTO
            ================================== */}

            <section className={styles.panel}>
              <div className={styles.heading}>
                <div>
                  <h2>Nuevo movimiento</h2>

                  <p>
                    Registra ingresos y egresos externos.
                  </p>
                </div>
              </div>

              <form
                className={styles.form}
                onSubmit={event =>
                  void handleMovement(event)
                }
              >
                <label className={styles.field}>
                  Tipo de movimiento

                  <select
                    value={movementKind}
                    onChange={event =>
                      setMovementKind(
                        event.target.value as MovementKind
                      )
                    }
                    disabled={busy}
                  >
                    <option value="DEPOSIT">
                      Ingreso externo
                    </option>

                    <option value="EXPENSE">
                      Egreso externo
                    </option>

                    <option value="WITHDRAWAL">
                      Retiro de efectivo
                    </option>
                  </select>
                </label>

                <label className={styles.field}>
                  Monto (S/)

                  <input
                    required
                    type="number"
                    min="0.01"
                    step="0.01"
                    placeholder="0.00"
                    value={amount}
                    onChange={event =>
                      setAmount(event.target.value)
                    }
                    disabled={busy}
                  />
                </label>

                <label className={styles.field}>
                  Motivo del movimiento

                  <textarea
                    required
                    placeholder={
                      movementKind === 'DEPOSIT'
                        ? 'Ejemplo: Aporte de efectivo a caja'
                        : 'Ejemplo: Compra de materiales de limpieza'
                    }
                    value={description}
                    onChange={event =>
                      setDescription(
                        event.target.value
                      )
                    }
                    disabled={busy}
                  />
                </label>

                <label className={styles.field}>
                  Referencia (opcional)

                  <input
                    maxLength={120}
                    placeholder="Ejemplo: COM-001"
                    value={reference}
                    onChange={event =>
                      setReference(
                        event.target.value
                      )
                    }
                    disabled={busy}
                  />
                </label>

                <Button
                  type="submit"
                  loading={busy}
                  leftIcon={
                    movementKind === 'DEPOSIT'
                      ? <ArrowDownToLine size={17} />
                      : <ArrowUpFromLine size={17} />
                  }
                >
                  {movementKind === 'DEPOSIT'
                    ? 'Registrar ingreso'
                    : 'Registrar egreso'}
                </Button>
              </form>
            </section>

            {/* ==================================
                MOVIMIENTOS ACTUALES
            ================================== */}

            <section className={styles.panel}>
              <div className={styles.heading}>
                <div>
                  <h2>Movimientos recientes</h2>

                  <p>
                    Sesión #{session.id}
                    {' · '}
                    {formatDate(session.openedAt)}
                  </p>
                </div>

                <StatusBadge
                  label="Abierta"
                  variant="success"
                />
              </div>

              {movements.length === 0 ? (
                <div className={styles.empty}>
                  <Wallet size={35} />

                  <strong>Sin movimientos</strong>

                  <p>
                    Los ingresos y egresos
                    aparecerán aquí.
                  </p>
                </div>
              ) : (
                <div className={styles.tableScroll}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Movimiento</th>
                        <th>Fecha</th>
                        <th>Monto</th>
                      </tr>
                    </thead>

                    <tbody>
                      {movements.map(item => (
                        <tr key={item.id}>
                          <td>
                            <strong>
                              {item.type === 'INCOME'
                                ? 'Ingreso'
                                : 'Egreso'}
                            </strong>

                            <span>
                              {item.description ||
                                item.category}
                            </span>

                            {item.reference && (
                              <small>
                                Ref.: {item.reference}
                              </small>
                            )}

                            <small>
                              Método: {item.method}
                            </small>
                          </td>

                          <td>
                            {formatDate(item.date)}
                          </td>

                          <td
                            className={
                              item.type === 'INCOME'
                                ? styles.positive
                                : styles.negative
                            }
                          >
                            {item.type === 'INCOME'
                              ? '+'
                              : '−'}

                            {money(item.amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>

          {/* ==================================
              CIERRE DE CAJA
          ================================== */}

          <section className={styles.panel}>
            <div className={styles.heading}>
              <div>
                <h2>
                  <LockKeyhole size={19} />
                  Cierre de caja
                </h2>

                <p>
                  Cuenta físicamente el efectivo
                  antes de finalizar la sesión.
                </p>
              </div>
            </div>

            <form
              className={styles.closeForm}
              onSubmit={event =>
                void handleClose(event)
              }
            >
              <div className={styles.balanceLabel}>
                <span>
                  Efectivo esperado
                </span>

                <strong>
                  {money(summary.expectedCash)}
                </strong>
              </div>

              <label className={styles.field}>
                Efectivo contado (S/)

                <input
                  required
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Monto contado"
                  value={countedCash}
                  onChange={event =>
                    setCountedCash(
                      event.target.value
                    )
                  }
                  disabled={busy}
                />
              </label>

              <Button
                type="submit"
                variant="danger"
                loading={busy}
                leftIcon={
                  <LockKeyhole size={17} />
                }
              >
                Cerrar caja
              </Button>
            </form>
          </section>
        </>
      )}

      {/* ==================================
          HISTORIAL DE CAJAS
      ================================== */}

      <CashHistory
        registers={registers}
        refreshKey={revision}
      />
    </div>
  );
}
