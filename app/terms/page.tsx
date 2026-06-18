import Link from "next/link";
import type { Metadata } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://lexoni.ai";
const EFFECTIVE_DATE = "18 June 2026";
const OWNER_EMAIL = "ceo@theupcapital.com";

export const metadata: Metadata = {
  title: "Terms of service",
  description: "The terms that govern your use of Lexoni.ai.",
  alternates: { canonical: `${SITE_URL}/terms` },
  robots: { index: true, follow: true },
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      <PageChrome />
      <main className="max-w-3xl mx-auto px-6 py-12 prose-render">
        <h1>Terms of service</h1>
        <p className="text-body-sm text-muted">Effective {EFFECTIVE_DATE}. Last updated {EFFECTIVE_DATE}.</p>

        <h2>1. The agreement</h2>
        <p>
          These terms govern your access to and use of the Lexoni.ai platform (the platform),
          operated by The UpCapital Global FZCO, a company headquartered in Dubai, United Arab Emirates
          (Lexoni, we, us, our). By signing up, creating an account, or using the platform you
          agree to these terms. If you do not agree, do not use the platform.
        </p>

        <h2>2. Eligibility</h2>
        <p>
          You may use the platform only if you are at least 18 years old and able to enter into a
          legally binding contract. By using the platform on behalf of a law firm or other
          organisation, you represent that you are authorised to bind that organisation to these
          terms.
        </p>

        <h2>3. Accounts and security</h2>
        <ul>
          <li>You are responsible for the accuracy of the information you provide and for the security of your password.</li>
          <li>You may not share your account credentials with anyone.</li>
          <li>You must notify us promptly of any unauthorised use of your account.</li>
          <li>We may suspend accounts that we reasonably believe to be compromised.</li>
        </ul>

        <h2>4. Subscription, fees and billing</h2>
        <ul>
          <li>Fees are set out at signup and may be amended on 30 days notice for renewal periods.</li>
          <li>Invoices are issued in advance unless agreed otherwise. Payment is due on receipt.</li>
          <li>Late payments accrue interest at the lower of 1.5 percent per month or the maximum permitted by law.</li>
          <li>VAT or applicable taxes are added at the prevailing rate (UAE 5 percent, KSA 15 percent at the date of these terms).</li>
          <li>For KSA firms, invoices comply with ZATCA e-invoicing requirements.</li>
        </ul>

        <h2>5. Acceptable use</h2>
        <p>You agree not to:</p>
        <ul>
          <li>Use the platform for any unlawful purpose, including to violate applicable bar rules, anti-money-laundering laws, sanctions, or data protection laws.</li>
          <li>Upload content you do not have the right to upload.</li>
          <li>Attempt to circumvent the ethical wall, tenant isolation, or any other security control.</li>
          <li>Reverse engineer the platform or use it to train a competing AI model.</li>
          <li>Use bots, scrapers, or automated means other than our published API.</li>
          <li>Resell or sublicense access without our written agreement.</li>
        </ul>

        <h2>6. Your content and data</h2>
        <p>
          You retain ownership of all content and data you upload to the platform (firm data). We
          do not claim any ownership in firm data. You grant us a worldwide, royalty-free
          licence to host, process, transmit, and display firm data solely to provide the
          platform to you. You can export your firm data at any time during the subscription and
          for 90 days after termination.
        </p>

        <h2>7. AI features</h2>
        <p>
          The platform includes AI features that assist with drafting, retrieval, classification
          and prediction. AI outputs are suggestions. They are not legal advice and must be
          reviewed and approved by a qualified lawyer before use. Lexoni is not responsible for
          decisions made on the basis of AI output without human review. The ethical wall and
          tenant isolation are enforced before AI sees any data.
        </p>

        <h2>8. Confidentiality and professional obligations</h2>
        <p>
          The platform is built for legal professionals. We acknowledge that the data you upload
          is often subject to legal professional privilege, lawyer-client confidentiality, or
          regulatory secrecy duties. We treat all firm data accordingly, restrict access to
          authorised firm members, and never disclose firm data to third parties except as
          required by law or with your written instruction.
        </p>

        <h2>9. Intellectual property</h2>
        <p>
          The platform, including all software, design, documentation, trade marks and content
          we create, is owned by Lexoni or its licensors. We grant you a non-exclusive,
          non-transferable right to use the platform during your subscription. Nothing in these
          terms transfers any of our intellectual property to you.
        </p>

        <h2>10. Service level</h2>
        <p>
          We target 99.5 percent monthly uptime on paid plans. Planned maintenance is excluded.
          For breaches of this target, the firm admin may request a service credit by emailing
          us within 30 days. Service credits are our sole remedy for downtime.
        </p>

        <h2>11. Suspension and termination</h2>
        <ul>
          <li>You may cancel at any time from the account settings. The platform remains available until the end of the paid period.</li>
          <li>We may suspend or terminate access for material breach, non-payment, or use that creates legal or security risk, with reasonable notice where possible.</li>
          <li>On termination, you have 90 days to export your data; thereafter we delete production copies subject to legal retention obligations.</li>
        </ul>

        <h2>12. Warranties and disclaimers</h2>
        <p>
          We provide the platform on an "as is" and "as available" basis. To the maximum extent
          permitted by law, we disclaim all warranties, express or implied, including
          merchantability, fitness for a particular purpose, and non-infringement. Nothing in
          these terms excludes liability that cannot be excluded under applicable law (including
          for death, personal injury, or fraud).
        </p>

        <h2>13. Limitation of liability</h2>
        <p>
          To the maximum extent permitted by law, neither party is liable to the other for any
          indirect, special, incidental, consequential or punitive damages, or any loss of
          revenue, profits, goodwill or data. Our aggregate liability under or in connection
          with these terms is capped at the fees paid by you in the 12 months preceding the
          event giving rise to the claim.
        </p>

        <h2>14. Indemnity</h2>
        <p>
          You will defend, indemnify and hold us harmless from third-party claims arising out of
          your use of the platform in breach of these terms or applicable law, or out of the
          firm data you upload.
        </p>

        <h2>15. Governing law and disputes</h2>
        <p>
          These terms are governed by the laws of the Dubai International Financial Centre
          (DIFC). The DIFC Courts have exclusive jurisdiction. For firms in Saudi Arabia, we
          will in good faith agree an alternative DIFC-seated arbitration mechanism if local
          court rules require it. Nothing in this clause restricts either party from seeking
          injunctive relief in any court of competent jurisdiction.
        </p>

        <h2>16. Changes</h2>
        <p>
          We may update these terms from time to time. Material changes are notified to the
          firm admin at least 30 days before they take effect. The current version is published
          at <code>{SITE_URL}/terms</code>. Continued use of the platform after the effective
          date constitutes acceptance.
        </p>

        <h2>17. Contact</h2>
        <p>
          Questions about these terms: <a href={`mailto:${OWNER_EMAIL}`}>{OWNER_EMAIL}</a>.<br />
          The UpCapital Global FZCO, Dubai, United Arab Emirates.
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
