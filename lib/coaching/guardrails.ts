/**
 * Pre-action mistake-prevention checklists for destructive / terminal actions.
 *
 * Shown by `<PreActionGuard>` before send-for-signature / mark-signed flows
 * when coaching mode is on. Each item is something a junior commonly forgets;
 * once they tick it off, the underlying action is allowed to fire.
 */
export type Guardrail = {
  /** Stable identifier — used by the dismiss/seen tracker if you want to skip after N successful uses. */
  id: string;
  title: { en: string; ar: string };
  body: { en: string; ar: string };
  checklist: Array<{ en: string; ar: string }>;
};

export const GUARDRAILS: Record<string, Guardrail> = {
  send_for_signature: {
    id: "send_for_signature",
    title: {
      en: "Before you send for signature",
      ar: "قبل الإرسال للتوقيع",
    },
    body: {
      en: "Once it's out, you can't easily pull it back. Run the quick check first.",
      ar: "بمجرد الإرسال يصعب الاسترجاع. أجرِ التحقّق السريع أولاً.",
    },
    checklist: [
      { en: "Party names + titles match the canonical client record.", ar: "أسماء الأطراف وألقابهم تطابق سجل العميل الرئيسي." },
      { en: "Dates, amounts and currency are correct.", ar: "التواريخ والمبالغ والعملة صحيحة." },
      { en: "Governing law and jurisdiction clauses match the matter.", ar: "بنود القانون الحاكم والاختصاص تطابق القضية." },
      { en: "A senior has reviewed at least the operative clauses.", ar: "راجَع محامٍ أقدم على الأقل البنود التنفيذية." },
    ],
  },
  mark_signed: {
    id: "mark_signed",
    title: {
      en: "Confirm full execution",
      ar: "تأكيد التوقيع الكامل",
    },
    body: {
      en: "Marking signed updates billing, compliance counters and the audit trail.",
      ar: "وسم التوقيع يحدّث الفوترة وعدّادات الامتثال وسجل التدقيق.",
    },
    checklist: [
      { en: "Executed PDF received and saved to the matter.", ar: "استُلمت نسخة PDF موقّعة وحُفظت في القضية." },
      { en: "All required parties signed (no missing counter-signature).", ar: "وقّع جميع الأطراف المطلوبين (لا يوجد توقيع متبادل ناقص)." },
      { en: "Original wet-ink copy archived if required by jurisdiction.", ar: "أُرشِفت النسخة الأصلية بالحبر إن كان ذلك مطلوباً في الاختصاص." },
    ],
  },
};
