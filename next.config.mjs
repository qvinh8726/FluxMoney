/** @type {import('next').NextConfig} */

// Header bảo mật áp cho mọi response. Không gồm CSP đầy đủ ở đây:
// CSP đúng chuẩn cho Next cần nonce theo từng request (qua middleware),
// làm sơ sài sẽ chặn nhầm script nội bộ của Next. Để CSP làm bước riêng.
const securityHeaders = [
  // Chặn nhúng vào iframe của site khác (chống clickjacking).
  { key: "X-Frame-Options", value: "DENY" },
  // Cấm trình duyệt "đoán" MIME type.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Hạn chế rò rỉ URL qua Referer khi điều hướng ra ngoài.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Tắt các quyền nhạy cảm app không dùng.
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
  // Ép HTTPS trong 2 năm (chỉ có tác dụng khi phục vụ qua HTTPS).
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
