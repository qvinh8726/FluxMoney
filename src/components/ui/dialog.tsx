"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

/** Modal nhẹ, không phụ thuộc Radix. Hỗ trợ phím Esc, khóa scroll, click nền để đóng. */
export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  className,
}: DialogProps) {
  const [mounted, setMounted] = React.useState(false);
  const panelRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => setMounted(true), []);

  React.useEffect(() => {
    if (!open) return;

    // Lưu phần tử đang focus để khôi phục khi đóng (a11y: trả focus về trigger).
    const prevFocused = document.activeElement as HTMLElement | null;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      // Focus trap: giữ Tab/Shift+Tab quẩn trong dialog.
      if (e.key === "Tab") {
        const panel = panelRef.current;
        if (!panel) return;
        const focusables = panel.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        const active = document.activeElement;
        if (e.shiftKey && active === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && active === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", onKey);

    // Lưu giá trị overflow trước đó để khôi phục đúng (không reset cứng "").
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Đưa focus vào dialog khi mở.
    const focusTimer = window.setTimeout(() => {
      const panel = panelRef.current;
      if (!panel) return;
      const firstFocusable = panel.querySelector<HTMLElement>(
        'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
      );
      (firstFocusable ?? panel).focus();
    }, 0);

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      window.clearTimeout(focusTimer);
      prevFocused?.focus?.();
    };
  }, [open, onClose]);

  if (!mounted || !open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        tabIndex={-1}
        className={cn(
          "relative z-10 w-full max-w-lg rounded-xl border bg-card text-card-foreground shadow-lg outline-none",
          "max-h-[90vh] overflow-y-auto scrollbar-thin",
          className
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b p-5">
          <div>
            {title && <h2 className="text-lg font-semibold">{title}</h2>}
            {description && (
              <p className="mt-1 text-sm text-muted-foreground">{description}</p>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Đóng"
            className="-mr-2 -mt-2 shrink-0"
          >
            <X />
          </Button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>,
    document.body
  );
}
