import { describe, it, expect } from "vitest";
import { analyze } from "./insights";
import type { Account, Category, Transaction } from "./types";

const now = new Date();
const thisMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
  2,
  "0"
)}-15`;

const acc: Account = {
  id: "a",
  name: "Ví",
  kind: "cash",
  initialBalance: 0,
  currency: "VND",
  color: "#000",
  createdAt: "2024-01-01",
};

const cat: Category = {
  id: "c",
  name: "Ăn uống",
  type: "expense",
  icon: "Tag",
  color: "#f00",
};

const tx = (
  type: "income" | "expense",
  amount: number,
  categoryId: string | null = null
): Transaction => ({
  id: Math.random().toString(),
  type,
  amount,
  date: thisMonthKey,
  accountId: "a",
  categoryId,
  createdAt: thisMonthKey,
});

describe("analyze", () => {
  it("tính thu/chi/ròng và tỷ lệ tiết kiệm của tháng hiện tại", () => {
    const txs = [tx("income", 1000), tx("expense", 400)];
    const r = analyze(txs, [acc], [], []);
    expect(r.monthIncome).toBe(1000);
    expect(r.monthExpense).toBe(400);
    expect(r.net).toBe(600);
    expect(r.savingsRate).toBeCloseTo(0.6);
  });

  it("savingsRate = 0 khi không có thu nhập (không chia cho 0)", () => {
    const r = analyze([tx("expense", 100)], [acc], [], []);
    expect(r.savingsRate).toBe(0);
  });

  it("top danh mục gộp theo categoryId và tính phần trăm", () => {
    const txs = [tx("expense", 300, "c"), tx("expense", 100, "c")];
    const r = analyze(txs, [acc], [cat], []);
    expect(r.topCategories[0].name).toBe("Ăn uống");
    expect(r.topCategories[0].amount).toBe(400);
    expect(r.topCategories[0].pct).toBeCloseTo(100);
  });

  it("luôn trả về ít nhất một insight khi rỗng", () => {
    const r = analyze([], [], [], []);
    expect(r.insights.length).toBeGreaterThan(0);
  });

  it("cảnh báo khi chi vượt thu", () => {
    const r = analyze([tx("income", 100), tx("expense", 200)], [acc], [], []);
    expect(r.net).toBe(-100);
    expect(r.insights.some((i) => i.tone === "warning")).toBe(true);
  });
});
