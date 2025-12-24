import type { BuildingFloor } from "@/features/visualization/buildingFacade/model/types";

export type PolygonPointPct = { x: number; y: number };
export type PolygonBoundsPct = { minX: number; maxX: number; minY: number; maxY: number };
export type PopupSize = { width: number; height: number };
export type PopupPosition = { x: number; y: number };

type Rect = { x: number; y: number; width: number; height: number };

export function getPolygonBoundsPct(polygon: PolygonPointPct[]): PolygonBoundsPct {
  let minX = 100,
    maxX = 0,
    minY = 100,
    maxY = 0;
  polygon.forEach((p) => {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  });
  return { minX, maxX, minY, maxY };
}

const rectOverlapArea = (a: Rect, b: Rect) => {
  const x1 = Math.max(a.x, b.x);
  const y1 = Math.max(a.y, b.y);
  const x2 = Math.min(a.x + a.width, b.x + b.width);
  const y2 = Math.min(a.y + a.height, b.y + b.height);
  const w = x2 - x1;
  const h = y2 - y1;
  return w > 0 && h > 0 ? w * h : 0;
};

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const clampWithin = (pos: number, popupSize: number, containerSize: number, pad: number) => {
  const maxPos = Math.max(pad, containerSize - popupSize - pad);
  return clamp(pos, pad, maxPos);
};

export function computeMobileDockPosition(args: {
  containerEl: HTMLElement | null;
  isExpanded: boolean;
  imgDimensions: { width: number; height: number };
  visibleFloors: BuildingFloor[];
  size: PopupSize;
}): PopupPosition | null {
  const { containerEl, isExpanded, imgDimensions, visibleFloors, size } = args;
  if (!containerEl) return null;
  if (!isExpanded || imgDimensions.width === 0 || imgDimensions.height === 0) return null;

  const containerRect = containerEl.getBoundingClientRect();
  const containerWidth = containerRect.width;
  const containerHeight = containerRect.height;

  const svgWidth = imgDimensions.width;
  const svgHeight = imgDimensions.height;
  const svgLeft = (containerWidth - svgWidth) / 2;
  const svgTop = (containerHeight - svgHeight) / 2;

  const padding = 8;
  const offset = 12;

  const popupW = Math.max(1, size.width);
  const popupH = Math.max(1, size.height);

  const polygonRects: Rect[] = visibleFloors
    .filter((f) => f.polygon && f.polygon.length >= 3)
    .map((f) => {
      const b = getPolygonBoundsPct(f.polygon);
      const x = svgLeft + (b.minX / 100) * svgWidth;
      const y = svgTop + (b.minY / 100) * svgHeight;
      const width = ((b.maxX - b.minX) / 100) * svgWidth;
      const height = ((b.maxY - b.minY) / 100) * svgHeight;
      return { x, y, width, height };
    });

  if (polygonRects.length === 0) {
    const x = clampWithin(containerWidth - popupW - padding, popupW, containerWidth, padding);
    const y = clampWithin(containerHeight / 2 - popupH / 2, popupH, containerHeight, padding);
    return { x, y };
  }

  const minX = Math.min(...polygonRects.map((r) => r.x));
  const maxX = Math.max(...polygonRects.map((r) => r.x + r.width));
  const minY = Math.min(...polygonRects.map((r) => r.y));
  const maxY = Math.max(...polygonRects.map((r) => r.y + r.height));
  const polyCenterX = (minX + maxX) / 2;
  const polyCenterY = (minY + maxY) / 2;

  const candidates: Array<{ x: number; y: number }> = [
    { x: maxX + offset, y: containerHeight / 2 - popupH / 2 },
    { x: minX - offset - popupW, y: containerHeight / 2 - popupH / 2 },
    { x: polyCenterX - popupW / 2, y: maxY + offset },
    { x: polyCenterX - popupW / 2, y: minY - offset - popupH },
    { x: maxX + offset, y: minY },
    { x: maxX + offset, y: maxY - popupH },
    { x: minX - offset - popupW, y: minY },
    { x: minX - offset - popupW, y: maxY - popupH },
    { x: containerWidth / 2 - popupW / 2, y: containerHeight / 2 - popupH / 2 },
  ];

  const scoreCandidate = (c: { x: number; y: number }) => {
    const rect: Rect = {
      x: clampWithin(c.x, popupW, containerWidth, padding),
      y: clampWithin(c.y, popupH, containerHeight, padding),
      width: popupW,
      height: popupH,
    };

    let overlapArea = 0;
    let overlapCount = 0;
    for (const p of polygonRects) {
      const area = rectOverlapArea(rect, p);
      if (area > 0) overlapCount += 1;
      overlapArea += area;
    }

    const dist =
      Math.abs(rect.x + popupW / 2 - polyCenterX) + Math.abs(rect.y + popupH / 2 - polyCenterY);
    return { rect, overlapCount, overlapArea, dist };
  };

  let best: ReturnType<typeof scoreCandidate> | null = null;
  for (const c of candidates) {
    const s = scoreCandidate(c);
    if (!best) {
      best = s;
      continue;
    }
    const better =
      s.overlapCount < best.overlapCount ||
      (s.overlapCount === best.overlapCount && s.overlapArea < best.overlapArea) ||
      (s.overlapCount === best.overlapCount &&
        s.overlapArea === best.overlapArea &&
        s.dist < best.dist);
    if (better) best = s;
  }

  return best ? { x: best.rect.x, y: best.rect.y } : null;
}

