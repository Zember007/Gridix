import { Badge, Button } from "@gridix/ui";
import { Edit, Eye, EyeOff, GripVertical, Trash2 } from "lucide-react";
import { FieldSetting } from "@/hooks/useFields";

type FieldRowProps = {
  field: FieldSetting;
  index: number;
  draggedIndex: number | null;
  isSaving: boolean;
  t: (key: string) => string;
  getFieldLabel: (field: {
    field_label: string;
    field_label_translations?: Record<string, string>;
  }) => string;
  onDragStart: (e: React.DragEvent, index: number) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, index: number) => void;
  onVisibilityToggle: (field: FieldSetting) => void;
  onEdit: (field: FieldSetting) => void;
  onDelete: (field: FieldSetting) => void;
};

export const FieldRow = ({
  field,
  index,
  draggedIndex,
  isSaving,
  t,
  getFieldLabel,
  onDragStart,
  onDragOver,
  onDrop,
  onVisibilityToggle,
  onEdit,
  onDelete,
}: FieldRowProps) => {
  return (
    <div
      key={field.id}
      draggable={!isSaving}
      onDragStart={(e) => !isSaving && onDragStart(e, index)}
      onDragOver={onDragOver}
      onDrop={(e) => !isSaving && onDrop(e, index)}
      className={`relative flex gap-3 rounded-lg border bg-background p-3 transition-shadow hover:shadow-sm max-xs:flex-col xs:items-center ${isSaving ? "cursor-not-allowed opacity-50" : "cursor-move"} ${draggedIndex === index ? "opacity-50" : ""} ${!field.is_visible ? "opacity-60" : ""} `}
    >
      <GripVertical className="h-4 w-4 text-muted-foreground" />

      <div className="flex min-w-0 flex-1 flex-col gap-3 md:flex-row md:items-center">
        <div className="flex flex-col">
          <span className="font-medium">{getFieldLabel(field)}</span>
          <p className="text-sm text-muted-foreground">{field.field_name}</p>
        </div>
        <div className="flex h-full gap-2">
          {field.is_custom ? (
            <Badge variant="secondary" className="whitespace-nowrap text-xs">
              {t("customFields.custom")}
            </Badge>
          ) : (
            <Badge variant="outline" className="whitespace-nowrap text-xs">
              {t("customFields.builtin")}
            </Badge>
          )}
          <Badge variant="outline" className="whitespace-nowrap text-xs">
            {field.field_type === "text" && t("customFields.fieldTypeText")}
            {field.field_type === "number" && t("customFields.fieldTypeNumber")}
            {field.field_type === "select" && t("customFields.fieldTypeSelect")}
            {field.field_type === "boolean" &&
              t("customFields.fieldTypeBoolean")}
          </Badge>
        </div>
      </div>

      <div className="flex flex-col items-center gap-0 xs:gap-2 sm:flex-row">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => !isSaving && onVisibilityToggle(field)}
          disabled={isSaving}
          title={
            field.is_visible ? t("customFields.hide") : t("customFields.show")
          }
        >
          {field.is_visible ? (
            <Eye className="h-4 w-4" />
          ) : (
            <EyeOff className="h-4 w-4" />
          )}
        </Button>

        {field.is_custom && (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => !isSaving && onEdit(field)}
              disabled={isSaving}
            >
              <Edit className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => !isSaving && onDelete(field)}
              disabled={isSaving}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
};
