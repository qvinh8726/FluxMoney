"use client";

import * as React from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { format, subMonths, isSameMonth } from "date-fns";
import { vi } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useStore } from "@/lib/store";
import { useHydrated } from "@/lib/hooks";
import { formatCompact, formatCurrency } from "@/lib/utils";

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
        if (isSameMonth(new Date(t.date), m)) {
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
      if (!isSameMonth(new Date(t.date), now)) continue;
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
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthly} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
                <XAxis dataKey="label" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => formatCompact(Number(v))}
                  width={48}
                />
                <Tooltip
                  formatter={(v: number) => formatCurrency(v, baseCurrency)}
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid hsl(var(--border))",
                    background: "hsl(var(--popover))",
                    color: "hsl(var(--popover-foreground))",
                  }}
                />
                <Legend />
                <Bar dataKey="income" name="Thu" fill="hsl(var(--income))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" name="Chi" fill="hsl(var(--expense))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
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
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={byCategory}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={55}
                      outerRadius={90}
                      paddingAngle={2}
                    >
                      {byCategory.map((c) => (
                        <Cell key={c.name} fill={c.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(v: number) => formatCurrency(v, baseCurrency)}
                      contentStyle={{
                        borderRadius: 12,
                        border: "1px solid hsl(var(--border))",
                        background: "hsl(var(--popover))",
                        color: "hsl(var(--popover-foreground))",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
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
