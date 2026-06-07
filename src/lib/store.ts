"use client";

import { create } from "zustand";
import type { Account, Budget, Category, Transaction, Transfer, TxType } from "./types";
import type { RecurringRule, RecurringFrequency } from "./types";
import { createClient } from "./supabase/client";
import {
  toAccount,
  toBudget,
  toCategory,
  toTransaction,
  toTransfer,
  toRecurring,
} from "./mappers";
import { vnTodayKey, toDateKey } from "./utils";
import { toast } from "./toast";
import { addDays, addWeeks, addMonths, addYears, parseISO } from "date-fns";

/** Mốc kỳ kế tiếp của một ngày theo tần suất (trả về YYYY-MM-DD). */
function nextOccurrence(dateStr: string, freq: RecurringFrequency): string {
  const d = parseISO(dateStr);
  const n =
    freq === "daily"
      ? addDays(d, 1)
      : freq === "weekly"
      ? addWeeks(d, 1)
      : freq === "monthly"
      ? addMonths(d, 1)
      : addYears(d, 1);
  return toDateKey(n);
}

interface State {
  userId: string | null;
  baseCurrency: string;
  accounts: Account[];
  categories: Category[];
  transactions: Transaction[];
  budgets: Budget[];
  transfers: Transfer[];
  recurringRules: RecurringRule[];
  loaded: boolean;
  loading: boolean;

  loadAll: () => Promise<void>;

