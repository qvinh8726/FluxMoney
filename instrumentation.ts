// Next.js gọi register() một lần khi khởi động server, nạp đúng cấu hình
// Sentry theo runtime. onRequestError bắt lỗi từ Server Components / route.
import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

export const onRequestError = Sentry.captureRequestError;
