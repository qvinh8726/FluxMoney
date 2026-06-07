"use client";

import * as React from "react";

/**
 * Trả về true sau khi component đã mount ở client.
 * Dùng để tránh lệch hydration khi store đọc dữ liệu từ localStorage.
 */
export function useHydrated(): boolean {
  const [hydrated, setHydrated] = React.useState(false);
  React.useEffect(() => setHydrated(true), []);
  return hydrated;
}
