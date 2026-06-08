"use client";

import { useEffect } from "react";
import { registerServiceWorker } from "@/lib/pwa";

/**
 * Component nhỏ chỉ có nhiệm vụ đăng ký service worker khi app load.
 * Render trong RootLayout — không render bất kỳ UI nào.
 */
export function PwaRegister() {
  useEffect(() => {
    registerServiceWorker();
  }, []);

  return null;
}
