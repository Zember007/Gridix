import { describe, it, expect } from 'vitest';
import { filterApartments } from '../hooks/useProjectFilters';
import type { Apartment } from '@/entities/apartment/model/types';

function makeApartment(overrides: Partial<Apartment> = {}): Apartment {
  return {
    id: 'apt-1',
    apartment_number: '101',
    floor_number: 1,
    rooms: 2,
    area: 60,
    price: 100_000,
    status: 'available',
    type: 'apartment',
    polygon: [],
    custom_fields: null,
    project_id: 'proj-1',
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
    floor_plan_id: null,
    ...overrides,
  };
}

const DEFAULT_STATE = {
  selectedFloor: 'all',
  selectedRooms: 'all',
  priceRange: [0, 10_000_000] as [number, number],
  areaRange: [0, 1000] as [number, number],
  searchQuery: '',
  showOnlyAvailable: false,
  selectedType: 'all' as const,
  selectedCurrency: 'USD',
};

describe('filterApartments', () => {
  const apartments: Apartment[] = [
    makeApartment({ id: '1', apartment_number: '101', floor_number: 1, rooms: 1, area: 40, price: 50_000, status: 'available' }),
    makeApartment({ id: '2', apartment_number: '202', floor_number: 2, rooms: 2, area: 60, price: 100_000, status: 'sold' }),
    makeApartment({ id: '3', apartment_number: '303', floor_number: 3, rooms: 3, area: 80, price: 200_000, status: 'available' }),
    makeApartment({ id: '4', apartment_number: '104', floor_number: 1, rooms: 'free_layout', area: 90, price: 250_000, status: 'reserved', type: 'apartment' }),
    makeApartment({ id: '5', apartment_number: 'P1', floor_number: -1, rooms: 0, area: 15, price: 30_000, status: 'available', type: 'parking' }),
  ];

  it('returns all apartments when no filters are active', () => {
    const result = filterApartments(apartments, DEFAULT_STATE, 'USD');
    expect(result).toHaveLength(5);
  });

  it('filters by floor', () => {
    const result = filterApartments(apartments, { ...DEFAULT_STATE, selectedFloor: '1' }, 'USD');
    expect(result.map(a => a.id)).toEqual(['1', '4']);
  });

  it('filters by rooms (exact)', () => {
    const result = filterApartments(apartments, { ...DEFAULT_STATE, selectedRooms: '2' }, 'USD');
    expect(result.map(a => a.id)).toEqual(['2']);
  });

  it('filters by rooms (4+)', () => {
    // None with 4+ rooms in test data, but free_layout counts
    const result = filterApartments(apartments, { ...DEFAULT_STATE, selectedRooms: '4+' }, 'USD');
    expect(result.map(a => a.id)).toEqual(['4']);
  });

  it('filters by rooms (free_layout)', () => {
    const result = filterApartments(apartments, { ...DEFAULT_STATE, selectedRooms: 'free_layout' }, 'USD');
    expect(result.map(a => a.id)).toEqual(['4']);
  });

  it('filters by type', () => {
    const result = filterApartments(apartments, { ...DEFAULT_STATE, selectedType: 'parking' }, 'USD');
    expect(result.map(a => a.id)).toEqual(['5']);
  });

  it('filters by showOnlyAvailable', () => {
    const result = filterApartments(apartments, { ...DEFAULT_STATE, showOnlyAvailable: true }, 'USD');
    expect(result.every(a => a.status === 'available')).toBe(true);
    expect(result).toHaveLength(3);
  });

  it('filters by price range', () => {
    const result = filterApartments(
      apartments,
      { ...DEFAULT_STATE, priceRange: [60_000, 150_000] },
      'USD',
    );
    expect(result.map(a => a.id)).toEqual(['2']);
  });

  it('filters by area range', () => {
    const result = filterApartments(
      apartments,
      { ...DEFAULT_STATE, areaRange: [50, 70] },
      'USD',
    );
    expect(result.map(a => a.id)).toEqual(['2']);
  });

  it('filters by search query (case-insensitive)', () => {
    const result = filterApartments(
      apartments,
      { ...DEFAULT_STATE, searchQuery: 'p1' },
      'USD',
    );
    expect(result.map(a => a.id)).toEqual(['5']);
  });

  it('combines multiple filters', () => {
    const result = filterApartments(
      apartments,
      {
        ...DEFAULT_STATE,
        selectedFloor: '1',
        showOnlyAvailable: true,
        selectedType: 'apartment',
      },
      'USD',
    );
    expect(result.map(a => a.id)).toEqual(['1']);
  });
});
