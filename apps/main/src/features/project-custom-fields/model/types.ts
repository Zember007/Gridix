import type { Language } from "@gridix/utils/lib";

export type CustomFieldType = "text" | "number" | "select" | "boolean";

export interface CustomField {
  id?: string;
  field_name: string;
  field_label: string;
  field_label_translations?: Partial<Record<Language, string>>;
  field_type: CustomFieldType;
  is_required: boolean;
  field_options?: string[];
  sort_order: number;
  is_visible: boolean;
}
