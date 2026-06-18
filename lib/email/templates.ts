/**
 * Bilingual HTML email templates. Inline styles only — email clients (Gmail,
 * Outlook, Apple Mail) ignore stylesheets, so everything that has to render
 * must live in `style="…"`.
 *
 * Keep these templates plain, fast and partner-readable. No images, no
 * web-fonts: works on every client and renders in 5 KB.
 */
import type { Locale } from "@/lib/i18n";

const BRAND = "#2546E3";
const INK = "#0F172A";
const MUTED = "#64748B";
const LINE = "#E2E8F0";
const BG = "#F8FAFC";

function layout({
  locale,
  title,
  body,
  ctaUrl,
  ctaLabel,
  footer,
}: {
  locale: Locale;
  title: string;
  body: string;
  ctaUrl?: string;
  ctaLabel?: string;
  footer: string;
}): string {
  const dir = locale === "ar" ? "rtl" : "ltr";
  const fontStack = locale === "ar"
    ? `"IBM Plex Sans Arabic", "Inter", system-ui, sans-serif`
    : `"Inter", system-ui, -apple-system, "Segoe UI", sans-serif`;

  return `<!doctype html>
<html lang="${locale}" dir="${dir}">
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /><title>${escapeHtml(title)}</title></head>
<body style="margin:0;padding:0;background:${BG};font-family:${fontStack};color:${INK};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${BG};padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;background:#ffffff;border:1px solid ${LINE};border-radius:14px;overflow:hidden;">
        <tr><td style="padding:24px 28px 0 28px;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
            <td style="vertical-align:middle;">
              <span style="display:inline-block;width:28px;height:28px;border-radius:8px;background:${BRAND};color:#fff;font-weight:700;text-align:center;line-height:28px;font-size:16px;">L</span>
            </td>
            <td style="vertical-align:middle;padding-${dir === "rtl" ? "right" : "left"}:10px;font-weight:600;font-size:15px;color:${INK};">Lexoni<span style="color:${BRAND};">.ai</span></td>
          </tr></table>
        </td></tr>
        <tr><td style="padding:20px 28px 8px 28px;font-size:20px;font-weight:600;line-height:1.3;color:${INK};">${escapeHtml(title)}</td></tr>
        <tr><td style="padding:0 28px 12px 28px;font-size:14px;line-height:1.55;color:${INK};">${body}</td></tr>
        ${ctaUrl && ctaLabel ? `<tr><td style="padding:8px 28px 24px 28px;">
          <a href="${escapeHtml(ctaUrl)}" style="display:inline-block;background:${BRAND};color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;font-weight:600;font-size:14px;">${escapeHtml(ctaLabel)}</a>
        </td></tr>` : ""}
        <tr><td style="padding:16px 28px 22px 28px;border-top:1px solid ${LINE};font-size:12px;color:${MUTED};line-height:1.5;">${footer}</td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// ───────────────────────────────────────────────────────────────────────────
// Invite — sent when a partner invites a new colleague.
// ───────────────────────────────────────────────────────────────────────────
export function inviteEmail(args: {
  locale: Locale;
  inviteeName?: string | null;
  inviterName: string;
  firmName: string;
  roleLabel: string;
  acceptUrl: string;
  expiresOn: string;
}): { subject: string; html: string; text: string } {
  const ar = args.locale === "ar";
  const subject = ar
    ? `${args.inviterName} يدعوك للانضمام إلى ${args.firmName} على Lexoni.ai`
    : `${args.inviterName} invited you to ${args.firmName} on Lexoni.ai`;
  const greeting = args.inviteeName ? (ar ? `مرحباً ${args.inviteeName}،` : `Hi ${args.inviteeName},`) : (ar ? "مرحباً،" : "Hi,");
  const title = ar
    ? `الانضمام إلى ${args.firmName}`
    : `Join ${args.firmName}`;
  const body = ar
    ? `<p style="margin:0 0 12px 0;">${greeting}</p>
       <p style="margin:0 0 12px 0;">دعاك ${escapeHtml(args.inviterName)} للانضمام إلى <strong>${escapeHtml(args.firmName)}</strong> على Lexoni.ai كـ <strong>${escapeHtml(args.roleLabel)}</strong>.</p>
       <p style="margin:0 0 12px 0;">اضغط الزر أدناه لقبول الدعوة وإنشاء حسابك. الرابط صالح حتى ${escapeHtml(args.expiresOn)}.</p>`
    : `<p style="margin:0 0 12px 0;">${greeting}</p>
       <p style="margin:0 0 12px 0;"><strong>${escapeHtml(args.inviterName)}</strong> invited you to join <strong>${escapeHtml(args.firmName)}</strong> on Lexoni.ai as <strong>${escapeHtml(args.roleLabel)}</strong>.</p>
       <p style="margin:0 0 12px 0;">Click the button below to accept the invitation and create your account. The link is valid until ${escapeHtml(args.expiresOn)}.</p>`;
  const footer = ar
    ? `إن لم تكن تتوقع هذه الدعوة، يمكنك تجاهلها بأمان. Lexoni.ai — نظام تشغيل ممارسة مكاتب المحاماة الخليجية.`
    : `If you weren't expecting this invitation, you can safely ignore it. Lexoni.ai — the practice operating system for GCC law firms.`;
  const ctaLabel = ar ? "قبول الدعوة" : "Accept invitation";
  const html = layout({ locale: args.locale, title, body, ctaUrl: args.acceptUrl, ctaLabel, footer });
  const text = ar
    ? `${greeting}\n\n${args.inviterName} يدعوك للانضمام إلى ${args.firmName} كـ ${args.roleLabel}.\n\nاقبل الدعوة: ${args.acceptUrl}\n\nالرابط صالح حتى ${args.expiresOn}.`
    : `${greeting}\n\n${args.inviterName} invited you to ${args.firmName} as ${args.roleLabel}.\n\nAccept: ${args.acceptUrl}\n\nLink valid until ${args.expiresOn}.`;
  return { subject, html, text };
}

