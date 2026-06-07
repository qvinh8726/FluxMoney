// Cấu hình Sentry cho Edge runtime (middleware, edge routes).
import * as Sentry from "@sentry/nextjs";
import { sentryOptions } from "./sentry.shared";

Sentry.init(sentryOptions);
