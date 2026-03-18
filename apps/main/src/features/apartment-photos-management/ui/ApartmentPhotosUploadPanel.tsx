import { Button, FileDropzone, Label, UploadProgressCard } from "@gridix/ui";
import { Copy, Image as ImageIcon } from "lucide-react";
import { useLanguage } from "@gridix/utils/react";
import type { PhotoUploadProgressItem } from "../model/useApartmentPhotosUpload";

interface ApartmentPhotosUploadPanelProps {
  selectedApartment: string;
  uploading: boolean;
  uploadProgresses: PhotoUploadProgressItem[];
  photosCount: number;
  onCancelUpload: (uploadId: string) => void;
  onFilesSelected: (files: File[]) => Promise<void>;
  resolveDroppedFiles: (dataTransfer: DataTransfer) => Promise<File[]>;
  onDuplicatePhotos: () => Promise<void>;
}

const ApartmentPhotosUploadPanel = ({
  selectedApartment,
  uploading,
  uploadProgresses,
  photosCount,
  onCancelUpload,
  onFilesSelected,
  resolveDroppedFiles,
  onDuplicatePhotos,
}: ApartmentPhotosUploadPanelProps) => {
  const { t } = useLanguage();

  if (!selectedApartment) return null;

  return (
    <div className="space-y-4">
      <div>
        <Label>{t("photosManager.uploadPhotos")}</Label>
        <div className="mt-1 overflow-hidden rounded-xl border-2 border-dashed border-muted-foreground/25 text-center">
          {uploadProgresses.length > 0 ? (
            <div className="mx-auto max-w-md space-y-3 p-6 text-left">
              {uploadProgresses.map((uploadProgress) => (
                <UploadProgressCard
                  key={uploadProgress.id}
                  fileName={uploadProgress.fileName}
                  fileSize={uploadProgress.fileSize}
                  progress={uploadProgress.progress}
                  status={uploadProgress.status}
                  icon={<ImageIcon className="h-8 w-8 text-sky-600" />}
                  onCancel={() => onCancelUpload(uploadProgress.id)}
                />
              ))}
            </div>
          ) : null}

          {!uploading && (
            <FileDropzone
              accept="image/*"
              multiple
              heading={t("photosManager.uploadPhotos")}
              description={t("photosManager.uploadMultiple")}
              idleLabel={t("projectEditor.clickOrDrop")}
              dropLabel={t("projectEditor.clickOrDrop")}
              resolveDroppedFiles={resolveDroppedFiles}
              onFilesSelected={onFilesSelected}
            />
          )}
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
