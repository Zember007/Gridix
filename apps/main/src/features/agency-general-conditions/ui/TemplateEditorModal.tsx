import React from "react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@gridix/ui";
import { Save } from "lucide-react";
import type { Template } from "../model/types";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  template: Template | null;
  onSave: (id: number, lang: string) => void;
  isLoading: boolean;
  t: (key: string) => string;
};

export const TemplateEditorModal: React.FC<Props> = ({
  isOpen,
  onClose,
  template,
  onSave,
  isLoading,
  t,
}) => {
  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            {t("partners.generalConditions.editorTitle")}:{" "}
            {template?.name || t("partners.generalConditions.newTemplate")}
          </DialogTitle>
        </DialogHeader>
        <div className="p-6 text-sm text-slate-500">
          {t("partners.generalConditions.loadingDocument")}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            {t("partners.generalConditions.cancel")}
          </Button>
          <Button
            onClick={() => template && onSave(template.id, template.lang)}
            className="flex items-center gap-2"
            disabled={isLoading || !template}
          >
            <Save size={16} />
            {t("partners.generalConditions.saveAndClose")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
