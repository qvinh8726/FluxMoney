// Cấu hình Sentry phía server (Node runtime).
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://e7ea9d0211f512f8d0846dab84de175f@o4511525864538112.ingest.us.sentry.io/4511525867487232",
  tracesSampleRate: 0.1,
  enabled: process.env.NODE_ENV === "production",
});
