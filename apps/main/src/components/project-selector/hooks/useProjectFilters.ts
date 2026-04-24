import { useReducer, useEffect, useCallback, useMemo, useRef } from "react";
import { Apartment } from "@/entities/apartment/model/types";
import {
  convertPrice,
  DEFAULT_CURRENCY,
  isValidCurrency,
} from "@gridix/utils/lib";
import { useExchangeRatesEpoch } from "@/app/providers";

// ── Types ──

export type ApartmentTypeFilter =
  | "all"
  | "apartment"
  | "object"
  | "commercial"
  | "parking";

interface Project {
  currency?: string | null;
  has_commercial?: boolean | null;
  has_parking?: boolean | null;
  available_currencies?: string[] | null;
}

interface UseProjectFiltersProps {
  apartments: Apartment[];
  project?: Project;
  visibleFilterFields?: FilterVisibilityOptions;
  /** Map of sub_project_id → "building" | "object" for filtering by object kind. */
  subProjectKinds?: Record<string, "building" | "object">;
}

export type FilterFieldKey =
  | "type"
  | "rooms"
  | "floor"
  | "price"
  | "area"
  | "number"
  | "status";

interface FilterVisibilityOptions {
  type?: boolean;
  rooms?: boolean;
  floor?: boolean;
  price?: boolean;
  area?: boolean;
  number?: boolean;
  status?: boolean;
}

const DEFAULT_FILTER_VISIBILITY: Required<FilterVisibilityOptions> = {
  type: true,
  rooms: true,
  floor: true,
  price: true,
  area: true,
  number: true,
  status: true,
};

export function getHasAnyVisibleFilter(
  visibility: FilterVisibilityOptions = {},
): boolean {
  const normalized = { ...DEFAULT_FILTER_VISIBILITY, ...visibility };
  return Object.values(normalized).some(Boolean);
}

// ── Filter state ──

interface FiltersState {
  selectedFloor: string;
  selectedRooms: string;
  priceRange: [number, number];
  priceRangeCurrency: string;
  areaRange: [number, number];
  searchQuery: string;
  showOnlyAvailable: boolean;
  selectedType: ApartmentTypeFilter;
  selectedCurrency: string;
}

interface Bounds {
  minPrice: number;
  maxPrice: number;
  minArea: number;
  maxArea: number;
}

interface InitPayload {
  apartments: Apartment[];
  project?: Project;
}

const EMPTY_BOUNDS: Bounds = {
  minPrice: 0,
  maxPrice: 0,
  minArea: 0,
  maxArea: 0,
};

function getBaseCurrency(projectCurrency?: string | null): string {
  return projectCurrency && isValidCurrency(projectCurrency)
    ? projectCurrency
    : DEFAULT_CURRENCY;
}

function getBaseState(): FiltersState {
  return {
    selectedFloor: "all",
    selectedRooms: "all",
    priceRange: [0, 0],
    priceRangeCurrency: DEFAULT_CURRENCY,
    areaRange: [0, 0],
    searchQuery: "",
    showOnlyAvailable: false,
    selectedType: "all",
    selectedCurrency: DEFAULT_CURRENCY,
  };
}

function toFiniteNumber(value: unknown): number | null {
  const numberValue = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}

function computeBounds(
  apartments: Apartment[],
  projectCurrency: string | undefined | null,
  selectedCurrency: string,
): Bounds {
  if (apartments.length === 0) {
    return EMPTY_BOUNDS;
  }

  const prices = apartments
    .map((apt) => {
      const rawPrice = toFiniteNumber(apt.price);
      if (rawPrice === null) return null;
      return toFiniteNumber(
        convertPrice(rawPrice, projectCurrency, selectedCurrency),
      );
    })
    .filter((value): value is number => value !== null);

  const areas = apartments
    .map((apt) => toFiniteNumber(apt.area))
    .filter((value): value is number => value !== null);

  return {
    minPrice: prices.length > 0 ? Math.min(...prices) : 0,
    maxPrice: prices.length > 0 ? Math.max(...prices) : 0,
    minArea: areas.length > 0 ? Math.min(...areas) : 0,
    maxArea: areas.length > 0 ? Math.max(...areas) : 0,
  };
}

