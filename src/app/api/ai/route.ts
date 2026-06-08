import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

// Giới hạn lượt phân tích sâu mỗi user mỗi ngày (tránh đốt credit khi public).
const DAILY_LIMIT = Number(process.env.AI_DAILY_LIMIT || 20);

/**
 * Phân tích sâu bằng AI thật (tùy chọn).
 * - Yêu cầu đăng nhập: chặn người lạ gọi tốn credit.
 * - Rate-limit theo user/ngày qua RPC bump_ai_usage (atomic, RLS-safe).
 * - Nếu có OPENAI_API_KEY, gọi OpenAI để sinh nhận định; nếu không, trả
 *   available=false để client tự dùng engine cục bộ.
 *
 * Lưu ý bảo mật: API key chỉ tồn tại ở server, không bao giờ lộ ra client.
 */
export async function POST(req: Request) {
  // 1) Bắt buộc đăng nhập.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { available: false, reason: "Bạn cần đăng nhập để dùng phân tích AI." },
      { status: 401 }
    );
  }

  // 2) Đọc & giới hạn kích thước đầu vào.
  let summary = "";
  let question = "";
  try {
    const body = await req.json();
    summary = String(body.summary ?? "").slice(0, 4000);
    question = String(body.question ?? "").slice(0, 500);
  } catch {
    return NextResponse.json(
      { available: false, reason: "Yêu cầu không hợp lệ." },
      { status: 400 }
    );
  }

  // 3) Phải có cấu hình AI thì mới tính lượt — tránh trừ quota oan.
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({
      available: false,
      reason:
        "Chưa cấu hình OPENAI_API_KEY. Đang dùng phân tích cục bộ. Thêm key vào .env.local để bật phân tích AI thật.",
    });
  }

  // 4) Rate-limit theo user/ngày (atomic phía DB).
  const { data: usage, error: usageErr } = await supabase.rpc("bump_ai_usage", {
    p_limit: DAILY_LIMIT,
  });
  if (usageErr) {
    return NextResponse.json(
      { available: false, reason: "Không kiểm tra được hạn mức sử dụng." },
      { status: 500 }
    );
  }
  if (!usage?.allowed) {
    return NextResponse.json(
      {
        available: false,
        reason: `Bạn đã dùng hết ${DAILY_LIMIT} lượt phân tích AI hôm nay. Vui lòng quay lại vào ngày mai.`,
      },
      { status: 429 }
    );
  }

  const system =
    "Bạn là cố vấn tài chính cá nhân thân thiện, trả lời ngắn gọn bằng tiếng Việt. " +
    "Dựa trên số liệu được cung cấp, đưa ra nhận định và 2-3 lời khuyên thực tế, cụ thể. " +
    "Không bịa số liệu ngoài dữ liệu đã cho.";

  const userPrompt = question
    ? `Dữ liệu:\n${summary}\n\nCâu hỏi của người dùng: ${question}`
    : `Dữ liệu:\n${summary}\n\nHãy phân tích tình hình tài chính và đưa lời khuyên.`;

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        messages: [
          { role: "system", content: system },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.4,
        max_tokens: 500,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("AI provider error:", res.status, text);
      return NextResponse.json(
        { available: false, reason: `Lỗi từ nhà cung cấp AI (${res.status}).` },
        { status: 502 }
      );
    }

    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content ?? "";
    return NextResponse.json({ available: true, content, used: usage.used, limit: DAILY_LIMIT });
  } catch {
    return NextResponse.json(
      { available: false, reason: "Không kết nối được tới dịch vụ AI." },
      { status: 502 }
    );
  }
}
