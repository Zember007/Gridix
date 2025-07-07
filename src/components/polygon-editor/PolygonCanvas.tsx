
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
  const imageRef = useRef<HTMLImageElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [dragPoint, setDragPoint] = useState<{shapeIndex: number, pointIndex: number} | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [lastMousePos, setLastMousePos] = useState<Point>({ x: 0, y: 0 });

  const getCanvasCoordinates = useCallback((clientX: number, clientY: number): Point => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = ((clientX - rect.left - pan.x) / zoom);
    const y = ((clientY - rect.top - pan.y) / zoom);
    
    return { x, y };
  }, [zoom, pan]);

  const getImageCoordinates = useCallback((canvasPoint: Point): Point => {
    if (!imageRef.current || !canvasRef.current) return canvasPoint;
    
    const canvas = canvasRef.current;
    const image = imageRef.current;
    
    const scaleX = image.naturalWidth / canvas.width;
    const scaleY = image.naturalHeight / canvas.height;
    
    return {
      x: (canvasPoint.x * scaleX / image.naturalWidth) * 100,
      y: (canvasPoint.y * scaleY / image.naturalHeight) * 100
    };
  }, []);

  const getCanvasPointFromImage = useCallback((imagePoint: Point): Point => {
    if (!imageRef.current || !canvasRef.current) return imagePoint;
    
    const canvas = canvasRef.current;
    const image = imageRef.current;
    
    return {
      x: (imagePoint.x / 100) * image.naturalWidth * canvas.width / image.naturalWidth,
      y: (imagePoint.y / 100) * image.naturalHeight * canvas.height / image.naturalHeight
    };
  }, []);

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
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    
    // Рисуем существующие фигуры
    shapes.forEach((shape, shapeIndex) => {
      if (shape.points.length === 0) return;
      
      const canvasPoints = shape.points.map(p => getCanvasPointFromImage(p));
      
      ctx.beginPath();
      ctx.moveTo(canvasPoints[0].x, canvasPoints[0].y);
      
      for (let i = 1; i < canvasPoints.length; i++) {
        ctx.lineTo(canvasPoints[i].x, canvasPoints[i].y);
      }
      ctx.closePath();
      
      ctx.fillStyle = shape.color + '40';
      ctx.fill();
      ctx.strokeStyle = shape.color;
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Рисуем точки для выбранной фигуры
      if (shape.isSelected && activeTool === 'select') {
        canvasPoints.forEach((point, pointIndex) => {
          ctx.beginPath();
          ctx.arc(point.x, point.y, 4, 0, 2 * Math.PI);
          ctx.fillStyle = '#3b82f6';
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          ctx.stroke();
        });
      }
    });
    
    // Рисуем текущую фигуру
    if (currentShape && currentShape.points.length > 0) {
      const canvasPoints = currentShape.points.map(p => getCanvasPointFromImage(p));
      
      ctx.beginPath();
      ctx.moveTo(canvasPoints[0].x, canvasPoints[0].y);
      
      for (let i = 1; i < canvasPoints.length; i++) {
        ctx.lineTo(canvasPoints[i].x, canvasPoints[i].y);
      }
      
      if (currentShape.type !== 'polygon' || canvasPoints.length > 2) {
        ctx.closePath();
      }
      
      ctx.fillStyle = currentShape.color + '40';
      ctx.fill();
      ctx.strokeStyle = currentShape.color;
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.stroke();
      ctx.setLineDash([]);
      
      // Рисуем точки
      canvasPoints.forEach(point => {
        ctx.beginPath();
        ctx.arc(point.x, point.y, 3, 0, 2 * Math.PI);
        ctx.fillStyle = '#3b82f6';
        ctx.fill();
      });
    }
    
    ctx.restore();
  }, [shapes, currentShape, activeTool, zoom, pan, getCanvasPointFromImage]);

  const handleMouseDown = (e: React.MouseEvent) => {
    const point = getCanvasCoordinates(e.clientX, e.clientY);
    const imagePoint = getImageCoordinates(point);
    
    if (e.button === 2) return; // Правая кнопка мыши
    
    setLastMousePos({ x: e.clientX, y: e.clientY });
    
    if (activeTool === 'move' || (e.ctrlKey && activeTool !== 'polygon')) {
      setIsPanning(true);
      return;
    }
    
    if (activeTool === 'select') {
      // Проверяем, клик по точке существующей фигуры
      for (let shapeIndex = 0; shapeIndex < shapes.length; shapeIndex++) {
        const shape = shapes[shapeIndex];
        if (!shape.isSelected) continue;
        
        const canvasPoints = shape.points.map(p => getCanvasPointFromImage(p));
        const nearestPointIndex = findNearestPoint(point, canvasPoints, 8);
        
        if (nearestPointIndex !== null) {
          setDragPoint({ shapeIndex, pointIndex: nearestPointIndex });
          setIsDrawing(true);
          return;
        }
      }
      
      // Проверяем, клик внутри фигуры
      const newShapes = shapes.map(shape => ({ ...shape, isSelected: false }));
      for (let i = shapes.length - 1; i >= 0; i--) {
        const canvasPoints = shapes[i].points.map(p => getCanvasPointFromImage(p));
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
      if (!currentShape) {
        onCurrentShapeUpdate({
          id: Date.now().toString(),
          type: 'polygon',
          points: [imagePoint],
          color: '#3b82f6',
          isSelected: false
        });
      } else {
        onCurrentShapeUpdate({
          ...currentShape,
          points: [...currentShape.points, imagePoint]
        });
      }
      return;
    }
    
    if (activeTool === 'circle' || activeTool === 'rectangle') {
      setIsDrawing(true);
      onCurrentShapeUpdate({
        id: Date.now().toString(),
        type: activeTool,
        points: [imagePoint],
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
      const imagePoint = getImageCoordinates(point);
      
      const newShapes = [...shapes];
      newShapes[dragPoint.shapeIndex].points[dragPoint.pointIndex] = imagePoint;
      onShapeUpdate(newShapes);
      return;
    }
    
    if (isDrawing && currentShape && (activeTool === 'circle' || activeTool === 'rectangle')) {
      const point = getCanvasCoordinates(e.clientX, e.clientY);
      const imagePoint = getImageCoordinates(point);
      
      let newPoints: Point[];
      if (activeTool === 'circle') {
        newPoints = createCircleFromTwoPoints(currentShape.points[0], imagePoint);
      } else {
        newPoints = createRectangleFromTwoPoints(currentShape.points[0], imagePoint);
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
      if (currentShape) {
        onShapeUpdate([...shapes, currentShape]);
        onCurrentShapeUpdate(null);
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
      const deltaZoom = e.deltaY > 0 ? 0.9 : 1.1;
      setZoom(prev => Math.max(0.1, Math.min(5, prev * deltaZoom)));
    }
  };

  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  useEffect(() => {
    const image = new Image();
    image.onload = () => {
      imageRef.current = image;
      if (canvasRef.current) {
        canvasRef.current.width = image.width;
        canvasRef.current.height = image.height;
        drawCanvas();
      }
    };
    image.src = imageUrl;
  }, [imageUrl, drawCanvas]);

  return (
    <canvas
      ref={canvasRef}
      className={`border rounded-lg cursor-crosshair ${className}`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onContextMenu={handleRightClick}
      onDoubleClick={handleDoubleClick}
      onWheel={handleWheel}
      style={{ maxWidth: '100%', maxHeight: '600px' }}
    />
  );
};

export default PolygonCanvas;
