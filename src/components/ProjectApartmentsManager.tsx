import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Edit2, Trash2, Save, X, Search, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import ApartmentCustomFields from '@/components/ApartmentCustomFields';
import ApartmentSyncDialog from '@/components/ApartmentSyncDialog';
import { Apartment, normalizeApartmentData } from '@/types/apartment';
import type { Json } from '@/integrations/supabase/types';
import { useLanguage } from '@/contexts/LanguageContext';
import { useProject } from '@/hooks/useProjects';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ProjectApartmentsManagerProps {
  projectId: string;
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

const ProjectApartmentsManager = ({ projectId }: ProjectApartmentsManagerProps) => {
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [filteredApartments, setFilteredApartments] = useState<Apartment[]>([]);
  const [editingApartment, setEditingApartment] = useState<Apartment | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [customFieldsData, setCustomFieldsData] = useState<Record<string, unknown>>({});
  const [currentType, setCurrentType] = useState<'apartment' | 'commercial' | 'parking'>('apartment');
  const [syncDialogOpen, setSyncDialogOpen] = useState(false);
  const [syncSourceApartment, setSyncSourceApartment] = useState<Apartment | null>(null);
  const [syncTargetApartments, setSyncTargetApartments] = useState<Apartment[]>([]);
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
    // Filter apartments based on search term and type
    const filtered = apartments.filter(apartment => {
      const matchesType = apartment.type === currentType;
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = apartment.apartment_number.toLowerCase().includes(searchLower) ||
        apartment.status.toLowerCase().includes(searchLower);
      
      return matchesType && matchesSearch;
    });
    setFilteredApartments(filtered);
  }, [apartments, searchTerm, currentType]);

  const handleSaveApartment = async (apartmentData: Partial<Apartment>, isNew: boolean = false) => {
    if (!apartmentData.apartment_number?.trim()) {
      toast.error(t('apartmentsManager.numberRequired'));
      return;
    }

    if (!apartmentData.floor_number || apartmentData.floor_number < 1) {
      toast.error(t('apartmentsManager.floorRequired'));
      return;
    }

    try {
      const saveData = {
        apartment_number: apartmentData.apartment_number.trim(),
        floor_number: apartmentData.floor_number,
        rooms: apartmentData.rooms || 0,
        area: apartmentData.area || 0,
        price: apartmentData.price,
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
          .insert([saveData])
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
      toast.error('Нет квартир с такой же площадью и количеством комнат для синхронизации');
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

  const renderApartmentForm = (apartment: Partial<Apartment>, isNew: boolean = false) => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="apartment_number">{t('apartmentsManager.apartmentNumber')}</Label>
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
            placeholder="101"
          />
        </div>
        <div>
          <Label htmlFor="floor_number">{t('apartmentsManager.floorNumber')}</Label>
          <Input
            id="floor_number"
            type="number"
            value={apartment.floor_number || ''}
            onChange={(e) => {
              const value = parseInt(e.target.value) || 1;
              if (isNew) {
                setNewApartment(prev => ({ ...prev, floor_number: value }));
              } else {
                setEditingApartment(prev => prev ? { ...prev, floor_number: value } : null);
              }
            }}
            min="1"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="rooms">{t('apartmentsManager.rooms')}</Label>
          <Select
            value={apartment.rooms?.toString() || '0'}
            onValueChange={(value) => {
              const roomsValue = parseInt(value) || 0;
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
            </SelectContent>
          </Select>
        </div>
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
            value={apartment.status}
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

      <ApartmentCustomFields
        projectId={projectId}
        apartmentId={apartment.id}
        customFieldsData={customFieldsData}
        onCustomFieldsChange={setCustomFieldsData}
      />

      <div className="flex gap-2 pt-4 border-t">
        <Button
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
          <Button
            onClick={() => setIsAddingNew(true)}
            className="bg-real-estate-600 hover:bg-real-estate-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            {t('apartmentsManager.addApartment')}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search field */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder={t('apartmentsManager.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
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
        <div className="space-y-2">
          {filteredApartments.map((apartment) => (
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
                              {t('apartmentsManager.apartment', { number: apartment.apartment_number })}
                            </h3>
                            <Badge className={getStatusColor(apartment.status)}>
                              {getStatusLabel(apartment.status)}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600">
                            {t('apartmentsManager.floor', { floor: apartment.floor_number })} • {apartment.rooms === 0 ? t('apartment.studio') : t('apartmentsManager.roomsShort', { rooms: apartment.rooms })}
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
                            onClick={() => openSyncDialog(apartment)}
                            title="Синхронизировать данные с квартирами той же площади и планировки"
                          >
                            <Copy className="h-4 w-4" />
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
    </Card>
  );
};

export default ProjectApartmentsManager;
