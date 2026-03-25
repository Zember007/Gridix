import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/shared/api/supabase";
import { useLanguage } from "@/contexts/LanguageContext";
import { SUPPORTED_LANGUAGES, type Language } from "@gridix/utils/lib";
import type { CustomField } from "./types";
import { getCustomFieldLabel } from "./getCustomFieldLabel";

type DbCustomFieldRow = {
  id: string;
  field_name: string;
  field_label: string;
  field_label_translations?: Partial<Record<Language, string>> | null;
  field_type: "text" | "number" | "select" | "boolean";
  is_required: boolean;
  field_options?: string[] | null;
  sort_order?: number | null;
  is_visible?: boolean | null;
};

export interface UseCustomFieldsManagerParams {
  projectId?: string | null;
  onFieldsChange?: (fields: CustomField[]) => void;
  initialEditingField?: CustomField | null;
  onClose?: () => void;
}

const EMPTY_FIELD: CustomField = {
  field_name: "",
  field_label: "",
  field_label_translations: {},
  field_type: "text",
  is_required: false,
  field_options: [],
  sort_order: 0,
  is_visible: true,
};

function normalizeTranslations(
  translations: CustomField["field_label_translations"] | undefined,
): Partial<Record<Language, string>> {
  return SUPPORTED_LANGUAGES.reduce(
    (acc, lang) => {
      acc[lang] = translations?.[lang] ?? "";
      return acc;
    },
    {} as Partial<Record<Language, string>>,
  );
}

