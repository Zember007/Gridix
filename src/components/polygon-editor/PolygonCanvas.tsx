import { useRef, useEffect, useState, useCallback } from 'react';
import { Point, Shape, createCircleFromTwoPoints, createRectangleFromTwoPoints, findNearestPoint, isPointInsidePolygon } from './GeometryShapes';
import { PolygonTool } from './PolygonToolbar';

interface PolygonCanvasProps {
  imageUrl: string;
  shapes: Shape[];
  currentShape: Shape | null;
  activeTool: PolygonTool;
  onShapeUpdate: (shapes: Shape[]) => void;
  onCurrentShapeUpdate: (shape: Shape | null) => void;
  className?: string;
}

const PolygonCanvas = ({
  imageUrl,
  shapes,
  currentShape,
  activeTool,
  onShapeUpdate,
  onCurrentShapeUpdate,
  className = ""
}: PolygonCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [dragPoint, setDragPoint] = useState<{shapeIndex: number, pointIndex: number} | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [lastMousePos, setLastMousePos] = useState<Point>({ x: 0, y: 0 });
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });

  // Получаем координаты на canvas с учетом масштаба и сдвига
  const getCanvasCoordinates = useCallback((clientX: number, clientY: number): Point => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (clientX - rect.left - pan.x) / zoom;
    const y = (clientY - rect.top - pan.y) / zoom;
    
    return { x, y };
  }, [zoom, pan]);

  // Преобразуем координаты canvas в проценты относительно изображения
  const canvasToPercent = useCallback((point: Point): Point => {
    if (!imageRef.current) return point;
    
    return {
      x: (point.x / canvasSize.width) * 100,
      y: (point.y / canvasSize.height) * 100
    };
  }, [canvasSize]);

  // Преобразуем проценты в координаты canvas
  const percentToCanvas = useCallback((point: Point): Point => {
    return {
      x: (point.x / 100) * canvasSize.width,
      y: (point.y / 100) * canvasSize.height
    };
  }, [canvasSize]);

  // Инициализация canvas при загрузке изображения
  useEffect(() => {
    if (!imageUrl) return;

    const image = new Image();
    image.onload = () => {
      imageRef.current = image;
      
      // Подгоняем размер canvas под изображение с сохранением пропорций
      const maxWidth = 800;
      const maxHeight = 600;
      const aspectRatio = image.width / image.height;
      
      let newWidth = maxWidth;
      let newHeight = maxWidth / aspectRatio;
      
      if (newHeight > maxHeight) {
        newHeight = maxHeight;
        newWidth = maxHeight * aspectRatio;
      }
      
      setCanvasSize({ width: newWidth, height: newHeight });
      
      if (canvasRef.current) {
        canvasRef.current.width = newWidth;
        canvasRef.current.height = newHeight;
      }
    };
    image.src = imageUrl;
  }, [imageUrl]);

  // Отрисовка canvas
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    if (!canvas || !image) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Применяем трансформации
    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);
    
    // Рисуем изображение
    ctx.drawImage(image, 0, 0, canvasSize.width, canvasSize.height);
    
    // Рисуем существующие фигуры
    shapes.forEach((shape, shapeIndex) => {
      if (shape.points.length === 0) return;
      
      const canvasPoints = shape.points.map(p => percentToCanvas(p));
      
      ctx.beginPath();
      ctx.moveTo(canvasPoints[0].x, canvasPoints[0].y);
      
      for (let i = 1; i < canvasPoints.length; i++) {
        ctx.lineTo(canvasPoints[i].x, canvasPoints[i].y);
      }
      
      if (shape.type !== 'polygon' || canvasPoints.length > 2) {
        ctx.closePath();
      }
      
      ctx.fillStyle = shape.color + '40';
      ctx.fill();
      ctx.strokeStyle = shape.color;
      ctx.lineWidth = 2 / zoom;
      ctx.stroke();
      
      // Рисуем точки для выбранной фигуры
      if (shape.isSelected && activeTool === 'select') {
        canvasPoints.forEach((point, pointIndex) => {
          ctx.beginPath();
          ctx.arc(point.x, point.y, 6 / zoom, 0, 2 * Math.PI);
          ctx.fillStyle = '#3b82f6';
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2 / zoom;
          ctx.stroke();
        });
      }
    });
    
    // Рисуем текущую фигуру
    if (currentShape && currentShape.points.length > 0) {
      const canvasPoints = currentShape.points.map(p => percentToCanvas(p));
      
      if (currentShape.type === 'polygon') {
        // Для полигона рисуем линии между всеми точками
        ctx.beginPath();
        ctx.moveTo(canvasPoints[0].x, canvasPoints[0].y);
        for (let i = 1; i < canvasPoints.length; i++) {
          ctx.lineTo(canvasPoints[i].x, canvasPoints[i].y);
        }
        
        ctx.strokeStyle = currentShape.color;
        ctx.lineWidth = 2 / zoom;
        ctx.setLineDash([5 / zoom, 5 / zoom]);
        ctx.stroke();
        ctx.setLineDash([]);
      } else {
        // Для других фигур рисуем замкнутую область
        ctx.beginPath();
        ctx.moveTo(canvasPoints[0].x, canvasPoints[0].y);
        for (let i = 1; i < canvasPoints.length; i++) {
          ctx.lineTo(canvasPoints[i].x, canvasPoints[i].y);
        }
        ctx.closePath();
        
        ctx.fillStyle = currentShape.color + '40';
        ctx.fill();
        ctx.strokeStyle = currentShape.color;
        ctx.lineWidth = 2 / zoom;
        ctx.setLineDash([5 / zoom, 5 / zoom]);
        ctx.stroke();
        ctx.setLineDash([]);
      }
      
      // Рисуем точки
      canvasPoints.forEach(point => {
        ctx.beginPath();
        ctx.arc(point.x, point.y, 4 / zoom, 0, 2 * Math.PI);
        ctx.fillStyle = '#3b82f6';
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1 / zoom;
        ctx.stroke();
      });
    }
    
    ctx.restore();
  }, [shapes, currentShape, activeTool, zoom, pan, canvasSize, percentToCanvas]);

  const handleMouseDown = (e: React.MouseEvent) => {
    const point = getCanvasCoordinates(e.clientX, e.clientY);
    
    if (e.button === 2) return; // Правая кнопка мыши
    
    setLastMousePos({ x: e.clientX, y: e.clientY });
    
    if (activeTool === 'move' || (e.ctrlKey && activeTool !== 'polygon')) {
      setIsPanning(true);
      return;
    }
    
    if (activeTool === 'select') {
      // Проверяем клик по точке существующей фигуры
      for (let shapeIndex = 0; shapeIndex < shapes.length; shapeIndex++) {
        const shape = shapes[shapeIndex];
        if (!shape.isSelected) continue;
        
        const canvasPoints = shape.points.map(p => percentToCanvas(p));
        const nearestPointIndex = findNearestPoint(point, canvasPoints, 10 / zoom);
        
        if (nearestPointIndex !== null) {
          setDragPoint({ shapeIndex, pointIndex: nearestPointIndex });
          setIsDrawing(true);
          return;
        }
      }
      
      // Проверяем клик внутри фигуры
      const newShapes = shapes.map(shape => ({ ...shape, isSelected: false }));
      for (let i = shapes.length - 1; i >= 0; i--) {
        const canvasPoints = shapes[i].points.map(p => percentToCanvas(p));
        if (isPointInsidePolygon(point, canvasPoints)) {
          newShapes[i].isSelected = true;
          onShapeUpdate(newShapes);
          return;
        }
      }
      
      onShapeUpdate(newShapes);
      return;
    }
    
    if (activeTool === 'polygon') {
      const percentPoint = canvasToPercent(point);
      
      if (!currentShape) {
        onCurrentShapeUpdate({
          id: Date.now().toString(),
          type: 'polygon',
          points: [percentPoint],
          color: '#3b82f6',
          isSelected: false
        });
      } else {
        onCurrentShapeUpdate({
          ...currentShape,
          points: [...currentShape.points, percentPoint]
        });
      }
      return;
    }
    
    if (activeTool === 'circle' || activeTool === 'rectangle') {
      setIsDrawing(true);
      const percentPoint = canvasToPercent(point);
      onCurrentShapeUpdate({
        id: Date.now().toString(),
        type: activeTool,
        points: [percentPoint],
        color: '#3b82f6',
        isSelected: false
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      const deltaX = e.clientX - lastMousePos.x;
      const deltaY = e.clientY - lastMousePos.y;
      setPan(prev => ({ x: prev.x + deltaX, y: prev.y + deltaY }));
      setLastMousePos({ x: e.clientX, y: e.clientY });
      return;
    }
    
    if (dragPoint && isDrawing) {
      const point = getCanvasCoordinates(e.clientX, e.clientY);
      const percentPoint = canvasToPercent(point);
      
      const newShapes = [...shapes];
      newShapes[dragPoint.shapeIndex].points[dragPoint.pointIndex] = percentPoint;
      onShapeUpdate(newShapes);
      return;
    }
    
    if (isDrawing && currentShape && (activeTool === 'circle' || activeTool === 'rectangle')) {
      const point = getCanvasCoordinates(e.clientX, e.clientY);
      const percentPoint = canvasToPercent(point);
      
      // Проверяем, что точка достаточно далеко от начальной для стабильности
      const startPoint = currentShape.points[0];
      const distance = Math.sqrt(
        Math.pow(percentPoint.x - startPoint.x, 2) + 
        Math.pow(percentPoint.y - startPoint.y, 2)
      );
      
      // Минимальное расстояние для предотвращения нестабильности
      if (distance < 0.5) return;
      
      let newPoints: Point[];
      if (activeTool === 'circle') {
        newPoints = createCircleFromTwoPoints(startPoint, percentPoint);
      } else {
        newPoints = createRectangleFromTwoPoints(startPoint, percentPoint);
      }
      
      onCurrentShapeUpdate({
        ...currentShape,
        points: newPoints
      });
    }
  };

  const handleMouseUp = () => {
    if (isPanning) {
      setIsPanning(false);
      return;
    }
    
    if (isDrawing && (activeTool === 'circle' || activeTool === 'rectangle')) {
      // Сохраняем фигуру если у неё есть достаточно точек и правильная геометрия
      if (currentShape && currentShape.points.length >= 3) {
        // Проверяем, что фигура имеет минимальный размер
        const firstPoint = currentShape.points[0];
        const hasValidSize = currentShape.points.some(p => 
          Math.abs(p.x - firstPoint.x) > 1 || Math.abs(p.y - firstPoint.y) > 1
        );
        
        if (hasValidSize) {
          onShapeUpdate([...shapes, currentShape]);
          onCurrentShapeUpdate(null);
        }
      }
    }
    
    setIsDrawing(false);
    setDragPoint(null);
  };

  const handleRightClick = (e: React.MouseEvent) => {
    e.preventDefault();
    
    if (activeTool === 'polygon' && currentShape && currentShape.points.length > 0) {
      // Убираем последнюю точку
      const newPoints = currentShape.points.slice(0, -1);
      if (newPoints.length === 0) {
        onCurrentShapeUpdate(null);
      } else {
        onCurrentShapeUpdate({
          ...currentShape,
          points: newPoints
        });
      }
    }
  };

  const handleDoubleClick = () => {
    if (activeTool === 'polygon' && currentShape && currentShape.points.length >= 3) {
      // Завершаем полигон
      onShapeUpdate([...shapes, currentShape]);
      onCurrentShapeUpdate(null);
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey) {
      e.preventDefault();
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
      const newZoom = Math.max(0.1, Math.min(5, zoom * zoomFactor));
      
      // Зумим к позиции мыши
      const zoomRatio = newZoom / zoom;
      setPan(prev => ({
        x: mouseX - (mouseX - prev.x) * zoomRatio,
        y: mouseY - (mouseY - prev.y) * zoomRatio
      }));
      
      setZoom(newZoom);
    }
  };

  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  return (
    <div ref={containerRef} className="relative">
      <canvas
        ref={canvasRef}
        className={`border rounded-lg cursor-crosshair ${className}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onContextMenu={handleRightClick}
        onDoubleClick={handleDoubleClick}
        onWheel={handleWheel}
        style={{ width: canvasSize.width, height: canvasSize.height }}
      />
      
      {/* Индикатор масштаба */}
      <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
        {Math.round(zoom * 100)}%
      </div>
    </div>
  );
};

export default PolygonCanvas;
