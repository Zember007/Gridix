import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, Plus, Trash2, Save, Edit3, Settings, Undo2, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import BuildingPolygonSettingsComponent from './BuildingPolygonSettings';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';

interface Point {
  x: number;
  y: number;
}

interface Floor {
  id: string;
  floor_number: number;
  polygon: Point[];
  color: string;
}

interface BuildingPolygonSettings {
  colors: {
    available: string;
    sold: string;
    reserved: string;
  };
  hoverEffects: {
    colorChange: boolean;
    opacityChange: boolean;
    glow: boolean;
  };
  display: {
    showNumbers: boolean;
  };
  opacity: {
    normal: number;
    hover: number;
  };
}

interface BuildingImageEditorProps {
  projectId: string;
  floors: number;
  onImageUpload: (imageUrl: string) => void;
}

const BuildingImageEditor = ({ projectId, floors, onImageUpload }: BuildingImageEditorProps) => {
  const [imageUrl, setImageUrl] = useState<string>('');
  const [buildingFloors, setBuildingFloors] = useState<Floor[]>([]);
  const [editingFloor, setEditingFloor] = useState<number | null>(null);
  const [currentPolygon, setCurrentPolygon] = useState<Point[]>([]);
  const [polygonHistory, setPolygonHistory] = useState<Point[][]>([]);
  const [loading, setLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [polygonSettings, setPolygonSettings] = useState<BuildingPolygonSettings | null>(null);
  const [hoveredFloor, setHoveredFloor] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    loadBuildingData();
  }, [projectId]);

  const loadBuildingData = async () => {
    try {
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('building_image_url, building_polygon_settings')
        .eq('id', projectId)
        .single();

      if (projectError) throw projectError;

      if (projectData.building_image_url) {
        setImageUrl(projectData.building_image_url);
      }

      if (projectData.building_polygon_settings) {
        setPolygonSettings(projectData.building_polygon_settings as unknown as BuildingPolygonSettings);
      }

      const { data: floorsData, error: floorsError } = await supabase
        .from('building_floors')
        .select('*')
        .eq('project_id', projectId)
        .order('floor_number');

      if (floorsError) throw floorsError;

      const transformedFloors = (floorsData || []).map(floor => ({
        id: floor.id,
        floor_number: floor.floor_number,
        polygon: Array.isArray(floor.polygon) ? floor.polygon as unknown as Point[] : [],
        color: floor.color || '#3b82f6'
      }));

      setBuildingFloors(transformedFloors);
    } catch (error) {
      console.error('Error loading building data:', error);
      toast.error('Ошибка загрузки данных здания');
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${projectId}/building.${fileExt}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('project-images')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('project-images')
        .getPublicUrl(fileName);

      const newImageUrl = urlData.publicUrl;
      setImageUrl(newImageUrl);
      onImageUpload(newImageUrl);

      await supabase
        .from('projects')
        .update({ building_image_url: newImageUrl })
        .eq('id', projectId);

      toast.success('Изображение здания загружено');
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Ошибка загрузки изображения');
    } finally {
      setLoading(false);
    }
  };

  const getImageCoordinates = (clientX: number, clientY: number): Point => {
    if (!imageRef.current || !svgRef.current) return { x: 0, y: 0 };

    const imageRect = imageRef.current.getBoundingClientRect();
    const svgRect = svgRef.current.getBoundingClientRect();

    const x = ((clientX - svgRect.left) / svgRect.width) * 100;
    const y = ((clientY - svgRect.top) / svgRect.height) * 100;

    return { x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) };
  };

  const handleSvgClick = (event: React.MouseEvent<SVGSVGElement>) => {
    if (editingFloor === null) return;

    const point = getImageCoordinates(event.clientX, event.clientY);
    const newPolygon = [...currentPolygon, point];

    // Сохраняем состояние в историю
    setPolygonHistory(prev => [...prev, currentPolygon]);
    setCurrentPolygon(newPolygon);
  };

  const undoLastPoint = () => {
    if (currentPolygon.length > 0) {
      setPolygonHistory(prev => [...prev, currentPolygon]);
      setCurrentPolygon(prev => prev.slice(0, -1));
    } else if (polygonHistory.length > 0) {
      const lastState = polygonHistory[polygonHistory.length - 1];
      setCurrentPolygon(lastState);
      setPolygonHistory(prev => prev.slice(0, -1));
    }
  };

  const clearPolygon = () => {
    if (currentPolygon.length > 0) {
      setPolygonHistory(prev => [...prev, currentPolygon]);
    }
    setCurrentPolygon([]);
  };

  const finishPolygon = async () => {
    if (editingFloor === null || currentPolygon.length < 3) {
      toast.error('Полигон должен содержать минимум 3 точки');
      return;
    }

    try {
      const existingFloor = buildingFloors.find(f => f.floor_number === editingFloor);
      const floorColor = `hsl(${(editingFloor - 1) * (360 / floors)}, 70%, 50%)`;

      if (existingFloor) {
        const { error } = await supabase
          .from('building_floors')
          .update({
            polygon: currentPolygon as unknown as any,
            color: floorColor
          })
          .eq('id', existingFloor.id);

        if (error) throw error;

        setBuildingFloors(prev => prev.map(f =>
          f.id === existingFloor.id
            ? { ...f, polygon: currentPolygon, color: floorColor }
            : f
        ));
      } else {
        const { data, error } = await supabase
          .from('building_floors')
          .insert({
            project_id: projectId,
            floor_number: editingFloor,
            polygon: currentPolygon as unknown as any,
            color: floorColor
          })
          .select()
          .single();

        if (error) throw error;

        setBuildingFloors(prev => [...prev, {
          id: data.id,
          floor_number: editingFloor,
          polygon: currentPolygon,
          color: floorColor
        }]);
      }

      setCurrentPolygon([]);
      setPolygonHistory([]);
      setEditingFloor(null);
      toast.success(`Этаж ${editingFloor} сохранен`);
    } catch (error) {
      console.error('Error saving floor:', error);
      toast.error('Ошибка сохранения этажа');
    }
  };

  const startEditingFloor = (floorNumber: number) => {
    setEditingFloor(floorNumber);
    setCurrentPolygon([]);
    setPolygonHistory([]);

    const existingFloor = buildingFloors.find(f => f.floor_number === floorNumber);
    if (existingFloor) {
      setCurrentPolygon(existingFloor.polygon);
    }
  };

  const deleteFloor = async (floorId: string) => {
    try {
      const { error } = await supabase
        .from('building_floors')
        .delete()
        .eq('id', floorId);

      if (error) throw error;

      setBuildingFloors(prev => prev.filter(f => f.id !== floorId));
      toast.success('Этаж удален');
    } catch (error) {
      console.error('Error deleting floor:', error);
      toast.error('Ошибка удаления этажа');
    }
  };

  const polygonToPath = (polygon: Point[]) => {
    if (polygon.length === 0) return '';
    return `M ${polygon.map(p => `${p.x} ${p.y}`).join(' L ')} Z`;
  };

  const getPolygonStyle = (floorNumber: number, isHovered: boolean = false) => {
    if (!polygonSettings) return {};

    const baseOpacity = polygonSettings.opacity.normal;
    const hoverOpacity = polygonSettings.opacity.hover;
    const opacity = isHovered ? hoverOpacity : baseOpacity;

    let style: React.CSSProperties = {
      fillOpacity: opacity,
      transition: 'all 0.3s ease'
    };

    if (isHovered && polygonSettings.hoverEffects.glow) {
      style.filter = 'drop-shadow(0 0 8px rgba(59, 130, 246, 0.6))';
    }

    return style;
  };

  const handleSettingsChange = (newSettings: BuildingPolygonSettings) => {
    setPolygonSettings(newSettings);
  };

  if (showSettings) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Настройки полигонов здания</h3>
          <Button
            variant="outline"
            onClick={() => setShowSettings(false)}
          >
            Назад к редактору
          </Button>
        </div>
        <BuildingPolygonSettingsComponent
          projectId={projectId}
          onSettingsChange={handleSettingsChange}
        />
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="lg:col-span-3 space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Изображение здания</h3>
          <Button
            variant="outline"
            onClick={() => setShowSettings(true)}
          >
            <Settings className="h-4 w-4 mr-2" />
            Настройки
          </Button>
        </div>

        {/* Image Upload */}
        <Card>
          <CardHeader>
            <CardTitle className="text-md">Загрузка изображения</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="building-image">Изображение здания</Label>
                <Input
                  id="building-image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={loading}
                />
              </div>
              {loading && <p className="text-sm text-gray-600">Загрузка...</p>}
            </div>
          </CardContent>
        </Card>

        {/* Floor Controls */}
        <Card>
          <CardHeader>
            <CardTitle className="text-md">Управление этажами</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-2">
                {Array.from({ length: floors }, (_, i) => i + 1).map(floorNum => {
                  const existingFloor = buildingFloors.find(f => f.floor_number === floorNum);
                  const isEditing = editingFloor === floorNum;

                  return (
                    <div key={floorNum} className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant={isEditing ? "default" : existingFloor ? "secondary" : "outline"}
                        onClick={() => startEditingFloor(floorNum)}
                        className="flex-1"
                      >
                        <Edit3 className="h-3 w-3 mr-1" />
                        Этаж {floorNum}
                      </Button>
                      {existingFloor && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteFloor(existingFloor.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>

              {editingFloor && (
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm font-medium text-blue-900 mb-2">
                    Редактирование этажа {editingFloor}
                  </p>
                  <p className="text-sm text-blue-700 mb-3">
                    Кликайте на изображение, чтобы создать полигон этажа.
                    Текущих точек: {currentPolygon.length}
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    <Button size="sm" onClick={finishPolygon} disabled={currentPolygon.length < 3}>
                      <Save className="h-3 w-3 mr-1" />
                      Сохранить полигон
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingFloor(null);
                        setCurrentPolygon([]);
                        setPolygonHistory([]);
                      }}
                    >
                      Отмена
                    </Button>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={undoLastPoint}
                          disabled={currentPolygon.length === 0 && polygonHistory.length === 0}
                        >
                          <Undo2 className="h-3 w-3" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Отменить последнюю точку</p>
                      </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={clearPolygon}
                        >
                          <RotateCcw className="h-3 w-3" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Очистить полигон</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Image Editor */}
        {imageUrl && (
          <Card>
            <CardContent className="p-6">
              <div className="relative inline-block max-w-full">
                <img
                  ref={imageRef}
                  src={imageUrl}
                  alt="Building"
                  className="max-w-full max-h-[600px] object-contain rounded-lg"
                />
                <svg
                  ref={svgRef}
                  className="absolute top-0 left-0 w-full h-full cursor-crosshair"
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                  onClick={handleSvgClick}
                >
                  {/* Existing floor polygons */}
                  {buildingFloors.map(floor => {
                    const path = polygonToPath(floor.polygon);
                    if (!path) return null;

                    const isHovered = hoveredFloor === floor.id;

                    return (
                      <g key={floor.id}>
                        <HoverCard>
                          <HoverCardTrigger asChild>
                            <path
                              d={path}
                              fill={floor.color}
                              stroke={floor.color}
                              strokeWidth="0.5"
                              style={getPolygonStyle(floor.floor_number, isHovered)}
                              className="hover:fill-opacity-60 transition-all cursor-pointer"
                              onMouseEnter={() => setHoveredFloor(floor.id)}
                              onMouseLeave={() => setHoveredFloor(null)}
                            />
                          </HoverCardTrigger>
                          <HoverCardContent className="w-48">
                            <div className="space-y-2">
                              <h4 className="font-semibold">Этаж {floor.floor_number}</h4>
                              <p className="text-sm text-gray-600">
                                Цвет: {floor.color}
                              </p>
                              <p className="text-sm text-gray-600">
                                Точек полигона: {floor.polygon.length}
                              </p>
                            </div>
                          </HoverCardContent>
                        </HoverCard>
                        {polygonSettings?.display.showNumbers && (
                          <text
                            x={floor.polygon.reduce((sum, p) => sum + p.x, 0) / floor.polygon.length}
                            y={floor.polygon.reduce((sum, p) => sum + p.y, 0) / floor.polygon.length}
                            textAnchor="middle"
                            dominantBaseline="central"
                            fill="white"
                            fontSize="3"
                            fontWeight="bold"
                            className="pointer-events-none"
                          >
                            {floor.floor_number}
                          </text>
                        )}
                      </g>
                    );
                  })}

                  {/* Current polygon being drawn */}
                  {currentPolygon.length > 0 && (
                    <>
                      {currentPolygon.length > 2 && (
                        <path
                          d={polygonToPath(currentPolygon)}
                          fill="rgba(59, 130, 246, 0.3)"
                          stroke="#3b82f6"
                          strokeWidth="0.5"
                          strokeDasharray="2,2"
                        />
                      )}
                      {currentPolygon.map((point, index) => (
                        <circle
                          key={index}
                          cx={point.x}
                          cy={point.y}
                          r="0.5"
                          fill="#3b82f6"
                          stroke="white"
                          strokeWidth="0.2"
                        />
                      ))}
                    </>
                  )}
                </svg>
              </div>
            </CardContent>
          </Card>
        )}
      </div>


    </TooltipProvider>
  );
};

export default BuildingImageEditor;
