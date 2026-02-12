import { describe, it, expect } from 'vitest';
import { getUniqueLayoutTypes } from '../hooks/useApartmentsData';
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

describe('getUniqueLayoutTypes', () => {
  it('returns sorted unique layout types', () => {
    const apartments = [
      makeApartment({ id: '1', rooms: 1, type: 'apartment' }),
      makeApartment({ id: '2', rooms: 2, type: 'apartment' }),
      makeApartment({ id: '3', rooms: 2, type: 'apartment' }),
      makeApartment({ id: '4', rooms: 0, type: 'apartment' }),
    ];
    const result = getUniqueLayoutTypes(apartments);
    expect(result).toEqual(['1-room', '2-room', 'studio']);
  });

  it('includes free_layout', () => {
    const apartments = [
      makeApartment({ id: '1', rooms: 'free_layout', type: 'apartment' }),
      makeApartment({ id: '2', rooms: 1, type: 'apartment' }),
    ];
    const result = getUniqueLayoutTypes(apartments);
    expect(result).toEqual(['1-room', 'free_layout']);
  });

  it('uses type name for non-apartment types', () => {
    const apartments = [
      makeApartment({ id: '1', type: 'commercial', rooms: 0 }),
      makeApartment({ id: '2', type: 'parking', rooms: 0 }),
    ];
    const result = getUniqueLayoutTypes(apartments);
    expect(result).toEqual(['commercial', 'parking']);
  });

  it('returns empty array for no apartments', () => {
    expect(getUniqueLayoutTypes([])).toEqual([]);
  });
});
