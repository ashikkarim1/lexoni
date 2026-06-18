import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://lexoni.ai";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/investors", "/apply", "/signin", "/privacy", "/terms"],
        disallow: ["/api/", "/desk", "/matters", "/firm-dashboard", "/conflicts", "/intake",
                   "/engagement-letters", "/cases", "/billing", "/collaborators",
                   "/ai", "/contracts", "/compliance", "/companies", "/captable", "/governance",
                   "/marketplace", "/ma", "/portal", "/integrations", "/gdpr", "/templates",
                   "/knowledge", "/document-automation", "/settings", "/pricing",
                   "/documents", "/precedents", "/copilot", "/memory", "/growth", "/my",
                   "/engagement/", "/sign/", "/accept-invite", "/reset-password/", "/verify-email/"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
