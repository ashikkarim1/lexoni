import { cn } from "@/lib/utils/cn";
import type { ReactNode } from "react";

export type Tone = "success" | "warning" | "danger" | "info" | "neutral";

export function Badge({
  tone = "neutral",
  children,
  className,
}: {
  tone?: Tone;
  children: ReactNode;
  className?: string;
}) {
  const cls = {
    success: "chip-success",
    warning: "chip-warning",
    danger:  "chip-danger",
    info:    "chip-info",
    neutral: "chip-neutral",
  }[tone];
  return <span className={cn(cls, className)}>{children}</span>;
}
