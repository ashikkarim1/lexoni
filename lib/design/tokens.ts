/**
 * Design tokens — single source of truth for every colour, radius, shadow,
 * spacing and type ramp in the application.
 *
 * Rules (enforced by lint + code review):
 *   • Never use raw hex / rgb / oklch in components — read from tokens.
 *   • Never name a token after the brand. Tokens are semantic; the brand is
 *     applied via the `primary` ramp. The brand can be re-skinned in one place.
 *   • Every colour has the full 50→900 ramp. No partial ramps.
 *
 * Tailwind reads this file in `tailwind.config.ts` and exposes the values as
 * utility classes (`bg-primary-500`, `text-success-700`, etc).
 *
 * The deprecated `royal` brand-name aliases exist temporarily so the existing
 * codebase keeps compiling while we migrate. Do not introduce new uses.
 */

export const ramps = {
  /** Brand / primary action. Today: a saturated royal blue. */
  primary: {
    50:  "#EFF4FF",
    100: "#DBE5FE",
    200: "#BFD0FD",
    300: "#93B0FB",
    400: "#6286F7",
    500: "#3B62F2",
    600: "#2546E3", // canonical brand
    700: "#1D38C2",
    800: "#1B309B",
    900: "#1B2C7A",
  },
  success: {
    50:  "#ECFDF3",
    100: "#D1FADF",
    200: "#A6F4C5",
    300: "#6CE9A6",
    400: "#32D583",
    500: "#12B76A",
    600: "#039855",
    700: "#027A48",
    800: "#05603A",
    900: "#054F31",
  },
  warning: {
    50:  "#FFFAEB",
    100: "#FEF0C7",
    200: "#FEDF89",
    300: "#FEC84B",
    400: "#FDB022",
    500: "#F79009",
    600: "#DC6803",
    700: "#B54708",
    800: "#93370D",
    900: "#7A2E0E",
  },
  danger: {
    50:  "#FEF3F2",
    100: "#FEE4E2",
    200: "#FECDCA",
    300: "#FDA29B",
    400: "#F97066",
    500: "#F04438",
    600: "#D92D20",
    700: "#B42318",
    800: "#912018",
    900: "#7A271A",
  },
  info: {
    50:  "#EFF8FF",
    100: "#D1E9FF",
    200: "#B2DDFF",
    300: "#84CAFF",
    400: "#53B1FD",
    500: "#2E90FA",
    600: "#1570EF",
    700: "#175CD3",
    800: "#1849A9",
    900: "#194185",
  },
  /** Cool neutrals — the gray ramp behind the entire app. */
  neutral: {
    50:  "#F8FAFC",
    100: "#F1F5F9",
    200: "#E2E8F0",
    300: "#CBD5E1",
    400: "#94A3B8",
    500: "#64748B",
    600: "#475569",
    700: "#334155",
    800: "#1E293B",
    900: "#0F172A",
  },
} as const;

/** Semantic aliases — what components actually consume. */
export const semantic = {
  surface:  { DEFAULT: "#FFFFFF", muted: ramps.neutral[50],  raised: "#FFFFFF" },
  canvas:   ramps.neutral[50],
  border:   { DEFAULT: ramps.neutral[200], strong: ramps.neutral[300], subtle: ramps.neutral[100] },
  ink:      { DEFAULT: ramps.neutral[900], muted: ramps.neutral[500], inverted: "#FFFFFF" },
  focus:    ramps.primary[500],
} as const;

/** Spacing scale — 4-px grid. The only values components may use. */
export const spacing = {
  0: "0px",
  1: "4px",
  2: "8px",
  3: "12px",
  4: "16px",
  5: "20px",
  6: "24px",
  8: "32px",
  10: "40px",
  12: "48px",
  16: "64px",
  20: "80px",
  24: "96px",
} as const;

/** Radius scale. */
export const radius = {
  none: "0",
  sm:   "6px",
  DEFAULT: "8px",
  md:   "10px",
  lg:   "12px",
  xl:   "16px",
  "2xl":"20px",
  full: "9999px",
} as const;

/** Shadow scale — used for elevations. */
export const shadow = {
  xs:  "0 1px 2px rgba(15, 23, 42, 0.05)",
  sm:  "0 1px 3px rgba(15, 23, 42, 0.08), 0 1px 2px rgba(15, 23, 42, 0.04)",
  md:  "0 4px 8px -2px rgba(15, 23, 42, 0.08), 0 2px 4px -2px rgba(15, 23, 42, 0.04)",
  lg:  "0 12px 16px -4px rgba(15, 23, 42, 0.08), 0 4px 6px -2px rgba(15, 23, 42, 0.03)",
  xl:  "0 20px 24px -4px rgba(15, 23, 42, 0.08), 0 8px 8px -4px rgba(15, 23, 42, 0.03)",
  ring: `0 0 0 4px ${ramps.primary[100]}`,
} as const;

/** Typography ramp — semantic names + concrete sizes. */
export const type = {
  display: { size: "36px", line: "44px", weight: "600", track: "-0.02em" },
  h1:      { size: "28px", line: "36px", weight: "600", track: "-0.018em" },
  h2:      { size: "20px", line: "28px", weight: "600", track: "-0.012em" },
  h3:      { size: "16px", line: "24px", weight: "600", track: "-0.006em" },
  h4:      { size: "14px", line: "20px", weight: "600", track: "0" },
  body:    { size: "14px", line: "20px", weight: "400", track: "0" },
  bodySm:  { size: "13px", line: "18px", weight: "400", track: "0" },
  caption: { size: "12px", line: "16px", weight: "500", track: "0.01em" },
  code:    { size: "13px", line: "18px", weight: "500", track: "0" },
} as const;

export const tokens = { ramps, semantic, spacing, radius, shadow, type } as const;
export default tokens;
