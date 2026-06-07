"use client";

import * as React from "react";
import { Pencil, Trash2, Plus } from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Dialog } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { formatCurrency } from "@/lib/utils";
import type { Transaction } from "@/lib/types";

interface Props {
  open: boolean;
  onClose: () => void;
  dateKey: string | null;
  onAdd: (dateKey: string) => void;
  onEdit: (tx: Transaction) => void;
}

export function DayDetailDialog({ open, onClose, dateKey, onAdd, onEdit }: Props) {
  const transactions = useStore((s) => s.transactions);
  const categories = useStore((s) => s.categories);
  const accounts = useStore((s) => s.accounts);
  const baseCurrency = useStore((s) => s.baseCurrency);
  const deleteTransaction = useStore((s) => s.deleteTransaction);

  const [toDelete, setToDelete] = React.useState<string | null>(null);

  if (!dateKey) return null;

  const dayTx = transactions
    .filter((t) => t.date === dateKey)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const income = dayTx
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + t.amount, 0);
  const expense = dayTx
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + t.amount, 0);

  const title = format(new Date(dateKey), "EEEE, dd/MM/yyyy", { locale: vi });

  return (
    <>
      <Dialog open={open} onClose={onClose} title={title}>
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-lg bg-income/10 p-3">
            <p className="text-xs text-muted-foreground">Thu</p>
            <p className="font-semibold text-income">
              {formatCurrency(income, baseCurrency)}
            </p>
          </div>
          <div className="rounded-lg bg-expense/10 p-3">
            <p className="text-xs text-muted-foreground">Chi</p>
            <p className="font-semibold text-expense">
              {formatCurrency(expense, baseCurrency)}
            </p>
          </div>
          <div className="rounded-lg bg-secondary p-3">
            <p className="text-xs text-muted-foreground">Còn lại</p>
            <p className="font-semibold">
              {formatCurrency(income - expense, baseCurrency)}
            </p>
          </div>
        </div>

        <Button className="w-full" onClick={() => onAdd(dateKey)}>
          <Plus /> Thêm giao dịch ngày này
        </Button>

        {dayTx.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Chưa có giao dịch nào trong ngày này.
          </p>
        ) : (
          <ul className="divide-y">
            {dayTx.map((t) => {
              const cat = categories.find((c) => c.id === t.categoryId);
              const acc = accounts.find((a) => a.id === t.accountId);
              return (
                <li key={t.id} className="flex items-center gap-3 py-3">
                  <span
                    className="flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
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
                      {acc?.name}
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
                      onClick={() => onEdit(t)}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 text-destructive hover:text-destructive"
                      aria-label="Xóa"
                      onClick={() => setToDelete(t.id)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      </Dialog>

      <ConfirmDialog
        open={toDelete !== null}
        onClose={() => setToDelete(null)}
        onConfirm={() => {
          if (toDelete) deleteTransaction(toDelete);
        }}
        title="Xóa giao dịch này?"
        description="Hành động không thể hoàn tác."
        confirmLabel="Xóa"
        destructive
      />
    </>
  );
}
