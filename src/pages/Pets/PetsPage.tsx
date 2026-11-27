
import { useCallback, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';

import {
    Plus,
    Search,
    Pencil,
    Ban,
    PawPrint,
    RefreshCw,
    Save,
    X,
    UserRound,
    Dna,
    CalendarDays
} from 'lucide-react';

import PageHeader from '@/components/common/PageHeader';
import Modal from '@/components/common/Modal';
import DataTable from '@/components/common/DataTable';
import type { Column } from '@/components/common/DataTable';

import { ownerService } from '@/services/ownerService';
import { petService } from '@/services/petService';

import type {
    Owner,
    Pet,
    PetPayload,
    Species,
    Breed
} from '@/types/veterinary.types';

import { getApiError } from '@/utils/apiError';

import styles from './PetsPage.module.css';

type CatalogMode = 'species' | 'breed' | null;

const emptyForm: PetPayload = {
    ownerId: 0,
    speciesId: 0,
    breedId: null,
    name: '',
    sexo: null,
    birthDate: null,
    notes: null
};

const today = () => {
    const date = new Date();

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
};

const sortByName = <T extends { name: string }>(
    items: T[]
): T[] =>
    [...items].sort((a, b) =>
        a.name.localeCompare(b.name, 'es')
    );

export default function PetsPage() {
    const [params, setParams] = useSearchParams();

    const ownerFilter = Number(
        params.get('ownerId') || 0
    );

    const [pets, setPets] = useState<Pet[]>([]);
    const [owners, setOwners] = useState<Owner[]>([]);
    const [species, setSpecies] = useState<Species[]>([]);
    const [breeds, setBreeds] = useState<Breed[]>([]);

    const [search, setSearch] = useState('');

    const [loading, setLoading] = useState(true);
    const [loadingBreeds, setLoadingBreeds] = useState(false);

    const [open, setOpen] = useState(false);
    const [busy, setBusy] = useState(false);
    const [catalogBusy, setCatalogBusy] = useState(false);

    const [editing, setEditing] = useState<Pet | null>(null);
    const [form, setForm] = useState<PetPayload>({
        ...emptyForm
    });

    const [catalogMode, setCatalogMode] =
        useState<CatalogMode>(null);

    const [catalogName, setCatalogName] = useState('');

    const [error, setError] = useState('');
    const [formError, setFormError] = useState('');
    const [catalogError, setCatalogError] = useState('');
    const [notice, setNotice] = useState('');
    const [catalogNotice, setCatalogNotice] = useState('');

    // CARGAR DATOS

    const loadData = useCallback(async () => {
        setLoading(true);
        setError('');

        try {
            const [petData, ownerData, speciesData] =
                await Promise.all([
                    petService.getAll(),
                    ownerService.getAll(),
                    petService.getSpecies()
                ]);

            setPets(petData);
            setOwners(ownerData);
            setSpecies(sortByName(speciesData));

        } catch (err) {
            setError(
                getApiError(
                    err,
                    'No se pudo cargar la información'
                )
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadData();
    }, [loadData]);

    // CARGAR RAZAS DE LA ESPECIE

    useEffect(() => {
        let active = true;

        if (!form.speciesId) {
            setBreeds([]);
            setLoadingBreeds(false);
            return;
        }

        setBreeds([]);
        setLoadingBreeds(true);

        void petService
            .getBreeds(form.speciesId)
            .then(data => {
                if (active) {
                    setBreeds(sortByName(data));
                }
            })
            .catch(err => {
                if (active) {
                    setFormError(
                        getApiError(
                            err,
                            'No se pudieron cargar las razas'
                        )
                    );
                }
            })
            .finally(() => {
                if (active) {
                    setLoadingBreeds(false);
                }
            });

        return () => {
            active = false;
        };
    }, [form.speciesId]);

    // FILTROS

    const filtered = pets.filter(pet => {
        const matchesOwner =
            !ownerFilter || pet.ownerId === ownerFilter;

        const content = [
            pet.name,
            pet.ownerName,
            pet.speciesName,
            pet.breedName
        ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();

        return matchesOwner &&
            content.includes(search.trim().toLowerCase());
    });

    // ABRIR FORMULARIO

    const openForm = (pet?: Pet) => {
        setEditing(pet ?? null);

        setForm(
            pet
                ? {
                    ownerId: pet.ownerId,
                    speciesId: pet.speciesId,
                    breedId: pet.breedId,
                    name: pet.name,
                    sexo: pet.sexo,
                    birthDate: pet.birthDate
                        ? pet.birthDate.substring(0, 10)
                        : null,
                    notes: pet.notes
                }
                : {
                    ...emptyForm,
                    ownerId: ownerFilter || 0
                }
        );

        setCatalogMode(null);
        setCatalogName('');
        setCatalogNotice('');
        setCatalogError('');
        setFormError('');
        setNotice('');
        setOpen(true);
    };

    const closeForm = () => {
        if (busy || catalogBusy) return;

        setOpen(false);
        setCatalogMode(null);
    };

    // CAMBIAR ESPECIE

    const changeSpecies = (value: string) => {
        setForm(previous => ({
            ...previous,
            speciesId: Number(value) || 0,
            breedId: null
        }));

        setBreeds([]);
        setCatalogMode(null);
        setCatalogError('');
        setFormError('');
    };

    // ABRIR FORMULARIO DEL CATÁLOGO

    const openCatalog = (mode: 'species' | 'breed') => {
        if (mode === 'breed' && !form.speciesId) {
            setFormError('Selecciona primero una especie.');
            return;
        }

        setCatalogMode(mode);
        setCatalogName('');
        setCatalogError('');
        setCatalogNotice('');
    };

    // GUARDAR NUEVA ESPECIE O RAZA

    const saveCatalog = async () => {
        if (catalogBusy || !catalogMode) return;

        const name = catalogName
            .trim()
            .replace(/\s+/g, ' ');

        if (!name) {
            setCatalogError('Ingresa un nombre.');
            return;
        }

        const maxLength =
            catalogMode === 'species' ? 80 : 100;

        if (name.length > maxLength) {
            setCatalogError(
                `El nombre no puede superar ${maxLength} caracteres.`
            );
            return;
        }

        if (
            catalogMode === 'breed' &&
            !form.speciesId
        ) {
            setCatalogError('Selecciona una especie.');
            return;
        }

        setCatalogBusy(true);
        setCatalogError('');

        try {
            if (catalogMode === 'species') {
                const result = await petService.createSpecies(name);

                const created: Species = {
                    id: result.id,
                    name
                };

                setSpecies(previous =>
                    sortByName([
                        ...previous.filter(s => s.id !== created.id),
                        created
                    ])
                );

                setForm(previous => ({
                    ...previous,
                    speciesId: created.id,
                    breedId: null
                }));

                setBreeds([]);

                setCatalogNotice(
                    `Especie "${name}" registrada correctamente.`
                );
            } else {
                const selectedSpeciesId = form.speciesId;

                const result = await petService.createBreed(
                    selectedSpeciesId,
                    name
                );

                const created: Breed = {
                    id: result.id,
                    speciesId: selectedSpeciesId,
                    name
                };

                setBreeds(previous =>
                    sortByName([
                        ...previous.filter(b => b.id !== created.id),
                        created
                    ])
                );

                setForm(previous => ({
                    ...previous,
                    breedId: created.id
                }));

                setCatalogNotice(
                    `Raza "${name}" registrada correctamente.`
                );
            }

            setCatalogMode(null);
            setCatalogName('');

        } catch (err) {
            setCatalogError(
                getApiError(
                    err,
                    'No se pudo registrar el catálogo'
                )
            );
        } finally {
            setCatalogBusy(false);
        }
    };

    // VALIDAR MASCOTA

    const validateForm = (): string | null => {
        if (!form.name.trim()) {
            return 'Ingresa el nombre de la mascota.';
        }

        if (form.name.trim().length > 120) {
            return 'El nombre supera los 120 caracteres.';
        }

        if (!owners.some(o => o.id === form.ownerId)) {
            return 'Selecciona un propietario válido.';
        }

        if (!species.some(s => s.id === form.speciesId)) {
            return 'Selecciona una especie válida.';
        }

        if (
            form.breedId !== null &&
            (
                loadingBreeds ||
                !breeds.some(
                    b =>
                        b.id === form.breedId &&
                        b.speciesId === form.speciesId
                )
            )
        ) {
            return 'Selecciona una raza válida para la especie.';
        }

        if (form.birthDate && form.birthDate > today()) {
            return 'La fecha de nacimiento no puede ser futura.';
        }

        if (form.notes && form.notes.length > 1000) {
            return 'Máximo 1000 caracteres en observaciones.';
        }

        return null;
    };

    // GUARDAR MASCOTA

    const savePet = async (event: FormEvent) => {
        event.preventDefault();

        if (busy || catalogBusy || catalogMode) return;

        const validation = validateForm();

        if (validation) {
            setFormError(validation);
            return;
        }

        const payload: PetPayload = {
            ownerId: form.ownerId,
            speciesId: form.speciesId,
            breedId: form.breedId,
            name: form.name.trim(),
            sexo: form.sexo,
            birthDate: form.birthDate || null,
            notes: form.notes?.trim() || null
        };

        setBusy(true);
        setFormError('');

        try {
            if (editing) {
                await petService.update(editing.id, payload);
            } else {
                await petService.create(payload);
            }

            setOpen(false);

            setNotice(
                editing
                    ? 'Mascota actualizada correctamente.'
                    : 'Mascota registrada correctamente.'
            );

            await loadData();

        } catch (err) {
            setFormError(
                getApiError(
                    err,
                    'No se pudo guardar la mascota'
                )
            );
        } finally {
            setBusy(false);
        }
    };

    // DESACTIVAR MASCOTA

    const deactivate = async (pet: Pet) => {
        if (!window.confirm(`¿Desactivar a "${pet.name}"?`)) {
            return;
        }

        try {
            await petService.deactivate(pet.id);

            setNotice(
                'Mascota desactivada correctamente.'
            );

            await loadData();

        } catch (err) {
            setError(
                getApiError(
                    err,
                    'No se pudo desactivar la mascota'
                )
            );
        }
    };

    // COLUMNAS DE LA TABLA

    const columns: Column<Pet>[] = [
        {
            key: 'name',
            header: 'Mascota',
            render: pet => <strong>{pet.name}</strong>
        },
        {
            key: 'owner',
            header: 'Propietario',
            render: pet => pet.ownerName
        },
        {
            key: 'species',
            header: 'Especie / Raza',
            render: pet =>
                `${pet.speciesName}${pet.breedName ? ` / ${pet.breedName}` : ''
                }`
        },
        {
            key: 'sex',
            header: 'Sexo',
            render: pet =>
                pet.sexo === 'M'
                    ? 'Macho'
                    : pet.sexo === 'F'
                        ? 'Hembra'
                        : '—'
        },
        {
            key: 'status',
            header: 'Estado',
            render: pet => (
                <span
                    className={
                        pet.isActive
                            ? styles.active
                            : styles.inactive
                    }
                >
                    {pet.isActive ? 'Activa' : 'Inactiva'}
                </span>
            )
        },
        {
            key: 'actions',
            header: 'Acciones',
            render: pet => (
                <div className={styles.actions}>
                    <button
                        type="button"
                        title="Editar mascota"
                        className={styles.iconButton}
                        onClick={() => openForm(pet)}
                    >
                        <Pencil size={16} />
                    </button>

                    {pet.isActive && (
                        <button
                            type="button"
                            title="Desactivar mascota"
                            className={styles.iconButton}
                            onClick={() => void deactivate(pet)}
                        >
                            <Ban size={16} />
                        </button>
                    )}
                </div>
            )
        }
    ];

    return (
        <div className={styles.page}>

            <PageHeader
                title="Mascotas"
                description="Gestión de pacientes veterinarios"
                actions={
                    <button
                        type="button"
                        className={styles.primary}
                        onClick={() => openForm()}
                    >
                        <Plus size={17} />
                        Nueva mascota
                    </button>
                }
            />

            <div className={styles.cards}>
                <article>
                    <PawPrint size={23} />
                    <strong>{pets.length}</strong>
                    <span>Total mascotas</span>
                </article>

                <article>
                    <strong>
                        {pets.filter(p => p.isActive).length}
                    </strong>
                    <span>Mascotas activas</span>
                </article>

                <article>
                    <strong>
                        {pets.filter(p => !p.isActive).length}
                    </strong>
                    <span>Mascotas inactivas</span>
                </article>
            </div>

            {notice && (
                <p className={styles.success}>{notice}</p>
            )}

            {error && (
                <p className={styles.error}>{error}</p>
            )}

            <div className={styles.toolbar}>
                <Search size={18} />

                <input
                    type="text"
                    placeholder="Buscar mascota, propietario o raza..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />

                <select
                    aria-label="Filtrar propietario"
                    value={ownerFilter || ''}
                    onChange={e =>
                        setParams(
                            e.target.value
                                ? { ownerId: e.target.value }
                                : {}
                        )
                    }
                >
                    <option value="">
                        Todos los propietarios
                    </option>

                    {owners.map(owner => (
                        <option
                            key={owner.id}
                            value={owner.id}
                        >
                            {owner.firstNames}
                        </option>
                    ))}
                </select>

                <button
                    type="button"
                    disabled={loading}
                    onClick={() => void loadData()}
                >
                    <RefreshCw size={16} />
                    Actualizar
                </button>
            </div>

            <DataTable
                columns={columns}
                data={filtered}
                rowKey={pet => pet.id}
                emptyMessage={
                    loading
                        ? 'Cargando mascotas...'
                        : 'No hay mascotas registradas'
                }
            />

            <Modal
                open={open}
                title={
                    editing
                        ? 'Editar mascota'
                        : 'Nueva mascota'
                }
                busy={busy || catalogBusy}
                onClose={closeForm}
            >
                <div className={styles.modalIntro}>
                    <div className={styles.pawIcon}>
                        <PawPrint size={24} />
                    </div>

                    <div>
                        <strong>Datos del paciente</strong>
                        <p>
                            Completa la información de la mascota.
                        </p>
                    </div>
                </div>

                <form
                    className={styles.form}
                    onSubmit={savePet}
                >
                    {formError && (
                        <p className={styles.error} role="alert">
                            {formError}
                        </p>
                    )}

                    {catalogNotice && (
                        <p className={styles.success}>
                            {catalogNotice}
                        </p>
                    )}

                    <div className={styles.field}>
                        <label htmlFor="pet-name">
                            Nombre de la mascota *
                        </label>

                        <input
                            id="pet-name"
                            required
                            maxLength={120}
                            value={form.name}
                            onChange={e =>
                                setForm({
                                    ...form,
                                    name: e.target.value
                                })
                            }
                            placeholder="Ej. Luna"
                        />
                    </div>

                    <div className={styles.field}>
                        <label htmlFor="pet-owner">
                            <UserRound size={15} />
                            Propietario *
                        </label>

                        <select
                            id="pet-owner"
                            required
                            value={form.ownerId || ''}
                            onChange={e =>
                                setForm({
                                    ...form,
                                    ownerId: Number(e.target.value)
                                })
                            }
                        >
                            <option value="">
                                Seleccionar propietario
                            </option>

                            {owners.map(owner => (
                                <option
                                    key={owner.id}
                                    value={owner.id}
                                >
                                    {owner.firstNames}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className={styles.sectionHeading}>
                        <Dna size={18} />
                        <span>
                            Clasificación de la mascota
                        </span>
                    </div>

                    <div className={styles.twoColumns}>

                        <div className={styles.field}>
                            <label htmlFor="pet-species">
                                Especie *
                            </label>

                            <select
                                id="pet-species"
                                required
                                value={form.speciesId || ''}
                                onChange={e =>
                                    changeSpecies(e.target.value)
                                }
                            >
                                <option value="">
                                    Seleccionar especie
                                </option>

                                {species.map(item => (
                                    <option
                                        key={item.id}
                                        value={item.id}
                                    >
                                        {item.name}
                                    </option>
                                ))}
                            </select>

                            <button
                                type="button"
                                className={styles.addLink}
                                disabled={catalogBusy}
                                onClick={() =>
                                    openCatalog('species')
                                }
                            >
                                <Plus size={15} />
                                Nueva especie
                            </button>
                        </div>

                        <div className={styles.field}>
                            <label htmlFor="pet-breed">
                                Raza
                            </label>

                            <select
                                id="pet-breed"
                                value={form.breedId ?? ''}
                                disabled={
                                    !form.speciesId || loadingBreeds
                                }
                                onChange={e =>
                                    setForm({
                                        ...form,
                                        breedId: e.target.value
                                            ? Number(e.target.value)
                                            : null
                                    })
                                }
                            >
                                <option value="">
                                    {loadingBreeds
                                        ? 'Cargando razas...'
                                        : 'Sin raza especificada'}
                                </option>

                                {breeds.map(breed => (
                                    <option
                                        key={breed.id}
                                        value={breed.id}
                                    >
                                        {breed.name}
                                    </option>
                                ))}
                            </select>

                            <button
                                type="button"
                                className={styles.addLink}
                                disabled={
                                    !form.speciesId || catalogBusy
                                }
                                onClick={() =>
                                    openCatalog('breed')
                                }
                            >
                                <Plus size={15} />
                                Nueva raza
                            </button>
                        </div>

                    </div>

                    {catalogMode && (
                        <div className={styles.catalogPanel}>

                            <div className={styles.catalogHeader}>
                                <strong>
                                    {catalogMode === 'species'
                                        ? 'Agregar nueva especie'
                                        : 'Agregar nueva raza'}
                                </strong>

                                <button
                                    type="button"
                                    className={styles.iconButton}
                                    disabled={catalogBusy}
                                    onClick={() => {
                                        setCatalogMode(null);
                                        setCatalogError('');
                                    }}
                                >
                                    <X size={17} />
                                </button>
                            </div>

                            <p className={styles.hint}>
                                {catalogMode === 'species'
                                    ? 'La especie se guardará en el catálogo de VetCare.'
                                    : 'La raza quedará asociada a la especie seleccionada.'}
                            </p>

                            {catalogError && (
                                <p
                                    className={styles.error}
                                    role="alert"
                                >
                                    {catalogError}
                                </p>
                            )}

                            <div className={styles.catalogFields}>

                                <input
                                    type="text"
                                    maxLength={
                                        catalogMode === 'species'
                                            ? 80
                                            : 100
                                    }
                                    value={catalogName}
                                    onChange={e =>
                                        setCatalogName(e.target.value)
                                    }
                                    placeholder={
                                        catalogMode === 'species'
                                            ? 'Ej. Hurón'
                                            : 'Ej. Persa'
                                    }
                                />

                                <button
                                    type="button"
                                    className={styles.primary}
                                    disabled={
                                        catalogBusy ||
                                        !catalogName.trim()
                                    }
                                    onClick={() => void saveCatalog()}
                                >
                                    <Save size={16} />
                                    {catalogBusy
                                        ? 'Guardando...'
                                        : 'Agregar'}
                                </button>

                            </div>
                        </div>
                    )}

                    <div className={styles.sectionHeading}>
                        <CalendarDays size={18} />
                        <span>Información adicional</span>
                    </div>

                    <div className={styles.twoColumns}>

                        <div className={styles.field}>
                            <label htmlFor="pet-sex">
                                Sexo
                            </label>

                            <select
                                id="pet-sex"
                                value={form.sexo ?? ''}
                                onChange={e =>
                                    setForm({
                                        ...form,
                                        sexo: e.target.value
                                            ? e.target.value as 'M' | 'F'
                                            : null
                                    })
                                }
                            >
                                <option value="">
                                    No especificado
                                </option>

                                <option value="M">
                                    Macho
                                </option>

                                <option value="F">
                                    Hembra
                                </option>
                            </select>
                        </div>

                        <div className={styles.field}>
                            <label htmlFor="pet-birth">
                                Fecha de nacimiento
                            </label>

                            <input
                                id="pet-birth"
                                type="date"
                                max={today()}
                                value={form.birthDate ?? ''}
                                onChange={e =>
                                    setForm({
                                        ...form,
                                        birthDate: e.target.value || null
                                    })
                                }
                            />
                        </div>
                    </div>

                    <div className={styles.field}>
                        <label htmlFor="pet-notes">
                            Observaciones
                        </label>

                        <textarea
                            id="pet-notes"
                            rows={3}
                            maxLength={1000}
                            value={form.notes ?? ''}
                            onChange={e =>
                                setForm({
                                    ...form,
                                    notes: e.target.value
                                })
                            }
                            placeholder="Características especiales, alergias..."
                        />
                    </div>

                    <div className={styles.footer}>

                        <button
                            type="button"
                            className={styles.cancel}
                            disabled={busy || catalogBusy}
                            onClick={closeForm}
                        >
                            Cancelar
                        </button>

                        <button
                            type="submit"
                            className={styles.primary}
                            disabled={
                                busy ||
                                catalogBusy ||
                                catalogMode !== null ||
                                loadingBreeds
                            }
                        >
                            <Save size={17} />

                            {busy
                                ? 'Guardando...'
                                : editing
                                    ? 'Actualizar mascota'
                                    : 'Guardar mascota'}
                        </button>

                    </div>
                </form>
            </Modal>
        </div>
    );
}
