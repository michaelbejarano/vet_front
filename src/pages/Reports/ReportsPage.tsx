
import { useCallback, useEffect, useState } from 'react';

import {
    CalendarDays,
    Wallet,
    ShoppingCart,
    TrendingUp,
    PawPrint,
    RefreshCw,
    Activity,
    BarChart3,
    Users,
    Package,
    DollarSign
} from 'lucide-react';

import {
    ResponsiveContainer,
    AreaChart,
    Area,
    CartesianGrid,
    XAxis,
    YAxis,
    Tooltip,
    Legend,
    PieChart,
    Pie,
    Cell,
    BarChart,
    Bar
} from 'recharts';

import PageHeader from '@/components/common/PageHeader';

import { reportService } from '@/services/reportService';

import type {
    DashboardReport,
    SalesReport,
    AppointmentsReport,
    TopService,
    CashReport,
    InventoryReport,
    ReportFilters
} from '@/services/reportService';

import { getApiError } from '@/utils/apiError';

import styles from './ReportsPage.module.css';

type ProductMetric = 'quantity' | 'amount';

const COLORS = [
    '#0d9488',
    '#6366f1',
    '#f59e0b',
    '#3b82f6',
    '#ef4444',
    '#94a3b8',
    '#a855f7'
];

const statusLabels: Record<string, string> = {
    PENDING_PAYMENT: 'Pago pendiente',
    PENDING: 'Pendiente',
    CONFIRMED: 'Confirmada',
    IN_PROGRESS: 'En atención',
    COMPLETED: 'Completada',
    CANCELLED: 'Cancelada',
    NO_SHOW: 'No asistió',
    EXPIRED: 'Expirada'
};

const formatMoney = (value: number) =>
    new Intl.NumberFormat('es-PE', {
        style: 'currency',
        currency: 'PEN',
        maximumFractionDigits: 2
    }).format(value);

const formatNumber = (value: number) =>
    new Intl.NumberFormat('es-PE', {
        maximumFractionDigits: 2
    }).format(value);

const localDate = (date: Date): string => {
    const year = date.getFullYear();

    const month = String(
        date.getMonth() + 1
    ).padStart(2, '0');

    const day = String(
        date.getDate()
    ).padStart(2, '0');

    return `${year}-${month}-${day}`;
};

const initialFilters = (): ReportFilters => {
    const now = new Date();

    const start = new Date(
        now.getFullYear(),
        now.getMonth(),
        1
    );

    return {
        fromDate: localDate(start),
        toDate: localDate(now)
    };
};

