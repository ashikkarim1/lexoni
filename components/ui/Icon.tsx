import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils/cn";

/**
 * Icon wrapper that enforces the icon-size scale.
 *   xs (12) · sm (14) · md (16) · lg (20) · xl (24)
 *
 *   <Icon icon={Sparkles} size="sm" />
 *
 * Prefer this over raw <Sparkles className="h-3.5 w-3.5" />. Keeps icons
 * visually consistent across surfaces.
 */
export function Icon({
  icon: I,
  size = "sm",
  className,
  label,
}: {
  icon: LucideIcon;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  label?: string;
}) {
  const sz = { xs: "h-3 w-3", sm: "h-3.5 w-3.5", md: "h-4 w-4", lg: "h-5 w-5", xl: "h-6 w-6" }[size];
  const a11y = label ? { "aria-label": label, role: "img" as const } : { "aria-hidden": true as const };
  return <I className={cn(sz, className)} {...a11y} />;
}
