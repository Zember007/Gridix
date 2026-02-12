import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import type { Apartment } from '@/entities/apartment/model/types';

vi.mock('@gridix/ui', () => ({
  Badge: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <span className={className}>{children}</span>
  ),
}));

import RecommendedApartmentCard from './RecommendedApartmentCard';

const apartment: Apartment = {
  id: 'apt-1',
  apartment_number: '12',
  floor_number: 5,
  rooms: 2,
  area: 42,
  price: 150000,
  status: 'available',
  type: 'apartment',
  polygon: [],
  custom_fields: null,
  project_id: 'project-1',
  created_at: '2024-01-01T00:00:00.000Z',
  updated_at: '2024-01-01T00:00:00.000Z',
  floor_plan_id: null,
};

describe('RecommendedApartmentCard visibility', () => {
  it('hides price when isPriceVisible is false', () => {
    const markup = renderToStaticMarkup(
      <RecommendedApartmentCard
        apartment={apartment}
        thumbnailUrl={null}
        onClick={() => undefined}
        title="Apartment № 12"
        floorLabel="floor"
        roomText="2 rooms"
        isPriceVisible={false}
        isAreaVisible
        formattedPrice="$150,000"
        getStatusColor={() => 'text-green-600'}
        getStatusStyle={() => ({})}
        getStatusLabel={() => 'Available'}
      />,
    );

    expect(markup).not.toContain('$150,000');
  });

  it('hides area and keeps details row clean when isAreaVisible is false', () => {
    const markup = renderToStaticMarkup(
      <RecommendedApartmentCard
        apartment={apartment}
        thumbnailUrl={null}
        onClick={() => undefined}
        title="Apartment № 12"
        floorLabel="floor"
        roomText="2 rooms"
        isPriceVisible
        isAreaVisible={false}
        formattedPrice="$150,000"
        getStatusColor={() => 'text-green-600'}
        getStatusStyle={() => ({})}
        getStatusLabel={() => 'Available'}
      />,
    );

    expect(markup).not.toContain('m²');
    expect(markup).not.toContain('•');
    expect(markup).toContain('2 rooms');
  });
});
