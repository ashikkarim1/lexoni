"use client";
import { useState } from "react";
import { FileText, Download, AlertCircle, Clock } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { t, type Locale } from "@/lib/i18n";
import type { DocumentRow } from "@/lib/data/documents";
import { UploadDropzone } from "./UploadDropzone";
import { DocumentViewer } from "./DocumentViewer";
import { DocumentInsights } from "./DocumentInsights";
import { VersionCompare } from "./VersionCompare";

/**
 * Preview panel for a slot's uploaded documents. Until Sprint #2 ships the
 * real PDF/DOCX viewer this shows:
 *   • the current version's metadata (filename, version, pages, status)
 *   • a "Replace with a new version" inline upload zone
 *   • the first ~1,200 characters of extracted text as a sanity check
 * It links the bytes endpoint so a partner can download the original.
 */
export function DocumentPreview({
  locale,
  caseId,
  matterSlotId,
  documents,
}: {
  locale: Locale;
  caseId: string;
  matterSlotId: string;
  documents: DocumentRow[];
}) {
  const current = documents.find((d) => d.isCurrent) ?? documents[0];

  if (!current) {
    return (
      <UploadDropzone locale={locale} caseId={caseId} matterSlotId={matterSlotId} />
    );
  }

  const sizeLabel = current.bytes < 1024
    ? `${current.bytes} B`
    : current.bytes < 1024 * 1024
      ? `${(current.bytes / 1024).toFixed(0)} KB`
      : `${(current.bytes / 1024 / 1024).toFixed(1)} MB`;

  return (
    <div className="space-y-4">
      <div className="card p-5">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary-100 text-primary-700 flex items-center justify-center shrink-0">
            <FileText className="h-5 w-5" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="font-semibold text-ink truncate">{current.filename}</div>
              <Badge tone="info">{current.version}</Badge>
              <StatusBadge locale={locale} status={current.status} />
            </div>
            <div className="text-caption text-muted mt-1 flex items-center gap-3">
              <span>{sizeLabel}</span>
              {current.pages != null && <span>· {t(locale, "documents.preview.pages", { n: current.pages })}</span>}
              <span>· {new Date(current.uploadedAt as unknown as string | Date).toISOString().slice(0, 10)}</span>
              {documents.length > 1 && <span>· {t(locale, "documents.preview.versionCount", { n: documents.length })}</span>}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <VersionCompare locale={locale} documents={documents} />
            <a
              href={`/api/documents/${current.id}`}
              target="_blank"
              rel="noreferrer"
              className="btn-secondary btn-sm"
            >
              <Download className="h-3.5 w-3.5" aria-hidden />
              {t(locale, "documents.preview.download")}
            </a>
          </div>
        </div>

        {current.status === "failed" && current.parseError && (
          <div className="mt-3 inline-flex items-start gap-1.5 text-caption text-danger-700">
            <AlertCircle className="h-3.5 w-3.5 mt-0.5" aria-hidden />
            {t(locale, "documents.preview.parseFailed")} - {current.parseError}
          </div>
        )}
      </div>

      {current.status === "ready" && (
        <>
          <DocumentInsights locale={locale} documentId={current.id} />
          <DocumentViewer
            locale={locale}
            documentId={current.id}
            mime={current.mime}
            filename={current.filename}
          />
        </>
      )}

      <div>
        <div className="sec-title mb-2">{t(locale, "documents.preview.uploadNewVersion")}</div>
        <UploadDropzone locale={locale} caseId={caseId} matterSlotId={matterSlotId} compact />
      </div>
    </div>
  );
}

function StatusBadge({ locale, status }: { locale: Locale; status: string }) {
  if (status === "ready")   return <Badge tone="success">{t(locale, "documents.preview.status.ready")}</Badge>;
  if (status === "parsing") return <Badge tone="warning"><Clock className="h-3 w-3" aria-hidden /> {t(locale, "documents.preview.status.parsing")}</Badge>;
  if (status === "failed")  return <Badge tone="danger">{t(locale, "documents.preview.status.failed")}</Badge>;
  return <Badge tone="neutral">{t(locale, "documents.preview.status.uploaded")}</Badge>;
}
