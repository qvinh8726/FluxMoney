"use client";

import * as React from "react";
import { format } from "date-fns";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { TransactionDialog } from "@/components/transaction-dialog";
import { useStore } from "@/lib/store";
import { useHydrated } from "@/lib/hooks";
import { formatCurrency } from "@/lib/utils";
import type { Transaction, TxType } from "@/lib/types";

export default function TransactionsPage() {
  const hydrated = useHydrated();
  const transactions = useStore((s) => s.transactions);
  const categories = useStore((s) => s.categories);
  const accounts = useStore((s) => s.accounts);
  const baseCurrency = useStore((s) => s.baseCurrency);
  const deleteTransaction = useStore((s) => s.deleteTransaction);

  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Transaction | null>(null);
  const [q, setQ] = React.useState("");
  const [typeFilter, setTypeFilter] = React.useState<"all" | TxType>("all");

  const filtered = React.useMemo(() => {
    const list = transactions
      .filter((t) => (typeFilter === "all" ? true : t.type === typeFilter))
      .filter((t) => {
        if (!q.trim()) return true;
        const cat = categories.find((c) => c.id === t.categoryId)?.name ?? "";
        const acc = accounts.find((a) => a.id === t.accountId)?.name ?? "";
        const hay = `${cat} ${acc} ${t.note ?? ""}`.toLowerCase();
        return hay.includes(q.toLowerCase());
      });
    return [...list].sort((a, b) =>
      a.date === b.date
        ? b.createdAt.localeCompare(a.createdAt)
        : b.date.localeCompare(a.date)
    );
  }, [transactions, categories, accounts, typeFilter, q]);

  function edit(tx: Transaction) {
    setEditing(tx);
    setOpen(true);
  }

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Giao dịch</h1>
          <p className="text-sm text-muted-foreground">
            Toàn bộ khoản thu chi của bạn.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
        >
          <Plus /> Thêm giao dịch
        </Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Tìm theo danh mục, ví, ghi chú..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <Select
          className="w-40"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as "all" | TxType)}
        >
          <option value="all">Tất cả</option>
          <option value="income">Thu</option>
          <option value="expense">Chi</option>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          {!hydrated ? (
            <p className="p-8 text-center text-sm text-muted-foreground">Đang tải…</p>
          ) : filtered.length === 0 ? (
            <p className="p-8 text-center text-sm text-muted-foreground">
              Không có giao dịch nào khớp bộ lọc.
            </p>
          ) : (
            <ul className="divide-y">
              {filtered.map((t) => {
                const cat = categories.find((c) => c.id === t.categoryId);
                const acc = accounts.find((a) => a.id === t.accountId);
                return (
                  <li key={t.id} className="flex items-center gap-3 px-4 py-3">
                    <span
                      className="flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold"
                      style={{
                        backgroundColor: (cat?.color ?? "#94A3B8") + "22",
                        color: cat?.color ?? "#94A3B8",
                      }}
                    >
                      {(cat?.name ?? "?").slice(0, 1)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {cat?.name ?? "Chưa phân loại"}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {format(new Date(t.date), "dd/MM/yyyy")} · {acc?.name}
                        {t.note ? ` · ${t.note}` : ""}
                      </p>
                    </div>
                    <span
                      className={
                        "shrink-0 text-sm font-semibold " +
                        (t.type === "income" ? "text-income" : "text-expense")
                      }
                    >
                      {t.type === "income" ? "+" : "-"}
                      {formatCurrency(t.amount, baseCurrency)}
                    </span>
                    <div className="flex shrink-0 gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        aria-label="Sửa"
                        onClick={() => edit(t)}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-destructive hover:text-destructive"
                        aria-label="Xóa"
                        onClick={() => deleteTransaction(t.id)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      <TransactionDialog open={open} onClose={() => setOpen(false)} editing={editing} />
    </div>
  );
}
