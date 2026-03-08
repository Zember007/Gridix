import React, { useState } from "react";
import { AlertCircle, Link as LinkIcon } from "lucide-react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@gridix/ui";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onImport: (url: string, name: string) => Promise<void>;
  t: (key: string) => string;
};

export const GoogleDocsImportModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onImport,
  t,
}) => {
  const [url, setUrl] = useState("");
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleImport = async () => {
    if (!url?.trim() || !name?.trim()) return;
    setIsLoading(true);
    try {
      await onImport(url.trim(), name.trim());
      onClose();
      setUrl("");
      setName("");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {t("partners.generalConditions.googleImportTitle")}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 p-6">
          <div className="flex gap-2 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-background-secondary)] p-3 text-sm text-[var(--admin-text-secondary)]">
            <AlertCircle
              size={16}
              className="mt-0.5 shrink-0 text-[var(--admin-info)]"
            />
            <p>{t("partners.generalConditions.googleImportHint")}</p>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase text-slate-500">
              {t("partners.generalConditions.templateNameLabel")}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t(
                "partners.generalConditions.templateNamePlaceholder",
              )}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-[var(--admin-primary)]"
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase text-slate-500">
              {t("partners.generalConditions.documentLinkLabel")}
            </label>
            <div className="relative">
              <LinkIcon
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder={t(
                  "partners.generalConditions.documentLinkPlaceholder",
                )}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm outline-none focus:border-[var(--admin-primary)]"
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            {t("partners.generalConditions.cancel")}
          </Button>
          <Button onClick={handleImport} disabled={!url || !name || isLoading}>
            {isLoading
              ? t("partners.generalConditions.importing")
              : t("partners.generalConditions.importBtn")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