// ───────────────────────────────────────────────────────────────────────────
// Intake acknowledgement — sent within 60s of a new client submitting intake.
// ───────────────────────────────────────────────────────────────────────────
export function intakeAckEmail(args: {
  locale: Locale;
  contactName: string;
  firmName: string;
  reference: string;
  summary: string;
}): { subject: string; html: string; text: string } {
  const ar = args.locale === "ar";
  const subject = ar
    ? `استلمنا طلبك (${args.reference}) — ${args.firmName}`
    : `We've received your enquiry (${args.reference}) — ${args.firmName}`;
  const title = ar ? "شكراً لتواصلك معنا" : "Thanks for reaching out";
  const body = ar
    ? `<p style="margin:0 0 12px 0;">مرحباً ${escapeHtml(args.contactName)}،</p>
       <p style="margin:0 0 12px 0;">استلمنا طلبك في <strong>${escapeHtml(args.firmName)}</strong>. مرجع التواصل: <strong>${escapeHtml(args.reference)}</strong>.</p>
       <p style="margin:0 0 12px 0;">سيراجع شريك أقدم طلبك ويعود إليك خلال يوم عمل. ملخّصك أدناه للتأكيد:</p>
       <blockquote style="margin:0;padding:10px 14px;border-${ar ? "right" : "left"}:3px solid ${BRAND};color:${MUTED};">${escapeHtml(args.summary)}</blockquote>`
    : `<p style="margin:0 0 12px 0;">Hi ${escapeHtml(args.contactName)},</p>
       <p style="margin:0 0 12px 0;">We've received your enquiry at <strong>${escapeHtml(args.firmName)}</strong>. Your reference is <strong>${escapeHtml(args.reference)}</strong>.</p>
       <p style="margin:0 0 12px 0;">A senior partner will review and respond within one business day. Your summary, for confirmation:</p>
       <blockquote style="margin:0;padding:10px 14px;border-${ar ? "right" : "left"}:3px solid ${BRAND};color:${MUTED};">${escapeHtml(args.summary)}</blockquote>`;
  const footer = ar ? `Lexoni.ai — تنبيه: تم اكتشاف هذا الطلب تلقائياً وتم إخطار فريق ${args.firmName}.` : `Lexoni.ai — this acknowledgement was triggered automatically. The ${args.firmName} team has been notified.`;
  const html = layout({ locale: args.locale, title, body, footer });
  const text = ar
    ? `مرحباً ${args.contactName}،\n\nاستلمنا طلبك (مرجع: ${args.reference}). سيتم الرد خلال يوم عمل.\n\nملخصك:\n${args.summary}`
    : `Hi ${args.contactName},\n\nWe received your enquiry (ref: ${args.reference}). You'll get a response within one business day.\n\nYour summary:\n${args.summary}`;
  return { subject, html, text };
}

