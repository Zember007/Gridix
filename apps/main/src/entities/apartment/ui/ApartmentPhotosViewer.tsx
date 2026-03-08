import { useState, useEffect } from "react";
import { supabase } from "@gridix/utils/api";
import { Card, CardContent } from "@gridix/ui";
import { Button } from "@gridix/ui";
import { Image as ImageIcon, Expand } from "lucide-react";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@gridix/ui";

interface CombinedPhoto {
  id: string;
  image_url: string;
  description?: string | null;
  order_index: number;
  type: "layout" | "apartment";
}

interface ApartmentPhotosViewerProps {
  projectId?: string;
  apartmentId?: string;
  preloadedLayoutPhotos?: CombinedPhoto[];
}

const ApartmentPhotosViewer = ({
  projectId,
  apartmentId,
  preloadedLayoutPhotos,
}: ApartmentPhotosViewerProps) => {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [carouselApi, setCarouselApi] = useState<CarouselApi | null>(null);
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(
    null,
  );
  const [minPhotoHeight, setMinPhotoHeight] = useState<number | null>(null);
  const [photos, setPhotos] = useState<CombinedPhoto[]>(
    preloadedLayoutPhotos ?? [],
  );
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

        const layoutPhotos: CombinedPhoto[] = (layoutRes.data ?? []).map(
          (p: any) => ({
            id: p.id,
            image_url: p.image_url,
            description: p.description ?? null,
            order_index: p.order_index ?? 0,
            type: "layout",
          }),
        );

        const apartmentPhotos: CombinedPhoto[] = (apartmentRes.data ?? []).map(
          (p: any) => ({
            id: p.id,
            image_url: p.image_url,
            description: p.description ?? null,
            order_index: p.order_index ?? 0,
            type: "apartment",
          }),
        );

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
    const currentElement = document.getElementById("gridix-widget-root");
    if (currentElement?.shadowRoot) {
      const container = currentElement.shadowRoot.getElementById(
        "gridix-portal-container",
      );
      if (container) {
        setPortalContainer(container as HTMLElement);
      }
    }
  }, []);

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
          <div className="flex h-[340px] flex-col items-center justify-center text-muted-foreground">
            <ImageIcon className="mb-2 h-12 w-12" />
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
          <div className="flex h-[340px] flex-col items-center justify-center text-muted-foreground">
            <ImageIcon className="mb-2 h-12 w-12" />
            <p>Фотографии не загружены</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-none">
      <CardContent className="p-0">
        <div className="relative">
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
                    alt={photo.description || "Apartment photo"}
                    className="h-auto max-h-[340px] w-full cursor-pointer object-cover md:max-h-[500px] lg:rounded-lg"
                    style={{
                      height: minPhotoHeight != null ? minPhotoHeight : "auto",
                    }}
                    onClick={() => {
                      setCurrentPhotoIndex(index);
                      openLightbox();
                    }}
                    onLoad={(e) => {
                      const height = e.currentTarget.clientHeight;
                      if (!height) return;
                      setMinPhotoHeight((prev) =>
                        prev == null ? height : Math.min(prev, height),
                      );
                    }}
                    loading={index === 0 ? "eager" : "lazy"}
                  />
                </CarouselItem>
              ))}
            </CarouselContent>

            {photos.length > 1 && (
              <>
                <CarouselPrevious className="left-4 hidden bg-white/80 shadow-md hover:bg-white md:flex" />
                <CarouselNext className="right-4 hidden bg-white/80 shadow-md hover:bg-white md:flex" />

                <div className="absolute bottom-10 left-1/2 -translate-x-1/2 transform rounded bg-black/50 px-2 py-1 text-sm text-white lg:bottom-2">
                  {currentPhotoIndex + 1} / {photos.length}
                </div>
              </>
            )}
          </Carousel>

          <Button
            variant="outline"
            size="sm"
            className="absolute bottom-10 right-2 bg-white/80 hover:bg-white lg:bottom-auto lg:top-2"
            onClick={openLightbox}
          >
            <Expand className="h-4 w-4" />
          </Button>
        </div>

        {photos[currentPhotoIndex]?.description && (
          <p className="mt-2 text-sm text-muted-foreground">
            {photos[currentPhotoIndex]?.description || ""}
          </p>
        )}
      </CardContent>

      <Lightbox
        open={isLightboxOpen}
        close={closeLightbox}
        index={currentPhotoIndex}
        slides={photos.map((photo) => ({
          src: photo.image_url,
          alt: photo.description || "Фото квартиры",
          title: photo.type === "layout" ? "Планировка" : "Квартира",
        }))}
        on={{
          view: ({ index }) => setCurrentPhotoIndex(index),
        }}
        portal={{ root: portalContainer ?? null }}
      />
    </Card>
  );
};

export default ApartmentPhotosViewer;
