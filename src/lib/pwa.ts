/**
 * Helper đăng ký Service Worker và push subscription cho FluxMoney PWA.
 * Chỉ chạy phía client, guard đầy đủ trước khi gọi browser API.
 */

/** Chuyển base64url string thành Uint8Array<ArrayBuffer> (dùng cho applicationServerKey). */
export function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  const rawData = window.atob(base64);
  const buffer = new ArrayBuffer(rawData.length);
  const outputArray = new Uint8Array(buffer);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/** Đăng ký service worker. Gọi sớm, bất đồng bộ, không throw. */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === "undefined") return null;
  if (!("serviceWorker" in navigator)) return null;
  try {
    const reg = await navigator.serviceWorker.register("/sw.js", {
      scope: "/",
    });
    return reg;
  } catch (err) {
    console.error("[PWA] Đăng ký service worker thất bại:", err);
    return null;
  }
}

/** Xin quyền thông báo, đăng ký push subscription và POST lên server. */
export async function subscribeToPush(): Promise<
  { ok: true } | { ok: false; reason: string }
> {
  if (typeof window === "undefined") {
    return { ok: false, reason: "Không phải môi trường trình duyệt." };
  }
  if (!("Notification" in window)) {
    return { ok: false, reason: "Trình duyệt không hỗ trợ thông báo." };
  }
  if (!("serviceWorker" in navigator)) {
    return { ok: false, reason: "Trình duyệt không hỗ trợ service worker." };
  }
  if (!("PushManager" in window)) {
    return { ok: false, reason: "Trình duyệt không hỗ trợ push notification." };
  }

  // Xin quyền
  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    return { ok: false, reason: "Bạn đã từ chối quyền nhận thông báo." };
  }

  const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!vapidKey) {
    return {
      ok: false,
      reason: "Chưa cấu hình VAPID key. Liên hệ quản trị viên.",
    };
  }

  try {
    const reg = await navigator.serviceWorker.ready;
    const subscription = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey),
    });

    const res = await fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(subscription.toJSON()),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return {
        ok: false,
        reason: data.reason ?? "Không lưu được subscription. Vui lòng thử lại.",
      };
    }

    return { ok: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, reason: `Lỗi đăng ký push: ${msg}` };
  }
}
