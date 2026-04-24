import { useEffect, useMemo, useState } from "react";
import { convertPrice } from "@gridix/utils/lib";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  ApartmentTypeFilter,
  FilterFieldKey,
  normalizePriceRangeForCurrencyChange,
} from "@/components/project-selector/hooks/useProjectFilters";

export type ProjectLike = {
  currency?: string | null;
  has_commercial?: boolean | null;
  has_parking?: boolean | null;
  available_currencies?: string[] | null;
};

export type AdvancedFiltersProps = {
  open: boolean;
  onClose?: () => void;
  selectedRooms: string;
  setSelectedRooms: (value: string) => void;
  selectedFloor: string;
  setSelectedFloor: (value: string) => void;
  selectedType: ApartmentTypeFilter;
  setSelectedType: (value: ApartmentTypeFilter) => void;
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
  /** `sub_projects.type` for current selector scope. */
  projectType: "building" | "object";
};

export const useAdvancedFiltersState = ({
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
  resetFilters,
  getUniqueRoomCounts,
  getUniqueFloors,
  hasFreeLayout,
  project,
  projectType: _selectorEntityKind,
  setViewMode,
}: AdvancedFiltersProps) => {
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

  const handleResetFilters = () => {
    resetFilters();
    onClose?.();
    window.scrollTo({
      top: 650,
      behavior: "smooth",
    });
  };

  return {
    t,
    roomsOptions,
    floorOptions,
    typeOptions,
    advType,
    setAdvType,
    advRooms,
    setAdvRooms,
    advFloor,
    setAdvFloor,
    advPrice,
    setAdvPrice,
    advArea,
    setAdvArea,
    advAvailable,
    setAdvAvailable,
    advSearch,
    setAdvSearch,
    advCurrency,
    advMinPrice,
    advMaxPrice,
    handleCurrencyChange,
    handleApplyFilters,
    handleResetFilters,
  };
};
