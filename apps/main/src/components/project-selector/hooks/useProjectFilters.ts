import { useReducer, useEffect, useCallback, useMemo, useRef } from 'react';
import { Apartment } from '@/entities/apartment/model/types';
import { convertPrice, DEFAULT_CURRENCY, isValidCurrency } from '@gridix/utils/lib';

// ── Types ──

export type ApartmentTypeFilter = 'all' | 'apartment' | 'commercial' | 'parking';

interface Project {
  currency?: string | null;
  has_commercial?: boolean | null;
  has_parking?: boolean | null;
}

interface UseProjectFiltersProps {
  apartments: Apartment[];
  project?: Project;
  visibleFilterFields?: FilterVisibilityOptions;
}

export type FilterFieldKey = 'type' | 'rooms' | 'floor' | 'price' | 'area' | 'number' | 'status';

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

export function getHasAnyVisibleFilter(visibility: FilterVisibilityOptions = {}): boolean {
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

interface PriceAndAreaBounds {
  minPrice: number;
  maxPrice: number;
  minArea: number;
  maxArea: number;
}

interface InitFiltersStateArgs {
  apartments: Apartment[];
  project?: Project;
}

const EMPTY_BOUNDS: PriceAndAreaBounds = {
  minPrice: 0,
  maxPrice: 0,
  minArea: 0,
  maxArea: 0,
};

function getBaseCurrency(projectCurrency?: string | null): string {
  return projectCurrency && isValidCurrency(projectCurrency) ? projectCurrency : DEFAULT_CURRENCY;
}

function sanitizeNumber(value: number | string | null | undefined): number {
  const numericValue = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(numericValue) ? numericValue : 0;
}

function getPriceAndAreaBounds(
  apartments: Apartment[],
  projectCurrency: string | undefined | null,
  selectedCurrency: string,
): PriceAndAreaBounds {
  if (apartments.length === 0) {
    return EMPTY_BOUNDS;
  }

  const prices = apartments.map(apt =>
    sanitizeNumber(convertPrice(sanitizeNumber(apt.price), projectCurrency, selectedCurrency)),
  );
  const areas = apartments.map(apt => sanitizeNumber(apt.area));

  const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
  const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;
  const minArea = areas.length > 0 ? Math.min(...areas) : 0;
  const maxArea = areas.length > 0 ? Math.max(...areas) : 0;

  return {
    minPrice: Number.isFinite(minPrice) ? minPrice : 0,
    maxPrice: Number.isFinite(maxPrice) ? maxPrice : 0,
    minArea: Number.isFinite(minArea) ? minArea : 0,
    maxArea: Number.isFinite(maxArea) ? maxArea : 0,
  };
}

function getResetBaseState(): FiltersState {
  return {
    selectedFloor: 'all',
    selectedRooms: 'all',
    priceRange: [0, 0],
    priceRangeCurrency: DEFAULT_CURRENCY,
    areaRange: [0, 0],
    searchQuery: '',
    showOnlyAvailable: true,
    selectedType: 'all',
    selectedCurrency: DEFAULT_CURRENCY,
  };
}

function computeProjectDefaults(params: {
  apartments: Apartment[];
  projectCurrency: string | undefined | null;
  selectedCurrency: string;
}): Pick<FiltersState, 'selectedCurrency' | 'priceRangeCurrency' | 'priceRange' | 'areaRange'> {
  const { apartments, projectCurrency, selectedCurrency } = params;
  const bounds = getPriceAndAreaBounds(apartments, projectCurrency, selectedCurrency);

  return {
    selectedCurrency,
    priceRangeCurrency: selectedCurrency,
    priceRange: apartments.length > 0 ? [bounds.minPrice, bounds.maxPrice] : [0, 0],
    areaRange: apartments.length > 0 ? [bounds.minArea, bounds.maxArea] : [0, 0],
  };
}

function initFiltersState({ apartments, project }: InitFiltersStateArgs): FiltersState {
  const baseCurrency = getBaseCurrency(project?.currency);

  return {
    ...getResetBaseState(),
    ...computeProjectDefaults({
      apartments,
      projectCurrency: project?.currency,
      selectedCurrency: baseCurrency,
    }),
  };
}

// ── Actions ──

type FiltersAction =
  | { type: 'SET_FLOOR'; value: string }
  | { type: 'SET_ROOMS'; value: string }
  | { type: 'SET_PRICE_RANGE'; value: [number, number] }
  | { type: 'SET_AREA_RANGE'; value: [number, number] }
  | { type: 'SET_SEARCH'; value: string }
  | { type: 'SET_SHOW_ONLY_AVAILABLE'; value: boolean }
  | { type: 'SET_TYPE'; value: ApartmentTypeFilter }
  | { type: 'SET_CURRENCY'; value: string }
  | { type: 'RESET'; defaults: Partial<FiltersState> };

function filtersReducer(state: FiltersState, action: FiltersAction): FiltersState {
  switch (action.type) {
    case 'SET_FLOOR':
      return { ...state, selectedFloor: action.value };
    case 'SET_ROOMS':
      return { ...state, selectedRooms: action.value };
    case 'SET_PRICE_RANGE':
      return { ...state, priceRange: action.value, priceRangeCurrency: state.selectedCurrency };
    case 'SET_AREA_RANGE':
      return { ...state, areaRange: action.value };
    case 'SET_SEARCH':
      return { ...state, searchQuery: action.value };
    case 'SET_SHOW_ONLY_AVAILABLE':
      return { ...state, showOnlyAvailable: action.value };
    case 'SET_TYPE':
      return { ...state, selectedType: action.value };
    case 'SET_CURRENCY':
      return { ...state, selectedCurrency: action.value };
    case 'RESET':
      return { ...getResetBaseState(), ...action.defaults };
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

  let result = apartments;

  if (visible.floor && selectedFloor !== 'all') {
    const floorNum = parseInt(selectedFloor, 10);
    result = result.filter(apt => apt.floor_number === floorNum);
  }

  if (visible.rooms && selectedRooms !== 'all') {
    if (selectedRooms === '4+') {
      result = result.filter(
        apt => apt.type === 'apartment' && (Number(apt.rooms) >= 4 || apt.rooms === 'free_layout'),
      );
    } else if (selectedRooms === 'free_layout') {
      result = result.filter(apt => apt.type === 'apartment' && apt.rooms === 'free_layout');
    } else {
      const roomCount = parseInt(selectedRooms, 10);
      result = result.filter(apt => apt.type === 'apartment' && Number(apt.rooms) === roomCount);
    }
  }

  if (visible.type && selectedType !== 'all') {
    result = result.filter(apt => apt.type === selectedType);
  }

  if (visible.status && showOnlyAvailable) {
    result = result.filter(apt => apt.status === 'available');
  }

  if (visible.price || visible.area) {
    const [minPrice, maxPrice] = priceRange;
    const [minArea, maxArea] = areaRange;

    result = result.filter(apt => {
      const converted = convertPrice(apt.price || 0, projectCurrency, selectedCurrency);
      const area = apt.area || 0;
      const matchesPrice = !visible.price || (converted >= minPrice && converted <= maxPrice);
      const matchesArea = !visible.area || (area >= minArea && area <= maxArea);
      return matchesPrice && matchesArea;
    });
  }

  if (visible.number && searchQuery) {
    const q = searchQuery.toLowerCase();
    result = result.filter(apt => apt.apartment_number.toLowerCase().includes(q));
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

  return clampedMin <= clampedMax ? [clampedMin, clampedMax] : [minPrice, maxPrice];
}

// ── Hook ──

export const useProjectFilters = ({
  apartments,
  project,
  visibleFilterFields = DEFAULT_FILTER_VISIBILITY,
}: UseProjectFiltersProps) => {
  const visibility = useMemo(
    () => ({ ...DEFAULT_FILTER_VISIBILITY, ...visibleFilterFields }),
    [visibleFilterFields],
  );

  const [state, dispatch] = useReducer(filtersReducer, { apartments, project }, initFiltersState);
  const didInitRangesRef = useRef(apartments.length > 0);
  const userInteractedRef = useRef(false);

  const baseCurrency = getBaseCurrency(project?.currency);

  // ── Dispatch wrappers (maintain backward-compatible setter signatures) ──

  const setSelectedFloor = useCallback(
    (value: string) => {
      userInteractedRef.current = true;
      dispatch({ type: 'SET_FLOOR', value });
    },
    [],
  );
  const setSelectedRooms = useCallback(
    (value: string) => {
      userInteractedRef.current = true;
      dispatch({ type: 'SET_ROOMS', value });
    },
    [],
  );
  const setPriceRange = useCallback(
    (value: [number, number]) => {
      userInteractedRef.current = true;
      dispatch({ type: 'SET_PRICE_RANGE', value });
    },
    [],
  );
  const setAreaRange = useCallback(
    (value: [number, number]) => {
      userInteractedRef.current = true;
      dispatch({ type: 'SET_AREA_RANGE', value });
    },
    [],
  );
  const setSearchQuery = useCallback(
    (value: string) => {
      userInteractedRef.current = true;
      dispatch({ type: 'SET_SEARCH', value });
    },
    [],
  );
  const setShowOnlyAvailable = useCallback(
    (value: boolean) => {
      userInteractedRef.current = true;
      dispatch({ type: 'SET_SHOW_ONLY_AVAILABLE', value });
    },
    [],
  );
  const setSelectedType = useCallback(
    (value: ApartmentTypeFilter) => {
      userInteractedRef.current = true;
      dispatch({ type: 'SET_TYPE', value });
    },
    [],
  );
  const setSelectedCurrency = useCallback(
    (value: string) => {
      userInteractedRef.current = true;
      dispatch({ type: 'SET_CURRENCY', value });
    },
    [],
  );

  // ── Sync currency from project ──

  useEffect(() => {
    dispatch({ type: 'SET_CURRENCY', value: baseCurrency });
  }, [baseCurrency]);

  // ── Unique values (memoized) ──

  const getUniqueFloors = useCallback(
    () => [...new Set(apartments.map(apt => apt.floor_number))].sort((a, b) => a - b),
    [apartments],
  );

  const getUniqueRoomCounts = useCallback(() => {
    const numericRooms = apartments
      .filter(apt => apt.type === 'apartment' && apt.rooms !== 'free_layout')
      .map(apt => (typeof apt.rooms === 'string' ? parseInt(apt.rooms, 10) : apt.rooms))
      .filter(rooms => !isNaN(rooms));
    return [...new Set(numericRooms)].sort((a, b) => a - b);
  }, [apartments]);

  const hasFreeLayout = useCallback(
    () => apartments.some(apt => apt.type === 'apartment' && apt.rooms === 'free_layout'),
    [apartments],
  );

  // ── Price / area bounds ──

  const { minPrice, maxPrice, minArea, maxArea } = useMemo(
    () => getPriceAndAreaBounds(apartments, project?.currency, state.selectedCurrency),
    [apartments, project?.currency, state.selectedCurrency],
  );

  const previousCurrencyRef = useRef(state.selectedCurrency);
  const prevBoundsRef = useRef({ minPrice, maxPrice, minArea, maxArea });

  // ── Fallback init for async apartments loading ──

  useEffect(() => {
    if (userInteractedRef.current) return;
    if (didInitRangesRef.current) return;
    if (apartments.length === 0) return;

    dispatch({
      type: 'RESET',
      defaults: computeProjectDefaults({
        apartments,
        projectCurrency: project?.currency,
        selectedCurrency: baseCurrency,
      }),
    });

    didInitRangesRef.current = true;
    prevBoundsRef.current = { minPrice, maxPrice, minArea, maxArea };
    previousCurrencyRef.current = baseCurrency;
  }, [apartments, apartments.length, project?.currency, baseCurrency, minPrice, maxPrice, minArea, maxArea]);

  // ── Auto-expand bounds only in auto mode ──

  useEffect(() => {
    if (!didInitRangesRef.current || apartments.length === 0 || userInteractedRef.current) {
      prevBoundsRef.current = { minPrice, maxPrice, minArea, maxArea };
      return;
    }

    const prevBounds = prevBoundsRef.current;
    const shouldExpandPrice =
      state.priceRange[0] === prevBounds.minPrice &&
      state.priceRange[1] === prevBounds.maxPrice &&
      (minPrice !== prevBounds.minPrice || maxPrice !== prevBounds.maxPrice);

    const shouldExpandArea =
      state.areaRange[0] === prevBounds.minArea &&
      state.areaRange[1] === prevBounds.maxArea &&
      (minArea !== prevBounds.minArea || maxArea !== prevBounds.maxArea);

    if (shouldExpandPrice) {
      dispatch({ type: 'SET_PRICE_RANGE', value: [minPrice, maxPrice] });
    }

    if (shouldExpandArea) {
      dispatch({ type: 'SET_AREA_RANGE', value: [minArea, maxArea] });
    }

    prevBoundsRef.current = { minPrice, maxPrice, minArea, maxArea };
  }, [apartments.length, minPrice, maxPrice, minArea, maxArea, state.priceRange, state.areaRange]);

  // ── Adjust ranges when currency changes ──

  useEffect(() => {
    if (apartments.length === 0) return;

    const prev = previousCurrencyRef.current;
    const curr = state.selectedCurrency;

    if (prev !== curr && state.priceRangeCurrency !== curr) {
      dispatch({
        type: 'SET_PRICE_RANGE',
        value: normalizePriceRangeForCurrencyChange({
          prevCurrency: prev,
          nextCurrency: curr,
          prevRange: state.priceRange,
          minPrice,
          maxPrice,
        }),
      });
    }

    const [prevAreaMin, prevAreaMax] = state.areaRange;
    const normAreaMin = Math.max(minArea, Math.min(prevAreaMin, maxArea));
    const normAreaMax = Math.min(maxArea, Math.max(prevAreaMax, minArea));

    if (normAreaMin !== prevAreaMin || normAreaMax !== prevAreaMax) {
      dispatch({
        type: 'SET_AREA_RANGE',
        value: normAreaMin <= normAreaMax ? [normAreaMin, normAreaMax] : [minArea, maxArea],
      });
    }

    previousCurrencyRef.current = curr;
  }, [
    apartments.length,
    state.selectedCurrency,
    state.priceRangeCurrency,
    state.priceRange,
    state.areaRange,
    minPrice,
    maxPrice,
    minArea,
    maxArea,
  ]);

  useEffect(() => {
    if (apartments.length === 0) return;

    if (!visibility.price) {
      const [priceMin, priceMax] = state.priceRange;
      if (priceMin !== minPrice || priceMax !== maxPrice) {
        dispatch({ type: 'SET_PRICE_RANGE', value: [minPrice, maxPrice] });
      }
    }

    if (!visibility.area) {
      const [areaMin, areaMax] = state.areaRange;
      if (areaMin !== minArea || areaMax !== maxArea) {
        dispatch({ type: 'SET_AREA_RANGE', value: [minArea, maxArea] });
      }
    }
  }, [
    apartments.length,
    visibility.price,
    visibility.area,
    minPrice,
    maxPrice,
    minArea,
    maxArea,
    state.priceRange,
    state.areaRange,
  ]);

  // ── Filtered apartments ──

  const filteredApartments = useMemo(
    () => filterApartments(apartments, state, project?.currency, visibility),
    [apartments, state, project?.currency, visibility],
  );

  // ── Available count ──

  const getAvailableCount = useCallback(
    () => filteredApartments.filter(apt => apt.status === 'available').length,
    [filteredApartments],
  );

  // ── Reset ──

  const resetFilters = useCallback(() => {
    dispatch({
      type: 'RESET',
      defaults: computeProjectDefaults({
        apartments,
        projectCurrency: project?.currency,
        selectedCurrency: baseCurrency,
      }),
    });

    userInteractedRef.current = false;
    didInitRangesRef.current = true;
    prevBoundsRef.current = { minPrice, maxPrice, minArea, maxArea };
    previousCurrencyRef.current = baseCurrency;
  }, [apartments, project?.currency, baseCurrency, minPrice, maxPrice, minArea, maxArea]);

  // ── Public API (backward compatible) ──

  return {
    // State
    selectedFloor: state.selectedFloor,
    selectedRooms: state.selectedRooms,
    priceRange: state.priceRange,
    areaRange: state.areaRange,
    searchQuery: state.searchQuery,
    showOnlyAvailable: state.showOnlyAvailable,
    selectedType: state.selectedType,
    selectedCurrency: state.selectedCurrency,
    visibleFilterFields: visibility,
    isPriceVisible: visibility.price,
    isAreaVisible: visibility.area,
    hasAnyVisibleFilter: getHasAnyVisibleFilter(visibility),

    // Setters
    setSelectedFloor,
    setSelectedRooms,
    setPriceRange,
    setAreaRange,
    setSearchQuery,
    setShowOnlyAvailable,
    setSelectedType,
    setSelectedCurrency,

    // Computed
    filteredApartments,
    getUniqueFloors,
    getUniqueRoomCounts,
    hasFreeLayout,
    getAvailableCount,
    convertPrice,
    minPrice,
    maxPrice,
    minArea,
    maxArea,
    resetFilters,
  };
};

export type ProjectFilters = ReturnType<typeof useProjectFilters>;
