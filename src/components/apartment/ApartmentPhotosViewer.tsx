
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/shared/api/supabase';
import { Card, CardContent } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
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
} from "@/shared/ui/carousel";

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
  projectId?: string;
  apartmentId?: string;
  preloadedLayoutPhotos?: CombinedPhoto[]; // если переданы, используем их без запросов
}

const ApartmentPhotosViewer = ({ projectId, apartmentId, preloadedLayoutPhotos }: ApartmentPhotosViewerProps) => {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [carouselApi, setCarouselApi] = useState<CarouselApi | null>(null);
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null);
  const [minPhotoHeight, setMinPhotoHeight] = useState<number | null>(null);
  const [photos, setPhotos] = useState<CombinedPhoto[]>(preloadedLayoutPhotos ?? []);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (Array.isArray(preloadedLayoutPhotos)) {
      setPhotos(preloadedLayoutPhotos);
    }
  }, [preloadedLayoutPhotos]);

  useEffect(() => {
    const fetchPhotos = async () => {
      if (preloadedLayoutPhotos) return;
      if (!projectId && !apartmentId) return;

      setLoading(true);
      try {
        const [layoutRes, apartmentRes] = await Promise.all([
          projectId
            ? supabase
                .from("layout_photos")
                .select("id, image_url, description, order_index")
                .eq("project_id", projectId)
                .order("order_index", { ascending: true })
            : Promise.resolve({ data: [], error: null } as any),
          apartmentId
            ? supabase
                .from("apartment_photos")
                .select("id, image_url, description, order_index")
                .eq("apartment_id", apartmentId)
                .order("order_index", { ascending: true })
            : Promise.resolve({ data: [], error: null } as any),
        ]);

        if (layoutRes.error) throw layoutRes.error;
        if (apartmentRes.error) throw apartmentRes.error;

        const layoutPhotos: CombinedPhoto[] = (layoutRes.data ?? []).map((p: any) => ({
          id: p.id,
          image_url: p.image_url,
          description: p.description ?? null,
          order_index: p.order_index ?? 0,
          type: "layout",
        }));

        const apartmentPhotos: CombinedPhoto[] = (apartmentRes.data ?? []).map((p: any) => ({
          id: p.id,
          image_url: p.image_url,
          description: p.description ?? null,
          order_index: p.order_index ?? 0,
          type: "apartment",
        }));

        setPhotos([...apartmentPhotos, ...layoutPhotos]);
      } catch (e) {
        console.error("Failed to load photos:", e);
        setPhotos([]);
      } finally {
        setLoading(false);
      }
    };

    void fetchPhotos();
  }, [apartmentId, projectId, preloadedLayoutPhotos]);

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

  if (loading) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col items-center justify-center h-[340px] text-muted-foreground">
            <ImageIcon className="h-12 w-12 mb-2" />
            <p>Загрузка...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!photos || photos.length === 0) {
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
              loop: photos.length > 1,
            }}
            setApi={setCarouselApi}
          >
            <CarouselContent>
              {photos.map((photo, index) => (
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

            {photos.length > 1 && (
              <>
                <CarouselPrevious className="bg-white/80 hover:bg-white shadow-md left-4 md:flex hidden" />
                <CarouselNext className="bg-white/80 hover:bg-white shadow-md right-4 md:flex hidden" />

                <div className="absolute lg:bottom-2 bottom-10 left-1/2 transform -translate-x-1/2 bg-black/50 text-white px-2 py-1 rounded text-sm">
                  {currentPhotoIndex + 1} / {photos.length}
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
        
        {photos[currentPhotoIndex]?.description && (
          <p className="mt-2 text-sm text-muted-foreground">
            {photos[currentPhotoIndex]?.description || ''}
          </p>
        )}
      </CardContent>
      
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
        portal={{ root: portalContainer ?? null }}
      />
    </Card>
  );
};

export default ApartmentPhotosViewer;
