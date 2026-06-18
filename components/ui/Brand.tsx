import { cn } from "@/lib/utils/cn";

/**
 * Wordmark + mark for Lexoni.ai. Two variants:
 *   variant="full"  → mark + wordmark (default)
 *   variant="mark"  → just the L glyph (for collapsed sidebar / favicon)
 *
 * The mark is a hand-tuned SVG, not a square "L" tile. Inherits the parent's
 * text colour so it works on both dark and light surfaces.
 */
export function Brand({
  variant = "full",
  className,
  withDot = true,
}: {
  variant?: "full" | "mark";
  className?: string;
  withDot?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)} aria-label="Lexoni.ai">
      <BrandMark />
      {variant === "full" && (
        <span className="leading-none flex items-baseline">
          <span className="font-semibold tracking-tight text-[15px]">Lexoni</span>
          {withDot && <span className="text-primary-600 font-semibold tracking-tight text-[15px]">.ai</span>}
        </span>
      )}
    </span>
  );
}

function BrandMark() {
  // Stylised L composed of two strokes - sturdier than a square tile and reads at 14-16px.
  return (
    <span className="relative inline-flex h-7 w-7 items-center justify-center rounded-lg bg-primary-600 text-white shadow-sm">
      <svg
        viewBox="0 0 20 20"
        className="h-3.5 w-3.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M6 3.5V14.5" />
        <path d="M6 14.5H15.5" />
        <circle cx="15.5" cy="14.5" r="1.2" fill="currentColor" />
      </svg>
    </span>
  );
}
