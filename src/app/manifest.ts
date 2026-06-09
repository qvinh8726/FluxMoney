import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "FluxMoney — Quản lý dòng tiền",
    short_name: "FluxMoney",
    description:
      "Ứng dụng quản lý dòng tiền cá nhân với giao diện lịch trực quan — theo dõi thu chi, ví, ngân sách và báo cáo.",
    start_url: "/",
    display: "standalone",
    background_color: "#f0f4ff",
    theme_color: "#2563eb",
    icons: [
      {
        src: "/icon.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
