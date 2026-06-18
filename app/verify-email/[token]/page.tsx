/**
 * Public landing for /verify-email/[token]. Redirects through the
 * verify-email API endpoint which does the actual mutation and
 * redirects to /signin?verify=ok|invalid|expired.
 */
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function VerifyPage({ params }: { params: { token: string } }) {
  redirect(`/api/auth/verify-email?token=${encodeURIComponent(params.token)}`);
}
