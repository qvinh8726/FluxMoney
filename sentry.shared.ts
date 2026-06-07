// Cấu hình Sentry dùng chung cho cả 3 runtime (client/server/edge).
// Gom về một nguồn để đổi DSN / sample rate chỉ sửa một chỗ.
export const sentryOptions = {
  dsn: "https://e7ea9d0211f512f8d0846dab84de175f@o4511525864538112.ingest.us.sentry.io/4511525867487232",
  // Lấy mẫu 10% giao dịch để theo dõi hiệu năng — đủ tín hiệu, không tốn quota.
  tracesSampleRate: 0.1,
  // Chỉ gửi lỗi ở production, tránh nhiễu khi dev.
  enabled: process.env.NODE_ENV === "production",
};
