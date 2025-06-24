import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, Trash2, Edit, Eye, Square, Home } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface FloorPlanEditorProps {
  projectId: string;
  floors: number;
}

interface Apartment {
  id: string;
  number: string;
  polygon: { x: number; y: number }[];
  status: 'available' | 'sold' | 'reserved';
  area: number;
  rooms: number;
  price?: number;
}

interface FloorPlan {
  floorNumber: number;
  image: string;
  apartments: Apartment[];
}

const FloorPlanEditor = ({ projectId, floors }: FloorPlanEditorProps) => {
  const [floorPlans, setFloorPlans] = useState<FloorPlan[]>([]);
  const [currentFloor, setCurrentFloor] = useState(1);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPolygon, setCurrentPolygon] = useState<{ x: number; y: number }[]>([]);
  const [selectedApartment, setSelectedApartment] = useState<string | null>(null);
  const [apartmentData, setApartmentData] = useState({
    number: '',
    status: 'available' as const,
    area: 0,
    rooms: 1,
    price: 0
  });
  const [saving, setSaving] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const currentFloorPlan = floorPlans.find(fp => fp.floorNumber === currentFloor);

  // Загружаем существующие данные при монтировании и смене этажа
  useEffect(() => {
    loadFloorData();
  }, [projectId, currentFloor]);

  const loadFloorData = async () => {
    try {
      // Загружаем план этажа
      const { data: floorPlan, error: floorPlanError } = await supabase
        .from('floor_plans')
        .select('*')
        .eq('project_id', projectId)
        .eq('floor_number', currentFloor)
        .maybeSingle();

      if (floorPlanError) throw floorPlanError;

      // Загружаем квартиры для этого этажа
      const { data: apartments, error: apartmentsError } = await supabase
        .from('apartments')
        .select('*')
        .eq('project_id', projectId)
        .eq('floor_number', currentFloor);

      if (apartmentsError) throw apartmentsError;

      const floorData: FloorPlan = {
        floorNumber: currentFloor,
        image: floorPlan?.image_url || '',
        apartments: apartments?.map(apt => ({
          id: apt.id,
          number: apt.apartment_number,
          polygon: Array.isArray(apt.polygon) ? apt.polygon as { x: number; y: number }[] : [],
          status: apt.status as 'available' | 'sold' | 'reserved',
          area: parseFloat(apt.area.toString()),
          rooms: apt.rooms,
          price: apt.price || 0
        })) || []
      };

      setFloorPlans(prev => {
        const filtered = prev.filter(fp => fp.floorNumber !== currentFloor);
        return [...filtered, floorData];
      });
    } catch (error) {
      console.error('Error loading floor data:', error);
      toast.error('Ошибка загрузки данных этажа');
    }
  };

  const handleImageUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const imageUrl = e.target?.result as string;
        
        try {
          // Сохраняем или обновляем план этажа в базе данных
          const { error } = await supabase
            .from('floor_plans')
            .upsert({
              project_id: projectId,
              floor_number: currentFloor,
              image_url: imageUrl
            });

          if (error) throw error;

          setFloorPlans(prev => {
            const filtered = prev.filter(fp => fp.floorNumber !== currentFloor);
            return [...filtered, {
              floorNumber: currentFloor,
              image: imageUrl,
              apartments: currentFloorPlan?.apartments || []
            }];
          });
          
          toast.success(`План ${currentFloor}-го этажа загружен и сохранен`);
        } catch (error) {
          console.error('Error saving floor plan:', error);
          toast.error('Ошибка сохранения плана этажа');
        }
      };
      reader.readAsDataURL(file);
    }
  }, [currentFloor, currentFloorPlan, projectId]);

  const startDrawingApartment = () => {
    if (!apartmentData.number) {
      toast.error('Введите номер квартиры');
      return;
    }
    setCurrentPolygon([]);
    setIsDrawing(true);
    setSelectedApartment(null);
    toast.info('Выделите контуры квартиры на плане');
  };

  const handleSVGClick = useCallback((event: React.MouseEvent<SVGSVGElement>) => {
    if (!isDrawing) return;

    const svg = svgRef.current;
    const image = imageRef.current;
    if (!svg || !image) return;

    const rect = svg.getBoundingClientRect();
    const imageRect = image.getBoundingClientRect();
    
    const x = ((event.clientX - imageRect.left) / imageRect.width) * 100;
    const y = ((event.clientY - imageRect.top) / imageRect.height) * 100;

    setCurrentPolygon(prev => [...prev, { x, y }]);
  }, [isDrawing]);

  const finishDrawing = async () => {
    if (currentPolygon.length < 3) {
      toast.error('Необходимо выбрать минимум 3 точки');
      return;
    }

    setSaving(true);

    try {
      const newApartment: Apartment = {
        id: `${currentFloor}-${apartmentData.number}`,
        number: apartmentData.number,
        polygon: currentPolygon,
        status: apartmentData.status,
        area: apartmentData.area,
        rooms: apartmentData.rooms,
        price: apartmentData.price
      };

      // Удаляем существующую квартиру с таким номером, если есть
      await supabase
        .from('apartments')
        .delete()
        .eq('project_id', projectId)
        .eq('floor_number', currentFloor)
        .eq('apartment_number', apartmentData.number);

      // Создаем новую квартиру
      const { error } = await supabase
        .from('apartments')
        .insert({
          project_id: projectId,
          floor_number: currentFloor,
          apartment_number: apartmentData.number,
          rooms: apartmentData.rooms,
          area: apartmentData.area,
          price: apartmentData.price,
          status: apartmentData.status,
          polygon: currentPolygon
        });

      if (error) throw error;

      setFloorPlans(prev => prev.map(fp => {
        if (fp.floorNumber === currentFloor) {
          const filteredApartments = fp.apartments.filter(apt => apt.id !== newApartment.id);
          return {
            ...fp,
            apartments: [...filteredApartments, newApartment]
          };
        }
        return fp;
      }));

      setIsDrawing(false);
      setCurrentPolygon([]);
      setApartmentData({ number: '', status: 'available', area: 0, rooms: 1, price: 0 });
      toast.success(`Квартира ${apartmentData.number} добавлена и сохранена`);
    } catch (error) {
      console.error('Error saving apartment:', error);
      toast.error('Ошибка сохранения квартиры');
    } finally {
      setSaving(false);
    }
  };

  const cancelDrawing = () => {
    setIsDrawing(false);
    setCurrentPolygon([]);
    toast.info('Выделение отменено');
  };

  const deleteApartment = async (apartmentId: string) => {
    try {
      const { error } = await supabase
        .from('apartments')
        .delete()
        .eq('id', apartmentId);

      if (error) throw error;

      setFloorPlans(prev => prev.map(fp => {
        if (fp.floorNumber === currentFloor) {
          return {
            ...fp,
            apartments: fp.apartments.filter(apt => apt.id !== apartmentId)
          };
        }
        return fp;
      }));
      
      toast.success('Квартира удалена');
    } catch (error) {
      console.error('Error deleting apartment:', error);
      toast.error('Ошибка удаления квартиры');
    }
  };

  const selectApartment = (apartmentId: string) => {
    setSelectedApartment(selectedApartment === apartmentId ? null : apartmentId);
  };

  const polygonToPath = (polygon: { x: number; y: number }[]) => {
    if (polygon.length === 0) return '';
    return `M ${polygon.map(p => `${p.x} ${p.y}`).join(' L ')} Z`;
  };

  const getApartmentClass = (status: string) => {
    switch (status) {
      case 'available':
        return 'apartment-available';
      case 'sold':
        return 'apartment-sold';
      case 'reserved':
        return 'apartment-reserved';
      default:
        return 'apartment-available';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return '#22c55e';
      case 'sold':
        return '#ef4444';
      case 'reserved':
        return '#f59e0b';
      default:
        return '#22c55e';
    }
  };

  return (
    <div className="space-y-6">
      {/* Floor Selection */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-real-estate-900">
              Планы этажей
            </h3>
            <div className="flex items-center gap-4">
              <Label htmlFor="floor-select">Этаж:</Label>
              <Select value={currentFloor.toString()} onValueChange={(value) => setCurrentFloor(parseInt(value))}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: floors }, (_, i) => i + 1).map(floorNum => (
                    <SelectItem key={floorNum} value={floorNum.toString()}>
                      {floorNum} этаж
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                size="sm"
                className="border-real-estate-300 text-real-estate-600 hover:bg-real-estate-50"
              >
                <Upload className="h-4 w-4 mr-2" />
                Загрузить план
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Apartment Creation Form */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-lg font-semibold text-real-estate-900 mb-4">
            Добавление квартиры
          </h3>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
            <div>
              <Label htmlFor="apt-number">Номер</Label>
              <Input
                id="apt-number"
                value={apartmentData.number}
                onChange={(e) => setApartmentData(prev => ({ ...prev, number: e.target.value }))}
                placeholder="101"
              />
            </div>
            <div>
              <Label htmlFor="apt-rooms">Комнат</Label>
              <Input
                id="apt-rooms"
                type="number"
                value={apartmentData.rooms}
                onChange={(e) => setApartmentData(prev => ({ ...prev, rooms: parseInt(e.target.value) || 1 }))}
                min="1"
                max="10"
              />
            </div>
            <div>
              <Label htmlFor="apt-area">Площадь (м²)</Label>
              <Input
                id="apt-area"
                type="number"
                value={apartmentData.area}
                onChange={(e) => setApartmentData(prev => ({ ...prev, area: parseFloat(e.target.value) || 0 }))}
                step="0.1"
              />
            </div>
            <div>
              <Label htmlFor="apt-status">Статус</Label>
              <Select value={apartmentData.status} onValueChange={(value: any) => setApartmentData(prev => ({ ...prev, status: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Доступна</SelectItem>
                  <SelectItem value="reserved">Бронь</SelectItem>
                  <SelectItem value="sold">Продана</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button
                onClick={startDrawingApartment}
                disabled={isDrawing || !apartmentData.number}
                className="w-full bg-real-estate-600 hover:bg-real-estate-700"
              >
                <Square className="h-4 w-4 mr-2" />
                Выделить
              </Button>
            </div>
          </div>

          {isDrawing && (
            <div className="flex items-center gap-2 p-3 bg-real-estate-50 rounded-lg">
              <div className="text-sm text-real-estate-700">
                Кликайте по плану для выделения квартиры {apartmentData.number}
              </div>
              <div className="flex gap-2 ml-auto">
                <Button size="sm" onClick={finishDrawing} disabled={saving}>
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

      {/* Floor Plan Editor */}
      {currentFloorPlan?.image && (
        <Card>
          <CardContent className="pt-6">
            <div className="relative inline-block">
              <img
                ref={imageRef}
                src={currentFloorPlan.image}
                alt={`Floor ${currentFloor} plan`}
                className="max-w-full max-h-[600px] object-contain rounded-lg shadow-lg"
              />
              <svg
                ref={svgRef}
                className="absolute top-0 left-0 w-full h-full cursor-crosshair"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                onClick={handleSVGClick}
              >
                {/* Existing apartments */}
                {currentFloorPlan.apartments.map(apartment => (
                  <g key={apartment.id}>
                    <path
                      d={polygonToPath(apartment.polygon)}
                      className={`${getApartmentClass(apartment.status)} cursor-pointer hover:apartment-hover transition-all`}
                      onClick={(e) => {
                        e.stopPropagation();
                        selectApartment(apartment.id);
                      }}
                    />
                    {/* Apartment label */}
                    {apartment.polygon.length > 0 && (
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
                        {apartment.number}
                      </text>
                    )}
                  </g>
                ))}

                {/* Current drawing polygon */}
                {currentPolygon.length > 0 && (
                  <>
                    <path
                      d={polygonToPath(currentPolygon)}
                      fill={getStatusColor(apartmentData.status)}
                      fillOpacity="0.4"
                      stroke={getStatusColor(apartmentData.status)}
                      strokeWidth="0.5"
                      strokeDasharray="1,1"
                    />
                    {currentPolygon.map((point, index) => (
                      <circle
                        key={index}
                        cx={point.x}
                        cy={point.y}
                        r="0.8"
                        fill={getStatusColor(apartmentData.status)}
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

      {/* Apartments List */}
      {currentFloorPlan && currentFloorPlan.apartments.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg font-semibold text-real-estate-900 mb-4">
              Квартиры на {currentFloor}-м этаже
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {currentFloorPlan.apartments
                .sort((a, b) => a.number.localeCompare(b.number))
                .map(apartment => (
                  <div
                    key={apartment.id}
                    className={`p-4 rounded-lg border transition-all cursor-pointer ${
                      selectedApartment === apartment.id
                        ? 'border-real-estate-400 bg-real-estate-50'
                        : 'border-real-estate-200 hover:border-real-estate-300'
                    }`}
                    onClick={() => selectApartment(apartment.id)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Home className="h-4 w-4 text-real-estate-600" />
                        <span className="font-semibold text-real-estate-900">
                          Кв. {apartment.number}
                        </span>
                      </div>
                      <Badge 
                        className={`${
                          apartment.status === 'available' ? 'bg-success-100 text-success-800' :
                          apartment.status === 'sold' ? 'bg-red-100 text-red-800' :
                          'bg-warning-100 text-warning-800'
                        }`}
                      >
                        {apartment.status === 'available' ? 'Доступна' :
                         apartment.status === 'sold' ? 'Продана' : 'Бронь'}
                      </Badge>
                    </div>
                    <div className="text-sm text-real-estate-600 space-y-1">
                      <div>{apartment.rooms} комн.</div>
                      <div>{apartment.area} м²</div>
                      {apartment.price && apartment.price > 0 && (
                        <div className="font-medium text-real-estate-700">
                          {apartment.price.toLocaleString()} руб.
                        </div>
                      )}
                    </div>
                    <div className="flex justify-end mt-3">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteApartment(apartment.id);
                        }}
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

export default FloorPlanEditor;
