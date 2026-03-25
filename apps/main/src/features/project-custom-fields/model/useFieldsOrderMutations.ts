import { useCallback, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/shared/api/supabase";
import { useLanguage } from "@/contexts/LanguageContext";
import type { CustomField } from "./types";

export interface UseFieldsOrderMutationsParams {
  fields: CustomField[];
  onFieldsChange: (fields: CustomField[]) => void;
}

export function useFieldsOrderMutations({
  fields,
  onFieldsChange,
}: UseFieldsOrderMutationsParams) {
  const [isSaving, setIsSaving] = useState(false);
  const { t } = useLanguage();

  const reorderFields = useCallback(
    async (draggedIndex: number, dropIndex: number) => {
      if (isSaving) return;
      if (draggedIndex === dropIndex) return;

      const newFields = [...fields];
      const [draggedField] = newFields.splice(draggedIndex, 1);
      if (!draggedField) return;
      newFields.splice(dropIndex, 0, draggedField);

      // Recalculate sort_order for all fields (same behavior as before).
      const updatedFields = newFields.map((field, index) => ({
        ...field,
        sort_order: index,
      }));

      setIsSaving(true);
      try {
        // Keep sequential order to preserve DB write behavior.
        for (const field of updatedFields) {
          if (!field.id) continue;
          await supabase
            .from("project_custom_fields")
            .update({ sort_order: field.sort_order })
            .eq("id", field.id);
        }

        onFieldsChange(updatedFields);
        toast.success(t("customFields.orderUpdated"));
      } catch (error) {
        console.error("Error updating field order:", error);
        toast.error(t("customFields.orderUpdateError"));
      } finally {
        setIsSaving(false);
      }
    },
    [fields, isSaving, onFieldsChange, t],
  );

  const toggleVisibility = useCallback(
    async (field: CustomField) => {
      if (isSaving) return;
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
    },
    [fields, isSaving, onFieldsChange, t],
  );

  const deleteField = useCallback(
    async (fieldId: string) => {
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
    },
    [fields, isSaving, onFieldsChange, t],
  );

  return {
    isSaving,
    reorderFields,
    toggleVisibility,
    deleteField,
  };
}
