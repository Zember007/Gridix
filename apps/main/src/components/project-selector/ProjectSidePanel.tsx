import { useCallback, useEffect, useMemo, useState } from "react";
import type { Apartment } from "@/entities/apartment/model/types";
import type { Project } from "@/entities/project/queries/useProjects";
import type { UseApartmentsDataResult } from "./hooks/useApartmentsData";
import type { FieldVisibility } from "./types";
import { Button } from "@gridix/ui";
import { Badge } from "@gridix/ui";
import FloorPlanView from "@/components/visualization/FloorPlanView";
import { cn, convertPrice, formatMoney } from "@gridix/utils/lib";
import { Loader2, Share2, X, Heart, FileDown } from "lucide-react";
import { useFavorites } from "@/hooks/useFavorites";
import { supabase } from "@gridix/utils/api";
import { toast } from "sonner";
import { useAsyncAction } from "@/shared/hooks/useAsyncAction";
import { generateApartmentPdf } from "@/features/apartment/lib/generateApartmentPdf";

export type SidePanelState =
  | { kind: "floor"; floorNumber: number }
  | { kind: "apartment"; apartment: Apartment };

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  state: SidePanelState | null;
  project: Project;
  language: string;
  themeColor: string;
  // i18next TFunction may return string or rich objects depending on options
  t: (key: string, options?: Record<string, unknown>) => unknown;
  preloadedLayoutPhotosByRooms: UseApartmentsDataResult["preloadedLayoutPhotosByRooms"];
  filteredApartments: Apartment[];
  // onSelectApartmentPreview removed as per instruction
  onOpenApartmentDetails: (apartment: Apartment) => void;
  onOpenFloorPlan: (floorNumber: number) => void;
  selectedCurrency: string;
  fieldVisibility: FieldVisibility;
};

const statusBadgeClass = (status: Apartment["status"]) => {
  switch (status) {
    case "available":
      return "bg-emerald-100 text-emerald-700 border-emerald-200";
    case "reserved":
      return "bg-amber-100 text-amber-700 border-amber-200";
    case "sold":
      return "bg-rose-100 text-rose-700 border-rose-200";
    default:
      return "";
  }
};

const getLayoutKey = (apartment: Apartment) => {
  if (apartment.type !== "apartment") return apartment.type;
  if (apartment.rooms === "free_layout") return "free_layout";
  const roomsNum =
    typeof apartment.rooms === "number"
      ? apartment.rooms
      : Number(apartment.rooms);
  if (Number.isFinite(roomsNum) && roomsNum === 0) return "studio";
  if (Number.isFinite(roomsNum)) return `${roomsNum} -room`;
  return "apartment";
};

