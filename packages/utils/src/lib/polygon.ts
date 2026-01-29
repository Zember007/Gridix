export interface Point {
  x: number
  y: number
}

export interface Shape {
  id: string
  type: "polygon" | "circle" | "rectangle"
  points: Point[]
  center?: Point
  radius?: number
  width?: number
  height?: number
  color: string
  isSelected: boolean
}

/** Получить размеры изображения по URL */
export async function getImageSize(url: string): Promise<{ width: number; height: number }> {
  return await new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => resolve({ width: img.width, height: img.height })
    img.onerror = reject
    img.src = url
  })
}

/** Перевести координаты из процентов в пиксели */
export function shapeToPixels(shape: Shape, imageWidth: number, imageHeight: number): Shape {
  const convertPoint = (p: Point) => ({
    x: p.x * (imageWidth / 100),
    y: p.y * (imageHeight / 100),
  })

  return {
    ...shape,
    points: shape.points.map(convertPoint),
    ...(shape.center ? { center: convertPoint(shape.center) } : {}),
    ...(shape.radius != null ? { radius: shape.radius * Math.max(imageWidth, imageHeight) } : {}),
    ...(shape.width != null ? { width: shape.width * imageWidth } : {}),
    ...(shape.height != null ? { height: shape.height * imageHeight } : {}),
  }
}

/** Перевести координаты из пикселей в проценты */
export function shapeToPercents(shape: Shape, imageWidth: number, imageHeight: number): Shape {
  const convertPoint = (p: Point) => ({
    x: (p.x / imageWidth) * 100,
    y: (p.y / imageHeight) * 100,
  })

  return {
    ...shape,
    points: shape.points.map(convertPoint),
    ...(shape.center ? { center: convertPoint(shape.center) } : {}),
    ...(shape.radius != null ? { radius: shape.radius / Math.max(imageWidth, imageHeight) } : {}),
    ...(shape.width != null ? { width: shape.width / imageWidth } : {}),
    ...(shape.height != null ? { height: shape.height / imageHeight } : {}),
  }
}

