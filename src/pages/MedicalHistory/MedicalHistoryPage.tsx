
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import {
  HeartPulse,
  Printer,
  RefreshCw,
  Stethoscope,
  CalendarDays,
} from 'lucide-react';

import PageHeader from '@/components/common/PageHeader';
import Button from '@/components/common/Button';
import { getApiError } from '@/utils/apiError';

import { clinicalService } from '@/services/clinicalService';

import type {
  ClinicalHistory,
  ClinicalPet,
} from '@/services/clinicalService';

import styles from '../Clinical.module.css';

export default function MedicalHistoryPage() {
  const [searchParams] = useSearchParams();

  const initialPetId = Number(searchParams.get('petId'));

  const [pets, setPets] = useState<ClinicalPet[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(
    Number.isInteger(initialPetId) && initialPetId > 0
      ? initialPetId
      : null
  );

  const [history, setHistory] =
    useState<ClinicalHistory | null>(null);

  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  async function loadPets() {
    setLoading(true);
    setError('');

    try {
      const data = await clinicalService.getPets();
      setPets(data);

      setSelectedId(current =>
        current && data.some(p => p.id === current)
          ? current
          : data[0]?.id ?? null
      );
    } catch (err) {
      setError(
        getApiError(err, 'No se pudieron cargar las mascotas.')
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadPets();
  }, []);

  useEffect(() => {
    if (!selectedId) {
      setHistory(null);
      return;
    }

    let active = true;
    setHistory(null);
    setHistoryLoading(true);
    setError('');

    clinicalService.getHistory(selectedId)
      .then(data => {
        if (active) setHistory(data);
      })
      .catch(err => {
        if (active) {
          setError(
            getApiError(
              err,
              'No se pudo recuperar el historial clínico.'
            )
          );
        }
      })
      .finally(() => {
        if (active) setHistoryLoading(false);
      });

    return () => {
      active = false;
    };
  }, [selectedId]);

  const filteredPets = useMemo(() => {
    const term = search.trim().toLowerCase();

    return pets.filter(p =>
      p.name.toLowerCase().includes(term) ||
      p.ownerName.toLowerCase().includes(term) ||
      p.speciesName.toLowerCase().includes(term)
    );
  }, [pets, search]);

  const selectedPet =
    pets.find(p => p.id === selectedId) ?? null;

  function formatDate(value: string) {
    const date = new Date(value);

    return Number.isNaN(date.getTime())
      ? 'Fecha no disponible'
      : date.toLocaleString('es-PE', {
          dateStyle: 'long',
          timeStyle: 'short',
        });
  }

  return (
    <div className={styles.page}>
      <PageHeader
        title="Historial clínico"
        description="Consulta los antecedentes médicos y tratamientos de cada paciente."
        actions={
          <div className={styles.actions}>
            <Button
              variant="outline"
              leftIcon={<RefreshCw size={17} />}
              disabled={loading}
              onClick={() => void loadPets()}
            >
              Actualizar
            </Button>

            <Button
              leftIcon={<Printer size={17} />}
              disabled={!history || historyLoading}
              onClick={() => window.print()}
            >
              Imprimir historial
            </Button>
          </div>
        }
      />

      {error && (
        <div className={styles.error} role="alert">
          {error}
        </div>
      )}

      <div className={styles.workspace}>
        <section className={styles.panel}>
          <h2 className={styles.sectionTitle}>
            <HeartPulse size={20} /> Pacientes
          </h2>

          <input
            className={styles.control}
            placeholder="Buscar por mascota, dueño o especie..."
            aria-label="Buscar paciente"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />

          {loading ? (
            <p className={styles.muted}>Cargando pacientes...</p>
          ) : filteredPets.length === 0 ? (
            <p className={styles.muted}>No hay mascotas para mostrar.</p>
          ) : (
            <div className={styles.list}>
              {filteredPets.map(pet => (
                <button
                  key={pet.id}
                  type="button"
                  aria-pressed={selectedId === pet.id}
                  className={
                    selectedId === pet.id
                      ? styles.selectedItem
                      : styles.item
                  }
                  onClick={() => setSelectedId(pet.id)}
                >
                  <strong>{pet.name}</strong>
                  <span>{pet.speciesName} · {pet.breedName || 'Sin raza'}</span>
                  <span>Propietario: {pet.ownerName}</span>
                </button>
              ))}
            </div>
          )}
        </section>

        <section className={styles.panel}>
          {!selectedPet ? (
            <div className={styles.empty}>
              <HeartPulse size={42} />
              <h2>Selecciona un paciente</h2>
              <p>Consulta sus antecedentes médicos.</p>
            </div>
          ) : (
            <>
              <div className={styles.patientHeader}>
                <div className={styles.avatar}>
                  <HeartPulse size={30} />
                </div>

                <div>
                  <span className={styles.muted}>
                    EXPEDIENTE CLÍNICO #{selectedPet.id}
                  </span>
                  <h2>{selectedPet.name}</h2>
                  <p className={styles.muted}>
                    {selectedPet.speciesName} · {selectedPet.breedName || 'Raza no registrada'}
                  </p>
                  <p className={styles.muted}>
                    Propietario: {selectedPet.ownerName}
                  </p>
                </div>
              </div>

              <div className={styles.stats}>
                <div className={styles.stat}>
                  <span>Consultas finalizadas</span>
                  <strong>{history?.totalConsultations ?? 0}</strong>
                </div>

                <div className={styles.stat}>
                  <span>Diagnósticos</span>
                  <strong>
                    {history?.history.filter(h => h.diagnosis).length ?? 0}
                  </strong>
                </div>

                <div className={styles.stat}>
                  <span>Tratamientos</span>
                  <strong>
                    {history?.history.reduce(
                      (sum, h) => sum + h.treatments.length,
                      0
                    ) ?? 0}
                  </strong>
                </div>
              </div>

              <h3 className={styles.sectionTitle}>
                <CalendarDays size={19} /> Línea de tiempo médica
              </h3>

              {historyLoading ? (
                <p className={styles.muted}>Cargando historial...</p>
              ) : !history || history.history.length === 0 ? (
                <div className={styles.empty}>
                  <Stethoscope size={38} />
                  <h3>Sin antecedentes clínicos</h3>
                  <p>Aún no existen consultas finalizadas para este paciente.</p>
                </div>
              ) : (
                <div className={styles.timeline}>
                  {history.history.map(item => (
                    <article
                      key={item.consultationId}
                      className={styles.historyCard}
                    >
                      <div className={styles.heading}>
                        <div>
                          <span className={styles.muted}>
                            <CalendarDays size={15} />
                            {formatDate(item.date)}
                          </span>
                          <h3>{item.reason || 'Consulta veterinaria'}</h3>
                        </div>
                        <span className={styles.tag}>
                          Consulta #{item.consultationId}
                        </span>
                      </div>

                      <div className={styles.historyGrid}>
                        <div>
                          <strong>Peso registrado</strong>
                          <p>
                            {item.weightKg == null
                              ? 'No registrado'
                              : `${item.weightKg} kg`}
                          </p>
                        </div>

                        <div>
                          <strong>Profesional</strong>
                          <p>Veterinario #{item.veterinarianId}</p>
                        </div>
                      </div>

                      <div className={styles.clinicalCard}>
                        <h4>Evaluación médica</h4>
                        <p><strong>Anamnesis:</strong> {item.anamnesis || 'No registrada'}</p>
                        <p><strong>Examen físico:</strong> {item.physicalExam || 'No registrado'}</p>
                        <p><strong>Indicaciones:</strong> {item.instructions || 'No registradas'}</p>
                      </div>

                      <div className={styles.diagnosis}>
                        <strong>Diagnóstico</strong>
                        <p>
                          {item.diagnosis?.description ||
                            'No se registró un diagnóstico.'}
                        </p>
                      </div>

                      {item.treatments.length > 0 && (
                        <div className={styles.clinicalCard}>
                          <h4>Tratamientos realizados</h4>

                          {item.treatments.map(t => (
                            <div key={t.id} className={styles.treatment}>
                              <div>
                                <strong>{t.description}</strong>
                                <p>
                                  {[t.dosage, t.frequency, t.duration]
                                    .filter(Boolean)
                                    .join(' · ')}
                                </p>
                                {t.instructions && (
                                  <p>{t.instructions}</p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {item.services.length > 0 && (
                        <div className={styles.clinicalCard}>
                          <h4>Servicios realizados</h4>
                          {item.services.map(service => (
                            <p key={service.visitServiceId}>
                              {service.serviceName}
                            </p>
                          ))}
                        </div>
                      )}
                    </article>
                  ))}
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
