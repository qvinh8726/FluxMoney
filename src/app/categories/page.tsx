"use client";

import * as React from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Dialog } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useStore } from "@/lib/store";
import { useHydrated } from "@/lib/hooks";
import type { Category, TxType } from "@/lib/types";

export default function CategoriesPage() {
  const hydrated = useHydrated();
  const categories = useStore((s) => s.categories);
  const addCategory = useStore((s) => s.addCategory);
  const updateCategory = useStore((s) => s.updateCategory);
  const deleteCategory = useStore((s) => s.deleteCategory);

  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Category | null>(null);
  const [toDelete, setToDelete] = React.useState<Category | null>(null);

  const income = categories.filter((c) => c.type === "income");
  const expense = categories.filter((c) => c.type === "expense");

  function save(data: Omit<Category, "id">) {
    // Chống trùng tên cùng loại (không phân biệt hoa thường).
    const dup = categories.find(
      (c) =>
        c.id !== editing?.id &&
        c.type === data.type &&
        c.name.trim().toLowerCase() === data.name.trim().toLowerCase()
    );
    if (dup) return "Đã tồn tại danh mục cùng tên và cùng loại.";
    if (editing) updateCategory(editing.id, data);
    else addCategory(data);
    setOpen(false);
    return null;
  }

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Danh mục</h1>
          <p className="text-sm text-muted-foreground">
            Phân loại giao dịch để dễ phân tích.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
        >
          <Plus /> Thêm danh mục
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <CategoryGroup
          title="Danh mục thu"
          tone="income"
          items={hydrated ? income : []}
          onEdit={(c) => {
            setEditing(c);
            setOpen(true);
          }}
          onRemove={setToDelete}
        />
        <CategoryGroup
          title="Danh mục chi"
          tone="expense"
          items={hydrated ? expense : []}
          onEdit={(c) => {
            setEditing(c);
            setOpen(true);
          }}
          onRemove={setToDelete}
        />
      </div>

      <CategoryDialog
        open={open}
        onClose={() => setOpen(false)}
        editing={editing}
        onSave={save}
      />

      <ConfirmDialog
        open={toDelete !== null}
        onClose={() => setToDelete(null)}
        onConfirm={() => {
          if (toDelete) deleteCategory(toDelete.id);
        }}
        title={`Xóa danh mục "${toDelete?.name ?? ""}"?`}
        description='Giao dịch liên quan sẽ chuyển về "Chưa phân loại". Ngân sách của danh mục này cũng bị xóa.'
        confirmLabel="Xóa"
        destructive
      />
    </div>
  );
}

function CategoryGroup({
  title,
  tone,
  items,
  onEdit,
  onRemove,
}: {
  title: string;
  tone: "income" | "expense";
  items: Category[];
  onEdit: (c: Category) => void;
  onRemove: (c: Category) => void;
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <span
            className={
              "inline-block size-2.5 rounded-full " +
              (tone === "income" ? "bg-income" : "bg-expense")
            }
          />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {items.length === 0 ? (
          <p className="py-4 text-sm text-muted-foreground">Chưa có danh mục.</p>
        ) : (
          <ul className="space-y-1">
            {items.map((c) => (
              <li
                key={c.id}
                className="group flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-accent"
              >
                <span
                  className="flex size-8 items-center justify-center rounded-full text-xs font-semibold"
                  style={{ backgroundColor: c.color + "22", color: c.color }}
                >
                  {c.name.slice(0, 1)}
                </span>
                <span className="flex-1 text-sm font-medium">{c.name}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7"
                  aria-label="Sửa"
                  onClick={() => onEdit(c)}
                >
                  <Pencil className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7 text-destructive hover:text-destructive"
                  aria-label="Xóa"
                  onClick={() => onRemove(c)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function CategoryDialog({
  open,
  onClose,
  editing,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  editing: Category | null;
  onSave: (data: Omit<Category, "id">) => string | null;
}) {
  const [name, setName] = React.useState("");
  const [type, setType] = React.useState<TxType>("expense");
  const [color, setColor] = React.useState("#F97316");
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) return;
    setName(editing?.name ?? "");
    setType(editing?.type ?? "expense");
    setColor(editing?.color ?? "#F97316");
    setError(null);
  }, [open, editing]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (trimmed.length < 1 || trimmed.length > 50) {
      setError("Tên danh mục phải từ 1 đến 50 ký tự.");
      return;
    }
    const err = onSave({ name: trimmed, type, color, icon: "Tag" });
    if (err) setError(err);
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={editing ? "Sửa danh mục" : "Thêm danh mục"}
    >
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setType("expense")}
            className={
              "rounded-lg border py-2.5 text-sm font-medium transition-colors cursor-pointer " +
              (type === "expense"
                ? "border-expense bg-expense/10 text-expense"
                : "hover:bg-accent")
            }
          >
            Chi
          </button>
          <button
            type="button"
            onClick={() => setType("income")}
            className={
              "rounded-lg border py-2.5 text-sm font-medium transition-colors cursor-pointer " +
              (type === "income"
                ? "border-income bg-income/10 text-income"
                : "hover:bg-accent")
            }
          >
            Thu
          </button>
        </div>
        <div className="grid grid-cols-[1fr_auto] gap-3">
          <div>
            <Label htmlFor="cat-name">Tên danh mục</Label>
            <Input
              id="cat-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="VD: Ăn uống"
              autoFocus
            />
          </div>
          <div>
            <Label htmlFor="cat-color">Màu</Label>
            <input
              id="cat-color"
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="h-10 w-14 cursor-pointer rounded-md border border-input bg-background p-1"
            />
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
