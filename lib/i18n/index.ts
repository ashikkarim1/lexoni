export type Locale = "en" | "ar";
export const locales: Locale[] = ["en", "ar"];
export const defaultLocale: Locale = "en";
export const isRtl = (l: Locale) => l === "ar";

import en from "./en.json";
import ar from "./ar.json";

const dicts = { en, ar } as const;

/**
 * Look up a dotted key in the active dictionary and interpolate `{placeholder}`
 * tokens from `vars`. Missing keys return the key itself so missing
 * translations stay visible in dev.
 */
export function t(locale: Locale, key: string, vars?: Record<string, string | number>): string {
  const parts = key.split(".");
  let v: unknown = dicts[locale];
  for (const p of parts) v = (v as Record<string, unknown> | undefined)?.[p];
  let str = typeof v === "string" ? v : key;
  if (vars) {
    for (const [k, val] of Object.entries(vars)) {
      str = str.replace(new RegExp(`\\{${k}\\}`, "g"), String(val));
    }
  }
  return str;
}
