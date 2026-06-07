// Kiểu dữ liệu Database cho Supabase client (khớp với schema 0001_init.sql).
// Có thể thay bằng `supabase gen types typescript` sau này.

export type TxType = "income" | "expense";
export type AccountKind = "cash" | "bank" | "ewallet" | "credit" | "other";
export type BudgetPeriod = "monthly" | "quarterly" | "yearly";

interface Row<TInsert, TRow> {
  Row: TRow;
  Insert: TInsert;
  Update: Partial<TInsert>;
  Relationships: [];
}

export interface ProfileRow {
  id: string;
  display_name: string | null;
  base_currency: string;
  created_at: string;
}

export interface AccountRow {
  id: string;
  user_id: string;
  name: string;
  kind: AccountKind;
  initial_balance: number;
  currency: string;
  color: string;
  created_at: string;
}

export interface CategoryRow {
  id: string;
  user_id: string;
  name: string;
  type: TxType;
  icon: string;
  color: string;
  is_default: boolean;
  created_at: string;
}

export interface TransactionRow {
  id: string;
  user_id: string;
  type: TxType;
  amount: number;
  date: string;
  account_id: string;
  category_id: string | null;
  note: string | null;
  currency: string;
  created_at: string;
}

export interface BudgetRow {
  id: string;
  user_id: string;
  category_id: string;
  amount: number;
  period: BudgetPeriod;
  created_at: string;
}

export interface Database {
  public: {
    Tables: {
      profiles: Row<Partial<ProfileRow> & { id: string }, ProfileRow>;
      accounts: Row<Omit<AccountRow, "id" | "created_at">, AccountRow>;
      categories: Row<Omit<CategoryRow, "id" | "created_at">, CategoryRow>;
      transactions: Row<Omit<TransactionRow, "id" | "created_at">, TransactionRow>;
      budgets: Row<Omit<BudgetRow, "id" | "created_at">, BudgetRow>;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
