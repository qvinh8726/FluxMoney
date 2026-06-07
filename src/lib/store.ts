"use client";

import { create } from "zustand";
import type { Account, Budget, Category, Transaction, Transfer, TxType } from "./types";
import { createClient } from "./supabase/client";
import {
  toAccount,
  toBudget,
  toCategory,
  toTransaction,
  toTransfer,
} from "./mappers";

interface State {
  userId: string | null;
  baseCurrency: string;
  accounts: Account[];
  categories: Category[];
  transactions: Transaction[];
  budgets: Budget[];
  transfers: Transfer[];
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

  setBaseCurrency: (c: string) => Promise<void>;
  exportData: () => string;
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

export const useStore = create<State>()((set, get) => ({
  userId: null,
  baseCurrency: "VND",
  accounts: [],
  categories: [],
  transactions: [],
  budgets: [],
  transfers: [],
  loaded: false,
  loading: false,

  loadAll: async () => {
    if (get().loading) return;
    set({ loading: true });
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      set({ loading: false });
      return;
    }

    const [profileRes, accRes, catRes, txRes, budRes, trfRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
      supabase.from("accounts").select("*").order("created_at"),
      supabase.from("categories").select("*").order("created_at"),
      supabase.from("transactions").select("*").order("date", { ascending: false }),
      supabase.from("budgets").select("*").order("created_at"),
      supabase.from("transfers").select("*").order("date", { ascending: false }),
    ]);

    set({
      userId: user.id,
      baseCurrency: profileRes.data?.base_currency ?? "VND",
      accounts: (accRes.data ?? []).map(toAccount),
      categories: (catRes.data ?? []).map(toCategory),
      transactions: (txRes.data ?? []).map(toTransaction),
      budgets: (budRes.data ?? []).map(toBudget),
      transfers: (trfRes.data ?? []).map(toTransfer),
      loaded: true,
      loading: false,
    });
  },

  // ---------- Transactions ----------
  addTransaction: async (t) => {
    const userId = get().userId;
    if (!userId) return;
    const { data } = await supabase
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
    if (data) set((s) => ({ transactions: [toTransaction(data), ...s.transactions] }));
  },
  updateTransaction: async (id, patch) => {
    const { data } = await supabase
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
    if (data)
      set((s) => ({
        transactions: s.transactions.map((t) => (t.id === id ? toTransaction(data) : t)),
      }));
  },
  deleteTransaction: async (id) => {
    await supabase.from("transactions").delete().eq("id", id);
    set((s) => ({ transactions: s.transactions.filter((t) => t.id !== id) }));
  },

  // ---------- Accounts ----------
  addAccount: async (a) => {
    const userId = get().userId;
    if (!userId) return;
    const { data } = await supabase
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
    if (data) set((s) => ({ accounts: [...s.accounts, toAccount(data)] }));
  },
  updateAccount: async (id, patch) => {
    const { data } = await supabase
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
    if (data)
      set((s) => ({ accounts: s.accounts.map((a) => (a.id === id ? toAccount(data) : a)) }));
  },
  deleteAccount: async (id) => {
    await supabase.from("accounts").delete().eq("id", id);
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
    const { data } = await supabase
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
    if (data) set((s) => ({ categories: [...s.categories, toCategory(data)] }));
  },
  updateCategory: async (id, patch) => {
    const { data } = await supabase
      .from("categories")
      .update({ name: patch.name, type: patch.type, color: patch.color, icon: patch.icon })
      .eq("id", id)
      .select()
      .single();
    if (data)
      set((s) => ({
        categories: s.categories.map((c) => (c.id === id ? toCategory(data) : c)),
      }));
  },
  deleteCategory: async (id) => {
    await supabase.from("categories").delete().eq("id", id);
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
    const { data } = await supabase
      .from("budgets")
      .insert({
        user_id: userId,
        category_id: b.categoryId,
        amount: b.amount,
        period: b.period,
      })
      .select()
      .single();
    if (data) set((s) => ({ budgets: [...s.budgets, toBudget(data)] }));
  },
  updateBudget: async (id, patch) => {
    const { data } = await supabase
      .from("budgets")
      .update({ category_id: patch.categoryId, amount: patch.amount, period: patch.period })
      .eq("id", id)
      .select()
      .single();
    if (data)
      set((s) => ({ budgets: s.budgets.map((b) => (b.id === id ? toBudget(data) : b)) }));
  },
  deleteBudget: async (id) => {
    await supabase.from("budgets").delete().eq("id", id);
    set((s) => ({ budgets: s.budgets.filter((b) => b.id !== id) }));
  },

  // ---------- Transfers ----------
  addTransfer: async (t) => {
    const userId = get().userId;
    if (!userId) return;
    const { data } = await supabase
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
    if (data) set((s) => ({ transfers: [toTransfer(data), ...s.transfers] }));
  },
  updateTransfer: async (id, patch) => {
    const { data } = await supabase
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
    if (data)
      set((s) => ({
        transfers: s.transfers.map((t) => (t.id === id ? toTransfer(data) : t)),
      }));
  },
  deleteTransfer: async (id) => {
    await supabase.from("transfers").delete().eq("id", id);
    set((s) => ({ transfers: s.transfers.filter((t) => t.id !== id) }));
  },

  // ---------- Misc ----------
  setBaseCurrency: async (c) => {
    const userId = get().userId;
    set({ baseCurrency: c });
    if (userId) {
      await supabase.from("profiles").update({ base_currency: c }).eq("id", userId);
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
      },
      null,
      2
    );
  },
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
