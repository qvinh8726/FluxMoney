import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import {
  startOfMonth,
  endOfMonth,
  startOfQuarter,
  endOfQuarter,
  startOfYear,
  endOfYear,
} from "date-fns";
import type { BudgetPeriod } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Định dạng số tiền theo Base_Currency của tenant. */
export function formatCurrency(
  amount: number,
  currency: string = "VND",
  locale: string = "vi-VN"
): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      maximumFractionDigits: currency === "VND" ? 0 : 2,
    }).format(amount);
  } catch {
    return `${amount.toLocaleString(locale)} ${currency}`;
  }
}

/**
 * Định dạng chuỗi người dùng đang gõ thành dạng có dấu phân cách nghìn
 * theo quy ước vi-VN: '.' ngăn cách nghìn, ',' ngăn cách thập phân.
 * Giữ nguyên dấu thập phân đang gõ dở (vd "1.000," → cho gõ tiếp phần lẻ).
 */
export function formatMoneyInput(raw: string): string {
  const neg = raw.trim().startsWith("-");
  let s = raw.replace(/[^\d,]/g, "");
  const firstComma = s.indexOf(",");
  if (firstComma !== -1) {
    // Chỉ giữ dấu phẩy thập phân đầu tiên; bỏ các dấu phẩy thừa phía sau.
    s = s.slice(0, firstComma + 1) + s.slice(firstComma + 1).replace(/,/g, "");
  }
  const [intPart, decPart] = s.split(",");
  const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  const body = decPart !== undefined ? `${grouped},${decPart.slice(0, 2)}` : grouped;
  return neg && body ? `-${body}` : body;
}

/** Đổi chuỗi tiền đã format (vi-VN) về số thuần. Trả NaN nếu rỗng/không hợp lệ. */
export function parseMoneyInput(raw: string): number {
  const neg = raw.trim().startsWith("-");
  const s = raw.replace(/\./g, "").replace(",", ".").replace(/-/g, "");
  if (!s) return NaN;
  const n = Number(s);
  return neg ? -n : n;
}

/** Đổi số sang chuỗi nhập đã format, dùng khi mở dialog sửa. */
export function moneyToInput(n: number): string {
  return formatMoneyInput(String(n).replace(".", ","));
}

/** Định dạng gọn (vd 1.2tr) cho badge nhỏ trên lịch. */
export function formatCompact(amount: number): string {
  const abs = Math.abs(amount);
  if (abs >= 1_000_000_000) return `${(amount / 1_000_000_000).toFixed(1)}T`;
  if (abs >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}tr`;
  if (abs >= 1_000) return `${(amount / 1_000).toFixed(0)}k`;
  return `${amount}`;
}

export function uid(prefix = ""): string {
  return `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

/** Khoảng thời gian [start, end] của một kỳ ngân sách quanh mốc `ref`. */
export function periodInterval(
  period: BudgetPeriod,
  ref: Date = new Date()
): { start: Date; end: Date } {
  switch (period) {
    case "quarterly":
      return { start: startOfQuarter(ref), end: endOfQuarter(ref) };
    case "yearly":
      return { start: startOfYear(ref), end: endOfYear(ref) };
    case "monthly":
    default:
      return { start: startOfMonth(ref), end: endOfMonth(ref) };
  }
}

export const PERIOD_LABEL: Record<BudgetPeriod, string> = {
  monthly: "Hằng tháng",
  quarterly: "Hằng quý",
  yearly: "Hằng năm",
};

/** YYYY-MM-DD theo giờ địa phương (tránh lệch timezone của toISOString). */
export function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * "Hôm nay" theo múi giờ Việt Nam (UTC+7), trả về YYYY-MM-DD.
 * Không phụ thuộc timezone của trình duyệt/server — luôn lấy mốc ngày VN.
 */
export function vnTodayKey(): string {
  const now = new Date();
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
  const vn = new Date(utcMs + 7 * 3600000);
  return toDateKey(vn);
}
