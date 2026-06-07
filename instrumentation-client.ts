// Cấu hình Sentry phía trình duyệt (client). Next 15 nạp file này tự động.
import * as Sentry from "@sentry/nextjs";
import { sentryOptions } from "./sentry.shared";

Sentry.init(sentryOptions);
