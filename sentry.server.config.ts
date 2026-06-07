// Cấu hình Sentry phía server (Node runtime).
import * as Sentry from "@sentry/nextjs";
import { sentryOptions } from "./sentry.shared";

Sentry.init(sentryOptions);