  addTransaction: (t: Omit<Transaction, "id" | "createdAt">) => Promise<void>;
  updateTransaction: (id: string, patch: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;

  addAccount: (a: Omit<Account, "id" | "createdAt">) => Promise<void>;
  updateAccount: (id: string, patch: Partial<Account>) => Promise<void>;
  deleteAccount: (id: string) => Promise<void>;

  addCategory: (c: Omit<Category, "id">) => Promise<void>;
  updateCategory: (id: string, patch: Partial<Category>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;

  addBudget: (b: Omit<Budget, "id" | "createdAt">) => Promise<void>;
  updateBudget: (id: string, patch: Partial<Budget>) => Promise<void>;
  deleteBudget: (id: string) => Promise<void>;

  addTransfer: (t: Omit<Transfer, "id" | "createdAt">) => Promise<void>;
  updateTransfer: (id: string, patch: Partial<Transfer>) => Promise<void>;
  deleteTransfer: (id: string) => Promise<void>;

  addRecurring: (r: Omit<RecurringRule, "id" | "createdAt">) => Promise<void>;
  updateRecurring: (id: string, patch: Partial<RecurringRule>) => Promise<void>;
  deleteRecurring: (id: string) => Promise<void>;
  generateDueRecurring: () => Promise<void>;

  setBaseCurrency: (c: string) => Promise<void>;
  exportData: () => string;
  clear: () => void;
}

// Khởi tạo lười qua Proxy: client chỉ được tạo khi có property được truy cập
// (tức lúc chạy thật trong trình duyệt), KHÔNG tạo lúc build/prerender.
let _client: ReturnType<typeof createClient> | null = null;
const supabase = new Proxy({} as ReturnType<typeof createClient>, {
  get(_target, prop) {
    _client ??= createClient();
    // @ts-expect-error - forward động tới client thật
    return _client[prop];
  },
});

// Chống chạy generateDueRecurring chồng nhau (loadAll + addRecurring, hoặc
// nhiều tab). Cờ ở module-level vì không cần kích hoạt render.
let _generating = false;

export const useStore = create<State>()((set, get) => ({
  userId: null,
  baseCurrency: "VND",
  accounts: [],
  categories: [],
  transactions: [],
  budgets: [],
  transfers: [],
  recurringRules: [],
  loaded: false,
  loading: false,

  loadAll: async () => {
    if (get().loading || get().loaded) return;
    set({ loading: true });
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      set({ loading: false });
      return;
    }

    const [profileRes, accRes, catRes, txRes, budRes, trfRes, recRes] =
      await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
        supabase.from("accounts").select("*").order("created_at"),
        supabase.from("categories").select("*").order("created_at"),
        supabase.from("transactions").select("*").order("date", { ascending: false }),
        supabase.from("budgets").select("*").order("created_at"),
        supabase.from("transfers").select("*").order("date", { ascending: false }),
        supabase.from("recurring_rules").select("*").order("created_at"),
      ]);

    set({
      userId: user.id,
      baseCurrency: profileRes.data?.base_currency ?? "VND",
      accounts: (accRes.data ?? []).map(toAccount),
      categories: (catRes.data ?? []).map(toCategory),
      transactions: (txRes.data ?? []).map(toTransaction),
      budgets: (budRes.data ?? []).map(toBudget),
      transfers: (trfRes.data ?? []).map(toTransfer),
      recurringRules: (recRes.data ?? []).map(toRecurring),
      loaded: true,
      loading: false,
    });

    // Tự sinh các giao dịch định kỳ tới hạn (không chặn render).
    get().generateDueRecurring();
  },

  // ---------- Transactions ----------
  addTransaction: async (t) => {
    const userId = get().userId;
    if (!userId) return;
    const { data, error } = await supabase
      .from("transactions")
      .insert({
        user_id: userId,
        type: t.type,
        amount: t.amount,
        date: t.date,
        account_id: t.accountId,
        category_id: t.categoryId,
        note: t.note ?? null,
        currency: get().baseCurrency,
      })
      .select()
      .single();
    if (error || !data) {
      toast.error("Không lưu được giao dịch. Vui lòng thử lại.");
      return;
    }
    set((s) => ({ transactions: [toTransaction(data), ...s.transactions] }));
  },
  updateTransaction: async (id, patch) => {
    const { data, error } = await supabase
      .from("transactions")
      .update({
        type: patch.type,
        amount: patch.amount,
        date: patch.date,
        account_id: patch.accountId,
        category_id: patch.categoryId,
        note: patch.note ?? null,
      })
      .eq("id", id)
      .select()
      .single();
    if (error || !data) {
      toast.error("Không cập nhật được giao dịch. Vui lòng thử lại.");
      return;
    }
    set((s) => ({
      transactions: s.transactions.map((t) => (t.id === id ? toTransaction(data) : t)),
    }));
  },
  deleteTransaction: async (id) => {
    const { error } = await supabase.from("transactions").delete().eq("id", id);
    if (error) {
      toast.error("Không xóa được giao dịch. Vui lòng thử lại.");
      return;
    }
    set((s) => ({ transactions: s.transactions.filter((t) => t.id !== id) }));
  },

  // ---------- Accounts ----------
  addAccount: async (a) => {
    const userId = get().userId;
    if (!userId) return;
    const { data, error } = await supabase
      .from("accounts")
      .insert({
        user_id: userId,
        name: a.name,
        kind: a.kind,
        initial_balance: a.initialBalance,
        currency: a.currency,
        color: a.color,
      })
      .select()
      .single();
    if (error || !data) {
      toast.error("Không lưu được ví. Vui lòng thử lại.");
      return;
    }
    set((s) => ({ accounts: [...s.accounts, toAccount(data)] }));
  },
  updateAccount: async (id, patch) => {
    const { data, error } = await supabase
      .from("accounts")
      .update({
        name: patch.name,
        kind: patch.kind,
        initial_balance: patch.initialBalance,
        color: patch.color,
      })
      .eq("id", id)
      .select()
      .single();
    if (error || !data) {
      toast.error("Không cập nhật được ví. Vui lòng thử lại.");
      return;
    }
    set((s) => ({ accounts: s.accounts.map((a) => (a.id === id ? toAccount(data) : a)) }));
  },
  deleteAccount: async (id) => {
    const { error } = await supabase.from("accounts").delete().eq("id", id);
    if (error) {
      toast.error("Không xóa được ví. Vui lòng thử lại.");
      return;
    }
    set((s) => ({
      accounts: s.accounts.filter((a) => a.id !== id),
      transactions: s.transactions.filter((t) => t.accountId !== id),
      transfers: s.transfers.filter(
        (t) => t.fromAccountId !== id && t.toAccountId !== id
      ),
    }));
  },

  // ---------- Categories ----------
  addCategory: async (c) => {
    const userId = get().userId;
    if (!userId) return;
    const { data, error } = await supabase
      .from("categories")
      .insert({
        user_id: userId,
        name: c.name,
        type: c.type,
        icon: c.icon,
        color: c.color,
        is_default: c.isDefault ?? false,
      })
      .select()
      .single();
    if (error || !data) {
      toast.error("Không lưu được danh mục. Vui lòng thử lại.");
      return;
    }
    set((s) => ({ categories: [...s.categories, toCategory(data)] }));
  },
  updateCategory: async (id, patch) => {
    const { data, error } = await supabase
      .from("categories")
      .update({ name: patch.name, type: patch.type, color: patch.color, icon: patch.icon })
      .eq("id", id)
      .select()
      .single();
    if (error || !data) {
      toast.error("Không cập nhật được danh mục. Vui lòng thử lại.");
      return;
    }
    set((s) => ({
      categories: s.categories.map((c) => (c.id === id ? toCategory(data) : c)),
    }));
  },
  deleteCategory: async (id) => {
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) {
      toast.error("Không xóa được danh mục. Vui lòng thử lại.");
      return;
    }
    set((s) => ({
      categories: s.categories.filter((c) => c.id !== id),
      transactions: s.transactions.map((t) =>
        t.categoryId === id ? { ...t, categoryId: null } : t
      ),
      budgets: s.budgets.filter((b) => b.categoryId !== id),
    }));
  },

