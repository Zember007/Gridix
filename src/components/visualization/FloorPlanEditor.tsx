import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Upload, Plus, Trash2, Edit3, Settings, X, Copy, RefreshCw, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import PolygonCustomizationSettings from './PolygonCustomizationSettings';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import PolygonEditor from './polygon-editor/PolygonEditor';
import ApartmentCustomFields from '@/components/apartment/ApartmentCustomFields';
import ApartmentSyncDialog from '@/components/apartment/ApartmentSyncDialog';
import { useAuth } from '@/contexts/AuthContext';
import { useProject } from '@/hooks/useProjects';
import { useLanguage } from '@/contexts/LanguageContext';
import { getCurrencySymbolSafe } from '@/lib/currency-utils';
import { Apartment as GlobalApartment } from '@/types/apartment';
import type { Json } from '@/integrations/supabase/types';

interface Point {
  x: number;
  y: number;
}

interface ApartmentPhoto {
  id: string;
  apartment_id: string;
  image_url: string;
  description?: string;
  order_index: number;
}

interface Apartment {
  id: string;
  apartment_number: string;
  rooms: number | string;
  area: number;
  price: number;
  status: 'available' | 'sold' | 'reserved';
  polygon: Point[];
  custom_fields: Json | null;
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
    rooms: number | string;
    area: number;
    price: number;
    status: 'available' | 'sold' | 'reserved';
  }>({
    number: '',
    rooms: 0,
    area: 0,
    price: 0,
    status: 'available'
  });
  const [customFieldsData, setCustomFieldsData] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showPolygonEditor, setShowPolygonEditor] = useState(false);
  const [editingPolygon, setEditingPolygon] = useState<Point[]>([]);
  const [polygonSettings, setPolygonSettings] = useState<PolygonSettings | null>(null);
  const [selectedApartment, setSelectedApartment] = useState<Apartment | null>(null);
  const [hoveredApartment, setHoveredApartment] = useState<string | null>(null);
  const [allFloors, setAllFloors] = useState<number[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [apartmentPhotos, setApartmentPhotos] = useState<ApartmentPhoto[]>([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [syncDialogOpen, setSyncDialogOpen] = useState(false);
  const [syncSourceApartment, setSyncSourceApartment] = useState<GlobalApartment | null>(null);
  const [syncTargetApartments, setSyncTargetApartments] = useState<GlobalApartment[]>([]);
  const [newFloorDialogOpen, setNewFloorDialogOpen] = useState(false);
  const [newFloorNumber, setNewFloorNumber] = useState<number>(0);

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
      // Get floors from building_floors table to include all existing floors
      const { data: buildingFloorsData } = await supabase
        .from('building_floors')
        .select('floor_number')
        .eq('project_id', project?.id || projectId)
        .order('floor_number');

      if (buildingFloorsData && buildingFloorsData.length > 0) {
        const existingFloors = buildingFloorsData.map(f => f.floor_number).sort((a, b) => a - b);
        setAllFloors(existingFloors);
      } else if (project) {
        // Fallback to project.floors if no building floors exist
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
        .eq('project_id', project?.id || projectId)
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
        .eq('project_id', project?.id || projectId)
        .eq('floor_number', floorNumber);

      if (error) throw error;

      const transformedApartments: Apartment[] = (data || []).map(apt => ({
        id: apt.id,
        apartment_number: apt.apartment_number,
        rooms: apt.rooms,
        area: Number(apt.area),
        price: Number(apt.price) || 0,
        status: apt.status as 'available' | 'sold' | 'reserved',
        polygon: Array.isArray(apt.polygon) ? apt.polygon as unknown as Point[] : [],
        custom_fields: apt.custom_fields as Json | null
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
        .eq('project_id', project?.id || projectId)
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

  const uploadImage = async (file: File) => {
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
        .eq('project_id', project?.id || projectId)
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
            project_id: project?.id || projectId,
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

  const loadApartmentPhotos = async (apartmentId: string) => {
    try {
      const { data, error } = await supabase
        .from('apartment_photos')
        .select('*')
        .eq('apartment_id', apartmentId)
        .order('order_index', { ascending: true });

      if (error) throw error;
      
      setApartmentPhotos(data || []);
    } catch (error) {
      console.error('Error loading apartment photos:', error);
    }
  };

  const handleApartmentPhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || !editingApartment || editingApartment === 'new') return;

    // Проверяем аутентификацию пользователя
    if (!user) {
      toast.error(t('floorPlan.upload.authRequired'));
      return;
    }

    setUploadingPhotos(true);
    try {
      const uploadPromises = Array.from(files).map(async (file, index) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${editingApartment}-${Date.now()}-${index}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('project-images')
          .upload(`apartments/${fileName}`, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('project-images')
          .getPublicUrl(`apartments/${fileName}`);

        const { error: insertError } = await supabase
          .from('apartment_photos')
          .insert({
            apartment_id: editingApartment,
            image_url: publicUrl,
            order_index: apartmentPhotos.length + index
          });

        if (insertError) throw insertError;
      });

      await Promise.all(uploadPromises);
      toast.success(t('floorPlan.apartments.photoUploadSuccess'));
      loadApartmentPhotos(editingApartment);
    } catch (error) {
      console.error('Error uploading apartment photos:', error);
      toast.error(t('floorPlan.apartments.photoUploadError'));
    } finally {
      setUploadingPhotos(false);
    }
  };

  const handleDeleteApartmentPhoto = async (photoId: string, imageUrl: string) => {
    try {
      const { error: dbError } = await supabase
        .from('apartment_photos')
        .delete()
        .eq('id', photoId);

      if (dbError) throw dbError;

      const fileName = imageUrl.split('/').pop();
      if (fileName) {
        await supabase.storage
          .from('project-images')
          .remove([`apartments/${fileName}`]);
      }

      toast.success(t('floorPlan.apartments.photoDeleteSuccess'));
      if (editingApartment && editingApartment !== 'new') {
        loadApartmentPhotos(editingApartment);
      }
    } catch (error) {
      console.error('Error deleting apartment photo:', error);
      toast.error(t('floorPlan.apartments.photoDeleteError'));
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    await uploadImage(file);
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = async (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(false);

    const files = event.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        await uploadImage(file);
      } else {
        toast.error(t('floorPlan.upload.invalidFileType'));
      }
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
            .eq('project_id', project?.id || projectId)
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
                project_id: project?.id || projectId,
                floor_number: targetFloor,
                image_url: imageUrl,
                polygon_settings: polygonSettings as unknown as Json
              });
          }
        }

        if (apartments.length > 0) {
          // Получаем существующие апартаменты на целевом этаже
          const { data: existingApartments } = await supabase
            .from('apartments')
            .select('id, apartment_number')
            .eq('project_id', project?.id || projectId)
            .eq('floor_number', targetFloor);

          // Создаем Map для быстрого поиска по номеру квартиры
          const existingApartmentsMap = new Map(
            existingApartments?.map(apt => [apt.apartment_number, apt.id]) || []
          );

          for (const apt of apartments) {
            // Генерируем номер квартиры для целевого этажа
            let targetApartmentNumber: string;
            const originalNumber = apt.apartment_number;

            // Если номер уже начинается с номера этажа, заменяем этаж
            if (originalNumber.startsWith(floorNumber.toString())) {
              const apartmentPart = originalNumber.substring(floorNumber.toString().length);
              targetApartmentNumber = `${targetFloor}${apartmentPart}`;
            } else {
              // Иначе добавляем номер этажа в начало
              targetApartmentNumber = `${targetFloor}${originalNumber.padStart(2, '0')}`;
            }

            // Проверяем, существует ли апартамент с таким номером на целевом этаже
            const existingApartmentId = existingApartmentsMap.get(targetApartmentNumber);

            if (existingApartmentId) {
              // Обновляем только polygon существующего апартамента
              try {
                await supabase
                  .from('apartments')
                  .update({
                    polygon: apt.polygon as { x: number; y: number }[]
                  })
                  .eq('id', existingApartmentId);
              } catch (error) {
                console.error('Error updating apartment polygon:', error, {
                  apartmentId: existingApartmentId,
                  apartmentNumber: targetApartmentNumber,
                  targetFloor
                });
              }
            }
            // Если апартамент не существует, игнорируем его (не создаем новый)
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
        // Загружаем кастомные поля
        if (apartment.custom_fields && typeof apartment.custom_fields === 'object' && !Array.isArray(apartment.custom_fields)) {
          setCustomFieldsData(apartment.custom_fields as Record<string, unknown>);
        } else {
          setCustomFieldsData({});
        }
        // Загружаем фото апартамента
        loadApartmentPhotos(apartmentId);
        setShowPolygonEditor(true);
      }
    }
    setSelectedApartment(null);
  };

  const handlePolygonSave = async (points: Point[]) => {
    if (!editingApartment || points.length < 3 || !apartmentData.number) {
      toast.error(t('floorPlan.apartments.fillAllFields'));
      return;
    }

    try {
      if (editingApartment === 'new') {
        const { data, error } = await supabase
          .from('apartments')
          .insert({
            project_id: project?.id || projectId,
            floor_number: floorNumber,
            apartment_number: apartmentData.number,
            rooms: apartmentData.rooms,
            area: apartmentData.area,
            price: apartmentData.price,
            status: apartmentData.status,
            polygon: points as unknown as Json,
            custom_fields: customFieldsData as Json
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
          polygon: points,
          custom_fields: data.custom_fields as Json | null
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
            polygon: points as unknown as Json,
            custom_fields: customFieldsData as Json
          })
          .eq('id', existingApartment.id);

        if (error) throw error;

        setApartments(prev => prev.map(apt =>
          apt.id === existingApartment.id
            ? { ...apt, ...apartmentData, polygon: points, custom_fields: customFieldsData as Json }
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
    setCustomFieldsData({});
    setApartmentPhotos([]);
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
      transition: 'all 0.3s ease',
      ...(isHovered && polygonSettings.hoverEffects.glow ? {
        filter: 'drop-shadow(0 0 8px rgba(59, 130, 246, 0.6))'
      } : {})
    };

    return style;
  };

  const handleSettingsChange = (newSettings: PolygonSettings) => {
    setPolygonSettings(newSettings);
  };

  const handleApartmentClick = (apartment: Apartment) => {
    if (editingApartment) return;
    setSelectedApartment(apartment);
  };

  const openSyncDialog = (sourceApartment: Apartment) => {
    // Найти все квартиры с такой же площадью и количеством комнат
    const targetApartments = apartments.filter(apt => 
      apt.id !== sourceApartment.id && 
      apt.area === sourceApartment.area && 
      apt.rooms === sourceApartment.rooms
    );

    if (targetApartments.length === 0) {
      toast.error('Нет квартир с такой же площадью и количеством комнат для синхронизации');
      return;
    }

    // Преобразовать в глобальный тип для диалога
    const globalSourceApartment: GlobalApartment = {
      ...sourceApartment,
      floor_number: floorNumber,
      type: 'apartment' as const,
      project_id: projectId,
      created_at: '',
      updated_at: '',
      floor_plan_id: null
    };

    const globalTargetApartments: GlobalApartment[] = targetApartments.map(apt => ({
      ...apt,
      floor_number: floorNumber,
      type: 'apartment' as const,
      project_id: projectId,
      created_at: '',
      updated_at: '',
      floor_plan_id: null
    }));

    setSyncSourceApartment(globalSourceApartment);
    setSyncTargetApartments(globalTargetApartments);
    setSyncDialogOpen(true);
  };

  const handleCreateNewFloor = async (newFloorNumber: number) => {
    try {
      // Create building floor for visualization
      const { error: buildingFloorError } = await supabase
        .from('building_floors')
        .insert({
          project_id: projectId,
          floor_number: newFloorNumber,
          polygon: [],
          color: '#3b82f6'
        });

      if (buildingFloorError) throw buildingFloorError;

      // Update project floors count if this is higher than current max
      const maxFloor = Math.max(...allFloors, newFloorNumber);
      if (project && maxFloor > project.floors) {
        const { error: projectError } = await supabase
          .from('projects')
          .update({ floors: maxFloor })
          .eq('id', project?.id || projectId);

        if (projectError) throw projectError;
      }

      // Reload floors to include the new one
      await loadProjectFloors();
      
      // Switch to the new floor
      if (onFloorChange) {
        onFloorChange(newFloorNumber);
      }

      toast.success(t('floorManagement.addFloorSuccess', { floor: newFloorNumber }));
    } catch (error) {
      console.error('Error creating new floor:', error);
      toast.error(t('floorManagement.addFloorError'));
    }
  };

  const handleSyncComplete = (updatedApartments: GlobalApartment[]) => {
    // Обновить локальное состояние
    setApartments(prev => 
      prev.map(apt => {
        const updated = updatedApartments.find(updApt => updApt.id === apt.id);
        if (updated) {
          return {
            id: updated.id,
            apartment_number: updated.apartment_number,
            rooms: updated.rooms,
            area: updated.area,
            price: updated.price || 0,
            status: updated.status,
            polygon: updated.polygon,
            custom_fields: updated.custom_fields
          };
        }
        return apt;
      })
    );

    // Сбросить состояние диалога
    setSyncSourceApartment(null);
    setSyncTargetApartments([]);
  };

  const handleDuplicateApartment = async (apartment: Apartment) => {
    try {
      // Генерируем новый номер квартиры с префиксом "Copy"
      const duplicateNumber = `Copy ${apartment.apartment_number}`;
      
      // Проверяем, существует ли уже квартира с таким номером
      let finalNumber = duplicateNumber;
      let counter = 1;
      while (apartments.some(apt => apt.apartment_number === finalNumber)) {
        finalNumber = `${duplicateNumber} (${counter})`;
        counter++;
      }

      const { data, error } = await supabase
        .from('apartments')
        .insert({
          project_id: projectId,
          floor_number: floorNumber,
          apartment_number: finalNumber,
          rooms: apartment.rooms,
          area: apartment.area,
          price: apartment.price,
          status: apartment.status,
          polygon: apartment.polygon as unknown as Json,
          custom_fields: apartment.custom_fields as Json
        })
        .select()
        .single();

      if (error) throw error;

      // Добавляем новую квартиру в локальное состояние
      const newApartment: Apartment = {
        id: data.id,
        apartment_number: data.apartment_number,
        rooms: data.rooms,
        area: Number(data.area),
        price: Number(data.price),
        status: data.status as 'available' | 'sold' | 'reserved',
        polygon: data.polygon as unknown as Point[],
        custom_fields: data.custom_fields as Json | null
      };
      
      setApartments(prev => [...prev, newApartment]);
      toast.success(`Квартира продублирована как "${finalNumber}"`);
    } catch (error) {
      console.error('Error duplicating apartment:', error);
      toast.error('Ошибка при дублировании квартиры');
    }
  };

  const getStatusColorClass = (status: string) => {
    switch (status) {
      case 'sold': return 'bg-red-100 text-red-800';
      case 'reserved': return 'bg-yellow-100 text-yellow-800';
      case 'available': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'sold': return t('floorPlan.apartments.sold');
      case 'reserved': return t('floorPlan.apartments.reserved');
      case 'available': return t('floorPlan.apartments.available');
      default: return status;
    }
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
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <Label htmlFor="apt-number">{t('floorPlan.apartments.number')}</Label>
                <Input
                  id="apt-number"
                  value={apartmentData.number}
                  onChange={(e) => setApartmentData(prev => ({ ...prev, number: e.target.value }))}
                  placeholder={t('floorPlan.apartments.numberPlaceholder')}
                />
              </div>
              <div>
                <Label htmlFor="apt-rooms">{t('floorPlan.apartments.rooms')}</Label>
                <Select
                  value={apartmentData.rooms.toString()}
                  onValueChange={(value) => setApartmentData(prev => ({ ...prev, rooms: value }))}
                >
                  <SelectTrigger id="apt-rooms">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">
                      {t('apartment.studio')}
                    </SelectItem>
                    {[1, 2, 3, 4, 5].map(num => (
                      <SelectItem key={num} value={num.toString()}>
                        {num}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="apt-area">{t('floorPlan.apartments.area')}</Label>
                <Input
                  id="apt-area"
                  type="number"
                  value={apartmentData.area}
                  onChange={(e) => setApartmentData(prev => ({ ...prev, area: parseFloat(e.target.value) || 0 }))}
                />
              </div>
              <div>
                <Label htmlFor="apt-price">{t('floorPlan.apartments.price')}</Label>
                <Input
                  id="apt-price"
                  type="number"
                  value={apartmentData.price}
                  onChange={(e) => setApartmentData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
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

            <ApartmentCustomFields
              projectId={projectId}
              apartmentId={editingApartment === 'new' ? undefined : editingApartment}
              customFieldsData={customFieldsData}
              onCustomFieldsChange={setCustomFieldsData}
            />

            {/* Секция управления фото апартамента */}
            {editingApartment && editingApartment !== 'new' && (
              <div className="mt-6 space-y-4">
                <div className="flex items-center gap-2">
                  <ImageIcon className="h-4 w-4" />
                  <Label className="text-sm font-medium">{t('floorPlan.apartments.photos')}</Label>
                </div>
                
                <div>
                  <Input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleApartmentPhotoUpload}
                    disabled={uploadingPhotos}
                    className="mb-2"
                  />
                  <p className="text-xs text-muted-foreground">
                    {t('floorPlan.apartments.uploadMultiplePhotos')}
                  </p>
                </div>

                {apartmentPhotos.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground border-2 border-dashed border-muted rounded-lg">
                    <ImageIcon className="h-8 w-8 mx-auto mb-2" />
                    <p className="text-sm">{t('floorPlan.apartments.noPhotos')}</p>
                    <p className="text-xs">{t('floorPlan.apartments.noPhotosDesc')}</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {apartmentPhotos.map((photo) => (
                      <div key={photo.id} className="relative group">
                        <img
                          src={photo.image_url}
                          alt={photo.description || 'Фото квартиры'}
                          className="w-full h-24 object-cover rounded-lg"
                        />
                        <Button
                          variant="destructive"
                          size="sm"
                          className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                          onClick={() => handleDeleteApartmentPhoto(photo.id, photo.image_url)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
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
        <Input
          id="floor-image"
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          disabled={loading}
          className="hidden"
        />
        {/* Main editor */}
        <div className="lg:col-span-3 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h3 className="text-lg font-semibold">{t('floorPlan.title')}</h3>
              {onFloorChange && (
                <div className="flex items-center gap-2">
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
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // Set default to next available floor number
                      const maxFloor = allFloors.length > 0 ? Math.max(...allFloors) : 0;
                      setNewFloorNumber(maxFloor + 1);
                      setNewFloorDialogOpen(true);
                    }}
                    className="h-8"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    {t('floorManagement.addFloor')}
                  </Button>
                </div>
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
          {!imageUrl && (
            <Card>
              <CardHeader>
                <CardTitle className="text-md">{t('floorPlan.upload.title')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-3">
                    <Label>{t('floorPlan.upload.floorPlan', { floor: floorNumber })}</Label>

                    <div
                      className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-gray-400 transition-colors"
                      onDragOver={handleDragOver}
                      onDrop={handleDrop}
                    >
                      <div className="text-center">
                        <Upload className="mx-auto h-12 w-12 text-gray-400" />
                        <div className="mt-4">
                          <p className="text-sm font-medium text-gray-900">
                            {t('floorPlan.upload.dragDrop')}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {t('floorPlan.upload.orClickToSelect')}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          className="mt-4"
                          onClick={() => document.getElementById('floor-image')?.click()}
                          disabled={loading}
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          {t('floorPlan.upload.selectImage')}
                        </Button>
                      </div>
                    </div>


                  </div>
                  {loading && <p className="text-sm text-gray-600">{t('floorPlan.upload.loading')}</p>}
                </div>
              </CardContent>
            </Card>
          )}

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
                          <span className="text-sm text-gray-600">{apartment.rooms} {t('floorPlan.apartments.roomsShort')}, {apartment.area} м²</span>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDuplicateApartment(apartment)}
                            disabled={!!editingApartment}
                            title="Дублировать квартиру"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openSyncDialog(apartment)}
                            disabled={!!editingApartment}
                            title="Синхронизировать с квартирами той же площади и планировки"
                          >
                            <RefreshCw className="h-3 w-3" />
                          </Button>
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
                <div
                  className="relative inline-block max-w-full"
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <img
                    src={imageUrl}
                    alt={`Floor ${floorNumber} plan`}
                    className={`max-w-full max-h-[600px] object-contain rounded-lg transition-all duration-200 ${isDragOver ? 'opacity-50 scale-95' : ''
                      }`}
                    onLoad={() => console.log('Floor plan image loaded successfully')}
                    onError={(e) => {
                      console.error('Floor plan image failed to load:', e);
                      toast.error(t('floorPlan.image.loadError'));
                    }}
                  />

                  {/* Drag Overlay */}
                  {isDragOver && (
                    <div className="absolute inset-0 bg-blue-500/20 border-2 border-dashed border-blue-500 rounded-lg flex items-center justify-center">
                      <div className="text-center text-blue-700">
                        <Upload className="mx-auto h-8 w-8 mb-2" />
                        <p className="text-sm font-medium">{t('floorPlan.upload.dropToReplace')}</p>
                      </div>
                    </div>
                  )}

                  {/* Change Image Button */}
                  <div className="absolute top-2 right-2 z-10">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => document.getElementById('floor-image')?.click()}
                      disabled={loading}
                      className="bg-white/90 hover:bg-white shadow-md"
                      title={t('floorPlan.upload.changeImage')}
                    >
                      <Upload className="h-4 w-4" />
                    </Button>
                  </div>
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
                                  <span>{apartment.rooms === 0 ? t('apartment.studio') : apartment.rooms}</span>
                                  <span className="text-gray-600">{t('floorPlan.apartments.area')}:</span>
                                  <span>{apartment.area} м²</span>
                                  {apartment.price > 0 && (
                                    <>
                                      <span className="text-gray-600">{t('floorPlan.apartments.price')}:</span>
                                      <span>{new Intl.NumberFormat('en-US').format(apartment.price)} {getCurrencySymbolSafe(project?.currency)}</span>
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
                <span className="font-medium">{selectedApartment.rooms === 0 ? t('apartment.studio') : selectedApartment.rooms}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{t('floorPlan.apartments.area')}:</span>
                <span className="font-medium">{selectedApartment.area} м²</span>
              </div>
              {selectedApartment.price > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{t('floorPlan.apartments.price')}:</span>
                  <span className="font-bold">{new Intl.NumberFormat('en-US').format(selectedApartment.price)} {getCurrencySymbolSafe(project?.currency)}</span>
                </div>
              )}
              <div className="pt-2 border-t space-y-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDuplicateApartment(selectedApartment)}
                  className="w-full"
                  disabled={!!editingApartment}
                >
                  <Copy className="h-3 w-3 mr-1" />
                  Дублировать
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openSyncDialog(selectedApartment)}
                  className="w-full"
                  disabled={!!editingApartment}
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Синхронизировать
                </Button>
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

      {/* Диалог синхронизации */}
      <ApartmentSyncDialog
        open={syncDialogOpen}
        onOpenChange={setSyncDialogOpen}
        sourceApartment={syncSourceApartment}
        targetApartments={syncTargetApartments}
        onSyncComplete={handleSyncComplete}
        getStatusColor={getStatusColorClass}
        getStatusLabel={getStatusLabel}
      />

      {/* New Floor Dialog */}
      <Dialog open={newFloorDialogOpen} onOpenChange={setNewFloorDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('floorManagement.addFloor')}</DialogTitle>
            <DialogDescription>
              {t('floorManagement.description')}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="new-floor-number">{t('floorManagement.floorNumber')}</Label>
              <Input
                id="new-floor-number"
                type="number"
                value={newFloorNumber}
                onChange={(e) => setNewFloorNumber(parseInt(e.target.value) || 0)}
                placeholder="0"
                className="mt-1"
              />
            </div>
            
            <div className="flex gap-2 pt-4">
              <Button
                onClick={() => {
                  handleCreateNewFloor(newFloorNumber);
                  setNewFloorDialogOpen(false);
                }}
                className="flex-1"
                disabled={allFloors.includes(newFloorNumber)}
              >
                <Plus className="h-4 w-4 mr-2" />
                {t('floorManagement.add')}
              </Button>
              <Button
                variant="outline"
                onClick={() => setNewFloorDialogOpen(false)}
                className="flex-1"
              >
                {t('apartmentsManager.cancel')}
              </Button>
            </div>
            
            {allFloors.includes(newFloorNumber) && (
              <p className="text-sm text-red-600">
                {t('floorManagement.floorAlreadyExists', { floor: newFloorNumber })}
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
};

export default FloorPlanEditor;
