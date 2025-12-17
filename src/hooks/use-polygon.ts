import { Point, Shape } from "@/components";


/** Получить размеры изображения по URL */
export async function getImageSize(url: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve({ width: img.width, height: img.height });
    img.onerror = reject;
    img.src = url;
  });
}

/** Перевести координаты из процентов в пиксели */
export function shapeToPixels(shape: Shape, imageWidth: number, imageHeight: number): Shape {
  const convertPoint = (p: Point) => ({
    x: p.x * (imageWidth / 100),
    y: p.y * (imageHeight / 100),
  });

  return {
    ...shape,
    points: shape.points.map(convertPoint),
    center: shape.center ? convertPoint(shape.center) : undefined,
    radius: shape.radius ? shape.radius * Math.max(imageWidth, imageHeight) : undefined,
    width: shape.width ? shape.width * imageWidth : undefined,
    height: shape.height ? shape.height * imageHeight : undefined,
  };
}

/** Перевести координаты из пикселей в проценты */
export function shapeToPercents(shape: Shape, imageWidth: number, imageHeight: number): Shape {
  const convertPoint = (p: Point) => ({
    x: p.x / imageWidth * 100,
    y: p.y / imageHeight * 100,
  });

  return {
    ...shape,
    points: shape.points.map(convertPoint),
    center: shape.center ? convertPoint(shape.center) : undefined,
    radius: shape.radius ? shape.radius / Math.max(imageWidth, imageHeight) : undefined,
    width: shape.width ? shape.width / imageWidth : undefined,
    height: shape.height ? shape.height / imageHeight : undefined,
  };
}

/*   // ✅ Пример использования
  (async () => {
    const imageUrl = "https://example.com/image.jpg";
    const { width, height } = await getImageSize(imageUrl);
  
    const shape: Shape = {
      id: "1",
      type: "rectangle",
      points: [
        { x: 0.1, y: 0.2 },
        { x: 0.3, y: 0.4 },
      ],
      color: "red",
      isSelected: false,
    };
  
    const inPixels = shapeToPixels(shape, width, height);
  
    const backToPercents = shapeToPercents(inPixels, width, height);
  })(); */

