import { describe, it, expect } from "vitest";
import {
  toDateKey,
  formatCompact,
  periodInterval,
  vnTodayKey,
  formatCurrency,
  formatMoneyInput,
  parseMoneyInput,
  moneyToInput,
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
  it("rút gọn theo k / tr / tỷ", () => {
    expect(formatCompact(500)).toBe("500");
    expect(formatCompact(12_000)).toBe("12k");
    expect(formatCompact(1_500_000)).toBe("1.5tr");
    expect(formatCompact(2_000_000_000)).toBe("2.0tỷ");
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

describe("formatMoneyInput", () => {
  it("chèn dấu chấm ngăn cách nghìn", () => {
    expect(formatMoneyInput("1000")).toBe("1.000");
    expect(formatMoneyInput("1234567")).toBe("1.234.567");
  });
  it("bỏ ký tự không phải số", () => {
    expect(formatMoneyInput("1a2b3c")).toBe("123");
  });
  it("giữ phần thập phân sau dấu phẩy, tối đa 2 chữ số", () => {
    expect(formatMoneyInput("1000,5")).toBe("1.000,5");
    expect(formatMoneyInput("1000,567")).toBe("1.000,56");
  });
  it("chỉ giữ một dấu phẩy thập phân", () => {
    expect(formatMoneyInput("1,2,3")).toBe("1,23");
  });
  it("giữ dấu trừ ở đầu cho số âm", () => {
    expect(formatMoneyInput("-5000")).toBe("-5.000");
  });
  it("chuỗi rỗng trả về rỗng", () => {
    expect(formatMoneyInput("")).toBe("");
  });
});

describe("parseMoneyInput", () => {
  it("đổi chuỗi đã format về số", () => {
    expect(parseMoneyInput("1.234.567")).toBe(1234567);
    expect(parseMoneyInput("1.000,5")).toBe(1000.5);
  });
  it("xử lý số âm", () => {
    expect(parseMoneyInput("-5.000")).toBe(-5000);
  });
  it("chuỗi rỗng trả về NaN", () => {
    expect(parseMoneyInput("")).toBeNaN();
  });
});

describe("moneyToInput round-trip", () => {
  it("format rồi parse trả lại giá trị gốc", () => {
    for (const n of [0, 1000, 1234567, 1000.5, -5000, 999999999.99]) {
      expect(parseMoneyInput(moneyToInput(n))).toBe(n);
    }
  });
});
