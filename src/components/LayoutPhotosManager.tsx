import { useState, useEffect } from 'react';
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

  useEffect(() => {
    loadApartments();
  }, [projectId]);

  useEffect(() => {
    if (selectedLayoutType) {
      loadLayoutPhotos();
    }
  }, [selectedLayoutType]);

  const loadApartments = async () => {
    try {
      const { data, error } = await supabase
        .from('apartments')
        .select('*')
        .eq('project_id', projectId);

      if (error) throw error;
      
      const normalizedApartments = (data || []).map(normalizeApartmentData);
      setApartments(normalizedApartments);
      
      // Определяем доступные типы планировок на основе квартир
      const uniqueRoomCounts = [...new Set(normalizedApartments.map(apt => apt.rooms))].sort((a, b) => a - b);
      const types: LayoutType[] = uniqueRoomCounts.map(rooms => ({
        key: rooms === 0 ? 'studio' : `${rooms}-room`,
        label: rooms === 0 ? 'Студия' : `${rooms}-комнатная`,
        rooms
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
  };

  const loadLayoutPhotos = async () => {
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
  };

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
      const uploadPromises = Array.from(files).map(async (file, index) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${projectId}-${selectedLayoutType}-${Date.now()}-${index}.${fileExt}`;
        
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
    
    return apartments.filter(apt => apt.rooms === layoutType.rooms).length;
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
                      {layoutType.label} ({getApartmentCountForLayout(layoutType.key)} квартир)
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