function normalizeRange(
  range: [number, number],
  bounds: [number, number],
): [number, number] {
  const [boundsMin, boundsMax] = bounds;
  const rawMin = toFiniteNumber(range[0]);
  const rawMax = toFiniteNumber(range[1]);

  const nextMin =
    rawMin === null || rawMin < boundsMin
      ? boundsMin
      : Math.min(rawMin, boundsMax);
  const nextMax =
    rawMax === null || rawMax <= 0
      ? boundsMax
      : Math.max(Math.min(rawMax, boundsMax), boundsMin);

  if (nextMin > nextMax) {
    return [boundsMin, boundsMax];
  }

  return [nextMin, nextMax];
}

function isRangeActive(
  range: [number, number],
  bounds: [number, number],
): boolean {
  const [rangeMin, rangeMax] = normalizeRange(range, bounds);
  const [boundsMin, boundsMax] = bounds;
  return rangeMin > boundsMin || rangeMax < boundsMax;
}

function buildDefaults(params: {
  apartments: Apartment[];
  projectCurrency: string | undefined | null;
  selectedCurrency: string;
}): Pick<
  FiltersState,
  "selectedCurrency" | "priceRangeCurrency" | "priceRange" | "areaRange"
> {
  const { apartments, projectCurrency, selectedCurrency } = params;
  const bounds = computeBounds(apartments, projectCurrency, selectedCurrency);

  return {
    selectedCurrency,
    priceRangeCurrency: selectedCurrency,
    priceRange: [bounds.minPrice, bounds.maxPrice],
    areaRange: [bounds.minArea, bounds.maxArea],
  };
}

function initFiltersState({ apartments, project }: InitPayload): FiltersState {
  const baseCurrency = getBaseCurrency(project?.currency);

  return {
    ...getBaseState(),
    ...buildDefaults({
      apartments,
      projectCurrency: project?.currency,
      selectedCurrency: baseCurrency,
    }),
  };
}

// ── Actions ──

type FiltersAction =
  | { type: "SET_FLOOR"; value: string }
  | { type: "SET_ROOMS"; value: string }
  | { type: "SET_PRICE_RANGE"; value: [number, number] }
  | { type: "SET_AREA_RANGE"; value: [number, number] }
  | { type: "SET_SEARCH"; value: string }
  | { type: "SET_SHOW_ONLY_AVAILABLE"; value: boolean }
  | { type: "SET_TYPE"; value: ApartmentTypeFilter }
  | { type: "SET_CURRENCY"; value: string }
  | { type: "RESET"; defaults: Partial<FiltersState> };

function filtersReducer(
  state: FiltersState,
  action: FiltersAction,
): FiltersState {
  switch (action.type) {
    case "SET_FLOOR":
      return { ...state, selectedFloor: action.value };
    case "SET_ROOMS":
      return { ...state, selectedRooms: action.value };
    case "SET_PRICE_RANGE":
      return {
        ...state,
        priceRange: action.value,
        priceRangeCurrency: state.selectedCurrency,
      };
    case "SET_AREA_RANGE":
      return { ...state, areaRange: action.value };
    case "SET_SEARCH":
      return { ...state, searchQuery: action.value };
    case "SET_SHOW_ONLY_AVAILABLE":
      return { ...state, showOnlyAvailable: action.value };
    case "SET_TYPE":
      return { ...state, selectedType: action.value };
    case "SET_CURRENCY":
      return { ...state, selectedCurrency: action.value };
    case "RESET":
      return { ...getBaseState(), ...action.defaults };
    default:
      return state;
  }
}

// ── Pure filter function (testable) ──

