import { describe, it, expect } from "vitest";
import { computeStreak } from "./streak";
import type { Transaction } from "./types";

// Tạo giao dịch tối giản — chỉ cần field `date` cho streak.
function tx(date: string): Transaction {
  return {
    id: date + Math.random(),
    type: "expense",
    amount: 1,
    date,
    accountId: "a",
    categoryId: null,
    createdAt: `${date}T00:00:00Z`,
  };
}

const TODAY = "2026-06-08";

describe("computeStreak", () => {
  it("rỗng → 0/0/null", () => {
    expect(computeStreak([], TODAY)).toEqual({
      current: 0,
      longest: 0,
      lastActiveDate: null,
    });
  });

  it("chỉ hôm nay → current=1, longest=1", () => {
    const r = computeStreak([tx(TODAY)], TODAY);
    expect(r.current).toBe(1);
    expect(r.longest).toBe(1);
    expect(r.lastActiveDate).toBe(TODAY);
  });

  it("chuỗi 5 ngày liên tục tới hôm nay → current=5", () => {
    const days = ["2026-06-04", "2026-06-05", "2026-06-06", "2026-06-07", "2026-06-08"];
    const r = computeStreak(days.map(tx), TODAY);
    expect(r.current).toBe(5);
    expect(r.longest).toBe(5);
  });

  it("hôm nay trống nhưng hôm qua + trước có → chưa đứt", () => {
    const days = ["2026-06-06", "2026-06-07"]; // hôm qua = 07
    const r = computeStreak(days.map(tx), TODAY);
    expect(r.current).toBe(2);
  });

  it("đứt quãng giữa → longest là đoạn dài nhất, current nhỏ hơn", () => {
    const days = [
      "2026-06-01", "2026-06-02", "2026-06-03", // chuỗi 3
      "2026-06-07", "2026-06-08", // chuỗi 2 tới hôm nay
    ];
    const r = computeStreak(days.map(tx), TODAY);
    expect(r.longest).toBe(3);
    expect(r.current).toBe(2);
  });

  it("hôm nay & hôm qua đều trống → current=0 dù quá khứ có chuỗi dài", () => {
    const days = ["2026-06-01", "2026-06-02", "2026-06-03", "2026-06-04"];
    const r = computeStreak(days.map(tx), TODAY);
    expect(r.current).toBe(0);
    expect(r.longest).toBe(4);
    expect(r.lastActiveDate).toBe("2026-06-04");
  });

  it("nhiều giao dịch cùng ngày → đếm là 1 ngày", () => {
    const r = computeStreak([tx(TODAY), tx(TODAY), tx(TODAY)], TODAY);
    expect(r.current).toBe(1);
    expect(r.longest).toBe(1);
  });

  it("dữ liệu không sort sẵn vẫn đúng", () => {
    const days = ["2026-06-08", "2026-06-06", "2026-06-07"];
    const r = computeStreak(days.map(tx), TODAY);
    expect(r.current).toBe(3);
    expect(r.longest).toBe(3);
  });
});