// ───────────────────────────────────────────────────────────────────────────
// DSR acknowledgement — required within 30 days under GDPR/UAE-PDPL/KSA-PDPL.
// ───────────────────────────────────────────────────────────────────────────
export function dsrAckEmail(args: {
  locale: Locale;
  subjectName: string;
  firmName: string;
  type: string;
  dueOn: string;
}): { subject: string; html: string; text: string } {
  const ar = args.locale === "ar";
  const subject = ar
    ? `استلمنا طلب بياناتك (${args.type}) — ${args.firmName}`
    : `Data request received (${args.type}) — ${args.firmName}`;
  const title = ar ? "استلمنا طلبك" : "We received your data request";
  const body = ar
    ? `<p style="margin:0 0 12px 0;">${escapeHtml(args.subjectName)}،</p>
       <p style="margin:0 0 12px 0;">استلمنا طلبك بنوع <strong>${escapeHtml(args.type)}</strong> في <strong>${escapeHtml(args.firmName)}</strong>.</p>
       <p style="margin:0 0 12px 0;">سنرد عليك خلال 30 يوماً (الموعد النهائي: <strong>${escapeHtml(args.dueOn)}</strong>) وفق GDPR وقوانين حماية البيانات في الإمارات والسعودية.</p>`
    : `<p style="margin:0 0 12px 0;">Dear ${escapeHtml(args.subjectName)},</p>
       <p style="margin:0 0 12px 0;">We received your <strong>${escapeHtml(args.type)}</strong> request at <strong>${escapeHtml(args.firmName)}</strong>.</p>
       <p style="margin:0 0 12px 0;">We'll respond within 30 days (statutory deadline: <strong>${escapeHtml(args.dueOn)}</strong>) under GDPR and the UAE / KSA PDPL.</p>`;
  const footer = ar ? `Lexoni.ai — للاستفسار، تواصل مع المسؤول عن حماية البيانات لدى المكتب.` : `Lexoni.ai — for questions, contact your firm's Data Protection Officer.`;
  const html = layout({ locale: args.locale, title, body, footer });
  const text = ar
    ? `${args.subjectName}،\n\nاستلمنا طلب بياناتك (${args.type}). الموعد النهائي للرد: ${args.dueOn}.`
    : `Dear ${args.subjectName},\n\nWe received your ${args.type} request. Statutory deadline: ${args.dueOn}.`;
  return { subject, html, text };
}

// ───────────────────────────────────────────────────────────────────────────
// Engagement letter — sent to the client for review + e-signature.
// ───────────────────────────────────────────────────────────────────────────
export function engagementLetterEmail(args: {
  locale: Locale;
  clientName: string;
  firmName: string;
  scope: string;
  feeArrangement: string;
  amount: string;
  viewUrl: string;
}): { subject: string; html: string; text: string } {
  const ar = args.locale === "ar";
  const subject = ar
    ? `خطاب التعاقد للمراجعة والتوقيع — ${args.firmName}`
    : `Engagement letter for review and signature — ${args.firmName}`;
  const title = ar ? "خطاب التعاقد جاهز للتوقيع" : "Your engagement letter is ready to sign";
  const body = ar
    ? `<p style="margin:0 0 12px 0;">${escapeHtml(args.clientName)}،</p>
       <p style="margin:0 0 12px 0;">أعدّ <strong>${escapeHtml(args.firmName)}</strong> خطاب التعاقد لمراجعتك. ملخّص النطاق:</p>
       <blockquote style="margin:0 0 12px 0;padding:10px 14px;border-${ar ? "right" : "left"}:3px solid ${BRAND};color:${MUTED};">${escapeHtml(args.scope)}</blockquote>
       <p style="margin:0 0 12px 0;"><strong>ترتيب الأتعاب:</strong> ${escapeHtml(args.feeArrangement)} · <strong>العرض:</strong> ${escapeHtml(args.amount)}</p>
       <p style="margin:0 0 12px 0;">اضغط على الزر للاطلاع على الخطاب الكامل والتوقيع الرقمي. الرابط يحمل توقيعك إلى المكتب فور قبولك.</p>`
    : `<p style="margin:0 0 12px 0;">Dear ${escapeHtml(args.clientName)},</p>
       <p style="margin:0 0 12px 0;"><strong>${escapeHtml(args.firmName)}</strong> has prepared an engagement letter for your review. Scope:</p>
       <blockquote style="margin:0 0 12px 0;padding:10px 14px;border-${ar ? "right" : "left"}:3px solid ${BRAND};color:${MUTED};">${escapeHtml(args.scope)}</blockquote>
       <p style="margin:0 0 12px 0;"><strong>Fee arrangement:</strong> ${escapeHtml(args.feeArrangement)} · <strong>Quote:</strong> ${escapeHtml(args.amount)}</p>
       <p style="margin:0 0 12px 0;">Click below to view the full letter and sign electronically. Your acceptance returns straight to the firm.</p>`;
  const footer = ar
    ? `Lexoni.ai — جميع التوقيعات الرقمية تحمل بصمة تشفيرية لإثبات السلامة.`
    : `Lexoni.ai — every signature is sealed with a tamper-evident cryptographic hash for audit.`;
  const ctaLabel = ar ? "اقرأ ووقّع الخطاب" : "Read and sign";
  const html = layout({ locale: args.locale, title, body, ctaUrl: args.viewUrl, ctaLabel, footer });
  const text = ar
    ? `${args.clientName}،\n\nخطاب التعاقد من ${args.firmName} جاهز للمراجعة والتوقيع.\n\nالنطاق: ${args.scope}\nترتيب الأتعاب: ${args.feeArrangement} — ${args.amount}\n\nاقرأ ووقّع: ${args.viewUrl}`
    : `Dear ${args.clientName},\n\nYour engagement letter from ${args.firmName} is ready to review and sign.\n\nScope: ${args.scope}\nFee: ${args.feeArrangement} — ${args.amount}\n\nRead and sign: ${args.viewUrl}`;
  return { subject, html, text };
}