export default function ReportsPage() {

    const [filters, setFilters] =
        useState<ReportFilters>(initialFilters);

    const [applied, setApplied] =
        useState<ReportFilters>(initialFilters);

    const [dashboard, setDashboard] =
        useState<DashboardReport | null>(null);

    const [sales, setSales] =
        useState<SalesReport | null>(null);

    const [appointments, setAppointments] =
        useState<AppointmentsReport | null>(null);

    const [cash, setCash] =
        useState<CashReport | null>(null);

    const [topServices, setTopServices] =
        useState<TopService[]>([]);

    const [inventory, setInventory] =
        useState<InventoryReport | null>(null);

    const [productMetric, setProductMetric] =
        useState<ProductMetric>('quantity');

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [refreshKey, setRefreshKey] = useState(0);

    // CARGAR REPORTES

    const loadReports = useCallback(async () => {
        setLoading(true);
        setError('');

        try {
            const [
                dashboardData,
                salesData,
                appointmentsData,
                cashData,
                servicesData,
                inventoryData
            ] = await Promise.all([
                reportService.getDashboard(applied.toDate),
                reportService.getSales(applied),
                reportService.getAppointments(applied),
                reportService.getCash(applied),
                reportService.getTopServices(applied, 6),
                reportService.getInventory(applied, 10)
            ]);

            setDashboard(dashboardData);
            setSales(salesData);
            setAppointments(appointmentsData);
            setCash(cashData);
            setTopServices(servicesData);
            setInventory(inventoryData);

        } catch (err) {
            setError(
                getApiError(
                    err,
                    'No se pudieron cargar los reportes'
                )
            );

            setDashboard(null);
            setSales(null);
            setAppointments(null);
            setCash(null);
            setTopServices([]);
            setInventory(null);

        } finally {
            setLoading(false);
        }
    }, [applied, refreshKey]);

    useEffect(() => {
        void loadReports();
    }, [loadReports]);

    // FILTROS

    const applyFilters = () => {
        if (
            !filters.fromDate ||
            !filters.toDate ||
            filters.fromDate > filters.toDate
        ) {
            setError('Selecciona un rango de fechas válido.');
            return;
        }

        setError('');
        setApplied({ ...filters });
    };

    const quickRange = (days: number) => {
        const end = new Date();
        const start = new Date();

        start.setDate(end.getDate() - days + 1);

        const next: ReportFilters = {
            fromDate: localDate(start),
            toDate: localDate(end)
        };

        setFilters(next);
        setApplied(next);
    };

    const refreshReports = () => {
        setRefreshKey(previous => previous + 1);
    };

    // DATOS PARA GRAFICOS

    const incomeData = (cash?.byDate ?? []).map(item => ({
        date: item.date.substring(5, 10),
        ingresos: item.income,
        gastos: item.expenses
    }));

    const statusData = (appointments?.byStatus ?? [])
        .filter(item => item.count > 0)
        .map(item => ({
            name: statusLabels[item.status] ?? item.status,
            value: item.count
        }));

    const servicesData = topServices.map(item => ({
        name: item.serviceName,
        cantidad: item.completedCount
    }));

    const salesMix = [
        {
            name: 'Productos',
            value: sales?.productSales ?? 0
        },
        {
            name: 'Servicios',
            value: sales?.serviceSales ?? 0
        }
    ].filter(item => item.value > 0);

    const sortedProducts = [
        ...(inventory?.topProducts ?? [])
    ].sort((a, b) =>
        productMetric === 'quantity'
            ? b.quantitySold - a.quantitySold
            : b.totalAmount - a.totalAmount
    );

    const productChartData = sortedProducts.map(product => ({
        name: product.productName,
        sku: product.sku,
        unit: product.unit,
        quantitySold: product.quantitySold,
        totalAmount: product.totalAmount,
        value:
            productMetric === 'quantity'
                ? product.quantitySold
                : product.totalAmount
    }));

    const selectedProductTotal = productChartData.reduce(
        (sum, item) => sum + item.value,
        0
    );

    return (
        <div className={styles.page}>

            <PageHeader
                title="Reportes y estadísticas"
                description="Análisis del rendimiento de la veterinaria"
                actions={
                    <button
                        type="button"
                        className={styles.refresh}
                        onClick={refreshReports}
                        disabled={loading}
                    >
                        <RefreshCw size={16} />
                        Actualizar
                    </button>
                }
            />

            {/* FILTROS DE FECHAS */}

            <section className={styles.filters}>

                <div className={styles.filterHeading}>
                    <div>
                        <strong>Período de análisis</strong>
                        <p>
                            Consulta los indicadores y gráficos
                            según las fechas seleccionadas.
                        </p>
                    </div>

                    <div className={styles.quickFilters}>
                        <button
                            type="button"
                            onClick={() => quickRange(7)}
                        >
                            7 días
                        </button>

                        <button
                            type="button"
                            onClick={() => quickRange(30)}
                        >
                            30 días
                        </button>
                    </div>
                </div>

                <div className={styles.dateFilters}>

                    <label>
                        Desde
                        <input
                            type="date"
                            value={filters.fromDate}
                            onChange={event =>
                                setFilters(previous => ({
                                    ...previous,
                                    fromDate: event.target.value
                                }))
                            }
                        />
                    </label>

                    <label>
                        Hasta
                        <input
                            type="date"
                            value={filters.toDate}
                            onChange={event =>
                                setFilters(previous => ({
                                    ...previous,
                                    toDate: event.target.value
                                }))
                            }
                        />
                    </label>

                    <button
                        type="button"
                        className={styles.primary}
                        disabled={loading}
                        onClick={applyFilters}
                    >
                        Aplicar filtros
                    </button>

                </div>
            </section>

            {error && (
                <p className={styles.error} role="alert">
                    {error}
                </p>
            )}

            {loading ? (
                <div className={styles.loading}>
                    <RefreshCw size={24} />
                    Cargando reportes de VetCare...
                </div>
            ) : !dashboard || !sales || !appointments || !cash || !inventory ? (
                <div className={styles.empty}>
                    No se pudieron obtener los reportes.
                    Comprueba la conexión con el backend.
                </div>
            ) : (
                <>

                    {/* RESUMEN GENERAL */}

                    <div className={styles.sectionHeading}>
                        <div>
                            <h2>Resumen del período</h2>
                            <p>
                                {applied.fromDate} al {applied.toDate}
                            </p>
                        </div>
                    </div>

                    <div className={styles.stats}>

                        <article className={styles.statCard}>
                            <div className={styles.statTop}>
                                <span>Ingresos de caja</span>
                                <Wallet size={21} color="#0d9488" />
                            </div>

                            <strong>
                                {formatMoney(cash.totalIncome)}
                            </strong>

                            <small>Ingresos registrados</small>
                        </article>

                        <article className={styles.statCard}>
                            <div className={styles.statTop}>
                                <span>Ventas realizadas</span>
                                <ShoppingCart size={21} color="#2563eb" />
                            </div>

                            <strong>
                                {formatMoney(sales.totalAmount)}
                            </strong>

                            <small>
                                {formatNumber(sales.totalSales)} ventas
                            </small>
                        </article>

                        <article className={styles.statCard}>
                            <div className={styles.statTop}>
                                <span>Citas registradas</span>
                                <CalendarDays size={21} color="#7c3aed" />
                            </div>

                            <strong>
                                {formatNumber(appointments.total)}
                            </strong>

                            <small>En el período</small>
                        </article>

                        <article className={styles.statCard}>
                            <div className={styles.statTop}>
                                <span>Balance de caja</span>
                                <TrendingUp size={21} color="#ea580c" />
                            </div>

                            <strong>
                                {formatMoney(cash.balance)}
                            </strong>

                            <small>Ingresos menos gastos</small>
                        </article>

                    </div>

                    {/* GRAFICOS */}

                    <div className={styles.chartsGrid}>

                        {/* INGRESOS Y GASTOS */}

                        <section className={styles.chartCard}>
                            <div className={styles.chartTitle}>
                                <div>
                                    <h3>Ingresos y gastos</h3>
                                    <p>Evolución durante el período</p>
                                </div>
                                <Activity size={21} />
                            </div>

                            {incomeData.length === 0 ? (
                                <div className={styles.empty}>
                                    Sin movimientos de caja para este período.
                                </div>
                            ) : (
                                <div className={styles.chartArea}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={incomeData}>
                                            <CartesianGrid
                                                strokeDasharray="3 3"
                                                vertical={false}
                                            />

                                            <XAxis dataKey="date" fontSize={12} />
                                            <YAxis fontSize={12} width={60} />

                                            <Tooltip
                                                formatter={(value, name) => [
                                                    formatMoney(Number(value ?? 0)),
                                                    name === 'ingresos'
                                                        ? 'Ingresos'
                                                        : 'Gastos'
                                                ]}
                                            />

                                            <Legend />

                                            <Area
                                                type="monotone"
                                                dataKey="ingresos"
                                                stroke="#0d9488"
                                                strokeWidth={3}
                                                fill="#0d9488"
                                                fillOpacity={0.15}
                                            />

                                            <Area
                                                type="monotone"
                                                dataKey="gastos"
                                                stroke="#f59e0b"
                                                strokeWidth={2}
                                                fill="transparent"
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            )}
                        </section>

                        {/* CITAS POR ESTADO */}

                        <section className={styles.chartCard}>
                            <div className={styles.chartTitle}>
                                <div>
                                    <h3>Estado de las citas</h3>
                                    <p>Distribución de atenciones</p>
                                </div>
                                <CalendarDays size={21} />
                            </div>

                            {statusData.length === 0 ? (
                                <div className={styles.empty}>
                                    No hay citas durante este período.
                                </div>
                            ) : (
                                <>
                                    <div className={styles.chartArea}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={statusData}
                                                    dataKey="value"
                                                    nameKey="name"
                                                    innerRadius={65}
                                                    outerRadius={100}
                                                    paddingAngle={3}
                                                >
                                                    {statusData.map((item, index) => (
                                                        <Cell
                                                            key={item.name}
                                                            fill={COLORS[index % COLORS.length]}
                                                        />
                                                    ))}
                                                </Pie>
                                                <Tooltip />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>

                                    <div className={styles.legendList}>
                                        {statusData.map((item, index) => (
                                            <div key={item.name}>
                                                <span
                                                    className={styles.legendDot}
                                                    style={{
                                                        background: COLORS[index % COLORS.length]
                                                    }}
                                                />
                                                <span>{item.name}</span>
                                                <strong>{item.value}</strong>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </section>

                        {/* SERVICIOS */}

                        <section className={styles.chartCard}>
                            <div className={styles.chartTitle}>
                                <div>
                                    <h3>Servicios más solicitados</h3>
                                    <p>Servicios completados</p>
                                </div>
                                <BarChart3 size={21} />
                            </div>

                            {servicesData.length === 0 ? (
                                <div className={styles.empty}>
                                    No hay servicios completados.
                                </div>
                            ) : (
                                <div className={styles.chartArea}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart
                                            data={servicesData}
                                            layout="vertical"
                                            margin={{ left: 10, right: 18 }}
                                        >
                                            <CartesianGrid
                                                strokeDasharray="3 3"
                                                horizontal={false}
                                            />

                                            <XAxis
                                                type="number"
                                                allowDecimals={false}
                                            />

                                            <YAxis
                                                type="category"
                                                dataKey="name"
                                                width={110}
                                                tick={{ fontSize: 11 }}
                                            />

                                            <Tooltip />

                                            <Bar
                                                dataKey="cantidad"
                                                name="Servicios completados"
                                                fill="#6366f1"
                                                radius={[0, 7, 7, 0]}
                                            />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            )}
                        </section>

                        {/* DISTRIBUCION DE VENTAS */}

                        <section className={styles.chartCard}>
                            <div className={styles.chartTitle}>
                                <div>
                                    <h3>Distribución de ventas</h3>
                                    <p>Productos frente a servicios</p>
                                </div>
                                <ShoppingCart size={21} />
                            </div>

                            {salesMix.length === 0 ? (
                                <div className={styles.empty}>
                                    No hay ventas registradas.
                                </div>
                            ) : (
                                <>
                                    <div className={styles.chartArea}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={salesMix}
                                                    dataKey="value"
                                                    nameKey="name"
                                                    innerRadius={60}
                                                    outerRadius={100}
                                                >
                                                    {salesMix.map((item, index) => (
                                                        <Cell
                                                            key={item.name}
                                                            fill={COLORS[index]}
                                                        />
                                                    ))}
                                                </Pie>

                                                <Tooltip
                                                    formatter={value =>
                                                        formatMoney(Number(value ?? 0))
                                                    }
                                                />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>

                                    <div className={styles.legendList}>
                                        {salesMix.map((item, index) => (
                                            <div key={item.name}>
                                                <span
                                                    className={styles.legendDot}
                                                    style={{
                                                        background: COLORS[index]
                                                    }}
                                                />

                                                <span>{item.name}</span>

                                                <strong>
                                                    {formatMoney(item.value)}
                                                </strong>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </section>

                    </div>

                    {/* NUEVO REPORTE DE PRODUCTOS */}

                    <div className={styles.sectionHeading}>
                        <div>
                            <h2>Rendimiento de productos</h2>
                            <p>
                                Ventas confirmadas del período seleccionado
                            </p>
                        </div>
                    </div>

                    <div className={styles.stats}>

                        <article className={styles.statCard}>
                            <div className={styles.statTop}>
                                <span>Productos distintos vendidos</span>
                                <Package size={21} color="#0d9488" />
                            </div>

                            <strong>
                                {formatNumber(inventory.totalProductsSold)}
                            </strong>

                            <small>
                                Productos con ventas registradas
                            </small>
                        </article>

                        <article className={styles.statCard}>
                            <div className={styles.statTop}>
                                <span>Cantidad total vendida</span>
                                <ShoppingCart size={21} color="#2563eb" />
                            </div>

                            <strong>
                                {formatNumber(inventory.totalUnitsSold)}
                            </strong>

                            <small>
                                Suma de cantidades de diferentes unidades
                            </small>
                        </article>

                        <article className={styles.statCard}>
                            <div className={styles.statTop}>
                                <span>Importe de productos</span>
                                <DollarSign size={21} color="#16a34a" />
                            </div>

                            <strong>
                                {formatMoney(inventory.totalAmount)}
                            </strong>

                            <small>
                                Ventas confirmadas de productos
                            </small>
                        </article>

                    </div>

                    <section className={styles.chartCard}>

                        <div className={styles.chartTitle}>
                            <div>
                                <h3>Top 10 productos más vendidos</h3>
                                <p>
                                    Compara cantidades e importes
                                    por producto
                                </p>
                            </div>

                            <Package size={22} />
                        </div>

                        <div className={styles.productControls}>

                            <button
                                type="button"
                                className={
                                    productMetric === 'quantity'
                                        ? styles.metricActive
                                        : styles.metricButton
                                }
                                onClick={() => setProductMetric('quantity')}
                            >
                                <BarChart3 size={16} />
                                Cantidad vendida
                            </button>

                            <button
                                type="button"
                                className={
                                    productMetric === 'amount'
                                        ? styles.metricActive
                                        : styles.metricButton
                                }
                                onClick={() => setProductMetric('amount')}
                            >
                                <DollarSign size={16} />
                                Importe vendido
                            </button>

                        </div>

                        {productChartData.length === 0 ? (
                            <div className={styles.empty}>
                                Todavía no hay ventas confirmadas de
                                productos durante este período.
                            </div>
                        ) : (
                            <>
                                <div
                                    className={styles.chartArea}
                                    style={{
                                        height: Math.max(
                                            310,
                                            productChartData.length * 52
                                        )
                                    }}
                                >
                                    <ResponsiveContainer
                                        width="100%"
                                        height="100%"
                                    >
                                        <BarChart
                                            data={productChartData}
                                            layout="vertical"
                                            margin={{
                                                top: 12,
                                                right: 30,
                                                bottom: 12,
                                                left: 15
                                            }}
                                        >
                                            <CartesianGrid
                                                strokeDasharray="3 3"
                                                horizontal={false}
                                            />

                                            <XAxis
                                                type="number"
                                                tick={{ fontSize: 12 }}
                                                allowDecimals={
                                                    productMetric === 'quantity'
                                                }
                                            />

                                            <YAxis
                                                type="category"
                                                dataKey="name"
                                                width={145}
                                                tick={{ fontSize: 12 }}
                                                interval={0}
                                            />

                                            <Tooltip
                                                formatter={value => [
                                                    productMetric === 'amount'
                                                        ? formatMoney(Number(value ?? 0))
                                                        : formatNumber(Number(value ?? 0)),
                                                    productMetric === 'amount'
                                                        ? 'Importe vendido'
                                                        : 'Cantidad vendida'
                                                ]}
                                            />

                                            <Bar
                                                dataKey="value"
                                                name={
                                                    productMetric === 'amount'
                                                        ? 'Importe vendido'
                                                        : 'Cantidad vendida'
                                                }
                                                fill="#0d9488"
                                                radius={[0, 7, 7, 0]}
                                                maxBarSize={29}
                                            />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>

                                <div className={styles.productSummary}>
                                    <span>
                                        {productMetric === 'amount'
                                            ? 'Importe total del Top 10'
                                            : 'Cantidad total del Top 10'}
                                    </span>

                                    <strong>
                                        {productMetric === 'amount'
                                            ? formatMoney(selectedProductTotal)
                                            : formatNumber(selectedProductTotal)}
                                    </strong>
                                </div>

                                <div className={styles.productTable}>
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>Producto</th>
                                                <th>Código</th>
                                                <th>Cantidad</th>
                                                <th>Unidad</th>
                                                <th>Importe</th>
                                            </tr>
                                        </thead>

                                        <tbody>
                                            {sortedProducts.map(product => (
                                                <tr key={product.productId}>
                                                    <td>{product.productName}</td>
                                                    <td>{product.sku || '—'}</td>
                                                    <td>
                                                        {formatNumber(product.quantitySold)}
                                                    </td>
                                                    <td>{product.unit}</td>
                                                    <td>
                                                        {formatMoney(product.totalAmount)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        )}

                    </section>

                    {/* INDICADORES GENERALES */}

                    <div className={styles.sectionHeading}>
                        <div>
                            <h2>Indicadores generales</h2>
                            <p>
                                Estado del sistema al {applied.toDate}
                            </p>
                        </div>
                    </div>

                    <div className={styles.stats}>

                        <article className={styles.statCard}>
                            <div className={styles.statTop}>
                                <span>Mascotas activas</span>
                                <PawPrint size={21} color="#0d9488" />
                            </div>

                            <strong>
                                {formatNumber(dashboard.activePets)}
                            </strong>

                            <small>Pacientes activos</small>
                        </article>

                        <article className={styles.statCard}>
                            <div className={styles.statTop}>
                                <span>Propietarios</span>
                                <Users size={21} color="#2563eb" />
                            </div>

                            <strong>
                                {formatNumber(dashboard.totalOwners)}
                            </strong>

                            <small>Propietarios registrados</small>
                        </article>

                        <article className={styles.statCard}>
                            <div className={styles.statTop}>
                                <span>Citas completadas del día</span>
                                <CalendarDays size={21} color="#7c3aed" />
                            </div>

                            <strong>
                                {formatNumber(
                                    dashboard.completedAppointments
                                )}
                            </strong>

                            <small>En la fecha de corte</small>
                        </article>

                        <article className={styles.statCard}>
                            <div className={styles.statTop}>
                                <span>Comisiones pendientes</span>
                                <TrendingUp size={21} color="#ea580c" />
                            </div>

                            <strong>
                                {formatMoney(dashboard.pendingCommissions)}
                            </strong>

                            <small>Pagos pendientes</small>
                        </article>

                    </div>

                    <p className={styles.footnote}>
                        Los importes de ventas y caja son indicadores
                        diferentes y no deben sumarse directamente.
                        Las cantidades de productos pueden corresponder
                        a distintas unidades de medida.
                    </p>

                </>
            )}
        </div>
    );
}
