"use client";

import * as React from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { vi } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Plus, TrendingUp, TrendingDown, Scale } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { TransactionDialog } from "@/components/transaction-dialog";
import { DayDetailDialog } from "@/components/day-detail-dialog";
import { useStore } from "@/lib/store";
import { useHydrated } from "@/lib/hooks";
import { cn, formatCompact, formatCurrency, toDateKey } from "@/lib/utils";
import type { Transaction } from "@/lib/types";

const WEEKDAYS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

export default function CalendarPage() {
  const hydrated = useHydrated();
  const transactions = useStore((s) => s.transactions);
  const baseCurrency = useStore((s) => s.baseCurrency);

  const [cursor, setCursor] = React.useState(() => new Date());
  const [txOpen, setTxOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Transaction | null>(null);
  const [addDate, setAddDate] = React.useState<string | undefined>(undefined);
  const [dayOpen, setDayOpen] = React.useState(false);
  const [selectedDay, setSelectedDay] = React.useState<string | null>(null);

  // Gom giao dịch theo ngày để hiển thị nhanh trên lịch.
  const byDay = React.useMemo(() => {
    const map = new Map<string, { income: number; expense: number; count: number }>();
    for (const t of transactions) {
      const cur = map.get(t.date) ?? { income: 0, expense: 0, count: 0 };
      if (t.type === "income") cur.income += t.amount;
      else cur.expense += t.amount;
      cur.count += 1;
      map.set(t.date, cur);
    }
    return map;
  }, [transactions]);

  const monthStart = startOfMonth(cursor);
  const monthEnd = endOfMonth(cursor);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  // Tổng hợp tháng hiện tại.
  const monthTotals = React.useMemo(() => {
    let income = 0;
    let expense = 0;
    for (const t of transactions) {
      const d = new Date(t.date);
      if (isSameMonth(d, cursor)) {
        if (t.type === "income") income += t.amount;
        else expense += t.amount;
      }
    }
    return { income, expense, net: income - expense };
  }, [transactions, cursor]);

  function openAdd(dateKey?: string) {
    setEditing(null);
    setAddDate(dateKey);
    setTxOpen(true);
  }

  function openDay(dateKey: string) {
    setSelectedDay(dateKey);
    setDayOpen(true);
  }

  function editTx(tx: Transaction) {
    setDayOpen(false);
    setEditing(tx);
    setAddDate(undefined);
    setTxOpen(true);
  }

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Lịch dòng tiền</h1>
          <p className="text-sm text-muted-foreground">
            Theo dõi thu chi trực quan theo từng ngày.
          </p>
        </div>
        <Button onClick={() => openAdd()}>
          <Plus /> Thêm giao dịch
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <SummaryCard
          label="Tổng thu tháng"
          value={hydrated ? formatCurrency(monthTotals.income, baseCurrency) : "—"}
          icon={<TrendingUp className="size-5" />}
          tone="income"
        />
        <SummaryCard
          label="Tổng chi tháng"
          value={hydrated ? formatCurrency(monthTotals.expense, baseCurrency) : "—"}
          icon={<TrendingDown className="size-5" />}
          tone="expense"
        />
        <SummaryCard
          label="Dòng tiền ròng"
          value={hydrated ? formatCurrency(monthTotals.net, baseCurrency) : "—"}
          icon={<Scale className="size-5" />}
          tone={monthTotals.net >= 0 ? "income" : "expense"}
        />
      </div>

      {/* Calendar */}
      <Card>
        <CardContent className="p-3 sm:p-4">
          {/* Month nav */}
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold capitalize">
              {format(cursor, "MMMM yyyy", { locale: vi })}
            </h2>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCursor(new Date())}
              >
                Hôm nay
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Tháng trước"
                onClick={() => setCursor((c) => addMonths(c, -1))}
              >
                <ChevronLeft />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Tháng sau"
                onClick={() => setCursor((c) => addMonths(c, 1))}
              >
                <ChevronRight />
              </Button>
            </div>
          </div>

          {/* Weekday header */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {WEEKDAYS.map((d) => (
              <div
                key={d}
                className="pb-2 text-center text-xs font-medium text-muted-foreground"
              >
                {d}
              </div>
            ))}
          </div>

          {/* Day grid */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {days.map((day) => {
              const key = toDateKey(day);
              const info = hydrated ? byDay.get(key) : undefined;
              const inMonth = isSameMonth(day, cursor);
              const today = isToday(day);
              return (
                <button
                  key={key}
                  onClick={() => openDay(key)}
                  className={cn(
                    "group flex min-h-[68px] flex-col rounded-lg border p-1.5 text-left transition-colors sm:min-h-[92px] cursor-pointer",
                    inMonth ? "bg-background hover:bg-accent" : "bg-muted/40 text-muted-foreground hover:bg-accent",
                    today && "border-primary ring-1 ring-primary"
                  )}
                >
                  <span
                    className={cn(
                      "mb-1 inline-flex size-6 items-center justify-center rounded-full text-xs font-medium",
                      today && "bg-primary text-primary-foreground"
                    )}
                  >
                    {format(day, "d")}
                  </span>
                  <div className="mt-auto space-y-0.5">
                    {info && info.income > 0 && (
                      <div className="truncate text-[11px] font-semibold leading-tight text-income">
                        +{formatCompact(info.income)}
                      </div>
                    )}
                    {info && info.expense > 0 && (
                      <div className="truncate text-[11px] font-semibold leading-tight text-expense">
                        -{formatCompact(info.expense)}
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <TransactionDialog
        open={txOpen}
        onClose={() => setTxOpen(false)}
        editing={editing}
        defaultDate={addDate}
      />
      <DayDetailDialog
        open={dayOpen}
        onClose={() => setDayOpen(false)}
        dateKey={selectedDay}
        onAdd={(d) => {
          setDayOpen(false);
          openAdd(d);
        }}
        onEdit={editTx}
      />
    </div>
  );
}

function SummaryCard({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  tone: "income" | "expense";
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <span
          className={cn(
            "flex size-10 items-center justify-center rounded-full",
            tone === "income" ? "bg-income/15 text-income" : "bg-expense/15 text-expense"
          )}
        >
          {icon}
        </span>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="truncate text-lg font-bold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
