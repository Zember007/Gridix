import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Edit2, Trash2, Save, X } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import ApartmentCustomFields from '@/components/ApartmentCustomFields';
import { Apartment, normalizeApartmentData } from '@/types/apartment';
import type { Json } from '@/integrations/supabase/types';

interface ProjectApartmentsManagerProps {
  projectId: string;
}

// Helper function to convert database polygon to our type
const convertPolygonFromDb = (polygon: Json | null): { x: number; y: number }[] => {
  if (!polygon || !Array.isArray(polygon)) return [];
  return polygon.map((point: any) => ({
    x: typeof point?.x === 'number' ? point.x : 0,
    y: typeof point?.y === 'number' ? point.y : 0
  }));
};

// Helper function to convert our polygon type to database type
const convertPolygonToDb = (polygon: { x: number; y: number }[]): Json => {
  return polygon as Json;
};

const ProjectApartmentsManager = ({ projectId }: ProjectApartmentsManagerProps) => {
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [editingApartment, setEditingApartment] = useState<Apartment | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [loading, setLoading] = useState(true);
  const [customFieldsData, setCustomFieldsData] = useState<Record<string, any>>({});

  const [newApartment, setNewApartment] = useState<Partial<Apartment>>({
    apartment_number: '',
    floor_number: 1,
    rooms: 1,
    area: 0,
    price: null,
    status: 'available',
    polygon: [],
    custom_fields: {}
  });

  useEffect(() => {
    loadApartments();
  }, [projectId]);

  const loadApartments = async () => {
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
      toast.error('Ошибка загрузки квартир');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveApartment = async (apartmentData: Partial<Apartment>, isNew: boolean = false) => {
    if (!apartmentData.apartment_number?.trim()) {
      toast.error('Номер квартиры обязателен');
      return;
    }

    if (!apartmentData.floor_number || apartmentData.floor_number < 1) {
      toast.error('Номер этажа обязателен');
      return;
    }

    try {
      const saveData = {
        apartment_number: apartmentData.apartment_number.trim(),
        floor_number: apartmentData.floor_number,
        rooms: apartmentData.rooms || 1,
        area: apartmentData.area || 0,
        price: apartmentData.price,
        status: apartmentData.status || 'available',
        polygon: convertPolygonToDb(apartmentData.polygon || []),
        custom_fields: customFieldsData as Json,
        project_id: projectId,
        updated_at: new Date().toISOString()
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
          rooms: 1,
          area: 0,
          price: null,
          status: 'available',
          polygon: [],
          custom_fields: {}
        });
        toast.success('Квартира добавлена');
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
        toast.success('Квартира обновлена');
      }

      setCustomFieldsData({});
    } catch (error) {
      console.error('Error saving apartment:', error);
      toast.error('Ошибка сохранения квартиры');
    }
  };

  const handleDeleteApartment = async (apartmentId: string) => {
    if (!confirm('Вы уверены, что хотите удалить эту квартиру?')) return;

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
      case 'sold': return 'Продана';
      case 'reserved': return 'Забронирована';
      case 'available': return 'Свободна';
      default: return status;
    }
  };

  const renderApartmentForm = (apartment: Partial<Apartment>, isNew: boolean = false) => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="apartment_number">Номер квартиры*</Label>
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
          <Label htmlFor="floor_number">Этаж*</Label>
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
          <Label htmlFor="rooms">Комнат*</Label>
          <Input
            id="rooms"
            type="number"
            value={apartment.rooms || ''}
            onChange={(e) => {
              const value = parseInt(e.target.value) || 1;
              if (isNew) {
                setNewApartment(prev => ({ ...prev, rooms: value }));
              } else {
                setEditingApartment(prev => prev ? { ...prev, rooms: value } : null);
              }
            }}
            min="1"
          />
        </div>
        <div>
          <Label htmlFor="area">Площадь (м²)*</Label>
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
          <Label htmlFor="price">Цена (руб.)</Label>
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
          <Label htmlFor="status">Статус</Label>
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
              <SelectItem value="available">Свободна</SelectItem>
              <SelectItem value="reserved">Забронирована</SelectItem>
              <SelectItem value="sold">Продана</SelectItem>
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
          Сохранить
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
          Отмена
        </Button>
      </div>
    </div>
  );

  if (loading) {
    return <div className="p-4 text-center">Загрузка квартир...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Квартиры проекта</CardTitle>
            <CardDescription>
              Управление квартирами и их характеристиками
            </CardDescription>
          </div>
          <Button
            onClick={() => setIsAddingNew(true)}
            className="bg-real-estate-600 hover:bg-real-estate-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Добавить квартиру
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Форма добавления новой квартиры */}
        {isAddingNew && (
          <Card className="border-dashed">
            <CardHeader>
              <CardTitle className="text-lg">Новая квартира</CardTitle>
            </CardHeader>
            <CardContent>
              {renderApartmentForm(newApartment, true)}
            </CardContent>
          </Card>
        )}

        {/* Список существующих квартир */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {apartments.map((apartment) => (
            <Card key={apartment.id} className="relative">
              {editingApartment?.id === apartment.id ? (
                <CardContent className="p-4">
                  {renderApartmentForm(editingApartment)}
                </CardContent>
              ) : (
                <>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">
                        Квартира {apartment.apartment_number}
                      </CardTitle>
                      <Badge className={getStatusColor(apartment.status)}>
                        {getStatusLabel(apartment.status)}
                      </Badge>
                    </div>
                    <CardDescription>
                      Этаж {apartment.floor_number} • {apartment.rooms} комн.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Площадь:</span>
                        <span>{apartment.area} м²</span>
                      </div>
                      {apartment.price && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Цена:</span>
                          <span>{apartment.price.toLocaleString()} руб.</span>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingApartment(apartment);
                          // Загружаем кастомные поля для редактирования
                          if (apartment.custom_fields && typeof apartment.custom_fields === 'object') {
                            setCustomFieldsData(apartment.custom_fields as Record<string, any>);
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
                  </CardContent>
                </>
              )}
            </Card>
          ))}
        </div>

        {apartments.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p>Квартиры не добавлены</p>
            <p className="text-sm">Нажмите "Добавить квартиру" чтобы начать</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProjectApartmentsManager;
