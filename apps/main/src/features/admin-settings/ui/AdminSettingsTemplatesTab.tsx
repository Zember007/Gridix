import { Button } from "@gridix/ui";
import { MessageSquare } from "lucide-react";

import type { Tables } from "@gridix/types/database";

import { TemplateEditorSection } from "./templates/TemplateEditorSection";
import { TemplateListSection } from "./templates/TemplateListSection";

type MessageTemplateRow = Tables<"user_message_templates">;

export type AdminSettingsTemplatesTabProps = {
  templates: MessageTemplateRow[];
  loading: boolean;

  isEditorOpen: boolean;
  isCreating: boolean;
  editingId: string | null;
  title: string;
  content: string;

  onCreate: () => void;
  onEdit: (tpl: MessageTemplateRow) => void;
  onDelete: (tpl: MessageTemplateRow) => void;
  onCloseEditor: () => void;

  onTitleChange: (value: string) => void;
  onContentChange: (value: string) => void;
  onSave: () => void;

  t: (key: string, vars?: Record<string, unknown>) => string;
};

export function AdminSettingsTemplatesTab(
  props: AdminSettingsTemplatesTabProps,
) {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xl font-semibold">
            {props.t("adminSettings.messageTemplates")}
          </div>
          <div className="text-sm text-muted-foreground">
            {props.t("adminSettings.messageTemplatesDesc")}
          </div>
        </div>
        <Button type="button" onClick={props.onCreate} variant="outline">
          <MessageSquare className="mr-2 h-4 w-4" />
          {props.t("adminSettings.createTemplate")}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="space-y-3">
          <TemplateListSection
            templates={props.templates}
            loading={props.loading}
            editingId={props.editingId}
            onEdit={props.onEdit}
            onDelete={props.onDelete}
            t={props.t}
          />
        </div>

        {props.isEditorOpen ? (
          <TemplateEditorSection
            isCreating={props.isCreating}
            title={props.title}
            content={props.content}
            onCloseEditor={props.onCloseEditor}
            onTitleChange={props.onTitleChange}
            onContentChange={props.onContentChange}
            onSave={props.onSave}
            t={props.t}
          />
        ) : (
          <div className="hidden items-center justify-center rounded-xl border border-dashed p-10 text-sm text-muted-foreground lg:flex">
            {props.t("adminSettings.selectTemplateHint")}
          </div>
        )}
      </div>
    </div>
  );
}
