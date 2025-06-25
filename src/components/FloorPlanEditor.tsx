import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Upload, Trash2, Edit, Eye, Square, Home, Save, X, Copy, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface FloorPlanEditorProps {
  projectId: string;
  floors: number;
  sameLayoutForAllFloors?: boolean;
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

const FloorPlanEditor = ({ projectId, floors, sameLayoutForAllFloors = false }: FloorPlanEditorProps) => {
  const [floorPlans, setFloorPlans] = useState<FloorPlan[]>([]);
  const [currentFloor, setCurrentFloor] = useState(1);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingApartmentId, setEditingApartmentId] = useState<string | null>(null);
  const [currentPolygon, setCurrentPolygon] = useState<{ x: number; y: number }[]>([]);
  const [selectedApartment, setSelectedApartment] = useState<string | null>(null);
  const [apartmentData, setApartmentData] = useState<{
    number: string;
    status: 'available' | 'sold' | 'reserved';
    area: number;
    rooms: number;
    price: number;
  }>({
    number: '',
    status: 'available',
    area: 0,
    rooms: 1,
    price: 0
  });
  const [saving, setSaving] = useState(false);
  const [uploadForAllFloors, setUploadForAllFloors] = useState(sameLayoutForAllFloors);
  const [zoom, setZoom] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [lastPanPoint, setLastPanPoint] = useState({ x: 0, y: 0 });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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
          polygon: Array.isArray(apt.polygon) 
            ? apt.polygon as { x: number; y: number }[]
            : typeof apt.polygon === 'string'
            ? JSON.parse(apt.polygon)
            : [],
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
          if (uploadForAllFloors) {
            // Загружаем план для всех этажей
            const promises = Array.from({ length: floors }, (_, i) => i + 1).map(floorNum =>
              supabase
                .from('floor_plans')
                .upsert({
                  project_id: projectId,
                  floor_number: floorNum,
                  image_url: imageUrl
                })
            );
            
            const results = await Promise.all(promises);
            const hasError = results.some(result => result.error);
            if (hasError) throw new Error('Ошибка сохранения планов этажей');
            
            // Обновляем состояние для всех этажей
            const newFloorPlans = Array.from({ length: floors }, (_, i) => i + 1).map(floorNum => ({
              floorNumber: floorNum,
              image: imageUrl,
              apartments: floorPlans.find(fp => fp.floorNumber === floorNum)?.apartments || []
            }));
            
            setFloorPlans(newFloorPlans);
            toast.success('План загружен для всех этажей');
          } else {
            // Обычная загрузка для текущего этажа
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
          }
        } catch (error) {
          console.error('Error saving floor plan:', error);
          toast.error('Ошибка сохранения плана этажа');
        }
      };
      reader.readAsDataURL(file);
    }
  }, [currentFloor, currentFloorPlan, projectId, floors, uploadForAllFloors, floorPlans]);

  const duplicatePolygonsToAllFloors = async () => {
    if (!currentFloorPlan?.apartments.length) {
      toast.error('Сначала создайте квартиры на текущем этаже');
      return;
    }

    setSaving(true);
    try {
      // Получаем все квартиры с текущего этажа
      const sourceApartments = currentFloorPlan.apartments;
      
      // Создаем квартиры для всех остальных этажей
      const allFloorPromises = Array.from({ length: floors }, (_, i) => i + 1)
        .filter(floorNum => floorNum !== currentFloor)
        .map(async (floorNum) => {
          // Получаем существующие квартиры на этом этаже
          const { data: existingApartments, error: fetchError } = await supabase
            .from('apartments')
            .select('apartment_number')
            .eq('project_id', projectId)
            .eq('floor_number', floorNum);

          if (fetchError) throw fetchError;

          const existingNumbers = new Set(existingApartments?.map(apt => apt.apartment_number) || []);

          // Создаем только те квартиры, которых еще нет
          const apartmentsToCreate = sourceApartments
            .map(apt => {
              // Извлекаем базовый номер квартиры (последние 2 цифры)
              const baseNumber = apt.number.length >= 2 ? apt.number.slice(-2) : apt.number;
              const newNumber = `${floorNum}${baseNumber.padStart(2, '0')}`;
              
              return {
                newNumber,
                apartment: apt
              };
            })
            .filter(({ newNumber }) => !existingNumbers.has(newNumber))
            .map(({ newNumber, apartment }) => ({
              project_id: projectId,
              floor_number: floorNum,
              apartment_number: newNumber,
              rooms: apartment.rooms,
              area: apartment.area,
              price: apartment.price || 0,
              status: apartment.status,
              polygon: apartment.polygon
            }));

          if (apartmentsToCreate.length === 0) {
            return {
              floorNumber: floorNum,
              apartments: [],
              skipped: sourceApartments.length
            };
          }

          // Вставляем только новые квартиры
          const { data: insertedApartments, error } = await supabase
            .from('apartments')
            .insert(apartmentsToCreate)
            .select();

          if (error) throw error;

          return {
            floorNumber: floorNum,
            apartments: insertedApartments?.map(apt => ({
              id: apt.id,
              number: apt.apartment_number,
              polygon: Array.isArray(apt.polygon) ? apt.polygon as { x: number; y: number }[] : [],
              status: apt.status as 'available' | 'sold' | 'reserved',
              area: apt.area,
              rooms: apt.rooms,
              price: apt.price
            })) || [],
            created: apartmentsToCreate.length,
            skipped: sourceApartments.length - apartmentsToCreate.length
          };
        });

      const results = await Promise.all(allFloorPromises);

      // Обновляем состояние только для созданных квартир
      setFloorPlans(prev => {
        const updated = [...prev];
        results.forEach(result => {
          if (result.apartments.length > 0) {
            const existingFloorIndex = updated.findIndex(fp => fp.floorNumber === result.floorNumber);
            if (existingFloorIndex >= 0) {
              // Добавляем новые квартиры к существующим
              updated[existingFloorIndex] = {
                ...updated[existingFloorIndex],
                apartments: [...updated[existingFloorIndex].apartments, ...result.apartments]
              };
            } else {
              updated.push({
                floorNumber: result.floorNumber,
                image: currentFloorPlan.image,
                apartments: result.apartments
              });
            }
          }
        });
        return updated;
      });

      const totalCreated = results.reduce((sum, result) => sum + (result.created || 0), 0);
      const totalSkipped = results.reduce((sum, result) => sum + (result.skipped || 0), 0);

      if (totalCreated > 0) {
        toast.success(`Создано ${totalCreated} новых квартир. Пропущено ${totalSkipped} существующих.`);
      } else {
        toast.info('Все квартиры уже существуют на других этажах');
      }
    } catch (error) {
      console.error('Error duplicating polygons:', error);
      toast.error('Ошибка дублирования полигонов');
    } finally {
      setSaving(false);
    }
  };

  const startDrawingApartment = () => {
    if (!apartmentData.number) {
      toast.error('Введите номер квартиры');
      return;
    }
    setCurrentPolygon([]);
    setIsDrawing(true);
    setIsEditing(false);
    setEditingApartmentId(null);
    setSelectedApartment(null);
    toast.info('Кликайте левой кнопкой для добавления точек, правой - для удаления последней точки');
  };

  const startEditingApartment = (apartmentId: string) => {
    const apartment = currentFloorPlan?.apartments.find(apt => apt.id === apartmentId);
    if (!apartment) return;

    setCurrentPolygon([...apartment.polygon]);
    setIsEditing(true);
    setIsDrawing(false);
    setEditingApartmentId(apartmentId);
    setSelectedApartment(null);
    setApartmentData({
      number: apartment.number,
      status: apartment.status,
      area: apartment.area,
      rooms: apartment.rooms,
      price: apartment.price || 0
    });
    toast.info(`Редактирование квартиры ${apartment.number}. Левый клик - добавить точку, правый - удалить последнюю`);
  };

  const handleSVGClick = useCallback((event: React.MouseEvent<SVGSVGElement>) => {
    if (!isDrawing && !isEditing) return;
    event.preventDefault();

    const svg = svgRef.current;
    const image = imageRef.current;
    if (!svg || !image) return;

    const rect = svg.getBoundingClientRect();
    const imageRect = image.getBoundingClientRect();
    
    // Учитываем масштабирование и панорамирование
    const x = ((event.clientX - imageRect.left) / (imageRect.width * zoom) - panOffset.x / (imageRect.width * zoom)) * 100;
    const y = ((event.clientY - imageRect.top) / (imageRect.height * zoom) - panOffset.y / (imageRect.height * zoom)) * 100;

    if (event.button === 2) {
      // Правый клик - удаляем последнюю точку
      event.preventDefault();
      if (currentPolygon.length > 0) {
        setCurrentPolygon(prev => prev.slice(0, -1));
        toast.info(`Удалена точка. Осталось ${currentPolygon.length - 1} точек`);
      }
    } else if (event.button === 0) {
      // Левый клик - добавляем точку
      setCurrentPolygon(prev => [...prev, { x, y }]);
    }
  }, [isDrawing, isEditing, currentPolygon, zoom, panOffset]);

  const handleSVGContextMenu = useCallback((event: React.MouseEvent<SVGSVGElement>) => {
    event.preventDefault();
  }, []);

  const removeLastPoint = () => {
    if (currentPolygon.length > 0) {
      setCurrentPolygon(prev => prev.slice(0, -1));
      toast.info(`Удалена точка. Осталось ${currentPolygon.length - 1} точек`);
    }
  };

  const clearPolygon = () => {
    setCurrentPolygon([]);
    toast.info('Полигон очищен');
  };

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
      // Средняя кнопка или Ctrl + левая кнопка для панорамирования
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
    if (currentPolygon.length < 3) {
      toast.error('Необходимо выбрать минимум 3 точки');
      return;
    }

    setSaving(true);

    try {
      if (isEditing && editingApartmentId) {
        // Обновляем существующую квартиру
        const { error } = await supabase
          .from('apartments')
          .update({
            apartment_number: apartmentData.number,
            rooms: apartmentData.rooms,
            area: apartmentData.area,
            price: apartmentData.price,
            status: apartmentData.status,
            polygon: currentPolygon
          })
          .eq('id', editingApartmentId);

        if (error) throw error;

        setFloorPlans(prev => prev.map(fp => {
          if (fp.floorNumber === currentFloor) {
            return {
              ...fp,
              apartments: fp.apartments.map(apt => 
                apt.id === editingApartmentId 
                  ? { ...apt, number: apartmentData.number, polygon: currentPolygon, status: apartmentData.status, area: apartmentData.area, rooms: apartmentData.rooms, price: apartmentData.price }
                  : apt
              )
            };
          }
          return fp;
        }));

        setIsEditing(false);
        setEditingApartmentId(null);
        toast.success(`Квартира ${apartmentData.number} обновлена`);
      } else {
        // Создаем новую квартиру
        const newApartment: Apartment = {
          id: `${currentFloor}-${apartmentData.number}`,
          number: apartmentData.number,
          polygon: currentPolygon,
          status: apartmentData.status,
          area: apartmentData.area,
          rooms: apartmentData.rooms,
          price: apartmentData.price
        };

        if (uploadForAllFloors) {
          // Создаем квартиры на всех этажах, но только если их еще нет
          const promises = Array.from({ length: floors }, (_, i) => i + 1).map(async floorNum => {
            // Адаптируем номер квартиры для каждого этажа
            const baseNumber = apartmentData.number.length >= 2 ? apartmentData.number.slice(-2) : apartmentData.number;
            const floorApartmentNumber = `${floorNum}${baseNumber.padStart(2, '0')}`;
            
            // Проверяем, существует ли уже такая квартира
            const { data: existingApartment } = await supabase
              .from('apartments')
              .select('id')
              .eq('project_id', projectId)
              .eq('floor_number', floorNum)
              .eq('apartment_number', floorApartmentNumber)
              .maybeSingle();

            if (existingApartment) {
              // Квартира уже существует, обновляем её
              return supabase
                .from('apartments')
                .update({
                  rooms: apartmentData.rooms,
                  area: apartmentData.area,
                  price: apartmentData.price,
                  status: apartmentData.status,
                  polygon: currentPolygon
                })
                .eq('id', existingApartment.id);
            } else {
              // Создаем новую квартиру
              return supabase
                .from('apartments')
                .insert({
                  project_id: projectId,
                  floor_number: floorNum,
                  apartment_number: floorApartmentNumber,
                  rooms: apartmentData.rooms,
                  area: apartmentData.area,
                  price: apartmentData.price,
                  status: apartmentData.status,
                  polygon: currentPolygon
                });
            }
          });

          const results = await Promise.all(promises);
          const hasError = results.some(result => result.error);
          if (hasError) throw new Error('Ошибка создания/обновления квартир на всех этажах');

          // Обновляем состояние для всех этажей
          setFloorPlans(prev => prev.map(fp => {
            const baseNumber = apartmentData.number.length >= 2 ? apartmentData.number.slice(-2) : apartmentData.number;
            const floorApartmentNumber = `${fp.floorNumber}${baseNumber.padStart(2, '0')}`;
            const filteredApartments = fp.apartments.filter(apt => apt.number !== floorApartmentNumber);
            return {
              ...fp,
              apartments: [...filteredApartments, { 
                ...newApartment, 
                id: `${fp.floorNumber}-${floorApartmentNumber}`,
                number: floorApartmentNumber 
              }]
            };
          }));

          toast.success(`Квартира создана/обновлена на всех этажах`);
        } else {
          // Обычное создание для текущего этажа
          const { data: existingApartment } = await supabase
            .from('apartments')
            .select('id')
            .eq('project_id', projectId)
            .eq('floor_number', currentFloor)
            .eq('apartment_number', apartmentData.number)
            .maybeSingle();

          if (existingApartment) {
            // Обновляем существующую квартиру
            const { error } = await supabase
              .from('apartments')
              .update({
                rooms: apartmentData.rooms,
                area: apartmentData.area,
                price: apartmentData.price,
                status: apartmentData.status,
                polygon: currentPolygon
              })
              .eq('id', existingApartment.id);

            if (error) throw error;
            toast.success(`Квартира ${apartmentData.number} обновлена`);
          } else {
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
            toast.success(`Квартира ${apartmentData.number} создана`);
          }

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
        }

        setIsDrawing(false);
      }

      setCurrentPolygon([]);
      setApartmentData({ number: '', status: 'available', area: 0, rooms: 1, price: 0 });
    } catch (error) {
      console.error('Error saving apartment:', error);
      toast.error('Ошибка сохранения квартиры');
    } finally {
      setSaving(false);
    }
  };

  const cancelDrawing = () => {
    setIsDrawing(false);
    setIsEditing(false);
    setEditingApartmentId(null);
    setCurrentPolygon([]);
    setApartmentData({ number: '', status: 'available', area: 0, rooms: 1, price: 0 });
    toast.info('Операция отменена');
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
            </div>
          </div>

          {/* Upload Settings */}
          <div className="mb-4 p-4 bg-real-estate-50 rounded-lg">
            <div className="flex items-center space-x-2 mb-3">
              <Checkbox
                id="upload-all-floors"
                checked={uploadForAllFloors}
                onCheckedChange={(checked) => setUploadForAllFloors(checked as boolean)}
              />
              <Label htmlFor="upload-all-floors" className="text-sm font-medium">
                Одинаковая планировка для всех этажей
              </Label>
            </div>
            <p className="text-xs text-real-estate-600">
              {uploadForAllFloors 
                ? 'План и квартиры будут применены ко всем этажам с автоматической нумерацией'
                : 'План и квартиры будут созданы только для текущего этажа'
              }
            </p>
          </div>

          <div className="flex items-center gap-4">
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              size="sm"
              className="border-real-estate-300 text-real-estate-600 hover:bg-real-estate-50"
            >
              <Upload className="h-4 w-4 mr-2" />
              Загрузить план
            </Button>
            {uploadForAllFloors && currentFloorPlan?.apartments.length > 0 && (
              <Button
                onClick={duplicatePolygonsToAllFloors}
                variant="outline"
                size="sm"
                disabled={saving}
                className="border-blue-300 text-blue-600 hover:bg-blue-50"
              >
                <Copy className="h-4 w-4 mr-2" />
                {saving ? 'Дублирование...' : 'Дублировать на все этажи'}
              </Button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>
        </CardContent>
      </Card>

      {/* Apartment Creation Form */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-lg font-semibold text-real-estate-900 mb-4">
            {isEditing ? 'Редактирование квартиры' : 'Добавление квартиры'}
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
              <Select value={apartmentData.status} onValueChange={(value: 'available' | 'sold' | 'reserved') => setApartmentData(prev => ({ ...prev, status: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Свободна</SelectItem>
                  <SelectItem value="reserved">Бронь</SelectItem>
                  <SelectItem value="sold">Продана</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button
                onClick={startDrawingApartment}
                disabled={(isDrawing || isEditing) || !apartmentData.number}
                className="w-full bg-real-estate-600 hover:bg-real-estate-700"
              >
                <Square className="h-4 w-4 mr-2" />
                Выделить
              </Button>
            </div>
          </div>

          {(isDrawing || isEditing) && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 p-3 bg-real-estate-50 rounded-lg">
                <div className="text-sm text-real-estate-700 flex-1">
                  {isEditing 
                    ? `Редактируйте контуры квартиры ${apartmentData.number}. Точек: ${currentPolygon.length}`
                    : `Кликайте по плану для выделения квартиры ${apartmentData.number}. Точек: ${currentPolygon.length}`
                  }
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={finishDrawing} disabled={saving || currentPolygon.length < 3}>
                    <Save className="h-4 w-4 mr-1" />
                    {saving ? 'Сохранение...' : 'Сохранить'}
                  </Button>
                  <Button size="sm" variant="outline" onClick={cancelDrawing}>
                    <X className="h-4 w-4 mr-1" />
                    Отмена
                  </Button>
                </div>
              </div>
              
              <div className="flex items-center gap-2 p-2 bg-yellow-50 rounded-lg">
                <div className="text-xs text-yellow-700 flex-1">
                  Левый клик - добавить точку, правый клик - удалить последнюю точку
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" onClick={removeLastPoint} disabled={currentPolygon.length === 0}>
                    <RotateCcw className="h-3 w-3" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={clearPolygon} disabled={currentPolygon.length === 0}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Floor Plan Editor */}
      {currentFloorPlan?.image && (
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
                Ctrl + клик или колесико мыши для панорамирования
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
                src={currentFloorPlan.image}
                alt={`Floor ${currentFloor} plan`}
                className="block"
                style={{
                  transform: `scale(${zoom}) translate(${panOffset.x / zoom}px, ${panOffset.y / zoom}px)`,
                  transformOrigin: '0 0',
                  maxWidth: '100%',
                  maxHeight: '600px',
                  objectFit: 'contain'
                }}
              />
              <svg
                ref={svgRef}
                className="absolute top-0 left-0 w-full h-full pointer-events-auto"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                onClick={handleSVGClick}
                onContextMenu={handleSVGContextMenu}
                style={{
                  cursor: (isDrawing || isEditing) ? 'crosshair' : 'default',
                  transform: `scale(${zoom}) translate(${panOffset.x / zoom}px, ${panOffset.y / zoom}px)`,
                  transformOrigin: '0 0'
                }}
              >
                {/* Existing apartments */}
                {currentFloorPlan.apartments.map(apartment => (
                  <g key={apartment.id}>
                    <path
                      d={polygonToPath(apartment.polygon)}
                      className={`${getApartmentClass(apartment.status)} cursor-pointer hover:apartment-hover transition-all ${
                        editingApartmentId === apartment.id ? 'opacity-50' : ''
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        selectApartment(apartment.id);
                      }}
                      style={{
                        strokeWidth: 0.2
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
                        fontSize="1"
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
                      strokeWidth="0.2"
                      strokeDasharray="0.5,0.5"
                    />
                    {currentPolygon.map((point, index) => (
                      <circle
                        key={index}
                        cx={point.x}
                        cy={point.y}
                        r="0.3"
                        fill={getStatusColor(apartmentData.status)}
                        stroke="white"
                        strokeWidth="0.1"
                        className="cursor-pointer hover:opacity-80"
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
                        {apartment.status === 'available' ? 'Свободна' :
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
                    <div className="flex justify-end gap-1 mt-3">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          startEditingApartment(apartment.id);
                        }}
                        className="text-blue-600 hover:bg-blue-50"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
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
