import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Apartment } from '@/entities/apartment/model/types';
import { convertPrice, DEFAULT_CURRENCY, isValidCurrency } from "@gridix/utils/lib";

interface Project {
  currency?: string;
  has_commercial?: boolean;
  has_parking?: boolean;
}

interface UseProjectFiltersProps {
  apartments: Apartment[];
  project?: Project;
}

export const useProjectFilters = ({ apartments, project }: UseProjectFiltersProps) => {
  const [selectedFloor, setSelectedFloor] = useState<string>('all');
  const [selectedRooms, setSelectedRooms] = useState<string>('all');
  const [priceRange, setPriceRange] = useState<number[]>([0, 10000000]);
  const [areaRange, setAreaRange] = useState<number[]>([0, 1000]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showOnlyAvailable, setShowOnlyAvailable] = useState(true);
  const [selectedType, setSelectedType] = useState<'all' | 'apartment' | 'commercial' | 'parking'>('all');
  const [selectedCurrency, setSelectedCurrency] = useState<string>('RUB');


  // Set currency from project
  useEffect(() => {
    if (project?.currency && isValidCurrency(project.currency)) {
      setSelectedCurrency(project.currency);
      return;
    }

    setSelectedCurrency(DEFAULT_CURRENCY);
  }, [project?.currency]);

  // Get unique floors
  const getUniqueFloors = useCallback(() => {
    return [...new Set(apartments.map(apt => apt.floor_number))].sort((a, b) => a - b);
  }, [apartments]);

  // Get unique room counts
  const getUniqueRoomCounts = useCallback(() => {
    const numericRooms = apartments
        .filter(apt => apt.type === 'apartment' && apt.rooms !== 'free_layout')
        .map(apt => typeof apt.rooms === 'string' ? parseInt(apt.rooms) : apt.rooms)
        .filter(rooms => !isNaN(rooms));
    return [...new Set(numericRooms)].sort((a, b) => a - b);
  }, [apartments]);

  // Check if free_layout exists
  const hasFreeLayout = useCallback(() => {
    return apartments.some(apt => apt.type === 'apartment' && apt.rooms === 'free_layout');
  }, [apartments]);
  // Calculate price and area ranges
  const { minPrice, maxPrice, minArea, maxArea } = useMemo(() => {
    if (apartments.length === 0) {
      return { minPrice: 0, maxPrice: 10000000, minArea: 0, maxArea: 200 };
    }
    const convertedPrices = apartments
        .map(apt => convertPrice(apt.price || 0, project?.currency, selectedCurrency));
    const areas = apartments.map(apt => apt.area);
    return {
      minPrice: convertedPrices.length > 0 ? Math.min(...convertedPrices) : 0,
      maxPrice: convertedPrices.length > 0 ? Math.max(...convertedPrices) : 10000000,
      minArea: areas.length > 0 ? Math.min(...areas) : 0,
      maxArea: areas.length > 0 ? Math.max(...areas) : 200,
    };
  }, [apartments, selectedCurrency, project?.currency]);

  const previousCurrencyRef = useRef<string>(selectedCurrency);

  // Update range bounds when currency changes, preserving the selected interval semantics.
  useEffect(() => {
    if (apartments.length === 0) return;

    setPriceRange((previousRange) => {
      const [previousMin = minPrice, previousMax = maxPrice] = previousRange;
      const previousCurrency = previousCurrencyRef.current;
      const currentCurrency = selectedCurrency;

      const nextMin = convertPrice(previousMin, previousCurrency, currentCurrency);
      const nextMax = convertPrice(previousMax, previousCurrency, currentCurrency);

      const normalizedMin = Math.max(minPrice, Math.min(nextMin, maxPrice));
      const normalizedMax = Math.min(maxPrice, Math.max(nextMax, minPrice));

      return normalizedMin <= normalizedMax ? [normalizedMin, normalizedMax] : [minPrice, maxPrice];
    });

    setAreaRange((previousRange) => {
      if (!previousRange.length) return [minArea, maxArea];
      const [previousMin = minArea, previousMax = maxArea] = previousRange;
      const normalizedMin = Math.max(minArea, Math.min(previousMin, maxArea));
      const normalizedMax = Math.min(maxArea, Math.max(previousMax, minArea));
      return normalizedMin <= normalizedMax ? [normalizedMin, normalizedMax] : [minArea, maxArea];
    });

    previousCurrencyRef.current = selectedCurrency;
  }, [selectedCurrency, minPrice, maxPrice, minArea, maxArea, apartments.length]);

  // Filtered apartments
  const filteredApartments = useMemo(() => {
    let filtered = [...apartments];

    if (selectedFloor !== 'all') {
      filtered = filtered.filter(apt => apt.floor_number === parseInt(selectedFloor));
    }

    if (selectedRooms !== 'all') {
      if (selectedRooms === '4+') {
        filtered = filtered.filter(apt =>
                apt.type === 'apartment' && (
                    Number(apt.rooms) >= 4 || apt.rooms === 'free_layout'
                )
        );
      } else if (selectedRooms === 'free_layout') {
        filtered = filtered.filter(apt => apt.type === 'apartment' && apt.rooms === 'free_layout');
      } else {
        filtered = filtered.filter(apt => apt.type === 'apartment' && Number(apt.rooms) === parseInt(selectedRooms));
      }
    }

    if (selectedType !== 'all') {
      filtered = filtered.filter(apt => apt.type === selectedType);
    }

    if (showOnlyAvailable) {
      filtered = filtered.filter(apt => apt.status === 'available');
    }

    const minSelectedPrice = priceRange[0] ?? 0;
    const maxSelectedPrice = priceRange[1] ?? Number.MAX_SAFE_INTEGER;
    const minSelectedArea = areaRange[0] ?? 0;
    const maxSelectedArea = areaRange[1] ?? Number.MAX_SAFE_INTEGER;

    filtered = filtered.filter(apt => {
      const price = apt.price || 0;
      const convertedPrice = convertPrice(price, project?.currency, selectedCurrency);
      const area = apt.area || 0;

      return (
          convertedPrice >= minSelectedPrice &&
          convertedPrice <= maxSelectedPrice &&
          area >= minSelectedArea &&
          area <= maxSelectedArea
      );
    });

    if (searchQuery) {
      filtered = filtered.filter(apt =>
          apt.apartment_number.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered;
  }, [apartments, selectedFloor, selectedRooms, selectedType, showOnlyAvailable, priceRange, areaRange, searchQuery, selectedCurrency, project?.currency]);

  const getAvailableCount = useCallback(() => {
    return filteredApartments.filter(apt => apt.status === 'available').length;
  }, [filteredApartments]);

  const resetFilters = useCallback(() => {
    setSelectedFloor('all');
    setSelectedRooms('all');
    setSelectedType('all');
    setSearchQuery('');
    setShowOnlyAvailable(true);

    // Reset currency to project currency when possible, otherwise RUB
    const base = (project?.currency && isValidCurrency(project.currency)) ? project.currency : DEFAULT_CURRENCY;
    setSelectedCurrency(base);

    // Reset ranges to full allowed range for current currency/units
    setPriceRange([minPrice, maxPrice]);
    setAreaRange([minArea, maxArea]);
  }, [maxArea, maxPrice, minArea, minPrice, project?.currency]);

  return {
    // State
    selectedFloor,
    selectedRooms,
    priceRange,
    areaRange,
    searchQuery,
    showOnlyAvailable,
    selectedType,
    selectedCurrency,

    // Setters
    setSelectedFloor,
    setSelectedRooms,
    setPriceRange,
    setAreaRange,
    setSearchQuery,
    setShowOnlyAvailable,
    setSelectedType,
    setSelectedCurrency,

    // Computed values
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
