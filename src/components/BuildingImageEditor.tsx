
import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Upload, Trash2, Edit, Eye, Square, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface BuildingImageEditorProps {
  projectId: string;
  floors: number;
  onImageUpload: (imageUrl: string) => void;
}

interface Floor {
  id: number;
  name: string;
  polygon: { x: number; y: number }[];
  color: string;
}

const BuildingImageEditor = ({ projectId, floors, onImageUpload }: BuildingImageEditorProps) => {
  const [buildingImage, setBuildingImage] = useState<string | null>(null);
  const [floorPolygons, setFloorPolygons] = useState<Floor[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentFloor, setCurrentFloor] = useState<number | null>(null);
  const [currentPolygon, setCurrentPolygon] = useState<{ x: number; y: number }[]>([]);
  const [selectedFloor, setSelectedFloor] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [lastPanPoint, setLastPanPoint] = useState({ x: 0, y: 0 });
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const floorColors = [
    '#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6',
    '#06b6d4', '#f97316', '#84cc16', '#ec4899', '#6366f1'
  ];

  // Загружаем существующие данные при монтировании компонента
  useEffect(() => {
    loadProjectData();
  }, [projectId]);

  const loadProjectData = async () => {
    try {
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('building_image_url')
        .eq('id', projectId)
        .single();

      if (projectError) throw projectError;

      if (project.building_image_url) {
        setBuildingImage(project.building_image_url);
      }

      const { data: buildingFloors, error: floorsError } = await supabase
        .from('building_floors')
        .select('*')
        .eq('project_id', projectId)
        .order('floor_number');

      if (floorsError) throw floorsError;

      if (buildingFloors) {
        const floors = buildingFloors.map(floor => ({
          id: floor.floor_number,
          name: `${floor.floor_number}-й этаж`,
          polygon: Array.isArray(floor.polygon) ? floor.polygon as { x: number; y: number }[] : [],
          color: floor.color
        }));
        setFloorPolygons(floors);
      }
    } catch (error) {
      console.error('Error loading project data:', error);
      toast.error('Ошибка загрузки данных проекта');
    }
  };

  const handleImageUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const imageUrl = e.target?.result as string;
        setBuildingImage(imageUrl);
        onImageUpload(imageUrl);
        setFloorPolygons([]);
        
        try {
          const { error } = await supabase
            .from('projects')
            .update({ building_image_url: imageUrl })
            .eq('id', projectId);

          if (error) throw error;
          toast.success('Изображение здания загружено и сохранено');
        } catch (error) {
          console.error('Error saving building image:', error);
          toast.error('Ошибка сохранения изображения');
        }
      };
      reader.readAsDataURL(file);
    }
  }, [onImageUpload, projectId]);

  const startDrawingFloor = (floorNumber: number) => {
    setCurrentFloor(floorNumber);
    setCurrentPolygon([]);
    setIsDrawing(true);
    setSelectedFloor(null);
    toast.info(`Выделите ${floorNumber}-й этаж на изображении. Левый клик - добавить точку, правый - удалить последнюю`);
  };

  const handleSVGClick = useCallback((event: React.MouseEvent<SVGSVGElement>) => {
    if (!isDrawing || currentFloor === null) return;

    const svg = svgRef.current;
    const image = imageRef.current;
    if (!svg || !image) return;

    // Получаем границы SVG элемента
    const svgRect = svg.getBoundingClientRect();
    
    // Вычисляем координаты клика относительно SVG
    const clickX = event.clientX - svgRect.left;
    const clickY = event.clientY - svgRect.top;
    
    // Переводим в проценты относительно размера SVG (учитывая масштаб)
    const x = (clickX / zoom - panOffset.x) / (svgRect.width / zoom) * 100;
    const y = (clickY / zoom - panOffset.y) / (svgRect.height / zoom) * 100;

    if (event.button === 0) {
      // Левый клик - добавляем точку
      event.preventDefault();
      setCurrentPolygon(prev => [...prev, { x, y }]);
    }
  }, [isDrawing, currentFloor, zoom, panOffset]);

  const handleSVGContextMenu = useCallback((event: React.MouseEvent<SVGSVGElement>) => {
    if (!isDrawing || currentFloor === null) return;
    
    event.preventDefault();
    // Правый клик - удаляем последнюю точку
    if (currentPolygon.length > 0) {
      setCurrentPolygon(prev => prev.slice(0, -1));
      toast.info(`Удалена точка. Осталось ${currentPolygon.length - 1} точек`);
    }
  }, [isDrawing, currentFloor, currentPolygon.length]);

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev * 1.5, 5));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev / 1.5, 0.5));
  };

  const resetZoom = () => {
    setZoom(1);
    setPanOffset({ x: 0, y: 0 });
  };

  const handleMouseDown = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    if (event.button === 1 || (event.button === 0 && event.ctrlKey)) {
      event.preventDefault();
      setIsPanning(true);
      setLastPanPoint({ x: event.clientX, y: event.clientY });
    }
  }, []);

  const handleMouseMove = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    if (isPanning) {
      const deltaX = event.clientX - lastPanPoint.x;
      const deltaY = event.clientY - lastPanPoint.y;
      
      setPanOffset(prev => ({
        x: prev.x + deltaX,
        y: prev.y + deltaY
      }));
      
      setLastPanPoint({ x: event.clientX, y: event.clientY });
    }
  }, [isPanning, lastPanPoint]);

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  const finishDrawing = async () => {
    if (currentPolygon.length < 3 || currentFloor === null) {
      toast.error('Необходимо выбрать минимум 3 точки');
      return;
    }

    setSaving(true);
    
    try {
      const newFloor: Floor = {
        id: currentFloor,
        name: `${currentFloor}-й этаж`,
        polygon: currentPolygon,
        color: floorColors[(currentFloor - 1) % floorColors.length]
      };

      await supabase
        .from('building_floors')
        .delete()
        .eq('project_id', projectId)
        .eq('floor_number', currentFloor);

      const { error } = await supabase
        .from('building_floors')
        .insert({
          project_id: projectId,
          floor_number: currentFloor,
          polygon: currentPolygon,
          color: newFloor.color
        });

      if (error) throw error;

      setFloorPolygons(prev => {
        const filtered = prev.filter(f => f.id !== currentFloor);
        return [...filtered, newFloor];
      });

      setIsDrawing(false);
      setCurrentFloor(null);
      setCurrentPolygon([]);
      toast.success(`${currentFloor}-й этаж выделен и сохранен`);
    } catch (error) {
      console.error('Error saving floor:', error);
      toast.error('Ошибка сохранения этажа');
    } finally {
      setSaving(false);
    }
  };

  const cancelDrawing = () => {
    setIsDrawing(false);
    setCurrentFloor(null);
    setCurrentPolygon([]);
    toast.info('Выделение отменено');
  };

  const deleteFloor = async (floorId: number) => {
    try {
      const { error } = await supabase
        .from('building_floors')
        .delete()
        .eq('project_id', projectId)
        .eq('floor_number', floorId);

      if (error) throw error;

      setFloorPolygons(prev => prev.filter(f => f.id !== floorId));
      toast.success('Этаж удален');
    } catch (error) {
      console.error('Error deleting floor:', error);
      toast.error('Ошибка удаления этажа');
    }
  };

  const selectFloor = (floorId: number) => {
    setSelectedFloor(selectedFloor === floorId ? null : floorId);
  };

  const polygonToPath = (polygon: { x: number; y: number }[]) => {
    if (polygon.length === 0) return '';
    return `M ${polygon.map(p => `${p.x} ${p.y}`).join(' L ')} Z`;
  };

  return (
    <div className="space-y-6">
      {/* Image Upload */}
      <div className="flex items-center gap-4">
        <Button
          onClick={() => fileInputRef.current?.click()}
          variant="outline"
          className="border-real-estate-300 text-real-estate-600 hover:bg-real-estate-50"
        >
          <Upload className="h-4 w-4 mr-2" />
          Загрузить изображение
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
        />
        {buildingImage && (
          <span className="text-sm text-real-estate-600">
            Изображение загружено
          </span>
        )}
      </div>

      {/* Floor Selection */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-lg font-semibold text-real-estate-900 mb-4">
            Выделение этажей
          </h3>
          <div className="flex flex-wrap gap-2 mb-4">
            {Array.from({ length: floors }, (_, i) => i + 1).map(floorNum => {
              const existingFloor = floorPolygons.find(f => f.id === floorNum);
              return (
                <Button
                  key={floorNum}
                  size="sm"
                  variant={currentFloor === floorNum ? "default" : existingFloor ? "secondary" : "outline"}
                  onClick={() => startDrawingFloor(floorNum)}
                  disabled={isDrawing && currentFloor !== floorNum}
                  className={`relative ${
                    existingFloor 
                      ? 'bg-success-100 text-success-800 hover:bg-success-200' 
                      : currentFloor === floorNum 
                        ? 'bg-real-estate-600 hover:bg-real-estate-700'
                        : 'border-real-estate-300 text-real-estate-600 hover:bg-real-estate-50'
                  }`}
                >
                  <Square className="h-3 w-3 mr-1" />
                  {floorNum} этаж
                  {existingFloor && (
                    <Badge className="ml-2 bg-success-500 text-white h-4 px-1 text-xs">
                      ✓
                    </Badge>
                  )}
                </Button>
              );
            })}
          </div>

          {isDrawing && (
            <div className="flex items-center gap-2 p-3 bg-real-estate-50 rounded-lg">
              <div className="text-sm text-real-estate-700">
                Кликайте по изображению для выделения {currentFloor}-го этажа. Точек: {currentPolygon.length}
              </div>
              <div className="flex gap-2 ml-auto">
                <Button size="sm" onClick={finishDrawing} disabled={saving || currentPolygon.length < 3}>
                  {saving ? 'Сохранение...' : 'Завершить'}
                </Button>
                <Button size="sm" variant="outline" onClick={cancelDrawing}>
                  Отмена
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Image Editor */}
      {buildingImage && (
        <Card>
          <CardContent className="pt-6">
            {/* Zoom Controls */}
            <div className="flex items-center gap-2 mb-4">
              <Button size="sm" variant="outline" onClick={handleZoomIn}>
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="outline" onClick={handleZoomOut}>
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="outline" onClick={resetZoom}>
                <RotateCcw className="h-4 w-4 mr-1" />
                Сброс
              </Button>
              <span className="text-sm text-real-estate-600 ml-2">
                Масштаб: {Math.round(zoom * 100)}%
              </span>
              <span className="text-xs text-real-estate-500 ml-4">
                Ctrl + клик для панорамирования
              </span>
            </div>

            <div 
              ref={containerRef}
              className="relative inline-block overflow-hidden rounded-lg shadow-lg border"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              style={{ cursor: isPanning ? 'grabbing' : 'grab' }}
            >
              <img
                ref={imageRef}
                src={buildingImage}
                alt="Building"
                className="block"
                style={{
                  transform: `scale(${zoom}) translate(${panOffset.x}px, ${panOffset.y}px)`,
                  transformOrigin: '0 0',
                  maxWidth: '100%',
                  maxHeight: '600px',
                  objectFit: 'contain'
                }}
              />
              <svg
                ref={svgRef}
                className="absolute top-0 left-0 w-full h-full"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                onClick={handleSVGClick}
                onContextMenu={handleSVGContextMenu}
                style={{
                  cursor: isDrawing ? 'crosshair' : 'default',
                  transform: `scale(${zoom}) translate(${panOffset.x}px, ${panOffset.y}px)`,
                  transformOrigin: '0 0'
                }}
              >
                {/* Existing floor polygons */}
                {floorPolygons.map(floor => (
                  <g key={floor.id}>
                    <path
                      d={polygonToPath(floor.polygon)}
                      fill={floor.color}
                      fillOpacity={selectedFloor === floor.id ? 0.6 : 0.3}
                      stroke={floor.color}
                      strokeWidth="0.2"
                      className="cursor-pointer hover:fill-opacity-50 transition-all"
                      onClick={(e) => {
                        e.stopPropagation();
                        selectFloor(floor.id);
                      }}
                    />
                    {floor.polygon.length > 0 && (
                      <text
                        x={floor.polygon.reduce((sum, p) => sum + p.x, 0) / floor.polygon.length}
                        y={floor.polygon.reduce((sum, p) => sum + p.y, 0) / floor.polygon.length}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fill="white"
                        fontSize="2"
                        fontWeight="bold"
                        className="pointer-events-none"
                      >
                        {floor.id}
                      </text>
                    )}
                  </g>
                ))}

                {/* Current drawing polygon */}
                {currentPolygon.length > 0 && (
                  <>
                    <path
                      d={polygonToPath(currentPolygon)}
                      fill={floorColors[((currentFloor || 1) - 1) % floorColors.length]}
                      fillOpacity="0.4"
                      stroke={floorColors[((currentFloor || 1) - 1) % floorColors.length]}
                      strokeWidth="0.2"
                      strokeDasharray="1,1"
                    />
                    {currentPolygon.map((point, index) => (
                      <circle
                        key={index}
                        cx={point.x}
                        cy={point.y}
                        r="0.5"
                        fill={floorColors[((currentFloor || 1) - 1) % floorColors.length]}
                        stroke="white"
                        strokeWidth="0.1"
                      />
                    ))}
                  </>
                )}
              </svg>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Floor List */}
      {floorPolygons.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg font-semibold text-real-estate-900 mb-4">
              Выделенные этажи
            </h3>
            <div className="space-y-2">
              {floorPolygons
                .sort((a, b) => a.id - b.id)
                .map(floor => (
                  <div
                    key={floor.id}
                    className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                      selectedFloor === floor.id
                        ? 'border-real-estate-400 bg-real-estate-50'
                        : 'border-real-estate-200 hover:border-real-estate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: floor.color }}
                      />
                      <span className="font-medium text-real-estate-900">
                        {floor.name}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {floor.polygon.length} точек
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => selectFloor(floor.id)}
                        className="text-real-estate-600 hover:bg-real-estate-50"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => startDrawingFloor(floor.id)}
                        className="text-real-estate-600 hover:bg-real-estate-50"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteFloor(floor.id)}
                        className="text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BuildingImageEditor;
