import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import type { Apartment } from '@/entities/apartment/model/types';
import type { FieldSetting } from '@/hooks/useFields';

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

const hiddenPriceSettings: FieldSetting[] = [
  {
    field_name: 'price',
    field_label: 'Price',
    field_type: 'number',
    is_custom: false,
    is_visible: false,
    sort_order: 1,
  },
];

describe('RecommendedApartmentCard visibility', () => {
  it('shows "по запросу" when price is hidden by field settings', () => {
    const markup = renderToStaticMarkup(
      <RecommendedApartmentCard
        apartment={apartment}
        thumbnailUrl={null}
        onClick={() => undefined}
        title="Apartment № 12"
        floorLabel="floor"
        roomText="2 rooms"
        isPriceVisible
        isAreaVisible
        fieldSettings={hiddenPriceSettings}
        formattedPrice="$150,000"
        getStatusColor={() => 'text-green-600'}
        getStatusStyle={() => ({})}
        getStatusLabel={() => 'Available'}
      />,
    );

    expect(markup).toContain('по запросу');
    expect(markup).not.toContain('$150,000');
    expect(markup).not.toContain('₽');
  });

  it('hides area and keeps details row clean when area visibility is false', () => {
    const markup = renderToStaticMarkup(
      <RecommendedApartmentCard
        apartment={apartment}
        thumbnailUrl={null}
        onClick={() => undefined}
        title="Apartment № 12"
        floorLabel="floor"
        roomText="2 rooms"
        isPriceVisible
        visibility={{ area: false }}
        formattedPrice="$150,000"
        getStatusColor={() => 'text-green-600'}
        getStatusStyle={() => ({})}
        getStatusLabel={() => 'Available'}
      />,
    );

    expect(markup).not.toContain('m²');
    expect(markup).not.toContain('2 rooms • 42');
    expect(markup).toContain('2 rooms');
  });
});
