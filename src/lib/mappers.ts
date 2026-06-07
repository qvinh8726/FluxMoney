// Chuyển đổi giữa hàng dữ liệu DB (snake_case) và kiểu app (camelCase).
import type { Account, Budget, Category, Transaction } from "./types";
import type {
  AccountRow,
  BudgetRow,
  CategoryRow,
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