export function useCustomFieldsManager({
  projectId,
  onFieldsChange,
  initialEditingField = null,
  onClose,
}: UseCustomFieldsManagerParams) {
  const [fields, setFields] = useState<CustomField[]>([]);
  const [editingField, setEditingField] = useState<CustomField | null>(
    initialEditingField,
  );
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(true);
  const [newField, setNewField] = useState<CustomField>(EMPTY_FIELD);
  const { t, language } = useLanguage();

  // Stabilize external deps to avoid refetch loops when parent re-renders
  const tRef = useRef(t);
  useEffect(() => {
    tRef.current = t;
  }, [t]);

  const onFieldsChangeRef = useRef(onFieldsChange);
  useEffect(() => {
    onFieldsChangeRef.current = onFieldsChange;
  }, [onFieldsChange]);

  const getFieldLabel = useCallback(
    (field: Pick<CustomField, "field_label" | "field_label_translations">) =>
      getCustomFieldLabel(field, language),
    [language],
  );

  const loadCustomFields = useCallback(async () => {
    if (!projectId) {
      setFields([]);
      onFieldsChangeRef.current?.([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("project_custom_fields")
        .select("*")
        .eq("project_id", projectId)
        .order("sort_order");

      if (error) throw error;

      const formattedFields = (data as DbCustomFieldRow[]).map((field) => ({
        id: field.id,
        field_name: field.field_name,
        field_label: field.field_label,
        field_label_translations: field.field_label_translations || {},
        field_type: field.field_type,
        is_required: field.is_required,
        field_options: field.field_options || [],
        sort_order: field.sort_order || 0,
        is_visible: field.is_visible !== false,
      }));

      setFields(formattedFields);
      onFieldsChangeRef.current?.(formattedFields);
    } catch (error) {
      console.error("Error loading custom fields:", error);
      toast.error(tRef.current("customFields.loadingError"));
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadCustomFields();
  }, [loadCustomFields]);

  useEffect(() => {
    if (initialEditingField) {
      setEditingField(initialEditingField);
    }
  }, [initialEditingField]);

  const generateFieldName = useCallback((label: string) => {
    return label
      .toLowerCase()
      .replace(/[^a-zа-я0-9\s]/gi, "")
      .replace(/\s+/g, "_")
      .slice(0, 30);
  }, []);

  const resetNewField = useCallback(() => {
    setNewField(EMPTY_FIELD);
  }, []);

  const handleSaveField = useCallback(
    async (field: CustomField) => {
      if (!field.field_label.trim()) {
        toast.error(t("customFields.enterFieldName"));
        return;
      }

      const fieldName =
        field.field_name || generateFieldName(field.field_label);

      try {
        if (!projectId) {
          // Локальный режим: сохраняем только в памяти
          let updatedFields: CustomField[];
          if (field.id) {
            updatedFields = fields.map((f) =>
              f.id === field.id
                ? {
                    ...field,
                    field_name: fieldName,
                    field_label_translations:
                      field.field_label_translations || {},
                  }
                : f,
            );
            setFields(updatedFields);
          } else {
            const localField: CustomField = {
              ...field,
              id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
              field_name: fieldName,
              sort_order: field.sort_order || fields.length,
              is_visible: field.is_visible ?? true,
              field_label_translations: field.field_label_translations || {},
            };
            updatedFields = [...fields, localField];
            setFields(updatedFields);
          }
          onFieldsChange?.(updatedFields);
          toast.success(t("customFields.saveSuccess"));
        } else if (field.id) {
          // Обновление существующего поля
          const { error } = await supabase
            .from("project_custom_fields")
            .update({
              field_name: fieldName,
              field_label: field.field_label,
              field_label_translations: field.field_label_translations,
              field_type: field.field_type,
              is_required: field.is_required,
              field_options: field.field_options,
              sort_order: field.sort_order,
              is_visible: field.is_visible,
            })
            .eq("id", field.id);

          if (error) throw error;
          toast.success(t("customFields.updateSuccess"));
        } else {
          // Создание нового поля
          const { error } = await supabase
            .from("project_custom_fields")
            .insert([
              {
                project_id: projectId,
                field_name: fieldName,
                field_label: field.field_label,
                field_label_translations: field.field_label_translations,
                field_type: field.field_type,
                is_required: field.is_required,
                field_options: field.field_options,
                sort_order: field.sort_order || fields.length,
                is_visible: field.is_visible,
              },
            ]);

          if (error) throw error;
          toast.success(t("customFields.saveSuccess"));
        }

        setIsAdding(false);
        setEditingField(null);
        resetNewField();

        if (projectId) {
          loadCustomFields();
        }
      } catch (error) {
        console.error("Error saving field:", error);
        toast.error(t("customFields.saveError"));
      }
    },
    [
      fields,
      generateFieldName,
      loadCustomFields,
      onFieldsChange,
      projectId,
      resetNewField,
      t,
    ],
  );

  const handleDeleteField = useCallback(
    async (fieldId: string) => {
      try {
        if (!projectId) {
          const updatedFields = fields.filter((f) => f.id !== fieldId);
          setFields(updatedFields);
          onFieldsChange?.(updatedFields);
          toast.success(t("customFields.deleteSuccess"));
          return;
        }

        const { error } = await supabase
          .from("project_custom_fields")
          .delete()
          .eq("id", fieldId);

        if (error) throw error;
        toast.success(t("customFields.deleteSuccess"));
        loadCustomFields();
      } catch (error) {
        console.error("Error deleting field:", error);
        toast.error(t("customFields.deleteError"));
      }
    },
    [fields, loadCustomFields, onFieldsChange, projectId, t],
  );

  const beginEditField = useCallback((field: CustomField) => {
    setEditingField({
      ...field,
      field_label_translations: normalizeTranslations(
        field.field_label_translations,
      ),
    });
  }, []);

  const cancelEditing = useCallback(
    (isNew: boolean) => {
      if (isNew) {
        setIsAdding(false);
        resetNewField();
      } else {
        setEditingField(null);
      }
      onClose?.();
    },
    [onClose, resetNewField],
  );

  return {
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
    loadCustomFields,
    generateFieldName,
    handleSaveField,
    handleDeleteField,
    cancelEditing,
    language,
    t,
  };
}
