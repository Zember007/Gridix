import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Edit2, Trash2, Save, X, Search, Copy, RefreshCw, Building, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import ApartmentCustomFields from '@/components/apartment/ApartmentCustomFields';
import ApartmentSyncDialog from '@/components/apartment/ApartmentSyncDialog';
import { Apartment, normalizeApartmentData } from '@/types/apartment';
import type { Json } from '@/integrations/supabase/types';
import { useLanguage } from '@/contexts/LanguageContext';
import { useProject } from '@/hooks/useProjects';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ADMIN_THEME } from '@/lib/admin-theme-config';

interface ProjectApartmentsManagerProps {
  projectId: string;
  projectType?: 'building' | 'object' | null;
}

// Helper function to convert database polygon to our type
const convertPolygonFromDb = (polygon: Json | null): { x: number; y: number }[] => {
  if (!polygon || !Array.isArray(polygon)) return [];
  return polygon.map((point: Json) => ({
    x: typeof point === 'object' && point !== null && 'x' in point && typeof point.x === 'number' ? point.x : 0,
    y: typeof point === 'object' && point !== null && 'y' in point && typeof point.y === 'number' ? point.y : 0
  }));
};

// Helper function to convert our polygon type to database type
const convertPolygonToDb = (polygon: { x: number; y: number }[]): Json => {
  return polygon as Json;
};