  // ---------- Budgets ----------
  addBudget: async (b) => {
    const userId = get().userId;
    if (!userId) return;
    const { data, error } = await supabase
      .from("budgets")
      .insert({
        user_id: userId,
        category_id: b.categoryId,
        amount: b.amount,
        period: b.period,
      })
      .select()
      .single();
    if (error || !data) {
      toast.error("Không lưu được ngân sách. Vui lòng thử lại.");
      return;
    }
    set((s) => ({ budgets: [...s.budgets, toBudget(data)] }));
  },
  updateBudget: async (id, patch) => {
    const { data, error } = await supabase
      .from("budgets")
      .update({ category_id: patch.categoryId, amount: patch.amount, period: patch.period })
      .eq("id", id)
      .select()
      .single();
    if (error || !data) {
      toast.error("Không cập nhật được ngân sách. Vui lòng thử lại.");
      return;
    }
    set((s) => ({ budgets: s.budgets.map((b) => (b.id === id ? toBudget(data) : b)) }));
  },
  deleteBudget: async (id) => {
    const { error } = await supabase.from("budgets").delete().eq("id", id);
    if (error) {
      toast.error("Không xóa được ngân sách. Vui lòng thử lại.");
      return;
    }
    set((s) => ({ budgets: s.budgets.filter((b) => b.id !== id) }));
  },

  // ---------- Transfers ----------
  addTransfer: async (t) => {
    const userId = get().userId;
    if (!userId) return;
    const { data, error } = await supabase
      .from("transfers")
      .insert({
        user_id: userId,
        from_account_id: t.fromAccountId,
        to_account_id: t.toAccountId,
        amount: t.amount,
        date: t.date,
        note: t.note ?? null,
      })
      .select()
      .single();
    if (error || !data) {
      toast.error("Không lưu được chuyển khoản. Vui lòng thử lại.");
      return;
    }
    set((s) => ({ transfers: [toTransfer(data), ...s.transfers] }));
  },
  updateTransfer: async (id, patch) => {
    const { data, error } = await supabase
      .from("transfers")
      .update({
        from_account_id: patch.fromAccountId,
        to_account_id: patch.toAccountId,
        amount: patch.amount,
        date: patch.date,
        note: patch.note ?? null,
      })
      .eq("id", id)
      .select()
      .single();
    if (error || !data) {
      toast.error("Không cập nhật được chuyển khoản. Vui lòng thử lại.");
      return;
    }
    set((s) => ({
      transfers: s.transfers.map((t) => (t.id === id ? toTransfer(data) : t)),
    }));
  },
  deleteTransfer: async (id) => {
    const { error } = await supabase.from("transfers").delete().eq("id", id);
    if (error) {
      toast.error("Không xóa được chuyển khoản. Vui lòng thử lại.");
      return;
    }
    set((s) => ({ transfers: s.transfers.filter((t) => t.id !== id) }));
  },

  // ---------- Recurring rules ----------
  addRecurring: async (r) => {
    const userId = get().userId;
    if (!userId) return;
    const { data, error } = await supabase
      .from("recurring_rules")
      .insert({
        user_id: userId,
        type: r.type,
        amount: r.amount,
        account_id: r.accountId,
        category_id: r.categoryId,
        frequency: r.frequency,
        start_date: r.startDate,
        end_date: r.endDate ?? null,
        note: r.note ?? null,
        paused: r.paused ?? false,
      })
      .select()
      .single();
    if (error || !data) {
      toast.error("Không lưu được quy tắc định kỳ. Vui lòng thử lại.");
      return;
    }
    set((s) => ({ recurringRules: [...s.recurringRules, toRecurring(data)] }));
    get().generateDueRecurring();
  },
  updateRecurring: async (id, patch) => {
    const { data, error } = await supabase
      .from("recurring_rules")
      .update({
        type: patch.type,
        amount: patch.amount,
        account_id: patch.accountId,
        category_id: patch.categoryId,
        frequency: patch.frequency,
        start_date: patch.startDate,
        end_date: patch.endDate ?? null,
        note: patch.note ?? null,
        paused: patch.paused,
      })
      .eq("id", id)
      .select()
      .single();
    if (error || !data) {
      toast.error("Không cập nhật được quy tắc định kỳ. Vui lòng thử lại.");
      return;
    }
    set((s) => ({
      recurringRules: s.recurringRules.map((r) =>
        r.id === id ? toRecurring(data) : r
      ),
    }));
  },
  deleteRecurring: async (id) => {
    const { error } = await supabase.from("recurring_rules").delete().eq("id", id);
    if (error) {
      toast.error("Không xóa được quy tắc định kỳ. Vui lòng thử lại.");
      return;
    }
    set((s) => ({ recurringRules: s.recurringRules.filter((r) => r.id !== id) }));
  },

