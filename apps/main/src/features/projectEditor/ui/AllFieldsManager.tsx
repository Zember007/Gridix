import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@gridix/ui";
import { Button } from "@gridix/ui";
import { ArrowLeft, Loader2, Plus } from "lucide-react";
import CustomFieldsManager from "@/components/fields/CustomFieldsManager";
import { useAllFieldsManager } from "@/features/projectEditor/model/useAllFieldsManager";
import { FieldRow } from "@/features/projectEditor/ui/FieldRow";

interface AllFieldsManagerProps {
  projectId: string;
}

const AllFieldsManager = ({ projectId }: AllFieldsManagerProps) => {
  const {
    t,
    fields,
    loading,
    isSaving,
    draggedIndex,
    showAddForm,
    editingField,
    isWaitingForEditorData,
    getFieldLabel,
    handleDragStart,
    handleDragOver,
    handleDrop,
    handleVisibilityToggle,
    handleDeleteField,
    handleEditField,
    openAddForm,
    closeEditor,
    onFieldsChange,
  } = useAllFieldsManager(projectId);

  if (showAddForm || editingField) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={closeEditor}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("customFields.back")}
          </Button>
        </div>
        <CustomFieldsManager
          projectId={projectId}
          onFieldsChange={onFieldsChange}
          editingField={editingField}
          onClose={closeEditor}
        />
      </div>
    );
  }

  if (isWaitingForEditorData || loading) {
    return <div className="p-4 text-center">{t("customFields.loading")}</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {t("customFields.allFieldsOrder")}
          {isSaving && (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </CardTitle>
        <CardDescription>
          {isSaving
            ? t("customFields.saving")
            : t("customFields.allFieldsOrderDescription")}
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
              <FieldRow
                key={field.id}
                field={field}
                index={index}
                draggedIndex={draggedIndex}
                isSaving={isSaving}
                t={t}
                getFieldLabel={getFieldLabel}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onVisibilityToggle={handleVisibilityToggle}
                onEdit={handleEditField}
                onDelete={handleDeleteField}
              />
            ))}
          </div>
        )}

        <Button
          onClick={openAddForm}
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

export default AllFieldsManager;
