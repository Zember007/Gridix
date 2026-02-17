import { Card, CardContent } from "@gridix/ui";
import { Badge } from "@gridix/ui";
import { Button } from "@gridix/ui";
import { Tabs, TabsList, TabsTrigger } from "@gridix/ui";
import { List, Grid, Building2, Heart, Share2 } from "lucide-react";
import { useMemo } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useInstallment } from "@/hooks/useInstallment";
import { Apartment } from "@/entities/apartment/model/types";
import { cn, getCurrencySymbolSafe } from "@gridix/utils/lib";
import { toast } from "sonner";
import { useFavorites } from "@/hooks/useFavorites";
import { Tables } from "@gridix/types/database";
import type { FieldVisibility } from "../types";

type Project = Tables<"projects">;

interface LayoutPhoto {
  id: string;
  image_url: string;
  description?: string;
  order_index: number;
  type: "layout";
}

interface FieldSetting {
  id?: string;
  field_name: string;
  field_label: string;
  field_label_translations?: Partial<Record<string, string>>;
  field_type: string;
  is_visible: boolean;
  is_custom: boolean;
  sort_order: number;
}

interface ListViewProps {
  filteredApartments: Apartment[];
  listViewMode: "list" | "grid";
  setListViewMode: (mode: "list" | "grid") => void;
  selectedType: "all" | "apartment" | "commercial" | "parking";
  setSelectedType: (
    value: "all" | "apartment" | "commercial" | "parking",
  ) => void;
  openApartmentDetails: (apartment: Apartment) => void;
  preloadedLayoutPhotosByRooms: Record<string, LayoutPhoto[]>;
  getVisibleFields: () => FieldSetting[];
  getCustomFieldValue: (apartment: Apartment, fieldName: string) => unknown;
  formatFieldValue: (
    value: unknown,
    fieldType: string,
    fieldName: string,
  ) => string;
  getFieldLabel: (field: FieldSetting) => string;
  groupApartmentsByFloor: { floor: number; apartments: Apartment[] }[];
  convertPrice: (
    price: number,
    fromCurrency: string | null | undefined,
    toCurrency: string,
  ) => number;
  formatPrice: (price: number) => string;
  project?: Project;
  selectedCurrency: string;
  isMobile: boolean;
  themeColor?: string;
  hideViewToggle?: boolean;
  fieldVisibility: FieldVisibility;
}

