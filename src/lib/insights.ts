import {
  endOfMonth,
  getDaysInMonth,
  isSameMonth,
  isWithinInterval,
  subMonths,
} from "date-fns";
import type { Account, Budget, Category, Transaction } from "./types";
import { accountBalance } from "./store";
import { periodInterval } from "./utils";
import { formatCurrency } from "./utils";

export type InsightTone = "positive" | "warning" | "info";

export interface Insight {
  tone: InsightTone;
  title: string;
  detail: string;
}

export interface Analysis {
  monthIncome: number;
  monthExpense: number;
  net: number;
  savingsRate: number; // 0..1
  prevExpense: number;
  expenseChangePct: number | null; // so với tháng trước
  dailyAvg: number;
  projectedExpense: number;
  totalBalance: number;
  runwayMonths: number | null; // số tháng cầm cự được
  topCategories: { name: string; amount: number; color: string; pct: number }[];
  biggest: { name: string; amount: number } | null;
  insights: Insight[];
}

function monthExpenseFor(transactions: Transaction[], ref: Date): number {
  return transactions
    .filter((t) => t.type === "expense" && isSameMonth(new Date(t.date), ref))
    .reduce((s, t) => s + t.amount, 0);
}

export function analyze(
  transactions: Transaction[],
  accounts: Account[],
  categories: Category[],
  budgets: Budget[]
): Analysis {
  const now = new Date();

  const monthTx = transactions.filter((t) => isSameMonth(new Date(t.date), now));
  const monthIncome = monthTx
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + t.amount, 0);
  const monthExpense = monthTx
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + t.amount, 0);
  const net = monthIncome - monthExpense;
  const savingsRate = monthIncome > 0 ? net / monthIncome : 0;

  const prevExpense = monthExpenseFor(transactions, subMonths(now, 1));
  const expenseChangePct =
    prevExpense > 0 ? ((monthExpense - prevExpense) / prevExpense) * 100 : null;

  const dayOfMonth = now.getDate();
  const daysInMonth = getDaysInMonth(now);
  const dailyAvg = dayOfMonth > 0 ? monthExpense / dayOfMonth : 0;
  const projectedExpense = dailyAvg * daysInMonth;

  const totalBalance = accounts.reduce(
    (s, a) => s + accountBalance(a, transactions),
    0
  );

  // Chi trung bình 3 tháng gần nhất để ước lượng runway.
  const avgMonthlyExpense =
    [0, 1, 2]
      .map((i) => monthExpenseFor(transactions, subMonths(now, i)))
      .reduce((s, v) => s + v, 0) / 3;
  const runwayMonths =
    avgMonthlyExpense > 0 ? totalBalance / avgMonthlyExpense : null;

  // Top danh mục chi tháng này.
  const catMap = new Map<string, number>();
  for (const t of monthTx) {
    if (t.type !== "expense") continue;
    const key = t.categoryId ?? "uncat";
    catMap.set(key, (catMap.get(key) ?? 0) + t.amount);
  }
  const topCategories = Array.from(catMap.entries())
    .map(([id, amount]) => {
      const cat = categories.find((c) => c.id === id);
      return {
        name: cat?.name ?? "Chưa phân loại",
        amount,
        color: cat?.color ?? "#94A3B8",
        pct: monthExpense > 0 ? (amount / monthExpense) * 100 : 0,
      };
    })
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  // Giao dịch chi lớn nhất tháng.
  const biggestTx = monthTx
    .filter((t) => t.type === "expense")
    .sort((a, b) => b.amount - a.amount)[0];
  const biggest = biggestTx
    ? {
        name:
          categories.find((c) => c.id === biggestTx.categoryId)?.name ??
          "Chưa phân loại",
        amount: biggestTx.amount,
      }
    : null;

  // ---- Sinh insight ----
  const insights: Insight[] = [];

  if (monthIncome > 0) {
    if (savingsRate >= 0.2) {
      insights.push({
        tone: "positive",
        title: "Tỷ lệ tiết kiệm tốt",
        detail: `Bạn đang để dành ${(savingsRate * 100).toFixed(
          0
        )}% thu nhập tháng này. Tiếp tục duy trì nhé!`,
      });
    } else if (savingsRate >= 0) {
      insights.push({
        tone: "info",
        title: "Tỷ lệ tiết kiệm còn khiêm tốn",
        detail: `Tháng này bạn để dành ${(savingsRate * 100).toFixed(
          0
        )}% thu nhập. Mục tiêu lý tưởng thường là 20% trở lên.`,
      });
    } else {
      insights.push({
        tone: "warning",
        title: "Đang chi nhiều hơn thu",
        detail: `Tháng này chi vượt thu. Hãy rà soát các khoản chi lớn để cân đối lại.`,
      });
    }
  }

  if (expenseChangePct !== null) {
    if (expenseChangePct > 15) {
      insights.push({
        tone: "warning",
        title: "Chi tiêu tăng so với tháng trước",
        detail: `Chi tiêu tháng này cao hơn tháng trước khoảng ${expenseChangePct.toFixed(
          0
        )}%.`,
      });
    } else if (expenseChangePct < -10) {
      insights.push({
        tone: "positive",
        title: "Chi tiêu giảm so với tháng trước",
        detail: `Bạn đã chi ít hơn tháng trước khoảng ${Math.abs(
          expenseChangePct
        ).toFixed(0)}%. Rất tốt!`,
      });
    }
  }

  if (topCategories[0] && topCategories[0].pct >= 40) {
    insights.push({
      tone: "info",
      title: `Phụ thuộc nhiều vào "${topCategories[0].name}"`,
      detail: `Danh mục này chiếm ${topCategories[0].pct.toFixed(
        0
      )}% tổng chi tháng này. Cân nhắc đa dạng hóa hoặc cắt giảm nếu cần.`,
    });
  }

  // Cảnh báo ngân sách (tính theo đúng kỳ của từng ngân sách).
  for (const b of budgets) {
    const { start, end } = periodInterval(b.period);
    const spent = transactions
      .filter(
        (t) =>
          t.type === "expense" &&
          t.categoryId === b.categoryId &&
          isWithinInterval(new Date(t.date), { start, end })
      )
      .reduce((s, t) => s + t.amount, 0);
    const pct = b.amount > 0 ? (spent / b.amount) * 100 : 0;
    const cat = categories.find((c) => c.id === b.categoryId);
    if (pct >= 100) {
      insights.push({
        tone: "warning",
        title: `Vượt ngân sách "${cat?.name ?? ""}"`,
        detail: `Đã dùng ${pct.toFixed(0)}% hạn mức danh mục này.`,
      });
    } else if (pct >= 80) {
      insights.push({
        tone: "warning",
        title: `Sắp chạm ngân sách "${cat?.name ?? ""}"`,
        detail: `Đã dùng ${pct.toFixed(0)}% hạn mức. Hãy chi tiêu thận trọng.`,
      });
    }
  }

  if (projectedExpense > 0 && dayOfMonth < daysInMonth) {
    insights.push({
      tone: "info",
      title: "Dự báo chi cả tháng",
      detail: `Với nhịp hiện tại, ước tính bạn sẽ chi khoảng ${Math.round(
        projectedExpense
      ).toLocaleString("vi-VN")} ₫ cho cả tháng.`,
    });
  }

  if (runwayMonths !== null && runwayMonths < 3) {
    insights.push({
      tone: "warning",
      title: "Quỹ dự phòng mỏng",
      detail: `Số dư hiện tại chỉ đủ chi tiêu khoảng ${runwayMonths.toFixed(
        1
      )} tháng. Nên xây quỹ khẩn cấp 3–6 tháng.`,
    });
  } else if (runwayMonths !== null && runwayMonths >= 6) {
    insights.push({
      tone: "positive",
      title: "Quỹ dự phòng vững",
      detail: `Số dư đủ trang trải khoảng ${runwayMonths.toFixed(
        0
      )} tháng chi tiêu. Nền tảng tài chính khá an toàn.`,
    });
  }

  if (insights.length === 0) {
    insights.push({
      tone: "info",
      title: "Chưa đủ dữ liệu để phân tích sâu",
      detail: "Hãy thêm vài giao dịch để nhận được nhận định chi tiết hơn.",
    });
  }

  return {
    monthIncome,
    monthExpense,
    net,
    savingsRate,
    prevExpense,
    expenseChangePct,
    dailyAvg,
    projectedExpense,
    totalBalance,
    runwayMonths,
    topCategories,
    biggest,
    insights,
  };
}

/** Tạo đoạn tóm tắt ngôn ngữ tự nhiên (dùng cho prompt AI hoặc hiển thị). */
export function buildSummaryText(a: Analysis, currency: string = "VND"): string {
  const fmt = (n: number) => formatCurrency(n, currency);
  const lines = [
    `Tổng quan tài chính tháng này:`,
    `- Thu: ${fmt(a.monthIncome)}, Chi: ${fmt(a.monthExpense)}, Ròng: ${fmt(a.net)}.`,
    `- Tỷ lệ tiết kiệm: ${(a.savingsRate * 100).toFixed(0)}%.`,
    `- Tổng số dư: ${fmt(a.totalBalance)}.`,
    a.runwayMonths !== null
      ? `- Quỹ dự phòng đủ ~${a.runwayMonths.toFixed(1)} tháng.`
      : "",
    a.topCategories.length
      ? `- Chi nhiều nhất: ${a.topCategories
          .slice(0, 3)
          .map((c) => `${c.name} (${fmt(c.amount)})`)
          .join(", ")}.`
      : "",
  ].filter(Boolean);
  return lines.join("\n");
}