export function filterApartments(
  apartments: Apartment[],
  state: FiltersState,
  projectCurrency: string | undefined | null,
  visibility: FilterVisibilityOptions = {},
  subProjectKinds: Record<string, "building" | "object"> = {},
): Apartment[] {
  const {
    selectedFloor,
    selectedRooms,
    selectedType,
    showOnlyAvailable,
    priceRange,
    areaRange,
    searchQuery,
    selectedCurrency,
  } = state;

  const visible = { ...DEFAULT_FILTER_VISIBILITY, ...visibility };
  const bounds = computeBounds(apartments, projectCurrency, selectedCurrency);
  const normalizedPriceRange = normalizeRange(priceRange, [
    bounds.minPrice,
    bounds.maxPrice,
  ]);
  const normalizedAreaRange = normalizeRange(areaRange, [
    bounds.minArea,
    bounds.maxArea,
  ]);
  const isPriceRangeActive =
    visible.price &&
    isRangeActive(normalizedPriceRange, [bounds.minPrice, bounds.maxPrice]);
  const isAreaRangeActive =
    visible.area &&
    isRangeActive(normalizedAreaRange, [bounds.minArea, bounds.maxArea]);

  let result = apartments;

  if (visible.floor && selectedFloor !== "all") {
    const floorNum = parseInt(selectedFloor, 10);
    result = result.filter((apt) => apt.floor_number === floorNum);
  }

  if (visible.rooms && selectedRooms !== "all") {
    if (selectedRooms === "4+") {
      result = result.filter(
        (apt) =>
          apt.type === "apartment" &&
          (Number(apt.rooms) >= 4 || apt.rooms === "free_layout"),
      );
    } else if (selectedRooms === "free_layout") {
      result = result.filter(
        (apt) => apt.type === "apartment" && apt.rooms === "free_layout",
      );
    } else {
      const roomCount = parseInt(selectedRooms, 10);
      result = result.filter(
        (apt) => apt.type === "apartment" && Number(apt.rooms) === roomCount,
      );
    }
  }

  if (visible.type && selectedType !== "all") {
    const hasObjectKinds = Object.values(subProjectKinds).some(
      (k) => k === "object",
    );
    if (selectedType === "object") {
      result = result.filter(
        (apt) =>
          apt.sub_project_id != null &&
          subProjectKinds[apt.sub_project_id] === "object",
      );
    } else if (selectedType === "apartment" && hasObjectKinds) {
      // Exclude units from "object"-kind sub-projects so they only appear in the Objects tab
      result = result.filter(
        (apt) =>
          apt.type === "apartment" &&
          (apt.sub_project_id == null ||
            subProjectKinds[apt.sub_project_id] !== "object"),
      );
    } else {
      result = result.filter((apt) => apt.type === selectedType);
    }
  }

  if (visible.status && showOnlyAvailable) {
    result = result.filter((apt) => apt.status === "available");
  }

  if (isPriceRangeActive || isAreaRangeActive) {
    const [minPrice, maxPrice] = normalizedPriceRange;
    const [minArea, maxArea] = normalizedAreaRange;

    result = result.filter((apt) => {
      const converted = toFiniteNumber(
        apt.price === null
          ? null
          : convertPrice(apt.price, projectCurrency, selectedCurrency),
      );
      const area = toFiniteNumber(apt.area);

      const matchesPrice =
        !isPriceRangeActive ||
        (converted !== null && converted >= minPrice && converted <= maxPrice);
      const matchesArea =
        !isAreaRangeActive ||
        (area !== null && area >= minArea && area <= maxArea);

      return matchesPrice && matchesArea;
    });
  }

  if (visible.number && searchQuery) {
    const q = searchQuery.toLowerCase();
    result = result.filter((apt) =>
      apt.apartment_number.toLowerCase().includes(q),
    );
  }

  return result;
}

export function normalizePriceRangeForCurrencyChange(params: {
  prevCurrency: string;
  nextCurrency: string;
  prevRange: [number, number];
  minPrice: number;
  maxPrice: number;
}): [number, number] {
  const { prevCurrency, nextCurrency, prevRange, minPrice, maxPrice } = params;
  const [prevMin, prevMax] = prevRange;
  const nextMin = convertPrice(prevMin, prevCurrency, nextCurrency);
  const nextMax = convertPrice(prevMax, prevCurrency, nextCurrency);
  const clampedMin = Math.max(minPrice, Math.min(nextMin, maxPrice));
  const clampedMax = Math.min(maxPrice, Math.max(nextMax, minPrice));

  return clampedMin <= clampedMax
    ? [clampedMin, clampedMax]
    : [minPrice, maxPrice];
}

// ── Hook ──

