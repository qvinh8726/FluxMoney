import { describe, it, expect } from "vitest";
import { answerQuestion } from "./assistant";
import type { Analysis } from "./insights";

const base: Analysis = {
  monthIncome: 1000,
  monthExpense: 400,
  net: 600,
  savingsRate: 0.6,
  prevExpense: 500,
  expenseChangePct: -20,
  dailyAvg: 20,
  projectedExpense: 600,
  totalBalance: 5000,
  runwayMonths: 12.5,
  topCategories: [
    { name: "Ăn uống", amount: 300, color: "#f00", pct: 75 },
    { name: "Đi lại", amount: 100, color: "#00f", pct: 25 },
  ],
  biggest: { name: "Ăn uống", amount: 200 },
  insights: [{ tone: "warning", title: "Test", detail: "Chi tiết test" }],
};

describe("answerQuestion", () => {
  it("hỏi tiết kiệm trả về số dư ròng và tỷ lệ", () => {
    const a = answerQuestion("Tôi tiết kiệm được bao nhiêu?", base);
    expect(a).toContain("60%");
  });

  it("hỏi danh mục chi nhiều nhất trả về top category", () => {
    const a = answerQuestion("Tôi chi nhiều nhất cho danh mục nào?", base);
    expect(a).toContain("Ăn uống");
  });

  it("hỏi số dư trả về tổng số dư", () => {
    const a = answerQuestion("Tôi còn bao nhiêu tiền?", base);
    expect(a.toLowerCase()).toContain("số dư");
  });

  it("hỏi lời khuyên trả về insight không tích cực", () => {
    const a = answerQuestion("Cho tôi vài lời khuyên", base);
    expect(a).toContain("Test");
  });

  it("câu hỏi không khớp từ khóa trả về tóm tắt mặc định", () => {
    const a = answerQuestion("xyz random", base);
    expect(a.length).toBeGreaterThan(0);
  });
});
