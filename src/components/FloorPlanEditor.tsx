
import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, Save, Trash2, Edit3, Settings } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import PolygonCustomizationSettings from './PolygonCustomizationSettings';

interface Point {
  x: number;
  y: number;
}

interface FloorPlan {
  id: string;
  floor_number: number;
  image_url: string | null;
}

interface Apartment {
  id: string;
  apartment_number: string;
  rooms: number;
  area: number;
  price: number;
  status: 'available' | 'sold' | 'reserved';
  polygon: Point[];
}

interface PolygonSettings {
  colors: {
    available: string;
    sold: string;
    reserved: string;
  };
  hoverEffects: {
    scale: boolean;
    colorChange: boolean;
    opacityChange: boolean;
    glow: boolean;
  };
  display: {
    showNumbers: boolean;
    showTooltip: boolean;
    showArea: boolean;
    showPrice: boolean;
  };
  opacity: {
    normal: number;
    hover: number;
  };
}

interface FloorPlanEditorProps {
  projectId: string;
  floors: number;
}

const FloorPlanEditor = ({ projectId, floors }: FloorPlanEditorProps) => {
  const [floorPlans, setFloorPlans] = useState<FloorPlan[]>([]);
  const [selectedFloor, setSelectedFloor] = useState<number>(1);
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [editingApartment, setEditingApartment] = useState<string | null>(null);
  const [currentPolygon, setCurrentPolygon] = useState<Point[]>([]);
  const [apartmentData, setApartmentData] = useState<{
    number: string;
    rooms: number;
    area: number;
    price: number;
    status: 'available' | 'sold' | 'reserved';
  }>({
    number: '',
    rooms: 1,
    area: 0,
    price: 0,
    status: 'available'
  });
  const [loading, setLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [polygonSettings, setPolygonSettings] = useState<PolygonSettings | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    loadFloorPlans();
  }, [projectId, floors]);

  useEffect(() => {
    if (selectedFloor) {
      loadApartments();
      loadPolygonSettings();
    }
  }, [selectedFloor]);

  const loadFloorPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('floor_plans')
        .select('*')
        .eq('project_id', projectId)
        .order('floor_number');

      if (error) throw error;

      setFloorPlans(data || []);
    } catch (error) {
      console.error('Error loading floor plans:', error);
    }
  };

  const loadApartments = async () => {
    try {
      const { data, error } = await supabase
        .from('apartments')
        .select('*')
        .eq('project_id', projectId)
        .eq('floor_number', selectedFloor)
        .order('apartment_number');

      if (error) throw error;

      const transformedApartments = (data || []).map(apt => ({
        id: apt.id,
        apartment_number: apt.apartment_number,
        rooms: apt.rooms,
        area: Number(apt.area),
        price: Number(apt.price) || 0,
        status: apt.status as 'available' | 'sold' | 'reserved',
        polygon: Array.isArray(apt.polygon) ? apt.polygon as unknown as Point[] : []
      }));

      setApartments(transformedApartments);
    } catch (error) {
      console.error('Error loading apartments:', error);
    }
  };

  const loadPolygonSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('floor_plans')
        .select('polygon_settings')
        .eq('project_id', projectId)
        .eq('floor_number', selectedFloor)
        .maybeSingle();

      if (error) throw error;

      if (data?.polygon_settings) {
        setPolygonSettings(data.polygon_settings as unknown as PolygonSettings);
      }
    } catch (error) {
      console.error('Error loading polygon settings:', error);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${projectId}/floor-${selectedFloor}.${fileExt}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('project-images')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('project-images')
        .getPublicUrl(fileName);

      const imageUrl = urlData.publicUrl;

      // Update or create floor plan
      const { data, error } = await supabase
        .from('floor_plans')
        .upsert({
          project_id: projectId,
          floor_number: selectedFloor,
          image_url: imageUrl
        })
        .select()
        .single();

      if (error) throw error;

      setFloorPlans(prev => {
        const existing = prev.find(p => p.floor_number === selectedFloor);
        if (existing) {
          return prev.map(p => p.floor_number === selectedFloor ? data : p);
        } else {
          return [...prev, data];
        }
      });

      toast.success(`План этажа ${selectedFloor} загружен`);
    } catch (error) {
      console.error('Error uploading floor plan:', error);
      toast.error('Ошибка загрузки плана этажа');
    } finally {
      setLoading(false);
    }
  };

  const getImageCoordinates = (clientX: number, clientY: number): Point => {
    if (!imageRef.current || !svgRef.current) return { x: 0, y: 0 };

    const svgRect = svgRef.current.getBoundingClientRect();
    const x = ((clientX - svgRect.left) / svgRect.width) * 100;
    const y = ((clientY - svgRect.top) / svgRect.height) * 100;

    return { x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) };
  };

  const handleSvgClick = (event: React.MouseEvent<SVGSVGElement>) => {
    if (!editingApartment) return;

    const point = getImageCoordinates(event.clientX, event.clientY);
    setCurrentPolygon(prev => [...prev, point]);
  };

  const startEditingApartment = () => {
    if (!apartmentData.number.trim()) {
      toast.error('Введите номер квартиры');
      return;
    }

    setEditingApartment(apartmentData.number);
    setCurrentPolygon([]);
  };

  const finishApartment = async () => {
    if (!editingApartment || currentPolygon.length < 3) {
      toast.error('Полигон должен содержать минимум 3 точки');
      return;
    }

    try {
      const existingApartment = apartments.find(a => a.apartment_number === editingApartment);

      if (existingApartment) {
        // Update existing apartment
        const { error } = await supabase
          .from('apartments')
          .update({
            rooms: apartmentData.rooms,
            area: apartmentData.area,
            price: apartmentData.price,
            status: apartmentData.status,
            polygon: currentPolygon as unknown as any
          })
          .eq('id', existingApartment.id);

        if (error) throw error;

        setApartments(prev => prev.map(a => 
          a.id === existingApartment.id 
            ? { ...a, ...apartmentData, polygon: currentPolygon }
            : a
        ));
      } else {
        // Create new apartment
        const { data, error } = await supabase
          .from('apartments')
          .insert({
            project_id: projectId,
            floor_number: selectedFloor,
            apartment_number: apartmentData.number,
            rooms: apartmentData.rooms,
            area: apartmentData.area,
            price: apartmentData.price,
            status: apartmentData.status,
            polygon: currentPolygon as unknown as any
          })
          .select()
          .single();

        if (error) throw error;

        setApartments(prev => [...prev, {
          id: data.id,
          apartment_number: apartmentData.number,
          rooms: apartmentData.rooms,
          area: apartmentData.area,
          price: apartmentData.price,
          status: apartmentData.status,
          polygon: currentPolygon
        }]);
      }

      setCurrentPolygon([]);
      setEditingApartment(null);
      setApartmentData({ number: '', rooms: 1, area: 0, price: 0, status: 'available' });
      toast.success(`Квартира ${editingApartment} сохранена`);
    } catch (error) {
      console.error('Error saving apartment:', error);
      toast.error('Ошибка сохранения квартиры');
    }
  };

  const deleteApartment = async (apartmentId: string) => {
    try {
      const { error } = await supabase
        .from('apartments')
        .delete()
        .eq('id', apartmentId);

      if (error) throw error;

      setApartments(prev => prev.filter(a => a.id !== apartmentId));
      toast.success('Квартира удалена');
    } catch (error) {
      console.error('Error deleting apartment:', error);
      toast.error('Ошибка удаления квартиры');
    }
  };

  const editExistingApartment = (apartment: Apartment) => {
    setApartmentData({
      number: apartment.apartment_number,
      rooms: apartment.rooms,
      area: apartment.area,
      price: apartment.price,
      status: apartment.status
    });
    setCurrentPolygon(apartment.polygon);
    setEditingApartment(apartment.apartment_number);
  };

  const polygonToPath = (polygon: Point[]) => {
    if (polygon.length === 0) return '';
    return `M ${polygon.map(p => `${p.x} ${p.y}`).join(' L ')} Z`;
  };

  const getStatusColor = (status: string) => {
    if (!polygonSettings) {
      switch (status) {
        case 'available': return '#22c55e';
        case 'sold': return '#ef4444';
        case 'reserved': return '#f59e0b';
        default: return '#22c55e';
      }
    }

    switch (status) {
      case 'available': return polygonSettings.colors.available;
      case 'sold': return polygonSettings.colors.sold;
      case 'reserved': return polygonSettings.colors.reserved;
      default: return polygonSettings.colors.available;
    }
  };

  const getPolygonStyle = (status: string, isHovered: boolean = false) => {
    if (!polygonSettings) return {};

    const baseOpacity = polygonSettings.opacity.normal;
    const hoverOpacity = polygonSettings.opacity.hover;
    const opacity = isHovered ? hoverOpacity : baseOpacity;

    let style: React.CSSProperties = {
      fillOpacity: opacity,
      transition: 'all 0.3s ease'
    };

    if (isHovered) {
      if (polygonSettings.hoverEffects.glow) {
        style.filter = `drop-shadow(0 0 8px ${getStatusColor(status)}66)`;
      }
    }

    return style;
  };

  const handleSettingsChange = (newSettings: PolygonSettings) => {
    setPolygonSettings(newSettings);
  };

  const currentFloorPlan = floorPlans.find(p => p.floor_number === selectedFloor);

  if (showSettings) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Настройки полигонов этажа {selectedFloor}</h3>
          <Button
            variant="outline"
            onClick={() => setShowSettings(false)}
          >
            Назад к редактору
          </Button>
        </div>
        <PolygonCustomizationSettings
          projectId={projectId}
          type="floor"
          floorNumber={selectedFloor}
          onSettingsChange={handleSettingsChange}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Планы этажей</h3>
        <Button
          variant="outline"
          onClick={() => setShowSettings(true)}
        >
          <Settings className="h-4 w-4 mr-2" />
          Настройки
        </Button>
      </div>

      {/* Floor Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-md">Выбор этажа</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 gap-2">
            {Array.from({ length: floors }, (_, i) => i + 1).map(floorNum => (
              <Button
                key={floorNum}
                size="sm"
                variant={selectedFloor === floorNum ? "default" : "outline"}
                onClick={() => setSelectedFloor(floorNum)}
              >
                Этаж {floorNum}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="upload" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upload">Загрузка плана</TabsTrigger>
          <TabsTrigger value="apartments">Квартиры</TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-md">Загрузка плана этажа {selectedFloor}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor={`floor-plan-${selectedFloor}`}>План этажа</Label>
                  <Input
                    id={`floor-plan-${selectedFloor}`}
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
        </TabsContent>

        <TabsContent value="apartments" className="space-y-6">
          {/* Apartment Form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-md">Добавить/редактировать квартиру</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <Label>Номер квартиры</Label>
                  <Input
                    value={apartmentData.number}
                    onChange={(e) => setApartmentData(prev => ({ ...prev, number: e.target.value }))}
                    placeholder="1, 2, 3..."
                  />
                </div>
                <div>
                  <Label>Комнат</Label>
                  <Input
                    type="number"
                    value={apartmentData.rooms}
                    onChange={(e) => setApartmentData(prev => ({ ...prev, rooms: parseInt(e.target.value) || 1 }))}
                    min="1"
                  />
                </div>
                <div>
                  <Label>Площадь (м²)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={apartmentData.area}
                    onChange={(e) => setApartmentData(prev => ({ ...prev, area: parseFloat(e.target.value) || 0 }))}
                    min="0"
                  />
                </div>
                <div>
                  <Label>Цена (руб)</Label>
                  <Input
                    type="number"
                    value={apartmentData.price}
                    onChange={(e) => setApartmentData(prev => ({ ...prev, price: parseInt(e.target.value) || 0 }))}
                    min="0"
                  />
                </div>
              </div>
              
              <div className="mb-4">
                <Label>Статус</Label>
                <div className="flex gap-2 mt-2">
                  {(['available', 'reserved', 'sold'] as const).map(status => (
                    <Button
                      key={status}
                      size="sm"
                      variant={apartmentData.status === status ? "default" : "outline"}
                      onClick={() => setApartmentData(prev => ({ ...prev, status }))}
                    >
                      {status === 'available' ? 'Свободна' : 
                       status === 'reserved' ? 'Бронь' : 'Продана'}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={startEditingApartment} disabled={!apartmentData.number.trim()}>
                  <Edit3 className="h-4 w-4 mr-2" />
                  {editingApartment ? 'Редактировать полигон' : 'Создать полигон'}
                </Button>
                {editingApartment && (
                  <>
                    <Button onClick={finishApartment} disabled={currentPolygon.length < 3}>
                      <Save className="h-4 w-4 mr-2" />
                      Сохранить квартиру
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setEditingApartment(null);
                        setCurrentPolygon([]);
                      }}
                    >
                      Отмена
                    </Button>
                  </>
                )}
              </div>

              {editingApartment && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm font-medium text-blue-900">
                    Редактирование квартиры {editingApartment}
                  </p>
                  <p className="text-sm text-blue-700">
                    Кликайте на план этажа для создания полигона. Точек: {currentPolygon.length}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Existing Apartments */}
          {apartments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-md">Квартиры на этаже {selectedFloor}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2">
                  {apartments.map(apartment => (
                    <div key={apartment.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <span className="font-medium">№{apartment.apartment_number}</span>
                        <span className="text-sm text-gray-600">
                          {apartment.rooms} комн, {apartment.area} м²
                        </span>
                        <span className={`px-2 py-1 rounded text-xs ${
                          apartment.status === 'available' ? 'bg-green-100 text-green-800' :
                          apartment.status === 'reserved' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {apartment.status === 'available' ? 'Свободна' : 
                           apartment.status === 'reserved' ? 'Бронь' : 'Продана'}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => editExistingApartment(apartment)}
                        >
                          <Edit3 className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteApartment(apartment.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Floor Plan Editor */}
      {currentFloorPlan?.image_url && (
        <Card>
          <CardContent className="p-6">
            <div className="relative inline-block max-w-full">
              <img
                ref={imageRef}
                src={currentFloorPlan.image_url}
                alt={`Floor ${selectedFloor} plan`}
                className="max-w-full max-h-[600px] object-contain rounded-lg"
              />
              <svg
                ref={svgRef}
                className={`absolute top-0 left-0 w-full h-full ${editingApartment ? 'cursor-crosshair' : 'cursor-default'}`}
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                onClick={handleSvgClick}
              >
                {/* Existing apartment polygons */}
                {apartments.map(apartment => {
                  const path = polygonToPath(apartment.polygon);
                  if (!path) return null;
                  
                  return (
                    <g key={apartment.id}>
                      <path
                        d={path}
                        fill={getStatusColor(apartment.status)}
                        stroke={getStatusColor(apartment.status)}
                        strokeWidth="0.3"
                        style={getPolygonStyle(apartment.status)}
                        className="hover:fill-opacity-70 transition-all"
                      />
                      {polygonSettings?.display.showNumbers && (
                        <text
                          x={apartment.polygon.reduce((sum, p) => sum + p.x, 0) / apartment.polygon.length}
                          y={apartment.polygon.reduce((sum, p) => sum + p.y, 0) / apartment.polygon.length}
                          textAnchor="middle"
                          dominantBaseline="central"
                          fill="white"
                          fontSize="1.5"
                          fontWeight="bold"
                          className="pointer-events-none"
                        >
                          {apartment.apartment_number}
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
  );
};

export default FloorPlanEditor;
