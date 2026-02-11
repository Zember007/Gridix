import { describe, expect, it } from 'vitest';

import {
  computeMobileDockPosition,
  computePopupPositionForPolygon,
  type ImageRectInContainer,
} from '@/features/visualization/buildingFacade/lib/popupPosition';
import type { BuildingFloor } from '@/features/visualization/buildingFacade/model/types';

function createContainer(width: number, height: number): HTMLElement {
  return {
    getBoundingClientRect: () => ({
      width,
      height,
      top: 0,
      left: 0,
      right: width,
      bottom: height,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    }),
  } as HTMLElement;
}

const imageRect: ImageRectInContainer = {
  offset: { x: 100, y: 0 },
  size: { width: 800, height: 600 },
};

describe('popupPosition utils', () => {
  it('places popup in container coordinates using image offset', () => {
    const container = createContainer(1000, 600);

    const position = computePopupPositionForPolygon({
      containerEl: container,
      isExpanded: true,
      imageRect,
      polygonBoundsPct: {
        minX: 45,
        maxX: 55,
        minY: 40,
        maxY: 60,
      },
      size: { width: 160, height: 120 },
    });

    expect(position).not.toBeNull();
    if (!position) return;

    const polygonCenterX = imageRect.offset.x + imageRect.size.width * 0.5;
    const popupCenterX = position.x + 80;

    expect(Math.abs(popupCenterX - polygonCenterX)).toBeLessThanOrEqual(220);
    expect(position.x).toBeGreaterThanOrEqual(0);
    expect(position.y).toBeGreaterThanOrEqual(0);
  });

  it('computes mobile dock relative to image rect and remains in container bounds', () => {
    const container = createContainer(1000, 600);

    const floor: BuildingFloor = {
      id: 'floor-1',
      floor_number: 1,
      polygon: [
        { x: 45, y: 20 },
        { x: 55, y: 20 },
        { x: 55, y: 30 },
        { x: 45, y: 30 },
      ],
      color: '#3b82f6',
    };

    const position = computeMobileDockPosition({
      containerEl: container,
      isExpanded: true,
      imageRect,
      visibleFloors: [floor],
      size: { width: 180, height: 120 },
    });

    expect(position).not.toBeNull();
    if (!position) return;

    expect(position.x).toBeGreaterThanOrEqual(8);
    expect(position.y).toBeGreaterThanOrEqual(8);
    expect(position.x + 180).toBeLessThanOrEqual(1000 - 8);
    expect(position.y + 120).toBeLessThanOrEqual(600 - 8);
  });
});
