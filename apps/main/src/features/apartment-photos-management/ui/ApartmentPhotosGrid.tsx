import { useEffect, useState, type DragEvent } from "react";
import { Button } from "@gridix/ui";
import { GripVertical, Image as ImageIcon, Trash2 } from "lucide-react";
import { useLanguage } from "@gridix/utils/react";
import { ApartmentPhoto } from "../model/useApartmentPhotosManager";

interface ApartmentPhotosGridProps {
  photos: ApartmentPhoto[];
  onDeletePhoto: (photoId: string, imageUrl: string) => Promise<void>;
  onReorderPhotos: (photos: ApartmentPhoto[]) => Promise<void>;
}

const reorderPhotos = (
  photos: ApartmentPhoto[],
  sourcePhotoId: string,
  targetPhotoId: string,
) => {
  const sourceIndex = photos.findIndex((photo) => photo.id === sourcePhotoId);
  const targetIndex = photos.findIndex((photo) => photo.id === targetPhotoId);

  if (sourceIndex === -1 || targetIndex === -1 || sourceIndex === targetIndex) {
    return photos;
  }

  const nextPhotos = [...photos];
  const [movedPhoto] = nextPhotos.splice(sourceIndex, 1);

  if (!movedPhoto) {
    return photos;
  }

  nextPhotos.splice(targetIndex, 0, movedPhoto);

  return nextPhotos.map((photo, index) => ({
    ...photo,
    order_index: index,
  }));
};

const ApartmentPhotosGrid = ({
  photos,
  onDeletePhoto,
  onReorderPhotos,
}: ApartmentPhotosGridProps) => {
  const { t } = useLanguage();
  const [orderedPhotos, setOrderedPhotos] = useState(photos);
  const [draggingPhotoId, setDraggingPhotoId] = useState<string | null>(null);
  const [dropTargetPhotoId, setDropTargetPhotoId] = useState<string | null>(
    null,
  );
  const [isSavingOrder, setIsSavingOrder] = useState(false);

  useEffect(() => {
    setOrderedPhotos(photos);
  }, [photos]);

  const handleDragEnd = () => {
    setDraggingPhotoId(null);
    setDropTargetPhotoId(null);
  };

  const handleDragOver = (
    event: DragEvent<HTMLDivElement>,
    targetPhotoId: string,
  ) => {
    if (
      isSavingOrder ||
      !draggingPhotoId ||
      draggingPhotoId === targetPhotoId
    ) {
      return;
    }

    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    if (dropTargetPhotoId !== targetPhotoId) {
      setDropTargetPhotoId(targetPhotoId);
    }
  };

  const handleDrop = async (
    event: DragEvent<HTMLDivElement>,
    targetPhotoId: string,
  ) => {
    event.preventDefault();

    if (
      isSavingOrder ||
      !draggingPhotoId ||
      draggingPhotoId === targetPhotoId
    ) {
      handleDragEnd();
      return;
    }

    const previousPhotos = orderedPhotos;
    const nextPhotos = reorderPhotos(
      orderedPhotos,
      draggingPhotoId,
      targetPhotoId,
    );

    if (nextPhotos === previousPhotos) {
      handleDragEnd();
      return;
    }

    setOrderedPhotos(nextPhotos);
    handleDragEnd();
    setIsSavingOrder(true);

    try {
      await onReorderPhotos(nextPhotos);
    } catch (error) {
      console.error("Failed to persist apartment photo order:", error);
      setOrderedPhotos(previousPhotos);
    } finally {
      setIsSavingOrder(false);
    }
  };

  if (orderedPhotos.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        <ImageIcon className="mx-auto mb-2 h-12 w-12" />
        <p>{t("photosManager.noPhotos")}</p>
        <p className="text-sm">{t("photosManager.noPhotosDesc")}</p>
      </div>
    );
  }

  return (
    <div
      className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4"
      role="list"
    >
      {orderedPhotos.map((photo) => {
        const isDragging = draggingPhotoId === photo.id;
        const isDropTarget =
          dropTargetPhotoId === photo.id && draggingPhotoId !== photo.id;

        return (
          <div
            key={photo.id}
            role="listitem"
            draggable={!isSavingOrder}
            onDragStart={(event) => {
              event.dataTransfer.effectAllowed = "move";
              event.dataTransfer.setData("text/plain", photo.id);
              setDraggingPhotoId(photo.id);
            }}
            onDragEnd={handleDragEnd}
            onDragOver={(event) => handleDragOver(event, photo.id)}
            onDrop={(event) => void handleDrop(event, photo.id)}
            className={`group relative overflow-hidden rounded-lg border bg-background transition ${
              isDragging ? "scale-[0.98] opacity-60" : ""
            } ${isDropTarget ? "ring-2 ring-primary ring-offset-2" : ""} ${
              isSavingOrder
                ? "cursor-wait"
                : "cursor-grab active:cursor-grabbing"
            }`}
          >
            <div className="pointer-events-none absolute left-2 top-2 z-10 rounded-md bg-black/55 p-1 text-white">
              <GripVertical className="h-4 w-4" />
            </div>
            <img
              src={photo.image_url}
              alt={photo.description || "Фото квартиры"}
              className="h-32 w-full object-cover"
              draggable={false}
            />
            <Button
              variant="destructive"
              size="sm"
              className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100"
              disabled={isSavingOrder}
              onClick={() => onDeletePhoto(photo.id, photo.image_url)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        );
      })}
    </div>
  );
};

export default ApartmentPhotosGrid;
