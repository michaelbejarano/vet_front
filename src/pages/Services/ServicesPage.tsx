import { useCallback, useEffect, useState } from 'react';

import {
    Plus,
    ClipboardList,
    CheckCircle,
    Stethoscope,
    Pencil,
    Power,
} from 'lucide-react';

import Button from '@/components/common/Button';
import PageHeader from '@/components/common/PageHeader';
import StatCard from '@/components/common/StatCard';
import DataTable from '@/components/common/DataTable';
import type { Column } from '@/components/common/DataTable';
import StatusBadge from '@/components/common/StatusBadge';
import TextField from '@/components/common/TextField';
import SelectField from '@/components/common/SelectField';
import Modal from '@/components/common/Modal';
import ConfirmDialog from '@/components/common/ConfirmDialog';

import ServiceForm from './components/ServiceForm';

import { serviceService } from '@/services/serviceService';
import { getApiError } from '@/utils/apiError';

import type { Service } from '@/types/service.types';

import styles from './ServicesPage.module.css';

const currencyFormatter = new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
});

export default function ServicesPage() {

    // ========================================
    // ESTADOS
    // ========================================

    const [services, setServices] = useState<Service[]>([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    const [formOpen, setFormOpen] = useState(false);
    const [formBusy, setFormBusy] = useState(false);

    const [editingService, setEditingService] =
        useState<Service>();

    const [selectedService, setSelectedService] =
        useState<Service>();

    const [confirmBusy, setConfirmBusy] = useState(false);
    const [confirmError, setConfirmError] = useState('');

    // ========================================
    // CARGAR SERVICIOS
    // ========================================

    const loadServices = useCallback(async () => {

        setLoading(true);
        setError('');

        try {
            const data = await serviceService.getAll();

            setServices(data);

        } catch (err) {
            setError(
                getApiError(
                    err,
                    'No se pudieron cargar los servicios.'
                )
            );
        } finally {
            setLoading(false);
        }

    }, []);

    useEffect(() => {
        void loadServices();
    }, [loadServices]);

    // ========================================
    // ESTADÍSTICAS
    // ========================================

    const activeServices = services.filter(
        service => service.isActive
    ).length;

    const clinicalServices = services.filter(
        service => service.isClinical
    ).length;

    // ========================================
    // FILTROS
    // ========================================

    const filteredServices = services.filter(service => {

        const searchTerm = search.trim().toLowerCase();

        const matchesSearch =
            service.name.toLowerCase().includes(searchTerm) ||
            (service.description ?? '')
                .toLowerCase()
                .includes(searchTerm);

        const matchesType =
            typeFilter === '' ||
            service.isClinical === (typeFilter === 'true');

        const matchesStatus =
            statusFilter === '' ||
            service.isActive === (statusFilter === 'true');

        return (
            matchesSearch &&
            matchesType &&
            matchesStatus
        );
    });

    // ========================================
    // REGISTRAR Y EDITAR
    // ========================================

    function handleCreate() {
        setSuccess('');
        setEditingService(undefined);
        setFormOpen(true);
    }

    function handleEdit(service: Service) {
        setSuccess('');
        setEditingService(service);
        setFormOpen(true);
    }

    function handleCloseForm() {
        if (formBusy) return;

        setFormOpen(false);
        setEditingService(undefined);
    }

    function handleFormSuccess(message: string) {
        setFormOpen(false);
        setEditingService(undefined);

        setSuccess(message);

        setSearch('');
        setTypeFilter('');
        setStatusFilter('');

        void loadServices();
    }

    // ========================================
    // CAMBIAR ESTADO
    // ========================================

    function handleChangeStatus(service: Service) {
        setSuccess('');
        setConfirmError('');
        setSelectedService(service);
    }

    async function confirmChangeStatus() {

        if (!selectedService || confirmBusy) return;

        setConfirmBusy(true);
        setConfirmError('');

        try {
            if (selectedService.isActive) {

                await serviceService.deactivate(
                    selectedService.id
                );

                setSuccess(
                    'Servicio desactivado correctamente.'
                );

            } else {

                await serviceService.activate(
                    selectedService.id
                );

                setSuccess(
                    'Servicio reactivado correctamente.'
                );
            }

            setSelectedService(undefined);

            await loadServices();

        } catch (err) {
            setConfirmError(
                getApiError(
                    err,
                    'No se pudo cambiar el estado del servicio.'
                )
            );
        } finally {
            setConfirmBusy(false);
        }
    }

    // ========================================
    // COLUMNAS DE LA TABLA
    // ========================================

    const columns: Column<Service>[] = [
        {
            key: 'name',
            header: 'Servicio',
            render: service => (
                <div className={styles.serviceInfo}>

                    <strong>{service.name}</strong>

                    {service.description && (
                        <span>{service.description}</span>
                    )}

                </div>
            ),
        },
        {
            key: 'basePrice',
            header: 'Precio base',
            render: service => (
                <strong className={styles.price}>
                    {currencyFormatter.format(
                        service.basePrice
                    )}
                </strong>
            ),
        },
        {
            key: 'durationMinutes',
            header: 'Duración',
            render: service =>
                `${service.durationMinutes} min`,
        },
        {
            key: 'isClinical',
            header: 'Tipo',
            render: service => (
                <StatusBadge
                    label={
                        service.isClinical
                            ? 'Clínico'
                            : 'No clínico'
                    }
                    variant={
                        service.isClinical
                            ? 'info'
                            : 'neutral'
                    }
                />
            ),
        },
        {
            key: 'isActive',
            header: 'Estado',
            render: service => (
                <StatusBadge
                    label={
                        service.isActive
                            ? 'Activo'
                            : 'Inactivo'
                    }
                    variant={
                        service.isActive
                            ? 'success'
                            : 'danger'
                    }
                />
            ),
        },
        {
            key: 'actions',
            header: 'Acciones',
            align: 'center',
            render: service => (
                <div className={styles.rowActions}>

                    <button
                        type="button"
                        className={styles.editButton}
                        title="Editar servicio"
                        aria-label="Editar servicio"
                        onClick={() => handleEdit(service)}
                    >
                        <Pencil size={17} />
                    </button>

                    <button
                        type="button"
                        className={
                            service.isActive
                                ? styles.deactivateButton
                                : styles.activateButton
                        }
                        title={
                            service.isActive
                                ? 'Desactivar servicio'
                                : 'Reactivar servicio'
                        }
                        aria-label={
                            service.isActive
                                ? 'Desactivar servicio'
                                : 'Reactivar servicio'
                        }
                        onClick={() =>
                            handleChangeStatus(service)
                        }
                    >
                        <Power size={17} />
                    </button>

                </div>
            ),
        },
    ];

    // ========================================
    // INTERFAZ
    // ========================================

    return (
        <div className={styles.page}>

            <PageHeader
                title="Servicios"
                description="Administra los servicios de la clínica veterinaria."
                actions={
                    <Button
                        leftIcon={<Plus size={18} />}
                        onClick={handleCreate}
                        disabled={loading || Boolean(error)}
                    >
                        Nuevo servicio
                    </Button>
                }
            />

            {success && (
                <div
                    className={styles.success}
                    role="status"
                >
                    {success}
                </div>
            )}

            {error && (
                <div
                    className={styles.error}
                    role="alert"
                >
                    <span>{error}</span>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => void loadServices()}
                    >
                        Reintentar
                    </Button>
                </div>
            )}

            <div className={styles.stats}>

                <StatCard
                    label="Total de servicios"
                    value={services.length}
                    description="Servicios registrados"
                    icon={ClipboardList}
                    variant="primary"
                />

                <StatCard
                    label="Servicios activos"
                    value={activeServices}
                    description="Disponibles en el catálogo"
                    icon={CheckCircle}
                    variant="success"
                />

                <StatCard
                    label="Servicios clínicos"
                    value={clinicalServices}
                    description="Servicios de atención médica"
                    icon={Stethoscope}
                    variant="info"
                />

            </div>

            {!error && (
                <section className={styles.panel}>

                    <div className={styles.filters}>

                        <TextField
                            label="Buscar servicio"
                            placeholder="Nombre o descripción..."
                            value={search}
                            onChange={event =>
                                setSearch(event.target.value)
                            }
                            disabled={loading}
                        />

                        <SelectField
                            label="Tipo de servicio"
                            value={typeFilter}
                            options={[
                                {
                                    value: '',
                                    label: 'Todos los tipos',
                                },
                                {
                                    value: 'true',
                                    label: 'Clínicos',
                                },
                                {
                                    value: 'false',
                                    label: 'No clínicos',
                                },
                            ]}
                            onChange={event =>
                                setTypeFilter(event.target.value)
                            }
                            disabled={loading}
                        />

                        <SelectField
                            label="Estado"
                            value={statusFilter}
                            options={[
                                {
                                    value: '',
                                    label: 'Todos los estados',
                                },
                                {
                                    value: 'true',
                                    label: 'Activos',
                                },
                                {
                                    value: 'false',
                                    label: 'Inactivos',
                                },
                            ]}
                            onChange={event =>
                                setStatusFilter(event.target.value)
                            }
                            disabled={loading}
                        />

                    </div>

                    {loading ? (
                        <p className={styles.empty}>
                            Cargando servicios...
                        </p>
                    ) : (
                        <>
                            <DataTable
                                columns={columns}
                                data={filteredServices}
                                rowKey={service => service.id}
                                emptyMessage="No se encontraron servicios."
                                ariaLabel="Listado de servicios"
                            />

                            <p className={styles.results}>
                                Mostrando {filteredServices.length}
                                {' de '}
                                {services.length} servicios
                            </p>
                        </>
                    )}

                </section>
            )}

            {/* FORMULARIO */}

            <Modal
                open={formOpen}
                title={
                    editingService
                        ? 'Editar servicio'
                        : 'Registrar servicio'
                }
                description="Configura la información del servicio veterinario."
                onClose={handleCloseForm}
                busy={formBusy}
            >
                {formOpen && (
                    <ServiceForm
                        key={editingService?.id ?? 'new'}
                        initialService={editingService}
                        onCancel={handleCloseForm}
                        onSuccess={handleFormSuccess}
                        onBusyChange={setFormBusy}
                    />
                )}
            </Modal>

            {/* CONFIRMAR CAMBIO DE ESTADO */}

            <ConfirmDialog
                open={Boolean(selectedService)}
                title={
                    selectedService?.isActive
                        ? 'Desactivar servicio'
                        : 'Reactivar servicio'
                }
                description={
                    selectedService
                        ? selectedService.isActive
                            ? `¿Deseas desactivar el servicio "${selectedService.name}"? El registro se conservará en el sistema.`
                            : `¿Deseas reactivar el servicio "${selectedService.name}"?`
                        : ''
                }
                confirmLabel={
                    selectedService?.isActive
                        ? 'Desactivar'
                        : 'Reactivar'
                }
                variant={
                    selectedService?.isActive
                        ? 'danger'
                        : 'primary'
                }
                loading={confirmBusy}
                error={confirmError}
                onConfirm={() => void confirmChangeStatus()}
                onCancel={() => {
                    if (!confirmBusy) {
                        setSelectedService(undefined);
                    }
                }}
            />

        </div>
    );
}