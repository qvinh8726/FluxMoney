// Mô hình miền cho ứng dụng Quản lý Dòng tiền (Cash Flow Management).
// Lưu ý: hiện lưu ở localStorage; lớp dữ liệu được tách để có thể thay bằng Supabase sau.

export type TxType = "income" | "expense";

export type AccountKind = "cash" | "bank" | "ewallet" | "credit" | "other";

export type BudgetPeriod = "monthly" | "quarterly" | "yearly";

export type RecurringFrequency = "daily" | "weekly" | "monthly" | "yearly";

export interface Account {
  id: string;
  name: string;
  kind: AccountKind;
  initialBalance: number;
  currency: string;
  color: string;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  type: TxType;
  icon: string; // tên icon Lucide
  color: string;
  isDefault?: boolean;
}

export interface Transaction {
  id: string;
  type: TxType;
  amount: number; // luôn > 0
  date: string; // YYYY-MM-DD
  accountId: string;
  categoryId: string | null; // null = chưa phân loại
  note?: string;
  createdAt: string;
}

export interface Budget {
  id: string;
  categoryId: string;
  amount: number;
  period: BudgetPeriod;
  createdAt: string;
}

export interface RecurringRule {
  id: string;
  type: TxType;
  amount: number;
  accountId: string;
  categoryId: string | null;
  frequency: RecurringFrequency;
  startDate: string; // YYYY-MM-DD
  endDate?: string;
  note?: string;
  paused: boolean;
  lastGeneratedDate?: string;
  createdAt: string;
}

export interface Transfer {
  id: string;
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  date: string; // YYYY-MM-DD
  note?: string;
  createdAt: string;
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: string; // YYYY-MM-DD
  note?: string;
  createdAt: string;
}
