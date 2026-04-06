import { useCallback, useRef, useState } from "react";
import { Language } from "@gridix/utils/lib";
import { useLanguage } from "@/contexts/LanguageContext";
import { useProjectEditorDataContext } from "@/features/projectEditor/context/ProjectEditorDataContext";
import { FieldSetting, useFields } from "@/hooks/useFields";

type CustomField = {
  id?: string;
  field_name: string;
  field_label: string;
  field_type: "text" | "number" | "select" | "boolean";
  is_required: boolean;
  field_options?: string[];
  sort_order: number;
  is_visible: boolean;
};

export const useAllFieldsManager = (
  projectId: string,
  subProjectId?: string,
) => {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingField, setEditingField] = useState<CustomField | null>(null);
  const skipNextFieldsChangeRefreshRef = useRef(false);
  const { t, language } = useLanguage();

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

  const editorData = useProjectEditorDataContext();
  const isEditorContext = Boolean(editorData);
  const isWaitingForEditorData = Boolean(editorData?.loading);
  const initialFieldsData =
    editorData?.data?.fieldSettings != null &&
    editorData?.data?.customFields != null
      ? {
          fieldSettings: editorData.data.fieldSettings as Array<
            Record<string, unknown>
          >,
          customFields: editorData.data.customFields as Array<
            Record<string, unknown>
          >,
        }
      : null;

  const projectIdForFields = isEditorContext
    ? editorData?.data
      ? projectId
      : null
    : projectId;

  const {
    fields,
    loading,
    isSaving,
    updateFieldOrder,
    updateFieldVisibility,
    deleteField,
    refreshFields,
  } = useFields(projectIdForFields, initialFieldsData, subProjectId);

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

      const updatedFields = newFields.map((field, index) => ({
        ...field,
        sort_order: index,
      }));

      await updateFieldOrder(updatedFields);
      setDraggedIndex(null);
    },
    [draggedIndex, fields, isSaving, updateFieldOrder],
  );

  const handleVisibilityToggle = async (field: FieldSetting) => {
    await updateFieldVisibility(field);
  };

  const handleDeleteField = async (field: FieldSetting) => {
    await deleteField(field);
  };

  const handleEditField = (field: FieldSetting) => {
    if (!field.is_custom || isSaving) {
      if (!field.is_custom) {
        console.error(t("customFields.cannotEditBuiltIn"));
      }
      return;
    }
    if (!field.id) return;

    skipNextFieldsChangeRefreshRef.current = true;
    setEditingField({
      id: field.id,
      field_name: field.field_name,
      field_label: field.field_label,
      field_type: field.field_type,
      sort_order: field.sort_order,
      is_visible: field.is_visible,
      is_required: field.is_required || false,
      field_options: field.field_options || [],
    });
  };

  const openAddForm = () => {
    if (isSaving) return;
    skipNextFieldsChangeRefreshRef.current = true;
    setShowAddForm(true);
  };

  const closeEditor = () => {
    setShowAddForm(false);
    setEditingField(null);
  };

  const onFieldsChange = () => {
    if (skipNextFieldsChangeRefreshRef.current) {
      skipNextFieldsChangeRefreshRef.current = false;
      return;
    }
    if (editorData) {
      void editorData.refresh();
      return;
    }
    refreshFields();
  };

  return {
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
  };
};
