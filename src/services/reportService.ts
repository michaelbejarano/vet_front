
import { httpClient } from './httpClient';

export interface DailyIncome {
    date: string;
    income: number;
    expenses: number;
    balance: number;
}

export interface DashboardReport {
    date: string;
    totalAppointments: number;
    pendingAppointments: number;
    confirmedAppointments: number;
    inProgressAppointments: number;
    completedAppointments: number;
    cancelledAppointments: number;
    noShowAppointments: number;
    expiredAppointments: number;
    activePets: number;
    totalOwners: number;
    activeEmployees: number;
    totalSales: number;
    salesAmount: number;
    totalIncome: number;
    totalExpenses: number;
    netBalance: number;
    pendingCommissions: number;
    dailyIncome: DailyIncome[];
}

export interface SalesReport {
    totalSales: number;
    totalAmount: number;
    totalDiscount: number;
    totalIgv: number;
    productSales: number;
    serviceSales: number;
    appliedDeposits: number;
    directPayments: number;
    sales: {
        id: number;
        customer: string;
        date: string;
        total: number;
        appliedDeposit: number;
        paidAmount: number;
        balance: number;
    }[];
}

export interface AppointmentsReport {
    total: number;
    byStatus: {
        status: string;
        count: number;
    }[];
    appointments: {
        id: number;
        petName: string;
        employeeName: string;
        startAt: string;
        endAt: string;
        status: string;
        reservedPrice: number;
        requiredDeposit: number;
    }[];
}

export interface TopService {
    serviceId: number;
    serviceName: string;
    completedCount: number;
    billedCount: number;
    completedValue: number;
    billedAmount: number;
}

export interface CashReport {
    totalIncome: number;
    totalExpenses: number;
    balance: number;
    totalMovements: number;
    byMethod: {
        name: string;
        income: number;
        expenses: number;
        balance: number;
        count: number;
    }[];
    byCategory: {
        name: string;
        income: number;
        expenses: number;
        balance: number;
        count: number;
    }[];
    byDate: DailyIncome[];
}

export interface TopSellingProduct {
    productId: number;
    productName: string;
    sku: string | null;
    unit: string;
    quantitySold: number;
    totalAmount: number;
}

export interface InventoryReport {
    fromDate: string;
    toDate: string;
    totalProductsSold: number;
    totalUnitsSold: number;
    totalAmount: number;
    topProducts: TopSellingProduct[];
}

export interface ReportFilters {
    fromDate: string;
    toDate: string;
}

export const reportService = {
    async getDashboard(
        date: string
    ): Promise<DashboardReport> {
        const response = await httpClient.get<DashboardReport>(
            '/reports/dashboard',
            {
                params: { date }
            }
        );

        return response.data;
    },

    async getSales(
        filters: ReportFilters
    ): Promise<SalesReport> {
        const response = await httpClient.get<SalesReport>(
            '/reports/sales',
            {
                params: filters
            }
        );

        return response.data;
    },

    async getAppointments(
        filters: ReportFilters
    ): Promise<AppointmentsReport> {
        const response = await httpClient.get<AppointmentsReport>(
            '/reports/appointments',
            {
                params: filters
            }
        );

        return response.data;
    },

    async getTopServices(
        filters: ReportFilters,
        limit = 6
    ): Promise<TopService[]> {
        const response = await httpClient.get<TopService[]>(
            '/reports/top-services',
            {
                params: {
                    ...filters,
                    limit
                }
            }
        );

        return response.data;
    },

    async getCash(
        filters: ReportFilters
    ): Promise<CashReport> {
        const response = await httpClient.get<CashReport>(
            '/reports/cash',
            {
                params: filters
            }
        );

        return response.data;
    },

    async getInventory(
        filters: ReportFilters,
        limit = 10
    ): Promise<InventoryReport> {
        const response = await httpClient.get<InventoryReport>(
            '/reports/inventory',
            {
                params: {
                    fromDate: filters.fromDate,
                    toDate: filters.toDate,
                    limit
                }
            }
        );

        return response.data;
    }
};
