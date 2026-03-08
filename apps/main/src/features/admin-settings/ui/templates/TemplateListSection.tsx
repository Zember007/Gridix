import { Button } from "@gridix/ui";
import { Edit2, Trash2 } from "lucide-react";
import type { Tables } from "@gridix/types/database";

type MessageTemplateRow = Tables<"user_message_templates">;

type TemplateListSectionProps = {
  templates: MessageTemplateRow[];
  loading: boolean;
  editingId: string | null;
  onEdit: (tpl: MessageTemplateRow) => void;
  onDelete: (tpl: MessageTemplateRow) => void;
  t: (key: string, vars?: Record<string, unknown>) => string;
};

export function TemplateListSection(props: TemplateListSectionProps) {
  if (props.loading) {
    return (
      <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
        {props.t("adminSettings.saving")}
      </div>
    );
  }

  return (
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
  );
}
