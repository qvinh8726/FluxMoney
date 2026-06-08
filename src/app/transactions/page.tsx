"use client";

import * as React from "react";
import { format } from "date-fns";
import { Plus, Pencil, Trash2, Search, ArrowLeftRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { TransactionDialog } from "@/components/transaction-dialog";
import { TransferDialog } from "@/components/transfer-dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useStore } from "@/lib/store";
import { useHydrated } from "@/lib/hooks";
import { formatCurrency } from "@/lib/utils";
import type { Transaction, Transfer, TxType } from "@/lib/types";

type Item =
  | { kind: "tx"; date: string; createdAt: string; tx: Transaction }
  | { kind: "tr"; date: string; createdAt: string; tr: Transfer };

export default function TransactionsPage() {
  const hydrated = useHydrated();
  const transactions = useStore((s) => s.transactions);
  const transfers = useStore((s) => s.transfers);
  const categories = useStore((s) => s.categories);
  const accounts = useStore((s) => s.accounts);
  const baseCurrency = useStore((s) => s.baseCurrency);
  const deleteTransaction = useStore((s) => s.deleteTransaction);
  const deleteTransfer = useStore((s) => s.deleteTransfer);

  const [txOpen, setTxOpen] = React.useState(false);
  const [trOpen, setTrOpen] = React.useState(false);
  const [editingTx, setEditingTx] = React.useState<Transaction | null>(null);
  const [editingTr, setEditingTr] = React.useState<Transfer | null>(null);
  const [toDelete, setToDelete] = React.useState<
    { kind: "tx"; id: string } | { kind: "tr"; id: string } | null
  >(null);
  const [q, setQ] = React.useState("");
  const [typeFilter, setTypeFilter] = React.useState<"all" | TxType | "transfer">("all");

  const accName = (id: string) => accounts.find((a) => a.id === id)?.name ?? "—";

  const items = React.useMemo<Item[]>(() => {
    const list: Item[] = [];

    if (typeFilter === "all" || typeFilter === "income" || typeFilter === "expense") {
      for (const t of transactions) {
        if (typeFilter !== "all" && t.type !== typeFilter) continue;
        if (q.trim()) {
          const cat = categories.find((c) => c.id === t.categoryId)?.name ?? "";
          const hay = `${cat} ${accName(t.accountId)} ${t.note ?? ""}`.toLowerCase();
          if (!hay.includes(q.toLowerCase())) continue;
        }
        list.push({ kind: "tx", date: t.date, createdAt: t.createdAt, tx: t });
      }
    }

    if (typeFilter === "all" || typeFilter === "transfer") {
      for (const tr of transfers) {
        if (q.trim()) {
          const hay = `chuyển khoản ${accName(tr.fromAccountId)} ${accName(
            tr.toAccountId
          )} ${tr.note ?? ""}`.toLowerCase();
          if (!hay.includes(q.toLowerCase())) continue;
        }
        list.push({ kind: "tr", date: tr.date, createdAt: tr.createdAt, tr });
      }
    }

    return list.sort((a, b) =>
      a.date === b.date
        ? b.createdAt.localeCompare(a.createdAt)
        : b.date.localeCompare(a.date)
    );
  }, [transactions, transfers, categories, accounts, typeFilter, q]);

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Giao dịch</h1>
          <p className="text-sm text-muted-foreground">
            Toàn bộ khoản thu, chi và chuyển khoản của bạn.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setEditingTr(null);
              setTrOpen(true);
            }}
            disabled={accounts.length < 2}
            title={accounts.length < 2 ? "Cần ít nhất 2 ví" : undefined}
          >
            <ArrowLeftRight /> Chuyển khoản
          </Button>
          <Button
            onClick={() => {
              setEditingTx(null);
              setTxOpen(true);
            }}
          >
            <Plus /> Thêm giao dịch
          </Button>
        </div>
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
          onChange={(e) => setTypeFilter(e.target.value as typeof typeFilter)}
        >
          <option value="all">Tất cả</option>
          <option value="income">Thu</option>
          <option value="expense">Chi</option>
          <option value="transfer">Chuyển khoản</option>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          {!hydrated ? (
            <p className="p-8 text-center text-sm text-muted-foreground">Đang tải…</p>
          ) : items.length === 0 ? (
            <p className="p-8 text-center text-sm text-muted-foreground">
              Không có mục nào khớp bộ lọc.
            </p>
          ) : (
            <ul className="divide-y">
              {items.map((it) =>
                it.kind === "tx" ? (
                  <TxRow
                    key={it.tx.id}
                    t={it.tx}
                    catName={
                      categories.find((c) => c.id === it.tx.categoryId)?.name ??
                      "Chưa phân loại"
                    }
                    catColor={
                      categories.find((c) => c.id === it.tx.categoryId)?.color ?? "#94A3B8"
                    }
                    accName={accName(it.tx.accountId)}
                    currency={baseCurrency}
                    onEdit={() => {
                      setEditingTx(it.tx);
                      setTxOpen(true);
                    }}
                    onDelete={() => setToDelete({ kind: "tx", id: it.tx.id })}
                  />
                ) : (
                  <TrRow
                    key={it.tr.id}
                    tr={it.tr}
                    fromName={accName(it.tr.fromAccountId)}
                    toName={accName(it.tr.toAccountId)}
                    currency={baseCurrency}
                    onEdit={() => {
                      setEditingTr(it.tr);
                      setTrOpen(true);
                    }}
                    onDelete={() => setToDelete({ kind: "tr", id: it.tr.id })}
                  />
                )
              )}
            </ul>
          )}
        </CardContent>
      </Card>

      <TransactionDialog open={txOpen} onClose={() => setTxOpen(false)} editing={editingTx} />
      <TransferDialog open={trOpen} onClose={() => setTrOpen(false)} editing={editingTr} />

      <ConfirmDialog
        open={toDelete !== null}
        onClose={() => setToDelete(null)}
        onConfirm={() => {
          if (!toDelete) return;
          if (toDelete.kind === "tx") deleteTransaction(toDelete.id);
          else deleteTransfer(toDelete.id);
        }}
        title={toDelete?.kind === "tr" ? "Xóa chuyển khoản này?" : "Xóa giao dịch này?"}
        description="Bạn có thể hoàn tác ngay sau khi xóa."
        confirmLabel="Xóa"
        destructive
      />
    </div>
  );
}

