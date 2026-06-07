"use client";

import * as React from "react";
import { format, addDays, addWeeks, addMonths, addYears, parseISO } from "date-fns";
import { Plus, Pencil, Trash2, Play, Pause, Repeat } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Dialog } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useStore } from "@/lib/store";
import { useHydrated } from "@/lib/hooks";
import { cn, formatCurrency, toDateKey, vnTodayKey } from "@/lib/utils";
import type { RecurringRule, RecurringFrequency, TxType } from "@/lib/types";

const FREQ_LABEL: Record<RecurringFrequency, string> = {
  daily: "Hằng ngày",
  weekly: "Hằng tuần",
  monthly: "Hằng tháng",
  yearly: "Hằng năm",
};

function nextDate(dateStr: string, freq: RecurringFrequency): string {
  const d = parseISO(dateStr);
  const n =
    freq === "daily" ? addDays(d, 1)
    : freq === "weekly" ? addWeeks(d, 1)
    : freq === "monthly" ? addMonths(d, 1)
    : addYears(d, 1);
  return toDateKey(n);
}

function nextRunLabel(r: RecurringRule): string {
  if (r.paused) return "Đang tạm dừng";
  const next = r.lastGeneratedDate ? nextDate(r.lastGeneratedDate, r.frequency) : r.startDate;
  if (r.endDate && next > r.endDate) return "Đã kết thúc";
  if (next <= vnTodayKey()) return "Sắp được tạo";
  return `Kỳ tới: ${format(parseISO(next), "dd/MM/yyyy")}`;
}

