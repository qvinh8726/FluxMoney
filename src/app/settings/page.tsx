"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Download, Coins, Trash2, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Dialog } from "@/components/ui/dialog";
import { createClient } from "@/lib/supabase/client";
import { useStore } from "@/lib/store";
import { useHydrated } from "@/lib/hooks";
import { toast } from "@/lib/toast";

const CURRENCIES = ["VND", "USD", "EUR", "JPY", "GBP", "AUD", "SGD", "KRW"];

export default function SettingsPage() {
  const hydrated = useHydrated();
  const router = useRouter();
  const baseCurrency = useStore((s) => s.baseCurrency);
  const setBaseCurrency = useStore((s) => s.setBaseCurrency);
  const exportData = useStore((s) => s.exportData);

  const [msg, setMsg] = React.useState<{ ok: boolean; text: string } | null>(null);
  const [delOpen, setDelOpen] = React.useState(false);
  const [confirmText, setConfirmText] = React.useState("");
  const [deleting, setDeleting] = React.useState(false);

  function handleExport() {
    const json = exportData();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `dong-tien-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setMsg({ ok: true, text: "Đã tải file sao lưu." });
  }

  async function handleDeleteAccount() {
    setDeleting(true);
    try {
      const res = await fetch("/api/account/delete", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        toast.error(data.reason ?? "Không xóa được tài khoản. Vui lòng thử lại.");
        setDeleting(false);
        return;
      }
      // Dọn phiên trình duyệt rồi đưa về trang đăng nhập.
      const supabase = createClient();
      await supabase.auth.signOut();
      useStore.getState().clear();
      router.push("/login");
      router.refresh();
    } catch {
      toast.error("Không kết nối được tới máy chủ. Vui lòng thử lại.");
      setDeleting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Cài đặt</h1>
        <p className="text-sm text-muted-foreground">
          Tùy chỉnh đơn vị tiền tệ và quản lý dữ liệu của bạn.
        </p>
      </div>

      {msg && (
        <p
          className={
            "rounded-md px-3 py-2 text-sm " +
            (msg.ok
              ? "bg-income/10 text-income"
              : "bg-destructive/10 text-destructive")
          }
        >
          {msg.text}
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Coins className="size-5 text-primary" /> Đơn vị tiền tệ
          </CardTitle>
          <CardDescription>
            Tiền tệ chính dùng để hiển thị và tổng hợp số liệu.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Label htmlFor="cur">Tiền tệ chính</Label>
          <Select
            id="cur"
            className="max-w-xs"
            value={hydrated ? baseCurrency : "VND"}
            onChange={(e) => setBaseCurrency(e.target.value)}
          >
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
          <p className="mt-2 text-xs text-muted-foreground">
            Lưu ý: đổi tiền tệ chỉ thay đổi <strong>cách hiển thị</strong> (ký hiệu, số lẻ),
            không tự quy đổi tỷ giá các số đã nhập. Hãy chọn đúng đơn vị bạn dùng để ghi sổ.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sao lưu dữ liệu</CardTitle>
          <CardDescription>
            Dữ liệu của bạn được lưu an toàn trên đám mây (Supabase) và chỉ mình bạn
            truy cập được. Bạn có thể tải một bản sao lưu offline.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={handleExport}>
            <Download className="size-4" /> Xuất dữ liệu (.json)
          </Button>
        </CardContent>
      </Card>

      <Card className="border-destructive/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base text-destructive">
            <Trash2 className="size-5" /> Vùng nguy hiểm
          </CardTitle>
          <CardDescription>
            Xóa vĩnh viễn tài khoản cùng toàn bộ ví, giao dịch, ngân sách và dữ liệu
            khác. Hành động này <strong>không thể hoàn tác</strong>. Nên xuất một bản
            sao lưu trước khi xóa.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="destructive"
            onClick={() => {
              setConfirmText("");
              setDelOpen(true);
            }}
          >
            <Trash2 className="size-4" /> Xóa tài khoản
          </Button>
        </CardContent>
      </Card>

      <Dialog
        open={delOpen}
        onClose={() => !deleting && setDelOpen(false)}
        title="Xóa tài khoản vĩnh viễn?"
        className="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Toàn bộ dữ liệu của bạn sẽ bị xóa ngay lập tức và không thể khôi phục.
            Gõ <strong>XÓA</strong> vào ô bên dưới để xác nhận.
          </p>
          <div>
            <Label htmlFor="confirm-del">Xác nhận</Label>
            <Input
              id="confirm-del"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="XÓA"
              autoComplete="off"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setDelOpen(false)}
              disabled={deleting}
            >
              Hủy
            </Button>
            <Button
              variant="destructive"
              disabled={confirmText.trim().toUpperCase() !== "XÓA" || deleting}
              onClick={handleDeleteAccount}
            >
              {deleting ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
              Xóa vĩnh viễn
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
