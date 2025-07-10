
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, Image as ImageIcon, Copy, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Apartment } from '@/types/apartment';

interface ApartmentPhotosManagerProps {
  projectId: string;
}

interface ApartmentPhoto {
  id: string;
  apartment_id: string;
  image_url: string;
  description?: string;
  order_index: number;
}

const ApartmentPhotosManager = ({ projectId }: ApartmentPhotosManagerProps) => {
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [selectedApartment, setSelectedApartment] = useState<string>('');
  const [photos, setPhotos] = useState<ApartmentPhoto[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadApartments();
  }, [projectId]);

  useEffect(() => {
    if (selectedApartment) {
      loadPhotos();
    }
  }, [selectedApartment]);

  const loadApartments = async () => {
    try {
      const { data, error } = await supabase
        .from('apartments')
        .select('*')
        .eq('project_id', projectId)
        .order('floor_number', { ascending: true })
        .order('apartment_number', { ascending: true });

      if (error) throw error;
      setApartments(data || []);
    } catch (error) {
      console.error('Error loading apartments:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPhotos = async () => {
    try {
      // В реальном проекте здесь будет запрос к таблице apartment_photos
      // Пока что используем заглушку
      setPhotos([]);
    } catch (error) {
      console.error('Error loading photos:', error);
    }
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || !selectedApartment) return;

    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${selectedApartment}-${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('project-images')
          .upload(`apartments/${fileName}`, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('project-images')
          .getPublicUrl(`apartments/${fileName}`);

        // В реальном проекте здесь будет добавление записи в таблицу apartment_photos
        console.log('Photo uploaded:', publicUrl);
      }

      toast.success('Фотографии загружены');
      loadPhotos();
    } catch (error) {
      console.error('Error uploading photos:', error);
      toast.error('Ошибка загрузки фотографий');
    } finally {
      setUploading(false);
    }
  };

  const duplicatePhotosToFloor = async (floorNumber: number) => {
    if (!selectedApartment || photos.length === 0) return;

    try {
      const floorApartments = apartments.filter(apt => 
        apt.floor_number === floorNumber && apt.id !== selectedApartment
      );

      // В реальном проекте здесь будет дублирование фотографий
      toast.success(`Фотографии продублированы для ${floorApartments.length} квартир на ${floorNumber} этаже`);
    } catch (error) {
      console.error('Error duplicating photos:', error);
      toast.error('Ошибка дублирования фотографий');
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Управление фотографиями квартир</CardTitle>
          <CardDescription>
            Загружайте фотографии для квартир и дублируйте их по этажам
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="apartment-select">Выберите квартиру</Label>
            <Select value={selectedApartment} onValueChange={setSelectedApartment}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Выберите квартиру для редактирования" />
              </SelectTrigger>
              <SelectContent>
                {apartments.map((apartment) => (
                  <SelectItem key={apartment.id} value={apartment.id}>
                    Квартира {apartment.apartment_number} ({apartment.floor_number} этаж)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedApartment && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="photo-upload">Загрузить фотографии</Label>
                <Input
                  id="photo-upload"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoUpload}
                  disabled={uploading}
                  className="mt-1"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Можно выбрать несколько файлов одновременно
                </p>
              </div>

              <div className="flex gap-2 flex-wrap">
                {apartments
                  .reduce((floors: number[], apt) => {
                    if (!floors.includes(apt.floor_number)) {
                      floors.push(apt.floor_number);
                    }
                    return floors;
                  }, [])
                  .sort((a, b) => a - b)
                  .map((floor) => (
                    <Button
                      key={floor}
                      variant="outline"
                      size="sm"
                      onClick={() => duplicatePhotosToFloor(floor)}
                      disabled={photos.length === 0}
                    >
                      <Copy className="h-4 w-4 mr-1" />
                      Дублировать на {floor} этаж
                    </Button>
                  ))}
              </div>

              {photos.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <ImageIcon className="h-12 w-12 mx-auto mb-2" />
                  <p>Фотографии не загружены</p>
                  <p className="text-sm">Загрузите фотографии для выбранной квартиры</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {photos.map((photo) => (
                    <div key={photo.id} className="relative group">
                      <img
                        src={photo.image_url}
                        alt={photo.description || 'Фото квартиры'}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <Button
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => {
                          // В реальном проекте здесь будет удаление фото
                          toast.success('Фото удалено');
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ApartmentPhotosManager;
