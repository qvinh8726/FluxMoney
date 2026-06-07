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

  React.useEffect(() => setMounted(true), []);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
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
        className={cn(
          "relative z-10 w-full max-w-lg rounded-xl border bg-card text-card-foreground shadow-lg",
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
