"use client";

import * as React from "react";
import { Download, Coins } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { useStore } from "@/lib/store";
import { useHydrated } from "@/lib/hooks";

const CURRENCIES = ["VND", "USD", "EUR", "JPY", "GBP", "AUD", "SGD", "KRW"];

export default function SettingsPage() {
  const hydrated = useHydrated();
  const baseCurrency = useStore((s) => s.baseCurrency);
  const setBaseCurrency = useStore((s) => s.setBaseCurrency);
  const exportData = useStore((s) => s.exportData);

  const [msg, setMsg] = React.useState<{ ok: boolean; text: string } | null>(null);

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
    </div>
  );
}
