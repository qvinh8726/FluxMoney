"use client";

import * as React from "react";
import { Plus, Pencil, Trash2, Target, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog } from "@/components/ui/dialog";
import { useStore } from "@/lib/store";
import { useHydrated } from "@/lib/hooks";
import {
  cn,
  formatCurrency,
  formatMoneyInput,
  parseMoneyInput,
  moneyToInput,
} from "@/lib/utils";
import { savingsProgress } from "@/lib/savings";
import type { SavingsGoal } from "@/lib/types";

export default function SavingsPage() {
  const hydrated = useHydrated();
  const savingsGoals = useStore((s) => s.savingsGoals);
  const baseCurrency = useStore((s) => s.baseCurrency);
  const addSavingsGoal = useStore((s) => s.addSavingsGoal);
  const updateSavingsGoal = useStore((s) => s.updateSavingsGoal);
  const deleteSavingsGoal = useStore((s) => s.deleteSavingsGoal);

  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<SavingsGoal | null>(null);
  const [confirmId, setConfirmId] = React.useState<string | null>(null);

  async function handleSave(data: Omit<SavingsGoal, "id" | "createdAt">) {
    const ok = editing
      ? await updateSavingsGoal(editing.id, data)
      : await addSavingsGoal(data);
    return ok;
  }

  function handleDelete(id: string) {
    deleteSavingsGoal(id);
    setConfirmId(null);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Mục tiêu tiết kiệm</h1>
          <p className="text-sm text-muted-foreground">
            Đặt mục tiêu và theo dõi tiến độ tiết kiệm của bạn.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
        >
          <Plus /> Thêm mục tiêu
        </Button>
      </div>

      {!hydrated ? null : savingsGoals.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            Chưa có mục tiêu nào. Thêm mục tiêu để bắt đầu theo dõi tiết kiệm.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {savingsGoals.map((g) => {
            const { percent, remaining, done } = savingsProgress(g);
            return (
              <Card key={g.id}>
                <CardContent className="p-4">
                  <div className="mb-3 flex items-start gap-3">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Target className="size-4" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{g.name}</p>
                      {g.deadline && (() => {
                        // Parse thủ công tránh bẫy UTC của new Date("YYYY-MM-DD")
                        const [y, m, d] = g.deadline.split("-").map(Number);
                        const deadlineDate = new Date(y, m - 1, d);
                        return (
                          <p className="text-xs text-muted-foreground">
                            Hạn:{" "}
                            {deadlineDate.toLocaleDateString("vi-VN", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                            })}
                          </p>
                        );
                      })()}
                      {g.note && (
                        <p className="mt-0.5 text-xs text-muted-foreground truncate">
                          {g.note}
                        </p>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7"
                        aria-label="Sửa"
                        onClick={() => {
                          setEditing(g);
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
                        onClick={() => setConfirmId(g.id)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-secondary">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        done ? "bg-income" : "bg-primary"
                      )}
                      style={{ width: `${percent}%` }}
                    />
                  </div>

                  <div className="mt-2 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {formatCurrency(g.currentAmount, baseCurrency)} /{" "}
                      {formatCurrency(g.targetAmount, baseCurrency)}
                    </span>
                    {done ? (
                      <span className="flex items-center gap-1 font-medium text-income">
                        <CheckCircle2 className="size-4" /> Hoàn thành!
                      </span>
                    ) : (
                      <span className="font-medium">
                        {Math.round(percent)}% —{" "}
                        <span className="text-muted-foreground">
                          còn {formatCurrency(remaining, baseCurrency)}
                        </span>
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Dialog thêm/sửa */}
      <SavingsGoalDialog
        open={open}
        onClose={() => setOpen(false)}
        editing={editing}
        onSave={handleSave}
      />

      {/* Dialog xác nhận xóa */}
      <Dialog
        open={confirmId !== null}
        onClose={() => setConfirmId(null)}
        title="Xóa mục tiêu"
      >
        <p className="text-sm text-muted-foreground">
          Bạn có chắc muốn xóa mục tiêu này không? Hành động này không thể hoàn tác.
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setConfirmId(null)}>
            Hủy
          </Button>
          <Button
            variant="destructive"
            onClick={() => confirmId && handleDelete(confirmId)}
          >
            Xóa
          </Button>
        </div>
      </Dialog>
    </div>
  );
}

function SavingsGoalDialog({
  open,
  onClose,
  editing,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  editing: SavingsGoal | null;
  onSave: (data: Omit<SavingsGoal, "id" | "createdAt">) => Promise<boolean>;
}) {
  const [name, setName] = React.useState("");
  const [targetAmount, setTargetAmount] = React.useState("");
  const [currentAmount, setCurrentAmount] = React.useState("");
  const [deadline, setDeadline] = React.useState("");
  const [note, setNote] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    setName(editing?.name ?? "");
    setTargetAmount(editing ? moneyToInput(editing.targetAmount) : "");
    setCurrentAmount(editing ? moneyToInput(editing.currentAmount) : "");
    setDeadline(editing?.deadline ?? "");
    setNote(editing?.note ?? "");
    setError(null);
  }, [open, editing]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Vui lòng nhập tên mục tiêu.");
      return;
    }
    const target = parseMoneyInput(targetAmount);
    if (Number.isNaN(target) || target < 1) {
      setError("Số tiền mục tiêu phải lớn hơn 0.");
      return;
    }
    const current = currentAmount ? parseMoneyInput(currentAmount) : 0;
    if (Number.isNaN(current) || current < 0) {
      setError("Số tiền đã tiết kiệm không hợp lệ.");
      return;
    }
    setSaving(true);
    const ok = await onSave({
      name: name.trim(),
      targetAmount: Math.round(target * 100) / 100,
      currentAmount: Math.round(current * 100) / 100,
      deadline: deadline || undefined,
      note: note.trim() || undefined,
    });
    setSaving(false);
    // Chỉ đóng khi lưu thành công; nếu lỗi, store đã hiện toast và giữ
    // nguyên dialog để user không mất dữ liệu vừa nhập.
    if (ok) onClose();
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={editing ? "Sửa mục tiêu" : "Thêm mục tiêu tiết kiệm"}
    >
      <form onSubmit={submit} className="space-y-4">
        <div>
          <Label htmlFor="sg-name">Tên mục tiêu</Label>
          <Input
            id="sg-name"
            placeholder="Vd: Mua laptop, Du lịch Nhật..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="sg-target">Số tiền mục tiêu</Label>
            <Input
              id="sg-target"
              inputMode="numeric"
              placeholder="0"
              value={targetAmount}
              onChange={(e) => setTargetAmount(formatMoneyInput(e.target.value))}
            />
          </div>
          <div>
            <Label htmlFor="sg-current">Đã tiết kiệm được</Label>
            <Input
              id="sg-current"
              inputMode="numeric"
              placeholder="0"
              value={currentAmount}
              onChange={(e) => setCurrentAmount(formatMoneyInput(e.target.value))}
            />
          </div>
        </div>
        <div>
          <Label htmlFor="sg-deadline">Ngày hạn (tùy chọn)</Label>
          <Input
            id="sg-deadline"
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="sg-note">Ghi chú (tùy chọn)</Label>
          <Input
            id="sg-note"
            placeholder="Ghi chú thêm..."
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
          <Button type="submit" disabled={saving}>
            {saving ? "Đang lưu…" : editing ? "Lưu" : "Thêm"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
