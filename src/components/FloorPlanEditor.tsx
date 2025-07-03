import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Upload, Plus, Trash2, Save, Edit3, Settings, X, Undo2, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import PolygonCustomizationSettings from './PolygonCustomizationSettings';
import ApartmentStatsPanel from './ApartmentStatsPanel';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';

interface Point {
  x: number;
  y: number;
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
  floorNumber: number;
}

const FloorPlanEditor = ({ projectId, floorNumber }: FloorPlanEditorProps) => {
  const [imageUrl, setImageUrl] = useState<string>('');
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [editingApartment, setEditingApartment] = useState<string | null>(null);
  const [currentPolygon, setCurrentPolygon] = useState<Point[]>([]);
  const [polygonHistory, setPolygonHistory] = useState<Point[][]>([]);
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
  const [selectedApartment, setSelectedApartment] = useState<Apartment | null>(null);
  const [hoveredApartment, setHoveredApartment] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    loadFloorPlan();
    loadApartments();
    loadPolygonSettings();
  }, [projectId, floorNumber]);

  const loadFloorPlan = async () => {
    try {
      const { data, error } = await supabase
        .from('floor_plans')
        .select('image_url')
        .eq('project_id', projectId)
        .eq('floor_number', floorNumber)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data?.image_url) {
        setImageUrl(data.image_url);
      }
    } catch (error) {
      console.error('Error loading floor plan:', error);
    }
  };

  const loadApartments = async () => {
    try {
      const { data, error } = await supabase
        .from('apartments')
        .select('*')
        .eq('project_id', projectId)
        .eq('floor_number', floorNumber);

      if (error) throw error;

      const transformedApartments: Apartment[] = (data || []).map(apt => ({
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
        .eq('floor_number', floorNumber)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

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
      const fileName = `${projectId}/floor-${floorNumber}.${fileExt}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('project-images')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('project-images')
        .getPublicUrl(fileName);

      const newImageUrl = urlData.publicUrl;
      setImageUrl(newImageUrl);

      const { data: existingPlan } = await supabase
        .from('floor_plans')
        .select('id')
        .eq('project_id', projectId)
        .eq('floor_number', floorNumber)
        .maybeSingle();

      if (existingPlan) {
        await supabase
          .from('floor_plans')
          .update({ image_url: newImageUrl })
          .eq('id', existingPlan.id);
      } else {
        await supabase
          .from('floor_plans')
          .insert({
            project_id: projectId,
            floor_number: floorNumber,
            image_url: newImageUrl
          });
      }

      toast.success('План этажа загружен');
    } catch (error) {
      console.error('Error uploading floor plan:', error);
      toast.error('Ошибка загрузки плана этажа');
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
    if (editingApartment === null) return;

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

  const saveApartment = async () => {
    if (!editingApartment || currentPolygon.length < 3 || !apartmentData.number) {
      toast.error('Заполните все поля и создайте полигон (минимум 3 точки)');
      return;
    }

    try {
      if (editingApartment === 'new') {
        const { data, error } = await supabase
          .from('apartments')
          .insert({
            project_id: projectId,
            floor_number: floorNumber,
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
          apartment_number: data.apartment_number,
          rooms: data.rooms,
          area: Number(data.area),
          price: Number(data.price),
          status: data.status as 'available' | 'sold' | 'reserved',
          polygon: currentPolygon
        }]);
      } else {
        const existingApartment = apartments.find(apt => apt.id === editingApartment);
        if (!existingApartment) return;

        const { error } = await supabase
          .from('apartments')
          .update({
            apartment_number: apartmentData.number,
            rooms: apartmentData.rooms,
            area: apartmentData.area,
            price: apartmentData.price,
            status: apartmentData.status,
            polygon: currentPolygon as unknown as any
          })
          .eq('id', existingApartment.id);

        if (error) throw error;

        setApartments(prev => prev.map(apt => 
          apt.id === existingApartment.id 
            ? { ...apt, ...apartmentData, polygon: currentPolygon }
            : apt
        ));
      }

      resetEditing();
      toast.success('Квартира сохранена');
    } catch (error) {
      console.error('Error saving apartment:', error);
      toast.error('Ошибка сохранения квартиры');
    }
  };

  const startEditingApartment = (apartmentId: string | null) => {
    if (apartmentId === 'new') {
      setEditingApartment('new');
      setApartmentData({
        number: '',
        rooms: 1,
        area: 0,
        price: 0,
        status: 'available'
      });
      setCurrentPolygon([]);
      setPolygonHistory([]);
    } else if (apartmentId) {
      const apartment = apartments.find(apt => apt.id === apartmentId);
      if (apartment) {
        setEditingApartment(apartmentId);
        setApartmentData({
          number: apartment.apartment_number,
          rooms: apartment.rooms,
          area: apartment.area,
          price: apartment.price,
          status: apartment.status
        });
        setCurrentPolygon(apartment.polygon);
        setPolygonHistory([]);
      }
    }
    setSelectedApartment(null);
  };

  const deleteApartment = async (apartmentId: string) => {
    try {
      const { error } = await supabase
        .from('apartments')
        .delete()
        .eq('id', apartmentId);

      if (error) throw error;

      setApartments(prev => prev.filter(apt => apt.id !== apartmentId));
      toast.success('Квартира удалена');
    } catch (error) {
      console.error('Error deleting apartment:', error);
      toast.error('Ошибка удаления квартиры');
    }
  };

  const resetEditing = () => {
    setEditingApartment(null);
    setCurrentPolygon([]);
    setPolygonHistory([]);
    setApartmentData({
      number: '',
      rooms: 1,
      area: 0,
      price: 0,
      status: 'available'
    });
  };

  const polygonToPath = (polygon: Point[]) => {
    if (polygon.length === 0) return '';
    return `M ${polygon.map(p => `${p.x} ${p.y}`).join(' L ')} Z`;
  };

  const getStatusColor = (status: string) => {
    if (polygonSettings?.colors) {
      switch (status) {
        case 'available': return polygonSettings.colors.available;
        case 'sold': return polygonSettings.colors.sold;
        case 'reserved': return polygonSettings.colors.reserved;
        default: return polygonSettings.colors.available;
      }
    }

    switch (status) {
      case 'available': return '#22c55e';
      case 'sold': return '#ef4444';
      case 'reserved': return '#f59e0b';
      default: return '#22c55e';
    }
  };

  const getPolygonStyle = (status: string, isSelected: boolean = false, isHovered: boolean = false) => {
    if (!polygonSettings) return {};

    let baseOpacity = polygonSettings.opacity.normal;
    const hoverOpacity = polygonSettings.opacity.hover;
    
    if (isSelected) {
      baseOpacity = 0.8;
    } else if (isHovered && polygonSettings.hoverEffects.opacityChange) {
      baseOpacity = hoverOpacity;
    }

    let style: React.CSSProperties = {
      fillOpacity: baseOpacity,
      transition: 'all 0.3s ease'
    };

    if (isHovered && polygonSettings.hoverEffects.glow) {
      style.filter = 'drop-shadow(0 0 8px rgba(59, 130, 246, 0.6))';
    }

    return style;
  };

  const handleSettingsChange = (newSettings: PolygonSettings) => {
    setPolygonSettings(newSettings);
  };

  const handleApartmentClick = (apartment: Apartment) => {
    if (editingApartment) return;
    setSelectedApartment(apartment);
  };

  if (showSettings) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Настройки полигонов этажа {floorNumber}</h3>
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
          floorNumber={floorNumber}
          onSettingsChange={handleSettingsChange}
        />
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main editor */}
        <div className="lg:col-span-3 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">План этажа {floorNumber}</h3>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowSettings(true)}
              >
                <Settings className="h-4 w-4 mr-2" />
                Настройки
              </Button>
            </div>
          </div>

          {/* Image Upload */}
          <Card>
            <CardHeader>
              <CardTitle className="text-md">Загрузка плана этажа</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="floor-image">План этажа {floorNumber}</Label>
                  <Input
                    id="floor-image"
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

          {/* Apartment Controls */}
          <Card>
            <CardHeader>
              <CardTitle className="text-md">Управление квартирами</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button
                  onClick={() => startEditingApartment('new')}
                  disabled={!!editingApartment}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Добавить квартиру
                </Button>

                {editingApartment && (
                  <div className="p-4 bg-blue-50 rounded-lg space-y-4">
                    <h4 className="font-medium text-blue-900">
                      {editingApartment === 'new' ? 'Новая квартира' : 'Редактирование квартиры'}
                    </h4>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="apt-number">Номер квартиры</Label>
                        <Input
                          id="apt-number"
                          value={apartmentData.number}
                          onChange={(e) => setApartmentData(prev => ({ ...prev, number: e.target.value }))}
                          placeholder="Например: 101"
                        />
                      </div>
                      <div>
                        <Label htmlFor="apt-rooms">Комнат</Label>
                        <Select
                          value={apartmentData.rooms.toString()}
                          onValueChange={(value) => setApartmentData(prev => ({ ...prev, rooms: parseInt(value) }))}
                        >
                          <SelectTrigger id="apt-rooms">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {[1, 2, 3, 4, 5].map(num => (
                              <SelectItem key={num} value={num.toString()}>
                                {num}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="apt-area">Площадь (м²)</Label>
                        <Input
                          id="apt-area"
                          type="number"
                          value={apartmentData.area}
                          onChange={(e) => setApartmentData(prev => ({ ...prev, area: parseFloat(e.target.value) || 0 }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="apt-price">Цена (₽)</Label>
                        <Input
                          id="apt-price"
                          type="number"
                          value={apartmentData.price}
                          onChange={(e) => setApartmentData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                        />
                      </div>
                      <div className="col-span-2">
                        <Label htmlFor="apt-status">Статус</Label>
                        <Select
                          value={apartmentData.status}
                          onValueChange={(value: 'available' | 'sold' | 'reserved') => setApartmentData(prev => ({ ...prev, status: value }))}
                        >
                          <SelectTrigger id="apt-status">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="available">Свободна</SelectItem>
                            <SelectItem value="reserved">Бронь</SelectItem>
                            <SelectItem value="sold">Продана</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <p className="text-sm text-blue-700">
                      Кликайте на план, чтобы создать полигон квартиры. 
                      Текущих точек: {currentPolygon.length}
                    </p>

                    <div className="flex gap-2 flex-wrap">
                      <Button size="sm" onClick={saveApartment}>
                        <Save className="h-3 w-3 mr-1" />
                        Сохранить
                      </Button>
                      <Button size="sm" variant="outline" onClick={resetEditing}>
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

                {/* Apartments List */}
                <div className="space-y-2">
                  <h4 className="font-medium">Квартиры на этаже:</h4>
                  <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto">
                    {apartments.map(apartment => (
                      <div key={apartment.id} className="flex items-center justify-between p-2 border rounded">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">№{apartment.apartment_number}</span>
                          <Badge variant={apartment.status === 'available' ? 'default' : apartment.status === 'sold' ? 'destructive' : 'secondary'}>
                            {apartment.status === 'available' ? 'Свободна' : apartment.status === 'sold' ? 'Продана' : 'Бронь'}
                          </Badge>
                          <span className="text-sm text-gray-600">{apartment.rooms} комн., {apartment.area} м²</span>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => startEditingApartment(apartment.id)}
                            disabled={!!editingApartment}
                          >
                            <Edit3 className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => deleteApartment(apartment.id)}
                            disabled={!!editingApartment}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
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
                    alt={`Floor ${floorNumber} plan`}
                    className="max-w-full max-h-[600px] object-contain rounded-lg"
                  />
                  <svg
                    ref={svgRef}
                    className="absolute top-0 left-0 w-full h-full cursor-crosshair"
                    viewBox="0 0 100 100"
                    preserveAspectRatio="none"
                    onClick={handleSvgClick}
                  >
                    {/* Existing apartments */}
                    {apartments.map(apartment => {
                      const path = polygonToPath(apartment.polygon);
                      if (!path) return null;
                      
                      const isSelected = selectedApartment?.id === apartment.id;
                      const isHovered = hoveredApartment === apartment.id;
                      
                      return (
                        <g key={apartment.id}>
                          <HoverCard>
                            <HoverCardTrigger asChild>
                              <path
                                d={path}
                                fill={getStatusColor(apartment.status)}
                                stroke={isSelected ? '#000' : getStatusColor(apartment.status)}
                                strokeWidth={isSelected ? "1" : "0.3"}
                                style={getPolygonStyle(apartment.status, isSelected, isHovered)}
                                className="transition-all cursor-pointer"
                                onMouseEnter={() => setHoveredApartment(apartment.id)}
                                onMouseLeave={() => setHoveredApartment(null)}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleApartmentClick(apartment);
                                }}
                              />
                            </HoverCardTrigger>
                            <HoverCardContent className="w-64">
                              <div className="space-y-2">
                                <h4 className="font-semibold">Квартира №{apartment.apartment_number}</h4>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                  <span className="text-gray-600">Комнат:</span>
                                  <span>{apartment.rooms}</span>
                                  <span className="text-gray-600">Площадь:</span>
                                  <span>{apartment.area} м²</span>
                                  {apartment.price > 0 && (
                                    <>
                                      <span className="text-gray-600">Цена:</span>
                                      <span>{new Intl.NumberFormat('ru-RU').format(apartment.price)} ₽</span>
                                    </>
                                  )}
                                  <span className="text-gray-600">Статус:</span>
                                  <Badge variant={apartment.status === 'available' ? 'default' : apartment.status === 'sold' ? 'destructive' : 'secondary'}>
                                    {apartment.status === 'available' ? 'Свободна' : apartment.status === 'sold' ? 'Продана' : 'Бронь'}
                                  </Badge>
                                </div>
                              </div>
                            </HoverCardContent>
                          </HoverCard>
                          {polygonSettings?.display.showNumbers && (
                            <text
                              x={apartment.polygon.reduce((sum, p) => sum + p.x, 0) / apartment.polygon.length}
                              y={apartment.polygon.reduce((sum, p) => sum + p.y, 0) / apartment.polygon.length}
                              textAnchor="middle"
                              dominantBaseline="central"
                              fill="white"
                              fontSize="1.2"
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

        {/* Sidebar */}
        <div className="space-y-4">
          <ApartmentStatsPanel projectId={projectId} selectedFloor={floorNumber} />
          
          {/* Selected Apartment Details */}
          {selectedApartment && !editingApartment && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-md">Квартира №{selectedApartment.apartment_number}</CardTitle>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setSelectedApartment(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Статус:</span>
                  <Badge variant={selectedApartment.status === 'available' ? 'default' : selectedApartment.status === 'sold' ? 'destructive' : 'secondary'}>
                    {selectedApartment.status === 'available' ? 'Свободна' : selectedApartment.status === 'sold' ? 'Продана' : 'Бронь'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Комнат:</span>
                  <span className="font-medium">{selectedApartment.rooms}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Площадь:</span>
                  <span className="font-medium">{selectedApartment.area} м²</span>
                </div>
                {selectedApartment.price > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Цена:</span>
                    <span className="font-bold">{new Intl.NumberFormat('ru-RU').format(selectedApartment.price)} ₽</span>
                  </div>
                )}
                <div className="pt-2 border-t">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => startEditingApartment(selectedApartment.id)}
                    className="w-full"
                    disabled={!!editingApartment}
                  >
                    <Edit3 className="h-3 w-3 mr-1" />
                    Редактировать
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
};

export default FloorPlanEditor;
