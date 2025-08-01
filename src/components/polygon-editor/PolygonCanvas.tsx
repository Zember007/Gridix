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
  onSaveCurrentShape?: () => void;
  onClearAll?: () => void;
}

const PolygonCanvas = ({
  imageUrl,
  shapes,
  currentShape,
  activeTool,
  onShapeUpdate,
  onCurrentShapeUpdate,
  className = "",
  onSaveCurrentShape,
  onClearAll
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
    
    // Рисуем существующие фигуры (только завершенные фигуры, которые не являются currentShape)
    shapes.forEach((shape, shapeIndex) => {
      if (shape.points.length === 0) return;
      
      // Если это текущая фигура, не рисуем её здесь (она будет нарисована отдельно)
      if (currentShape && shape.id === currentShape.id) return;
      
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
      
      // Рисуем точки для завершенных фигур в режиме select
      if (shape.isSelected && activeTool === 'select') {
        canvasPoints.forEach((point, index) => {
          const handleSize = 8 / zoom;
          ctx.beginPath();
          ctx.rect(point.x - handleSize/2, point.y - handleSize/2, handleSize, handleSize);
          ctx.fillStyle = '#3b82f6';
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2 / zoom;
          ctx.stroke();
          
          // Добавляем номер точки для удобности
          ctx.fillStyle = '#ffffff';
          ctx.font = `${12 / zoom}px Arial`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText((index + 1).toString(), point.x, point.y);
        });
      }
    });
    
    // Рисуем текущую фигуру
    if (currentShape && currentShape.points.length > 0) {
      const canvasPoints = currentShape.points.map(p => percentToCanvas(p));
      
      if (currentShape.type === 'polygon') {
        if (currentShape.isSelected && canvasPoints.length >= 3) {
          // Для завершенного полигона рисуем как обычную фигуру
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
          ctx.stroke();
        } else {
          // Для незавершенного полигона рисуем линии между точками
          ctx.beginPath();
          ctx.moveTo(canvasPoints[0].x, canvasPoints[0].y);
          for (let i = 1; i < canvasPoints.length; i++) {
            ctx.lineTo(canvasPoints[i].x, canvasPoints[i].y);
          }
          
          // Если есть минимум 3 точки, показываем линию к первой точке для замыкания
          if (canvasPoints.length >= 3) {
            ctx.lineTo(canvasPoints[0].x, canvasPoints[0].y);
          }
          
          ctx.strokeStyle = currentShape.color;
          ctx.lineWidth = 2 / zoom;
          ctx.setLineDash([5 / zoom, 5 / zoom]);
          ctx.stroke();
          ctx.setLineDash([]);
        }
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
      canvasPoints.forEach((point, index) => {
        if (currentShape.isSelected && activeTool === 'select') {
          // Для завершенных фигур в режиме select рисуем "грабли" (handles)
          const handleSize = 8 / zoom;
          ctx.beginPath();
          ctx.rect(point.x - handleSize/2, point.y - handleSize/2, handleSize, handleSize);
          ctx.fillStyle = '#3b82f6';
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2 / zoom;
          ctx.stroke();
          
          // Добавляем номер точки для удобности
          ctx.fillStyle = '#ffffff';
          ctx.font = `${12 / zoom}px Arial`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText((index + 1).toString(), point.x, point.y);
        } else {
          // Для незавершенных фигур или в других режимах рисуем обычные точки
          ctx.beginPath();
          ctx.arc(point.x, point.y, 4 / zoom, 0, 2 * Math.PI);
          ctx.fillStyle = '#3b82f6';
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1 / zoom;
          ctx.stroke();
        }
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
      // Проверяем клик по точке текущей завершенной фигуры
      if (currentShape && currentShape.isSelected) {
        const canvasPoints = currentShape.points.map(p => percentToCanvas(p));
        const nearestPointIndex = findNearestPoint(point, canvasPoints, 15 / zoom);
        
        if (nearestPointIndex !== null) {
          console.log('Нашли точку для перетаскивания:', nearestPointIndex);
          setDragPoint({ shapeIndex: 0, pointIndex: nearestPointIndex });
          setIsDrawing(true);
          return;
        }
        
        // Проверяем клик внутри завершенной фигуры
        if (isPointInsidePolygon(point, canvasPoints)) {
          // Остаемся на той же фигуре
          return;
        }
      }
      
      // Проверяем клик по фигурам в списке shapes
      for (let i = shapes.length - 1; i >= 0; i--) {
        const shape = shapes[i];
        const canvasPoints = shape.points.map(p => percentToCanvas(p));
        
        // Проверяем клик по точкам
        const nearestPointIndex = findNearestPoint(point, canvasPoints, 15 / zoom);
        if (nearestPointIndex !== null) {
          console.log('Нашли точку для перетаскивания в shapes:', nearestPointIndex);
          setDragPoint({ shapeIndex: i, pointIndex: nearestPointIndex });
          setIsDrawing(true);
          onCurrentShapeUpdate(shape);
          return;
        }
        
        // Проверяем клик внутри фигуры
        if (isPointInsidePolygon(point, canvasPoints)) {
          onCurrentShapeUpdate(shape);
          return;
        }
      }
      
      // Если кликнули вне всех фигур, очищаем всё
      if (onClearAll) {
        onClearAll();
      } else {
        onShapeUpdate([]);
        onCurrentShapeUpdate(null);
      }
      return;
    }
    
    if (activeTool === 'polygon') {
      const percentPoint = canvasToPercent(point);
      
      if (!currentShape) {
        // Начинаем новый полигон, удаляем ВСЕ существующие фигуры
        if (onClearAll) {
          onClearAll();
        } else {
          onShapeUpdate([]);
        }
        onCurrentShapeUpdate({
          id: Date.now().toString(),
          type: 'polygon',
          points: [percentPoint],
          color: '#3b82f6',
          isSelected: false
        });
      } else if (currentShape.isSelected) {
        // Если фигура уже завершена, клик вне её области начинает новую фигуру
        const canvasPoints = currentShape.points.map(p => percentToCanvas(p));
        
        if (!isPointInsidePolygon(point, canvasPoints)) {
          // Удаляем ВСЕ старые фигуры и начинаем новую
          if (onClearAll) {
            onClearAll();
          } else {
            onShapeUpdate([]);
          }
          onCurrentShapeUpdate({
            id: Date.now().toString(),
            type: 'polygon',
            points: [percentPoint],
            color: '#3b82f6',
            isSelected: false
          });
        }
      } else {
        // Проверяем, не кликнули ли мы на первую точку (замыкание полигона)
        const firstPoint = currentShape.points[0];
        const distance = Math.sqrt(
          Math.pow(percentPoint.x - firstPoint.x, 2) + 
          Math.pow(percentPoint.y - firstPoint.y, 2)
        );
        
        // Если кликнули близко к первой точке и у нас есть минимум 3 точки
        if (distance < 2 && currentShape.points.length >= 3) {
          // Замыкаем полигон
          const completedShape = {
            ...currentShape,
            isSelected: true
          };
          
          // Добавляем завершенную фигуру в список и делаем её текущей для редактирования
          onShapeUpdate([completedShape]);
          onCurrentShapeUpdate(completedShape);
        } else {
          // Добавляем новую точку к полигону
          onCurrentShapeUpdate({
            ...currentShape,
            points: [...currentShape.points, percentPoint]
          });
        }
      }
      return;
    }
    
    if (activeTool === 'circle' || activeTool === 'rectangle') {
      setIsDrawing(true);
      const percentPoint = canvasToPercent(point);
      
      // Очищаем все фигуры только если начинаем новую
      if (onClearAll) {
        onClearAll();
      }
      
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
      
      console.log('Перетаскивание точки:', dragPoint.pointIndex, 'в позицию:', percentPoint);
      
      // Обновляем точку в фигуре
      if (currentShape) {
        const newPoints = [...currentShape.points];
        newPoints[dragPoint.pointIndex] = percentPoint;
        
        const updatedShape = {
          ...currentShape,
          points: newPoints
        };
        
        onCurrentShapeUpdate(updatedShape);
        
        // Обновляем фигуру в списке shapes
        const newShapes = [...shapes];
        newShapes[dragPoint.shapeIndex] = updatedShape;
        onShapeUpdate(newShapes);
      }
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
          const completedShape = {
            ...currentShape,
            isSelected: true
          };
          onShapeUpdate([completedShape]);
          onCurrentShapeUpdate(completedShape);
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
        // Если точек не осталось, удаляем фигуру
        onShapeUpdate([]);
        onCurrentShapeUpdate(null);
      } else if (newPoints.length < 3) {
        // Если осталось меньше 3 точек, возвращаем в режим рисования
        onCurrentShapeUpdate({
          ...currentShape,
          points: newPoints,
          isSelected: false
        });
        
        // Удаляем из списка фигур
        onShapeUpdate([]);
      } else {
        // Обновляем фигуру
        const updatedShape = {
          ...currentShape,
          points: newPoints
        };
        
        if (currentShape.isSelected) {
          // Обновляем в списке фигур
          onShapeUpdate([updatedShape]);
        }
        
        onCurrentShapeUpdate(updatedShape);
      }
    }
  };

  const handleDoubleClick = () => {
    // Двойной клик ничего не делает, завершение только через замыкание или кнопку "Сохранить"
  };

  // Функция для завершения текущего полигона через кнопку "Сохранить"
  const completeCurrentPolygon = useCallback(() => {
    if (currentShape && !currentShape.isSelected && currentShape.points.length >= 3) {
      const completedShape = {
        ...currentShape,
        isSelected: true
      };
      
      onShapeUpdate([completedShape]);
      onCurrentShapeUpdate(completedShape);
      return true;
    }
    return false;
  }, [currentShape, onShapeUpdate, onCurrentShapeUpdate]);

  // Экспортируем функцию для использования в toolbar
  useEffect(() => {
    if (onSaveCurrentShape) {
      (window as unknown as Record<string, unknown>).completeCurrentPolygon = completeCurrentPolygon;
    }
  }, [completeCurrentPolygon, onSaveCurrentShape]);

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
        className={`border rounded-lg ${
          activeTool === 'select' && currentShape?.isSelected ? 'cursor-pointer' :
          activeTool === 'move' ? 'cursor-move' : 'cursor-crosshair'
        } ${className}`}
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
