"use client";

import * as React from "react";
import { CheckCircle2, AlertTriangle, Info, X } from "lucide-react";
import { useToast, type ToastType } from "@/lib/toast";
import { cn } from "@/lib/utils";

const ICON: Record<ToastType, React.ComponentType<{ className?: string }>> = {
  success: CheckCircle2,
  error: AlertTriangle,
  info: Info,
};

const TONE: Record<ToastType, string> = {
  success: "border-income/30 bg-income/10 text-income",
  error: "border-destructive/30 bg-destructive/10 text-destructive",
  info: "border-primary/30 bg-primary/10 text-primary",
};

export function Toaster() {
  const toasts = useToast((s) => s.toasts);
  const dismiss = useToast((s) => s.dismiss);

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[100] flex flex-col items-center gap-2 p-4 sm:items-end">
      {toasts.map((t) => {
        const Icon = ICON[t.type];
        return (
          <div
            key={t.id}
            role={t.type === "error" ? "alert" : "status"}
            aria-live={t.type === "error" ? "assertive" : "polite"}
            className={cn(
              "pointer-events-auto flex w-full max-w-sm items-start gap-2.5 rounded-lg border px-3.5 py-3 text-sm shadow-lg backdrop-blur",
              TONE[t.type]
            )}
          >
            <Icon className="mt-0.5 size-4 shrink-0" />
            <p className="flex-1 text-foreground">{t.message}</p>
            {t.action && (
              <button
                onClick={() => {
                  t.action!.onClick();
                  dismiss(t.id);
                }}
                className="shrink-0 rounded-md px-2 py-1 text-sm font-semibold text-foreground underline-offset-2 hover:underline"
              >
                {t.action.label}
              </button>
            )}
            <button
              aria-label="Đóng"
              onClick={() => dismiss(t.id)}
              className="shrink-0 text-muted-foreground transition-colors hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
