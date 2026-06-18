import type { Metadata } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://lexoni.ai";

export const metadata: Metadata = {
  title: "Investors and trial customers",
  description:
    "Lexoni is the GCC Legal Operating System, built in Dubai. We are scaling across UAE and KSA in 2026 and raising a Pre-Series A. Talk to Ashik Karim directly.",
  alternates: { canonical: `${SITE_URL}/investors` },
  openGraph: {
    title: "Lexoni.ai - Investors and trial customers",
    description: "Built in Dubai. GCC focus. Pre-Series A open. Reach the founder directly.",
    url: `${SITE_URL}/investors`,
    type: "website",
  },
};

export default function InvestorsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
