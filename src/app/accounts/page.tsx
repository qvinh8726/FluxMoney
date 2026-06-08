"use client";

import * as React from "react";
import { Plus, Pencil, Trash2, Wallet, Landmark, Smartphone, CreditCard, Coins } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Dialog } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { accountBalance, useStore } from "@/lib/store";
import { useHydrated } from "@/lib/hooks";
import { formatCurrency, formatMoneyInput, parseMoneyInput, moneyToInput } from "@/lib/utils";
import type { Account, AccountKind } from "@/lib/types";

const KIND_LABEL: Record<AccountKind, string> = {
  cash: "Tiền mặt",
  bank: "Ngân hàng",
  ewallet: "Ví điện tử",
  credit: "Thẻ tín dụng",
  other: "Khác",
};

const KIND_ICON: Record<AccountKind, React.ComponentType<{ className?: string }>> = {
  cash: Coins,
  bank: Landmark,
  ewallet: Smartphone,
  credit: CreditCard,
  other: Wallet,
};

export default function AccountsPage() {
  const hydrated = useHydrated();
  const accounts = useStore((s) => s.accounts);
  const transactions = useStore((s) => s.transactions);
  const transfers = useStore((s) => s.transfers);
  const baseCurrency = useStore((s) => s.baseCurrency);
  const addAccount = useStore((s) => s.addAccount);
  const updateAccount = useStore((s) => s.updateAccount);
  const deleteAccount = useStore((s) => s.deleteAccount);

  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Account | null>(null);
  const [toDelete, setToDelete] = React.useState<Account | null>(null);

  const total = accounts.reduce(
    (sum, a) => sum + accountBalance(a, transactions, transfers),
    0
  );

  const deleteCount = toDelete
    ? transactions.filter((t) => t.accountId === toDelete.id).length
    : 0;

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Ví / Tài khoản</h1>
          <p className="text-sm text-muted-foreground">
            Quản lý các nơi chứa tiền và số dư.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
        >
          <Plus /> Thêm ví
        </Button>
      </div>

      <Card>
        <CardContent className="flex items-center justify-between p-5">
          <span className="text-sm text-muted-foreground">Tổng số dư</span>
          <span className="text-2xl font-bold">
            {hydrated ? formatCurrency(total, baseCurrency) : "—"}
          </span>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {accounts.map((a) => {
          const Icon = KIND_ICON[a.kind];
          const bal = accountBalance(a, transactions, transfers);
          return (
            <Card key={a.id}>
              <CardContent className="flex items-center gap-3 p-4">
                <span
                  className="flex size-11 items-center justify-center rounded-full"
                  style={{ backgroundColor: a.color + "22", color: a.color }}
                >
                  <Icon className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{a.name}</p>
                  <p className="text-xs text-muted-foreground">{KIND_LABEL[a.kind]}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">
                    {hydrated ? formatCurrency(bal, baseCurrency) : "—"}
                  </p>
                  <div className="mt-1 flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7"
                      aria-label="Sửa"
                      onClick={() => {
                        setEditing(a);
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
                      onClick={() => setToDelete(a)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <AccountDialog
        open={open}
        onClose={() => setOpen(false)}
        editing={editing}
        onSave={(data) => {
          if (editing) updateAccount(editing.id, data);
          else addAccount({ ...data, currency: baseCurrency });
          setOpen(false);
        }}
      />

      <ConfirmDialog
        open={toDelete !== null}
        onClose={() => setToDelete(null)}
        onConfirm={() => {
          if (toDelete) deleteAccount(toDelete.id);
        }}
        title={`Xóa ví "${toDelete?.name ?? ""}"?`}
        description={
          deleteCount > 0
            ? `${deleteCount} giao dịch liên kết cũng sẽ bị xóa. Hành động không thể hoàn tác.`
            : "Hành động không thể hoàn tác."
        }
        confirmLabel="Xóa"
        destructive
      />
    </div>
  );
}

function AccountDialog({
  open,
  onClose,
  editing,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  editing: Account | null;
  onSave: (data: Omit<Account, "id" | "createdAt" | "currency">) => void;
}) {
  const [name, setName] = React.useState("");
  const [kind, setKind] = React.useState<AccountKind>("cash");
  const [initialBalance, setInitialBalance] = React.useState("0");
  const [color, setColor] = React.useState("#2563EB");
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) return;
    setName(editing?.name ?? "");
    setKind(editing?.kind ?? "cash");
    setInitialBalance(moneyToInput(editing?.initialBalance ?? 0));
    setColor(editing?.color ?? "#2563EB");
    setError(null);
  }, [open, editing]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (trimmed.length < 1 || trimmed.length > 100) {
      setError("Tên ví phải từ 1 đến 100 ký tự.");
      return;
    }
    const bal = parseMoneyInput(initialBalance);
    if (Number.isNaN(bal) || Math.abs(bal) > 999_999_999.99) {
      setError("Số dư ban đầu không hợp lệ.");
      return;
    }
    onSave({ name: trimmed, kind, initialBalance: Math.round(bal * 100) / 100, color });
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={editing ? "Sửa ví" : "Thêm ví"}
      description="Một nơi chứa tiền: tiền mặt, ngân hàng, ví điện tử…"
    >
      <form onSubmit={submit} className="space-y-4">
        <div>
          <Label htmlFor="acc-name">Tên ví</Label>
          <Input
            id="acc-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="VD: Ngân hàng Vietcombank"
            autoFocus
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="acc-kind">Loại</Label>
            <Select
              id="acc-kind"
              value={kind}
              onChange={(e) => setKind(e.target.value as AccountKind)}
            >
              {Object.entries(KIND_LABEL).map(([k, label]) => (
                <option key={k} value={k}>
                  {label}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="acc-color">Màu</Label>
            <input
              id="acc-color"
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="h-10 w-full cursor-pointer rounded-md border border-input bg-background p-1"
            />
          </div>
        </div>
        <div>
          <Label htmlFor="acc-balance">Số dư ban đầu</Label>
          <Input
            id="acc-balance"
            inputMode="numeric"
            value={initialBalance}
            onChange={(e) => setInitialBalance(formatMoneyInput(e.target.value))}
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
          <Button type="submit">{editing ? "Lưu" : "Thêm ví"}</Button>
        </div>
      </form>
    </Dialog>
  );
}
