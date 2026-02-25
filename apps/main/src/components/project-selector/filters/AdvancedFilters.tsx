import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Input,
  RangeInput,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@gridix/ui";
import { cn, convertPrice, getCurrencySymbolSafe } from "@gridix/utils/lib";
import {
  FilterFieldKey,
  normalizePriceRangeForCurrencyChange,
} from "../hooks/useProjectFilters";
import { RotateCcw } from "lucide-react";
import CurrencyToggle from "@/components/common/CurrencyToggle";
import { useLanguage } from "@/contexts/LanguageContext";

type ProjectLike = {
  currency?: string | null;
  has_commercial?: boolean | null;
  has_parking?: boolean | null;
  project_type?: string | null;
};

type Props = {
  open: boolean;
  onClose?: () => void;
  selectedRooms: string;
  setSelectedRooms: (value: string) => void;
  selectedFloor: string;
  setSelectedFloor: (value: string) => void;
  selectedType: "all" | "apartment" | "commercial" | "parking";
  setSelectedType: (
    value: "all" | "apartment" | "commercial" | "parking",
  ) => void;
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  selectedCurrency: string;
  setSelectedCurrency: (value: string) => void;
  showOnlyAvailable: boolean;
  setShowOnlyAvailable: (value: boolean) => void;
  priceRange: [number, number];
  setPriceRange: (value: [number, number]) => void;
  areaRange: [number, number];
  setAreaRange: (value: [number, number]) => void;
  minPrice: number;
  maxPrice: number;
  minArea: number;
  maxArea: number;
  resetFilters: () => void;
  getUniqueRoomCounts: () => number[];
  getUniqueFloors: () => number[];
  hasFreeLayout?: () => boolean;
  project?: ProjectLike;
  viewMode: string;
  setViewMode: (
    mode: "facade" | "floor-plan" | "list" | "map" | "favorites" | "chess",
  ) => void;
  themeColor?: string;
  formatPrice: (price: number) => string;
  visibleFilterFields: Record<FilterFieldKey, boolean>;
  hasAnyVisibleFilter: boolean;
};

