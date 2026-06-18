/**
 * Minimal markdown → safe HTML for the engagement-letter public viewer + any
 * partner-facing markdown display. Deliberately small (≈ 150 lines): no
 * heredocs, no extensions, no third-party CSS. The `prose-render` class in
 * globals.css does the rest.
 *
 * Supports: # ## ### #### headings, **bold**, *italic*, `code`, code blocks
 * (fenced), unordered + ordered lists, blockquotes, horizontal rules, tables
 * (pipe-delimited with header separator), and paragraph wrapping. Every
 * inserted string passes through `esc()` first.
 */

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function inline(s: string): string {
  // escape first, then re-apply inline formatting on the escaped text
  let out = esc(s);
  out = out.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  out = out.replace(/(^|\W)\*(.+?)\*(?=\W|$)/g, "$1<em>$2</em>");
  out = out.replace(/`([^`]+)`/g, "<code>$1</code>");
  // Naive autolinker for the absolute URLs we render (no email).
  out = out.replace(/(https?:\/\/[^\s<)\]]+)/g, '<a href="$1" rel="noopener noreferrer" target="_blank">$1</a>');
  return out;
}

export function renderMarkdown(src: string): string {
  if (!src) return "";
  const lines = src.replace(/\r\n/g, "\n").split("\n");
  const out: string[] = [];
  let i = 0;
  let inCode = false;
  let codeLang = "";
  const codeBuf: string[] = [];

  const flushPara = (buf: string[]) => {
    if (buf.length === 0) return;
    out.push(`<p>${buf.map(inline).join(" ")}</p>`);
    buf.length = 0;
  };

  const paraBuf: string[] = [];

  while (i < lines.length) {
    const line = lines[i];

    // Code fence
    if (/^```/.test(line)) {
      flushPara(paraBuf);
      if (!inCode) {
        inCode = true;
        codeLang = line.replace(/^```\s*/, "").trim();
        i++;
        continue;
      } else {
        out.push(`<pre><code${codeLang ? ` class="lang-${esc(codeLang)}"` : ""}>${esc(codeBuf.join("\n"))}</code></pre>`);
        codeBuf.length = 0;
        codeLang = "";
        inCode = false;
        i++;
        continue;
      }
    }
    if (inCode) { codeBuf.push(line); i++; continue; }

    // HR
    if (/^\s*---+\s*$/.test(line)) {
      flushPara(paraBuf);
      out.push("<hr />");
      i++; continue;
    }

    // Heading
    const h = line.match(/^(#{1,4})\s+(.*)$/);
    if (h) {
      flushPara(paraBuf);
      const level = h[1].length;
      out.push(`<h${level}>${inline(h[2])}</h${level}>`);
      i++; continue;
    }

    // Blockquote
    if (/^>\s?/.test(line)) {
      flushPara(paraBuf);
      const buf: string[] = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) {
        buf.push(lines[i].replace(/^>\s?/, ""));
        i++;
      }
      out.push(`<blockquote>${buf.map(inline).join(" ")}</blockquote>`);
      continue;
    }

    // Table — leader row must contain `|`, next row must be separator
    if (line.includes("|") && lines[i + 1] && /^\s*\|?[-\s|:]+\|?\s*$/.test(lines[i + 1])) {
      flushPara(paraBuf);
      const header = splitRow(line);
      i += 2;
      const rows: string[][] = [];
      while (i < lines.length && lines[i].includes("|") && lines[i].trim() !== "") {
        rows.push(splitRow(lines[i]));
        i++;
      }
      const thead = `<thead><tr>${header.map((c) => `<th>${inline(c)}</th>`).join("")}</tr></thead>`;
      const tbody = `<tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${inline(c)}</td>`).join("")}</tr>`).join("")}</tbody>`;
      out.push(`<table>${thead}${tbody}</table>`);
      continue;
    }

    // Unordered list
    if (/^\s*[-*]\s+/.test(line)) {
      flushPara(paraBuf);
      const items: string[] = [];
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*[-*]\s+/, ""));
        i++;
      }
      out.push(`<ul>${items.map((it) => `<li>${inline(it)}</li>`).join("")}</ul>`);
      continue;
    }

    // Ordered list
    if (/^\s*\d+\.\s+/.test(line)) {
      flushPara(paraBuf);
      const items: string[] = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*\d+\.\s+/, ""));
        i++;
      }
      out.push(`<ol>${items.map((it) => `<li>${inline(it)}</li>`).join("")}</ol>`);
      continue;
    }

    if (line.trim() === "") {
      flushPara(paraBuf);
      i++; continue;
    }

    paraBuf.push(line);
    i++;
  }
  flushPara(paraBuf);
  return out.join("\n");
}

function splitRow(line: string): string[] {
  return line.replace(/^\s*\|/, "").replace(/\|\s*$/, "").split("|").map((c) => c.trim());
}
