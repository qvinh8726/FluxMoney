"use client";

import { create } from "zustand";

export type ToastType = "error" | "success" | "info";

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface Toast {
  id: number;
  type: ToastType;
  message: string;
  action?: ToastAction;
  /** Thời gian tự ẩn (ms). Mặc định 4000. */
  duration?: number;
}

interface ToastState {
  toasts: Toast[];
  push: (t: Omit<Toast, "id">) => void;
  dismiss: (id: number) => void;
}

let counter = 0;

export const useToast = create<ToastState>((set) => ({
  toasts: [],
  push: (t) => {
    const id = ++counter;
    set((s) => ({ toasts: [...s.toasts, { ...t, id }] }));
    // Tự ẩn sau `duration` (mặc định 4 giây).
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) }));
    }, t.duration ?? 4000);
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) })),
}));

/** Gọi nhanh ngoài React (vd trong store). */
export const toast = {
  error: (message: string) => useToast.getState().push({ type: "error", message }),
  success: (message: string) => useToast.getState().push({ type: "success", message }),
  info: (message: string) => useToast.getState().push({ type: "info", message }),
  /** Toast kèm nút hành động (vd Hoàn tác). Hiển thị lâu hơn mặc định. */
  withAction: (
    message: string,
    action: ToastAction,
    opts?: { type?: ToastType; duration?: number }
  ) =>
    useToast.getState().push({
      type: opts?.type ?? "info",
      message,
      action,
      duration: opts?.duration ?? 6000,
    }),
};