export const ListView = ({
  filteredApartments,
  listViewMode,
  setListViewMode,
  selectedType,
  setSelectedType,
  openApartmentDetails,
  preloadedLayoutPhotosByRooms,
  getVisibleFields,
  getCustomFieldValue,
  formatFieldValue,
  getFieldLabel,
  groupApartmentsByFloor,
  convertPrice,
  formatPrice,
  project,
  selectedCurrency,
  isMobile,
  themeColor = "#000000",
  hideViewToggle = false,
  fieldVisibility,
}: ListViewProps) => {
  const { t } = useLanguage();

  const { isFavorite, toggleFavorite } = useFavorites();

  const getButtonStyle = (isActive: boolean) =>
    isActive ? { backgroundColor: themeColor, color: "white" } : {};

  const getButtonClass = (isActive: boolean) =>
    isActive ? "text-white" : "border-gray-300";

  // Installment calculation
  const { calculateMonthlyPayment } = useInstallment(project);

  // Handle favorite toggle
  const handleShare = async (e: React.MouseEvent, apartment: Apartment) => {
    e.stopPropagation();
    try {
      const url = window.location.href;
      const title = `${t("apartment.apartment")} № ${apartment?.apartment_number}`;
      const text = project?.name ? project.name : "";
      if (navigator.share) {
        await navigator.share({ title, text, url });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success(t("common.copied"));
      }
    } catch (error) {
      // User might cancel share; fallback to copying link
      try {
        await navigator.clipboard.writeText(window.location.href);
        toast.success(t("common.copied"));
      } catch (error) {
        console.error("Error copying link to clipboard:", error);
      }
    }
  };

  const maxFloor = filteredApartments.reduce((max, apartment) => {
    return Math.max(max, apartment.floor_number || 0);
  }, 0);

  const getFavoriteImageUrl = (apartment: Apartment): string | null => {
    const layoutKey =
      apartment.type === "apartment"
        ? apartment.rooms == 0
          ? "studio"
          : apartment.rooms === "free_layout"
            ? "free_layout"
            : `${apartment.rooms}-room`
        : apartment.type;
    const photos = preloadedLayoutPhotosByRooms[layoutKey] || [];
    return photos[0]?.image_url ?? null;
  };

  const handleFavoriteToggle = (e: React.MouseEvent, apartment: Apartment) => {
    e.stopPropagation();
    if (!apartment) return;

    toggleFavorite({
      id: apartment.id,
      project_id: apartment.project_id,
      apartment_number: apartment.apartment_number,
      rooms:
        typeof apartment.rooms === "number"
          ? apartment.rooms
          : Number(apartment.rooms),
      area: apartment.area,
      price: typeof apartment.price === "number" ? apartment.price : 0,
      status: apartment.status,
      floor_number: apartment.floor_number,
      image_url: getFavoriteImageUrl(apartment),
    });
  };

  const priceVisible = fieldVisibility.price;
  const areaVisible = fieldVisibility.area;
  const roomsVisible = fieldVisibility.rooms;

  const hasVisibleCardDetails = useMemo(() => {
    const hasCustomVisibleFields = getVisibleFields().some(
      (field) => field.is_custom,
    );
    return (
      roomsVisible ||
      areaVisible ||
      fieldVisibility.number ||
      fieldVisibility.floor ||
      fieldVisibility.status ||
      hasCustomVisibleFields
    );
  }, [
    areaVisible,
    fieldVisibility.floor,
    fieldVisibility.number,
    fieldVisibility.status,
    getVisibleFields,
    roomsVisible,
  ]);

  return (
    <div className="container mx-auto flex grow py-8 md:px-6">
      <div
        className={`${project?.has_commercial || project?.has_parking ? "space-y-6" : "space-y-1"} flex w-full flex-col`}
      >
        <div className="flex justify-between gap-[20px]">
          <h2
            className={`${isMobile ? "text-xl" : "text-2xl"} font-bold text-gray-900`}
          >
            {project?.project_type === "object"
              ? t("project.objectList")
              : t("project.apartmentsList")}
          </h2>
          {!hideViewToggle && (
            <div className="flex items-center justify-end gap-2">
              <Button
                variant={listViewMode === "list" ? "default" : "outline"}
                size="sm"
                className={getButtonClass(listViewMode === "list")}
                style={getButtonStyle(listViewMode === "list")}
                onClick={() => setListViewMode("list")}
              >
                <List className="mr-1 h-4 w-4" />
                {t("common.list")}
              </Button>
              <Button
                variant={listViewMode === "grid" ? "default" : "outline"}
                size="sm"
                className={getButtonClass(listViewMode === "grid")}
                style={getButtonStyle(listViewMode === "grid")}
                onClick={() => setListViewMode("grid")}
              >
                <Grid className="mr-1 h-4 w-4" />
                {t("common.grid")}
              </Button>
            </div>
          )}
        </div>

        {/* Type selector tabs - only show if project has commercial or parking */}
        {(project?.has_commercial || project?.has_parking) && (
          <Tabs
            value={selectedType}
            onValueChange={(value) =>
              setSelectedType(
                value as "all" | "apartment" | "commercial" | "parking",
              )
            }
          >
            <TabsList className="flex h-auto w-full flex-col md:flex-row">
              <TabsTrigger className="w-full" value="all">
                {t("project.allTypes")}
              </TabsTrigger>
              <TabsTrigger className="w-full" value="apartment">
                {t("apartmentsManager.typeApartment")}
              </TabsTrigger>
              {project?.has_commercial && (
                <TabsTrigger className="w-full" value="commercial">
                  {t("apartmentsManager.typeCommercial")}
                </TabsTrigger>
              )}
              {project?.has_parking && (
                <TabsTrigger className="w-full" value="parking">
                  {t("apartmentsManager.typeParking")}
                </TabsTrigger>
              )}
            </TabsList>
          </Tabs>
        )}

        <div className="max-h-[calc(100vh-400px)] min-h-[600px] grow">
          <div className="max-h-full space-y-4 overflow-y-auto">
            {listViewMode === "list" ? (
              // Desktop table layout
              <>
                {isMobile ? (
                  // Mobile card layout
                  <div className="space-y-4">
                    {filteredApartments.map((apartment) => (
                      <Card
                        key={apartment.id}
                        className="relative cursor-pointer overflow-hidden transition-shadow hover:shadow-md"
                        onClick={() => {
                          if (apartment.status === "available") {
                            openApartmentDetails(apartment);
                          } else {
                            toast.error(t("apartment.sold"));
                          }
                        }}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center space-x-4">
                            <div className="flex-shrink-0">
                              <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-lg bg-gray-100">
                                {(() => {
                                  const layoutKey =
                                    apartment.type === "apartment"
                                      ? apartment.rooms == 0
                                        ? "studio"
                                        : apartment.rooms === "free_layout"
                                          ? "free_layout"
                                          : `${apartment.rooms}-room`
                                      : apartment.type;
                                  const photos =
                                    preloadedLayoutPhotosByRooms[layoutKey] ||
                                    [];
                                  const first = photos[0];
                                  return first ? (
                                    <img
                                      src={first.image_url}
                                      alt={
                                        apartment.rooms == 0
                                          ? t("apartment.studio")
                                          : apartment.rooms === "free_layout"
                                            ? t("apartment.freeLayout")
                                            : `${apartment.rooms}-${t("apartment.rooms")}`
                                      }
                                      className="h-full w-full object-cover"
                                    />
                                  ) : (
                                    <Building2 className="h-8 w-8 text-gray-400" />
                                  );
                                })()}
                              </div>
                            </div>
                            <div className="flex-grow space-y-1">
                              <div className="flex items-center justify-between">
                                {roomsVisible && (
                                  <span className="text-sm font-medium">
                                    {apartment.type === "apartment"
                                      ? apartment.rooms == 0
                                        ? t("apartment.studio")
                                        : `${apartment.rooms} ${t("apartment.rooms")}`
                                      : apartment.type}
                                  </span>
                                )}
                                {fieldVisibility.status && (
                                  <Badge
                                    variant={
                                      apartment.status === "available"
                                        ? "default"
                                        : "secondary"
                                    }
                                    className={cn(
                                      apartment.status === "available"
                                        ? "bg-green-500"
                                        : "bg-gray-500",
                                      "max-sm:absolute max-sm:left-1 max-sm:top-1 max-sm:h-5 max-sm:w-2 max-sm:border-[50%]",
                                    )}
                                  >
                                    <span className={"hidden sm:block"}>
                                      {apartment.status === "available"
                                        ? t("common.available")
                                        : t("common.unavailable")}
                                    </span>
                                  </Badge>
                                )}
                              </div>
                              <div className="space-y-1 text-xs text-gray-600">
                                {areaVisible && <div>{apartment.area} м² </div>}
                                <div className="text-sm font-bold text-gray-900">
                                  {apartment.price && priceVisible
                                    ? `${formatPrice(convertPrice(apartment.price, project?.currency, selectedCurrency))} ${getCurrencySymbolSafe(selectedCurrency)}`
                                    : t("project.onRequest")}
                                </div>
                                {/* Installment pricing for mobile */}
                                {apartment.price &&
                                  project?.installment_enabled &&
                                  priceVisible && (
                                    <div className="text-xs text-gray-500">
                                      {t("project.from")}{" "}
                                      {formatPrice(
                                        convertPrice(
                                          calculateMonthlyPayment(
                                            apartment.price,
                                          ),
                                          project?.currency,
                                          selectedCurrency,
                                        ),
                                      )}{" "}
                                      {getCurrencySymbolSafe(selectedCurrency)}
                                    </div>
                                  )}
                                {/* Custom fields for mobile */}
                                {getVisibleFields()
                                  .slice(0, 2)
                                  .map((field) => {
                                    let value: unknown = null;

                                    if (field.is_custom) {
                                      value = getCustomFieldValue(
                                        apartment,
                                        field.field_name,
                                      );
                                    } else {
                                      switch (field.field_name) {
                                        case "rooms":
                                          value = apartment.rooms;
                                          break;
                                        case "area":
                                          value = apartment.area;
                                          break;
                                        case "price":
                                          value = apartment.price;
                                          break;
                                        case "status":
                                          value = apartment.status;
                                          break;
                                        case "floor":
                                          value = apartment.floor_number;
                                          break;
                                        case "number":
                                          value = apartment.apartment_number;
                                          break;
                                        default:
                                          value = null;
                                      }
                                    }

                                    if (value === null) return null;

                                    return (
                                      <div
                                        key={field.id}
                                        className="text-xs text-gray-500"
                                      >
                                        {field.is_custom
                                          ? getFieldLabel(field)
                                          : t(`project.${field.field_name}`)}
                                        :{" "}
                                        {formatFieldValue(
                                          value,
                                          field.field_type,
                                          field.field_name,
                                        )}
                                      </div>
                                    );
                                  })}
                              </div>
                            </div>
                            {apartment.status === "available" && (
                              <div className="ml-2 flex flex-col gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 w-8 p-2"
                                  onClick={(e) => handleShare(e, apartment)}
                                >
                                  <Share2 className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 w-8 p-2"
                                  onClick={(e) =>
                                    handleFavoriteToggle(e, apartment)
                                  }
                                >
                                  <Heart
                                    className={`h-4 w-4 ${isFavorite(apartment.id) ? "fill-current text-red-500" : "text-black"}`}
                                  />
                                </Button>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  // Desktop horizontal card layout (like Figma design)
                  <div className="space-y-4">
                    {filteredApartments.map((apartment) => (
                      <Card
                        key={apartment.id}
                        className="group cursor-pointer overflow-hidden rounded-[30px] bg-white transition-shadow hover:shadow-md"
                        onClick={() => openApartmentDetails(apartment)}
                      >
                        <CardContent className="p-0">
                          <div className="flex h-[89px] items-center">
                            {/* Apartment Image */}
                            <div className="ml-[57px] flex-shrink-0">
                              <div className="flex h-[64px] w-[60px] items-center justify-center overflow-hidden rounded-lg bg-gray-100">
                                {(() => {
                                  const layoutKey =
                                    apartment.type === "apartment"
                                      ? apartment.rooms == 0
                                        ? "studio"
                                        : apartment.rooms === "free_layout"
                                          ? "free_layout"
                                          : `${apartment.rooms}-room`
                                      : apartment.type;
                                  const photos =
                                    preloadedLayoutPhotosByRooms[layoutKey] ||
                                    [];
                                  const first = photos[0];
                                  return first ? (
                                    <img
                                      src={first.image_url}
                                      alt={
                                        apartment.rooms == 0
                                          ? t("apartment.studio")
                                          : apartment.rooms === "free_layout"
                                            ? t("apartment.freeLayout")
                                            : `${apartment.rooms}-${t("apartment.rooms")}`
                                      }
                                      className="h-full w-full object-cover"
                                    />
                                  ) : (
                                    <Building2 className="h-8 w-8 text-gray-400" />
                                  );
                                })()}
                              </div>
                            </div>

                            {/* Apartment Info - Horizontal scrollable container with gradient indicators */}
                            {hasVisibleCardDetails && (
                              <div className="relative ml-[57px] h-full flex-1 overflow-hidden">
                                {/* Left gradient indicator */}
                                <div
                                  className="pointer-events-none absolute bottom-0 left-0 top-0 z-10 w-8 bg-gradient-to-r from-white to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                                  id={`left-gradient-${apartment.id}`}
                                ></div>

                                {/* Right gradient indicator */}
                                <div
                                  className="pointer-events-none absolute bottom-0 right-0 top-0 z-10 w-8 bg-gradient-to-l from-white to-transparent opacity-100 transition-opacity duration-300"
                                  id={`right-gradient-${apartment.id}`}
                                ></div>

                                <div
                                  className="scrollbar-hide hover:scrollbar-thin hover:scrollbar-thumb-gray-300 hover:scrollbar-track-transparent flex h-full items-center gap-8 overflow-x-auto scroll-smooth pb-1 transition-all duration-300"
                                  onScroll={(e) => {
                                    const container = e.currentTarget;
                                    const leftGradient =
                                      document.getElementById(
                                        `left-gradient-${apartment.id}`,
                                      );
                                    const rightGradient =
                                      document.getElementById(
                                        `right-gradient-${apartment.id}`,
                                      );

                                    if (leftGradient && rightGradient) {
                                      const isAtStart =
                                        container.scrollLeft <= 10;
                                      const isAtEnd =
                                        container.scrollLeft >=
                                        container.scrollWidth -
                                          container.clientWidth -
                                          10;

                                      leftGradient.style.opacity = isAtStart
                                        ? "0"
                                        : "1";
                                      rightGradient.style.opacity = isAtEnd
                                        ? "0"
                                        : "1";
                                    }
                                  }}
                                >
                                  {/* Room type */}
                                  {roomsVisible && (
                                    <div className="min-w-[99px] flex-shrink-0 text-center transition-transform duration-200 hover:scale-105">
                                      <div className="text-[20px] font-medium leading-[26px] text-black transition-colors duration-200 hover:text-gray-700">
                                        {apartment.type === "apartment"
                                          ? apartment.rooms == 0
                                            ? t("apartment.studio")
                                            : apartment.rooms === "free_layout"
                                              ? t("apartment.freeLayout")
                                              : `${apartment.rooms} ${t("apartment.rooms")}`
                                          : apartment.type}
                                      </div>
                                    </div>
                                  )}

                                  {/* Area */}
                                  {areaVisible && (
                                    <div className="relative flex min-w-[71px] flex-shrink-0 -translate-y-[5px] flex-col text-center transition-transform duration-200 hover:scale-105">
                                      <span className="truncate text-[11px] text-gray-400">
                                        {t("project.area")}
                                      </span>
                                      <div className="text-[20px] font-light leading-[24px] text-black transition-colors duration-200 hover:text-gray-700">
                                        {apartment.area} м²
                                      </div>
                                    </div>
                                  )}

                                  {/* Custom fields - scrollable */}
                                  {getVisibleFields().map((field) => {
                                    let value: unknown = null;
                                    let label: string = "";
                                    if (field.is_custom) {
                                      value = getCustomFieldValue(
                                        apartment,
                                        field.field_name,
                                      );
                                      label = getFieldLabel(field);
                                    } else {
                                      label = t(`project.${field.field_name}`);
                                      switch (field.field_name) {
                                        case "rooms":
                                          value =
                                            apartment.rooms == 0
                                              ? t("apartment.studio")
                                              : `${apartment.rooms} ${t("apartment.rooms")}`;
                                          break;
                                        case "area":
                                          value = `${apartment.area} м²`;
                                          break;
                                        case "price":
                                          value = apartment.price;
                                          break;
                                        case "status":
                                          value = apartment.status;
                                          break;
                                        case "floor":
                                          value = `${apartment.floor_number} ${t("project.from")} ${maxFloor}`;
                                          break;
                                        case "number":
                                          value = apartment.apartment_number;
                                          break;
                                        default:
                                          value = null;
                                      }
                                    }

                                    if (
                                      value === null ||
                                      field.field_name === "rooms" ||
                                      field.field_name === "area"
                                    )
                                      return null;

                                    return (
                                      <div
                                        key={field.id}
                                        className={`relative flex min-w-[97px] flex-shrink-0 flex-col text-center transition-transform duration-200 hover:scale-105 ${label ? "-translate-y-[5px]" : ""}`}
                                      >
                                        <span className="truncate text-[11px] text-gray-400">
                                          {label}
                                        </span>
                                        <div className="rounded-md px-2 py-1 text-[16px] font-light leading-[21px] text-[#6C6C6C] transition-colors duration-200 hover:bg-gray-50 hover:text-gray-800">
                                          {field.field_name === "floor"
                                            ? `${apartment.floor_number} ${t("project.from")} ${maxFloor}`
                                            : formatFieldValue(
                                                value,
                                                field.field_type,
                                                field.field_name,
                                              )}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            {/* Price Section */}
                            <div className="mr-8 min-w-[139px] flex-shrink-0 text-center">
                              <div className="text-[20px] font-extrabold leading-[26px] text-black">
                                {priceVisible && apartment.price
                                  ? `${formatPrice(convertPrice(apartment.price, project?.currency, selectedCurrency))} ${getCurrencySymbolSafe(selectedCurrency)}`
                                  : t("project.onRequest")}
                              </div>
                              {priceVisible &&
                                apartment.price &&
                                project?.installment_enabled && (
                                  <div className="mt-1 text-[14px] font-light leading-[21px] text-[#6C6C6C]">
                                    {t("project.from")}{" "}
                                    {formatPrice(
                                      convertPrice(
                                        calculateMonthlyPayment(
                                          apartment.price,
                                        ),
                                        project?.currency,
                                        selectedCurrency,
                                      ),
                                    )}
                                    {getCurrencySymbolSafe(selectedCurrency)}
                                  </div>
                                )}
                            </div>

                            {/* Action Buttons - Always visible */}
                            {apartment.status === "available" && (
                              <div className="mr-[57px] flex flex-shrink-0 items-center gap-4">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-10 w-10 p-2 hover:bg-gray-100"
                                  onClick={(e) => handleShare(e, apartment)}
                                >
                                  <Share2 className="h-6 w-6 text-black" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-10 w-10 p-2 hover:bg-gray-100"
                                  onClick={(e) =>
                                    handleFavoriteToggle(e, apartment)
                                  }
                                >
                                  <Heart
                                    className={`h-6 w-6 text-black ${isFavorite(apartment.id) ? "fill-current text-red-500" : "text-black"}`}
                                  />
                                </Button>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </>
            ) : (
              // Grid layout
              <div className="space-y-8">
                {project?.project_type === "object" ? (
                  // Villas: single grid across all units, no floor headers
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
                    {filteredApartments.map((apartment) => (
                      <Card
                        key={apartment.id}
                        className={`relative aspect-square cursor-pointer overflow-hidden border-2 transition-all hover:shadow-lg ${
                          apartment.status === "available"
                            ? "border-green-2 00 bg-green-50 hover:border-green-400 hover:bg-green-100"
                            : "border-gray-200 bg-gray-50 hover:border-gray-400 hover:bg-gray-100"
                        }`}
                        onClick={() => openApartmentDetails(apartment)}
                      >
                        {apartment.status === "available" && (
                          <div className="absolute right-2 top-2 z-10 flex flex-col gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 bg-white/80 p-1 backdrop-blur-sm hover:bg-white/90"
                              onClick={(e) => handleShare(e, apartment)}
                            >
                              <Share2 className="h-3 w-3 text-black" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 bg-white/80 p-1 backdrop-blur-sm hover:bg-white/90"
                              onClick={(e) =>
                                handleFavoriteToggle(e, apartment)
                              }
                            >
                              <Heart
                                className={`h-3 w-3 ${isFavorite(apartment.id) ? "fill-current text-red-500" : "text-black"}`}
                              />
                            </Button>
                          </div>
                        )}
                        <CardContent className="flex h-full flex-col justify-between p-3">
                          <div className="flex flex-col items-center gap-[5px] text-center">
                            {fieldVisibility.number && (
                              <div className="text-sm font-bold text-gray-900">
                                {apartment.apartment_number ||
                                  `#${apartment.id.slice(-4)}`}
                              </div>
                            )}
                            {fieldVisibility.status && (
                              <Badge
                                variant={
                                  apartment.status === "available"
                                    ? "default"
                                    : "secondary"
                                }
                                className={`!flex justify-center text-[8px] leading-[1] ${apartment.status === "available" ? "bg-green-500 text-white" : "bg-gray-500 text-white"}`}
                              >
                                {apartment.status === "available"
                                  ? t("common.available")
                                  : t("common.unavailable")}
                              </Badge>
                            )}
                          </div>
                          <div className="space-y-1 text-center">
                            {roomsVisible && (
                              <div className="text-sm font-medium text-gray-700">
                                {!Number.isNaN(apartment.rooms) && (
                                  <>
                                    {apartment.rooms == 0
                                      ? t("apartment.studio")
                                      : `${apartment.rooms} ${t("apartment.rooms")}`}
                                  </>
                                )}
                              </div>
                            )}
                            {areaVisible && (
                              <div className="text-xs text-gray-600">
                                {apartment.area} м²
                              </div>
                            )}
                            <div className="text-xs font-semibold text-gray-900">
                              {apartment.price && priceVisible
                                ? `${formatPrice(convertPrice(apartment.price, project?.currency, selectedCurrency))} ${getCurrencySymbolSafe(selectedCurrency)}`
                                : t("project.onRequest")}
                            </div>
                            {apartment.price &&
                              project?.installment_enabled &&
                              priceVisible && (
                                <div className="text-[10px] text-gray-500">
                                  {t("project.from")}{" "}
                                  {formatPrice(
                                    convertPrice(
                                      calculateMonthlyPayment(apartment.price),
                                      project?.currency,
                                      selectedCurrency,
                                    ),
                                  )}
                                  {getCurrencySymbolSafe(selectedCurrency)}
                                </div>
                              )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  groupApartmentsByFloor.map(
                    ({ floor, apartments: floorApartments }) => (
                      <div key={floor} className="space-y-4">
                        <div className="flex items-center gap-4">
                          <h3 className="text-xl font-semibold text-gray-800">
                            {floor} {t("project.floor").toLowerCase()}
                          </h3>
                          <div className="h-px flex-1 bg-gray-200"></div>
                          <span className="text-sm text-gray-500">
                            {floorApartments.length}{" "}
                            {floorApartments.length === 1
                              ? t("apartment.apartment")
                              : t("apartment.apartments")}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
                          {floorApartments.map((apartment) => (
                            <Card
                              key={apartment.id}
                              className={`relative aspect-square cursor-pointer overflow-hidden border-2 transition-all hover:shadow-lg ${apartment.status === "available" ? "border-green-200 bg-green-50 hover:border-green-400 hover:bg-green-100" : "border-gray-200 bg-gray-50 hover:border-gray-400 hover:bg-gray-100"}`}
                              onClick={() => openApartmentDetails(apartment)}
                            >
                              <CardContent className="flex h-full flex-col justify-between p-3">
                                <div className="flex flex-col items-center gap-[5px] text-center">
                                  {fieldVisibility.number && (
                                    <div className="text-sm font-bold text-gray-900">
                                      {apartment.apartment_number ||
                                        `#${apartment.id.slice(-4)}`}
                                    </div>
                                  )}
                                  {fieldVisibility.status && (
                                    <Badge
                                      variant={
                                        apartment.status === "available"
                                          ? "default"
                                          : "secondary"
                                      }
                                      className={`!flex justify-center text-[8px] leading-[1] ${apartment.status === "available" ? "bg-green-500 text-white" : "bg-gray-500 text-white"}`}
                                    >
                                      {apartment.status === "available"
                                        ? t("common.available")
                                        : t("common.unavailable")}
                                    </Badge>
                                  )}
                                </div>
                                <div className="space-y-1 text-center">
                                  {roomsVisible && (
                                    <div className="text-sm font-medium text-gray-700">
                                      {!Number.isNaN(apartment.rooms) && (
                                        <>
                                          {apartment.rooms == 0
                                            ? t("apartment.studio")
                                            : `${apartment.rooms} ${t("apartment.rooms")}`}
                                        </>
                                      )}
                                    </div>
                                  )}
                                  <div className="text-xs text-gray-600">
                                    {apartment.area && areaVisible
                                      ? `${apartment.area} м²`
                                      : ""}
                                  </div>
                                  <div className="text-xs font-semibold text-gray-900">
                                    {apartment.price && priceVisible
                                      ? `${formatPrice(convertPrice(apartment.price, project?.currency, selectedCurrency))} ${getCurrencySymbolSafe(selectedCurrency)}`
                                      : t("project.onRequest")}
                                  </div>
                                  {apartment.price &&
                                    project?.installment_enabled &&
                                    priceVisible && (
                                      <div className="text-[10px] text-gray-500">
                                        {t("project.from")}{" "}
                                        {formatPrice(
                                          convertPrice(
                                            calculateMonthlyPayment(
                                              apartment.price,
                                            ),
                                            project?.currency,
                                            selectedCurrency,
                                          ),
                                        )}
                                        {getCurrencySymbolSafe(
                                          selectedCurrency,
                                        )}
                                      </div>
                                    )}
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    ),
                  )
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