export const useProjectFilters = ({
  apartments,
  project,
  visibleFilterFields = DEFAULT_FILTER_VISIBILITY,
  subProjectKinds = {},
}: UseProjectFiltersProps) => {
  const exchangeRatesEpoch = useExchangeRatesEpoch();

  const visibility = useMemo(
    () => ({ ...DEFAULT_FILTER_VISIBILITY, ...visibleFilterFields }),
    [visibleFilterFields],
  );

  const [state, dispatch] = useReducer(
    filtersReducer,
    { apartments, project },
    initFiltersState,
  );
  const userInteractedRef = useRef(false);
  const didInitRangesRef = useRef(apartments.length > 0);
  const baseCurrency = getBaseCurrency(project?.currency);
  const {
    selectedFloor,
    selectedRooms,
    priceRange,
    areaRange,
    searchQuery,
    showOnlyAvailable,
    selectedType,
    selectedCurrency,
    priceRangeCurrency,
  } = state;

  const bounds = useMemo(
    () => computeBounds(apartments, project?.currency, selectedCurrency),
    [apartments, project?.currency, selectedCurrency, exchangeRatesEpoch],
  );
  const priceBounds: [number, number] = [bounds.minPrice, bounds.maxPrice];
  const areaBounds: [number, number] = [bounds.minArea, bounds.maxArea];

  const previousCurrencyRef = useRef(selectedCurrency);
  const prevBoundsRef = useRef(bounds);

  const setSelectedFloor = useCallback((value: string) => {
    userInteractedRef.current = true;
    dispatch({ type: "SET_FLOOR", value });
  }, []);

  const setSelectedRooms = useCallback((value: string) => {
    userInteractedRef.current = true;
    dispatch({ type: "SET_ROOMS", value });
  }, []);

  const setPriceRange = useCallback((value: [number, number]) => {
    userInteractedRef.current = true;
    dispatch({ type: "SET_PRICE_RANGE", value });
  }, []);

  const setAreaRange = useCallback((value: [number, number]) => {
    userInteractedRef.current = true;
    dispatch({ type: "SET_AREA_RANGE", value });
  }, []);

  const setSearchQuery = useCallback((value: string) => {
    userInteractedRef.current = true;
    dispatch({ type: "SET_SEARCH", value });
  }, []);

  const setShowOnlyAvailable = useCallback((value: boolean) => {
    userInteractedRef.current = true;
    dispatch({ type: "SET_SHOW_ONLY_AVAILABLE", value });
  }, []);

  const setSelectedType = useCallback((value: ApartmentTypeFilter) => {
    userInteractedRef.current = true;
    dispatch({ type: "SET_TYPE", value });
  }, []);

  const setSelectedCurrency = useCallback((value: string) => {
    userInteractedRef.current = true;
    dispatch({ type: "SET_CURRENCY", value });
  }, []);

  useEffect(() => {
    dispatch({ type: "SET_CURRENCY", value: baseCurrency });
  }, [baseCurrency]);

  useEffect(() => {
    const allowed = project?.available_currencies;
    if (!allowed || allowed.length === 0) return;
    if (allowed.includes(selectedCurrency)) return;
    const fallback = allowed.includes(baseCurrency) ? baseCurrency : allowed[0];
    if (fallback) dispatch({ type: "SET_CURRENCY", value: fallback });
  }, [
    project?.available_currencies?.join(","),
    selectedCurrency,
    baseCurrency,
  ]);

  useEffect(() => {
    if (
      didInitRangesRef.current ||
      userInteractedRef.current ||
      apartments.length === 0
    )
      return;

    dispatch({
      type: "RESET",
      defaults: buildDefaults({
        apartments,
        projectCurrency: project?.currency,
        selectedCurrency: baseCurrency,
      }),
    });

    didInitRangesRef.current = true;
    prevBoundsRef.current = computeBounds(
      apartments,
      project?.currency,
      baseCurrency,
    );
  }, [apartments, baseCurrency, project?.currency]);

  useEffect(() => {
    const prev = previousCurrencyRef.current;
    const curr = selectedCurrency;

    if (apartments.length > 0 && prev !== curr && priceRangeCurrency !== curr) {
      dispatch({
        type: "SET_PRICE_RANGE",
        value: normalizePriceRangeForCurrencyChange({
          prevCurrency: prev,
          nextCurrency: curr,
          prevRange: priceRange,
          minPrice: bounds.minPrice,
          maxPrice: bounds.maxPrice,
        }),
      });
    }

    previousCurrencyRef.current = curr;
  }, [
    apartments.length,
    bounds.maxPrice,
    bounds.minPrice,
    priceRange,
    priceRangeCurrency,
    selectedCurrency,
  ]);

  useEffect(() => {
    if (
      !didInitRangesRef.current ||
      userInteractedRef.current ||
      apartments.length === 0
    ) {
      prevBoundsRef.current = bounds;
      return;
    }

    const prevBounds = prevBoundsRef.current;

    if (
      priceRange[0] === prevBounds.minPrice &&
      priceRange[1] === prevBounds.maxPrice
    ) {
      if (
        bounds.minPrice !== prevBounds.minPrice ||
        bounds.maxPrice !== prevBounds.maxPrice
      ) {
        dispatch({ type: "SET_PRICE_RANGE", value: priceBounds });
      }
    }

    if (
      areaRange[0] === prevBounds.minArea &&
      areaRange[1] === prevBounds.maxArea
    ) {
      if (
        bounds.minArea !== prevBounds.minArea ||
        bounds.maxArea !== prevBounds.maxArea
      ) {
        dispatch({ type: "SET_AREA_RANGE", value: areaBounds });
      }
    }

    prevBoundsRef.current = bounds;
  }, [
    apartments.length,
    areaBounds,
    areaRange,
    bounds,
    priceBounds,
    priceRange,
  ]);

  useEffect(() => {
    if (apartments.length === 0) return;

    if (!visibility.price) {
      const [priceMin, priceMax] = priceRange;
      if (priceMin !== bounds.minPrice || priceMax !== bounds.maxPrice) {
        dispatch({ type: "SET_PRICE_RANGE", value: priceBounds });
      }
    }

    if (!visibility.area) {
      const [areaMin, areaMax] = areaRange;
      if (areaMin !== bounds.minArea || areaMax !== bounds.maxArea) {
        dispatch({ type: "SET_AREA_RANGE", value: areaBounds });
      }
    }
  }, [
    apartments.length,
    areaBounds,
    areaRange,
    bounds,
    priceBounds,
    priceRange,
    visibility.area,
    visibility.price,
  ]);

  const filteredApartments = useMemo(
    () =>
      filterApartments(
        apartments,
        state,
        project?.currency,
        visibility,
        subProjectKinds,
      ),
    [
      apartments,
      project?.currency,
      state,
      visibility,
      subProjectKinds,
      exchangeRatesEpoch,
    ],
  );

  const getUniqueFloors = useCallback(
    () =>
      [...new Set(apartments.map((apt) => apt.floor_number))].sort(
        (a, b) => a - b,
      ),
    [apartments],
  );

  const getUniqueRoomCounts = useCallback(() => {
    const numericRooms = apartments
      .filter((apt) => apt.type === "apartment" && apt.rooms !== "free_layout")
      .map((apt) =>
        typeof apt.rooms === "string" ? parseInt(apt.rooms, 10) : apt.rooms,
      )
      .filter((rooms) => !isNaN(rooms));
    return [...new Set(numericRooms)].sort((a, b) => a - b);
  }, [apartments]);

  const hasFreeLayout = useCallback(
    () =>
      apartments.some(
        (apt) => apt.type === "apartment" && apt.rooms === "free_layout",
      ),
    [apartments],
  );

  const getAvailableCount = useCallback(
    () => filteredApartments.filter((apt) => apt.status === "available").length,
    [filteredApartments],
  );

  const resetFilters = useCallback(() => {
    dispatch({
      type: "RESET",
      defaults: buildDefaults({
        apartments,
        projectCurrency: project?.currency,
        selectedCurrency: baseCurrency,
      }),
    });

    userInteractedRef.current = false;
    didInitRangesRef.current = true;
    prevBoundsRef.current = computeBounds(
      apartments,
      project?.currency,
      baseCurrency,
    );
    previousCurrencyRef.current = baseCurrency;
  }, [apartments, baseCurrency, project?.currency]);

  return {
    selectedFloor,
    selectedRooms,
    priceRange,
    areaRange,
    searchQuery,
    showOnlyAvailable,
    selectedType,
    selectedCurrency,
    visibleFilterFields: visibility,
    isPriceVisible: visibility.price,
    isAreaVisible: visibility.area,
    hasAnyVisibleFilter: getHasAnyVisibleFilter(visibility),

    setSelectedFloor,
    setSelectedRooms,
    setPriceRange,
    setAreaRange,
    setSearchQuery,
    setShowOnlyAvailable,
    setSelectedType,
    setSelectedCurrency,

    filteredApartments,
    getUniqueFloors,
    getUniqueRoomCounts,
    hasFreeLayout,
    getAvailableCount,
    convertPrice,
    minPrice: bounds.minPrice,
    maxPrice: bounds.maxPrice,
    minArea: bounds.minArea,
    maxArea: bounds.maxArea,
    resetFilters,
  };
};

export type ProjectFilters = ReturnType<typeof useProjectFilters>;
