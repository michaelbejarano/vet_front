
import { httpClient } from '@/services/httpClient';

export interface CashRegister {
  id: number;
  companyId: number;
  name: string;
  isActive: boolean;
  openSessionId: number | null;
  hasOpenSession: boolean;
}

export interface CashSession {
  id: number;
  cashRegisterId: number;
  openedByUserId: number;
  closedByUserId: number | null;
  openingFloat: number;
  openedAt: string;
  closedAt: string | null;
  countedCash: number | null;
  status: 'OPEN' | 'CLOSED';
}

export interface CashSummary {
  cashSessionId: number;
  cashRegisterId: number;
  cashRegisterName: string;
  status: string;
  openedAt: string;
  closedAt: string | null;

  openingFloat: number;

  totalIncome: number;
  totalExpense: number;
  netMovement: number;

  cashIncome: number;
  cashExpense: number;
  expectedCash: number;

  countedCash: number | null;
  difference: number | null;

  movementCount: number;
}

export interface CashMovement {
  id: number;
  cashSessionId: number;

  type: 'INCOME' | 'EXPENSE';
  category: string;
  method: string;

  amount: number;
  paymentId: number | null;
  description: string | null;
  reference: string | null;
  date: string;
}

export interface ManualMovement {
  type: 'INCOME' | 'EXPENSE';
  category: 'DEPOSIT' | 'EXPENSE' | 'WITHDRAWAL';
  amount: number;
  description: string;
  reference?: string;
}

export interface CashSessionFilters {
  cashRegisterId?: number;
  status?: 'OPEN' | 'CLOSED';
  fromDate?: string;
  toDate?: string;
}

export interface CashClosingResult {
  cashSessionId: number;
  expectedCash: number;
  countedCash: number;
  difference: number;
  status: string;
}

export const cashService = {
  async getRegisters(): Promise<CashRegister[]> {
    const response = await httpClient.get<CashRegister[]>(
      '/cash-registers'
    );

    return response.data;
  },

  async getOpenSession(
    cashRegisterId: number
  ): Promise<CashSession | null> {
    const response = await httpClient.get<{
      hasOpenSession: boolean;
      session: CashSession | null;
    }>(`/cash-sessions/open/${cashRegisterId}`);

    return response.data.session;
  },

  async open(
    cashRegisterId: number,
    openingFloat: number
  ): Promise<{ id: number }> {
    const response = await httpClient.post<{ id: number }>(
      '/cash-sessions/open',
      {
        cashRegisterId,
        openingFloat,
      }
    );

    return response.data;
  },

  async getSummary(
    sessionId: number
  ): Promise<CashSummary> {
    const response = await httpClient.get<CashSummary>(
      `/cash-sessions/${sessionId}/summary`
    );

    return response.data;
  },

  async getMovements(
    sessionId: number
  ): Promise<CashMovement[]> {
    const response = await httpClient.get<CashMovement[]>(
      `/cash-sessions/${sessionId}/movements`
    );

    return response.data;
  },

  async getSessions(
    filters: CashSessionFilters = {}
  ): Promise<CashSession[]> {
    const response = await httpClient.get<CashSession[]>(
      '/cash-sessions',
      {
        params: filters,
      }
    );

    return response.data;
  },

  async addMovement(
    sessionId: number,
    movement: ManualMovement
  ): Promise<{ id: number }> {
    const response = await httpClient.post<{ id: number }>(
      `/cash-sessions/${sessionId}/movements`,
      movement
    );

    return response.data;
  },

  async close(
    sessionId: number,
    countedCash: number
  ): Promise<CashClosingResult> {
    const response = await httpClient.post<CashClosingResult>(
      `/cash-sessions/${sessionId}/close`,
      {
        countedCash,
      }
    );

    return response.data;
  },
};