export const ProjectSidePanel = ({
  open,
  onOpenChange,
  state,
  project,
  language,
  themeColor,
  t,
  preloadedLayoutPhotosByRooms,
  filteredApartments,
  // onSelectApartmentPreview removed from destructuring
  onOpenApartmentDetails,
  onOpenFloorPlan,
  selectedCurrency,
  fieldVisibility,
}: Props) => {
  const { toggleFavorite, isFavorite } = useFavorites(project.id);
  const [apartmentCoverPhotoById, setApartmentCoverPhotoById] = useState<
    Record<string, string | null>
  >({});
  const [apartmentCoverPhotoLoadingById, setApartmentCoverPhotoLoadingById] =
    useState<Record<string, boolean>>({});

  const tt = useMemo(
    () => (key: string, options?: Record<string, unknown>) =>
      String(t(key, options)),
    [t],
  );

  const ui = useMemo(() => {
    const isRu = language === "ru";
    return {
      open: isRu ? "Открыть" : "Open",
      openFloorPlan: isRu ? "Открыть план этажа" : "Open floor plan",
      details: isRu ? "Подробнее" : "Details",
      unitsFound: isRu ? "помещений" : "units",
      book: isRu ? "Забронировать" : "Book",
      rooms: isRu ? "к" : "rooms",
      floor: isRu ? "этаж" : "floor",
      area: isRu ? "м²" : "m²",
      share: isRu ? "Поделиться" : "Share",
      priceFrom: isRu ? "от" : "from",
      available: isRu ? "Свободно" : "Available",
      reserved: isRu ? "Забронировано" : "Reserved",
      sold: isRu ? "Продано" : "Sold",
      studio: isRu ? "Студия" : "Studio",
      found: isRu ? "Найдено" : "Found",
      summary: isRu ? "Характеристики" : "Summary",
      apartmentNumber: isRu ? "Номер квартиры" : "Apartment number",
      status: isRu ? "Статус" : "Status",
      onRequest: isRu ? "По запросу" : "On request",
      viewDetails: isRu ? "Посмотреть детали" : "View Details",
    };
  }, [language]);

  const floorApartments = useMemo(() => {
    if (!state || state.kind !== "floor") return [];
    return filteredApartments.filter(
      (a) => a.floor_number === state.floorNumber,
    );
  }, [filteredApartments, state]);

  useEffect(() => {
    if (!open) return;
    if (!state) return;

    const apartmentIds =
      state.kind === "floor"
        ? floorApartments.map((a) => a.id)
        : [state.apartment.id];

    const idsToFetch = apartmentIds.filter(
      (id) => !(id in apartmentCoverPhotoById),
    );
    if (idsToFetch.length === 0) return;

    let cancelled = false;

    const fetchFirstApartmentPhotos = async () => {
      try {
        setApartmentCoverPhotoLoadingById((prev) => {
          const next = { ...prev };
          for (const id of idsToFetch) next[id] = true;
          return next;
        });

        const { data, error } = await supabase
          .from("apartment_photos")
          .select("apartment_id, image_url, order_index")
          .in("apartment_id", idsToFetch)
          .order("order_index", { ascending: true });

        if (cancelled) return;
        if (error) throw error;

        const resolvedById: Record<string, string | null> = {};
        for (const row of data ?? []) {
          const apartmentId = (row as { apartment_id?: string | null })
            .apartment_id;
          const imageUrl = (row as { image_url?: string | null }).image_url;
          if (!apartmentId || !imageUrl) continue;
          if (!(apartmentId in resolvedById))
            resolvedById[apartmentId] = imageUrl;
        }

        // Mark apartments with no photos as resolved (null) to avoid refetching
        for (const id of idsToFetch) {
          if (!(id in resolvedById)) resolvedById[id] = null;
        }

        setApartmentCoverPhotoById((prev) => ({ ...prev, ...resolvedById }));
        setApartmentCoverPhotoLoadingById((prev) => {
          const next = { ...prev };
          for (const id of idsToFetch) next[id] = false;
          return next;
        });
      } catch (e) {
        // If we failed - stop spinner and mark as resolved to avoid refetch loops
        if (!cancelled) {
          setApartmentCoverPhotoById((prev) => {
            const next = { ...prev };
            for (const id of idsToFetch) next[id] = null;
            return next;
          });
          setApartmentCoverPhotoLoadingById((prev) => {
            const next = { ...prev };
            for (const id of idsToFetch) next[id] = false;
            return next;
          });
        }
        console.warn("Failed to load apartment photos", e);
      }
    };

    void fetchFirstApartmentPhotos();

    return () => {
      cancelled = true;
    };
  }, [open, state, floorApartments, apartmentCoverPhotoById]);

  // Safely get image URL
  const getApartmentImage = useCallback(
    (apt: Apartment) => {
      // 1) Prefer apartment first photo (cover)
      const apartmentPhoto = apartmentCoverPhotoById[apt.id];
      if (apartmentPhoto) return apartmentPhoto;

      // Check property existence safely or fallback to preloaded images
      const imgUrl = (apt as { layout_image_url?: string | null })
        .layout_image_url;
      if (imgUrl) return imgUrl;

      // Fallback to preloaded category image
      const key = getLayoutKey(apt);
      const photos = preloadedLayoutPhotosByRooms[key] || [];
      return photos[0]?.image_url ?? null;
    },
    [apartmentCoverPhotoById, preloadedLayoutPhotosByRooms],
  );

  const isApartmentCoverLoading = useCallback(
    (aptId: string) =>
      apartmentCoverPhotoLoadingById[aptId] === true ||
      !(aptId in apartmentCoverPhotoById),
    [apartmentCoverPhotoById, apartmentCoverPhotoLoadingById],
  );

  const currentApartmentImage = useMemo(() => {
    if (!state || state.kind !== "apartment") return null;
    return getApartmentImage(state.apartment);
  }, [state, getApartmentImage]);

  const handleFavoriteClick = () => {
    if (state && state.kind === "apartment") {
      const imageUrl = getApartmentImage(state.apartment);
      toggleFavorite({
        id: state.apartment.id,
        project_id: project.id,
        apartment_number: state.apartment.apartment_number,
        rooms:
          typeof state.apartment.rooms === "number" ? state.apartment.rooms : 0,
        area: state.apartment.area,
        price: state.apartment.price || 0,
        status: state.apartment.status,
        floor_number: state.apartment.floor_number,
        image_url: imageUrl,
      });
    }
  };

  const handleShare = async () => {
    if (state?.kind === "apartment") {
      const url = window.location.href;
      if (navigator.share) {
        try {
          await navigator.share({
            title: `${project.name} - Apt ${state.apartment.apartment_number} `,
            url,
          });
        } catch (err) {
          console.error("Share failed", err);
        }
      } else {
        await navigator.clipboard.writeText(url);
        // Toast or feedback could go here
      }
    }
  };

  const formatPrice = (price?: number) => {
    if (!price) return tt("project.onRequest");
    return formatMoney(
      convertPrice(price, project.currency || null, selectedCurrency),
      selectedCurrency,
    );
  };

  const formatPricePerMeter = (price?: number, area?: number) => {
    if (!price || !area) return "";
    const ppm = Math.round(price / area);
    return formatMoney(
      convertPrice(ppm, project.currency || null, selectedCurrency),
      selectedCurrency,
    );
  };

  const { run: runGeneratePdf, isRunning: isGeneratingPDF } = useAsyncAction(
    generateApartmentPdf,
    {
      onError: (error) => {
        console.error("Error generating PDF:", error);
        toast.error(tt("common.error"));
      },
    },
  );

  const handleGeneratePDF = async () => {
    if (state?.kind !== "apartment") return;
    await runGeneratePdf({ apartment: state.apartment, project, language });
  };

  if (!state) return null;

  return (
    <aside
      aria-hidden={!open}
      className={cn(
        "sticky top-0 flex h-full max-h-screen w-full flex-col overflow-y-auto bg-white",
        open ? "pointer-events-auto" : "pointer-events-none",
      )}
    >
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-gray-100 bg-white px-6 py-4">
        <div>
          {state.kind === "apartment" ? (
            fieldVisibility.number ? (
              <h2 className="text-xl font-bold text-gray-900">
                № {state.apartment.apartment_number}
              </h2>
            ) : null
          ) : (
            <h2 className="text-xl font-bold text-gray-900">
              {state.floorNumber} {ui.floor}
            </h2>
          )}
        </div>
        <div className="flex items-center gap-2">
          {state.kind === "apartment" && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-gray-400 hover:text-gray-600"
              onClick={handleShare}
            >
              <Share2 className="h-5 w-5" />
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-gray-400 hover:text-gray-600"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-6 w-6" />
          </Button>
        </div>
      </div>

      {state.kind === "floor" ? (
        <div className="custom-scrollbar flex flex-col overflow-y-auto">
          {/* Floor Preview Section */}
          <div className="shrink-0">
            <div
              onClick={() => onOpenFloorPlan(Number(state.floorNumber))}
              className="relative mb-4 flex w-full items-center justify-center overflow-hidden rounded-lg"
            >
              <FloorPlanView
                floorNumber={state.floorNumber}
                projectId={project.id}
                selectedCurrency={selectedCurrency}
              />
            </div>
          </div>

          {/* Apartment List */}
          <div className="custom-scrollbar space-y-3 bg-gray-50 p-4">
            <div className="mb-2 px-1 text-sm text-gray-500">
              {tt("project.found")}: {floorApartments.length}
            </div>

            {floorApartments.map((apt) => (
              <div
                key={apt.id}
                className="flex cursor-pointer gap-4 rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition-all duration-200 hover:border-blue-200 hover:shadow-md"
                onClick={() => onOpenApartmentDetails(apt)}
              >
                {/* Layout Image Thumbnail */}
                <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gray-50 p-1">
                  {isApartmentCoverLoading(apt.id) ? (
                    <Loader2 className="h-5 w-5 animate-spin text-gray-300" />
                  ) : (
                    (() => {
                      const img = getApartmentImage(apt);
                      return img ? (
                        <img
                          src={img}
                          alt=""
                          className="h-full w-full object-contain mix-blend-multiply"
                        />
                      ) : (
                        <span className="text-center text-[10px] leading-tight text-gray-300">
                          No Img
                        </span>
                      );
                    })()
                  )}
                </div>

                {/* Info */}
                <div className="flex min-w-0 grow flex-col justify-between">
                  <div className="flex items-start justify-between">
                    <div>
                      {fieldVisibility.number && (
                        <div className="mb-1 inline-block border-b border-gray-100 pb-1 font-bold text-gray-900">
                          № {apt.apartment_number}
                        </div>
                      )}
                      {(fieldVisibility.rooms || fieldVisibility.area) && (
                        <div className="truncate text-xs text-gray-500">
                          {fieldVisibility.rooms
                            ? apt.rooms === 0 || apt.rooms === "0"
                              ? tt("apartment.studio")
                              : `${apt.rooms}${ui.rooms} `
                            : ""}
                          {fieldVisibility.rooms && fieldVisibility.area
                            ? ", "
                            : ""}
                          {fieldVisibility.area ? `${apt.area} ${ui.area}` : ""}
                        </div>
                      )}
                    </div>
                    {fieldVisibility.status && (
                      <Badge
                        variant="outline"
                        className={cn(
                          "ml-2 whitespace-nowrap border",
                          statusBadgeClass(apt.status),
                        )}
                      >
                        {apt.status === "available"
                          ? ui.available
                          : apt.status === "reserved"
                            ? ui.reserved
                            : ui.sold}
                      </Badge>
                    )}
                  </div>

                  <div className="mt-1 text-lg font-bold text-gray-900">
                    {fieldVisibility.price
                      ? formatPrice(apt.price || 0)
                      : tt("project.onRequest")}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="custom-scrollbar flex h-full flex-col overflow-y-auto">
          {/* Summary */}
          <div className="flex shrink-0 items-center gap-6 border-b border-gray-50 bg-white px-6 py-4">
            {fieldVisibility.rooms && (
              <div className="flex flex-col">
                <span className="text-xl font-bold text-gray-900">
                  {state.apartment.rooms === 0 || state.apartment.rooms === "0"
                    ? tt("apartment.studio")
                    : `${state.apartment.rooms}${ui.rooms} `}
                </span>
              </div>
            )}
            {fieldVisibility.rooms &&
              (fieldVisibility.area || fieldVisibility.floor) && (
                <div className="h-6 w-px bg-gray-200"></div>
              )}
            {fieldVisibility.area && (
              <div className="flex flex-col">
                <span className="text-xl font-bold text-gray-900">
                  {state.apartment.area}{" "}
                  <span className="text-base font-medium text-gray-500">
                    {ui.area}
                  </span>
                </span>
              </div>
            )}
            {fieldVisibility.area && fieldVisibility.floor && (
              <div className="h-6 w-px bg-gray-200"></div>
            )}
            {fieldVisibility.floor && (
              <div className="flex flex-col">
                <span className="text-xl font-bold text-gray-900">
                  {state.apartment.floor_number}{" "}
                  <span className="text-base font-medium text-gray-500">
                    {ui.floor}
                  </span>
                </span>
              </div>
            )}
            {fieldVisibility.status && (
              <div className="ml-auto flex items-center justify-between">
                <Badge
                  variant="outline"
                  className={cn(
                    "ml-2 whitespace-nowrap border",
                    statusBadgeClass(state.apartment.status),
                  )}
                >
                  {state.apartment.status === "available"
                    ? ui.available
                    : state.apartment.status === "reserved"
                      ? ui.reserved
                      : ui.sold}
                </Badge>
              </div>
            )}
          </div>
          <div className="custom-scrollbar flex-1 overflow-y-auto">
            {/* Plan Image */}
            <div className="relative flex w-full shrink-0 items-center justify-center overflow-hidden border-b border-gray-100 bg-white p-6">
              <div className="group relative h-full w-full cursor-zoom-in">
                {isApartmentCoverLoading(state.apartment.id) ? (
                  <div className="flex h-full items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-gray-300" />
                  </div>
                ) : currentApartmentImage ? (
                  <img
                    src={currentApartmentImage}
                    alt="Plan"
                    className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-110"
                    onClick={() => onOpenApartmentDetails(state.apartment)}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-gray-300">
                    No Image
                  </div>
                )}
              </div>
            </div>
          </div>
          {/* Price */}

          <div className={"mt-auto"}>
            <div className="shrink-0 bg-white px-6 py-4">
              <div className="flex flex-col">
                <span className="text-3xl font-bold text-gray-900">
                  {fieldVisibility.price
                    ? formatPrice(state.apartment.price ?? undefined)
                    : tt("project.onRequest")}
                </span>
                {state.apartment.price && fieldVisibility.area && (
                  <span className="text-sm font-medium text-gray-500">
                    {formatPricePerMeter(
                      state.apartment.price ?? undefined,
                      state.apartment.area,
                    )}{" "}
                    / {ui.area}
                  </span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex shrink-0 flex-col gap-3 border-b border-gray-100 bg-white px-6 py-4">
              <Button
                type="button"
                className="h-12 w-full rounded-xl text-lg font-semibold text-white shadow-lg transition-all active:scale-[0.98]"
                style={{ backgroundColor: themeColor }}
                onClick={() => onOpenApartmentDetails(state.apartment)}
              >
                {ui.viewDetails}
              </Button>
              <div className={"flex gap-3"}>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className={cn(
                    "h-12 w-12 rounded-xl border-gray-200 px-4 py-3 hover:bg-gray-50 hover:text-red-500",
                    isFavorite(state.apartment.id) &&
                      "border-red-200 bg-red-50 text-red-500",
                  )}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleFavoriteClick();
                  }}
                >
                  <Heart
                    className={cn(
                      "h-6 w-6 transition-colors",
                      isFavorite(state.apartment.id)
                        ? "fill-red-500 text-red-500"
                        : "",
                    )}
                  />
                </Button>

                <Button
                  variant="outline"
                  onClick={handleGeneratePDF}
                  disabled={isGeneratingPDF}
                  className={`h-12 w-full rounded-xl border-2 border-gray-200 px-4 py-3 hover:border-gray-300 ${project?.installment_enabled && state.apartment.price && fieldVisibility.price ? "" : "w-full"}`}
                >
                  {isGeneratingPDF ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <FileDown className="h-5 w-5" />
                  )}
                  <span className="hidden xs:block">PDF</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
