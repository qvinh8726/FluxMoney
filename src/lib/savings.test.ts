import { describe, it, expect } from "vitest";
import { savingsProgress } from "./savings";
import type { SavingsGoal } from "./types";

function makeGoal(targetAmount: number, currentAmount: number): SavingsGoal {
  return {
    id: "test",
    name: "Test Goal",
    targetAmount,
    currentAmount,
    createdAt: "2024-01-01T00:00:00Z",
  };
}

describe("savingsProgress", () => {
  it("chưa tiết kiệm gì (0%)", () => {
    const result = savingsProgress(makeGoal(30_000_000, 0));
    expect(result.percent).toBe(0);
    expect(result.remaining).toBe(30_000_000);
    expect(result.done).toBe(false);
  });

  it("tiết kiệm một nửa (50%)", () => {
    const result = savingsProgress(makeGoal(10_000_000, 5_000_000));
    expect(result.percent).toBe(50);
    expect(result.remaining).toBe(5_000_000);
    expect(result.done).toBe(false);
  });

  it("đạt đúng mục tiêu (100%, done=true)", () => {
    const result = savingsProgress(makeGoal(10_000_000, 10_000_000));
    expect(result.percent).toBe(100);
    expect(result.remaining).toBe(0);
    expect(result.done).toBe(true);
  });

  it("vượt mục tiêu — kẹp 100%, remaining=0", () => {
    const result = savingsProgress(makeGoal(10_000_000, 15_000_000));
    expect(result.percent).toBe(100);
    expect(result.remaining).toBe(0);
    expect(result.done).toBe(true);
  });

  it("target=0 không crash — trả percent=100, done=true", () => {
    const result = savingsProgress(makeGoal(0, 0));
    expect(result.percent).toBe(100);
    expect(result.remaining).toBe(0);
    expect(result.done).toBe(true);
  });
});
