/**
 * Pure resolver: determines which layout_photos to show for a given apartment.
 *
 * Tier priority (use the highest tier that yields ≥1 photo):
 *   1. apt.id ∈ apartment_ids           — explicit per-apartment binding (one or more apartments)
 *   2. Legacy fallback                  — apartment_ids is null/empty
 *                                         AND layout_type = apartment's layoutType
 *                                         AND is_project_preview = false
 *
 * Photos with is_project_preview=true and no binding (apartment_ids is null/empty)
 * are "catalog-only" and are excluded from the apartment gallery.
 * A preview photo WITH a binding appears in both.
 *
 * Note: area_min / area_max no longer exist. Area is a UI-only filter
 * for selecting which apartments to bind; it is never persisted.
 */

export interface LayoutPhotoRaw {
  id: string;
  image_url: string;
  description?: string | null;
  order_index: number;
  layout_type: string;
  is_project_preview: boolean;
  apartment_ids: string[] | null;
}

export interface ResolvedPhoto {
  id: string;
  image_url: string;
  description?: string | null;
  order_index: number;
  type: "layout";
}

function toResolved(photos: LayoutPhotoRaw[]): ResolvedPhoto[] {
  return photos
    .sort((a, b) => a.order_index - b.order_index)
    .map((p) => ({
      id: p.id,
      image_url: p.image_url,
      description: p.description ?? null,
      order_index: p.order_index,
      type: "layout" as const,
    }));
}

export function resolveLayoutPhotosForApartment(
  photos: LayoutPhotoRaw[],
  apartment: { id: string; layoutType: string },
): ResolvedPhoto[] {
  const { id: apartmentId } = apartment;

  // Only explicit binding: apartment must be in the photo's apartment_ids.
  // Unbound photos are catalog-only; show nothing for this apartment.
  return toResolved(
    photos.filter(
      (p) =>
        p.apartment_ids !== null &&
        p.apartment_ids.length > 0 &&
        p.apartment_ids.includes(apartmentId),
    ),
  );
}

/** Returns photos marked as project preview (for catalog/card). */
export function getProjectPreviewPhotos(
  photos: LayoutPhotoRaw[],
): ResolvedPhoto[] {
  return toResolved(photos.filter((p) => p.is_project_preview));
}

/**
 * Derives the layout_type key for an apartment.
 * Mirrors deriveLayoutType() in project-selector edge function.
 */
export function deriveApartmentLayoutType(apartment: {
  rooms: number | string;
  type: string;
}): string {
  if (apartment.type !== "apartment") return apartment.type;
  if (apartment.rooms === "free_layout") return "free_layout";
  const roomNum = Number(apartment.rooms);
  if (roomNum === 0) return "studio";
  return `${roomNum}-room`;
}
