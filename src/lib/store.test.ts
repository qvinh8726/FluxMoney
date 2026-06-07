import { describe, it, expect } from "vitest";
import { accountBalance, sumByType } from "./store";
import type { Account, Transaction, Transfer } from "./types";

const acc = (id: string, initial = 0): Account => ({
  id,
  name: id,
  kind: "cash",
  initialBalance: initial,
  currency: "VND",
  color: "#000",
  createdAt: "2024-01-01",
});

const tx = (
  accountId: string,
  type: "income" | "expense",
  amount: number
): Transaction => ({
  id: Math.random().toString(),
  type,
  amount,
  date: "2024-06-01",
  accountId,
  categoryId: null,
  createdAt: "2024-06-01",
});

describe("accountBalance", () => {
  it("cộng thu, trừ chi trên số dư ban đầu", () => {
    const a = acc("a", 100);
    const txs = [tx("a", "income", 50), tx("a", "expense", 30)];
    expect(accountBalance(a, txs)).toBe(120);
  });

  it("chỉ tính giao dịch của đúng tài khoản", () => {
    const a = acc("a", 0);
    const txs = [tx("a", "income", 50), tx("b", "income", 999)];
    expect(accountBalance(a, txs)).toBe(50);
  });

  it("chuyển khoản đi làm giảm, đến làm tăng số dư", () => {
    const a = acc("a", 100);
    const transfers: Transfer[] = [
      {
        id: "t1",
        fromAccountId: "a",
        toAccountId: "b",
        amount: 40,
        date: "2024-06-02",
        createdAt: "2024-06-02",
      },
      {
        id: "t2",
        fromAccountId: "b",
        toAccountId: "a",
        amount: 10,
        date: "2024-06-03",
        createdAt: "2024-06-03",
      },
    ];
    expect(accountBalance(a, [], transfers)).toBe(70);
  });
});

describe("sumByType", () => {
  it("cộng đúng theo loại", () => {
    const txs = [
      tx("a", "income", 50),
      tx("a", "income", 20),
      tx("a", "expense", 30),
    ];
    expect(sumByType(txs, "income")).toBe(70);
    expect(sumByType(txs, "expense")).toBe(30);
  });
});
