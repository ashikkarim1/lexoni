/**
 * Text chunking + lexical term extraction.
 *
 * We chunk on paragraph boundaries (or sentence boundaries inside very long
 * paragraphs) targeting ~1500 characters per chunk. Smaller than that means
 * too much per-chunk overhead at retrieval; larger means the AI ends up with
 * unfocused context that hurts answer precision.
 *
 * `extractTerms` produces a compact, sorted-unique array of ≥4-character
 * lower-cased tokens used by the BM25-ish lexical scorer when no embedding
 * is available. Same fingerprint at index time + query time → consistent
 * scoring without needing to keep the full text on the read path.
 */

const CHUNK_TARGET = 1500;
const CHUNK_HARD_MAX = 2200;
const STOPWORDS = new Set([
  "the", "and", "for", "with", "from", "this", "that", "their", "such",
  "have", "been", "shall", "will", "into", "upon", "between", "which",
  "where", "when", "what", "while", "they", "them", "those", "these",
  "there", "than", "then", "more", "less", "also", "only", "any",
  "all", "but", "not", "are", "was", "were", "has", "had", "had", "may",
  "must", "should", "would", "could", "can", "his", "her", "its",
]);

export function chunkText(text: string): string[] {
  if (!text) return [];
  const paragraphs = text
    .replace(/\r\n/g, "\n")
    .split(/\n{2,}/g)
    .map((p) => p.trim())
    .filter(Boolean);

  const out: string[] = [];
  let buf = "";

  const flush = () => {
    const t = buf.trim();
    if (t) out.push(t);
    buf = "";
  };

  for (const p of paragraphs) {
    if (p.length >= CHUNK_HARD_MAX) {
      // Sentence-split very long paragraphs.
      flush();
      let sbuf = "";
      for (const s of p.split(/(?<=[.!?])\s+/g)) {
        if ((sbuf + " " + s).length > CHUNK_TARGET) {
          if (sbuf.trim()) out.push(sbuf.trim());
          sbuf = s;
        } else {
          sbuf = sbuf ? sbuf + " " + s : s;
        }
      }
      if (sbuf.trim()) out.push(sbuf.trim());
      continue;
    }
    if ((buf + "\n\n" + p).length > CHUNK_TARGET) {
      flush();
      buf = p;
    } else {
      buf = buf ? buf + "\n\n" + p : p;
    }
  }
  flush();
  return out;
}

export function extractTerms(text: string): string[] {
  const set = new Set<string>();
  for (const raw of text.toLowerCase().split(/[^a-zA-Z0-9؀-ۿ]+/g)) {
    if (raw.length < 4) continue;
    if (STOPWORDS.has(raw)) continue;
    set.add(raw);
  }
  return [...set].sort();
}
