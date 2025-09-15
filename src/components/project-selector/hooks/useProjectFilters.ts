import { useState, useEffect, useCallback, useMemo } from 'react';
import { Apartment } from '@/types/apartment';
import { isValidCurrency } from '@/lib/currency-utils';

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
  const [areaRange, setAreaRange] = useState<number[]>([0, 200]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showOnlyAvailable, setShowOnlyAvailable] = useState(true);
  const [selectedType, setSelectedType] = useState<'all' | 'apartment' | 'commercial' | 'parking'>('all');
  const [selectedCurrency, setSelectedCurrency] = useState<string>('RUB');

  // Exchange rates
  const exchangeRates = useMemo(() => ({
    RUB: 1,
    USD: 0.011,
    EUR: 0.01,
    GEL: 0.03,
  } as const), []);

  // Set currency from project
  useEffect(() => {
    if (project?.currency && isValidCurrency(project.currency)) {
      setSelectedCurrency(project.currency);
    }
  }, [project]);

  // Price conversion
  const convertPrice = useCallback((price: number, fromCurrency: string | null | undefined, toCurrency: string): number => {
    if (!price) return 0;
    const from = isValidCurrency(String(fromCurrency)) ? String(fromCurrency) as keyof typeof exchangeRates : 'RUB';
    const to = isValidCurrency(String(toCurrency)) ? String(toCurrency) as keyof typeof exchangeRates : 'RUB';
    const priceInRub = from === 'RUB' ? price : price / exchangeRates[from];
    return to === 'RUB' ? priceInRub : priceInRub * exchangeRates[to];
  }, [exchangeRates]);

  // Get unique floors
  const getUniqueFloors = useCallback(() => {
    return [...new Set(apartments.map(apt => apt.floor_number))].sort((a, b) => a - b);
  }, [apartments]);

  // Get unique room counts
  const getUniqueRoomCounts = useCallback(() => {
    return [...new Set(apartments.map(apt => typeof apt.rooms === 'string' ? parseInt(apt.rooms) : apt.rooms))].sort((a, b) => a - b);
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
  }, [apartments, selectedCurrency, project?.currency, convertPrice]);

  // Update price range when currency changes
  useEffect(() => {
    if (apartments.length > 0) {
      setPriceRange([minPrice, maxPrice]);
    }
  }, [selectedCurrency, project?.currency, minPrice, maxPrice, apartments.length]);

  // Filtered apartments
  const filteredApartments = useMemo(() => {
    let filtered = [...apartments];

    if (selectedFloor !== 'all') {
      filtered = filtered.filter(apt => apt.floor_number === parseInt(selectedFloor));
    }

    if (selectedRooms !== 'all') {
      if (selectedRooms === '4+') {
        filtered = filtered.filter(apt => Number(apt.rooms) >= 4);
      } else {
        filtered = filtered.filter(apt => Number(apt.rooms) === parseInt(selectedRooms));
      }
    }

    if (selectedType !== 'all') {
      filtered = filtered.filter(apt => apt.type === selectedType);
    }

    if (showOnlyAvailable) {
      filtered = filtered.filter(apt => apt.status === 'available');
    }

    filtered = filtered.filter(apt => {
      const price = apt.price || 0;
      const convertedPrice = convertPrice(price, project?.currency, selectedCurrency);
      const area = apt.area || 0;
      return convertedPrice >= priceRange[0] && convertedPrice <= priceRange[1] &&
        area >= areaRange[0] && area <= areaRange[1];
    });

    if (searchQuery) {
      filtered = filtered.filter(apt =>
        apt.apartment_number.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered;
  }, [apartments, selectedFloor, selectedRooms, selectedType, showOnlyAvailable, priceRange, areaRange, searchQuery, selectedCurrency, project?.currency, convertPrice]);

  const getAvailableCount = useCallback(() => {
    return filteredApartments.filter(apt => apt.status === 'available').length;
  }, [filteredApartments]);

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
    getAvailableCount,
    convertPrice,
    minPrice,
    maxPrice,
    minArea,
    maxArea,
  };
};
