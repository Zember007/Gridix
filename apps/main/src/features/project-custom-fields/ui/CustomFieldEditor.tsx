import {
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
} from "@gridix/ui";
import { Check, X } from "lucide-react";
import {
  LANGUAGE_CONFIG,
  SUPPORTED_LANGUAGES,
  type Language,
} from "@gridix/utils/lib";
import { useLanguage } from "@/contexts/LanguageContext";
import type { CustomField, CustomFieldType } from "../model";

export interface CustomFieldEditorProps {
  field: CustomField;
  isNew?: boolean;
  onChange: (field: CustomField) => void;
  onSave: () => void;
  onCancel: () => void;
}

export function CustomFieldEditor({
  field,
  isNew = false,
  onChange,
  onSave,
  onCancel,
}: CustomFieldEditorProps) {
  const { t } = useLanguage();

  return (
    <div className="space-y-4 rounded-lg border p-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <Label htmlFor="field_label">{t("customFields.fieldName")}</Label>
          <Input
            id="field_label"
            value={field.field_label}
            onChange={(e) => {
              onChange({ ...field, field_label: e.target.value });
            }}
            placeholder={t("customFields.fieldNamePlaceholder")}
          />
        </div>

        <div>
          <Label htmlFor="field_type">{t("customFields.fieldType")}</Label>
          <Select
            value={field.field_type}
            onValueChange={(value: CustomFieldType) => {
              onChange({ ...field, field_type: value });
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="text">
                {t("customFields.fieldTypeText")}
              </SelectItem>
              <SelectItem value="number">
                {t("customFields.fieldTypeNumber")}
              </SelectItem>
              <SelectItem value="select">
                {t("customFields.fieldTypeSelect")}
              </SelectItem>
              <SelectItem value="boolean">
                {t("customFields.fieldTypeBoolean")}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label>{t("customFields.translations")}</Label>
        <div className="mt-2 space-y-2">
          {SUPPORTED_LANGUAGES.map((lang) => {
            return (
              <div key={lang} className="flex items-center gap-2">
                <span className="flex w-12 items-center gap-1 text-sm">
                  {LANGUAGE_CONFIG[lang].flag}{" "}
                  {LANGUAGE_CONFIG[lang].code.toUpperCase()}
                </span>
                <Input
                  value={field.field_label_translations?.[lang] || ""}
                  onChange={(e) => {
                    const updatedTranslations: Partial<
                      Record<Language, string>
                    > = {
                      ...field.field_label_translations,
                      [lang]: e.target.value,
                    };
                    onChange({
                      ...field,
                      field_label_translations: updatedTranslations,
                    });
                  }}
                  placeholder={`${t("customFields.fieldNamePlaceholder")} (${LANGUAGE_CONFIG[lang].name})`}
                  className="flex-1"
                />
              </div>
            );
          })}
        </div>
      </div>

      {field.field_type === "select" && (
        <div>
          <Label>{t("customFields.options")}</Label>
          <textarea
            className="mt-1 w-full resize-none rounded border p-2"
            rows={3}
            value={field.field_options?.join("\n") || ""}
            onChange={(e) => {
              const options = e.target.value.split("\n");
              onChange({ ...field, field_options: options });
            }}
            placeholder={t("customFields.optionsPlaceholder")}
          />
        </div>
      )}

      <div className="flex items-center space-x-2">
        <Switch
          id="is_required"
          checked={field.is_required}
          onCheckedChange={(checked) => {
            onChange({ ...field, is_required: checked });
          }}
        />
        <Label htmlFor="is_required">{t("customFields.required")}</Label>
      </div>

      <div className="flex gap-2">
        <Button onClick={onSave}>
          <Check className="mr-2 h-4 w-4" />
          {t("customFields.save")}
        </Button>
        <Button variant="outline" onClick={onCancel}>
          <X className="mr-2 h-4 w-4" />
          {t("customFields.cancel")}
        </Button>
        {isNew ? null : null}
      </div>
    </div>
  );
}
