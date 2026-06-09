import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Áp dụng cho mọi đường dẫn TRỪ:
     * - _next/static, _next/image (tài nguyên tĩnh)
     * - favicon, file ảnh
     * - /api (route API tự xử lý phiên riêng)
     * - manifest.webmanifest, sw.js (asset PWA phải truy cập được khi chưa đăng nhập)
     * - .well-known (assetlinks.json cho TWA — phải truy cập công khai)
     */
    "/((?!_next/static|_next/image|favicon.ico|api|manifest.webmanifest|sw.js|\\.well-known|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