export const AdvancedFilters = ({
  open,
  onClose,
  selectedRooms,
  setSelectedRooms,
  selectedFloor,
  setSelectedFloor,
  selectedType,
  setSelectedType,
  searchQuery,
  setSearchQuery,
  selectedCurrency,
  setSelectedCurrency,
  showOnlyAvailable,
  setShowOnlyAvailable,
  priceRange,
  setPriceRange,
  areaRange,
  setAreaRange,
  minPrice,
  maxPrice,
  minArea,
  maxArea,
  resetFilters,
  getUniqueRoomCounts,
  getUniqueFloors,
  hasFreeLayout,
  project,
  viewMode,
  setViewMode,
  themeColor = "#000000",
  formatPrice,
  visibleFilterFields,
  hasAnyVisibleFilter,
}: Props) => {
  const { t } = useLanguage();

  const roomsOptions = useMemo(() => {
    const base = [{ value: "all", label: t("project.allTypes") }];
    const nums = getUniqueRoomCounts().map((rooms) => ({
      value: rooms.toString(),
      label:
        rooms === 0 ? t("apartment.studio") : `${rooms} ${t("apartment.room")}`,
    }));
    const free =
      hasFreeLayout && hasFreeLayout()
        ? [{ value: "free_layout", label: t("apartment.freeLayout") }]
        : [];
    return [...base, ...nums, ...free];
  }, [getUniqueRoomCounts, hasFreeLayout, t]);

  const floorOptions = useMemo(() => {
    const base = [{ value: "all", label: t("project.allFloors") }];
    const nums = getUniqueFloors().map((floor) => ({
      value: floor.toString(),
      label: `${floor} ${t("project.floor").toLowerCase()}`,
    }));
    return [...base, ...nums];
  }, [getUniqueFloors, t]);

  const typeOptions = useMemo(() => {
    const base = [{ value: "all" as const, label: t("project.allTypes") }];
    const apt = [
      {
        value: "apartment" as const,
        label: t("apartmentsManager.typeApartment"),
      },
    ];
    const comm = project?.has_commercial
      ? [
          {
            value: "commercial" as const,
            label: t("apartmentsManager.typeCommercial"),
          },
        ]
      : [];
    const park = project?.has_parking
      ? [
          {
            value: "parking" as const,
            label: t("apartmentsManager.typeParking"),
          },
        ]
      : [];
    return [...base, ...apt, ...comm, ...park];
  }, [project?.has_commercial, project?.has_parking, t]);

  const [advType, setAdvType] = useState(selectedType);
  const [advRooms, setAdvRooms] = useState(selectedRooms);
  const [advFloor, setAdvFloor] = useState(selectedFloor);
  const [advPrice, setAdvPrice] = useState(priceRange);
  const [advArea, setAdvArea] = useState<[number, number]>(areaRange);
  const [advAvailable, setAdvAvailable] = useState(showOnlyAvailable);
  const [advSearch, setAdvSearch] = useState(searchQuery);
  const [advCurrency, setAdvCurrency] = useState(selectedCurrency);

  const [advMinPrice, advMaxPrice] = useMemo<[number, number]>(() => {
    if (advCurrency === selectedCurrency) {
      return [minPrice, maxPrice];
    }

    const convertedMin = convertPrice(minPrice, selectedCurrency, advCurrency);
    const convertedMax = convertPrice(maxPrice, selectedCurrency, advCurrency);

    return convertedMin <= convertedMax
      ? [convertedMin, convertedMax]
      : [convertedMax, convertedMin];
  }, [advCurrency, selectedCurrency, minPrice, maxPrice]);

  useEffect(() => {
    if (!open) return;
    setAdvType(selectedType);
    setAdvRooms(selectedRooms);
    setAdvFloor(selectedFloor);
    setAdvPrice(priceRange);
    setAdvArea(areaRange);
    setAdvAvailable(showOnlyAvailable);
    setAdvSearch(searchQuery);
    setAdvCurrency(selectedCurrency);
  }, [
    open,
    selectedType,
    selectedRooms,
    selectedFloor,
    priceRange,
    areaRange,
    showOnlyAvailable,
    searchQuery,
    selectedCurrency,
  ]);

  const handleCurrencyChange = (nextCurrency: string) => {
    if (nextCurrency === advCurrency) return;

    const nextMinPrice = convertPrice(minPrice, selectedCurrency, nextCurrency);
    const nextMaxPrice = convertPrice(maxPrice, selectedCurrency, nextCurrency);
    const [normalizedMinPrice, normalizedMaxPrice] =
      nextMinPrice <= nextMaxPrice
        ? [nextMinPrice, nextMaxPrice]
        : [nextMaxPrice, nextMinPrice];

    setAdvPrice(
      normalizePriceRangeForCurrencyChange({
        prevCurrency: advCurrency,
        nextCurrency,
        prevRange: advPrice,
        minPrice: normalizedMinPrice,
        maxPrice: normalizedMaxPrice,
      }),
    );
    setAdvCurrency(nextCurrency);
  };

  const handleApplyFilters = () => {
    const currencyChanged = advCurrency !== selectedCurrency;

    if (currencyChanged) {
      setSelectedCurrency(advCurrency);
    }

    setSelectedType(advType);
    setSelectedRooms(advRooms);
    setSelectedFloor(advFloor);

    setPriceRange(advPrice);
    setAreaRange(advArea);

    setSearchQuery(advSearch);
    setShowOnlyAvailable(advAvailable);

    setViewMode("list");

    onClose?.();
    window.scrollTo({
      top: 650,
      behavior: "smooth",
    });
  };

  return (
    <div className="relative grid grid-cols-1 gap-4 p-4 pb-0">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm font-semibold text-gray-900">
          {t("project.filters")}
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="gap-2"
          onClick={() => {
            resetFilters();
            onClose?.();
            window.scrollTo({
              top: 650,
              behavior: "smooth",
            });
          }}
        >
          <RotateCcw className="h-4 w-4" />
          {t("project.resetFilters")}
        </Button>
      </div>

      {visibleFilterFields.price && (
        <div className="space-y-2">
          <div className="text-xs text-gray-500">{t("project.currency")}</div>
          <CurrencyToggle
            projectCurrency={project?.currency || null}
            selectedCurrency={advCurrency}
            onChange={handleCurrencyChange}
            themeColor={themeColor}
          />
        </div>
      )}

      {visibleFilterFields.type &&
        (project?.has_commercial || project?.has_parking) && (
          <div className="space-y-2">
            <div className="text-xs text-gray-500">{t("project.type")}</div>
            <div className="flex flex-wrap gap-2">
              {typeOptions.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  className={cn(
                    "rounded-full border px-3 py-2 text-sm",
                    advType === o.value
                      ? "border-gray-900 bg-gray-50 text-gray-900"
                      : "border-gray-200 text-gray-600",
                  )}
                  onClick={() => setAdvType(o.value)}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>
        )}

      {visibleFilterFields.rooms && project?.project_type !== "object" && (
        <div className="space-y-2">
          <div className="text-xs text-gray-500">{t("project.rooms")}</div>
          <div className="flex flex-wrap gap-2">
            {roomsOptions.length < 6 ? (
              roomsOptions.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  className={cn(
                    "rounded-full border px-3 py-2 text-sm",
                    advRooms === o.value
                      ? "border-gray-900 bg-gray-50 text-gray-900"
                      : "border-gray-200 text-gray-600",
                  )}
                  onClick={() => setAdvRooms(o.value)}
                >
                  {" "}
                  {o.label}
                </button>
              ))
            ) : (
              <Select value={advRooms} onValueChange={setAdvRooms}>
                <SelectTrigger className="h-auto rounded-full border bg-transparent p-0 px-3 py-2 text-sm shadow-none">
                  <SelectValue placeholder={t("project.parameters")} />
                </SelectTrigger>
                <SelectContent className={"h-[200px]"}>
                  {roomsOptions.map((o) => (
                    <SelectItem
                      className={"mb-1 rounded-full border py-2 text-sm"}
                      key={o.value}
                      value={o.value}
                    >
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
      )}

      {visibleFilterFields.floor &&
        viewMode !== "floor-plan" &&
        project?.project_type !== "object" && (
          <div className="space-y-2">
            <div className="text-xs text-gray-500">{t("project.floor")}</div>
            <div className="flex flex-wrap gap-2">
              <Select value={advFloor} onValueChange={setAdvFloor}>
                <SelectTrigger className="h-auto rounded-full border bg-transparent p-0 px-3 py-2 text-sm shadow-none">
                  <SelectValue placeholder={t("project.parameters")} />
                </SelectTrigger>
                <SelectContent className={"h-[200px]"}>
                  {floorOptions.map((o) => (
                    <SelectItem
                      className={"mb-1 rounded-full border py-2 text-sm"}
                      key={o.value}
                      value={o.value}
                    >
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

      {visibleFilterFields.price && (
        <RangeInput
          label={t("project.price")}
          min={advMinPrice}
          max={advMaxPrice}
          value={advPrice}
          onChange={(next) => setAdvPrice(next)}
          formatHint={formatPrice}
          unit={getCurrencySymbolSafe(advCurrency)}
          clamp={true}
        />
      )}

      {visibleFilterFields.area && (
        <RangeInput
          label={t("project.area")}
          min={minArea}
          max={maxArea}
          value={advArea}
          onChange={(next) => setAdvArea(next)}
          unit={t("apartment.sqm")}
          clamp={true}
        />
      )}

      {visibleFilterFields.number && (
        <div className="space-y-2">
          <div className="text-xs text-gray-500">
            {t("project.apartmentNumber")}
          </div>
          <Input
            value={advSearch}
            onChange={(e) => setAdvSearch(e.target.value)}
          />
        </div>
      )}

      {!hasAnyVisibleFilter && (
        <div className="rounded-md border border-dashed border-gray-200 bg-gray-50 px-3 py-4 text-sm text-gray-500">
          {t("filters.noFiltersAvailable")}
        </div>
      )}

      <div className="sticky bottom-0 -mx-4 flex items-center justify-between gap-3 border-t border-gray-100 bg-gray-50 p-4 pt-2">
        {visibleFilterFields.status && (
          <Button
            variant="outline"
            className={cn(
              advAvailable
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-gray-200 bg-white text-gray-700",
            )}
            onClick={() => setAdvAvailable(!advAvailable)}
          >
            {t("project.onlyAvailable")}
          </Button>
        )}
        {hasAnyVisibleFilter && (
          <Button
            onClick={handleApplyFilters}
            style={{ backgroundColor: themeColor, color: "#fff" }}
          >
            {t("filters.applyFilters")}
          </Button>
        )}
      </div>
    </div>
  );
};
