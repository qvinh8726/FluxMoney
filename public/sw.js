// Service Worker cho FluxMoney PWA
// Cache shell cơ bản + xử lý push notification

const CACHE_NAME = "fluxmoney-v1";
const SHELL_URLS = ["/", "/icon.png"];

// ---- Install: pre-cache shell ----
// Dùng allSettled + cache.add từng URL: một asset thiếu (404) KHÔNG làm
// hỏng toàn bộ install như addAll (atomic) sẽ gây.
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) =>
        Promise.allSettled(SHELL_URLS.map((url) => cache.add(url)))
      )
      .then(() => self.skipWaiting())
  );
});

// ---- Activate: xóa cache cũ ----
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k !== CACHE_NAME)
            .map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

// ---- Fetch: network-first, fallback cache ----
self.addEventListener("fetch", (event) => {
  // Chỉ xử lý GET, bỏ qua supabase/api để tránh cache dữ liệu nhạy cảm
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (
    url.pathname.startsWith("/api/") ||
    url.hostname.includes("supabase.co") ||
    url.pathname.startsWith("/login")
  ) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((res) => {
        // Cache lại nếu thành công
        if (res && res.status === 200) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return res;
      })
      .catch(() => caches.match(event.request))
  );
});

// ---- Push: hiện notification ----
self.addEventListener("push", (event) => {
  let data = { title: "FluxMoney", body: "Bạn có thông báo mới." };
  try {
    data = event.data ? event.data.json() : data;
  } catch {
    // payload không phải JSON — dùng mặc định
  }

  const title = data.title ?? "FluxMoney";
  const options = {
    body: data.body ?? "Bạn có thông báo mới.",
    icon: "/icon.png",
    badge: "/icon.png",
    data: { url: data.url ?? "/" },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// ---- Notification click: mở/focus app ----
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url ?? "/";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url === targetUrl && "focus" in client) {
            return client.focus();
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl);
        }
      })
  );
});
