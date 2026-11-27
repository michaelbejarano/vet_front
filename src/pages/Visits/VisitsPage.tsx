
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  CalendarDays,
  CheckCircle2,
  ClipboardPlus,
  HeartPulse,
  Plus,
  RefreshCw,
  Stethoscope,
  Trash2,
} from 'lucide-react';

import PageHeader from '@/components/common/PageHeader';
import Button from '@/components/common/Button';
import StatusBadge from '@/components/common/StatusBadge';
import { getApiError } from '@/utils/apiError';
import { PATHS } from '@/routes/paths';

import {
  clinicalService,
} from '@/services/clinicalService';

import type {
  VetAppointment,
  ClinicalConsultation,
  ConsultationPayload,
  TreatmentPayload,
} from '@/services/clinicalService';

import styles from '../Clinical.module.css';

type ClinicalForm = {
  weight: string;
  reason: string;
  anamnesis: string;
  physicalExam: string;
  instructions: string;
};

const emptyForm: ClinicalForm = {
  weight: '',
  reason: '',
  anamnesis: '',
  physicalExam: '',
  instructions: '',
};

const emptyTreatment = {
  description: '',
  dosage: '',
  frequency: '',
  duration: '',
  instructions: '',
};

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? 'Fecha no disponible'
    : date.toLocaleString('es-PE', {
        dateStyle: 'medium',
        timeStyle: 'short',
      });
}

function statusInfo(status: string): {
  label: string;
  variant: 'success' | 'info' | 'warning' | 'danger' | 'neutral';
} {
  switch (status) {
    case 'CONFIRMED':
      return { label: 'Confirmada', variant: 'info' };
    case 'IN_PROGRESS':
      return { label: 'En atención', variant: 'warning' };
    case 'COMPLETED':
      return { label: 'Finalizada', variant: 'success' };
    case 'CANCELLED':
      return { label: 'Cancelada', variant: 'danger' };
    case 'PENDING_PAYMENT':
      return { label: 'Pendiente de pago', variant: 'neutral' };
    default:
      return { label: status, variant: 'neutral' };
  }
}

