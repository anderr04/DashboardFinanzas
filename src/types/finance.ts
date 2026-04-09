export interface Debt {
  id: string;
  name: string;
  totalAmount: number;
  paidAmount: number;
}

export interface Investment {
  id: string;
  symbol: string;
  shares: number;
  averagePrice?: number;
}

export interface CashAccount {
  id: string;
  name: string;
  balance: number;
}

export interface Subscription {
  id: string;
  name: string;
  monthlyCost: number;
}

export interface ClassRecord {
  id: string;
  month: string; // YYYY-MM
  student: string; // Ej: Telmo, Markel
  modality: 'Online' | 'Presencial';
  hours: number;
  paid?: boolean;
}

export interface Snapshot {
  date: string; // YYYY-MM-DD
  netWorth: number;
  cashValue: number;
  investmentsValue: number;
  classesValue: number;
}

export interface FinanceData {
  debts: Debt[];
  investments: Investment[];
  cash: CashAccount[];
  subscriptions: Subscription[];
  classes: ClassRecord[];
  history?: Snapshot[];
}

export const defaultData: FinanceData = {
  debts: [],
  investments: [],
  cash: [],
  subscriptions: [],
  classes: [],
  history: []
};
