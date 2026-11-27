
import { useCallback, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';

import {
    Plus,
    Search,
    Pencil,
    Users,
    PawPrint,
    RefreshCw
} from 'lucide-react';

import PageHeader from '@/components/common/PageHeader';
import Modal from '@/components/common/Modal';
import DataTable from '@/components/common/DataTable';
import type { Column } from '@/components/common/DataTable';

import {
    ownerService
} from '@/services/ownerService';

import type {
    Owner,
    OwnerPayload
} from '@/services/ownerService';

import { getApiError } from '@/utils/apiError';
import { PATHS } from '@/routes/paths';

import styles from '../Inventory/inventory.module.css';

const initialForm: OwnerPayload = {
    firstNames: '',
    documentType: null,
    documentNumber: null,
    phone: null,
    email: null,
    address: null
};

const documentLengths: Record<string, number> = {
    DNI: 8,
    CE: 9,
    RUC: 11,
    PASAPORTE: 20
};

const clean = (value: string | null): string | null => {
    return value?.trim() || null;
};

const validateOwner = (
    data: OwnerPayload
): string | null => {

    if (!data.firstNames.trim()) {
        return 'Los nombres y apellidos son obligatorios.';
    }

    if (data.firstNames.length > 150) {
        return 'El nombre no puede superar 150 caracteres.';
    }

    if (
        !/^[\p{L}\p{M} .'-]+$/u.test(data.firstNames)
    ) {
        return 'El nombre contiene caracteres no permitidos.';
    }

    if (
        Boolean(data.documentType) !==
        Boolean(data.documentNumber)
    ) {
        return 'Completa el tipo y número de documento.';
    }

    const document = data.documentNumber ?? '';

    switch (data.documentType) {
        case 'DNI':
            if (!/^\d{8}$/.test(document)) {
                return 'El DNI debe tener exactamente 8 números.';
            }
            break;

        case 'RUC':
            if (!/^\d{11}$/.test(document)) {
                return 'El RUC debe tener exactamente 11 números.';
            }
            break;

        case 'CE':
            if (!/^\d{9}$/.test(document)) {
                return 'El carné de extranjería debe tener 9 números.';
            }
            break;

        case 'PASAPORTE':
            if (!/^[A-Za-z0-9]{6,20}$/.test(document)) {
                return 'El pasaporte debe tener de 6 a 20 caracteres alfanuméricos.';
            }
            break;

        case null:
            break;

        default:
            return 'Selecciona un tipo de documento válido.';
    }

    if (
        data.phone &&
        !/^9\d{8}$/.test(data.phone)
    ) {
        return 'El celular debe tener 9 números y comenzar con 9.';
    }

    if (
        data.email &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)
    ) {
        return 'Ingresa un correo electrónico válido.';
    }

    if (data.email && data.email.length > 200) {
        return 'El correo no puede superar 200 caracteres.';
    }

    if (data.address && data.address.length > 250) {
        return 'La dirección no puede superar 250 caracteres.';
    }

    return null;
};

export default function OwnersPage() {

    const [owners, setOwners] = useState<Owner[]>([]);
    const [search, setSearch] = useState('');

    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [open, setOpen] = useState(false);

    const [editing, setEditing] = useState<Owner | null>(null);

    const [form, setForm] = useState<OwnerPayload>({
        ...initialForm
    });

    const [error, setError] = useState('');
    const [formError, setFormError] = useState('');
    const [notice, setNotice] = useState('');

    const loadOwners = useCallback(async () => {

        setLoading(true);

        try {
            const data = await ownerService.getAll();

            setOwners(data);
            setError('');
        } catch (err) {
            setError(
                getApiError(err, 'Error al cargar propietarios')
            );
        } finally {
            setLoading(false);
        }

    }, []);

    useEffect(() => {
        void loadOwners();
    }, [loadOwners]);

    const filtered = owners.filter(owner =>
        [
            owner.firstNames,
            owner.documentNumber,
            owner.phone,
            owner.email
        ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase()
            .includes(search.trim().toLowerCase())
    );

    const openForm = (owner?: Owner) => {

        setEditing(owner ?? null);

        setForm(
            owner
                ? {
                    firstNames: owner.firstNames,
                    documentType: owner.documentType,
                    documentNumber: owner.documentNumber,
                    phone: owner.phone,
                    email: owner.email,
                    address: owner.address
                }
                : { ...initialForm }
        );

        setFormError('');
        setNotice('');
        setOpen(true);
    };

    const handleDocumentTypeChange = (value: string) => {

        setForm(previous => ({
            ...previous,
            documentType: value || null,
            documentNumber: null
        }));

        setFormError('');
    };

    const handleDocumentNumberChange = (value: string) => {

        let cleaned = value;

        if (form.documentType === 'PASAPORTE') {
            cleaned = cleaned
                .replace(/[^a-zA-Z0-9]/g, '')
                .toUpperCase();
        } else {
            cleaned = cleaned.replace(/\D/g, '');
        }

        const maxLength =
            documentLengths[form.documentType ?? ''] ?? 20;

        cleaned = cleaned.slice(0, maxLength);

        setForm(previous => ({
            ...previous,
            documentNumber: cleaned
        }));
    };

    const handlePhoneChange = (value: string) => {

        const cleaned = value
            .replace(/\D/g, '')
            .slice(0, 9);

        setForm(previous => ({
            ...previous,
            phone: cleaned
        }));
    };

    const handleSave = async (event: FormEvent) => {

        event.preventDefault();

        if (busy) return;

        const payload: OwnerPayload = {
            firstNames: form.firstNames.trim(),
            documentType: clean(form.documentType),
            documentNumber: clean(form.documentNumber),
            phone: clean(form.phone),
            email: clean(form.email),
            address: clean(form.address)
        };

        const validationError = validateOwner(payload);

        if (validationError) {
            setFormError(validationError);
            return;
        }

        setBusy(true);
        setFormError('');
        setError('');

        try {

            if (editing) {
                await ownerService.update(editing.id, payload);
            } else {
                await ownerService.create(payload);
            }

            setOpen(false);

            setNotice(
                editing
                    ? 'Propietario actualizado correctamente.'
                    : 'Propietario registrado correctamente.'
            );

            await loadOwners();

        } catch (err) {
            setFormError(
                getApiError(err, 'No se pudo guardar el propietario')
            );
        } finally {
            setBusy(false);
        }
    };

    const columns: Column<Owner>[] = [
        {
            key: 'name',
            header: 'Propietario',
            render: owner => (
                <strong>{owner.firstNames}</strong>
            )
        },
        {
            key: 'document',
            header: 'Documento',
            render: owner =>
                [owner.documentType, owner.documentNumber]
                    .filter(Boolean)
                    .join(' ') || '—'
        },
        {
            key: 'phone',
            header: 'Teléfono',
            render: owner => owner.phone || '—'
        },
        {
            key: 'email',
            header: 'Correo',
            render: owner => owner.email || '—'
        },
        {
            key: 'actions',
            header: 'Acciones',
            render: owner => (
                <div className={styles.actions}>

                    <button
                        type="button"
                        title="Editar propietario"
                        onClick={() => openForm(owner)}
                    >
                        <Pencil size={16} />
                    </button>

                    <Link to={`${PATHS.PETS}?ownerId=${owner.id}`}>
                        <PawPrint size={16} />
                        Ver mascotas
                    </Link>

                </div>
            )
        }
    ];

    return (
        <div className={styles.page}>

            <PageHeader
                title="Propietarios"
                description="Administración de propietarios de mascotas"
                actions={
                    <button
                        type="button"
                        className={styles.primary}
                        onClick={() => openForm()}
                    >
                        <Plus size={17} />
                        Nuevo propietario
                    </button>
                }
            />

            <div className={styles.cards}>

                <article>
                    <Users size={23} />
                    <strong>{owners.length}</strong>
                    <span>Total propietarios</span>
                </article>

                <article>
                    <strong>
                        {owners.filter(o => o.phone).length}
                    </strong>
                    <span>Con teléfono</span>
                </article>

                <article>
                    <strong>
                        {owners.filter(o => o.email).length}
                    </strong>
                    <span>Con correo</span>
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
                    placeholder="Buscar por nombre, documento o teléfono..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />

                <button
                    type="button"
                    disabled={loading}
                    onClick={() => void loadOwners()}
                >
                    <RefreshCw size={16} />
                    Actualizar
                </button>

            </div>

            <DataTable
                columns={columns}
                data={filtered}
                rowKey={owner => owner.id}
                emptyMessage={
                    loading
                        ? 'Cargando propietarios...'
                        : 'No hay propietarios registrados'
                }
            />

            <Modal
                open={open}
                title={
                    editing ? 'Editar propietario' : 'Nuevo propietario'
                }
                busy={busy}
                onClose={() => {
                    if (!busy) {
                        setOpen(false);
                    }
                }}
            >

                <form
                    className={styles.form}
                    onSubmit={handleSave}
                >

                    {formError && (
                        <p className={styles.error} role="alert">
                            {formError}
                        </p>
                    )}

                    <label>
                        Nombres y apellidos *

                        <input
                            required
                            type="text"
                            maxLength={150}
                            value={form.firstNames}
                            onChange={e => setForm({
                                ...form,
                                firstNames: e.target.value
                            })}
                            placeholder="Ej. Carlos Ramírez"
                        />
                    </label>

                    <label>
                        Tipo de documento

                        <select
                            value={form.documentType ?? ''}
                            onChange={e =>
                                handleDocumentTypeChange(e.target.value)
                            }
                        >
                            <option value="">Sin documento</option>
                            <option value="DNI">DNI</option>
                            <option value="CE">Carné de extranjería</option>
                            <option value="PASAPORTE">Pasaporte</option>
                            <option value="RUC">RUC</option>
                        </select>
                    </label>

                    <label>
                        Número de documento

                        <input
                            type="text"
                            inputMode={
                                form.documentType === 'PASAPORTE'
                                    ? 'text'
                                    : 'numeric'
                            }
                            maxLength={
                                documentLengths[form.documentType ?? ''] ?? 20
                            }
                            disabled={!form.documentType}
                            required={Boolean(form.documentType)}
                            value={form.documentNumber ?? ''}
                            onChange={e =>
                                handleDocumentNumberChange(e.target.value)
                            }
                            placeholder={
                                form.documentType === 'DNI'
                                    ? '8 dígitos'
                                    : form.documentType === 'RUC'
                                        ? '11 dígitos'
                                        : form.documentType === 'CE'
                                            ? '9 dígitos'
                                            : 'Número de documento'
                            }
                        />
                    </label>

                    <label>
                        Celular peruano

                        <input
                            type="tel"
                            inputMode="numeric"
                            maxLength={9}
                            value={form.phone ?? ''}
                            onChange={e =>
                                handlePhoneChange(e.target.value)
                            }
                            placeholder="Ej. 987654321"
                        />
                    </label>

                    <label>
                        Correo electrónico

                        <input
                            type="email"
                            maxLength={200}
                            value={form.email ?? ''}
                            onChange={e => setForm({
                                ...form,
                                email: e.target.value
                            })}
                            placeholder="correo@ejemplo.com"
                        />
                    </label>

                    <label>
                        Dirección

                        <input
                            type="text"
                            maxLength={250}
                            value={form.address ?? ''}
                            onChange={e => setForm({
                                ...form,
                                address: e.target.value
                            })}
                            placeholder="Dirección del propietario"
                        />
                    </label>

                    <div className={styles.actions}>

                        <button
                            type="button"
                            disabled={busy}
                            onClick={() => setOpen(false)}
                        >
                            Cancelar
                        </button>

                        <button
                            type="submit"
                            className={styles.primary}
                            disabled={busy}
                        >
                            {busy
                                ? 'Guardando...'
                                : editing
                                    ? 'Actualizar propietario'
                                    : 'Guardar propietario'}
                        </button>

                    </div>

                </form>

            </Modal>

        </div>
    );
}