export default function VisitsPage() {
  const [appointments, setAppointments] =
    useState<VetAppointment[]>([]);

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [consultation, setConsultation] =
    useState<ClinicalConsultation | null>(null);

  const [loading, setLoading] = useState(true);
  const [consultLoading, setConsultLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('ALL');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [consultError, setConsultError] = useState('');

  const [editorOpen, setEditorOpen] = useState(false);
  const [form, setForm] = useState<ClinicalForm>(emptyForm);

  const [diagnosis, setDiagnosis] = useState('');

  const [treatmentOpen, setTreatmentOpen] = useState(false);
  const [editingTreatmentId, setEditingTreatmentId] =
    useState<number | undefined>();
  const [treatmentForm, setTreatmentForm] =
    useState(emptyTreatment);

  const selected =
    appointments.find((a) => a.id === selectedId) ?? null;

  const loadAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const data = await clinicalService.getAppointments();
      setAppointments(data);
      setError('');

      setSelectedId(current =>
        current && data.some(a => a.id === current)
          ? current
          : data.find(a => a.status === 'IN_PROGRESS')?.id ??
            data[0]?.id ??
            null
      );
    } catch (err) {
      setError(
        getApiError(err, 'No se pudieron cargar las citas.')
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAppointments();
  }, [loadAppointments]);

  useEffect(() => {
    if (
      !selected ||
      !['IN_PROGRESS', 'COMPLETED'].includes(selected.status)
    ) {
      setConsultation(null);
      setConsultError('');
      return;
    }

    let active = true;
    setConsultLoading(true);
    setConsultation(null);
    setConsultError('');

    clinicalService
      .getConsultation(selected.id)
      .then(data => {
        if (!active) return;
        setConsultation(data);
        setDiagnosis(data.diagnosis?.description ?? '');
      })
      .catch(() => {
        if (!active) return;
        setConsultError(
          'No se encontró una consulta registrada o la API clínica aún no está disponible.'
        );
        setDiagnosis('');
      })
      .finally(() => {
        if (active) setConsultLoading(false);
      });

    return () => {
      active = false;
    };
  }, [selected?.id, selected?.status, refreshKey]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();

    return appointments
      .filter(a => {
        const matchesSearch =
          a.petName.toLowerCase().includes(term) ||
          a.employeeName.toLowerCase().includes(term) ||
          String(a.id).includes(term);

        return (
          matchesSearch &&
          (filter === 'ALL' || a.status === filter)
        );
      })
      .sort(
        (a, b) =>
          new Date(b.startAt).getTime() -
          new Date(a.startAt).getTime()
      );
  }, [appointments, search, filter]);

  async function execute(
    action: () => Promise<unknown>,
    successMessage: string
  ): Promise<boolean> {
    if (busy) return false;

    setBusy(true);
    setError('');
    setMessage('');

    try {
      await action();
      setMessage(successMessage);
      setRefreshKey(v => v + 1);
      await loadAppointments();
      return true;
    } catch (err) {
      setError(
        getApiError(err, 'No se pudo completar la operación.')
      );
      return false;
    } finally {
      setBusy(false);
    }
  }

  function openConsultation() {
    setForm(
      consultation
        ? {
            weight: String(consultation.weightKg ?? ''),
            reason: consultation.reason ?? '',
            anamnesis: consultation.anamnesis ?? '',
            physicalExam: consultation.physicalExam ?? '',
            instructions: consultation.instructions ?? '',
          }
        : { ...emptyForm }
    );

    setEditorOpen(true);
  }

  async function saveConsultation(event: FormEvent) {
    event.preventDefault();

    if (!selected) return;

    if (!form.reason.trim()) {
      setError('El motivo de consulta es obligatorio.');
      return;
    }

    const weight = form.weight.trim()
      ? Number(form.weight)
      : null;

    if (
      weight !== null &&
      (!Number.isFinite(weight) || weight <= 0)
    ) {
      setError('El peso debe ser mayor que cero.');
      return;
    }

    const payload: ConsultationPayload = {
      weightKg: weight,
      reason: form.reason.trim(),
      anamnesis: form.anamnesis.trim() || null,
      physicalExam: form.physicalExam.trim() || null,
      instructions: form.instructions.trim() || null,
    };

    const saved = await execute(
      () =>
        clinicalService.saveConsultation(
          selected.id,
          payload,
          Boolean(consultation)
        ),
      'Consulta médica guardada correctamente.'
    );

    if (saved) setEditorOpen(false);
  }

  async function saveDiagnosis(event: FormEvent) {
    event.preventDefault();
    if (!selected || !consultation || !diagnosis.trim()) return;

    await execute(
      () =>
        clinicalService.saveDiagnosis(
          selected.id,
          diagnosis.trim(),
          Boolean(consultation.diagnosis)
        ),
      'Diagnóstico guardado correctamente.'
    );
  }

  function openTreatment(treatment?: ClinicalConsultation['treatments'][number]) {
    setEditingTreatmentId(treatment?.id);
    setTreatmentForm(
      treatment
        ? {
            description: treatment.description,
            dosage: treatment.dosage ?? '',
            frequency: treatment.frequency ?? '',
            duration: treatment.duration ?? '',
            instructions: treatment.instructions ?? '',
          }
        : { ...emptyTreatment }
    );
    setTreatmentOpen(true);
  }

  async function saveTreatment(event: FormEvent) {
    event.preventDefault();

    if (!selected || !consultation || !treatmentForm.description.trim()) {
      setError('La descripción del tratamiento es obligatoria.');
      return;
    }

    const payload: TreatmentPayload = {
      description: treatmentForm.description.trim(),
      dosage: treatmentForm.dosage.trim() || null,
      frequency: treatmentForm.frequency.trim() || null,
      duration: treatmentForm.duration.trim() || null,
      instructions: treatmentForm.instructions.trim() || null,
    };

    const saved = await execute(
      () =>
        clinicalService.saveTreatment(
          selected.id,
          payload,
          editingTreatmentId
        ),
      'Tratamiento guardado correctamente.'
    );

    if (saved) setTreatmentOpen(false);
  }

  async function removeTreatment(id: number) {
    if (!selected) return;

    if (!window.confirm('¿Eliminar este tratamiento?')) return;

    await execute(
      () => clinicalService.deleteTreatment(selected.id, id),
      'Tratamiento eliminado correctamente.'
    );
  }

  async function finishAppointment() {
    if (!selected) return;

    if (
      !window.confirm(
        '¿Finalizar esta atención? Los servicios deben estar completados o anulados.'
      )
    ) return;

    await execute(
      () => clinicalService.completeAppointment(selected.id),
      'Atención finalizada correctamente.'
    );
  }

  const editable = selected?.status === 'IN_PROGRESS';

  return (
    <div className={styles.page}>
      <PageHeader
        title="Atenciones"
        description="Gestión de consultas, diagnósticos y tratamientos veterinarios."
        actions={
          <Button
            variant="outline"
            leftIcon={<RefreshCw size={17} />}
            onClick={() => void loadAppointments()}
            disabled={loading || busy}
          >
            Actualizar
          </Button>
        }
      />

      {error && <div className={styles.error} role="alert">{error}</div>}
      {message && <div className={styles.success} role="status">{message}</div>}

      <div className={styles.stats}>
        {[
          ['Total de citas', appointments.length],
          ['Confirmadas', appointments.filter(a => a.status === 'CONFIRMED').length],
          ['En atención', appointments.filter(a => a.status === 'IN_PROGRESS').length],
          ['Finalizadas', appointments.filter(a => a.status === 'COMPLETED').length],
        ].map(([label, value]) => (
          <div key={label} className={styles.stat}>
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>

      <div className={styles.workspace}>
        <section className={styles.panel}>
          <h2 className={styles.sectionTitle}>
            <CalendarDays size={20} /> Agenda de atenciones
          </h2>

          <input
            className={styles.control}
            placeholder="Buscar mascota, médico o cita..."
            aria-label="Buscar atenciones"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />

          <select
            className={styles.control}
            aria-label="Filtrar estado"
            value={filter}
            onChange={e => setFilter(e.target.value)}
          >
            <option value="ALL">Todos los estados</option>
            <option value="CONFIRMED">Confirmadas</option>
            <option value="IN_PROGRESS">En atención</option>
            <option value="COMPLETED">Finalizadas</option>
            <option value="PENDING_PAYMENT">Pendientes de pago</option>
          </select>

          {loading ? (
            <p className={styles.muted}>Cargando citas...</p>
          ) : filtered.length === 0 ? (
            <p className={styles.muted}>No se encontraron citas.</p>
          ) : (
            <div className={styles.list}>
              {filtered.map(a => (
                <button
                  key={a.id}
                  type="button"
                  disabled={busy}
                  className={
                    selectedId === a.id
                      ? styles.selectedItem
                      : styles.item
                  }
                  onClick={() => {
                    setSelectedId(a.id);
                    setMessage('');
                    setError('');
                  }}
                >
                  <strong>{a.petName}</strong>
                  <span>Cita #{a.id} · {formatDate(a.startAt)}</span>
                  <span>{a.employeeName}</span>
                  <StatusBadge {...statusInfo(a.status)} />
                </button>
              ))}
            </div>
          )}
        </section>

        <section className={styles.panel}>
          {!selected ? (
            <div className={styles.empty}>
              <HeartPulse size={38} />
              <h2>Selecciona una cita</h2>
              <p>Elige un paciente para gestionar su atención.</p>
            </div>
          ) : (
            <>
              <div className={styles.heading}>
                <div>
                  <span className={styles.muted}>CITA #{selected.id}</span>
                  <h2>{selected.petName}</h2>
                  <p className={styles.muted}>
                    {selected.employeeName} · {formatDate(selected.startAt)}
                  </p>
                </div>
                <StatusBadge {...statusInfo(selected.status)} />
              </div>

              <div className={styles.actions}>
                {selected.status === 'CONFIRMED' && (
                  <Button
                    leftIcon={<Activity size={17} />}
                    loading={busy}
                    onClick={() => void execute(
                      () => clinicalService.startAppointment(selected.id),
                      'Atención iniciada correctamente.'
                    )}
                  >
                    Iniciar atención
                  </Button>
                )}

                {editable && (
                  <>
                    <Button
                      leftIcon={<ClipboardPlus size={17} />}
                      disabled={busy || consultLoading}
                      onClick={openConsultation}
                    >
                      {consultation ? 'Editar consulta' : 'Registrar consulta'}
                    </Button>

                    <Button
                      variant="outline"
                      loading={busy}
                      onClick={() => void finishAppointment()}
                    >
                      Finalizar atención
                    </Button>
                  </>
                )}

                <Link
                  className={styles.link}
                  to={`${PATHS.MEDICAL_HISTORY}?petId=${selected.petId}`}
                >
                  <HeartPulse size={17} /> Ver historial clínico
                </Link>
              </div>

              {consultLoading && <p className={styles.muted}>Cargando ficha médica...</p>}
              {consultError && <div className={styles.notice}>{consultError}</div>}

              {editable && editorOpen && (
                <form className={styles.form} onSubmit={e => void saveConsultation(e)}>
                  <h3>Datos de la consulta</h3>

                  <label>
                    Motivo de consulta *
                    <textarea
                      required
                      value={form.reason}
                      onChange={e => setForm({ ...form, reason: e.target.value })}
                    />
                  </label>

                  <label>
                    Peso (kg)
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={form.weight}
                      onChange={e => setForm({ ...form, weight: e.target.value })}
                      placeholder="Ej. 12.5"
                    />
                  </label>

                  {([
                    ['anamnesis', 'Anamnesis'],
                    ['physicalExam', 'Examen físico'],
                    ['instructions', 'Indicaciones'],
                  ] as const).map(([key, label]) => (
                    <label key={key}>
                      {label}
                      <textarea
                        value={form[key]}
                        onChange={e => setForm({
                          ...form,
                          [key]: e.target.value,
                        })}
                      />
                    </label>
                  ))}

                  <div className={styles.actions}>
                    <Button type="submit" loading={busy}>Guardar consulta</Button>
                    <Button variant="outline" onClick={() => setEditorOpen(false)}>
                      Cancelar
                    </Button>
                  </div>
                </form>
              )}

              {consultation && (
                <div className={styles.details}>
                  <div className={styles.clinicalCard}>
                    <h3><Stethoscope size={19} /> Consulta médica</h3>
                    <p><strong>Motivo:</strong> {consultation.reason}</p>
                    <p><strong>Peso:</strong> {consultation.weightKg ?? 'No registrado'} kg</p>
                    <p><strong>Anamnesis:</strong> {consultation.anamnesis || 'No registrada'}</p>
                    <p><strong>Examen físico:</strong> {consultation.physicalExam || 'No registrado'}</p>
                    <p><strong>Indicaciones:</strong> {consultation.instructions || 'No registradas'}</p>
                  </div>

                  <div className={styles.clinicalCard}>
                    <h3>Diagnóstico</h3>

                    {editable ? (
                      <form className={styles.form} onSubmit={e => void saveDiagnosis(e)}>
                        <textarea
                          required
                          value={diagnosis}
                          placeholder="Describe el diagnóstico..."
                          onChange={e => setDiagnosis(e.target.value)}
                        />
                        <Button type="submit" loading={busy}>
                          {consultation.diagnosis ? 'Actualizar' : 'Guardar diagnóstico'}
                        </Button>
                      </form>
                    ) : (
                      <p>{consultation.diagnosis?.description || 'Sin diagnóstico'}</p>
                    )}
                  </div>

                  <div className={styles.clinicalCard}>
                    <div className={styles.heading}>
                      <h3>Tratamientos</h3>
                      {editable && (
                        <Button
                          size="sm"
                          variant="outline"
                          leftIcon={<Plus size={16} />}
                          onClick={() => openTreatment()}
                        >
                          Nuevo
                        </Button>
                      )}
                    </div>

                    {consultation.treatments.length === 0 && (
                      <p className={styles.muted}>No hay tratamientos registrados.</p>
                    )}

                    {consultation.treatments.map(t => (
                      <div key={t.id} className={styles.treatment}>
                        <div>
                          <strong>{t.description}</strong>
                          <p>{[t.dosage, t.frequency, t.duration].filter(Boolean).join(' · ')}</p>
                          {t.instructions && <p>{t.instructions}</p>}
                        </div>
                        {editable && (
                          <div className={styles.actions}>
                            <Button size="sm" variant="outline" onClick={() => openTreatment(t)}>
                              Editar
                            </Button>
                            <Button
                              size="sm"
                              variant="danger"
                              leftIcon={<Trash2 size={15} />}
                              onClick={() => void removeTreatment(t.id)}
                            >
                              Eliminar
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {editable && treatmentOpen && consultation && (
                <form className={styles.form} onSubmit={e => void saveTreatment(e)}>
                  <h3>{editingTreatmentId ? 'Editar tratamiento' : 'Nuevo tratamiento'}</h3>

                  {([
                    ['description', 'Descripción *'],
                    ['dosage', 'Dosis'],
                    ['frequency', 'Frecuencia'],
                    ['duration', 'Duración'],
                    ['instructions', 'Indicaciones'],
                  ] as const).map(([key, label]) => (
                    <label key={key}>
                      {label}
                      <textarea
                        required={key === 'description'}
                        value={treatmentForm[key]}
                        onChange={e => setTreatmentForm({
                          ...treatmentForm,
                          [key]: e.target.value,
                        })}
                      />
                    </label>
                  ))}

                  <div className={styles.actions}>
                    <Button type="submit" loading={busy}>Guardar tratamiento</Button>
                    <Button variant="outline" onClick={() => setTreatmentOpen(false)}>
                      Cancelar
                    </Button>
                  </div>
                </form>
              )}

              {selected.status === 'COMPLETED' && (
                <div className={styles.success}>
                  <CheckCircle2 size={18} /> Atención finalizada.
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
