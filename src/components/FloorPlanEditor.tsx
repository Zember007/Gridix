import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Upload, Plus, Trash2, Edit3, Settings, X, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';
import PolygonCustomizationSettings from './PolygonCustomizationSettings';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import PolygonEditor from './polygon-editor/PolygonEditor';
import { useAuth } from '@/contexts/AuthContext';
import { useProject } from '@/hooks/useProjects';
import { useLanguage } from '@/contexts/LanguageContext';

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
  onFloorChange?: (floor: number) => void;
}

const FloorPlanEditor = ({ projectId, floorNumber, onFloorChange }: FloorPlanEditorProps) => {
  const [imageUrl, setImageUrl] = useState<string>('');
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [editingApartment, setEditingApartment] = useState<string | null>(null);
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
  const [fieldErrors, setFieldErrors] = useState<{
    number: boolean;
    rooms: boolean;
    area: boolean;
    price: boolean;
  }>({
    number: false,
    rooms: false,
    area: false,
    price: false
  });
  const [loading, setLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showPolygonEditor, setShowPolygonEditor] = useState(false);
  const [editingPolygon, setEditingPolygon] = useState<Point[]>([]);
  const [polygonSettings, setPolygonSettings] = useState<PolygonSettings | null>(null);
  const [selectedApartment, setSelectedApartment] = useState<Apartment | null>(null);
  const [hoveredApartment, setHoveredApartment] = useState<string | null>(null);
  const [allFloors, setAllFloors] = useState<number[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const { project } = useProject(projectId);
  const { t } = useLanguage();

  useEffect(() => {
    loadFloorPlan();
    loadApartments();
    loadPolygonSettings();
    loadProjectFloors();
  }, [projectId, floorNumber, project]);

  const loadProjectFloors = async () => {
    try {
      if (project) {
        const floors = Array.from({ length: project.floors }, (_, i) => i + 1);
        setAllFloors(floors);
      }
    } catch (error) {
      console.error('Error loading project floors:', error);
    }
  };

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
      } else {
        setImageUrl('');
      }
    } catch (error) {
      console.error('Error loading floor plan:', error);
      toast.error(t('floorPlan.loadFloorPlanError'));
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
      toast.error(t('floorPlan.loadApartmentsError'));
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
      } else {
        const defaultSettings: PolygonSettings = {
          colors: {
            available: '#22c55e',
            sold: '#ef4444',
            reserved: '#f59e0b'
          },
          hoverEffects: {
            scale: false,
            colorChange: true,
            opacityChange: true,
            glow: true
          },
          display: {
            showNumbers: true,
            showTooltip: true,
            showArea: false,
            showPrice: false
          },
          opacity: {
            normal: 0.4,
            hover: 0.7
          }
        };
        setPolygonSettings(defaultSettings);
      }
    } catch (error) {
      console.error('Error loading polygon settings:', error);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Проверяем аутентификацию пользователя
    if (!user) {
      toast.error(t('floorPlan.upload.authRequired'));
      return;
    }

    setLoading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${projectId}/floor-${floorNumber}-${Date.now()}.${fileExt}`;

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
                  const { error: updateError } = await supabase
            .from('floor_plans')
            .update({
              image_url: newImageUrl,
              polygon_settings: polygonSettings as unknown as Json
            })
            .eq('id', existingPlan.id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('floor_plans')
          .insert({
            project_id: projectId,
            floor_number: floorNumber,
            image_url: newImageUrl,
            polygon_settings: polygonSettings as unknown as Json
          });

        if (insertError) throw insertError;
      }

      toast.success(t('floorPlan.upload.success'));
    } catch (error) {
      console.error('Error uploading floor plan:', error);
      toast.error(t('floorPlan.upload.error'));
    } finally {
      setLoading(false);
    }
  };

  const duplicateToAllFloors = async () => {
    if (!imageUrl && apartments.length === 0) {
      toast.error(t('floorPlan.duplicate.noData'));
      return;
    }

    setLoading(true);
    try {
      const floorsToUpdate = allFloors.filter(f => f !== floorNumber);

      for (const targetFloor of floorsToUpdate) {
        if (imageUrl) {
          const { data: existingPlan } = await supabase
            .from('floor_plans')
            .select('id')
            .eq('project_id', projectId)
            .eq('floor_number', targetFloor)
            .maybeSingle();

          if (existingPlan) {
            await supabase
              .from('floor_plans')
              .update({
                image_url: imageUrl,
                polygon_settings: polygonSettings as unknown as Json
              })
              .eq('id', existingPlan.id);
          } else {
            await supabase
              .from('floor_plans')
              .insert({
                project_id: projectId,
                floor_number: targetFloor,
                image_url: imageUrl,
                polygon_settings: polygonSettings as unknown as Json
              });
          }
        }

        if (apartments.length > 0) {
          // Удаляем существующие квартиры на целевом этаже
          await supabase
            .from('apartments')
            .delete()
            .eq('project_id', projectId)
            .eq('floor_number', targetFloor);

          // Получаем все существующие номера квартир в проекте для проверки уникальности
          const { data: existingApartments } = await supabase
            .from('apartments')
            .select('apartment_number')
            .eq('project_id', projectId);
          
          const existingNumbers = new Set(existingApartments?.map(apt => apt.apartment_number) || []);

          for (const apt of apartments) {
            // Улучшенная логика генерации номера квартиры
            let newApartmentNumber: string;
            
            // Пытаемся сначала создать номер в формате этаж + номер квартиры
            const originalNumber = apt.apartment_number;
            
            // Если номер уже начинается с номера этажа, заменяем этаж
            if (originalNumber.startsWith(floorNumber.toString())) {
              const apartmentPart = originalNumber.substring(floorNumber.toString().length);
              newApartmentNumber = `${targetFloor}${apartmentPart}`;
            } else {
              // Иначе добавляем номер этажа в начало
              newApartmentNumber = `${targetFloor}${originalNumber.padStart(2, '0')}`;
            }

            // Проверяем уникальность и при необходимости генерируем новый номер
            let counter = 1;
            let finalApartmentNumber = newApartmentNumber;
            while (existingNumbers.has(finalApartmentNumber)) {
              finalApartmentNumber = `${targetFloor}${originalNumber.padStart(2, '0')}_${counter}`;
              counter++;
            }

            // Добавляем новый номер в набор для следующих проверок
            existingNumbers.add(finalApartmentNumber);

            try {
              await supabase
                .from('apartments')
                .insert({
                  project_id: projectId,
                  floor_number: targetFloor,
                  apartment_number: finalApartmentNumber,
                  rooms: apt.rooms,
                  area: apt.area,
                  price: apt.price,
                  status: apt.status,
                  polygon: apt.polygon as unknown as Json
                });
            } catch (error) {
              console.error('Error inserting apartment:', error, {
                apartmentNumber: finalApartmentNumber,
                targetFloor,
                originalNumber
              });
            }
          }
        }
      }

      toast.success(t('floorPlan.duplicate.success'));
    } catch (error) {
      console.error('Error duplicating to all floors:', error);
      toast.error(t('floorPlan.duplicate.error'));
    } finally {
      setLoading(false);
    }
  };

  const startEditingApartment = (apartmentId: string | null) => {
    // Очищаем ошибки при начале редактирования
    setFieldErrors({
      number: false,
      rooms: false,
      area: false,
      price: false
    });

    if (apartmentId === 'new') {
      setEditingApartment('new');
      setApartmentData({
        number: '',
        rooms: 1,
        area: 0,
        price: 0,
        status: 'available'
      });
      setEditingPolygon([]);
      setShowPolygonEditor(true);
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
        setEditingPolygon(apartment.polygon);
        setShowPolygonEditor(true);
      }
    }
    setSelectedApartment(null);
  };

  const validateFields = () => {
    const errors = {
      number: !apartmentData.number.trim(),
      rooms: apartmentData.rooms < 0,
      area: apartmentData.area <= 0,
      price: apartmentData.price < 0
    };
    
    setFieldErrors(errors);
    return !Object.values(errors).some(error => error);
  };

  const handlePolygonSave = async (points: Point[]) => {
    if (!editingApartment || points.length < 3) {
      toast.error(t('floorPlan.apartments.fillAllFields'));
      return;
    }

    if (!validateFields()) {
      toast.error(t('floorPlan.apartments.fillAllFields'));
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
            polygon: points as unknown as Json
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
          polygon: points
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
            polygon: points as unknown as Json
          })
          .eq('id', existingApartment.id);

        if (error) throw error;

        setApartments(prev => prev.map(apt =>
          apt.id === existingApartment.id
            ? { ...apt, ...apartmentData, polygon: points }
            : apt
        ));
      }

      resetEditing();
      toast.success(t('floorPlan.apartments.saveSuccess'));
    } catch (error) {
      console.error('Error saving apartment:', error);
      toast.error(t('floorPlan.apartments.saveError'));
    }
  };

  const handlePolygonCancel = () => {
    resetEditing();
  };

  const deleteApartment = async (apartmentId: string) => {
    try {
      const { error } = await supabase
        .from('apartments')
        .delete()
        .eq('id', apartmentId);

      if (error) throw error;

      setApartments(prev => prev.filter(apt => apt.id !== apartmentId));
      toast.success(t('floorPlan.apartments.deleteSuccess'));
    } catch (error) {
      console.error('Error deleting apartment:', error);
      toast.error(t('floorPlan.apartments.deleteError'));
    }
  };

  const resetEditing = () => {
    setEditingApartment(null);
    setEditingPolygon([]);
    setShowPolygonEditor(false);
    setApartmentData({
      number: '',
      rooms: 1,
      area: 0,
      price: 0,
      status: 'available'
    });
    setFieldErrors({
      number: false,
      rooms: false,
      area: false,
      price: false
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

    const style: React.CSSProperties = {
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
          <h3 className="text-lg font-semibold">{t('floorPlan.settings.title', { floor: floorNumber })}</h3>
          <Button
            variant="outline"
            onClick={() => setShowSettings(false)}
          >
            {t('floorPlan.settings.backToEditor')}
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

  if (showPolygonEditor) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">
            {editingApartment === 'new' 
              ? t('floorPlan.apartments.newApartment') 
              : t('floorPlan.apartments.editApartment', { number: apartmentData.number })
            }
          </h3>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-md">{t('floorPlan.apartments.parameters')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="apt-number" className={fieldErrors.number ? "text-red-500" : ""}>
                  {t('floorPlan.apartments.number')}
                </Label>
                <Input
                  id="apt-number"
                  value={apartmentData.number}
                  onChange={(e) => setApartmentData(prev => ({ ...prev, number: e.target.value }))}
                  placeholder={t('floorPlan.apartments.numberPlaceholder')}
                  className={fieldErrors.number ? "border-red-500 focus:border-red-500" : ""}
                />
              </div>
              <div>
                <Label htmlFor="apt-rooms" className={fieldErrors.rooms ? "text-red-500" : ""}>
                  {t('floorPlan.apartments.rooms')}
                </Label>
                <Select
                  value={apartmentData.rooms.toString()}
                  onValueChange={(value) => setApartmentData(prev => ({ ...prev, rooms: parseInt(value) }))}
                >
                  <SelectTrigger id="apt-rooms" className={fieldErrors.rooms ? "border-red-500 focus:border-red-500" : ""}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">{t('floorPlan.apartments.studio')}</SelectItem>
                    {[1, 2, 3, 4, 5].map(num => (
                      <SelectItem key={num} value={num.toString()}>
                        {num}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="apt-area" className={fieldErrors.area ? "text-red-500" : ""}>
                  {t('floorPlan.apartments.area')}
                </Label>
                <Input
                  id="apt-area"
                  type="number"
                  value={apartmentData.area}
                  onChange={(e) => setApartmentData(prev => ({ ...prev, area: parseFloat(e.target.value) || 0 }))}
                  className={fieldErrors.area ? "border-red-500 focus:border-red-500" : ""}
                />
              </div>
              <div>
                <Label htmlFor="apt-price" className={fieldErrors.price ? "text-red-500" : ""}>
                  {t('floorPlan.apartments.price')}
                </Label>
                <Input
                  id="apt-price"
                  type="number"
                  value={apartmentData.price}
                  onChange={(e) => setApartmentData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                  className={fieldErrors.price ? "border-red-500 focus:border-red-500" : ""}
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="apt-status">{t('floorPlan.apartments.status')}</Label>
                <Select
                  value={apartmentData.status}
                  onValueChange={(value: 'available' | 'sold' | 'reserved') => setApartmentData(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger id="apt-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">{t('floorPlan.apartments.available')}</SelectItem>
                    <SelectItem value="reserved">{t('floorPlan.apartments.reserved')}</SelectItem>
                    <SelectItem value="sold">{t('floorPlan.apartments.sold')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <PolygonEditor
          imageUrl={imageUrl}
          existingPolygons={editingPolygon}
          onSave={handlePolygonSave}
          onCancel={handlePolygonCancel}
          polygonColor={getStatusColor(apartmentData.status)}
        />
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main editor */}
        <div className="lg:col-span-3 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h3 className="text-lg font-semibold">{t('floorPlan.title')}</h3>
              {onFloorChange && allFloors.length > 1 && (
                <Select
                  value={floorNumber.toString()}
                  onValueChange={(value) => onFloorChange(parseInt(value))}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {allFloors.map(floor => (
                      <SelectItem key={floor} value={floor.toString()}>
                        {t('floorPlan.title')} {floor}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={duplicateToAllFloors}
                disabled={loading || (!imageUrl && apartments.length === 0)}
              >
                <Copy className="h-4 w-4 mr-2" />
                {t('floorPlan.duplicateToAllFloors')}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowSettings(true)}
              >
                <Settings className="h-4 w-4 mr-2" />
                {t('floorPlan.settings')}
              </Button>
            </div>
          </div>

          {/* Image Upload */}
          <Card>
            <CardHeader>
              <CardTitle className="text-md">{t('floorPlan.upload.title')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="floor-image">{t('floorPlan.upload.floorPlan', { floor: floorNumber })}</Label>
                  <Input
                    id="floor-image"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={loading}
                  />
                </div>
                {loading && <p className="text-sm text-gray-600">{t('floorPlan.upload.loading')}</p>}
              </div>
            </CardContent>
          </Card>

          {/* Apartment Controls */}
          <Card>
            <CardHeader>
              <CardTitle className="text-md">{t('floorPlan.apartments.title')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button
                  onClick={() => startEditingApartment('new')}
                  disabled={!!editingApartment}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {t('floorPlan.apartments.add')}
                </Button>

                {/* Apartments List */}
                <div className="space-y-2">
                  <h4 className="font-medium">{t('floorPlan.apartments.list')}</h4>
                  <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto">
                    {apartments.map(apartment => (
                      <div key={apartment.id} className="flex items-center justify-between p-2 border rounded">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">№{apartment.apartment_number}</span>
                          <Badge variant={apartment.status === 'available' ? 'default' : apartment.status === 'sold' ? 'destructive' : 'secondary'}>
                            {apartment.status === 'available' ? t('floorPlan.apartments.available') : apartment.status === 'sold' ? t('floorPlan.apartments.sold') : t('floorPlan.apartments.reserved')}
                          </Badge>
                          <span className="text-sm text-gray-600">
                            {apartment.rooms === 0 ? t('floorPlan.apartments.studio') : `${apartment.rooms} ${t('floorPlan.apartments.roomsShort')}`}, {apartment.area} м²
                          </span>
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

          {/* Image Viewer */}
          {imageUrl && (
            <Card>
              <CardContent className="p-6">
                <div className="relative inline-block max-w-full">
                  <img
                    src={imageUrl}
                    alt={`Floor ${floorNumber} plan`}
                    className="max-w-full max-h-[600px] object-contain rounded-lg"
                    onLoad={() => console.log('Floor plan image loaded successfully')}
                    onError={(e) => {
                      console.error('Floor plan image failed to load:', e);
                      toast.error(t('floorPlan.image.loadError'));
                    }}
                  />
                  <svg
                    className="absolute top-0 left-0 w-full h-full"
                    viewBox="0 0 100 100"
                    preserveAspectRatio="none"
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
                                  <span className="text-gray-600">{t('floorPlan.apartments.rooms')}:</span>
                                  <span>{apartment.rooms === 0 ? t('floorPlan.apartments.studio') : apartment.rooms}</span>
                                  <span className="text-gray-600">{t('floorPlan.apartments.area')}:</span>
                                  <span>{apartment.area} м²</span>
                                  {apartment.price > 0 && (
                                    <>
                                      <span className="text-gray-600">{t('floorPlan.apartments.price')}:</span>
                                      <span>{new Intl.NumberFormat('ru-RU').format(apartment.price)} ₽</span>
                                    </>
                                  )}
                                  <span className="text-gray-600">{t('floorPlan.apartments.status')}:</span>
                                  <Badge variant={apartment.status === 'available' ? 'default' : apartment.status === 'sold' ? 'destructive' : 'secondary'}>
                                    {apartment.status === 'available' ? t('floorPlan.apartments.available') : apartment.status === 'sold' ? t('floorPlan.apartments.sold') : t('floorPlan.apartments.reserved')}
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
                  </svg>
                </div>
              </CardContent>
            </Card>
          )}
        </div>


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
                <span className="text-sm text-gray-600">{t('floorPlan.apartments.status')}:</span>
                <Badge variant={selectedApartment.status === 'available' ? 'default' : selectedApartment.status === 'sold' ? 'destructive' : 'secondary'}>
                  {selectedApartment.status === 'available' ? t('floorPlan.apartments.available') : selectedApartment.status === 'sold' ? t('floorPlan.apartments.sold') : t('floorPlan.apartments.reserved')}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{t('floorPlan.apartments.rooms')}:</span>
                <span className="font-medium">{selectedApartment.rooms === 0 ? t('floorPlan.apartments.studio') : selectedApartment.rooms}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{t('floorPlan.apartments.area')}:</span>
                <span className="font-medium">{selectedApartment.area} м²</span>
              </div>
              {selectedApartment.price > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{t('floorPlan.apartments.price')}:</span>
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
                  {t('buildingImage.floors.edit')}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </TooltipProvider>
  );
};

export default FloorPlanEditor;
