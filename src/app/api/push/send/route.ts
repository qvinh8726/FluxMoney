import { NextResponse } from "next/server";
import webpush from "web-push";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

/**
 * Gửi push notification tới subscription của người dùng hiện tại.
 * Chỉ dùng nội bộ / test — BẮT BUỘC phải đăng nhập (trả 401 nếu không).
 *
 * Body: { title: string; body: string }
 */
export async function POST(req: Request) {
  const supabase = await createClient();

  // ── Kiểm tra đăng nhập ────────────────────────────────────────────────────
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { ok: false, reason: "Bạn cần đăng nhập." },
      { status: 401 }
    );
  }

  // ── Kiểm tra VAPID env ────────────────────────────────────────────────────
  const vapidPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const vapidPrivate = process.env.VAPID_PRIVATE_KEY;

  if (!vapidPublic || !vapidPrivate) {
    return NextResponse.json(
      { ok: false, reason: "Máy chủ chưa cấu hình VAPID key." },
      { status: 500 }
    );
  }

  webpush.setVapidDetails(
    "mailto:support@fluxmoney.app",
    vapidPublic,
    vapidPrivate
  );

  // ── Parse body ─────────────────────────────────────────────────────────────
  let title = "FluxMoney";
  let body = "Bạn có thông báo mới.";
  try {
    const parsed = await req.json();
    if (parsed.title) title = String(parsed.title).slice(0, 200);
    if (parsed.body) body = String(parsed.body).slice(0, 500);
  } catch {
    // Dùng giá trị mặc định
  }

  // ── Lấy subscription của user ─────────────────────────────────────────────
  const { data: subs, error: fetchErr } = await supabase
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth")
    .eq("user_id", user.id);

  if (fetchErr) {
    console.error("push/send fetch error:", fetchErr);
    return NextResponse.json(
      { ok: false, reason: "Không lấy được subscription." },
      { status: 500 }
    );
  }

  if (!subs || subs.length === 0) {
    return NextResponse.json(
      { ok: false, reason: "Chưa có subscription nào được đăng ký." },
      { status: 404 }
    );
  }

  // ── Gửi tới tất cả subscription của user ──────────────────────────────────
  const payload = JSON.stringify({ title, body });
  const results = await Promise.allSettled(
    subs.map((sub) =>
      webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        payload
      )
    )
  );

  const sent = results.filter((r) => r.status === "fulfilled").length;
  const failed = results.filter((r) => r.status === "rejected").length;

  // ── Dọn subscription chết (410 Gone / 404) ────────────────────────────────
  const deadEndpoints: string[] = [];
  results.forEach((result, i) => {
    if (result.status !== "rejected") return;
    // web-push reject bằng WebPushError mang statusCode; narrow tường minh
    // thay vì để reason là any (vi phạm quy ước tránh any).
    const reason = result.reason as { statusCode?: number } | undefined;
    if (reason?.statusCode === 410 || reason?.statusCode === 404) {
      deadEndpoints.push(subs[i].endpoint);
    }
  });

  if (deadEndpoints.length > 0) {
    try {
      await supabase
        .from("push_subscriptions")
        .delete()
        .in("endpoint", deadEndpoints);
    } catch (cleanErr) {
      console.error("push/send cleanup error:", cleanErr);
    }
  }

  return NextResponse.json({ ok: true, sent, failed, cleaned: deadEndpoints.length });
}