function TxRow({
  t,
  catName,
  catColor,
  accName,
  currency,
  onEdit,
  onDelete,
}: {
  t: Transaction;
  catName: string;
  catColor: string;
  accName: string;
  currency: string;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <li className="flex items-center gap-3 px-4 py-3">
      <span
        className="flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold"
        style={{ backgroundColor: catColor + "22", color: catColor }}
      >
        {catName.slice(0, 1)}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{catName}</p>
        <p className="truncate text-xs text-muted-foreground">
          {format(new Date(t.date), "dd/MM/yyyy")} · {accName}
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
        {formatCurrency(t.amount, currency)}
      </span>
      <RowActions onEdit={onEdit} onDelete={onDelete} />
    </li>
  );
}

function TrRow({
  tr,
  fromName,
  toName,
  currency,
  onEdit,
  onDelete,
}: {
  tr: Transfer;
  fromName: string;
  toName: string;
  currency: string;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <li className="flex items-center gap-3 px-4 py-3">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
        <ArrowLeftRight className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">
          {fromName} → {toName}
        </p>
        <p className="truncate text-xs text-muted-foreground">
          {format(new Date(tr.date), "dd/MM/yyyy")} · Chuyển khoản
          {tr.note ? ` · ${tr.note}` : ""}
        </p>
      </div>
      <span className="shrink-0 text-sm font-semibold text-muted-foreground">
        {formatCurrency(tr.amount, currency)}
      </span>
      <RowActions onEdit={onEdit} onDelete={onDelete} />
    </li>
  );
}

function RowActions({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="flex shrink-0 gap-1">
      <Button variant="ghost" size="icon" aria-label="Sửa" onClick={onEdit}>
        <Pencil className="size-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="text-destructive hover:text-destructive"
        aria-label="Xóa"
        onClick={onDelete}
      >
        <Trash2 className="size-4" />
      </Button>
    </div>
  );
}