const ProjectApartmentsManager = ({ projectId, projectType }: ProjectApartmentsManagerProps) => {
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [filteredApartments, setFilteredApartments] = useState<Apartment[]>([]);
  const [editingApartment, setEditingApartment] = useState<Apartment | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFloor, setSelectedFloor] = useState<number | null>(null);
  const [customFieldsData, setCustomFieldsData] = useState<Record<string, unknown>>({});
  const [currentType, setCurrentType] = useState<'apartment' | 'commercial' | 'parking'>('apartment');
  const [syncDialogOpen, setSyncDialogOpen] = useState(false);
  const [syncSourceApartment, setSyncSourceApartment] = useState<Apartment | null>(null);
  const [syncTargetApartments, setSyncTargetApartments] = useState<Apartment[]>([]);
  const [floorManagementOpen, setFloorManagementOpen] = useState(false);
  const [newFloorNumber, setNewFloorNumber] = useState<number>(1);
  const { t } = useLanguage();
  const { project } = useProject(projectId);

  const [newApartment, setNewApartment] = useState<Partial<Apartment>>({
    apartment_number: '',
    floor_number: 1,
    rooms: 0,
    area: 0,
    price: null,
    status: 'available',
    type: 'apartment',
    polygon: [],
    custom_fields: {}
  });

  const loadApartments = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('apartments')
        .select('*')
        .eq('project_id', projectId)
        .order('apartment_number');

      if (error) throw error;

      // Use the normalizeApartmentData function to ensure proper type casting
      const formattedApartments = data.map(normalizeApartmentData);
      setApartments(formattedApartments);
    } catch (error) {
      console.error('Error loading apartments:', error);
      toast.error(t('apartmentsManager.loadError'));
    } finally {
      setLoading(false);
    }
  }, [projectId, t]);

  useEffect(() => {
    loadApartments();
  }, [loadApartments]);

  useEffect(() => {
    // Update newApartment type when currentType changes
    setNewApartment(prev => ({ ...prev, type: currentType }));
  }, [currentType]);

  useEffect(() => {
    // Filter apartments based on search term, type, and floor
    const filtered = apartments.filter(apartment => {
      const matchesType = apartment.type === currentType;
      
      // Filter by floor if selected
      const matchesFloor = selectedFloor === null || apartment.floor_number === selectedFloor;
      
      // Search by apartment number, status, area, and price
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = searchTerm === '' || 
        apartment.apartment_number.toLowerCase().includes(searchLower) ||
        apartment.status.toLowerCase().includes(searchLower) ||
        apartment.area.toString().includes(searchTerm) ||
        (apartment.price !== null && apartment.price.toString().includes(searchTerm));

      return matchesType && matchesFloor && matchesSearch;
    });
    setFilteredApartments(filtered);
  }, [apartments, searchTerm, currentType, selectedFloor]);

  const handleSaveApartment = async (apartmentData: Partial<Apartment>, isNew: boolean = false) => {
    if (!apartmentData.apartment_number?.trim()) {
      toast.error(t('apartmentsManager.numberRequired'));

      return;
    }

    if (apartmentData.floor_number === undefined || apartmentData.floor_number < 0) {
      toast.error(t('apartmentsManager.floorRequired'));
      return;
    }

    try {
      const saveData = {
        apartment_number: apartmentData.apartment_number.trim(),
        floor_number: apartmentData.floor_number,
        rooms: currentType === 'apartment' ? String(apartmentData.rooms || 0) : currentType,
        area: apartmentData.area || 0,
        price: apartmentData.price ?? null,
        status: apartmentData.status || 'available',
        polygon: convertPolygonToDb(apartmentData.polygon || []),
        custom_fields: customFieldsData as Json,
        project_id: projectId,
        updated_at: new Date().toISOString(),
        type: currentType
      };


      if (isNew) {
        const { data, error } = await supabase
          .from('apartments')
          .insert(saveData)
          .select()
          .single();

        

        if (error) throw error;

        // Use normalizeApartmentData to ensure proper type casting
        const newApt = normalizeApartmentData(data);
        setApartments(prev => [...prev, newApt]);
        setIsAddingNew(false);
        setNewApartment({
          apartment_number: '',
          floor_number: 1,
          rooms: 0,
          area: 0,
          price: null,
          status: 'available',
          polygon: [],
          custom_fields: {}
        });
        toast.success(t('apartmentsManager.saveSuccess'));
      } else if (editingApartment) {
        const { data, error } = await supabase
          .from('apartments')
          .update(saveData)
          .eq('id', editingApartment.id)
          .select()
          .single();

        

        if (error) throw error;

        // Use normalizeApartmentData to ensure proper type casting
        const updatedApt = normalizeApartmentData(data);
        setApartments(prev =>
          prev.map(apt => apt.id === editingApartment.id ? updatedApt : apt)
        );
        setEditingApartment(null);
        toast.success(t('apartmentsManager.updateSuccess'));
      }

      setCustomFieldsData({});
    } catch (error) {
      console.error('Error saving apartment:', error);
      toast.error(t('apartmentsManager.saveError'));
    }
  };

  const handleDeleteApartment = async (apartmentId: string) => {
    if (!confirm(t('apartmentsManager.deleteConfirm'))) return;

    try {
      const { error } = await supabase
        .from('apartments')
        .delete()
        .eq('id', apartmentId);

      if (error) throw error;

      setApartments(prev => prev.filter(apt => apt.id !== apartmentId));
      toast.success(t('apartmentsManager.deleteSuccess'));
    } catch (error) {
      console.error('Error deleting apartment:', error);
      toast.error(t('apartmentsManager.deleteError'));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sold': return 'bg-red-100 text-red-800';
      case 'reserved': return 'bg-yellow-100 text-yellow-800';
      case 'available': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'sold': return t('apartmentsManager.sold');
      case 'reserved': return t('apartmentsManager.reserved');
      case 'available': return t('apartmentsManager.available');
      default: return status;
    }
  };

  const openSyncDialog = (sourceApartment: Apartment) => {
    // Найти все квартиры с такой же площадью и количеством комнат
    const targetApartments = apartments.filter(apt =>
      apt.id !== sourceApartment.id &&
      apt.area === sourceApartment.area &&
      apt.rooms === sourceApartment.rooms &&
      apt.type === sourceApartment.type
    );

    if (targetApartments.length === 0) {
      toast.error(t('apartmentsManager.syncError'));
      return;
    }

    setSyncSourceApartment(sourceApartment);
    setSyncTargetApartments(targetApartments);
    setSyncDialogOpen(true);
  };

  const handleSyncComplete = (updatedApartments: Apartment[]) => {
    // Обновить локальное состояние
    setApartments(prev =>
      prev.map(apt => {
        const updated = updatedApartments.find(updApt => updApt.id === apt.id);
        return updated || apt;
      })
    );

    // Сбросить состояние диалога
    setSyncSourceApartment(null);
    setSyncTargetApartments([]);
  };

  const handleDuplicateApartment = async (apartment: Apartment) => {
    try {
      // Генерируем новый номер квартиры с префиксом "Копия"
      const duplicateNumber = `Copy ${apartment.apartment_number}`;

      // Проверяем, существует ли уже квартира с таким номером
      let finalNumber = duplicateNumber;
      let counter = 1;
      while (apartments.some(apt => apt.apartment_number === finalNumber)) {
        finalNumber = `${duplicateNumber} (${counter})`;
        counter++;
      }

      const duplicateData = {
        apartment_number: finalNumber,
        floor_number: apartment.floor_number,
        rooms: String(apartment.rooms),
        area: apartment.area,
        price: apartment.price,
        status: apartment.status,
        polygon: convertPolygonToDb(apartment.polygon || []),
        custom_fields: apartment.custom_fields as Json,
        project_id: projectId,
        type: apartment.type,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('apartments')
        .insert(duplicateData)
        .select()
        .single();

      if (error) throw error;

      // Добавляем новую квартиру в локальное состояние
      const newApt = normalizeApartmentData(data);
      setApartments(prev => [...prev, newApt]);

      toast.success(`Квартира продублирована как "${finalNumber}"`);
    } catch (error) {
      console.error('Error duplicating apartment:', error);
      toast.error('Ошибка при дублировании квартиры');
    }
  };

  const getUniqueFloors = useCallback(() => {
    return [...new Set(apartments.map(apt => apt.floor_number))].sort((a, b) => a - b);
  }, [apartments]);

  const handleDeleteFloor = async (floorNumber: number) => {
    const apartmentsOnFloor = apartments.filter(apt => apt.floor_number === floorNumber);

    if (apartmentsOnFloor.length > 0) {
      if (!confirm(t('floorManagement.deleteFloorWithApartmentsConfirm', { floor: floorNumber, count: apartmentsOnFloor.length }))) {
        return;
      }
    } else {
      if (!confirm(t('floorManagement.deleteFloorConfirm', { floor: floorNumber }))) {
        return;
      }
    }

    try {
      // Delete all apartments on this floor
      if (apartmentsOnFloor.length > 0) {
        const { error: apartmentsError } = await supabase
          .from('apartments')
          .delete()
          .eq('project_id', projectId)
          .eq('floor_number', floorNumber);

        if (apartmentsError) throw apartmentsError;
      }

      // Delete building floor visualization
      const { error: buildingFloorError } = await supabase
        .from('building_floors')
        .delete()
        .eq('project_id', projectId)
        .eq('floor_number', floorNumber);

      if (buildingFloorError) throw buildingFloorError;

      // Delete floor plan
      const { error: floorPlanError } = await supabase
        .from('floor_plans')
        .delete()
        .eq('project_id', projectId)
        .eq('floor_number', floorNumber);

      if (floorPlanError) throw floorPlanError;

      // Update project floors count if this was the highest floor
      const maxFloor = Math.max(...getUniqueFloors().filter(f => f !== floorNumber));
      if (project && floorNumber === project.floors) {
        const { error: projectError } = await supabase
          .from('projects')
          .update({ floors: maxFloor || 1 })
          .eq('id', projectId);

        if (projectError) throw projectError;
      }

      // Update local state
      setApartments(prev => prev.filter(apt => apt.floor_number !== floorNumber));

      toast.success(t('floorManagement.deleteFloorSuccess', { floor: floorNumber }));
    } catch (error) {
      console.error('Error deleting floor:', error);
      toast.error(t('floorManagement.deleteFloorError'));
    }
  };

  const handleAddFloor = async () => {
    if (newFloorNumber === undefined || newFloorNumber < 0) {
      toast.error(t('floorManagement.invalidFloorNumber'));
      return;
    }

    const existingFloors = getUniqueFloors();
    if (existingFloors.includes(newFloorNumber)) {
      toast.error(t('floorManagement.floorAlreadyExists', { floor: newFloorNumber }));
      return;
    }

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
      const maxFloor = Math.max(...existingFloors, newFloorNumber);
      if (project && maxFloor > project.floors) {
        const { error: projectError } = await supabase
          .from('projects')
          .update({ floors: maxFloor })
          .eq('id', projectId);

        if (projectError) throw projectError;
      }

      setNewFloorNumber(maxFloor + 1);
      toast.success(t('floorManagement.addFloorSuccess', { floor: newFloorNumber }));
    } catch (error) {
      console.error('Error adding floor:', error);
      toast.error(t('floorManagement.addFloorError'));
    }
  };

  const renderApartmentForm = (apartment: Partial<Apartment>, isNew: boolean = false) => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="apartment_number">
            {projectType === 'object' ? 'Object Number *' : (currentType === 'apartment' ? t('apartmentsManager.apartmentNumber') : t('apartmentsManager.name'))}
          </Label>
          <Input
            id="apartment_number"
            value={apartment.apartment_number || ''}
            onChange={(e) => {
              if (isNew) {
                setNewApartment(prev => ({ ...prev, apartment_number: e.target.value }));
              } else {
                setEditingApartment(prev => prev ? { ...prev, apartment_number: e.target.value } : null);
              }
            }}
          />
        </div>
        {projectType !== 'object' && (
          <div>
            <Label htmlFor="floor_number">{t('apartmentsManager.floorNumber')}</Label>
            <Input
              id="floor_number"
              type="number"
              value={apartment.floor_number}
              onChange={(e) => {
                const value = parseInt(e.target.value);
                if (isNew) {
                  setNewApartment(prev => ({ ...prev, floor_number: value }));
                } else {
                  setEditingApartment(prev => prev ? { ...prev, floor_number: value } : null);
                }
              }}
            />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {currentType === 'apartment' && (
          <div>
            <Label htmlFor="rooms">{t('apartmentsManager.rooms')}</Label>
            <Select
              value={apartment.rooms?.toString() || '0'}
              onValueChange={(value) => {
                const roomsValue = value|| 0;
                if (isNew) {
                  setNewApartment(prev => ({ ...prev, rooms: roomsValue }));
                } else {
                  setEditingApartment(prev => prev ? { ...prev, rooms: roomsValue } : null);
                }
              }}
            >
              <SelectTrigger id="rooms">
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
                <SelectItem value="free_layout">
                  {t('apartment.freeLayout')}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
        <div>
          <Label htmlFor="area">{t('apartmentsManager.area')}</Label>
          <Input
            id="area"
            type="number"
            step="0.1"
            value={apartment.area || ''}
            onChange={(e) => {
              const value = parseFloat(e.target.value) || 0;
              if (isNew) {
                setNewApartment(prev => ({ ...prev, area: value }));
              } else {
                setEditingApartment(prev => prev ? { ...prev, area: value } : null);
              }
            }}
            min="0"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="price">{t('apartmentsManager.price')}</Label>
          <Input
            id="price"
            type="number"
            value={apartment.price || ''}
            onChange={(e) => {
              const value = parseInt(e.target.value) || null;
              if (isNew) {
                setNewApartment(prev => ({ ...prev, price: value }));
              } else {
                setEditingApartment(prev => prev ? { ...prev, price: value } : null);
              }
            }}
            min="0"
          />
        </div>
        <div>
          <Label htmlFor="status">{t('apartmentsManager.status')}</Label>
          <Select
            value={apartment.status ?? 'available'}
            onValueChange={(value: string) => {
              const validStatus = (['available', 'sold', 'reserved'].includes(value))
                ? value as 'available' | 'sold' | 'reserved'
                : 'available';
              if (isNew) {
                setNewApartment(prev => ({ ...prev, status: validStatus }));
              } else {
                setEditingApartment(prev => prev ? { ...prev, status: validStatus } : null);
              }
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="available">{t('apartmentsManager.available')}</SelectItem>
              <SelectItem value="reserved">{t('apartmentsManager.reserved')}</SelectItem>
              <SelectItem value="sold">{t('apartmentsManager.sold')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {currentType !== 'parking' && (
        <ApartmentCustomFields
          projectId={projectId}
          apartmentId={apartment.id ?? ''}
          customFieldsData={customFieldsData}
          onCustomFieldsChange={setCustomFieldsData}
        />
      )}

      <div className="flex gap-2 pt-4 border-t">
        <Button
          style={{ backgroundColor: ADMIN_THEME.primary }}
          onClick={() => handleSaveApartment(apartment, isNew)}
          className="bg-real-estate-600 hover:bg-real-estate-700"
        >
          <Save className="h-4 w-4 mr-2" />
          {t('apartmentsManager.save')}
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            if (isNew) {
              setIsAddingNew(false);
              setNewApartment({
                apartment_number: '',
                floor_number: 1,
                rooms: 1,
                area: 0,
                price: null,
                status: 'available',
                polygon: [],
                custom_fields: {}
              });
            } else {
              setEditingApartment(null);
            }
            setCustomFieldsData({});
          }}
        >
          <X className="h-4 w-4 mr-2" />
          {t('apartmentsManager.cancel')}
        </Button>
      </div>
    </div>
  );

  if (loading) {
    return <div className="p-4 text-center">{t('apartmentsManager.loading')}</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{t('apartmentsManager.title')}</CardTitle>
            <CardDescription>
              {t('apartmentsManager.description')}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            {
              projectType !== 'object' && (
                <Button
                  variant="outline"
                  onClick={() => setFloorManagementOpen(true)}
                >
                  <Building className="h-4 w-4 mr-2" />
                  {t('floorManagement.manageFloors')}
                </Button>
              )
            }
            <Button
              style={{ backgroundColor: ADMIN_THEME.primary }}
              onClick={() => setIsAddingNew(true)}
              className="bg-real-estate-600 hover:bg-real-estate-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              {projectType === 'object' ? t('buildingImage.object.addNew') : t('apartmentsManager.addApartment')}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search field and floor filter */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder={t('apartmentsManager.searchByNameAreaPrice')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          {projectType !== 'object' && (
            <Select
              value={selectedFloor === null ? 'all' : selectedFloor.toString()}
              onValueChange={(value) => setSelectedFloor(value === 'all' ? null : parseInt(value))}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={t('apartmentsManager.filterByFloor')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('project.allFloors')}</SelectItem>
                {getUniqueFloors().map((floor) => (
                  <SelectItem key={floor} value={floor.toString()}>
                    {t('apartmentsManager.floor', { floor })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Type selector tabs */}
        {(project?.has_commercial || project?.has_parking) && <Tabs value={currentType} onValueChange={(value) => setCurrentType(value as 'apartment' | 'commercial' | 'parking')}>
          <TabsList className="flex w-full">
            <TabsTrigger className="w-full" value="apartment">{t('apartmentsManager.typeApartment')}</TabsTrigger>
            {project?.has_commercial && (
              <TabsTrigger className="w-full" value="commercial">{t('apartmentsManager.typeCommercial')}</TabsTrigger>
            )}
            {project?.has_parking && (
              <TabsTrigger className="w-full" value="parking">{t('apartmentsManager.typeParking')}</TabsTrigger>
            )}
          </TabsList>
        </Tabs>}

        {/* Форма добавления новой квартиры */}
        {isAddingNew && (
          <Card className="border-dashed">
            <CardHeader>
              <CardTitle className="text-lg">{t('apartmentsManager.newApartment')}</CardTitle>
            </CardHeader>
            <CardContent>
              {renderApartmentForm(newApartment, true)}
            </CardContent>
          </Card>
        )}

        {/* Список существующих квартир */}
        <div className="space-y-4">
          {(() => {
            // Group apartments by floor
            const groupedByFloor = filteredApartments.reduce((acc, apartment) => {
              const floor = apartment.floor_number;
              if (!acc[floor]) {
                acc[floor] = [];
              }
              acc[floor].push(apartment);
              return acc;
            }, {} as Record<number, Apartment[]>);

            // Sort floors in descending order (highest first)
            const sortedFloors = Object.keys(groupedByFloor)
              .map(Number)
              .sort((a, b) => b - a);

            if (sortedFloors.length === 0) {
              return null;
            }

            return sortedFloors.map((floorNumber) => {
              const floorApartments = groupedByFloor[floorNumber];
              if (!floorApartments || floorApartments.length === 0) {
                return null;
              }
              
              return (
                <div key={floorNumber} className="space-y-2">
                  {/* Floor header */}
                  {projectType !== 'object' && (
                    <div className="flex items-center gap-3 py-2 ">
                      <div className="flex-1 border-t border-gray-300"></div>
                      <div className="px-4">
                        <span className="font-semibold text-lg text-gray-700">
                          {t('apartmentsManager.floor', { floor: floorNumber })}
                        </span>
                      </div>
                      <div className="flex-1 border-t border-gray-300"></div>
                    </div>
                  )}
                  {/* Apartments on this floor */}
                  {floorApartments.map((apartment) => (
                  <Card key={apartment.id} className="relative">
                    {editingApartment?.id === apartment.id ? (
                      <CardContent className="p-4">
                        {renderApartmentForm(editingApartment)}
                      </CardContent>
                    ) : (
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <h3 className="font-semibold text-lg">
                                    {
                                      projectType === 'object' ? t('buildingImage.object.objectNumber', { number: apartment.apartment_number }) :
                                        currentType === 'apartment' ? t('apartmentsManager.apartment', { number: apartment.apartment_number }) : apartment.apartment_number
                                    }
                                  </h3>
                                  <Badge className={getStatusColor(apartment.status)}>
                                    {getStatusLabel(apartment.status)}
                                  </Badge>
                                </div>
                                <p className="text-sm text-gray-600">
                                  {projectType !== 'object' && (
                                    <>
                                      {t('apartmentsManager.floor', { floor: apartment.floor_number })} •
                                    </>
                                  )}
                                  {apartment.type === 'apartment'
                                    ? (apartment.rooms == 0 ? t('apartment.studio') : apartment.rooms === 'free_layout' ? t('apartment.freeLayout') : t('apartmentsManager.roomsShort', { rooms: apartment.rooms }))
                                    : apartment.type === 'commercial'
                                      ? t('apartmentsManager.typeCommercial')
                                      : t('apartmentsManager.typeParking')
                                  }
                                </p>
                              </div>
                              <div className="flex gap-2">
                                <div className="text-sm">
                                  <span className="text-gray-600">{t('apartmentsManager.area')}: </span>
                                  <span>{t('apartmentsManager.areaValue', { area: apartment.area })}</span>
                                </div>
                                {apartment.price && (
                                  <div className="text-sm">
                                    <span className="text-gray-600">{t('apartmentsManager.price')}: </span>
                                    <span>{t('apartmentsManager.priceValue', { price: apartment.price.toLocaleString() })}</span>
                                  </div>
                                )}
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDuplicateApartment(apartment)}
                                  title="Дублировать квартиру"
                                >
                                  <Copy className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openSyncDialog(apartment)}
                                  title="Синхронизировать данные с квартирами той же площади и планировки"
                                >
                                  <RefreshCw className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setEditingApartment(apartment);
                                    // Загружаем кастомные поля для редактирования
                                    if (apartment.custom_fields && typeof apartment.custom_fields === 'object') {
                                      setCustomFieldsData(apartment.custom_fields as Record<string, unknown>);
                                    }
                                  }}
                                >
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDeleteApartment(apartment.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    )}
                  </Card>
                  ))}
                </div>
              );
            });
          })()}
        </div>

        {filteredApartments.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            {searchTerm ? (
              <p>{t('apartmentsManager.noSearchResults')}</p>
            ) : (
              <>
                <p>{t('apartmentsManager.noApartments')}</p>
                <p className="text-sm">{t('apartmentsManager.noApartmentsDesc')}</p>
              </>
            )}
          </div>
        )}
      </CardContent>

      {/* Диалог синхронизации */}
      <ApartmentSyncDialog
        open={syncDialogOpen}
        onOpenChange={setSyncDialogOpen}
        sourceApartment={syncSourceApartment}
        targetApartments={syncTargetApartments}
        onSyncComplete={handleSyncComplete}
        getStatusColor={getStatusColor}
        getStatusLabel={getStatusLabel}
      />

      {/* Диалог управления этажами */}
      <Dialog open={floorManagementOpen} onOpenChange={setFloorManagementOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('floorManagement.title')}</DialogTitle>
            <DialogDescription>
              {t('floorManagement.description')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Добавление этажа */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium">{t('floorManagement.addFloor')}</h4>
              <div className="flex gap-2">
                <Input
                  type="number"
                  min="0"
                  value={newFloorNumber}
                  onChange={(e) => setNewFloorNumber(parseInt(e.target.value))}
                  placeholder={t('floorManagement.floorNumber')}
                  className="flex-1"
                />
                <Button onClick={handleAddFloor}>
                  <Plus className="h-4 w-4 mr-2" />
                  {t('floorManagement.add')}
                </Button>
              </div>
            </div>

            {/* Список существующих этажей */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium">{t('floorManagement.existingFloors')}</h4>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {getUniqueFloors().map((floorNumber) => {
                  const apartmentsOnFloor = apartments.filter(apt => apt.floor_number === floorNumber);
                  return (
                    <div key={floorNumber} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Building className="h-4 w-4 text-gray-500" />
                        <div>
                          <span className="font-medium">{t('floorManagement.floor')} {floorNumber}</span>
                          <p className="text-sm text-gray-500">
                            {apartmentsOnFloor.length} {apartmentsOnFloor.length === 1 ? t('floorManagement.apartment') : t('floorManagement.apartments')}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteFloor(floorNumber)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        {apartmentsOnFloor.length > 0 && (
                          <AlertTriangle className="h-4 w-4 mr-1" />
                        )}
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                })}
                {getUniqueFloors().length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Building className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p>{t('floorManagement.noFloors')}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default ProjectApartmentsManager;
