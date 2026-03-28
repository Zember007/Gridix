import type { Language } from "@gridix/utils/lib";
import type { CustomField } from "./types";

type GetCustomFieldLabelInput = Pick<
  CustomField,
  "field_label" | "field_label_translations"
>;

export function getCustomFieldLabel(
  field: GetCustomFieldLabelInput,
  language: Language,
) {
  const translations = field.field_label_translations;
  const translated = translations?.[language];
  if (translated) return translated;
  return field.field_label;
}
