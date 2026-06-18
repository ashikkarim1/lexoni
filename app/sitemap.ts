import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://lexoni.ai";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const publicRoutes = [
    "/",            // landing
    "/investors",
    "/apply",
    "/signin",
    "/privacy",
    "/terms",
  ];
  return publicRoutes.map((r) => ({
    url: `${SITE_URL}${r}`,
    lastModified: now,
    changeFrequency: r === "/" ? "weekly" : "monthly",
    priority: r === "/" ? 1.0 : r === "/investors" ? 0.9 : 0.7,
  }));
}
