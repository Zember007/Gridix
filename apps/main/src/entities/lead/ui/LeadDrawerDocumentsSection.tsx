import { useState, type FC } from "react";
import { useTranslation } from "react-i18next";
import { ExternalLink, FileText, Loader2, Trash2 } from "lucide-react";
import { FileDropzone } from "@gridix/ui";
import { showToast } from "@gridix/utils/lib";
import { supabase } from "@/shared/api/supabase";
import type { LeadDocumentAttachment } from "@/entities/crm/model/types";

const BUCKET = "project-files";
const MAX_BYTES = 25 * 1024 * 1024;

function sanitizeFileName(name: string) {
  return name
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .slice(0, 180);
}

interface LeadDrawerDocumentsSectionProps {
  leadId: string;
  documents: LeadDocumentAttachment[];
  readOnly?: boolean;
  onDocumentsChange: (next: LeadDocumentAttachment[]) => void;
}

export const LeadDrawerDocumentsSection: FC<
  LeadDrawerDocumentsSectionProps
> = ({ leadId, documents, readOnly = false, onDocumentsChange }) => {
  const { t } = useTranslation();
  const [uploadBusy, setUploadBusy] = useState(false);

  const uploadFiles = async (incoming: File[]) => {
    if (readOnly || incoming.length === 0) return;
    setUploadBusy(true);

    try {
      const appended: LeadDocumentAttachment[] = [];
      for (const file of incoming) {
        if (file.size > MAX_BYTES) {
          showToast(
            "error",
            t("leads.drawer.documentsTitle"),
            t("leads.drawer.documentsTooLarge"),
          );
          continue;
        }
        const safe = sanitizeFileName(file.name || "document");
        const path = `lead-documents/${leadId}/${crypto.randomUUID()}_${safe}`;
        const { error: upErr } = await supabase.storage
          .from(BUCKET)
          .upload(path, file, {
            cacheControl: "3600",
            upsert: false,
            contentType: file.type || "application/octet-stream",
          });
        if (upErr) throw upErr;

        const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
        if (!data?.publicUrl) throw new Error("missing_public_url");

        appended.push({
          id: crypto.randomUUID(),
          name: file.name,
          storagePath: path,
          url: data.publicUrl,
          createdAt: new Date().toISOString(),
          size: file.size,
        });
      }

      if (appended.length > 0) {
        onDocumentsChange([...(documents ?? []), ...appended]);
        showToast(
          "success",
          t("leads.drawer.documentsUploadDoneTitle"),
          t("leads.drawer.documentsUploadDoneDesc"),
        );
      }
    } catch (e) {
      console.error("Lead document upload failed", e);
      showToast(
        "error",
        t("leads.toast.error.title"),
        t("leads.drawer.documentsUploadFailed"),
      );
    } finally {
      setUploadBusy(false);
    }
  };

  const removeDocument = async (doc: LeadDocumentAttachment) => {
    if (readOnly) return;
    try {
      const { error } = await supabase.storage
        .from(BUCKET)
        .remove([doc.storagePath]);
      if (error) {
        console.warn("Storage delete warning (may be already removed)", error);
      }
      onDocumentsChange(documents.filter((d) => d.id !== doc.id));
      showToast("success", t("leads.drawer.documentsDeletedTitle"));
    } catch (e) {
      console.error("Lead document delete failed", e);
      showToast(
        "error",
        t("leads.toast.error.title"),
        t("leads.drawer.documentsDeleteFailed"),
      );
    }
  };

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      {!readOnly && (
        <FileDropzone
          size="compact"
          multiple
          disabled={uploadBusy}
          heading={t("leads.drawer.documentsHeading")}
          description={t("leads.drawer.documentsDescription")}
          idleLabel={t("leads.drawer.documentsIdle")}
          dropLabel={t("leads.drawer.documentsDrop")}
          className="focus-visible:ring-[var(--admin-primary)]/25 rounded-2xl border border-dashed border-[var(--admin-border)] bg-[var(--admin-card-background)] transition-[border-color,box-shadow] duration-200 focus-visible:outline-none focus-visible:ring-2"
          onFilesSelected={(files) => void uploadFiles(files)}
        />
      )}

      {uploadBusy ? (
        <div className="flex items-center justify-center gap-2 rounded-xl border border-[var(--admin-border)] bg-white py-6 text-xs font-medium text-[var(--admin-text-secondary)]">
          <Loader2 className="h-4 w-4 animate-spin text-[var(--admin-primary)]" />
          {t("leads.drawer.documentsUploading")}
        </div>
      ) : null}

      {!documents?.length ? (
        <div className="rounded-2xl border border-[var(--admin-border-light)] bg-white px-4 py-8 text-center text-sm text-[var(--admin-text-secondary)]">
          {readOnly
            ? t("leads.drawer.documentsEmptyReadOnly")
            : t("leads.drawer.documentsEmpty")}
        </div>
      ) : (
        <ul className="space-y-2">
          {documents.map((doc) => (
            <li
              key={doc.id}
              className="flex items-center gap-3 rounded-xl border border-[var(--admin-border)] bg-white px-3 py-2.5 shadow-sm"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--admin-background-secondary)] text-[var(--admin-primary)]">
                <FileText size={16} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-xs font-semibold text-[var(--admin-text-primary)]">
                  {doc.name}
                </div>
                {typeof doc.size === "number" && doc.size > 0 ? (
                  <div className="text-[10px] text-[var(--admin-text-secondary)]">
                    {(doc.size / (1024 * 1024)).toFixed(2)} MB
                  </div>
                ) : null}
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <a
                  href={doc.url}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-lg p-2 text-[var(--admin-text-secondary)] transition-colors hover:bg-[var(--admin-background-secondary)] hover:text-[var(--admin-primary)]"
                  title={t("leads.drawer.documentsOpen")}
                >
                  <ExternalLink size={16} />
                </a>
                {!readOnly && (
                  <button
                    type="button"
                    onClick={() => void removeDocument(doc)}
                    className="rounded-lg p-2 text-[var(--admin-text-secondary)] transition-colors hover:bg-red-50 hover:text-red-600"
                    title={t("leads.drawer.documentsRemove")}
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
