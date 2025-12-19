
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Image as ImageIcon, Expand } from 'lucide-react';
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";

interface ApartmentPhoto {
  id: string;
  apartment_id: string;
  image_url: string;
  description?: string | null;
  order_index: number;
}

interface LayoutPhoto {
  id: string;
  project_id: string;
  layout_type: string;
  image_url: string;
  description?: string | null;
  order_index: number;
}

interface CombinedPhoto {
  id: string;
  image_url: string;
  description?: string | null;
  order_index: number;
  type: 'layout' | 'apartment';
}

interface ApartmentPhotosViewerProps {

  preloadedLayoutPhotos: CombinedPhoto[]; // если переданы, используем их без запросов
}

const ApartmentPhotosViewer = ({preloadedLayoutPhotos}: ApartmentPhotosViewerProps) => {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [carouselApi, setCarouselApi] = useState<CarouselApi | null>(null);
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null);
  const [minPhotoHeight, setMinPhotoHeight] = useState<number | null>(null);

  useEffect(() => {
    const currentElement = document.getElementById('gridix-widget-root');
    if (currentElement?.shadowRoot) {
      const container = currentElement.shadowRoot.getElementById('gridix-portal-container');
      if (container) {
        setPortalContainer(container as HTMLElement);
      }
    }
  }, []);



  

  // Синхронизируем индекс активного слайда с Embla-каруселью
  useEffect(() => {
    if (!carouselApi) return;

    const handleSelect = () => {
      const index = carouselApi.selectedScrollSnap();
      setCurrentPhotoIndex(index);
    };

    handleSelect();
    carouselApi.on("select", handleSelect);

    return () => {
      carouselApi.off("select", handleSelect);
    };
  }, [carouselApi]);

  // При смене текущего индекса (например, из лайтбокса) прокручиваем карусель
  useEffect(() => {
    if (!carouselApi) return;
    carouselApi.scrollTo(currentPhotoIndex, true);
  }, [carouselApi, currentPhotoIndex]);

  const openLightbox = () => {
    setIsLightboxOpen(true);
  };

  const closeLightbox = () => {
    setIsLightboxOpen(false);
  };

  if (preloadedLayoutPhotos?.length === 0) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col items-center justify-center h-[340px] text-muted-foreground">
            <ImageIcon className="h-12 w-12 mb-2" />
            <p>Фотографии не загружены</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className='border-none'>
      <CardContent className="p-0">
        <div
          className="relative"
        >
          <Carousel
            className="w-full"
            opts={{
              align: "start",
              loop: preloadedLayoutPhotos.length > 1,
            }}
            setApi={setCarouselApi}
          >
            <CarouselContent>
              {preloadedLayoutPhotos?.map((photo, index) => (
                <CarouselItem key={photo.id}>
                  <img
                    src={photo.image_url}
                    alt={photo.description || 'Apartment photo'}
                    className="w-full h-auto object-cover lg:rounded-lg cursor-pointer md:max-h-[500px] max-h-[340px]"
                    style={{ height: minPhotoHeight != null ? minPhotoHeight : 'auto' }}
                    onClick={() => {
                      setCurrentPhotoIndex(index);
                      openLightbox();
                    }}
                    onLoad={(e) => {
                      const height = e.currentTarget.clientHeight;
                      if (!height) return;
                      setMinPhotoHeight((prev) =>
                        prev == null ? height : Math.min(prev, height)
                      );
                    }}
                    loading={index === 0 ? "eager" : "lazy"}
                  />
                </CarouselItem>
              ))}
            </CarouselContent>

            {preloadedLayoutPhotos.length > 1 && (
              <>
                <CarouselPrevious className="bg-white/80 hover:bg-white shadow-md left-4 md:flex hidden" />
                <CarouselNext className="bg-white/80 hover:bg-white shadow-md right-4 md:flex hidden" />

                <div className="absolute lg:bottom-2 bottom-10 left-1/2 transform -translate-x-1/2 bg-black/50 text-white px-2 py-1 rounded text-sm">
                  {currentPhotoIndex + 1} / {preloadedLayoutPhotos.length}
                </div>
              </>
            )}
          </Carousel>

          <Button
            variant="outline"
            size="sm"
            className="absolute lg:top-2 bottom-10 lg:bottom-auto right-2 bg-white/80 hover:bg-white"
            onClick={openLightbox}
          >
            <Expand className="h-4 w-4" />
          </Button>
        </div>
        
        {preloadedLayoutPhotos[currentPhotoIndex]?.description && (
          <p className="mt-2 text-sm text-muted-foreground">
            {preloadedLayoutPhotos[currentPhotoIndex]?.description || ''}
          </p>
        )}
      </CardContent>
      
      <Lightbox
        open={isLightboxOpen}
        close={closeLightbox}
        index={currentPhotoIndex}
        slides={preloadedLayoutPhotos.map((photo) => ({
          src: photo.image_url,
          alt: photo.description || 'Фото квартиры',
          title: photo.type === 'layout' ? 'Планировка' : 'Квартира',
        }))}
        on={{
          view: ({ index }) => setCurrentPhotoIndex(index)
        }}
        portal={{ root: portalContainer ?? null }}
      />
    </Card>
  );
};

export default ApartmentPhotosViewer;
