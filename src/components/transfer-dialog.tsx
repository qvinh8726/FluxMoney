"use client";

import * as React from "react";
import { ArrowRight } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { vnTodayKey, formatMoneyInput, parseMoneyInput, moneyToInput } from "@/lib/utils";
import { useStore } from "@/lib/store";
import type { Transfer } from "@/lib/types";

interface Props {
  open: boolean;
  onClose: () => void;
  editing?: Transfer | null;
  defaultDate?: string;
}

const MAX_AMOUNT = 999_999_999.99;

export function TransferDialog({ open, onClose, editing, defaultDate }: Props) {
  const accounts = useStore((s) => s.accounts);
  const addTransfer = useStore((s) => s.addTransfer);
  const updateTransfer = useStore((s) => s.updateTransfer);

  const [fromId, setFromId] = React.useState("");
  const [toId, setToId] = React.useState("");
  const [amount, setAmount] = React.useState("");
  const [date, setDate] = React.useState(defaultDate ?? vnTodayKey());
  const [note, setNote] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) return;
    if (editing) {
      setFromId(editing.fromAccountId);
      setToId(editing.toAccountId);
      setAmount(moneyToInput(editing.amount));
      setDate(editing.date);
      setNote(editing.note ?? "");
    } else {
      setFromId(accounts[0]?.id ?? "");
      setToId(accounts[1]?.id ?? accounts[0]?.id ?? "");
      setAmount("");
      setDate(defaultDate ?? vnTodayKey());
      setNote("");
    }
    setError(null);
  }, [open, editing, defaultDate, accounts]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const value = parseMoneyInput(amount);

    if (!fromId || !toId) {
      setError("Vui lòng chọn ví nguồn và ví đích.");
      return;
    }
    if (fromId === toId) {
      setError("Ví nguồn và ví đích phải khác nhau.");
      return;
    }
    if (!amount || Number.isNaN(value) || value < 0.01 || value > MAX_AMOUNT) {
      setError("Số tiền phải từ 0,01 đến 999.999.999,99.");
      return;
    }
    if (date > vnTodayKey()) {
      setError("Ngày chuyển khoản không được ở tương lai.");
      return;
    }

    const payload = {
      fromAccountId: fromId,
      toAccountId: toId,
      amount: Math.round(value * 100) / 100,
      date,
      note: note.trim() || undefined,
    };

    if (editing) updateTransfer(editing.id, payload);
    else addTransfer(payload);
    onClose();
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={editing ? "Sửa chuyển khoản" : "Chuyển khoản giữa ví"}
      description="Dịch chuyển tiền giữa hai ví của bạn. Không tính vào thu/chi."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <Label htmlFor="from">Từ ví</Label>
            <Select id="from" value={fromId} onChange={(e) => setFromId(e.target.value)}>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </Select>
          </div>
          <ArrowRight className="mb-2.5 size-5 shrink-0 text-muted-foreground" />
          <div className="flex-1">
            <Label htmlFor="to">Đến ví</Label>
            <Select id="to" value={toId} onChange={(e) => setToId(e.target.value)}>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="t-amount">Số tiền</Label>
            <Input
              id="t-amount"
              inputMode="numeric"
              placeholder="0"
              value={amount}
              onChange={(e) => setAmount(formatMoneyInput(e.target.value))}
              autoFocus
            />
          </div>
          <div>
            <Label htmlFor="t-date">Ngày</Label>
            <Input
              id="t-date"
              type="date"
              max={vnTodayKey()}
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="t-note">Ghi chú</Label>
          <Textarea
            id="t-note"
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
          <Button type="submit">{editing ? "Lưu thay đổi" : "Chuyển khoản"}</Button>
        </div>
      </form>
    </Dialog>
  );
}
