/**
 * Email templates for auth flows. Plain inline-css HTML + plaintext.
 */
const BRAND = "#5046E5";

export function activationEmail(args: { name: string; url: string; ttlHours: number }): { subject: string; html: string; text: string } {
  const subject = "Activate your Lexoni.ai account";
  const text = [
    `Hello ${args.name},`,
    "",
    `Welcome to Lexoni.ai. Please activate your account by opening this link:`,
    args.url,
    "",
    `The link is valid for ${args.ttlHours} hours and can only be used once.`,
    "",
    `If you did not create an account, you can safely ignore this email.`,
    "",
    `The Lexoni.ai team`,
  ].join("\n");
  const html = `
<div style="font-family:Inter,system-ui,sans-serif;line-height:1.5;color:#0f172a;max-width:560px;margin:0 auto;padding:24px;">
  <h2 style="margin:0 0 12px 0;">Activate your Lexoni.ai account</h2>
  <p>Hello ${escapeHtml(args.name)},</p>
  <p>Welcome to Lexoni.ai. Click below to activate your account.</p>
  <p style="margin:24px 0;"><a href="${args.url}" style="display:inline-block;background:${BRAND};color:white;text-decoration:none;padding:10px 18px;border-radius:8px;font-weight:600;">Activate account</a></p>
  <p style="color:#64748b;font-size:13px;">Valid for ${args.ttlHours} hours, single use. If you did not create an account, ignore this email.</p>
  <p style="color:#64748b;font-size:12px;">From <a href="mailto:noreply@lexoni.ai" style="color:#64748b;">noreply@lexoni.ai</a>. The Lexoni.ai team.</p>
</div>`;
  return { subject, html, text };
}

export function passwordResetEmail(args: { url: string; ttlMinutes: number }): { subject: string; html: string; text: string } {
  const subject = "Reset your Lexoni.ai password";
  const text = [
    `Reset your Lexoni.ai password.`,
    "",
    `Open this link to set a new password:`,
    args.url,
    "",
    `The link is valid for ${args.ttlMinutes} minutes and can only be used once.`,
    "",
    `If you did not request a reset, you can safely ignore this email.`,
    "",
    `The Lexoni.ai team`,
  ].join("\n");
  const html = `
<div style="font-family:Inter,system-ui,sans-serif;line-height:1.5;color:#0f172a;max-width:560px;margin:0 auto;padding:24px;">
  <h2 style="margin:0 0 12px 0;">Reset your password</h2>
  <p>Open the link below to set a new password.</p>
  <p style="margin:24px 0;"><a href="${args.url}" style="display:inline-block;background:${BRAND};color:white;text-decoration:none;padding:10px 18px;border-radius:8px;font-weight:600;">Reset password</a></p>
  <p style="color:#64748b;font-size:13px;">Valid for ${args.ttlMinutes} minutes, single use. If you did not request this, ignore the email.</p>
  <p style="color:#64748b;font-size:12px;">From <a href="mailto:noreply@lexoni.ai" style="color:#64748b;">noreply@lexoni.ai</a>. The Lexoni.ai team.</p>
</div>`;
  return { subject, html, text };
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    c === "&" ? "&amp;" :
    c === "<" ? "&lt;" :
    c === ">" ? "&gt;" :
    c === "\"" ? "&quot;" : "&#39;");
}
