
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Image as ImageIcon, Layout, Expand } from 'lucide-react';
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";

interface ApartmentPhoto {
  id: string;
  apartment_id: string;
  image_url: string;
  description?: string;
  order_index: number;
}

interface LayoutPhoto {
  id: string;
  project_id: string;
  layout_type: string;
  image_url: string;
  description?: string;
  order_index: number;
}

interface CombinedPhoto {
  id: string;
  image_url: string;
  description?: string;
  order_index: number;
  type: 'layout' | 'apartment';
}

interface ApartmentPhotosViewerProps {
  apartmentId: string;
  projectId?: string;
  roomsHint?: number; // если известны комнаты, избегаем запроса к apartments
  preloadedLayoutPhotos?: CombinedPhoto[]; // если переданы, используем их без запросов
  fetchMode?: 'auto' | 'preloaded-only'; // 'preloaded-only' отключает любые запросы
}

const ApartmentPhotosViewer = ({ apartmentId, projectId, roomsHint, preloadedLayoutPhotos, fetchMode = 'auto' }: ApartmentPhotosViewerProps) => {
  const [photos, setPhotos] = useState<CombinedPhoto[]>([]);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const getLayoutType = (rooms: number): string => {
    return rooms === 0 ? 'studio' : `${rooms}-room`;
  };

  const loadPhotos = useCallback(async () => {
    try {
      setLoading(true);
      
      let currentRooms = roomsHint;
      let currentProjectId = projectId;

      if (currentRooms == null || currentProjectId == null) {
        // Загружаем минимум данных о квартире, если не хватает входных подсказок
        const { data: apartmentData, error: apartmentError } = await supabase
          .from('apartments')
          .select('rooms, project_id')
          .eq('id', apartmentId)
          .single();

        if (apartmentError) throw apartmentError;
        currentRooms = currentRooms ?? Number(apartmentData.rooms);
        currentProjectId = currentProjectId ?? apartmentData.project_id;
      }

      const layoutType = getLayoutType(typeof currentRooms === 'number' ? currentRooms : Number(currentRooms));

      // Если переданы предзагруженные фото планировок — используем их, иначе загружаем
      let layoutPhotos: LayoutPhoto[] | null = null;
      if (preloadedLayoutPhotos && preloadedLayoutPhotos.length > 0) {
        layoutPhotos = preloadedLayoutPhotos.map(p => ({
          id: p.id,
          project_id: currentProjectId!,
          layout_type: layoutType,
          image_url: p.image_url,
          description: p.description || null,
          order_index: p.order_index
        }));
      } else {
        const { data, error: layoutError } = await supabase
          .from('layout_photos')
          .select('*')
          .eq('project_id', currentProjectId!)
          .eq('layout_type', layoutType)
          .order('order_index', { ascending: true });
        if (layoutError) throw layoutError;
        layoutPhotos = data || [];
      }

      // Загружаем индивидуальные фотографии квартиры
      const { data: apartmentPhotos, error: apartmentPhotosError } = await supabase
        .from('apartment_photos')
        .select('*')
        .eq('apartment_id', apartmentId)
        .order('order_index', { ascending: true });

      if (apartmentPhotosError) throw apartmentPhotosError;
      
      // Объединяем фотографии: сначала планировки, затем индивидуальные
      const combinedPhotos: CombinedPhoto[] = [
        ...(layoutPhotos || []).map((photo: LayoutPhoto) => ({
          id: photo.id,
          image_url: photo.image_url,
          description: photo.description,
          order_index: photo.order_index,
          type: 'layout' as const
        })),
        ...(apartmentPhotos || []).map((photo: ApartmentPhoto) => ({
          id: photo.id,
          image_url: photo.image_url,
          description: photo.description,
          order_index: photo.order_index,
          type: 'apartment' as const
        }))
      ];
      
      setPhotos(combinedPhotos);
      setCurrentPhotoIndex(0);
    } catch (error) {
      console.error('Error loading photos:', error);
    } finally {
      setLoading(false);
    }
  }, [apartmentId, projectId, roomsHint, preloadedLayoutPhotos]);

  useEffect(() => {
    // Если предзагруженные фото планировок переданы, используем их и не делаем запросы
    if (preloadedLayoutPhotos && preloadedLayoutPhotos.length > 0) {
      setPhotos(preloadedLayoutPhotos.sort((a, b) => a.order_index - b.order_index));
      setCurrentPhotoIndex(0);
      setLoading(false);
      return;
    }
    // Если нужно работать только с предзагруженными, не делаем запрос и ждём пропсы
    if (fetchMode === 'preloaded-only') {
      setLoading(true);
      return;
    }
    loadPhotos();
  }, [apartmentId, projectId, roomsHint, preloadedLayoutPhotos, fetchMode, loadPhotos]);

  const nextPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev + 1) % photos.length);
  };

  const prevPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev - 1 + photos.length) % photos.length);
  };

  const openLightbox = () => {
    setIsLightboxOpen(true);
  };

  const closeLightbox = () => {
    setIsLightboxOpen(false);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (photos.length === 0) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
            <ImageIcon className="h-12 w-12 mb-2" />
            <p>Фотографии не загружены</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="relative">
          <img
            src={photos[currentPhotoIndex].image_url}
            alt={photos[currentPhotoIndex].description || 'Фото квартиры'}
            className="w-full h-64 object-cover rounded-lg cursor-pointer"
            onClick={openLightbox}
          />
          
          {/* Кнопка для открытия полноэкранного режима */}
          <Button
            variant="outline"
            size="sm"
            className="absolute top-2 right-2 bg-white/80 hover:bg-white"
            onClick={openLightbox}
          >
            <Expand className="h-4 w-4" />
          </Button>
          
          {/* Бейдж для типа фотографии */}
          <Badge 
            variant={photos[currentPhotoIndex].type === 'layout' ? 'default' : 'secondary'}
            className="absolute top-2 left-2"
          >
            {photos[currentPhotoIndex].type === 'layout' ? (
              <>
                <Layout className="h-3 w-3 mr-1" />
                Планировка
              </>
            ) : (
              'Квартира'
            )}
          </Badge>
          
          {photos.length > 1 && (
            <>
              <Button
                variant="outline"
                size="sm"
                className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white"
                onClick={prevPhoto}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white"
                onClick={nextPhoto}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              
              <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-black/50 text-white px-2 py-1 rounded text-sm">
                {currentPhotoIndex + 1} / {photos.length}
              </div>
            </>
          )}
        </div>
        
        {photos[currentPhotoIndex].description && (
          <p className="mt-2 text-sm text-muted-foreground">
            {photos[currentPhotoIndex].description}
          </p>
        )}
      </CardContent>
      
      {/* Lightbox для полноэкранного просмотра */}
      <Lightbox
        open={isLightboxOpen}
        close={closeLightbox}
        index={currentPhotoIndex}
        slides={photos.map((photo) => ({
          src: photo.image_url,
          alt: photo.description || 'Фото квартиры',
          title: photo.type === 'layout' ? 'Планировка' : 'Квартира',
        }))}
        on={{
          view: ({ index }) => setCurrentPhotoIndex(index)
        }}
      />
    </Card>
  );
};

export default ApartmentPhotosViewer;
