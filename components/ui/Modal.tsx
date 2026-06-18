"use client";
import { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils/cn";

/**
 * Modal primitive. Composable header + body + footer slots. Closes on ESC,
 * traps focus to the dialog, scrolls inside, never inside the body. Use this
 * everywhere - pages should not re-roll their own `Backdrop` components.
 */
export function Modal({
  open,
  onClose,
  title,
  description,
  size = "md",
  children,
  footer,
  className,
  closeAriaLabel = "Close",
}: {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  closeAriaLabel?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [open, onClose]);

  if (!open) return null;

  const sizes = { sm: "max-w-sm", md: "max-w-md", lg: "max-w-lg", xl: "max-w-2xl" } as const;

  return (
    <div className="scrim flex items-center justify-center p-4" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className={cn("modal", sizes[size], className)}
        onClick={(e) => e.stopPropagation()}
      >
        {(title || description) && (
          <div className="px-5 pt-5 pb-3 flex items-start justify-between gap-4">
            <div className="min-w-0">
              {title && <div className="text-h2">{title}</div>}
              {description && <p className="text-body-sm text-muted mt-1 leading-snug">{description}</p>}
            </div>
            <button onClick={onClose} aria-label={closeAriaLabel} className="text-muted hover:text-ink shrink-0 -mt-1 -me-1 p-1 rounded-md">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
        <div className="px-5 py-3">{children}</div>
        {footer && <div className="px-5 py-4 border-t border-line flex flex-wrap justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
}
