import { Button } from "@gridix/ui";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@gridix/ui";
import { Badge } from "@gridix/ui";
import { Plus, Trash2, Edit2 } from "lucide-react";
import type { CustomField } from "../model";
import { useCustomFieldsManager } from "../model";
import { CustomFieldEditor } from "./CustomFieldEditor";

interface CustomFieldsManagerProps {
  projectId?: string | null;
  onFieldsChange?: (fields: CustomField[]) => void;
  editingField?: CustomField | null;
  onClose?: () => void;
}

const CustomFieldsManager = ({
  projectId,
  onFieldsChange,
  editingField: initialEditingField = null,
  onClose,
}: CustomFieldsManagerProps) => {
  const {
    fields,
    loading,
    editingField,
    setEditingField,
    beginEditField,
    isAdding,
    setIsAdding,
    newField,
    setNewField,
    getFieldLabel,
    handleSaveField,
    handleDeleteField,
    cancelEditing,
    t,
  } = useCustomFieldsManager({
    projectId,
    onFieldsChange,
    initialEditingField,
    onClose,
  });

  if (loading) {
    return <div className="p-4 text-center">{t("customFields.loading")}</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("customFields.title")}</CardTitle>
        <CardDescription>{t("customFields.description")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Существующие поля */}
        {fields.map((field) => (
          <div key={field.id}>
            {editingField?.id === field.id ? (
              <CustomFieldEditor
                field={editingField!}
                onChange={(f) => setEditingField(f)}
                onSave={() => handleSaveField(editingField!)}
                onCancel={() => cancelEditing(false)}
              />
            ) : (
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-3">
                  <div>
                    <div className="font-medium">{getFieldLabel(field)}</div>
                    <div className="text-sm text-gray-500">
                      {field.field_type === "text" &&
                        t("customFields.fieldTypeText")}
                      {field.field_type === "number" &&
                        t("customFields.fieldTypeNumber")}
                      {field.field_type === "select" &&
                        t("customFields.fieldTypeSelect")}
                      {field.field_type === "boolean" &&
                        t("customFields.fieldTypeBoolean")}
                      {field.is_required && (
                        <Badge variant="destructive" className="ml-2 text-xs">
                          {t("customFields.requiredBadge")}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      beginEditField(field);
                    }}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteField(field.id!)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Форма добавления нового поля */}
        {isAdding && (
          <CustomFieldEditor
            field={newField}
            isNew
            onChange={setNewField}
            onSave={() => handleSaveField(newField)}
            onCancel={() => cancelEditing(true)}
          />
        )}

        {/* Кнопка добавления */}
        {!isAdding && (
          <Button
            variant="outline"
            onClick={() => setIsAdding(true)}
            className="w-full"
          >
            <Plus className="mr-2 h-4 w-4" />
            {t("customFields.addField")}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default CustomFieldsManager;
