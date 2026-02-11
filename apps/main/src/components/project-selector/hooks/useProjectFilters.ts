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

const INITIAL_STATE: FiltersState = {
  selectedFloor: 'all',
  selectedRooms: 'all',
  priceRange: [0, 10_000_000],
  priceRangeCurrency: DEFAULT_CURRENCY,
  areaRange: [0, 1000],
  searchQuery: '',
  showOnlyAvailable: true,
  selectedType: 'all',
  selectedCurrency: DEFAULT_CURRENCY,
};

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
      return { ...INITIAL_STATE, ...action.defaults };
    default:
      return state;
  }
}

// ── Pure filter function (testable) ──

export function filterApartments(
  apartments: Apartment[],
  state: FiltersState,
  projectCurrency: string | undefined | null,
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

  let result = apartments;

  if (selectedFloor !== 'all') {
    const floorNum = parseInt(selectedFloor, 10);
    result = result.filter(apt => apt.floor_number === floorNum);
  }

  if (selectedRooms !== 'all') {
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

  if (selectedType !== 'all') {
    result = result.filter(apt => apt.type === selectedType);
  }

  if (showOnlyAvailable) {
    result = result.filter(apt => apt.status === 'available');
  }

  const [minPrice, maxPrice] = priceRange;
  const [minArea, maxArea] = areaRange;

  result = result.filter(apt => {
    const converted = convertPrice(apt.price || 0, projectCurrency, selectedCurrency);
    const area = apt.area || 0;
    return converted >= minPrice && converted <= maxPrice && area >= minArea && area <= maxArea;
  });

  if (searchQuery) {
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

export const useProjectFilters = ({ apartments, project }: UseProjectFiltersProps) => {
  const [state, dispatch] = useReducer(filtersReducer, INITIAL_STATE);

  // ── Dispatch wrappers (maintain backward-compatible setter signatures) ──

  const setSelectedFloor = useCallback(
    (value: string) => dispatch({ type: 'SET_FLOOR', value }),
    [],
  );
  const setSelectedRooms = useCallback(
    (value: string) => dispatch({ type: 'SET_ROOMS', value }),
    [],
  );
  const setPriceRange = useCallback(
    (value: [number, number]) => dispatch({ type: 'SET_PRICE_RANGE', value }),
    [],
  );
  const setAreaRange = useCallback(
    (value: [number, number]) => dispatch({ type: 'SET_AREA_RANGE', value }),
    [],
  );
  const setSearchQuery = useCallback(
    (value: string) => dispatch({ type: 'SET_SEARCH', value }),
    [],
  );
  const setShowOnlyAvailable = useCallback(
    (value: boolean) => dispatch({ type: 'SET_SHOW_ONLY_AVAILABLE', value }),
    [],
  );
  const setSelectedType = useCallback(
    (value: ApartmentTypeFilter) => dispatch({ type: 'SET_TYPE', value }),
    [],
  );
  const setSelectedCurrency = useCallback(
    (value: string) => dispatch({ type: 'SET_CURRENCY', value }),
    [],
  );

  // ── Sync currency from project ──

  useEffect(() => {
    if (project?.currency && isValidCurrency(project.currency)) {
      dispatch({ type: 'SET_CURRENCY', value: project.currency });
    } else {
      dispatch({ type: 'SET_CURRENCY', value: DEFAULT_CURRENCY });
    }
  }, [project?.currency]);

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

  const { minPrice, maxPrice, minArea, maxArea } = useMemo(() => {
    if (apartments.length === 0) {
      return { minPrice: 0, maxPrice: 10_000_000, minArea: 0, maxArea: 200 };
    }
    const prices = apartments.map(apt =>
      convertPrice(apt.price || 0, project?.currency, state.selectedCurrency),
    );
    const areas = apartments.map(apt => apt.area);
    return {
      minPrice: Math.min(...prices),
      maxPrice: Math.max(...prices),
      minArea: Math.min(...areas),
      maxArea: Math.max(...areas),
    };
  }, [apartments, state.selectedCurrency, project?.currency]);

  // ── Adjust ranges when currency changes ──

  const previousCurrencyRef = useRef(state.selectedCurrency);

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

    // Area range normalisation (in case bounds shifted)
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
    state.selectedCurrency,
    state.priceRangeCurrency,
    minPrice,
    maxPrice,
    minArea,
    maxArea,
    apartments.length,
    state.priceRange,
    state.areaRange,
  ]);

  // ── Filtered apartments ──

  const filteredApartments = useMemo(
    () => filterApartments(apartments, state, project?.currency),
    [apartments, state, project?.currency],
  );

  // ── Available count ──

  const getAvailableCount = useCallback(
    () => filteredApartments.filter(apt => apt.status === 'available').length,
    [filteredApartments],
  );

  // ── Reset ──

  const resetFilters = useCallback(() => {
    const baseCurrency =
      project?.currency && isValidCurrency(project.currency) ? project.currency : DEFAULT_CURRENCY;
    dispatch({
      type: 'RESET',
      defaults: {
        selectedCurrency: baseCurrency,
        priceRange: [minPrice, maxPrice],
        priceRangeCurrency: baseCurrency,
        areaRange: [minArea, maxArea],
      },
    });
  }, [minPrice, maxPrice, minArea, maxArea, project?.currency]);

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
