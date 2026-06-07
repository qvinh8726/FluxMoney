import type { Analysis } from "./insights";
import { formatCurrency } from "./utils";

/**
 * Trợ lý hỏi-đáp cục bộ (dựa trên luật) trả lời câu hỏi về dữ liệu tài chính.
 * Dùng khi không có AI thật; vẫn cho câu trả lời chính xác từ số liệu đã tính.
 */
export function answerQuestion(
  question: string,
  a: Analysis,
  currency: string = "VND"
): string {
  const fmt = (n: number) => formatCurrency(n, currency);
  const q = question.toLowerCase();

  const has = (...kw: string[]) => kw.some((k) => q.includes(k));

  if (has("tiết kiệm", "để dành", "dư ra")) {
    return `Tháng này bạn để dành ${fmt(a.net)} (tỷ lệ tiết kiệm ${(
      a.savingsRate * 100
    ).toFixed(0)}%). ${
      a.savingsRate >= 0.2
        ? "Đây là mức tốt."
        : "Mục tiêu lý tưởng thường là từ 20% trở lên."
    }`;
  }

  if (has("danh mục", "nhiều nhất", "tốn nhất", "chi nhiều")) {
    if (!a.topCategories.length) return "Tháng này chưa có khoản chi nào.";
    const top = a.topCategories[0];
    return `Bạn chi nhiều nhất cho "${top.name}": ${fmt(top.amount)} (${top.pct.toFixed(
      0
    )}% tổng chi). Top kế tiếp: ${a.topCategories
      .slice(1, 3)
      .map((c) => `${c.name} (${fmt(c.amount)})`)
      .join(", ")}.`;
  }

  if (has("còn bao nhiêu", "số dư", "tổng tiền", "còn lại")) {
    return `Tổng số dư hiện tại của bạn là ${fmt(a.totalBalance)}.${
      a.runwayMonths !== null
        ? ` Đủ chi tiêu khoảng ${a.runwayMonths.toFixed(1)} tháng theo nhịp gần đây.`
        : ""
    }`;
  }

  if (has("chi bao nhiêu", "đã chi", "tổng chi", "tiêu bao nhiêu")) {
    return `Tháng này bạn đã chi ${fmt(a.monthExpense)}.${
      a.expenseChangePct !== null
        ? a.expenseChangePct >= 0
          ? ` Cao hơn tháng trước ${a.expenseChangePct.toFixed(0)}%.`
          : ` Thấp hơn tháng trước ${Math.abs(a.expenseChangePct).toFixed(0)}%.`
        : ""
    }`;
  }

  if (has("thu nhập", "kiếm được", "thu bao nhiêu")) {
    return `Tổng thu tháng này là ${fmt(a.monthIncome)}.`;
  }

  if (has("dự báo", "dự đoán", "cuối tháng", "hết tháng")) {
    return `Với nhịp chi hiện tại, ước tính cả tháng bạn sẽ chi khoảng ${fmt(
      a.projectedExpense
    )} (trung bình ${fmt(a.dailyAvg)}/ngày).`;
  }

  if (has("quỹ", "dự phòng", "khẩn cấp", "cầm cự")) {
    return a.runwayMonths !== null
      ? `Số dư hiện tại đủ trang trải khoảng ${a.runwayMonths.toFixed(
          1
        )} tháng chi tiêu. Khuyến nghị duy trì quỹ khẩn cấp 3–6 tháng.`
      : "Chưa đủ dữ liệu chi tiêu để ước tính quỹ dự phòng.";
  }

  if (has("lời khuyên", "gợi ý", "nên làm gì", "cải thiện", "tư vấn")) {
    const tips = a.insights
      .filter((i) => i.tone !== "positive")
      .slice(0, 3)
      .map((i) => `• ${i.title}: ${i.detail}`);
    return tips.length
      ? `Một vài gợi ý cho bạn:\n${tips.join("\n")}`
      : "Tình hình tài chính của bạn đang khá ổn. Cứ tiếp tục duy trì thói quen hiện tại!";
  }

  // Mặc định: tóm tắt nhanh.
  return `Tháng này: thu ${fmt(a.monthIncome)}, chi ${fmt(
    a.monthExpense
  )}, còn dư ${fmt(a.net)}. Bạn có thể hỏi về: tiết kiệm, danh mục chi nhiều nhất, số dư, dự báo cuối tháng, hoặc xin lời khuyên.`;
}

export const SUGGESTED_QUESTIONS = [
  "Tháng này tôi tiết kiệm được bao nhiêu?",
  "Tôi chi nhiều nhất cho danh mục nào?",
  "Tôi còn bao nhiêu tiền?",
  "Dự báo chi tiêu cuối tháng?",
  "Cho tôi vài lời khuyên tài chính",
];
