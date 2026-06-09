// Service Worker cho FluxMoney PWA
// Cache shell cơ bản + xử lý push notification

const CACHE_NAME = "fluxmoney-v1";
// Chỉ pre-cache tài nguyên tĩnh, KHÔNG cache "/" (HTML điều hướng chứa dữ liệu).
const SHELL_URLS = ["/icon.png"];

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

// ---- Fetch: chỉ cache static shell assets ----
// KHÔNG cache HTML điều hướng (trang /accounts, /transactions… chứa dữ liệu
// tài chính cá nhân): trên máy chung hoặc sau khi đăng xuất, cache có thể
// re-serve dữ liệu của user này cho người khác. Chỉ cache tài nguyên tĩnh
// cùng origin (build assets, icon) để PWA chạy offline mà không lộ dữ liệu.
function isStaticAsset(url) {
  if (url.origin !== self.location.origin) return false;
  return (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname === "/icon.png" ||
    url.pathname === "/logo.png" ||
    url.pathname === "/manifest.webmanifest"
  );
}

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);

  // Chỉ áp dụng cache cho tài nguyên tĩnh; mọi thứ khác đi thẳng ra mạng.
  if (!isStaticAsset(url)) return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((res) => {
        if (res && res.status === 200) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return res;
      });
    })
  );
});

// Chỉ chấp nhận đường dẫn nội bộ same-origin để chống open-redirect/phishing
// (payload push có thể bị giả mạo URL tuyệt đối ra ngoài). Trả về path an toàn.
function safeInternalPath(raw) {
  if (typeof raw !== "string" || !raw.startsWith("/") || raw.startsWith("//")) {
    return "/";
  }
  return raw;
}

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
    data: { url: safeInternalPath(data.url) },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// ---- Notification click: mở/focus app ----
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = safeInternalPath(event.notification.data?.url);
  // client.url là URL tuyệt đối; quy targetUrl về tuyệt đối để so khớp đúng.
  const targetHref = new URL(targetUrl, self.location.origin).href;

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url === targetHref && "focus" in client) {
            return client.focus();
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl);
        }
      })
  );
});
