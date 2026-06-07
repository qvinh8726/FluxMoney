// Cấu hình Sentry phía trình duyệt (client). Next 15 nạp file này tự động.
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://e7ea9d0211f512f8d0846dab84de175f@o4511525864538112.ingest.us.sentry.io/4511525867487232",
  // Lấy mẫu 10% giao dịch để theo dõi hiệu năng — đủ tín hiệu, không tốn quota.
  tracesSampleRate: 0.1,
  // Chỉ gửi lỗi ở production, tránh nhiễu khi dev.
  enabled: process.env.NODE_ENV === "production",
});
