import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

/**
 * Lưu push subscription của người dùng vào bảng push_subscriptions.
 * Yêu cầu đăng nhập — trả 401 nếu chưa có phiên.
 */
export async function POST(req: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { ok: false, reason: "Bạn cần đăng nhập." },
      { status: 401 }
    );
  }

  let body: { endpoint: string; keys: { p256dh: string; auth: string } };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, reason: "Dữ liệu không hợp lệ." },
      { status: 400 }
    );
  }

  const { endpoint, keys } = body;
  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return NextResponse.json(
      { ok: false, reason: "Thiếu thông tin subscription." },
      { status: 400 }
    );
  }

  // Validate format endpoint và giới hạn độ dài
  if (!endpoint.startsWith("https://")) {
    return NextResponse.json(
      { ok: false, reason: "Endpoint không hợp lệ." },
      { status: 400 }
    );
  }
  if (
    endpoint.length > 1000 ||
    keys.p256dh.length > 500 ||
    keys.auth.length > 500
  ) {
    return NextResponse.json(
      { ok: false, reason: "Dữ liệu không hợp lệ." },
      { status: 400 }
    );
  }

  // Upsert để tránh trùng endpoint (người dùng có thể đăng ký lại)
  const { error } = await supabase
    .from("push_subscriptions")
    .upsert(
      {
        user_id: user.id,
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
      },
      { onConflict: "endpoint" }
    );

  if (error) {
    console.error("push/subscribe error:", error);
    return NextResponse.json(
      { ok: false, reason: "Không lưu được subscription. Vui lòng thử lại." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
