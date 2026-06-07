"use client";

import { create } from "zustand";

export type ToastType = "error" | "success" | "info";

export interface Toast {
  id: number;
  type: ToastType;
  message: string;
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
    // Tự ẩn sau 4 giây.
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) }));
    }, 4000);
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) })),
}));

/** Gọi nhanh ngoài React (vd trong store). */
export const toast = {
  error: (message: string) => useToast.getState().push({ type: "error", message }),
  success: (message: string) => useToast.getState().push({ type: "success", message }),
  info: (message: string) => useToast.getState().push({ type: "info", message }),
};
