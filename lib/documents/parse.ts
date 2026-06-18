/**
 * Document parsers — pull text + page map out of PDFs and Word docs.
 *
 * Returns the raw `text` (concatenated) and a `pageMap` for PDFs. DOCX files
 * don't expose a page model in the .docx XML, so `pageMap` is null.
 *
 * Capped at ~10 MB of extracted text — anything longer than that and the AI
 * context costs spiral; large documents should be chunked at retrieval time.
 */

const MAX_TEXT_BYTES = 10 * 1024 * 1024;

export type PageEntry = { page: number; text: string };

export type ParseResult = {
  text: string;
  html: string | null;
  pages: number | null;
  pageMap: PageEntry[] | null;
};

export async function parseDocument(mime: string, bytes: Buffer): Promise<ParseResult> {
  if (mime === "application/pdf") return parsePdf(bytes);
  if (
    mime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    mime === "application/msword"
  ) {
    return parseDocx(bytes);
  }
  if (mime === "text/plain" || mime === "text/markdown") {
    const text = capText(bytes.toString("utf-8"));
    return { text, html: null, pages: null, pageMap: null };
  }
  throw new Error(`Unsupported mime type: ${mime}`);
}

async function parsePdf(bytes: Buffer): Promise<ParseResult> {
  // pdf-parse v2 exposes a class. Dynamic import keeps it out of the edge bundle.
  const { PDFParse } = await import("pdf-parse");
  // PDFParse converts Buffer → Uint8Array internally. We pass the raw buffer.
  const parser = new PDFParse({ data: bytes });
  try {
    const result = await parser.getText();
    // result.pages is the per-page array; result.text is the concatenated string.
    const pageMap: PageEntry[] = (result.pages ?? []).map((p, i) => ({
      page: p.num ?? i + 1,
      text: (p.text ?? "").trim(),
    }));
    const text = capText((result.text ?? "").trim());
    const pages = result.total ?? pageMap.length;
    return { text, html: null, pages: pages || null, pageMap: pageMap.length ? pageMap : null };
  } finally {
    await parser.destroy().catch(() => {});
  }
}

async function parseDocx(bytes: Buffer): Promise<ParseResult> {
  const mammoth = await import("mammoth");
  // Two passes: HTML for the inline viewer (preserves headings + lists +
  // paragraph breaks), raw text for the AI context (no markup tokens to burn).
  const [rawResult, htmlResult] = await Promise.all([
    mammoth.extractRawText({ buffer: bytes }),
    mammoth.convertToHtml({ buffer: bytes }),
  ]);
  return {
    text: capText(rawResult.value),
    html: htmlResult.value,
    pages: null,
    pageMap: null,
  };
}

function capText(text: string): string {
  if (text.length <= MAX_TEXT_BYTES) return text;
  return text.slice(0, MAX_TEXT_BYTES);
}