  generateDueRecurring: async () => {
    const { recurringRules, userId, baseCurrency } = get();
    if (!userId || recurringRules.length === 0) return;
    if (_generating) return;
    _generating = true;
    try {
      const today = vnTodayKey();

      const newRows: {
        user_id: string;
        type: TxType;
        amount: number;
        date: string;
        account_id: string;
        category_id: string | null;
        note: string | null;
        currency: string;
        source_rule_id: string;
      }[] = [];
      const ruleUpdates: { id: string; last: string }[] = [];

      for (const rule of recurringRules) {
        if (rule.paused) continue;
        let cursor = rule.lastGeneratedDate
          ? nextOccurrence(rule.lastGeneratedDate, rule.frequency)
          : rule.startDate;
        let last = rule.lastGeneratedDate;
        let guard = 0;
        while (cursor <= today && guard < 1000) {
          if (rule.endDate && cursor > rule.endDate) break;
          newRows.push({
            user_id: userId,
            type: rule.type,
            amount: rule.amount,
            date: cursor,
            account_id: rule.accountId,
            category_id: rule.categoryId,
            note: rule.note ?? "Định kỳ",
            currency: baseCurrency,
            source_rule_id: rule.id,
          });
          last = cursor;
          cursor = nextOccurrence(cursor, rule.frequency);
          guard++;
        }
        if (last && last !== rule.lastGeneratedDate) {
          ruleUpdates.push({ id: rule.id, last });
        }
      }

      if (newRows.length === 0) return;

      // upsert + ignoreDuplicates: unique (source_rule_id, date) ở DB chặn trùng
      // tận gốc nếu nhiều phiên cùng chạy; chỉ chèn các giao dịch chưa tồn tại.
      const { data } = await supabase
        .from("transactions")
        .upsert(newRows, {
          onConflict: "source_rule_id,date",
          ignoreDuplicates: true,
        })
        .select();
      await Promise.all(
        ruleUpdates.map((u) =>
          supabase
            .from("recurring_rules")
            .update({ last_generated_date: u.last })
            .eq("id", u.id)
        )
      );

      set((s) => ({
        transactions: [...(data ?? []).map(toTransaction), ...s.transactions],
        recurringRules: s.recurringRules.map((r) => {
          const u = ruleUpdates.find((x) => x.id === r.id);
          return u ? { ...r, lastGeneratedDate: u.last } : r;
        }),
      }));
    } finally {
      _generating = false;
    }
  },

  // ---------- Misc ----------
  setBaseCurrency: async (c) => {
    const userId = get().userId;
    const prev = get().baseCurrency;
    set({ baseCurrency: c });
    if (userId) {
      const { error } = await supabase
        .from("profiles")
        .update({ base_currency: c })
        .eq("id", userId);
      if (error) {
        set({ baseCurrency: prev });
        toast.error("Không lưu được đơn vị tiền tệ. Vui lòng thử lại.");
      }
    }
  },

  exportData: () => {
    const s = get();
    return JSON.stringify(
      {
        version: 2,
        exportedAt: new Date().toISOString(),
        baseCurrency: s.baseCurrency,
        accounts: s.accounts,
        categories: s.categories,
        transactions: s.transactions,
        budgets: s.budgets,
        transfers: s.transfers,
        recurringRules: s.recurringRules,
      },
      null,
      2
    );
  },

  clear: () =>
    set({
      userId: null,
      baseCurrency: "VND",
      accounts: [],
      categories: [],
      transactions: [],
      budgets: [],
      transfers: [],
      recurringRules: [],
      loaded: false,
      loading: false,
    }),
}));

// ---- Selector helpers (thuần) ----

export function accountBalance(
  account: Account,
  transactions: Transaction[],
  transfers: Transfer[] = []
): number {
  const fromTx = transactions
    .filter((t) => t.accountId === account.id)
    .reduce((bal, t) => bal + (t.type === "income" ? t.amount : -t.amount), 0);
  const fromTransfers = transfers.reduce((bal, tr) => {
    if (tr.fromAccountId === account.id) return bal - tr.amount;
    if (tr.toAccountId === account.id) return bal + tr.amount;
    return bal;
  }, 0);
  return account.initialBalance + fromTx + fromTransfers;
}

export function sumByType(transactions: Transaction[], type: TxType): number {
  return transactions
    .filter((t) => t.type === type)
    .reduce((sum, t) => sum + t.amount, 0);
}
