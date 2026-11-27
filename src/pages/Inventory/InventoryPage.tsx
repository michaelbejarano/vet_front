
import { useCallback, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';

import {
    Warehouse,
    Plus,
    ArrowDownToLine,
    SlidersHorizontal,
    RefreshCw,
} from 'lucide-react';

import PageHeader from '@/components/common/PageHeader';
import Modal from '@/components/common/Modal';
import DataTable from '@/components/common/DataTable';
import type { Column } from '@/components/common/DataTable';

import { productService } from '@/services/productService';
import { inventoryService } from '@/services/inventoryService';

import type {
    Product,
    ProductStock,
    InventoryMovement,
    ExpiringBatch,
} from '@/types/inventory.types';

import { getApiError } from '@/utils/apiError';
import { useAuth } from '@/hooks/useAuth';
import { ROLES } from '@/config/roles';

import styles from './inventory.module.css';

type Action = 'batch' | 'entry' | 'adjustment';

type AdjustmentType = 'ADJUSTMENT_IN' | 'ADJUSTMENT_OUT';

const movementLabels: Record<string, string> = {
    IN: 'Entrada',
    OUT: 'Salida',
    ADJUSTMENT_IN: 'Ajuste positivo',
    ADJUSTMENT_OUT: 'Ajuste negativo',
};

const qty = (value: number) =>
    new Intl.NumberFormat('es-PE', {
        maximumFractionDigits: 3,
    }).format(value);

const money = (value: number) =>
    new Intl.NumberFormat('es-PE', {
        style: 'currency',
        currency: 'PEN',
    }).format(value);

export default function InventoryPage() {
    const { user } = useAuth();

    const canAdjust =
        user?.roleName === ROLES.SUPER_ADMIN ||
        user?.roleName === ROLES.ADMIN;

    const [searchParams, setSearchParams] = useSearchParams();

    const selectedId = Number(
        searchParams.get('productId') || 0
    );

    const [products, setProducts] = useState<Product[]>([]);

    const [stock, setStock] = useState<ProductStock | null>(null);

    const [movements, setMovements] = useState<
        InventoryMovement[]
    >([]);

    const [expiring, setExpiring] = useState<ExpiringBatch[]>([]);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');

    const [action, setAction] = useState<Action | null>(null);
    const [busy, setBusy] = useState(false);

    const [batchId, setBatchId] = useState(0);
    const [batchCode, setBatchCode] = useState('');
    const [expiryDate, setExpiryDate] = useState('');
    const [unitCost, setUnitCost] = useState(0);
    const [quantity, setQuantity] = useState(1);
    const [reference, setReference] = useState('');

    const [adjustType, setAdjustType] =
        useState<AdjustmentType>('ADJUSTMENT_IN');

    // Cargar productos

    const loadProducts = useCallback(async () => {
        try {
            const data = await productService.getAll();
            setProducts(data);
        } catch (err) {
            setError(
                getApiError(err, 'Error al cargar productos')
            );
        }
    }, []);

    useEffect(() => {
        void loadProducts();
    }, [loadProducts]);

    // Cargar inventario

    const loadInventory = useCallback(async () => {
        setLoading(true);
        setError('');
        setStock(null);
        setMovements([]);
        setExpiring([]);

        try {
            const [moves, expiry, currentStock] =
                await Promise.all([
                    inventoryService.getMovements(
                        selectedId || undefined
                    ),

                    inventoryService.getExpiringBatches(),

                    selectedId > 0
                        ? inventoryService.getProductStock(selectedId)
                        : Promise.resolve(null),
                ]);

            setMovements(moves);
            setExpiring(expiry);
            setStock(currentStock);
        } catch (err) {
            setError(
                getApiError(err, 'Error al cargar inventario')
            );
        } finally {
            setLoading(false);
        }
    }, [selectedId]);

    useEffect(() => {
        void loadInventory();
    }, [loadInventory]);

    // Abrir formulario

    const openForm = (mode: Action) => {
        setAction(mode);

        setBatchId(stock?.batches[0]?.batchId ?? 0);
        setBatchCode('');
        setExpiryDate('');
        setUnitCost(0);
        setQuantity(1);
        setReference('');
        setAdjustType('ADJUSTMENT_IN');

        setError('');
        setNotice('');
    };

    // Guardar operaciones

    const handleSave = async (event: FormEvent) => {
        event.preventDefault();

        if (!selectedId || !action || busy) {
            return;
        }

        if (
            action !== 'batch' &&
            (!Number.isFinite(quantity) || quantity <= 0)
        ) {
            setError('La cantidad debe ser mayor que cero');
            return;
        }

        if (
            action !== 'batch' &&
            batchId <= 0
        ) {
            setError('Selecciona un lote válido');
            return;
        }

        if (
            action === 'batch' &&
            (!batchCode.trim() ||
                !Number.isFinite(unitCost) ||
                unitCost < 0)
        ) {
            setError('Ingresa un código y costo válidos');
            return;
        }

        if (
            action === 'adjustment' &&
            !reference.trim()
        ) {
            setError('Debes indicar el motivo del ajuste');
            return;
        }

        if (
            action === 'adjustment' &&
            adjustType === 'ADJUSTMENT_OUT'
        ) {
            const currentBatch = stock?.batches.find(
                batch => batch.batchId === batchId
            );

            if (
                currentBatch &&
                quantity > currentBatch.stock
            ) {
                setError(
                    'No puedes retirar más unidades de las disponibles'
                );
                return;
            }
        }

        setBusy(true);
        setError('');

        try {
            if (action === 'batch') {
                await productService.createBatch({
                    productId: selectedId,
                    batchCode: batchCode.trim(),
                    expiryDate: expiryDate || null,
                    unitCost,
                });
            }

            if (action === 'entry') {
                await inventoryService.registerEntry({
                    batchId,
                    quantity,
                    reference: reference.trim(),
                });
            }

            if (action === 'adjustment') {
                await inventoryService.registerAdjustment({
                    batchId,
                    type: adjustType,
                    quantity,
                    reference: reference.trim(),
                });
            }

            setAction(null);

            setNotice('Operación registrada correctamente');

            await loadInventory();
        } catch (err) {
            setError(
                getApiError(err, 'Error al registrar operación')
            );
        } finally {
            setBusy(false);
        }
    };

    // Columnas del historial

    const columns: Column<InventoryMovement>[] = [
        {
            key: 'date',
            header: 'Fecha',
            render: item =>
                new Date(item.date).toLocaleString('es-PE'),
        },
        {
            key: 'product',
            header: 'Producto',
            render: item =>
                products.find(
                    product => product.id === item.productId
                )?.name ?? `Producto #${item.productId}`,
        },
        {
            key: 'batch',
            header: 'Lote',
            render: item => item.batchCode,
        },
        {
            key: 'type',
            header: 'Movimiento',
            render: item =>
                movementLabels[item.type] || item.type,
        },
        {
            key: 'quantity',
            header: 'Cantidad',
            render: item => qty(item.quantity),
        },
        {
            key: 'reference',
            header: 'Referencia',
            render: item => item.reference || '—',
        },
    ];

    // Vista principal

    return (
        <div className={styles.page}>

            <PageHeader
                title="Control de stock"
                description="Gestión del inventario de productos"
                actions={
                    <button
                        type="button"
                        disabled={loading}
                        onClick={() => {
                            void loadProducts();
                            void loadInventory();
                        }}
                    >
                        <RefreshCw size={16} />
                        Actualizar inventario
                    </button>
                }
            />

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

            {/* Selector de producto */}

            <div className={styles.toolbar}>
                <Warehouse size={18} />

                <label htmlFor="product-select">
                    Producto
                </label>

                <select
                    id="product-select"
                    value={selectedId || ''}
                    onChange={event => {
                        setNotice('');
                        setStock(null);

                        setSearchParams(
                            event.target.value
                                ? { productId: event.target.value }
                                : {}
                        );
                    }}
                >
                    <option value="">
                        Todos los productos
                    </option>

                    {products.map(product => (
                        <option
                            key={product.id}
                            value={product.id}
                        >
                            {product.name}
                        </option>
                    ))}
                </select>
            </div>

            {/* Indicador de carga */}

            {loading && (
                <p className={styles.muted}>
                    Cargando información del inventario...
                </p>
            )}

            {/* Existencias del producto */}

            {selectedId > 0 && stock && !loading && (
                <>

                    <div className={styles.cards}>
                        <article>
                            <strong>
                                {qty(stock.totalStock)}
                            </strong>
                            <span>
                                Stock total ({stock.unit})
                            </span>
                        </article>

                        <article>
                            <strong>
                                {qty(stock.availableStock)}
                            </strong>
                            <span>
                                Stock disponible
                            </span>
                        </article>

                        <article>
                            <strong>
                                {qty(stock.expiredStock)}
                            </strong>
                            <span>
                                Stock vencido
                            </span>
                        </article>
                    </div>

                    {/* Listado de lotes */}

                    <div className={styles.sectionTitle}>
                        <h2>
                            Lotes de {stock.productName}
                        </h2>

                        <div className={styles.actions}>

                            {stock.isActive && (
                                <button
                                    type="button"
                                    className={styles.primary}
                                    onClick={() => openForm('batch')}
                                >
                                    <Plus size={16} />
                                    Nuevo lote
                                </button>
                            )}

                            {stock.isActive &&
                                stock.batches.length > 0 && (
                                    <button
                                        type="button"
                                        onClick={() => openForm('entry')}
                                    >
                                        <ArrowDownToLine size={16} />
                                        Registrar entrada
                                    </button>
                                )}

                            {canAdjust &&
                                stock.isActive &&
                                stock.batches.length > 0 && (
                                    <button
                                        type="button"
                                        onClick={() => openForm('adjustment')}
                                    >
                                        <SlidersHorizontal size={16} />
                                        Ajustar stock
                                    </button>
                                )}

                        </div>
                    </div>

                    <div className={styles.tableWrap}>
                        <table>
                            <thead>
                                <tr>
                                    <th>Lote</th>
                                    <th>Vencimiento</th>
                                    <th>Costo unitario</th>
                                    <th>Stock</th>
                                    <th>Estado</th>
                                </tr>
                            </thead>

                            <tbody>
                                {stock.batches.map(batch => (
                                    <tr key={batch.batchId}>

                                        <td>
                                            {batch.batchCode}
                                        </td>

                                        <td>
                                            {batch.expiryDate || 'Sin vencimiento'}
                                        </td>

                                        <td>
                                            {money(batch.unitCost)}
                                        </td>

                                        <td>
                                            {qty(batch.stock)}
                                        </td>

                                        <td
                                            className={
                                                batch.isExpired
                                                    ? styles.danger
                                                    : styles.ok
                                            }
                                        >
                                            {batch.isExpired
                                                ? 'Vencido'
                                                : 'Vigente'}
                                        </td>

                                    </tr>
                                ))}

                                {stock.batches.length === 0 && (
                                    <tr>
                                        <td colSpan={5}>
                                            No hay lotes registrados
                                        </td>
                                    </tr>
                                )}
                            </tbody>

                        </table>
                    </div>

                </>
            )}

            {/* Productos proximos a vencer */}

            <div className={styles.sectionTitle}>
                <h2>
                    Productos próximos a vencer (30 días)
                </h2>
            </div>

            <div className={styles.tableWrap}>
                <table>
                    <thead>
                        <tr>
                            <th>Producto</th>
                            <th>Lote</th>
                            <th>Vencimiento</th>
                            <th>Stock</th>
                            <th>Días restantes</th>
                        </tr>
                    </thead>

                    <tbody>
                        {expiring
                            .filter(item =>
                                !selectedId ||
                                item.productId === selectedId
                            )
                            .map(item => (
                                <tr key={item.batchId}>

                                    <td>
                                        {item.productName}
                                    </td>

                                    <td>
                                        {item.batchCode}
                                    </td>

                                    <td>
                                        {item.expiryDate}
                                    </td>

                                    <td>
                                        {qty(item.stock)}
                                    </td>

                                    <td
                                        className={
                                            item.daysRemaining < 0
                                                ? styles.danger
                                                : styles.muted
                                        }
                                    >
                                        {item.daysRemaining}
                                    </td>

                                </tr>
                            ))}

                        {expiring.filter(
                            item =>
                                !selectedId ||
                                item.productId === selectedId
                        ).length === 0 && (
                                <tr>
                                    <td colSpan={5}>
                                        No hay lotes próximos a vencer
                                    </td>
                                </tr>
                            )}

                    </tbody>
                </table>
            </div>

            {/* Historial */}

            <div className={styles.sectionTitle}>
                <h2>
                    Historial de movimientos
                </h2>
            </div>

            <DataTable
                columns={columns}
                data={movements}
                rowKey={item => item.id}
                emptyMessage={
                    loading
                        ? 'Cargando movimientos...'
                        : 'No hay movimientos registrados'
                }
            />

            {/* Formulario modal */}

            <Modal
                open={action !== null}
                title={
                    action === 'batch'
                        ? 'Crear lote'
                        : action === 'entry'
                            ? 'Registrar entrada'
                            : 'Ajustar stock'
                }
                onClose={() => {
                    if (!busy) {
                        setAction(null);
                        setError('');
                    }
                }}
                busy={busy}
            >
                <form
                    className={styles.form}
                    onSubmit={handleSave}
                >

                    {action === 'batch' ? (
                        <>

                            <label>
                                Código de lote

                                <input
                                    required
                                    maxLength={100}
                                    value={batchCode}
                                    onChange={event =>
                                        setBatchCode(event.target.value)
                                    }
                                    placeholder="Ej. LOTE-001"
                                />
                            </label>

                            <label>
                                Fecha de vencimiento

                                <input
                                    type="date"
                                    value={expiryDate}
                                    onChange={event =>
                                        setExpiryDate(event.target.value)
                                    }
                                />
                            </label>

                            <label>
                                Costo unitario (S/)

                                <input
                                    required
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={unitCost === 0 ? '' : unitCost}
                                    onFocus={(event) => event.target.select()}
                                    onChange={(event) => {
                                        const value = event.target.value;
                                        setUnitCost(value === '' ? 0 : Number(value));
                                    }}
                                    placeholder="Ej. 15.50"
                                />
                            </label>

                        </>
                    ) : (
                        <>

                            <label>
                                Seleccionar lote

                                <select
                                    required
                                    value={batchId}
                                    onChange={event =>
                                        setBatchId(Number(event.target.value))
                                    }
                                >
                                    {stock?.batches.map(batch => (
                                        <option
                                            key={batch.batchId}
                                            value={batch.batchId}
                                        >
                                            {batch.batchCode}
                                            {' - '}
                                            {qty(batch.stock)} unidades
                                        </option>
                                    ))}
                                </select>
                            </label>

                            {action === 'adjustment' && (
                                <label>
                                    Tipo de ajuste

                                    <select
                                        value={adjustType}
                                        onChange={event =>
                                            setAdjustType(
                                                event.target.value as AdjustmentType
                                            )
                                        }
                                    >
                                        <option value="ADJUSTMENT_IN">
                                            Aumentar stock
                                        </option>

                                        <option value="ADJUSTMENT_OUT">
                                            Disminuir stock
                                        </option>
                                    </select>
                                </label>
                            )}

                            <label>
                                Cantidad

                                <input
                                    required
                                    type="number"
                                    min="0.001"
                                    step="0.001"
                                    value={quantity === 0 ? '' : quantity}
                                    onFocus={(event) => event.target.select()}
                                    onChange={(event) => {
                                        const value = event.target.value;
                                        setQuantity(value === '' ? 0 : Number(value));
                                    }}
                                    placeholder="Ingrese la cantidad"
                                />
                            </label>

                            <label>
                                Motivo / referencia

                                <input
                                    required={action === 'adjustment'}
                                    value={reference}
                                    onChange={event =>
                                        setReference(event.target.value)
                                    }
                                    placeholder="Ej. Compra o conteo físico"
                                />
                            </label>

                        </>
                    )}

                    <div className={styles.actions}>

                        <button
                            type="button"
                            disabled={busy}
                            onClick={() => {
                                setAction(null);
                                setError('');
                            }}
                        >
                            Cancelar
                        </button>

                        <button
                            type="submit"
                            className={styles.primary}
                            disabled={
                                busy ||
                                (action !== 'batch' && !batchId)
                            }
                        >
                            {busy
                                ? 'Guardando...'
                                : 'Registrar'}
                        </button>

                    </div>

                </form>
            </Modal>

        </div>
    );
}
