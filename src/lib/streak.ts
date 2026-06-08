import { addDays, parseISO } from "date-fns";
import { toDateKey, vnTodayKey } from "./utils";
import type { Transaction } from "./types";

export interface StreakInfo {
  current: number;
  longest: number;
  lastActiveDate: string | null;
}

/** Ngày kề trước của một mốc YYYY-MM-DD. */
function prevDay(key: string): string {
  return toDateKey(addDays(parseISO(key), -1));
}

/**
 * Chuỗi ngày ghi chép liên tiếp, tính thuần từ tập ngày có giao dịch.
 *
 * - `current`: chuỗi tới hôm nay (hoặc hôm qua nếu hôm nay chưa ghi — chưa đứt).
 *   Đứt chỉ khi cả hôm nay lẫn hôm qua đều trống.
 * - `longest`: chuỗi liên tiếp dài nhất từng đạt.
 * - `lastActiveDate`: ngày có giao dịch gần nhất.
 */
export function computeStreak(
  transactions: Transaction[],
  today: string = vnTodayKey()
): StreakInfo {
  const days = new Set(transactions.map((t) => t.date));
  if (days.size === 0) return { current: 0, longest: 0, lastActiveDate: null };

  const sorted = [...days].sort();
  const lastActiveDate = sorted[sorted.length - 1];

  // Longest: duyệt tăng dần, nối khi ngày kề nhau cách đúng 1 ngày.
  let longest = 1;
  let run = 1;
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i - 1] === prevDay(sorted[i])) {
      run += 1;
    } else {
      run = 1;
    }
    if (run > longest) longest = run;
  }

  // Current: neo tại hôm nay nếu có ghi, ngược lại hôm qua; nếu cả hai trống → 0.
  let anchor: string | null = null;
  if (days.has(today)) anchor = today;
  else if (days.has(prevDay(today))) anchor = prevDay(today);

  let current = 0;
  if (anchor) {
    current = 1;
    let cursor = prevDay(anchor);
    while (days.has(cursor)) {
      current += 1;
      cursor = prevDay(cursor);
    }
  }

  return { current, longest, lastActiveDate };
}
