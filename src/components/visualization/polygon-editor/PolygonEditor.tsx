
import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent } from '@/shared/ui/card';
import { TooltipProvider } from '@/shared/ui/tooltip';
import { toast } from 'sonner';
import PolygonAnnotator, { PolygonAnnotatorRef } from './PolygonAnnotator';

import { Shape, Point } from './GeometryShapes';
import { Button } from '@/shared/ui/button';
import { Save } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

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
  polygonColor = '#3b82f6',
}: PolygonEditorProps) => {
  const { t } = useLanguage();
  const annotatorRef = useRef<PolygonAnnotatorRef>(null);
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [currentShape, setCurrentShape] = useState<Shape | null>(null);
  const [history, setHistory] = useState<Shape[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const addToHistory = useCallback((newShapes: Shape[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push([...newShapes]);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex]);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existingPolygons, polygonColor]);

  const handleShapeUpdate = useCallback((newShapes: Shape[]) => {
    setShapes(newShapes);
    addToHistory(newShapes);
  }, [addToHistory]);

  const handleCurrentShapeUpdate = useCallback((shape: Shape | null) => {
    setCurrentShape(shape);
    // Если shape завершен (isSelected = true), добавляем его в shapes
    if (shape && shape.isSelected && shape.points.length >= 3) {
      setShapes([shape]);
      addToHistory([shape]);
    }
  }, [addToHistory]);

  // Функция для полной очистки всех данных
  const clearAllData = useCallback(() => {
    setShapes([]);
    setCurrentShape(null);
    setHistory([]);
    setHistoryIndex(-1);
  }, []);

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setShapes(history[historyIndex - 1]);
    }
  }, [historyIndex, history]);

  const handleClear = () => {
    clearAllData();
    toast.success('Все полигоны очищены');
  };

  const handleSave = async () => {
    try {
      // Получаем актуальные данные из PolygonAnnotator
      let shapeToSave: Shape | null = null;

      if (annotatorRef.current && currentShape) {
        // Получаем актуальную версию currentShape с обновленными координатами
        shapeToSave = await annotatorRef.current.getCurrentShape();
      } else if (currentShape) {
        shapeToSave = currentShape;
      } else if (shapes.length > 0) {
        // Если нет currentShape, берем первый shape из списка
        shapeToSave = shapes[0];
      }

      if (!shapeToSave || shapeToSave.points.length < 3) {
        toast.error('Полигон должен содержать минимум 3 точки');
        return;
      }

      // Сохраняем актуальные координаты
      onSave(shapeToSave.points);
      toast.success('Полигон успешно сохранен');
    } catch (error) {
      console.error('Error saving polygon:', error);
      toast.error('Ошибка при сохранении полигона');
    }
  };

  // Обработка горячих клавиш
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'z') {
        e.preventDefault();
        handleUndo();
      }

      switch (e.key.toLowerCase()) {
        case 'p':
          // При переключении на полигон очищаем все фигуры
          clearAllData();
          break;
        case 'enter':
          e.preventDefault();
          if (currentShape && currentShape.points.length >= 3) {
            // Завершаем полигон - помечаем как isSelected
            const completedShape = {
              ...currentShape,
              isSelected: true
            };
            setShapes([completedShape]);
            setCurrentShape(completedShape);
            addToHistory([completedShape]);
            toast.success('Полигон завершен. Нажмите "Сохранить" для применения изменений');
          }
          break;
        case 'escape':
          setCurrentShape(null);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shapes, currentShape, addToHistory, handleUndo, clearAllData]);

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
     

        <div className="flex items-center gap-2">
          <Button
            variant="default"
            size="sm"
            onClick={() => {handleSave()}}
            disabled={!currentShape && shapes.length === 0}
          >
            <Save className="h-4 w-4 mr-1" />
            {t('apartmentsManager.save')}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onCancel}
          >
            {t('apartmentsManager.cancel')}
          </Button>

          {currentShape && currentShape.points.length >= 3 && (
            <div className="ml-2 text-sm text-muted-foreground">
              Точек: {currentShape.points.length} | Нажмите Enter для завершения
            </div>
          )}
        </div>

        <Card>
          <CardContent className="p-4">
            <div className="space-y-4">


              <div className="border rounded-lg overflow-hidden bg-gray-100">
                <PolygonAnnotator
                  ref={annotatorRef}
                  imageUrl={imageUrl}
                  shapes={shapes}
                  currentShape={currentShape}
                  onCurrentShapeUpdate={handleCurrentShapeUpdate}
                  drawingEnabled={true}
                />
                {/* <PolygonCanvas
                  imageUrl={imageUrl}
                  shapes={shapes}
                  currentShape={currentShape}
                  activeTool={activeTool}
                  onShapeUpdate={handleShapeUpdate}
                  onCurrentShapeUpdate={handleCurrentShapeUpdate}
                  onClearAll={clearAllData}
                  className="w-full"
                /> */}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
};

export default PolygonEditor;
