import { useCallback } from "react";
import { toast } from "sonner";
import { supabase } from "@gridix/utils/api";
import { deleteApartmentPhoto } from "@/features/projectEditor/api/projectEditorApi";
import { Apartment } from "@/entities/apartment/model/types";
import { useLanguage } from "@gridix/utils/react";
import { ApartmentPhoto } from "./useApartmentPhotosManager";

interface UseApartmentPhotosActionsParams {
  apartments: Apartment[];
  selectedApartment: string;
  photos: ApartmentPhoto[];
  onAfterDelete: () => Promise<void>;
  onAfterDuplicate: () => Promise<void>;
  onAfterReorder: () => Promise<void>;
}

export const useApartmentPhotosActions = ({
  apartments,
  selectedApartment,
  photos,
  onAfterDelete,
  onAfterDuplicate,
  onAfterReorder,
}: UseApartmentPhotosActionsParams) => {
  const { t } = useLanguage();

  const handleDeletePhoto = useCallback(
    async (photoId: string, imageUrl: string) => {
      try {
        await deleteApartmentPhoto(photoId, imageUrl);
        toast.success(t("photosManager.deleteSuccess"));
        await onAfterDelete();
      } catch (error) {
        console.error("Error deleting photo:", error);
        toast.error(t("photosManager.deleteError"));
      }
    },
    [onAfterDelete, t],
  );

  const duplicatePhotosToApartments = useCallback(
    async (targetApartmentIds: string[]) => {
      if (
        !selectedApartment ||
        photos.length === 0 ||
        targetApartmentIds.length === 0
      ) {
        return;
      }

      try {
        const targetApartments = apartments.filter((apt) =>
          targetApartmentIds.includes(apt.id),
        );

        const duplicatePromises = targetApartments.map(async (apartment) => {
          const { data: existingPhotos, error: existingError } = await supabase
            .from("apartment_photos")
            .select("image_url")
            .eq("apartment_id", apartment.id);

          if (existingError) throw existingError;

          const existingUrls = new Set(
            (existingPhotos || []).map((p) => p.image_url),
          );
          const photosToInsert = photos.filter(
            (p) => !existingUrls.has(p.image_url),
          );
          if (photosToInsert.length === 0) return;

          const insertPayload = photosToInsert.map((photo) => ({
            apartment_id: apartment.id,
            image_url: photo.image_url,
            description: photo.description,
            order_index: photo.order_index,
          }));

          const { error: insertError } = await supabase
            .from("apartment_photos")
            .insert(insertPayload);

          if (insertError) throw insertError;
        });

        await Promise.all(duplicatePromises);
        toast.success(
          t("photosManager.duplicateSuccess", {
            count: targetApartments.length,
          }),
        );
        await onAfterDuplicate();
      } catch (error) {
        console.error("Error duplicating photos:", error);
        toast.error(t("photosManager.duplicateError"));
      }
    },
    [apartments, onAfterDuplicate, photos, selectedApartment, t],
  );

  const handleReorderPhotos = useCallback(
    async (nextPhotos: ApartmentPhoto[]) => {
      if (!selectedApartment || nextPhotos.length === 0) {
        return;
      }

      const hasChanges = nextPhotos.some(
        (photo, index) =>
          photo.id !== photos[index]?.id || photo.order_index !== index,
      );

      if (!hasChanges) {
        return;
      }

      const updateResults = await Promise.all(
        nextPhotos.map((photo, index) =>
          supabase
            .from("apartment_photos")
            .update({ order_index: index })
            .eq("id", photo.id)
            .neq("order_index", index),
        ),
      );

      const failedUpdate = updateResults.find((result) => result.error);
      if (failedUpdate?.error) {
        console.error("Error reordering apartment photos:", failedUpdate.error);
        throw failedUpdate.error;
      }

      await onAfterReorder();
    },
    [onAfterReorder, photos, selectedApartment],
  );

  return {
    handleDeletePhoto,
    duplicatePhotosToApartments,
    handleReorderPhotos,
  };
};
