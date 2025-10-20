import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, Image as ImageIcon, Trash2, Home } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Apartment, normalizeApartmentData } from '@/types/apartment';
import { useAuth } from '@/contexts/AuthContext';
import { compressToWebP } from '@/hooks/use-upload';

interface LayoutPhotosManagerProps {
  projectId: string;
}

interface LayoutPhoto {
  id: string;
  project_id: string;
  layout_type: string;
  image_url: string;
  description?: string;
  order_index: number;
}

interface LayoutType {
  key: string;
  label: string;
  rooms: number;
}

const LayoutPhotosManager = ({ projectId }: LayoutPhotosManagerProps) => {
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [layoutTypes, setLayoutTypes] = useState<LayoutType[]>([]);
  const [selectedLayoutType, setSelectedLayoutType] = useState<string>('');
  const [photos, setPhotos] = useState<LayoutPhoto[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const loadApartments = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('apartments')
        .select('*')
        .eq('project_id', projectId);

      if (error) throw error;
      
      const normalizedApartments = (data || []).map(normalizeApartmentData);
      setApartments(normalizedApartments);
      
      // Определяем доступные типы планировок на основе квартир
      const roomTypeMap = new Map<string, {rooms: number, type: string}>();
      
      normalizedApartments.forEach(apt => {
        const key = `${apt.rooms}-${apt.type}`;
        if (!roomTypeMap.has(key)) {
          roomTypeMap.set(key, {rooms: Number(apt.rooms), type: apt.type});
        }
      });
      
      const uniqueRoomCounts = Array.from(roomTypeMap.values());
      const types: LayoutType[] = uniqueRoomCounts.map(data => ({
        key: data.type === 'apartment' ? data.rooms === 0 ? 'studio' : `${data.rooms}-room` : data.type,
        label: data.type === 'apartment' ? data.rooms === 0 ? 'Студия' : `${data.rooms}-комнатная` : 
               data.type === 'commercial' ? 'Коммерческие помещения' : 
               data.type === 'parking' ? 'Паркинги' : data.type,
        rooms: data.rooms
      }));
      
      setLayoutTypes(types);
      
      // Автоматически выбираем первый тип планировки
      if (types.length > 0) {
        setSelectedLayoutType(types[0].key);
      }
    } catch (error) {
      console.error('Error loading apartments:', error);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  const loadLayoutPhotos = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('layout_photos')
        .select('*')
        .eq('project_id', projectId)
        .eq('layout_type', selectedLayoutType)
        .order('order_index', { ascending: true });

      if (error) throw error;
      
      setPhotos(data || []);
    } catch (error) {
      console.error('Error loading layout photos:', error);
    }
  }, [projectId, selectedLayoutType]);

  useEffect(() => {
    loadApartments();
  }, [loadApartments]);

  useEffect(() => {
    if (selectedLayoutType) {
      loadLayoutPhotos();
    }
  }, [selectedLayoutType, loadLayoutPhotos]);

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || !selectedLayoutType) return;

    // Проверяем аутентификацию пользователя
    if (!user) {
      toast.error('Необходимо войти в систему для загрузки фотографий');
      return;
    }

    setUploading(true);
    try {
      const uploadPromises = Array.from(files).map(async (file_get, index) => {
       

        const file = await compressToWebP(file_get);

        const fileName = `${projectId}-${selectedLayoutType}-${Date.now()}-${index}.webp`;
        
        const { error: uploadError } = await supabase.storage
          .from('project-images')
          .upload(`layouts/${fileName}`, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('project-images')
          .getPublicUrl(`layouts/${fileName}`);

        const { error: insertError } = await supabase
          .from('layout_photos')
          .insert({
            project_id: projectId,
            layout_type: selectedLayoutType,
            image_url: publicUrl,
            order_index: photos.length + index
          });

        if (insertError) throw insertError;
      });

      await Promise.all(uploadPromises);
      toast.success('Фотографии планировки загружены');
      loadLayoutPhotos();
    } catch (error) {
      console.error('Error uploading layout photos:', error);
      toast.error('Ошибка загрузки фотографий планировки');
    } finally {
      setUploading(false);
    }
  };

  const handleDeletePhoto = async (photoId: string, imageUrl: string) => {
    try {
      const { error: dbError } = await supabase
        .from('layout_photos')
        .delete()
        .eq('id', photoId);

      if (dbError) throw dbError;

      const fileName = imageUrl.split('/').pop();
      if (fileName) {
        await supabase.storage
          .from('project-images')
          .remove([`layouts/${fileName}`]);
      }

      toast.success('Фото планировки удалено');
      loadLayoutPhotos();
    } catch (error) {
      console.error('Error deleting layout photo:', error);
      toast.error('Ошибка удаления фото планировки');
    }
  };

  const getApartmentCountForLayout = (layoutKey: string) => {
    const layoutType = layoutTypes.find(lt => lt.key === layoutKey);
    if (!layoutType) return 0;
    
    // Для коммерческих помещений и паркингов ищем по типу
    if (layoutKey === 'commercial' || layoutKey === 'parking') {
      return apartments.filter(apt => apt.type === layoutKey).length;
    }
    
    // Для квартир ищем по количеству комнат
    return apartments.filter(apt => apt.type === 'apartment' && apt.rooms === layoutType.rooms).length;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Управление фотографиями планировок</CardTitle>
          <CardDescription>
            Загружайте фотографии для каждого типа планировки. Эти фотографии будут отображаться для всех квартир соответствующего типа.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="layout-select">Выберите тип планировки</Label>
            <Select value={selectedLayoutType} onValueChange={setSelectedLayoutType}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Выберите тип планировки" />
              </SelectTrigger>
              <SelectContent>
                {layoutTypes.map((layoutType) => (
                  <SelectItem key={layoutType.key} value={layoutType.key}>
                    <div className="flex items-center gap-2">
                      <Home className="h-4 w-4" />
                      {layoutType.label} ({getApartmentCountForLayout(layoutType.key)})
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedLayoutType && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="layout-photo-upload">Загрузить фотографии планировки</Label>
                <Input
                  id="layout-photo-upload"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoUpload}
                  disabled={uploading}
                  className="mt-1"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Фотографии будут отображаться для всех квартир типа "{layoutTypes.find(lt => lt.key === selectedLayoutType)?.label}"
                </p>
              </div>

              {photos.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <ImageIcon className="h-12 w-12 mx-auto mb-2" />
                  <p>Фотографии планировки не загружены</p>
                  <p className="text-sm">Загрузите фотографии для выбранного типа планировки</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {photos.map((photo) => (
                    <div key={photo.id} className="relative group">
                      <img
                        src={photo.image_url}
                        alt={photo.description || 'Фото планировки'}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <Button
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleDeletePhoto(photo.id, photo.image_url)}
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

export default LayoutPhotosManager; 