import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AlertCircle, FileText, Upload, ExternalLink } from "lucide-react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@gridix/ui";
import type { Template } from "../model/types";
import { toast } from "sonner";

type TFunction = (key: string) => string;

interface DocxNativeEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  template: Template | null;
  onSave: (params: { template: Template; file: File }) => Promise<void>;
  isLoading: boolean;
  t: TFunction;
}

export const DocxNativeEditorModal: React.FC<DocxNativeEditorModalProps> = ({
  isOpen,
  onClose,
  template,
  onSave,
  isLoading,
  t,
}) => {
  const [loadingDoc, setLoadingDoc] = useState(false);
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [activeFile, setActiveFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!isOpen || !template) return;
    setModalError(null);
    setActiveFile(null);
    if (inputRef.current) inputRef.current.value = "";
    if (!template.url) return;
    void (async () => {
      setLoadingDoc(true);
      try {
        const response = await fetch(template.url as string, {
          cache: "no-store",
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const blob = await response.blob();
        const file = new File([blob], template.name, {
          type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        });
        setActiveFile(file);
      } catch (e) {
        console.error("Template download failed", e);
        setModalError(t("partners.generalConditions.errorDownload"));
      } finally {
        setLoadingDoc(false);
      }
    })();
  }, [isOpen, t, template]);

  const handleSubmit = async () => {
    if (!template || !activeFile) return;
    setSaving(true);
    try {
      const file = new File([await activeFile.arrayBuffer()], template.name, {
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      });
      await onSave({ template, file });
      onClose();
    } catch (e) {
      console.error("Template save failed", e);
      setModalError(t("partners.generalConditions.errorSaveTemplate"));
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen || !template) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="flex h-[88vh] max-w-7xl flex-col overflow-hidden">
        <DialogHeader className="shrink-0">
          <DialogTitle>
            {t("partners.generalConditions.editorTitle")}
          </DialogTitle>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto py-2">
          <div className="rounded-xl border border-slate-200 bg-white">
            <div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3">
              <div className="min-w-0">
                <div className="truncate text-sm font-bold text-slate-900">
                  {template.name}
                </div>
                <p className="text-xs text-slate-500">
                  {t("partners.generalConditions.wordDocument")}
                </p>
              </div>
            </div>

            <div className="p-4">
              {(loadingDoc || isLoading) && (
                <div className="mb-3 text-xs font-semibold text-slate-500">
                  {t("partners.generalConditions.loadingDocument")}
                </div>
              )}
              {modalError && (
                <div className="mb-3 text-xs font-semibold text-red-500">
                  {modalError}
                </div>
              )}

              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4">
                <div className="text-sm font-semibold text-slate-800">
                  {activeFile?.name ||
                    t("partners.generalConditions.uploadFile")}
                </div>
                <div className="mt-1 text-xs text-slate-500">
                  {activeFile
                    ? `${Math.ceil(activeFile.size / 1024)} KB`
                    : ".docx"}
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => inputRef.current?.click()}
                  >
                    <Upload size={14} className="mr-2" />
                    {t("partners.generalConditions.uploadFile")}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={async () => {
                      const url = prompt(
                        t(
                          "partners.generalConditions.documentLinkPlaceholder",
                        ) || "Google Doc link",
                      );
                      if (!url) return;
                      const match = url.match(
                        /docs\.google\.com\/document\/d\/([a-zA-Z0-9_-]+)/,
                      );
                      const docId = match?.[1];
                      if (!docId) {
                        toast.error(
                          t(
                            "partners.generalConditions.googleImportInvalidLink",
                          ) || "Invalid link",
                        );
                        return;
                      }
                      setLoadingDoc(true);
                      setModalError(null);
                      try {
                        const exportUrl = `https://docs.google.com/document/d/${docId}/export?format=docx`;
                        let res = await fetch(exportUrl, {
                          mode: "cors",
                          credentials: "omit",
                        });
                        if (!res.ok) {
                          const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(exportUrl)}`;
                          res = await fetch(proxyUrl);
                        }
                        if (!res.ok) throw new Error(`HTTP ${res.status}`);
                        const arrayBuffer = await res.arrayBuffer();
                        const file = new File(
                          [arrayBuffer],
                          activeFile?.name || template?.name || "imported.docx",
                          {
                            type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                          },
                        );
                        setActiveFile(file);
                      } catch (e) {
                        console.error("Google Docs fetch failed", e);
                        setModalError(
                          t(
                            "partners.generalConditions.googleImportComingSoon",
                          ) || "Failed import",
                        );
                      } finally {
                        setLoadingDoc(false);
                      }
                    }}
                  >
                    <ExternalLink size={14} className="mr-2" />
                    {t("partners.generalConditions.importGoogleDocs")}
                  </Button>
                </div>
                <input
                  ref={inputRef}
                  type="file"
                  accept=".docx"
                  className="hidden"
                  onChange={(e) => {
                    const next = e.target.files?.[0] ?? null;
                    if (!next) return;
                    setActiveFile(next);
                  }}
                />
                <p className="mt-4 text-xs text-slate-500">
                  {t("partners.generalConditions.templatesHowText")}
                </p>
                {template.url && (
                  <a
                    href={template.url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-flex items-center text-xs font-semibold text-slate-500 underline hover:text-slate-700"
                  >
                    <FileText size={12} className="mr-1" />
                    {t("partners.generalConditions.downloadDocx")}
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="shrink-0">
          <Button variant="ghost" onClick={onClose}>
            {t("partners.generalConditions.cancel")}
          </Button>
          <Button
            onClick={() => void handleSubmit()}
            disabled={saving || isLoading || loadingDoc || !activeFile}
          >
            {saving
              ? t("partners.generalConditions.save")
              : t("partners.generalConditions.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
