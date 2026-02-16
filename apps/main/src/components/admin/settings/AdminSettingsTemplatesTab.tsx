import { Button, Input, Label, Textarea } from "@gridix/ui";
import { Edit2, MessageSquare, Save, Trash2, X } from "lucide-react";

import type { Tables } from "@gridix/types/database";

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
          {props.loading ? (
            <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
              {props.t("adminSettings.saving")}
            </div>
          ) : (
            <>
              {props.templates.map((tpl) => (
                <div
                  key={tpl.id}
                  className={`rounded-xl border p-4 transition-colors ${
                    props.editingId === tpl.id
                      ? "border-primary/50 bg-muted/30"
                      : "hover:bg-muted/20"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="font-semibold">{tpl.title}</div>
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => props.onEdit(tpl)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => props.onDelete(tpl)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                  <div className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                    {tpl.content}
                  </div>
                </div>
              ))}

              {props.templates.length === 0 && (
                <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
                  {props.t("adminSettings.noTemplates")}
                </div>
              )}
            </>
          )}
        </div>

        {props.isEditorOpen ? (
          <div className="sticky top-6 h-fit rounded-xl border bg-background p-6">
            <div className="mb-4 flex items-center justify-between">
              <div className="font-semibold">
                {props.isCreating
                  ? props.t("adminSettings.newTemplate")
                  : props.t("adminSettings.editTemplate")}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={props.onCloseEditor}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="template_title">
                  {props.t("adminSettings.templateTitle")}
                </Label>
                <Input
                  id="template_title"
                  value={props.title}
                  onChange={(e) => props.onTitleChange(e.target.value)}
                  placeholder={props.t(
                    "adminSettings.templateTitlePlaceholder",
                  )}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="template_content">
                  {props.t("adminSettings.templateContent")}
                </Label>
                <Textarea
                  id="template_content"
                  value={props.content}
                  onChange={(e) => props.onContentChange(e.target.value)}
                  placeholder={props.t(
                    "adminSettings.templateContentPlaceholder",
                  )}
                  rows={8}
                />
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{props.t("adminSettings.templateVariables")}</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      props.onContentChange(`${props.content}{name}`)
                    }
                  >
                    {"{name}"}
                  </Button>
                </div>
              </div>
              <Button
                type="button"
                onClick={props.onSave}
                disabled={!props.title.trim() || !props.content.trim()}
              >
                <Save className="mr-2 h-4 w-4" />
                {props.t("adminSettings.save")}
              </Button>
            </div>
          </div>
        ) : (
          <div className="hidden items-center justify-center rounded-xl border border-dashed p-10 text-sm text-muted-foreground lg:flex">
            {props.t("adminSettings.selectTemplateHint")}
          </div>
        )}
      </div>
    </div>
  );
}
