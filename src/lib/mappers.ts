// Chuyển đổi giữa hàng dữ liệu DB (snake_case) và kiểu app (camelCase).
import type {
  Account,
  Budget,
  Category,
  SavingsGoal,
  Transaction,
  Transfer,
  RecurringRule,
} from "./types";
import type {
  AccountRow,
  BudgetRow,
  CategoryRow,
  SavingsGoalRow,
  TransactionRow,
} from "./supabase/types";

export const toAccount = (r: AccountRow): Account => ({
  id: r.id,
  name: r.name,
  kind: r.kind,
  initialBalance: Number(r.initial_balance),
  currency: r.currency,
  color: r.color,
  createdAt: r.created_at,
});

export const toCategory = (r: CategoryRow): Category => ({
  id: r.id,
  name: r.name,
  type: r.type,
  icon: r.icon,
  color: r.color,
  isDefault: r.is_default,
});

export const toTransaction = (r: TransactionRow): Transaction => ({
  id: r.id,
  type: r.type,
  amount: Number(r.amount),
  date: r.date,
  accountId: r.account_id,
  categoryId: r.category_id,
  note: r.note ?? undefined,
  createdAt: r.created_at,
});

export const toBudget = (r: BudgetRow): Budget => ({
  id: r.id,
  categoryId: r.category_id,
  amount: Number(r.amount),
  period: r.period,
  createdAt: r.created_at,
});

interface TransferRowLike {
  id: string;
  from_account_id: string;
  to_account_id: string;
  amount: number | string;
  date: string;
  note: string | null;
  created_at: string;
}

export const toTransfer = (r: TransferRowLike): Transfer => ({
  id: r.id,
  fromAccountId: r.from_account_id,
  toAccountId: r.to_account_id,
  amount: Number(r.amount),
  date: r.date,
  note: r.note ?? undefined,
  createdAt: r.created_at,
});

interface RecurringRowLike {
  id: string;
  type: "income" | "expense";
  amount: number | string;
  account_id: string;
  category_id: string | null;
  frequency: "daily" | "weekly" | "monthly" | "yearly";
  start_date: string;
  end_date: string | null;
  note: string | null;
  paused: boolean;
  last_generated_date: string | null;
  created_at: string;
}

export const toRecurring = (r: RecurringRowLike): RecurringRule => ({
  id: r.id,
  type: r.type,
  amount: Number(r.amount),
  accountId: r.account_id,
  categoryId: r.category_id,
  frequency: r.frequency,
  startDate: r.start_date,
  endDate: r.end_date ?? undefined,
  note: r.note ?? undefined,
  paused: r.paused,
  lastGeneratedDate: r.last_generated_date ?? undefined,
  createdAt: r.created_at,
});

export const toSavingsGoal = (r: SavingsGoalRow): SavingsGoal => ({
  id: r.id,
  name: r.name,
  targetAmount: Number(r.target_amount),
  currentAmount: Number(r.current_amount),
  deadline: r.deadline ?? undefined,
  note: r.note ?? undefined,
  createdAt: r.created_at,
});
