import { useState, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@gridix/ui";
import { Button } from "@gridix/ui";
import { Switch } from "@gridix/ui";
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
import { toast } from "sonner";
import { supabase } from "@gridix/utils/api";
import { useLanguage } from "@/contexts/LanguageContext";
import { Language } from "@gridix/utils/lib";
import CustomFieldsManager from "./CustomFieldsManager";

interface CustomField {
  id?: string;
  field_name: string;
  field_label: string;
  field_type: "text" | "number" | "select" | "boolean";
  is_required: boolean;
  field_options?: string[];
  sort_order: number;
  is_visible: boolean;
}

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
  const [isSaving, setIsSaving] = useState(false);
  const { t, language } = useLanguage();

  // Функция для получения локализованного названия поля
  const getFieldLabel = (field: {
    field_label: string;
    field_label_translations?: Partial<Record<Language, string>>;
  }) => {
    if (
      field.field_label_translations &&
      field.field_label_translations[language]
    ) {
      return field.field_label_translations[language];
    }
    return field.field_label;
  };

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

      const newFields = [...fields];
      const [draggedField] = newFields.splice(draggedIndex, 1);
      if (!draggedField) {
        setDraggedIndex(null);
        return;
      }
      newFields.splice(dropIndex, 0, draggedField);

      // Обновляем sort_order для всех полей
      const updatedFields = newFields.map((field, index) => ({
        ...field,
        sort_order: index,
      }));

      // Сохраняем новый порядок в БД
      setIsSaving(true);
      try {
        for (const field of updatedFields) {
          if (field.id) {
            await supabase
              .from("project_custom_fields")
              .update({ sort_order: field.sort_order })
              .eq("id", field.id);
          }
        }

        onFieldsChange(updatedFields);
        toast.success(t("customFields.orderUpdated"));
      } catch (error) {
        console.error("Error updating field order:", error);
        toast.error(t("customFields.orderUpdateError"));
      } finally {
        setIsSaving(false);
      }

      setDraggedIndex(null);
    },
    [draggedIndex, fields, onFieldsChange, t, isSaving],
  );

  const handleVisibilityToggle = async (field: CustomField) => {
    if (isSaving) return; // Запрещаем изменение во время сохранения
    if (!field.id) return;

    setIsSaving(true);
    try {
      const updatedField = { ...field, is_visible: !field.is_visible };

      await supabase
        .from("project_custom_fields")
        .update({ is_visible: updatedField.is_visible })
        .eq("id", field.id);

      const updatedFields = fields.map((f) =>
        f.id === field.id ? updatedField : f,
      );

      onFieldsChange(updatedFields);
      toast.success(t("customFields.visibilityUpdated"));
    } catch (error) {
      console.error("Error updating field visibility:", error);
      toast.error(t("customFields.visibilityUpdateError"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteField = async (fieldId: string) => {
    if (isSaving) return;

    setIsSaving(true);
    try {
      await supabase.from("project_custom_fields").delete().eq("id", fieldId);

      const updatedFields = fields.filter((f) => f.id !== fieldId);
      onFieldsChange(updatedFields);
      toast.success(t("customFields.deleteSuccess"));
    } catch (error) {
      console.error("Error deleting field:", error);
      toast.error(t("customFields.deleteError"));
    } finally {
      setIsSaving(false);
    }
  };

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
                    <span className="font-medium">{getFieldLabel(field)}</span>
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
