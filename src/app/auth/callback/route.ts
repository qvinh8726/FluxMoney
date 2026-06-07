import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** Đổi mã OAuth lấy phiên đăng nhập rồi chuyển về trang chủ. */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Lỗi: quay lại trang đăng nhập.
  return NextResponse.redirect(`${origin}/login?error=auth`);
}
