import { describe, it, expect } from "vitest";
import {
  toDateKey,
  formatCompact,
  periodInterval,
  vnTodayKey,
  formatCurrency,
} from "./utils";

describe("toDateKey", () => {
  it("định dạng YYYY-MM-DD theo giờ địa phương, có pad 0", () => {
    expect(toDateKey(new Date(2024, 0, 5))).toBe("2024-01-05");
    expect(toDateKey(new Date(2024, 11, 31))).toBe("2024-12-31");
  });
});

describe("vnTodayKey", () => {
  it("trả về chuỗi dạng YYYY-MM-DD hợp lệ", () => {
    expect(vnTodayKey()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe("formatCompact", () => {
  it("rút gọn theo k / tr / T", () => {
    expect(formatCompact(500)).toBe("500");
    expect(formatCompact(12_000)).toBe("12k");
    expect(formatCompact(1_500_000)).toBe("1.5tr");
    expect(formatCompact(2_000_000_000)).toBe("2.0T");
  });
});

describe("periodInterval", () => {
  it("monthly bao trọn tháng của mốc tham chiếu", () => {
    const ref = new Date(2024, 5, 15); // 15/06/2024
    const { start, end } = periodInterval("monthly", ref);
    expect(toDateKey(start)).toBe("2024-06-01");
    expect(toDateKey(end)).toBe("2024-06-30");
  });

  it("yearly bao trọn năm", () => {
    const ref = new Date(2024, 5, 15);
    const { start, end } = periodInterval("yearly", ref);
    expect(toDateKey(start)).toBe("2024-01-01");
    expect(toDateKey(end)).toBe("2024-12-31");
  });
});

describe("formatCurrency", () => {
  it("VND không có phần lẻ", () => {
    const s = formatCurrency(1000, "VND");
    expect(s).not.toMatch(/[.,]\d{2}\D*$/);
  });
});
