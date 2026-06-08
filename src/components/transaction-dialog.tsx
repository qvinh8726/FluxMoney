"use client";

import * as React from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn, vnTodayKey, formatMoneyInput, parseMoneyInput, moneyToInput } from "@/lib/utils";
import { useStore } from "@/lib/store";
import { suggestCategories } from "@/lib/category-suggest";
import type { Transaction, TxType } from "@/lib/types";

interface Props {
  open: boolean;
  onClose: () => void;
  /** Giao dịch đang sửa; nếu không có là tạo mới. */
  editing?: Transaction | null;
  /** Ngày mặc định khi tạo mới (YYYY-MM-DD). */
  defaultDate?: string;
}

const MAX_AMOUNT = 999_999_999.99;

export function TransactionDialog({ open, onClose, editing, defaultDate }: Props) {
  const accounts = useStore((s) => s.accounts);
  const categories = useStore((s) => s.categories);
  const transactions = useStore((s) => s.transactions);
  const addTransaction = useStore((s) => s.addTransaction);
  const updateTransaction = useStore((s) => s.updateTransaction);

  const [type, setType] = React.useState<TxType>("expense");
  const [amount, setAmount] = React.useState("");
  const [date, setDate] = React.useState(defaultDate ?? vnTodayKey());
  const [accountId, setAccountId] = React.useState("");
  const [categoryId, setCategoryId] = React.useState<string>("");
  const [note, setNote] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  // true khi user đã tự chọn danh mục → ẩn chip gợi ý
  const [userPickedCategory, setUserPickedCategory] = React.useState(false);

  // Khởi tạo giá trị mỗi khi mở dialog.
  React.useEffect(() => {
    if (!open) return;
    if (editing) {
      setType(editing.type);
      setAmount(moneyToInput(editing.amount));
      setDate(editing.date);
      setAccountId(editing.accountId);
      setCategoryId(editing.categoryId ?? "");
      setNote(editing.note ?? "");
    } else {
      setType("expense");
      setAmount("");
      setDate(defaultDate ?? vnTodayKey());
      setAccountId(accounts[0]?.id ?? "");
      setCategoryId("");
      setNote("");
    }
    setError(null);
  }, [open, editing, defaultDate, accounts]);

  const visibleCategories = categories.filter((c) => c.type === type);

  // Gợi ý danh mục dựa trên lịch sử — chỉ tính lại khi note/type thay đổi
  const suggestions = React.useMemo(
    () => suggestCategories({ note, type }, transactions, categories, 3),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [note, type, transactions, categories]
  );

  // Chip chỉ hiện khi: chưa chọn thủ công, có gợi ý, không phải chế độ sửa
  const showChips = !userPickedCategory && !editing && suggestions.length > 0;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const value = parseMoneyInput(amount);

    if (!amount || Number.isNaN(value)) {
      setError("Vui lòng nhập số tiền hợp lệ.");
      return;
    }
    if (value < 0.01 || value > MAX_AMOUNT) {
      setError("Số tiền phải từ 0,01 đến 999.999.999,99.");
      return;
    }
    if (!accountId) {
      setError("Vui lòng chọn ví/tài khoản.");
      return;
    }
    if (date > vnTodayKey()) {
      setError("Ngày giao dịch không được ở tương lai.");
      return;
    }

    const payload = {
      type,
      amount: Math.round(value * 100) / 100,
      date,
      accountId,
      categoryId: categoryId || null,
      note: note.trim() || undefined,
    };

    if (editing) {
      updateTransaction(editing.id, payload);
    } else {
      addTransaction(payload);
    }
    onClose();
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={editing ? "Sửa giao dịch" : "Thêm giao dịch"}
      description="Ghi nhận một khoản thu hoặc chi."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Loại thu/chi */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => {
              setType("expense");
              setCategoryId("");
              setUserPickedCategory(false);
            }}
            className={cn(
              "rounded-lg border py-2.5 text-sm font-medium transition-colors cursor-pointer",
              type === "expense"
                ? "border-expense bg-expense/10 text-expense"
                : "hover:bg-accent"
            )}
          >
            Chi tiền
          </button>
          <button
            type="button"
            onClick={() => {
              setType("income");
              setCategoryId("");
              setUserPickedCategory(false);
            }}
            className={cn(
              "rounded-lg border py-2.5 text-sm font-medium transition-colors cursor-pointer",
              type === "income"
                ? "border-income bg-income/10 text-income"
                : "hover:bg-accent"
            )}
          >
            Thu tiền
          </button>
        </div>

        <div>
          <Label htmlFor="amount">Số tiền</Label>
          <Input
            id="amount"
            inputMode="numeric"
            placeholder="0"
            value={amount}
            onChange={(e) => setAmount(formatMoneyInput(e.target.value))}
            autoFocus
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="date">Ngày</Label>
            <Input
              id="date"
              type="date"
              max={vnTodayKey()}
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="account">Ví / Tài khoản</Label>
            <Select
              id="account"
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
            >
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div>
          <Label htmlFor="category">Danh mục</Label>
          {/* Chip gợi ý — chỉ hiện khi tạo mới và chưa chọn thủ công */}
          {showChips && (
            <div className="flex flex-wrap gap-2 mt-1 mb-2">
              {suggestions.map((s) => {
                const cat = categories.find((c) => c.id === s.categoryId);
                if (!cat) return null;
                const isSelected = categoryId === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      setCategoryId(cat.id);
                      setUserPickedCategory(true);
                    }}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full border px-3 text-sm font-medium transition-colors",
                      "min-h-[44px] cursor-pointer",
                      isSelected
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-background hover:bg-accent"
                    )}
                  >
                    <span>{cat.icon}</span>
                    <span>{cat.name}</span>
                  </button>
                );
              })}
            </div>
          )}
          <Select
            id="category"
            value={categoryId}
            onChange={(e) => {
              setCategoryId(e.target.value);
              setUserPickedCategory(true);
            }}
          >
            <option value="">Chưa phân loại</option>
            {visibleCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <Label htmlFor="note">Ghi chú</Label>
          <Textarea
            id="note"
            placeholder="Tùy chọn"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
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
          <Button type="submit" variant={type === "income" ? "income" : "expense"}>
            {editing ? "Lưu thay đổi" : "Thêm giao dịch"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
