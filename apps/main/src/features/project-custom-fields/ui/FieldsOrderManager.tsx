import { useState, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@gridix/ui";
import { Button } from "@gridix/ui";
import { Badge } from "@gridix/ui";
import {
  Plus,
  GripVertical,
  Eye,
  EyeOff,
  Edit,
  Trash2,
  ArrowLeft,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import CustomFieldsManager from "./CustomFieldsManager";
import { useFieldsOrderMutations } from "../model";
import type { CustomField } from "../model";
import { getCustomFieldLabel } from "../model/getCustomFieldLabel";

interface FieldsOrderManagerProps {
  projectId: string;
  fields: CustomField[];
  onFieldsChange: (fields: CustomField[]) => void;
}

const FieldsOrderManager = ({
  projectId,
  fields,
  onFieldsChange,
}: FieldsOrderManagerProps) => {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingField, setEditingField] = useState<CustomField | null>(null);
  const { t, language } = useLanguage();
  const { isSaving, reorderFields, toggleVisibility, deleteField } =
    useFieldsOrderMutations({
      fields,
      onFieldsChange,
    });

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = useCallback(
    async (e: React.DragEvent, dropIndex: number) => {
      e.preventDefault();

      if (draggedIndex === null || draggedIndex === dropIndex || isSaving) {
        setDraggedIndex(null);
        return;
      }

      await reorderFields(draggedIndex, dropIndex);
      setDraggedIndex(null);
    },
    [draggedIndex, isSaving, reorderFields],
  );

  const handleVisibilityToggle = useCallback(
    (field: CustomField) => toggleVisibility(field),
    [toggleVisibility],
  );

  const handleDeleteField = useCallback(
    (fieldId: string) => deleteField(fieldId),
    [deleteField],
  );

  if (showAddForm || editingField) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setShowAddForm(false);
              setEditingField(null);
            }}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("customFields.back")}
          </Button>
        </div>
        <CustomFieldsManager
          projectId={projectId}
          onFieldsChange={(newFields) => {
            onFieldsChange(newFields);
            setShowAddForm(false);
            setEditingField(null);
          }}
          editingField={editingField}
          onClose={() => {
            setShowAddForm(false);
            setEditingField(null);
          }}
        />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("customFields.fieldsOrder")}</CardTitle>
        <CardDescription>
          {t("customFields.fieldsOrderDescription")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {fields.length === 0 ? (
          <div className="py-8 text-center">
            <p className="mb-4 text-muted-foreground">
              {t("customFields.noFields")}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {fields.map((field, index) => (
              <div
                key={field.id}
                draggable={!isSaving}
                onDragStart={(e) => !isSaving && handleDragStart(e, index)}
                onDragOver={handleDragOver}
                onDrop={(e) => !isSaving && handleDrop(e, index)}
                className={`flex items-center gap-3 rounded-lg border bg-background p-3 transition-shadow hover:shadow-sm ${isSaving ? "cursor-not-allowed opacity-50" : "cursor-move"} ${draggedIndex === index ? "opacity-50" : ""} ${!field.is_visible ? "opacity-60" : ""} `}
              >
                <GripVertical className="h-4 w-4 text-muted-foreground" />

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      {getCustomFieldLabel(field, language)}
                    </span>
                    {field.is_required && (
                      <Badge variant="destructive" className="text-xs">
                        {t("customFields.requiredBadge")}
                      </Badge>
                    )}
                    <Badge variant="outline" className="text-xs">
                      {field.field_type === "text" &&
                        t("customFields.fieldTypeText")}
                      {field.field_type === "number" &&
                        t("customFields.fieldTypeNumber")}
                      {field.field_type === "select" &&
                        t("customFields.fieldTypeSelect")}
                      {field.field_type === "boolean" &&
                        t("customFields.fieldTypeBoolean")}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {field.field_name}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => !isSaving && handleVisibilityToggle(field)}
                    disabled={isSaving}
                    title={
                      field.is_visible
                        ? t("customFields.hide")
                        : t("customFields.show")
                    }
                  >
                    {field.is_visible ? (
                      <Eye className="h-4 w-4" />
                    ) : (
                      <EyeOff className="h-4 w-4" />
                    )}
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => !isSaving && setEditingField(field)}
                    disabled={isSaving}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => !isSaving && handleDeleteField(field.id!)}
                    disabled={isSaving}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        <Button
          onClick={() => !isSaving && setShowAddForm(true)}
          disabled={isSaving}
          className="w-full"
          variant="outline"
        >
          <Plus className="mr-2 h-4 w-4" />
          {t("customFields.addField")}
        </Button>
      </CardContent>
    </Card>
  );
};

export default FieldsOrderManager;
