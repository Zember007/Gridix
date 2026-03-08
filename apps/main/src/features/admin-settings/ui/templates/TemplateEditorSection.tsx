import { Button, Input, Label, Textarea } from "@gridix/ui";
import { Save, X } from "lucide-react";

type TemplateEditorSectionProps = {
  isCreating: boolean;
  title: string;
  content: string;
  onCloseEditor: () => void;
  onTitleChange: (value: string) => void;
  onContentChange: (value: string) => void;
  onSave: () => void;
  t: (key: string, vars?: Record<string, unknown>) => string;
};

export function TemplateEditorSection(props: TemplateEditorSectionProps) {
  return (
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
            placeholder={props.t("adminSettings.templateTitlePlaceholder")}
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
            placeholder={props.t("adminSettings.templateContentPlaceholder")}
            rows={8}
          />
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{props.t("adminSettings.templateVariables")}</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => props.onContentChange(`${props.content}{name}`)}
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
  );
}
