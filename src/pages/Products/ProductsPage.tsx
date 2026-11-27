
import { useCallback, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';

import {
    Plus,
    Pencil,
    Package,
    Search,
    Ban,
    RefreshCw,
    CheckCircle2
} from 'lucide-react';

import PageHeader from '@/components/common/PageHeader';
import Modal from '@/components/common/Modal';
import DataTable from '@/components/common/DataTable';
import type { Column } from '@/components/common/DataTable';

import { productService } from '@/services/productService';

import type {
    Product,
    ProductPayload
} from '@/types/inventory.types';

import { getApiError } from '@/utils/apiError';
import { useAuth } from '@/hooks/useAuth';
import { ROLES } from '@/config/roles';

// Ruta corregida del CSS
import styles from '../Inventory/inventory.module.css';

const initialForm: ProductPayload = {
    sku: null,
    name: '',
    type: 'PRODUCT',
    unit: 'unidad',
    salePrice: 0,
    trackBatches: true
};

const typeLabels: Record<Product['type'], string> = {
    PRODUCT: 'Producto',
    MEDICINE: 'Medicamento',
    VACCINE: 'Vacuna',
    SUPPLY: 'Insumo'
};

const money = (value: number) =>
    new Intl.NumberFormat('es-PE', {
        style: 'currency',
        currency: 'PEN'
    }).format(value);

export default function ProductsPage() {

    const { user } = useAuth();

    const canEdit =
        user?.roleName === ROLES.SUPER_ADMIN ||
        user?.roleName === ROLES.ADMIN;

    const [products, setProducts] = useState<Product[]>([]);
    const [search, setSearch] = useState('');
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [open, setOpen] = useState(false);

    const [editing, setEditing] = useState<Product | null>(null);

    const [form, setForm] = useState<ProductPayload>({
        ...initialForm
    });

    // Cargar productos desde el backend

    const loadProducts = useCallback(async () => {
        setLoading(true);

        try {
            const data = await productService.getAll();

            setProducts(data);
            setError('');
        } catch (err) {
            setError(
                getApiError(err, 'Error al cargar productos')
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadProducts();
    }, [loadProducts]);

    // Buscar productos

    const filtered = products.filter(product =>
        `${product.sku ?? ''} ${product.name} ${product.type}`
            .toLowerCase()
            .includes(search.trim().toLowerCase())
    );

    // Abrir formulario de registro o edición

    const openForm = (product?: Product) => {
        setEditing(product ?? null);

        setForm(
            product
                ? {
                    sku: product.sku,
                    name: product.name,
                    type: product.type,
                    unit: product.unit,
                    salePrice: product.salePrice,
                    trackBatches: product.trackBatches
                }
                : { ...initialForm }
        );

        setError('');
        setNotice('');
        setOpen(true);
    };

    // Registrar o actualizar producto

    const handleSave = async (event: FormEvent) => {
        event.preventDefault();

        if (busy) return;

        const payload: ProductPayload = {
            ...form,
            sku: form.sku?.trim() || null,
            name: form.name.trim(),
            unit: form.unit.trim()
        };

        if (!payload.name) {
            setError('El nombre del producto es obligatorio');
            return;
        }

        if (!payload.unit) {
            setError('La unidad de medida es obligatoria');
            return;
        }

        if (
            !Number.isFinite(payload.salePrice) ||
            payload.salePrice < 0
        ) {
            setError('Ingresa un precio de venta válido');
            return;
        }

        setBusy(true);
        setError('');

        try {
            if (editing) {
                await productService.update(editing.id, payload);
            } else {
                await productService.create(payload);
            }

            setOpen(false);

            setNotice(
                editing
                    ? 'Producto actualizado correctamente'
                    : 'Producto registrado correctamente'
            );

            await loadProducts();
        } catch (err) {
            setError(
                getApiError(err, 'Error al guardar producto')
            );
        } finally {
            setBusy(false);
        }
    };

    // Desactivar producto

    const handleDeactivate = async (product: Product) => {
        const confirmed = window.confirm(
            `¿Estás seguro de desactivar el producto "${product.name}"?`
        );

        if (!confirmed) return;

        setError('');
        setNotice('');

        try {
            await productService.deactivate(product.id);

            setNotice('Producto desactivado correctamente');

            await loadProducts();
        } catch (err) {
            setError(
                getApiError(err, 'Error al desactivar producto')
            );
        }
    };


    const handleActivate = async (product: Product) => {
        const confirmed = window.confirm(
            `¿Deseas reactivar el producto "${product.name}"?`
        );

        if (!confirmed) return;

        setError('');
        setNotice('');

        try {
            await productService.activate(product.id);

            setNotice('Producto reactivado correctamente');

            await loadProducts();

        } catch (err) {
            setError(
                getApiError(err, 'Error al reactivar producto')
            );
        }
    };

    // Columnas de la tabla

    const columns: Column<Product>[] = [
        {
            key: 'sku',
            header: 'Código',
            render: product => product.sku || '—'
        },
        {
            key: 'name',
            header: 'Producto',
            render: product => (
                <strong>{product.name}</strong>
            )
        },
        {
            key: 'type',
            header: 'Tipo',
            render: product =>
                typeLabels[product.type] || product.type
        },
        {
            key: 'unit',
            header: 'Unidad',
            render: product => product.unit
        },
        {
            key: 'price',
            header: 'Precio',
            render: product => money(product.salePrice)
        },
        {
            key: 'status',
            header: 'Estado',
            render: product => (
                <span
                    className={
                        product.isActive
                            ? styles.ok
                            : styles.muted
                    }
                >
                    {product.isActive ? 'Activo' : 'Inactivo'}
                </span>
            )
        },
        {
            key: 'actions',
            header: 'Acciones',
            render: product => (
                <div className={styles.actions}>

                    {canEdit && (
                        <button
                            type="button"
                            title="Editar producto"
                            onClick={() => openForm(product)}
                        >
                            <Pencil size={16} />
                        </button>
                    )}

                    <Link to={`/inventario?productId=${product.id}`}>
                        Ver stock
                    </Link>


                    {canEdit && (
                        product.isActive ? (
                            <button
                                type="button"
                                title="Desactivar producto"
                                onClick={() => void handleDeactivate(product)}
                            >
                                <Ban size={16} />
                                Desactivar
                            </button>
                        ) : (
                            <button
                                type="button"
                                title="Reactivar producto"
                                onClick={() => void handleActivate(product)}
                            >
                                <CheckCircle2 size={16} />
                                Reactivar
                            </button>
                        )
                    )}

                </div>
            )
        }
    ];

    // Interfaz principal

    return (
        <div className={styles.page}>

            <PageHeader
                title="Productos"
                description="Administración de productos de la veterinaria"
                actions={
                    canEdit ? (
                        <button
                            type="button"
                            className={styles.primary}
                            onClick={() => openForm()}
                        >
                            <Plus size={17} />
                            Nuevo producto
                        </button>
                    ) : undefined
                }
            />

            {/* Tarjetas de estadísticas */}

            <div className={styles.cards}>

                <article>
                    <Package size={23} />

                    <strong>
                        {products.length}
                    </strong>

                    <span>
                        Total de productos
                    </span>
                </article>

                <article>
                    <strong>
                        {products.filter(p => p.isActive).length}
                    </strong>

                    <span>
                        Productos activos
                    </span>
                </article>

                <article>
                    <strong>
                        {products.filter(p => !p.isActive).length}
                    </strong>

                    <span>
                        Productos inactivos
                    </span>
                </article>

            </div>

            {/* Mensajes */}

            {notice && (
                <p className={styles.success}>
                    {notice}
                </p>
            )}

            {error && (
                <p className={styles.error}>
                    {error}
                </p>
            )}

            {/* Buscador */}

            <div className={styles.toolbar}>

                <Search size={18} />

                <input
                    type="text"
                    placeholder="Buscar producto por nombre o código..."
                    value={search}
                    onChange={event =>
                        setSearch(event.target.value)
                    }
                />

                <button
                    type="button"
                    disabled={loading}
                    onClick={() => void loadProducts()}
                >
                    <RefreshCw size={16} />
                    Actualizar
                </button>

            </div>

            {/* Tabla de productos */}

            <DataTable
                columns={columns}
                data={filtered}
                rowKey={product => product.id}
                emptyMessage={
                    loading
                        ? 'Cargando productos...'
                        : 'No hay productos registrados'
                }
            />

            {/* Modal de productos */}

            <Modal
                open={open}
                title={
                    editing
                        ? 'Editar producto'
                        : 'Nuevo producto'
                }
                onClose={() => {
                    if (!busy) {
                        setOpen(false);
                        setError('');
                    }
                }}
                busy={busy}
            >

                <form
                    className={styles.form}
                    onSubmit={handleSave}
                >

                    {/* Código SKU */}

                    <label>
                        Código SKU

                        <input
                            type="text"
                            maxLength={50}
                            placeholder="Ej. PROD-001"
                            value={form.sku ?? ''}
                            onChange={event =>
                                setForm({
                                    ...form,
                                    sku: event.target.value
                                })
                            }
                        />
                    </label>

                    {/* Nombre */}

                    <label>
                        Nombre del producto

                        <input
                            type="text"
                            required
                            maxLength={200}
                            placeholder="Ej. Shampoo veterinario"
                            value={form.name}
                            onChange={event =>
                                setForm({
                                    ...form,
                                    name: event.target.value
                                })
                            }
                        />
                    </label>

                    {/* Tipo */}

                    <label>
                        Tipo de producto

                        <select
                            value={form.type}
                            onChange={event =>
                                setForm({
                                    ...form,
                                    type: event.target.value as Product['type']
                                })
                            }
                        >
                            {Object.entries(typeLabels).map(
                                ([value, label]) => (
                                    <option
                                        key={value}
                                        value={value}
                                    >
                                        {label}
                                    </option>
                                )
                            )}
                        </select>
                    </label>

                    {/* Unidad */}

                    <label>
                        Unidad de medida

                        <input
                            type="text"
                            required
                            maxLength={50}
                            placeholder="Ej. unidad, caja, ml"
                            value={form.unit}
                            onChange={event =>
                                setForm({
                                    ...form,
                                    unit: event.target.value
                                })
                            }
                        />
                    </label>

                    {/* Precio */}

                    <label>
                        Precio de venta (S/)

                        <input
                            required
                            type="number"
                            min="0"
                            step="0.01"
                            value={form.salePrice === 0 ? '' : form.salePrice}
                            onFocus={(event) => event.target.select()}
                            onChange={(event) => {
                                const value = event.target.value;

                                setForm({
                                    ...form,
                                    salePrice: value === '' ? 0 : Number(value)
                                });
                            }}
                            placeholder="Ej. 25.00"
                        />
                    </label>

                    {/* Control de lotes */}

                    <label className={styles.check}>

                        <input
                            type="checkbox"
                            checked={form.trackBatches}
                            onChange={event =>
                                setForm({
                                    ...form,
                                    trackBatches: event.target.checked
                                })
                            }
                        />

                        Controlar lotes del producto

                    </label>

                    {/* Botones */}

                    <div className={styles.actions}>

                        <button
                            type="button"
                            disabled={busy}
                            onClick={() => {
                                setOpen(false);
                                setError('');
                            }}
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
                                    ? 'Actualizar producto'
                                    : 'Guardar producto'}
                        </button>

                    </div>

                </form>

            </Modal>

        </div>
    );
}
