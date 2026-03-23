import { supabase } from "@/shared/api/supabase";
import {
  Apartment,
  normalizeApartmentData,
} from "@/entities/apartment/model/types";

interface SyncApartmentsParams {
  sourceApartment: Apartment;
  targetApartments: Apartment[];
  selectedApartmentIds: Set<string>;
}

export const syncApartments = async ({
  sourceApartment,
  targetApartments,
  selectedApartmentIds,
}: SyncApartmentsParams) => {
  const syncData = {
    price: sourceApartment.price,
    status: sourceApartment.status,
    custom_fields: sourceApartment.custom_fields,
    updated_at: new Date().toISOString(),
  };

  const apartmentsToSync = targetApartments.filter((apt) =>
    selectedApartmentIds.has(apt.id),
  );

  const updatePromises = apartmentsToSync.map((apartment) =>
    supabase
      .from("apartments")
      .update(syncData)
      .eq("id", apartment.id)
      .select()
      .single(),
  );

  const results = await Promise.all(updatePromises);
  const errors = results.filter((result) => result.error);

  if (errors.length > 0) {
    throw new Error(`Ошибка при обновлении ${errors.length} квартир`);
  }

  return results.map((result) => normalizeApartmentData(result.data));
};
