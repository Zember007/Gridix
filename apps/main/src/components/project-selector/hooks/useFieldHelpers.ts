import { useCallback } from 'react';
import { Language } from "@gridix/utils/lib";
import type { Apartment } from '@/entities/apartment/model/types';

interface FieldConfig {
  field_label: string;
  field_label_translations?: Partial<Record<Language, string>>;
}

interface UseFieldHelpersParams {
  language: Language;
  t: (key: string) => string;
  convertPrice: (value: number, fromCurrency?: string | null, toCurrency?: string) => number;
  // explicit union to work well with exactOptionalPropertyTypes
  projectCurrency: string | null | undefined;
  selectedCurrency: string;
  selectedType: string | null;
}

export const useFieldHelpers = ({
  language,
  t,
  convertPrice,
  projectCurrency,
  selectedCurrency,
  selectedType,
}: UseFieldHelpersParams) => {
  const getFieldLabel = useCallback(
    (field: FieldConfig) => {
      if (field.field_label_translations && field.field_label_translations[language]) {
        return field.field_label_translations[language];
      }
      return field.field_label;
    },
    [language],
  );

  const getCustomFieldValue = useCallback((apartment: Apartment, fieldName: string) => {
    if (!apartment.custom_fields) return null;
    const customFields = apartment.custom_fields as Record<string, unknown>;
    return customFields[fieldName] || null;
  }, []);

  const formatPrice = useCallback((price: number) => {
    return new Intl.NumberFormat('en-US').format(Math.round(price));
  }, []);

  const formatFieldValue = useCallback(
    (value: unknown, fieldType: string, fieldName: string) => {
      if (
        value === null ||
        value === undefined ||
        ((value === 0 || Number.isNaN(value)) &&
          (selectedType == 'commercial' || selectedType == 'parking'))
      )
        return '-';

      if (fieldName === 'price') {
        return (
          formatPrice(convertPrice(value as number, projectCurrency, selectedCurrency)) +
          ' ' +
          selectedCurrency
        );
      }

      if (fieldName === 'area') {
        return value + ' м²';
      }

      if (fieldName === 'floor_number') {
        return value + ' ' + t('project.floor').toLowerCase();
      }

      if (fieldName === 'rooms') {
        if (value === 0) {
          return t('apartment.studio');
        } else {
          return value + ' ' + t('apartment.room').toLowerCase();
        }
      }

      switch (fieldType) {
        case 'boolean':
          return value ? 'Да' : 'Нет';
        case 'number':
          return typeof value === 'number' ? value.toString() : String(value);
        case 'select':
          return Array.isArray(value) ? value.join(', ') : String(value);
        default:
          return String(value);
      }
    },
    [convertPrice, formatPrice, projectCurrency, selectedCurrency, selectedType, t],
  );

  return {
    getFieldLabel,
    getCustomFieldValue,
    formatFieldValue,
    formatPrice,
  };
};


