import "./globals.css";
import type { Metadata, Viewport } from "next";
import Script from "next/script";

/**
 * Root layout. INTENTIONALLY STATIC.
 *
 * Calling `getSession()` here would mark every route in the app dynamic
 * (Next.js bails out of SSG whenever a layout reads cookies). Public pages
 * (landing, investors, privacy, terms, apply) need to be statically
 * generated so Vercel serves them from edge cache instead of running a
 * function per request.
 *
 * The locale/direction logic moved into `app/(dashboard)/layout.tsx` where
 * it's actually needed. Public pages default to `lang="en" dir="ltr"`; the
 * landing handles its own RTL flip client-side via the language toggle.
 */

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://lexoni.ai";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Lexoni.ai - The GCC Legal Operating System for UAE and KSA law firms",
    template: "%s | Lexoni.ai",
  },
  description:
    "Lexoni is the GCC legal operating system law firms in the UAE and Saudi Arabia open first and close last. Outcome-driven matters, ADGM, DIFC, DMCC, ADX, Tadawul, MISA, ZATCA workflows, bilingual EN and AR. Built in Dubai for the region.",
  applicationName: "Lexoni.ai",
  generator: "Next.js",
  keywords: [
    "legal software GCC", "GCC law firm software", "UAE legal software", "KSA legal software",
    "Saudi Arabia legal tech", "Dubai legal software", "Abu Dhabi legal tech",
    "ADGM compliance software", "DIFC compliance software", "DMCC compliance",
    "ADX listing software", "Tadawul listing", "Nasdaq Dubai listing",
    "MISA Saudi formation", "ZATCA invoicing software",
    "M&A workflow GCC", "fund launch ADGM DIFC", "patent filing GCC",
    "employment dispute UAE KSA", "litigation GCC software",
    "legal operating system", "legal matter copilot", "institutional memory legal",
    "regulatory change intelligence", "knowledge graph legal", "outcome prediction law firm",
    "law firm growth intelligence", "law firm business development",
    "Arabic legal software", "bilingual legal platform",
  ],
  authors: [{ name: "Ashik Karim", url: SITE_URL }],
  creator: "Lexoni.ai",
  publisher: "Lexoni.ai",
  category: "Business / Legal Technology",
  alternates: {
    canonical: SITE_URL,
    languages: { "en": `${SITE_URL}/`, "ar": `${SITE_URL}/` },
  },
  openGraph: {
    title: "Lexoni.ai - The GCC Legal Operating System",
    description:
      "Built in Dubai for the region. Outcome-driven law-firm operating system: ADGM, DIFC, ADX, Tadawul, MISA, ZATCA workflows. Bilingual EN and AR.",
    url: SITE_URL,
    siteName: "Lexoni.ai",
    // OG image is generated dynamically by app/opengraph-image.tsx at /opengraph-image
    locale: "en_AE",
    alternateLocale: ["ar_AE", "en_SA", "ar_SA"],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Lexoni.ai - The GCC Legal Operating System",
    description: "Built in Dubai. UAE and KSA focus. Outcome-driven matters, regulator-mapped, bilingual EN and AR.",
    creator: "@lexoniai",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-snippet": -1, "max-image-preview": "large", "max-video-preview": -1 },
  },
  // Favicons handled by app/icon.tsx + app/apple-icon.tsx + public/icon.svg
  other: {
    "geo.region": "AE-DU",
    "geo.placename": "Dubai",
    "geo.position": "25.2048;55.2708",
    "ICBM": "25.2048, 55.2708",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0b1220" },
  ],
};

const JSON_LD_ORGANIZATION = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Lexoni.ai",
  url: SITE_URL,
  logo: `${SITE_URL}/icon.svg`,
  email: "ceo@theupcapital.com",
  founder: { "@type": "Person", name: "Ashik Karim" },
  foundingLocation: { "@type": "Place", name: "Dubai, United Arab Emirates" },
  areaServed: [
    { "@type": "Country", name: "United Arab Emirates" },
    { "@type": "Country", name: "Saudi Arabia" },
    { "@type": "Country", name: "Qatar" },
    { "@type": "Country", name: "Bahrain" },
    { "@type": "Country", name: "Kuwait" },
    { "@type": "Country", name: "Oman" },
  ],
  sameAs: ["https://www.linkedin.com/in/ashikconsulting/"],
};

const JSON_LD_SOFTWARE = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Lexoni.ai",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  description: "The GCC Legal Operating System for UAE and KSA law firms. Outcome-driven matters, regulator-mapped workflows, bilingual EN and AR.",
  offers: { "@type": "Offer", price: "49", priceCurrency: "USD" },
  inLanguage: ["en", "ar"],
  url: SITE_URL,
  publisher: { "@type": "Organization", name: "Lexoni.ai" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <head>
        {/* preconnect helps the first-paint font request resolve in parallel with the HTML stream. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        {/* JSON-LD: load after interactive so it doesn't block LCP. Crawlers still see it in the rendered HTML. */}
        <Script
          id="jsonld-organization"
          type="application/ld+json"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD_ORGANIZATION) }}
        />
        <Script
          id="jsonld-software"
          type="application/ld+json"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD_SOFTWARE) }}
        />
      </head>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
