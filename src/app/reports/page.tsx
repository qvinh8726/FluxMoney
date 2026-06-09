"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { format, subMonths } from "date-fns";
import { vi } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useStore } from "@/lib/store";
import { useHydrated } from "@/lib/hooks";
import { formatCurrency, isSameMonthKey } from "@/lib/utils";

const ChartFallback = () => (
  <div className="flex h-full w-full items-center justify-center">
    <span className="text-sm text-muted-foreground">Đang tải biểu đồ…</span>
  </div>
);

const MonthlyBarChart = dynamic(
  () => import("@/components/reports-charts").then((m) => m.MonthlyBarChart),
  { ssr: false, loading: ChartFallback }
);

const CategoryPieChart = dynamic(
  () => import("@/components/reports-charts").then((m) => m.CategoryPieChart),
  { ssr: false, loading: ChartFallback }
);

export default function ReportsPage() {
  const hydrated = useHydrated();
  const transactions = useStore((s) => s.transactions);
  const categories = useStore((s) => s.categories);
  const baseCurrency = useStore((s) => s.baseCurrency);

  // Chuỗi 12 tháng: thu, chi, ròng.
  const monthly = React.useMemo(() => {
    const now = new Date();
    const months = Array.from({ length: 12 }, (_, i) => subMonths(now, 11 - i));
    return months.map((m) => {
      let income = 0;
      let expense = 0;
      for (const t of transactions) {
        if (isSameMonthKey(t.date, m)) {
          if (t.type === "income") income += t.amount;
          else expense += t.amount;
        }
      }
      return {
        label: format(m, "MM/yy", { locale: vi }),
        income,
        expense,
        net: income - expense,
      };
    });
  }, [transactions]);

  // Phân tích chi theo danh mục trong tháng hiện tại.
  const byCategory = React.useMemo(() => {
    const now = new Date();
    const map = new Map<string, number>();
    for (const t of transactions) {
      if (t.type !== "expense") continue;
      if (!isSameMonthKey(t.date, now)) continue;
      const key = t.categoryId ?? "uncat";
      map.set(key, (map.get(key) ?? 0) + t.amount);
    }
    return Array.from(map.entries())
      .map(([id, value]) => {
        const cat = categories.find((c) => c.id === id);
        return {
          name: cat?.name ?? "Chưa phân loại",
          value,
          color: cat?.color ?? "#94A3B8",
        };
      })
      .sort((a, b) => b.value - a.value);
  }, [transactions, categories]);

  const totalExpense = byCategory.reduce((s, c) => s + c.value, 0);

  if (!hydrated) {
    return (
      <div className="mx-auto max-w-5xl">
        <p className="p-8 text-center text-sm text-muted-foreground">Đang tải…</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Báo cáo</h1>
        <p className="text-sm text-muted-foreground">
          Xu hướng dòng tiền 12 tháng và cơ cấu chi tiêu tháng này.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dòng tiền 12 tháng</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-72 w-full">
            <MonthlyBarChart data={monthly} baseCurrency={baseCurrency} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Cơ cấu chi tiêu tháng này</CardTitle>
        </CardHeader>
        <CardContent>
          {byCategory.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Chưa có khoản chi nào trong tháng này.
            </p>
          ) : (
            <div className="grid grid-cols-1 items-center gap-6 md:grid-cols-2">
              <div className="h-64">
                <CategoryPieChart data={byCategory} baseCurrency={baseCurrency} />
              </div>
              <ul className="space-y-2">
                {byCategory.map((c) => {
                  const pct = totalExpense > 0 ? (c.value / totalExpense) * 100 : 0;
                  return (
                    <li key={c.name} className="flex items-center gap-3">
                      <span
                        className="size-3 shrink-0 rounded-full"
                        style={{ backgroundColor: c.color }}
                      />
                      <span className="flex-1 truncate text-sm">{c.name}</span>
                      <span className="text-sm font-medium">
                        {formatCurrency(c.value, baseCurrency)}
                      </span>
                      <span className="w-12 text-right text-xs text-muted-foreground">
                        {pct.toFixed(0)}%
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
