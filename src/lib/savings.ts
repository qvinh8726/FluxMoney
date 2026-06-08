import type { SavingsGoal } from "./types";

export interface SavingsProgress {
  /** Phần trăm hoàn thành, kẹp trong [0, 100]. */
  percent: number;
  /** Số tiền còn phải tiết kiệm thêm (không nhỏ hơn 0). */
  remaining: number;
  /** true nếu đã đạt hoặc vượt mục tiêu. */
  done: boolean;
}

/**
 * Tính tiến độ hoàn thành mục tiêu tiết kiệm.
 * An toàn khi target = 0: trả percent = 100, remaining = 0, done = true.
 */
export function savingsProgress(goal: SavingsGoal): SavingsProgress {
  const target = goal.targetAmount;
  const current = goal.currentAmount;

  if (target <= 0) {
    return { percent: 100, remaining: 0, done: true };
  }

  const rawPercent = (current / target) * 100;
  const percent = Math.min(100, Math.max(0, rawPercent));
  const remaining = Math.max(0, target - current);
  const done = current >= target;

  return { percent, remaining, done };
}
