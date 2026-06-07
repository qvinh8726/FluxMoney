"use client";

import * as React from "react";
import { isWithinInterval } from "date-fns";
import { Plus, Pencil, Trash2, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Dialog } from "@/components/ui/dialog";
import { useStore } from "@/lib/store";
import { useHydrated } from "@/lib/hooks";
import { cn, formatCurrency, periodInterval, PERIOD_LABEL } from "@/lib/utils";
import type { Budget, BudgetPeriod } from "@/lib/types";

export default function BudgetsPage() {
  const hydrated = useHydrated();
  const budgets = useStore((s) => s.budgets);
  const categories = useStore((s) => s.categories);
  const transactions = useStore((s) => s.transactions);
  const baseCurrency = useStore((s) => s.baseCurrency);
  const addBudget = useStore((s) => s.addBudget);
  const updateBudget = useStore((s) => s.updateBudget);
  const deleteBudget = useStore((s) => s.deleteBudget);

  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Budget | null>(null);

  const expenseCategories = categories.filter((c) => c.type === "expense");

  // Chi tiêu thực tế cho một ngân sách, tính theo đúng kỳ của nó (tháng/quý/năm).
  const spentForBudget = React.useCallback(
    (b: Budget) => {
      const { start, end } = periodInterval(b.period);
      return transactions
        .filter(
          (t) =>
            t.type === "expense" &&
            t.categoryId === b.categoryId &&
            isWithinInterval(new Date(t.date), { start, end })
        )
        .reduce((s, t) => s + t.amount, 0);
    },
    [transactions]
  );

  function save(data: Omit<Budget, "id" | "createdAt">) {
    const dup = budgets.find(
      (b) =>
        b.id !== editing?.id &&
        b.categoryId === data.categoryId &&
        b.period === data.period
    );
    if (dup) return "Đã có ngân sách cho danh mục này trong cùng kỳ.";
    if (editing) updateBudget(editing.id, data);
    else addBudget(data);
    setOpen(false);
    return null;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Ngân sách</h1>
          <p className="text-sm text-muted-foreground">
            Đặt hạn mức chi theo danh mục để kiểm soát chi tiêu.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
          disabled={expenseCategories.length === 0}
        >
          <Plus /> Thêm ngân sách
        </Button>
      </div>

      {!hydrated ? null : budgets.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            Chưa có ngân sách nào. Thêm ngân sách để theo dõi hạn mức chi tiêu.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {budgets.map((b) => {
            const cat = categories.find((c) => c.id === b.categoryId);
            const spent = spentForBudget(b);
            const pct = b.amount > 0 ? (spent / b.amount) * 100 : 0;
            const over = pct >= 100;
            const near = pct >= 80 && pct < 100;
            return (
              <Card key={b.id}>
                <CardContent className="p-4">
                  <div className="mb-2 flex items-center gap-3">
                    <span
                      className="flex size-9 items-center justify-center rounded-full text-xs font-semibold"
                      style={{
                        backgroundColor: (cat?.color ?? "#94A3B8") + "22",
                        color: cat?.color ?? "#94A3B8",
                      }}
                    >
                      {(cat?.name ?? "?").slice(0, 1)}
                    </span>
                    <div className="flex-1">
                      <p className="font-medium">{cat?.name ?? "—"}</p>
                      <p className="text-xs text-muted-foreground">
                        {PERIOD_LABEL[b.period]}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7"
                      aria-label="Sửa"
                      onClick={() => {
                        setEditing(b);
                        setOpen(true);
                      }}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 text-destructive hover:text-destructive"
                      aria-label="Xóa"
                      onClick={() => deleteBudget(b.id)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>

                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-secondary">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        over ? "bg-expense" : near ? "bg-amber-500" : "bg-income"
                      )}
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>

                  <div className="mt-2 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {formatCurrency(spent, baseCurrency)} /{" "}
                      {formatCurrency(b.amount, baseCurrency)}
                    </span>
                    {over ? (
                      <span className="flex items-center gap-1 font-medium text-expense">
                        <AlertTriangle className="size-4" /> Vượt mức
                      </span>
                    ) : near ? (
                      <span className="flex items-center gap-1 font-medium text-amber-600">
                        <AlertTriangle className="size-4" /> Gần đạt mức
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 font-medium text-income">
                        <CheckCircle2 className="size-4" /> Trong hạn mức
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <BudgetDialog
        open={open}
        onClose={() => setOpen(false)}
        editing={editing}
        categories={expenseCategories}
        onSave={save}
      />
    </div>
  );
}

function BudgetDialog({
  open,
  onClose,
  editing,
  categories,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  editing: Budget | null;
  categories: { id: string; name: string }[];
  onSave: (data: Omit<Budget, "id" | "createdAt">) => string | null;
}) {
  const [categoryId, setCategoryId] = React.useState("");
  const [amount, setAmount] = React.useState("");
  const [period, setPeriod] = React.useState<BudgetPeriod>("monthly");
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) return;
    setCategoryId(editing?.categoryId ?? categories[0]?.id ?? "");
    setAmount(editing ? String(editing.amount) : "");
    setPeriod(editing?.period ?? "monthly");
    setError(null);
  }, [open, editing, categories]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const value = Number(amount);
    if (!categoryId) {
      setError("Vui lòng chọn danh mục.");
      return;
    }
    if (Number.isNaN(value) || value < 0.01 || value > 999_999_999.99) {
      setError("Số tiền ngân sách phải từ 0,01 đến 999.999.999,99.");
      return;
    }
    const err = onSave({
      categoryId,
      amount: Math.round(value * 100) / 100,
      period,
    });
    if (err) setError(err);
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={editing ? "Sửa ngân sách" : "Thêm ngân sách"}
    >
      <form onSubmit={submit} className="space-y-4">
        <div>
          <Label htmlFor="bud-cat">Danh mục chi</Label>
          <Select
            id="bud-cat"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="bud-amount">Hạn mức</Label>
            <Input
              id="bud-amount"
              type="number"
              step="0.01"
              min="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              autoFocus
            />
          </div>
          <div>
            <Label htmlFor="bud-period">Kỳ</Label>
            <Select
              id="bud-period"
              value={period}
              onChange={(e) => setPeriod(e.target.value as BudgetPeriod)}
            >
              {Object.entries(PERIOD_LABEL).map(([k, label]) => (
                <option key={k} value={k}>
                  {label}
                </option>
              ))}
            </Select>
          </div>
        </div>
        {error && (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="outline" onClick={onClose}>
            Hủy
          </Button>
          <Button type="submit">{editing ? "Lưu" : "Thêm"}</Button>
        </div>
      </form>
    </Dialog>
  );
}