// ───────────────────────────────────────────────────────────────────────────
// Sign-in magic link — sent when a returning lawyer requests sign-in.
// ───────────────────────────────────────────────────────────────────────────
export function signInLinkEmail(args: {
  locale: Locale;
  url: string;
  ttlMinutes: number;
}): { subject: string; html: string; text: string } {
  const ar = args.locale === "ar";
  const subject = ar ? "رابط تسجيل الدخول إلى Lexoni.ai" : "Your Lexoni.ai sign-in link";
  const title = ar ? "اضغط لتسجيل الدخول" : "Click to sign in";
  const body = ar
    ? `<p style="margin:0 0 12px 0;">طلبت رابط تسجيل دخول إلى Lexoni.ai.</p>
       <p style="margin:0 0 12px 0;">الرابط أدناه صالح لمدة ${args.ttlMinutes} دقيقة ويعمل مرة واحدة فقط.</p>
       <p style="margin:0 0 12px 0;">إن لم تطلب هذا الرابط، تجاهل البريد بأمان.</p>`
    : `<p style="margin:0 0 12px 0;">You requested a sign-in link for Lexoni.ai.</p>
       <p style="margin:0 0 12px 0;">The link below is valid for ${args.ttlMinutes} minutes and can only be used once.</p>
       <p style="margin:0 0 12px 0;">If you didn't request this, you can safely ignore the email.</p>`;
  const footer = ar
    ? `Lexoni.ai — لا تشارك هذا الرابط مع أحد.`
    : `Lexoni.ai — never share this link with anyone.`;
  const ctaLabel = ar ? "تسجيل الدخول" : "Sign in";
  const html = layout({ locale: args.locale, title, body, ctaUrl: args.url, ctaLabel, footer });
  const text = ar
    ? `طلبت رابط تسجيل دخول إلى Lexoni.ai. الرابط صالح لمدة ${args.ttlMinutes} دقيقة:\n\n${args.url}`
    : `You requested a sign-in link for Lexoni.ai. The link is valid for ${args.ttlMinutes} minutes:\n\n${args.url}`;
  return { subject, html, text };
}