export default function RecurringPage() {
  const hydrated = useHydrated();
  const rules = useStore((s) => s.recurringRules);
  const accounts = useStore((s) => s.accounts);
  const categories = useStore((s) => s.categories);
  const baseCurrency = useStore((s) => s.baseCurrency);
  const updateRecurring = useStore((s) => s.updateRecurring);
  const deleteRecurring = useStore((s) => s.deleteRecurring);

  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<RecurringRule | null>(null);
  const [toDelete, setToDelete] = React.useState<RecurringRule | null>(null);

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Giao dịch định kỳ</h1>
          <p className="text-sm text-muted-foreground">
            Tự động ghi nhận các khoản lặp lại như lương, tiền nhà, hóa đơn.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
          disabled={accounts.length === 0}
        >
          <Plus /> Thêm định kỳ
        </Button>
      </div>

      {!hydrated ? null : rules.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            Chưa có quy tắc định kỳ nào. Thêm một quy tắc để hệ thống tự tạo giao dịch khi tới hạn.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {rules.map((r) => {
            const cat = categories.find((c) => c.id === r.categoryId);
            const acc = accounts.find((a) => a.id === r.accountId);
            return (
              <Card key={r.id} className={cn(r.paused && "opacity-70")}>
                <CardContent className="flex items-center gap-3 p-4">
                  <span
                    className={cn(
                      "flex size-10 shrink-0 items-center justify-center rounded-full",
                      r.type === "income" ? "bg-income/15 text-income" : "bg-expense/15 text-expense"
                    )}
                  >
                    <Repeat className="size-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">
                      {cat?.name ?? "Chưa phân loại"}
                      <span className="ml-2 text-xs font-normal text-muted-foreground">
                        {FREQ_LABEL[r.frequency]}
                      </span>
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {acc?.name} · {nextRunLabel(r)}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 text-sm font-semibold",
                      r.type === "income" ? "text-income" : "text-expense"
                    )}
                  >
                    {r.type === "income" ? "+" : "-"}
                    {formatCurrency(r.amount, baseCurrency)}
                  </span>
                  <div className="flex shrink-0 gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      aria-label={r.paused ? "Tiếp tục" : "Tạm dừng"}
                      onClick={() => updateRecurring(r.id, { paused: !r.paused })}
                    >
                      {r.paused ? <Play className="size-4" /> : <Pause className="size-4" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      aria-label="Sửa"
                      onClick={() => {
                        setEditing(r);
                        setOpen(true);
                      }}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 text-destructive hover:text-destructive"
                      aria-label="Xóa"
                      onClick={() => setToDelete(r)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <RecurringDialog open={open} onClose={() => setOpen(false)} editing={editing} />

      <ConfirmDialog
        open={toDelete !== null}
        onClose={() => setToDelete(null)}
        onConfirm={() => {
          if (toDelete) deleteRecurring(toDelete.id);
        }}
        title="Xóa quy tắc định kỳ này?"
        description="Các giao dịch đã sinh trước đó vẫn được giữ lại."
        confirmLabel="Xóa"
        destructive
      />
    </div>
  );
}

function RecurringDialog({
  open,
  onClose,
  editing,
}: {
  open: boolean;
  onClose: () => void;
  editing: RecurringRule | null;
}) {
  const accounts = useStore((s) => s.accounts);
  const categories = useStore((s) => s.categories);
  const addRecurring = useStore((s) => s.addRecurring);
  const updateRecurring = useStore((s) => s.updateRecurring);

  const [type, setType] = React.useState<TxType>("expense");
  const [amount, setAmount] = React.useState("");
  const [accountId, setAccountId] = React.useState("");
  const [categoryId, setCategoryId] = React.useState("");
  const [frequency, setFrequency] = React.useState<RecurringFrequency>("monthly");
  const [startDate, setStartDate] = React.useState(vnTodayKey());
  const [endDate, setEndDate] = React.useState("");
  const [note, setNote] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) return;
    if (editing) {
      setType(editing.type);
      setAmount(String(editing.amount));
      setAccountId(editing.accountId);
      setCategoryId(editing.categoryId ?? "");
      setFrequency(editing.frequency);
      setStartDate(editing.startDate);
      setEndDate(editing.endDate ?? "");
      setNote(editing.note ?? "");
    } else {
      setType("expense");
      setAmount("");
      setAccountId(accounts[0]?.id ?? "");
      setCategoryId("");
      setFrequency("monthly");
      setStartDate(vnTodayKey());
      setEndDate("");
      setNote("");
    }
    setError(null);
  }, [open, editing, accounts]);

  const visibleCategories = categories.filter((c) => c.type === type);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const value = Number(amount);
    if (!amount || Number.isNaN(value) || value < 0.01 || value > 999_999_999.99) {
      setError("Số tiền phải từ 0,01 đến 999.999.999,99.");
      return;
    }
    if (!accountId) {
      setError("Vui lòng chọn ví/tài khoản.");
      return;
    }
    if (endDate && endDate < startDate) {
      setError("Ngày kết thúc phải sau ngày bắt đầu.");
      return;
    }

    const payload = {
      type,
      amount: Math.round(value * 100) / 100,
      accountId,
      categoryId: categoryId || null,
      frequency,
      startDate,
      endDate: endDate || undefined,
      note: note.trim() || undefined,
      paused: editing?.paused ?? false,
    };

    if (editing) updateRecurring(editing.id, payload);
    else addRecurring(payload);
    onClose();
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={editing ? "Sửa định kỳ" : "Thêm giao dịch định kỳ"}
      description="Hệ thống sẽ tự tạo giao dịch mỗi khi tới kỳ."
    >
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => { setType("expense"); setCategoryId(""); }}
            className={cn(
              "rounded-lg border py-2.5 text-sm font-medium transition-colors cursor-pointer",
              type === "expense" ? "border-expense bg-expense/10 text-expense" : "hover:bg-accent"
            )}
          >
            Chi định kỳ
          </button>
          <button
            type="button"
            onClick={() => { setType("income"); setCategoryId(""); }}
            className={cn(
              "rounded-lg border py-2.5 text-sm font-medium transition-colors cursor-pointer",
              type === "income" ? "border-income bg-income/10 text-income" : "hover:bg-accent"
            )}
          >
            Thu định kỳ
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="r-amount">Số tiền</Label>
            <Input id="r-amount" type="number" step="0.01" min="0.01" value={amount}
              onChange={(e) => setAmount(e.target.value)} autoFocus />
          </div>
          <div>
            <Label htmlFor="r-freq">Tần suất</Label>
            <Select id="r-freq" value={frequency}
              onChange={(e) => setFrequency(e.target.value as RecurringFrequency)}>
              {Object.entries(FREQ_LABEL).map(([k, label]) => (
                <option key={k} value={k}>{label}</option>
              ))}
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="r-acc">Ví / Tài khoản</Label>
            <Select id="r-acc" value={accountId} onChange={(e) => setAccountId(e.target.value)}>
              {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </Select>
          </div>
          <div>
            <Label htmlFor="r-cat">Danh mục</Label>
            <Select id="r-cat" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              <option value="">Chưa phân loại</option>
              {visibleCategories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="r-start">Bắt đầu</Label>
            <Input id="r-start" type="date" value={startDate}
              onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="r-end">Kết thúc (tùy chọn)</Label>
            <Input id="r-end" type="date" value={endDate}
              onChange={(e) => setEndDate(e.target.value)} />
          </div>
        </div>

        <div>
          <Label htmlFor="r-note">Ghi chú</Label>
          <Input id="r-note" placeholder="VD: Lương tháng" value={note}
            onChange={(e) => setNote(e.target.value)} />
        </div>

        {error && (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="outline" onClick={onClose}>Hủy</Button>
          <Button type="submit" variant={type === "income" ? "income" : "expense"}>
            {editing ? "Lưu" : "Thêm"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