export function computePopupPositionForPolygon(args: {
  containerEl: HTMLElement | null;
  isExpanded: boolean;
  imgDimensions: { width: number; height: number };
  polygonBoundsPct: PolygonBoundsPct;
  size: PopupSize;
}): PopupPosition | null {
  const { containerEl, isExpanded, imgDimensions, polygonBoundsPct, size } = args;
  if (!containerEl) return null;
  if (!isExpanded || imgDimensions.width === 0 || imgDimensions.height === 0) return null;

  const padding = 8;
  const offset = 12;

  const containerRect = containerEl.getBoundingClientRect();
  const containerWidth = containerRect.width;
  const containerHeight = containerRect.height;

  const svgWidth = imgDimensions.width;
  const svgHeight = imgDimensions.height;
  const svgLeft = (containerWidth - svgWidth) / 2;
  const svgTop = (containerHeight - svgHeight) / 2;

  const polyMinX = svgLeft + (polygonBoundsPct.minX / 100) * svgWidth;
  const polyMaxX = svgLeft + (polygonBoundsPct.maxX / 100) * svgWidth;
  const polyMinY = svgTop + (polygonBoundsPct.minY / 100) * svgHeight;
  const polyMaxY = svgTop + (polygonBoundsPct.maxY / 100) * svgHeight;

  const popupW = Math.max(1, size.width);
  const popupH = Math.max(1, size.height);

  const polygonCenterXPct = (polygonBoundsPct.minX + polygonBoundsPct.maxX) / 2;
  const preferRight = polygonCenterXPct < 50;

  const rightCandidateX = polyMaxX + offset;
  const leftCandidateX = polyMinX - offset - popupW;
  const fitsRight = rightCandidateX + popupW + padding <= containerWidth;
  const fitsLeft = leftCandidateX >= padding;

  let x = preferRight
    ? fitsRight
      ? rightCandidateX
      : fitsLeft
        ? leftCandidateX
        : rightCandidateX
    : fitsLeft
      ? leftCandidateX
      : fitsRight
        ? rightCandidateX
        : leftCandidateX;

  const polygonCenterY = (polyMinY + polyMaxY) / 2;
  let y = polygonCenterY - popupH / 2;

  x = clampWithin(x, popupW, containerWidth, padding);
  y = clampWithin(y, popupH, containerHeight, padding);

  return { x, y };
}






