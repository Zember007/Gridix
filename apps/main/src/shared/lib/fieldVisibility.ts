import type { FieldSetting } from "@/hooks/useFields";

export interface ApartmentFieldVisibility {
  type: boolean;
  rooms: boolean;
  floor: boolean;
  price: boolean;
  area: boolean;
  number: boolean;
  status: boolean;
}

const DEFAULT_APARTMENT_FIELD_VISIBILITY: ApartmentFieldVisibility = {
  type: true,
  rooms: true,
  floor: true,
  price: true,
  area: true,
  number: true,
  status: true,
};

export const getApartmentFieldVisibility = (
  fieldSettings: FieldSetting[],
): ApartmentFieldVisibility => {
  return fieldSettings.reduce<ApartmentFieldVisibility>(
    (acc, field) => {
      if (field.field_name in acc) {
        const fieldName = field.field_name as keyof ApartmentFieldVisibility;
        acc[fieldName] = field.is_visible;
      }

      return acc;
    },
    { ...DEFAULT_APARTMENT_FIELD_VISIBILITY },
  );
};
