
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, Save, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import ApartmentCustomFields from '@/components/ApartmentCustomFields';

interface Apartment {
  id: string;
  apartment_number: string;
  floor_number: number;
  rooms: number;
  area: number;
  price: number | null;
  status: string;
  custom_fields: Record<string, any>;
}

interface ApartmentDetailsPanelProps {
  apartment: Apartment | null;
  projectId: string;
  onClose: () => void;
  onUpdate: (apartment: Apartment) => void;
  onDelete: (apartmentId: string) => void;
}

const ApartmentDetailsPanel = ({ 
  apartment, 
  projectId,
  onClose, 
  onUpdate, 
  onDelete 
}: ApartmentDetailsPanelProps) => {
  const [formData, setFormData] = useState<Partial<Apartment>>({});
  const [customFieldsData, setCustomFieldsData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (apartment) {
      setFormData({
        apartment_number: apartment.apartment_number,
        floor_number: apartment.floor_number,
        rooms: apartment.rooms,
        area: apartment.area,
        price: apartment.price,
        status: apartment.status
      });
      setCustomFieldsData(apartment.custom_fields || {});
    }
  }, [apartment]);

  if (!apartment) return null;

  const handleSave = async () => {
    if (!formData.apartment_number?.trim()) {
      toast.error('Номер квартиры обязателен');
      return;
    }

    setLoading(true);
    try {
      const updateData = {
        ...formData,
        custom_fields: customFieldsData,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('apartments')
        .update(updateData)
        .eq('id', apartment.id)
        .select()
        .single();

      if (error) throw error;

      const updatedApartment = {
        ...apartment,
        ...data
      };

      onUpdate(updatedApartment);
      toast.success('Квартира обновлена');
    } catch (error) {
      console.error('Error updating apartment:', error);
      toast.error('Ошибка при обновлении квартиры');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Вы уверены, что хотите удалить эту квартиру?')) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('apartments')
        .delete()
        .eq('id', apartment.id);

      if (error) throw error;

      onDelete(apartment.id);
      toast.success('Квартира удалена');
    } catch (error) {
      console.error('Error deleting apartment:', error);
      toast.error('Ошибка при удалении квартиры');
    } finally {
      setLoading(false);
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

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-white shadow-xl border-l border-gray-200 z-50 overflow-y-auto">
      <Card className="h-full rounded-none border-0">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                Квартира {apartment.apartment_number}
                <Badge className={getStatusColor(apartment.status)}>
                  {getStatusLabel(apartment.status)}
                </Badge>
              </CardTitle>
              <CardDescription>
                Этаж {apartment.floor_number} • {apartment.rooms} комн. • {apartment.area} м²
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 p-6">
          {/* Основная информация */}
          <div className="space-y-4">
            <h3 className="font-medium text-real-estate-900">Основная информация</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="apartment_number">Номер квартиры*</Label>
                <Input
                  id="apartment_number"
                  value={formData.apartment_number || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, apartment_number: e.target.value }))}
                  placeholder="101"
                />
              </div>
              <div>
                <Label htmlFor="floor_number">Этаж*</Label>
                <Input
                  id="floor_number"
                  type="number"
                  value={formData.floor_number || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, floor_number: parseInt(e.target.value) || 1 }))}
                  min="1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="rooms">Комнат*</Label>
                <Input
                  id="rooms"
                  type="number"
                  value={formData.rooms || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, rooms: parseInt(e.target.value) || 1 }))}
                  min="1"
                />
              </div>
              <div>
                <Label htmlFor="area">Площадь (м²)*</Label>
                <Input
                  id="area"
                  type="number"
                  step="0.1"
                  value={formData.area || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, area: parseFloat(e.target.value) || 0 }))}
                  min="0"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="price">Цена (руб.)</Label>
                <Input
                  id="price"
                  type="number"
                  value={formData.price || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, price: parseInt(e.target.value) || null }))}
                  min="0"
                />
              </div>
              <div>
                <Label htmlFor="status">Статус</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
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
          </div>

          {/* Кастомные поля */}
          <ApartmentCustomFields
            projectId={projectId}
            apartmentId={apartment.id}
            customFieldsData={customFieldsData}
            onCustomFieldsChange={setCustomFieldsData}
          />

          {/* Кнопки действий */}
          <div className="flex gap-2 pt-4 border-t">
            <Button
              onClick={handleSave}
              disabled={loading}
              className="flex-1 bg-real-estate-600 hover:bg-real-estate-700"
            >
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Сохранение...' : 'Сохранить'}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={loading}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ApartmentDetailsPanel;
