"use client";

import * as React from "react";
import { Flame } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useStore } from "@/lib/store";
import { useHydrated } from "@/lib/hooks";
import { computeStreak } from "@/lib/streak";
import { cn } from "@/lib/utils";

export function StreakBadge() {
  const hydrated = useHydrated();
  const transactions = useStore((s) => s.transactions);
  const streak = React.useMemo(() => computeStreak(transactions), [transactions]);

  const active = hydrated && streak.current > 0;

  // Tách nội dung 3 trạng thái ra hàm với early-return để tránh nested ternary.
  function renderContent() {
    if (!hydrated) {
      return <p className="truncate text-lg font-bold">—</p>;
    }
    if (active) {
      return (
        <>
          <p className="text-xs text-muted-foreground">Chuỗi ghi chép</p>
          <p className="truncate text-lg font-bold">
            {streak.current} ngày liên tục
          </p>
          <p className="text-xs text-muted-foreground">
            Kỷ lục: {streak.longest} ngày
          </p>
        </>
      );
    }
    return (
      <>
        <p className="text-xs text-muted-foreground">Chuỗi ghi chép</p>
        <p className="truncate text-sm font-medium">
          Ghi giao dịch hôm nay để bắt đầu chuỗi!
        </p>
      </>
    );
  }

  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <span
          className={cn(
            "flex size-10 items-center justify-center rounded-full",
            active ? "bg-orange-500/15 text-orange-500" : "bg-muted text-muted-foreground"
          )}
        >
          <Flame className="size-5" />
        </span>
        <div className="min-w-0">{renderContent()}</div>
      </CardContent>
    </Card>
  );
}