// ───────────────────────────────────────────────────────────────────────────
// Sign request — per-party magic link for general signature workflows.
// ───────────────────────────────────────────────────────────────────────────
export function signRequestEmail(args: {
  locale: Locale;
  signerName: string;
  firmName: string;
  documentTitle: string;
  signUrl: string;
}): { subject: string; html: string; text: string } {
  const ar = args.locale === "ar";
  const subject = ar
    ? `طلب توقيع: ${args.documentTitle} — ${args.firmName}`
    : `Signature requested: ${args.documentTitle} — ${args.firmName}`;
  const title = ar ? "وثيقة بانتظار توقيعك" : "A document is waiting for your signature";
  const body = ar
    ? `<p style="margin:0 0 12px 0;">${escapeHtml(args.signerName)}،</p>
       <p style="margin:0 0 12px 0;">طلب <strong>${escapeHtml(args.firmName)}</strong> توقيعك على:</p>
       <p style="margin:0 0 12px 0;font-weight:600;color:${INK};">${escapeHtml(args.documentTitle)}</p>
       <p style="margin:0 0 12px 0;">اضغط أدناه لمراجعة النص والتوقيع الرقمي. كل توقيع يحمل بصمة تشفيرية لإثبات السلامة.</p>`
    : `<p style="margin:0 0 12px 0;">Hi ${escapeHtml(args.signerName)},</p>
       <p style="margin:0 0 12px 0;"><strong>${escapeHtml(args.firmName)}</strong> has requested your signature on:</p>
       <p style="margin:0 0 12px 0;font-weight:600;color:${INK};">${escapeHtml(args.documentTitle)}</p>
       <p style="margin:0 0 12px 0;">Click below to review and sign. Every signature is sealed with a tamper-evident certificate hash.</p>`;
  const footer = ar
    ? `Lexoni.ai — إن كنت لا تنتظر هذا الطلب، تجاهل البريد بأمان.`
    : `Lexoni.ai — if you weren't expecting this, you can safely ignore the email.`;
  const ctaLabel = ar ? "مراجعة والتوقيع" : "Review and sign";
  const html = layout({ locale: args.locale, title, body, ctaUrl: args.signUrl, ctaLabel, footer });
  const text = ar
    ? `${args.signerName}،\n\nطلب ${args.firmName} توقيعك على ${args.documentTitle}.\n\nراجع ووقّع: ${args.signUrl}`
    : `Hi ${args.signerName},\n\n${args.firmName} requested your signature on ${args.documentTitle}.\n\nReview and sign: ${args.signUrl}`;
  return { subject, html, text };
}

// ───────────────────────────────────────────────────────────────────────────
// Invoice issued — sent to the client when a new invoice is created from WIP.
// ───────────────────────────────────────────────────────────────────────────
export function invoiceIssuedEmail(args: {
  locale: Locale;
  clientName: string;
  firmName: string;
  number: string;
  amount: string;
  dueOn: string;
  matterTitle: string;
  payUrl?: string;
}): { subject: string; html: string; text: string } {
  const ar = args.locale === "ar";
  const subject = ar
    ? `فاتورة ${args.number} من ${args.firmName} — ${args.amount}`
    : `Invoice ${args.number} from ${args.firmName} — ${args.amount}`;
  const title = ar ? `فاتورة جديدة: ${args.number}` : `New invoice: ${args.number}`;
  const body = ar
    ? `<p style="margin:0 0 12px 0;">${escapeHtml(args.clientName)}،</p>
       <p style="margin:0 0 12px 0;">صدرت فاتورة جديدة لقضية <strong>${escapeHtml(args.matterTitle)}</strong> بقيمة <strong>${escapeHtml(args.amount)}</strong>.</p>
       <p style="margin:0 0 12px 0;">موعد الاستحقاق: <strong>${escapeHtml(args.dueOn)}</strong>.</p>`
    : `<p style="margin:0 0 12px 0;">Dear ${escapeHtml(args.clientName)},</p>
       <p style="margin:0 0 12px 0;">A new invoice has been issued for matter <strong>${escapeHtml(args.matterTitle)}</strong> for <strong>${escapeHtml(args.amount)}</strong>.</p>
       <p style="margin:0 0 12px 0;">Due on <strong>${escapeHtml(args.dueOn)}</strong>.</p>`;
  const footer = ar ? `Lexoni.ai — يمكنك الرد على هذا البريد للأسئلة المتعلقة بالفوترة.` : `Lexoni.ai — reply to this email with any billing questions.`;
  const html = layout({ locale: args.locale, title, body, ctaUrl: args.payUrl, ctaLabel: args.payUrl ? (ar ? "عرض الفاتورة" : "View invoice") : undefined, footer });
  const text = ar
    ? `${args.clientName}،\n\nفاتورة ${args.number} لقضية ${args.matterTitle}: ${args.amount}. مستحقة في ${args.dueOn}.`
    : `Dear ${args.clientName},\n\nInvoice ${args.number} for ${args.matterTitle}: ${args.amount}. Due ${args.dueOn}.`;
  return { subject, html, text };
}
