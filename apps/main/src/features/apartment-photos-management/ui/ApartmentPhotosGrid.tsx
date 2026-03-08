import { Button } from "@gridix/ui";
import { Image as ImageIcon, Trash2 } from "lucide-react";
import { useLanguage } from "@gridix/utils/react";
import { ApartmentPhoto } from "../model/useApartmentPhotosManager";

interface ApartmentPhotosGridProps {
  photos: ApartmentPhoto[];
  onDeletePhoto: (photoId: string, imageUrl: string) => Promise<void>;
}

const ApartmentPhotosGrid = ({
  photos,
  onDeletePhoto,
}: ApartmentPhotosGridProps) => {
  const { t } = useLanguage();

  if (photos.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        <ImageIcon className="mx-auto mb-2 h-12 w-12" />
        <p>{t("photosManager.noPhotos")}</p>
        <p className="text-sm">{t("photosManager.noPhotosDesc")}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
      {photos.map((photo) => (
        <div key={photo.id} className="group relative">
          <img
            src={photo.image_url}
            alt={photo.description || "Фото квартиры"}
            className="h-32 w-full rounded-lg object-cover"
          />
          <Button
            variant="destructive"
            size="sm"
            className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100"
            onClick={() => onDeletePhoto(photo.id, photo.image_url)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
    </div>
  );
};

export default ApartmentPhotosGrid;
