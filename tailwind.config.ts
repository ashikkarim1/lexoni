import type { Config } from "tailwindcss";
import { ramps, semantic, radius, shadow, type as typeScale } from "./lib/design/tokens";

const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Semantic ramps — what new code should use.
        primary: ramps.primary,
        success: ramps.success,
        warning: ramps.warning,
        danger:  ramps.danger,
        info:    ramps.info,
        neutral: ramps.neutral,

        // Semantic single-value aliases.
        surface: semantic.surface.DEFAULT,
        canvas:  semantic.canvas,
        line:    semantic.border.DEFAULT,
        ink:     semantic.ink.DEFAULT,
        muted:   semantic.ink.muted,

        // ───── Backward-compat (do not introduce new uses) ─────
        // The "royal" name leaks brand into tokens. Mirror primary for now;
        // remove once the codebase is migrated.
        royal:   ramps.primary,
        // Midnight kept for the sidebar's dark surface only.
        midnight: { DEFAULT: ramps.neutral[900], 900: ramps.neutral[900], 800: ramps.neutral[800], 700: ramps.neutral[700] },
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        ar:   ["'IBM Plex Sans Arabic'", "Inter", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      fontSize: {
        display:   [typeScale.display.size, { lineHeight: typeScale.display.line, letterSpacing: typeScale.display.track, fontWeight: typeScale.display.weight }],
        "h1":      [typeScale.h1.size,      { lineHeight: typeScale.h1.line,      letterSpacing: typeScale.h1.track,      fontWeight: typeScale.h1.weight }],
        "h2":      [typeScale.h2.size,      { lineHeight: typeScale.h2.line,      letterSpacing: typeScale.h2.track,      fontWeight: typeScale.h2.weight }],
        "h3":      [typeScale.h3.size,      { lineHeight: typeScale.h3.line,      letterSpacing: typeScale.h3.track,      fontWeight: typeScale.h3.weight }],
        "h4":      [typeScale.h4.size,      { lineHeight: typeScale.h4.line,      letterSpacing: typeScale.h4.track,      fontWeight: typeScale.h4.weight }],
        body:      [typeScale.body.size,    { lineHeight: typeScale.body.line }],
        "body-sm": [typeScale.bodySm.size,  { lineHeight: typeScale.bodySm.line }],
        caption:   [typeScale.caption.size, { lineHeight: typeScale.caption.line, letterSpacing: typeScale.caption.track, fontWeight: typeScale.caption.weight }],
      },
      borderRadius: radius,
      boxShadow: {
        xs:   shadow.xs,
        sm:   shadow.sm,
        md:   shadow.md,
        lg:   shadow.lg,
        xl:   shadow.xl,
        ring: shadow.ring,
        // Compat
        card: shadow.sm,
        pop:  shadow.lg,
      },
      ringColor: { DEFAULT: semantic.focus },
      transitionTimingFunction: { smooth: "cubic-bezier(0.22, 1, 0.36, 1)" },
      keyframes: {
        "fade-in":  { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
        "slide-up": { "0%": { transform: "translateY(8px)", opacity: "0" }, "100%": { transform: "translateY(0)", opacity: "1" } },
        shimmer:    { "0%": { backgroundPosition: "-200% 0" }, "100%": { backgroundPosition: "200% 0" } },
      },
      animation: {
        "fade-in": "fade-in 120ms ease-out",
        "slide-up": "slide-up 160ms cubic-bezier(0.22, 1, 0.36, 1)",
        shimmer:    "shimmer 1.4s linear infinite",
      },
    },
  },
  plugins: [],
};
export default config;
