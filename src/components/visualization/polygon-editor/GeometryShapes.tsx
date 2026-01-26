
export interface Point {
  x: number;
  y: number;
}

export interface Shape {
  id: string;
  type: 'polygon' | 'circle' | 'rectangle';
  points: Point[];
  center?: Point;
  radius?: number;
  width?: number;
  height?: number;
  color: string;
  isSelected: boolean;
}

export const createCircleFromTwoPoints = (start: Point, end: Point): Point[] => {
  const centerX = start.x;
  const centerY = start.y;
  const radius = Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2));
  
  // Минимальный радиус для предотвращения нестабильности
  const minRadius = 1;
  const finalRadius = Math.max(radius, minRadius);
  
  // Создаем точки окружности
  const points: Point[] = [];
  const segments = 24; // Уменьшено количество сегментов для лучшей производительности
  
  for (let i = 0; i < segments; i++) {
    const angle = (i / segments) * 2 * Math.PI;
    points.push({
      x: centerX + finalRadius * Math.cos(angle),
      y: centerY + finalRadius * Math.sin(angle)
    });
  }
  
  return points;
};

export const createRectangleFromTwoPoints = (start: Point, end: Point): Point[] => {
  return [
    { x: start.x, y: start.y },
    { x: end.x, y: start.y },
    { x: end.x, y: end.y },
    { x: start.x, y: end.y }
  ];
};

export const isPointNearLine = (point: Point, lineStart: Point, lineEnd: Point, threshold: number = 3): boolean => {
  const A = point.x - lineStart.x;
  const B = point.y - lineStart.y;
  const C = lineEnd.x - lineStart.x;
  const D = lineEnd.y - lineStart.y;

  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  
  if (lenSq === 0) return false;
  
  const param = dot / lenSq;
  
  let closestX, closestY;
  
  if (param < 0) {
    closestX = lineStart.x;
    closestY = lineStart.y;
  } else if (param > 1) {
    closestX = lineEnd.x;
    closestY = lineEnd.y;
  } else {
    closestX = lineStart.x + param * C;
    closestY = lineStart.y + param * D;
  }
  
  const distance = Math.sqrt(Math.pow(point.x - closestX, 2) + Math.pow(point.y - closestY, 2));
  return distance <= threshold;
};

export const getPointDistance = (p1: Point, p2: Point): number => {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
};

export const findNearestPoint = (targetPoint: Point, points: Point[], threshold: number = 5): number | null => {
  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    if (!p) continue;
    if (getPointDistance(targetPoint, p) <= threshold) {
      return i;
    }
  }
  return null;
};

export const isPointInsidePolygon = (point: Point, polygon: Point[]): boolean => {
  if (polygon.length < 3) return false;
  let inside = false;
  
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const pi = polygon[i];
    const pj = polygon[j];
    if (!pi || !pj) continue;
    if (((pi.y > point.y) !== (pj.y > point.y)) &&
        (point.x < (pj.x - pi.x) * (point.y - pi.y) / (pj.y - pi.y) + pi.x)) {
      inside = !inside;
    }
  }
  
  return inside;
};
