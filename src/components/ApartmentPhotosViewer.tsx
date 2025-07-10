
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Image as ImageIcon } from 'lucide-react';

interface ApartmentPhoto {
  id: string;
  apartment_id: string;
  image_url: string;
  description?: string;
  order_index: number;
}

interface ApartmentPhotosViewerProps {
  apartmentId: string;
}

const ApartmentPhotosViewer = ({ apartmentId }: ApartmentPhotosViewerProps) => {
  const [photos, setPhotos] = useState<ApartmentPhoto[]>([]);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPhotos();
  }, [apartmentId]);

  const loadPhotos = async () => {
    try {
      const { data, error } = await supabase
        .from('apartment_photos')
        .select('*')
        .eq('apartment_id', apartmentId)
        .order('order_index', { ascending: true });

      if (error) throw error;
      
      setPhotos(data || []);
      setCurrentPhotoIndex(0);
    } catch (error) {
      console.error('Error loading photos:', error);
    } finally {
      setLoading(false);
    }
  };

  const nextPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev + 1) % photos.length);
  };

  const prevPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev - 1 + photos.length) % photos.length);
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
            className="w-full h-64 object-cover rounded-lg"
          />
          
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
    </Card>
  );
};

export default ApartmentPhotosViewer;
