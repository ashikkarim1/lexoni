import Link from "next/link";
import type { Metadata } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://lexoni.ai";
const EFFECTIVE_DATE = "18 June 2026";
const OWNER_EMAIL = "ceo@theupcapital.com";
const PRIVACY_EMAIL = "privacy@lexoni.ai";

export const metadata: Metadata = {
  title: "Privacy policy",
  description: "How Lexoni.ai handles personal data under UAE PDPL, KSA PDPL and GDPR.",
  alternates: { canonical: `${SITE_URL}/privacy` },
  robots: { index: true, follow: true },
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <PageChrome />
      <main className="max-w-3xl mx-auto px-6 py-12 prose-render">
        <h1>Privacy policy</h1>
        <p className="text-body-sm text-muted">Effective {EFFECTIVE_DATE}. Last updated {EFFECTIVE_DATE}.</p>

        <h2>1. Who we are</h2>
        <p>
          Lexoni.ai (the platform) is operated by The UpCapital Global FZCO, a company headquartered in
          Dubai, United Arab Emirates. We provide a software-as-a-service legal operating system
          for law firms and in-house counsel in the GCC. References to "we", "us" and "our" mean
          The UpCapital Global FZCO. Contact for privacy matters: <a href={`mailto:${PRIVACY_EMAIL}`}>{PRIVACY_EMAIL}</a>.
        </p>

        <h2>2. The laws we follow</h2>
        <p>
          We process personal data in accordance with the United Arab Emirates Federal Decree-Law
          No. 45 of 2021 on the Protection of Personal Data (the UAE PDPL), the Kingdom of Saudi
          Arabia Personal Data Protection Law issued under Royal Decree No. M/19 of 1443H (the
          KSA PDPL), and where applicable the EU General Data Protection Regulation 2016/679.
          When local law and these terms conflict, local law applies.
        </p>

        <h2>3. Data we collect</h2>
        <ul>
          <li><strong>Account data</strong>: full name, work email, role, password (hashed), and locale preference.</li>
          <li><strong>Firm data</strong>: client records, matters, documents you upload, contracts, time entries, invoices, governance records and any content you input into the platform.</li>
          <li><strong>Usage data</strong>: pages viewed, features used, queries to AI features, timestamps and IP addresses for audit and security.</li>
          <li><strong>Email and document content</strong>: where you connect Outlook or Gmail, message metadata and content for the matters you elect to capture into the platform.</li>
        </ul>

        <h2>4. How we use it</h2>
        <ul>
          <li>To operate, maintain and improve the platform.</li>
          <li>To authenticate users, prevent abuse, and audit changes.</li>
          <li>To deliver AI features (document drafting, knowledge retrieval, classification) on your firm&apos;s tenant only.</li>
          <li>To send transactional emails (invites, password resets, signature requests, invoices).</li>
          <li>To meet legal, regulatory and contractual obligations.</li>
        </ul>

        <h2>5. Data residency</h2>
        <p>
          We pin firm data to the region of the firm&apos;s primary tenant. UAE firms&apos; data is
          hosted in UAE-based infrastructure; KSA firms&apos; data in KSA-based infrastructure. We
          do not move firm data across regions without a logged lawful basis. Cross-border
          transfers required for service operation are restricted to processors that meet the
          adequacy standards of UAE PDPL and KSA PDPL.
        </p>

        <h2>6. AI processing</h2>
        <p>
          The platform uses large language models (currently Anthropic Claude) to assist with
          drafting, retrieval and classification. Your firm&apos;s data is sent to the model only
          for the active query, is not used by the model provider for training, and is not
          retained beyond the request lifecycle except as needed for our internal audit log. We
          maintain an opt-out flag on every knowledge item; when set, that item never enters AI
          context. The ethical wall and tenant isolation are enforced before the AI sees any
          data.
        </p>

        <h2>7. Tenant isolation and ethical walls</h2>
        <p>
          Every query in the platform is scoped to the firm&apos;s tenant. We never expose one
          firm&apos;s data to another firm. Inside a firm, ethical walls are enforced at the data
          layer and at the AI context layer. A non-member of a wall cannot list, read, search,
          AI-draft from, or in any way learn about a walled matter.
        </p>

        <h2>8. Retention</h2>
        <p>
          We retain firm data for the active life of the subscription. After cancellation, the
          firm has 90 days to export. After 90 days, we delete the firm&apos;s production data
          subject to legal retention obligations. Audit logs are retained for seven years where
          legally required. You can request earlier deletion at any time, subject to verification.
        </p>

        <h2>9. Your rights</h2>
        <p>
          Under UAE PDPL, KSA PDPL and GDPR (where applicable), you have rights to access,
          correct, delete, restrict, port and object to processing of your personal data. You
          have the right to withdraw consent and the right to lodge a complaint with a
          supervisory authority. Submit data subject requests to <a href={`mailto:${PRIVACY_EMAIL}`}>{PRIVACY_EMAIL}</a>.
          We respond within 30 days.
        </p>

        <h2>10. Security</h2>
        <p>
          We use HMAC-signed session cookies, server-issued honeypot challenges and Cloudflare
          Turnstile to defend against automated abuse. Passwords are hashed with PBKDF2-SHA256.
          Sensitive endpoints are rate-limited. We maintain an append-only audit log of every
          mutation. Production access is restricted, logged and reviewed.
        </p>

        <h2>11. Sub-processors</h2>
        <p>We use a small set of sub-processors. Current list as of {EFFECTIVE_DATE}:</p>
        <ul>
          <li><strong>Hosting and database</strong>: cloud provider with UAE and KSA regions.</li>
          <li><strong>Email delivery</strong>: Resend (transactional email).</li>
          <li><strong>Bot protection</strong>: Cloudflare Turnstile.</li>
          <li><strong>AI processing</strong>: Anthropic (Claude).</li>
        </ul>
        <p>We notify firms of changes to the sub-processor list with 30 days notice.</p>

        <h2>12. Children</h2>
        <p>The platform is not directed to children. We do not knowingly collect personal data of anyone under 18.</p>

        <h2>13. Changes</h2>
        <p>
          We update this policy when our practices change. Material changes are notified to the
          firm admin by email at least 30 days in advance. The current version is always
          published at <code>{SITE_URL}/privacy</code>.
        </p>

        <h2>14. Contact</h2>
        <p>
          For privacy questions: <a href={`mailto:${PRIVACY_EMAIL}`}>{PRIVACY_EMAIL}</a>.<br />
          For everything else: <a href={`mailto:${OWNER_EMAIL}`}>{OWNER_EMAIL}</a>.<br />
          Postal address: The UpCapital Global FZCO, Dubai, United Arab Emirates.
        </p>
      </main>
      <FooterChrome />
    </div>
  );
}

function PageChrome() {
  return (
    <header className="border-b border-line">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center gap-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-midnight text-white flex items-center justify-center font-bold">L</div>
          <div className="font-semibold">Lexoni.ai</div>
        </Link>
        <div className="ms-auto flex items-center gap-3 text-sm text-muted">
          <Link href="/" className="hover:text-ink">Product</Link>
          <Link href="/investors" className="text-royal font-medium">Partner with us</Link>
        </div>
      </div>
    </header>
  );
}

function FooterChrome() {
  return (
    <footer className="border-t border-line py-8 text-center text-caption text-muted">
      <div>Lexoni.ai · Dubai, UAE</div>
      <div className="mt-1.5">
        <Link href="/privacy" className="hover:text-ink">Privacy</Link>
        <span className="mx-2">·</span>
        <Link href="/terms" className="hover:text-ink">Terms</Link>
        <span className="mx-2">·</span>
        <Link href="/" className="hover:text-ink">Home</Link>
      </div>
    </footer>
  );
}
