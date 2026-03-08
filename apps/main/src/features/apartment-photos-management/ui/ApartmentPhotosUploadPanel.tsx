import { type RefObject } from "react";
import { Button, Input, Label } from "@gridix/ui";
import { Copy } from "lucide-react";
import { useLanguage } from "@gridix/utils/react";

interface ApartmentPhotosUploadPanelProps {
  selectedApartment: string;
  uploading: boolean;
  isDragOverUpload: boolean;
  photoUploadInputRef: RefObject<HTMLInputElement>;
  photosCount: number;
  onPhotoUpload: (event: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  onUploadDrop: (event: React.DragEvent<HTMLDivElement>) => Promise<void>;
  onUploadDragOver: (event: React.DragEvent<HTMLDivElement>) => void;
  onUploadDragLeave: (event: React.DragEvent<HTMLDivElement>) => void;
  onDuplicatePhotos: () => Promise<void>;
}

const ApartmentPhotosUploadPanel = ({
  selectedApartment,
  uploading,
  isDragOverUpload,
  photoUploadInputRef,
  photosCount,
  onPhotoUpload,
  onUploadDrop,
  onUploadDragOver,
  onUploadDragLeave,
  onDuplicatePhotos,
}: ApartmentPhotosUploadPanelProps) => {
  const { t } = useLanguage();

  if (!selectedApartment) return null;

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="photo-upload">{t("photosManager.uploadPhotos")}</Label>
        <div
          onDrop={onUploadDrop}
          onDragOver={onUploadDragOver}
          onDragLeave={onUploadDragLeave}
          className={`mt-1 space-y-2 rounded-lg border-2 border-dashed p-3 transition-colors ${
            isDragOverUpload
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/30"
          } ${uploading ? "pointer-events-none opacity-60" : ""}`}
        >
          <Input
            ref={photoUploadInputRef}
            id="photo-upload"
            type="file"
            accept="image/*"
            multiple
            onChange={onPhotoUpload}
            disabled={uploading}
          />
          <p className="text-xs text-muted-foreground">
            Drag & drop files or folder with photos
          </p>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("photosManager.uploadMultiple")}
        </p>
      </div>

      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onDuplicatePhotos}
          disabled={photosCount === 0}
        >
          <Copy className="mr-1 h-4 w-4" />
          {t("photosManager.duplicateToSimilar")}
        </Button>
      </div>
    </div>
  );
};

export default ApartmentPhotosUploadPanel;
