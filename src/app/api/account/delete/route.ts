import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

export const runtime = "nodejs";

/**
 * Xóa vĩnh viễn tài khoản người dùng và toàn bộ dữ liệu (GDPR / quyền được xóa).
 *
 * Luồng:
 * 1. Xác thực phiên hiện tại bằng anon client (chỉ chủ tài khoản gọi được).
 * 2. Dùng service-role client xóa bản ghi auth.users của CHÍNH user đó.
 *    Mọi bảng đều có FK on delete cascade từ auth.users nên dữ liệu tự sạch.
 *
 * Service-role key chỉ tồn tại ở server, không bao giờ lộ ra client.
 */
export async function POST() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Gọi từ ngữ cảnh không set được cookie — bỏ qua.
          }
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { ok: false, reason: "Bạn cần đăng nhập." },
      { status: 401 }
    );
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    return NextResponse.json(
      { ok: false, reason: "Máy chủ chưa cấu hình xóa tài khoản. Vui lòng liên hệ hỗ trợ." },
      { status: 500 }
    );
  }

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceKey,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) {
    return NextResponse.json(
      { ok: false, reason: "Không xóa được tài khoản. Vui lòng thử lại." },
      { status: 500 }
    );
  }

  // Hủy phiên hiện tại để cookie không còn trỏ tới user đã xóa.
  await supabase.auth.signOut();

  return NextResponse.json({ ok: true });
}
