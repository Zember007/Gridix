import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AlertCircle, FileText, Upload } from "lucide-react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@gridix/ui";
import type { Template } from "../model/types";
import PizZip from "pizzip";
import { toast } from "sonner";

type TFunction = (key: string) => string;

interface DocxNativeEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  template: Template | null;
  onSave: (params: {
    template: Template;
    file: File;
    lang: string;
  }) => Promise<void>;
  isLoading: boolean;
  t: TFunction;
  variables: Array<{ key: string; label: string }>;
}

export const DocxNativeEditorModal: React.FC<DocxNativeEditorModalProps> = ({
  isOpen,
  onClose,
  template,
  onSave,
  isLoading,
  t,
  variables,
}) => {
  const [lang, setLang] = useState("RU");
  const [loadingDoc, setLoadingDoc] = useState(false);
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [activeFile, setActiveFile] = useState<File | null>(null);
  const [detectedVariables, setDetectedVariables] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const regex = useMemo(() => /\{\{\{?\s*([a-zA-Z0-9_.-]+)\s*\}?\}\}/g, []);
  const allVariables = useMemo(() => {
    const map = new Map<string, { key: string; label: string }>();
    for (const v of variables) {
      map.set(v.key, v);
    }
    for (const v of detectedVariables) {
      const key = `{{${v}}}`;
      if (!map.has(key)) map.set(key, { key, label: v });
    }
    return Array.from(map.values());
  }, [detectedVariables, variables]);

  const parseVariablesFromDocx = useCallback(
    async (file: File) => {
      const binary = await file.arrayBuffer();
      const zip = new PizZip(binary);
      const xml =
        zip.file("word/document.xml")?.asText() ||
        zip.file("word/header1.xml")?.asText() ||
        "";
      const matched = Array.from(xml.matchAll(regex)).map((m) => m[1] || "");
      const unique = Array.from(new Set(matched.filter(Boolean)));
      setDetectedVariables(unique);
    },
    [regex],
  );

  useEffect(() => {
    if (!isOpen || !template) return;
    setLang(template.lang || "RU");
    setModalError(null);
    setActiveFile(null);
    setDetectedVariables([]);
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
        await parseVariablesFromDocx(file);
      } catch (e) {
        console.error("Template download failed", e);
        setModalError(t("partners.generalConditions.errorDownload"));
      } finally {
        setLoadingDoc(false);
      }
    })();
  }, [isOpen, t, template, regex]);

  const handleSubmit = async () => {
    if (!template || !activeFile) return;
    setSaving(true);
    try {
      const file = new File([await activeFile.arrayBuffer()], template.name, {
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      });
      await onSave({ template, file, lang });
      onClose();
    } catch (e) {
      console.error("Template save failed", e);
      setModalError(t("partners.generalConditions.errorSaveTemplate"));
    } finally {
      setSaving(false);
    }
  };

  const insertVariable = (variable: string) => {
    void copyVariable(variable);
  };

  const copyVariable = async (variable: string) => {
    try {
      await navigator.clipboard.writeText(variable);
      toast.success("Переменная скопирована");
    } catch {
      toast.error("Не удалось скопировать переменную");
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
              <div className="flex items-center gap-2">
                <select
                  value={lang}
                  onChange={(e) => setLang(e.target.value)}
                  className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700"
                >
                  <option value="RU">RU</option>
                  <option value="EN">EN</option>
                </select>
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
                </div>
                <input
                  ref={inputRef}
                  type="file"
                  accept=".docx"
                  className="hidden"
                  onChange={async (e) => {
                    const next = e.target.files?.[0] ?? null;
                    if (!next) return;
                    setLoadingDoc(true);
                    setModalError(null);
                    try {
                      setActiveFile(next);
                      await parseVariablesFromDocx(next);
                    } catch (error) {
                      console.error("DOCX parse failed", error);
                      setModalError(
                        t("partners.generalConditions.errorOpenTemplate"),
                      );
                    } finally {
                      setLoadingDoc(false);
                    }
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
                    Скачать исходный DOCX
                  </a>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white">
            <div className="border-b border-slate-100 bg-slate-50 p-3">
              <div className="text-sm font-bold text-slate-900">
                {t("partners.generalConditions.variables")}
              </div>
              <p className="mt-1 text-[11px] text-slate-500">
                {t("partners.generalConditions.variablesHint")}
              </p>
            </div>
            <div className="flex flex-wrap gap-2 p-3">
              {allVariables.length === 0 ? (
                <div className="text-xs text-slate-400">
                  {t("partners.generalConditions.noTemplates")}
                </div>
              ) : (
                allVariables.map((v) => (
                  <button
                    key={v.key}
                    type="button"
                    onClick={() => {
                      insertVariable(v.key);
                    }}
                    className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-left transition-all hover:border-[var(--admin-primary)] hover:bg-[var(--admin-background-secondary)]"
                  >
                    <div className="text-[11px] font-bold text-slate-700">
                      {v.label}
                    </div>
                    <div className="mt-0.5 font-mono text-[10px] text-slate-400">
                      {v.key}
                    </div>
                  </button>
                ))
              )}
            </div>
            <div className="border-t border-slate-100 p-3">
              <div className="flex gap-2 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-background-secondary)] p-2 text-[11px] text-[var(--admin-text-secondary)]">
                <AlertCircle
                  size={14}
                  className="mt-0.5 shrink-0 text-[var(--admin-info)]"
                />
                <p>Клик по переменной копирует ее в буфер обмена.</p>
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
