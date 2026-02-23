import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@gridix/utils/api";
import { useLanguage } from "@/contexts/LanguageContext";

export interface FieldSetting {
  id?: string;
  field_name: string;
  field_label: string;
  field_type: "text" | "number" | "select" | "boolean";
  is_custom: boolean;
  is_visible: boolean;
  sort_order: number;
  is_required?: boolean;
  field_options?: string[];
  field_label_translations?: Record<string, string>;
}

/** Build FieldSetting[] from raw DB rows (same merge as loadFieldSettings). */
function mergeFieldsFromRaw(
  settingsData: Array<Record<string, unknown>>,
  customData: Array<Record<string, unknown>>,
): FieldSetting[] {
  const allFields: FieldSetting[] = [
    ...settingsData.map((field) => ({
      id: field.id as string,
      field_name: field.field_name as string,
      field_label: field.field_label as string,
      field_type: field.field_type as "text" | "number" | "select" | "boolean",
      is_custom: Boolean(field.is_custom),
      is_visible: Boolean(field.is_visible),
      sort_order: Number(field.sort_order),
    })),
    ...customData.map((field) => ({
      id: field.id as string,
      field_name: field.field_name as string,
      field_label: field.field_label as string,
      field_type: field.field_type as "text" | "number" | "select" | "boolean",
      is_custom: true,
      is_visible: field.is_visible !== false,
      sort_order: Number(field.sort_order) || 999,
      field_label_translations:
        (field.field_label_translations as Record<string, string>) || {},
    })),
  ];
  allFields.sort((a, b) => a.sort_order - b.sort_order);
  return allFields;
}

export interface UseFieldsInitialData {
  fieldSettings: Array<Record<string, unknown>>;
  customFields: Array<Record<string, unknown>>;
}

export const useFields = (
  projectId: string | null,
  initialData?: UseFieldsInitialData | null,
) => {
  const [fields, setFields] = useState<FieldSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { t } = useLanguage();

  const loadFieldSettings = useCallback(async () => {
    if (!projectId) {
      setFields([]);
      setLoading(false);
      return;
    }

    try {
      // Загружаем настройки полей
      const { data: settingsData, error: settingsError } = await supabase
        .from("project_field_settings")
        .select("*")
        .eq("project_id", projectId)
        .order("sort_order");

      if (settingsError) throw settingsError;

      // Загружаем кастомные поля
      const { data: customData, error: customError } = await supabase
        .from("project_custom_fields")
        .select("*")
        .eq("project_id", projectId)
        .order("sort_order");

      if (customError) throw customError;

      const allFields = mergeFieldsFromRaw(
        settingsData as Array<Record<string, unknown>>,
        customData as Array<Record<string, unknown>>,
      );
      setFields(allFields);
    } catch (error) {
      console.error("Error loading field settings:", error);
      toast.error(t("customFields.loadError"));
    } finally {
      setLoading(false);
    }
  }, [projectId, t]);

  const updateFieldOrder = useCallback(
    async (updatedFields: FieldSetting[]) => {
      setIsSaving(true);
      try {
        // Обновляем порядок в базе данных
        for (const field of updatedFields) {
          if (!field.id) continue;
          if (field.is_custom) {
            // Обновляем кастомные поля
            await supabase
              .from("project_custom_fields")
              .update({ sort_order: field.sort_order })
              .eq("id", field.id);
          } else {
            // Обновляем настройки стандартных полей
            await supabase
              .from("project_field_settings")
              .update({ sort_order: field.sort_order })
              .eq("id", field.id);
          }
        }

        setFields(updatedFields);
        toast.success(t("customFields.orderUpdated"));
      } catch (error) {
        console.error("Error updating field order:", error);
        toast.error(t("customFields.orderUpdateError"));
      } finally {
        setIsSaving(false);
      }
    },
    [t],
  );

  const updateFieldVisibility = useCallback(
    async (field: FieldSetting) => {
      if (isSaving) return; // Запрещаем изменение во время сохранения
      if (!field.id) return;

      setIsSaving(true);
      try {
        const updatedField = { ...field, is_visible: !field.is_visible };

        if (field.is_custom) {
          await supabase
            .from("project_custom_fields")
            .update({ is_visible: updatedField.is_visible })
            .eq("id", field.id);
        } else {
          await supabase
            .from("project_field_settings")
            .update({ is_visible: updatedField.is_visible })
            .eq("id", field.id);
        }

        const updatedFields = fields.map((f) =>
          f.id === field.id ? updatedField : f,
        );

        setFields(updatedFields);
        toast.success(t("customFields.visibilityUpdated"));
      } catch (error) {
        console.error("Error updating field visibility:", error);
        toast.error(t("customFields.visibilityUpdateError"));
      } finally {
        setIsSaving(false);
      }
    },
    [fields, isSaving, t],
  );

  const deleteField = useCallback(
    async (field: FieldSetting) => {
      if (!field.is_custom || isSaving) {
        if (!field.is_custom) {
          toast.error(t("customFields.cannotDeleteBuiltIn"));
        }
        return;
      }
      if (!field.id) return;

      setIsSaving(true);
      try {
        await supabase
          .from("project_custom_fields")
          .delete()
          .eq("id", field.id);

        const updatedFields = fields.filter((f) => f.id !== field.id);
        setFields(updatedFields);
        toast.success(t("customFields.deleteSuccess"));
      } catch (error) {
        console.error("Error deleting field:", error);
        toast.error(t("customFields.deleteError"));
      } finally {
        setIsSaving(false);
      }
    },
    [fields, isSaving, t],
  );

  const refreshFields = useCallback(() => {
    setLoading(true);
    loadFieldSettings();
  }, [loadFieldSettings]);

  useEffect(() => {
    if (
      initialData?.fieldSettings != null &&
      initialData?.customFields != null &&
      Array.isArray(initialData.fieldSettings) &&
      Array.isArray(initialData.customFields)
    ) {
      setFields(
        mergeFieldsFromRaw(initialData.fieldSettings, initialData.customFields),
      );
      setLoading(false);
      return;
    }
    loadFieldSettings();
  }, [
    loadFieldSettings,
    initialData?.fieldSettings,
    initialData?.customFields,
  ]);

  return {
    fields,
    loading,
    isSaving,
    loadFieldSettings,
    updateFieldOrder,
    updateFieldVisibility,
    deleteField,
    refreshFields,
  };
};
