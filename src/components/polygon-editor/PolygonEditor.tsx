
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { TooltipProvider } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import PolygonToolbar, { PolygonTool } from './PolygonToolbar';
import PolygonCanvas from './PolygonCanvas';
import { Shape, Point } from './GeometryShapes';

interface PolygonEditorProps {
  imageUrl: string;
  existingPolygons?: Point[];
  onSave: (points: Point[]) => void;
  onCancel: () => void;
  polygonColor?: string;
}

const PolygonEditor = ({
  imageUrl,
  existingPolygons = [],
  onSave,
  onCancel,
  polygonColor = '#3b82f6'
}: PolygonEditorProps) => {
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [currentShape, setCurrentShape] = useState<Shape | null>(null);
  const [activeTool, setActiveTool] = useState<PolygonTool>('polygon');
  const [history, setHistory] = useState<Shape[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Инициализация существующими полигонами
  useEffect(() => {
    if (existingPolygons.length > 0) {
      const existingShape: Shape = {
        id: 'existing',
        type: 'polygon',
        points: existingPolygons,
        color: polygonColor,
        isSelected: true
      };
      setShapes([existingShape]);
      addToHistory([existingShape]);
    }
  }, [existingPolygons, polygonColor]);

  const addToHistory = useCallback((newShapes: Shape[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push([...newShapes]);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex]);

  const handleShapeUpdate = useCallback((newShapes: Shape[]) => {
    setShapes(newShapes);
    addToHistory(newShapes);
  }, [addToHistory]);

  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setShapes(history[historyIndex - 1]);
    }
  };

  const handleClear = () => {
    setShapes([]);
    setCurrentShape(null);
    addToHistory([]);
    toast.success('Все полигоны очищены');
  };

  const handleSave = () => {
    // Объединяем все фигуры в один полигон или берем выбранную
    const selectedShape = shapes.find(s => s.isSelected);
    const pointsToSave = selectedShape ? selectedShape.points :
      shapes.length > 0 ? shapes[shapes.length - 1].points : [];

    if (pointsToSave.length < 3) {
      toast.error('Полигон должен содержать минимум 3 точки');
      return;
    }

    onSave(pointsToSave);
  };

  // Обработка горячих клавиш
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'z') {
        e.preventDefault();
        handleUndo();
      }

      switch (e.key.toLowerCase()) {
        case 'v':
          setActiveTool('select');
          break;
        case 'p':
          setActiveTool('polygon');
          break;
        case 'c':
          setActiveTool('circle');
          break;
        case 'r':
          setActiveTool('rectangle');
          break;
        case 'm':
          setActiveTool('move');
          break;
        case 'enter':
          if (currentShape && currentShape.points.length >= 3) {
            setShapes(prev => [...prev, currentShape]);
            setCurrentShape(null);
            addToHistory([...shapes, currentShape]);
          }
          break;
        case 'escape':
          setCurrentShape(null);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shapes, currentShape, addToHistory]);

  if (!imageUrl) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        Загрузите изображение для начала редактирования
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-4">
        <PolygonToolbar
          activeTool={activeTool}
          onToolChange={setActiveTool}
          canUndo={historyIndex > 0}
          onUndo={handleUndo}
          onClear={handleClear}
          onSave={handleSave}
          onCancel={onCancel}
          isEditing={true}
        />

        <Card>
          <CardContent className="p-4">
            <div className="space-y-4">
              <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                <strong>Управление:</strong>
                <ul className="text-xs space-y-1 mt-1">
                  <li>• <kbd className="px-1 py-0.5 bg-gray-200 rounded text-xs">Ctrl</kbd> + колесико - масштаб</li>
                  <li>• Правая кнопка - удалить последнюю точку</li>
                  <li>• Двойной клик - завершить полигон</li>
                  <li>• <kbd className="px-1 py-0.5 bg-gray-200 rounded text-xs">Enter</kbd> - завершить фигуру</li>
                  <li>• Перетаскивание точек в режиме выбора</li>
                </ul>
              </div>

              <div className="border rounded-lg overflow-hidden bg-gray-100">
                <PolygonCanvas
                  imageUrl={imageUrl}
                  shapes={shapes}
                  currentShape={currentShape}
                  activeTool={activeTool}
                  onShapeUpdate={handleShapeUpdate}
                  onCurrentShapeUpdate={setCurrentShape}
                  className="w-full"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
};

export default PolygonEditor;
