import { describe, it, expect } from "vitest";
import { suggestCategories } from "./category-suggest";
import type { Transaction, Category } from "./types";

// ── Helpers tạo fixture ─────────────────────────────────────────────────────

function cat(id: string, type: "income" | "expense" = "expense"): Category {
  return { id, name: id, type, icon: "circle", color: "#000" };
}

let _seq = 0;
function tx(
  overrides: Partial<Transaction> & { type: "income" | "expense"; categoryId: string | null }
): Transaction {
  _seq++;
  return {
    id: `tx-${_seq}`,
    amount: 100_000,
    date: "2026-01-01",
    accountId: "acc1",
    createdAt: "2026-01-01T00:00:00Z",
    note: undefined,
    ...overrides,
  };
}

// Danh mục mẫu
const CATS = [
  cat("food", "expense"),
  cat("transport", "expense"),
  cat("salary", "income"),
  cat("freelance", "income"),
];

// ── Test cases ──────────────────────────────────────────────────────────────

describe("suggestCategories", () => {
  it("lịch sử rỗng → trả về []", () => {
    const result = suggestCategories(
      { type: "expense", note: "cơm trưa" },
      [],
      CATS
    );
    expect(result).toEqual([]);
  });

  it("lịch sử không có giao dịch cùng type → trả về []", () => {
    const history = [
      tx({ type: "income", categoryId: "salary", note: "lương tháng 1" }),
    ];
    const result = suggestCategories({ type: "expense" }, history, CATS);
    expect(result).toEqual([]);
  });

  it("khớp note → category đó nên xếp đầu với score cao", () => {
    const history = [
      tx({ type: "expense", categoryId: "food", note: "cơm trưa" }),
      tx({ type: "expense", categoryId: "transport", note: "xăng xe" }),
    ];
    const result = suggestCategories(
      { type: "expense", note: "cơm trưa văn phòng" },
      history,
      CATS
    );
    expect(result[0].categoryId).toBe("food");
    expect(result[0].score).toBe(1); // điểm max chuẩn hoá = 1
  });

  it("không có note đầu vào → fallback theo tần suất", () => {
    const history = [
      tx({ type: "expense", categoryId: "food" }),
      tx({ type: "expense", categoryId: "food" }),
      tx({ type: "expense", categoryId: "transport" }),
    ];
    const result = suggestCategories({ type: "expense" }, history, CATS);
    expect(result[0].categoryId).toBe("food");
  });

  it("nhiều giao dịch cùng note → category phổ biến xếp trên", () => {
    const history = [
      tx({ type: "expense", categoryId: "food", note: "cơm" }),
      tx({ type: "expense", categoryId: "food", note: "cơm" }),
      tx({ type: "expense", categoryId: "food", note: "cơm" }),
      tx({ type: "expense", categoryId: "transport", note: "cơm tấm" }),
    ];
    const result = suggestCategories(
      { type: "expense", note: "cơm" },
      history,
      CATS
    );
    expect(result[0].categoryId).toBe("food");
  });

  it("không gợi category sai type (expense input không ra income category)", () => {
    const history = [
      tx({ type: "income", categoryId: "salary", note: "lương" }),
      tx({ type: "expense", categoryId: "food", note: "ăn uống" }),
    ];
    const result = suggestCategories(
      { type: "expense", note: "lương" },
      history,
      CATS
    );
    const ids = result.map((r) => r.categoryId);
    expect(ids).not.toContain("salary");
  });

  it("top 3 giới hạn số kết quả", () => {
    // Tạo nhiều hơn 3 category expense
    const moreCats: Category[] = [
      cat("food", "expense"),
      cat("transport", "expense"),
      cat("entertainment", "expense"),
      cat("health", "expense"),
      cat("shopping", "expense"),
    ];
    const history = moreCats.map((c) =>
      tx({ type: "expense", categoryId: c.id, note: c.id })
    );
    const result = suggestCategories(
      { type: "expense", note: "random" },
      history,
      moreCats,
      3
    );
    expect(result.length).toBeLessThanOrEqual(3);
  });

  it("score trong khoảng [0, 1]", () => {
    const history = [
      tx({ type: "expense", categoryId: "food", note: "cơm" }),
      tx({ type: "expense", categoryId: "transport", note: "xăng" }),
    ];
    const result = suggestCategories(
      { type: "expense", note: "cơm sáng" },
      history,
      CATS
    );
    for (const r of result) {
      expect(r.score).toBeGreaterThanOrEqual(0);
      expect(r.score).toBeLessThanOrEqual(1);
    }
  });

  it("category không tồn tại trong danh mục → không xuất hiện trong gợi ý", () => {
    const history = [
      // categoryId "ghost" không có trong CATS
      tx({ type: "expense", categoryId: "ghost", note: "cơm" }),
      tx({ type: "expense", categoryId: "food", note: "cơm" }),
    ];
    const result = suggestCategories(
      { type: "expense", note: "cơm" },
      history,
      CATS
    );
    const ids = result.map((r) => r.categoryId);
    expect(ids).not.toContain("ghost");
  });

  it("note có dấu tiếng Việt vẫn khớp đúng", () => {
    const history = [
      tx({ type: "expense", categoryId: "food", note: "Cơm trưa" }),
    ];
    // "com trua" không dấu vẫn phải khớp "Cơm trưa"
    const result = suggestCategories(
      { type: "expense", note: "com trua" },
      history,
      CATS
    );
    expect(result[0].categoryId).toBe("food");
  });
});
