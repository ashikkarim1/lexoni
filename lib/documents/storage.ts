/**
 * File storage. In dev we write to `.uploads/` under the repo root. In prod
 * this swaps to S3 (signed URLs out, server-side put). The interface is the
 * same so callers don't care.
 *
 * Storage URL grammar:
 *   file://<id>.<ext>       — local fs, resolved against .uploads/
 *   s3://<bucket>/<key>     — production object store
 */
import { promises as fs } from "node:fs";
import * as path from "node:path";
import { createHash } from "node:crypto";

const UPLOAD_DIR = path.resolve(process.cwd(), ".uploads");

export type StoredFile = {
  storageUrl: string;
  sha256: string;
  bytes: number;
};

export async function putBytes(id: string, ext: string, bytes: Buffer): Promise<StoredFile> {
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  const filename = `${id}.${ext.replace(/^\./, "")}`;
  await fs.writeFile(path.join(UPLOAD_DIR, filename), bytes);
  return {
    storageUrl: `file://${filename}`,
    sha256: createHash("sha256").update(bytes).digest("hex"),
    bytes: bytes.length,
  };
}

export async function getBytes(storageUrl: string): Promise<Buffer> {
  if (storageUrl.startsWith("file://")) {
    const filename = storageUrl.slice("file://".length);
    return fs.readFile(path.join(UPLOAD_DIR, filename));
  }
  throw new Error(`Unsupported storage URL: ${storageUrl}`);
}

export function extFromMime(mime: string, filename: string): string {
  if (mime === "application/pdf") return "pdf";
  if (mime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") return "docx";
  if (mime === "application/msword") return "doc";
  if (mime === "text/plain") return "txt";
  if (mime === "text/markdown") return "md";
  const e = path.extname(filename).slice(1).toLowerCase();
  return e || "bin";
}
