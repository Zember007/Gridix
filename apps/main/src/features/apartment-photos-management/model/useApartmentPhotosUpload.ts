import {
  type ChangeEvent,
  type DragEvent,
  RefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";
import { uploadApartmentPhoto } from "@/features/projectEditor/api/projectEditorApi";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@gridix/utils/react";
import { compressToWebP } from "@gridix/utils/lib";

interface UseApartmentPhotosUploadParams {
  selectedApartment: string;
  photosLength: number;
  onAfterUpload: () => Promise<void>;
}

export const useApartmentPhotosUpload = ({
  selectedApartment,
  photosLength,
  onAfterUpload,
}: UseApartmentPhotosUploadParams) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [uploading, setUploading] = useState(false);
  const [isDragOverUpload, setIsDragOverUpload] = useState(false);
  const photoUploadInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (photoUploadInputRef.current) {
      photoUploadInputRef.current.value = "";
    }
  }, [selectedApartment]);

  const uploadFiles = useCallback(
    async (files: File[]) => {
      if (files.length === 0 || !selectedApartment) return;
      if (!user) {
        toast.error(t("photosManager.authRequired"));
        return;
      }

      setUploading(true);
      try {
        const uploadPromises = files.map(async (fileGet, index) => {
          const blob = await compressToWebP(fileGet);
          const file = new File([blob], `photo-${index}.webp`, {
            type: "image/webp",
          });
          await uploadApartmentPhoto(
            selectedApartment,
            photosLength + index,
            file,
          );
        });

        await Promise.all(uploadPromises);
        toast.success(t("photosManager.uploadSuccess"));
        await onAfterUpload();
      } catch (error) {
        console.error("Error uploading photos:", error);
        toast.error(t("photosManager.uploadError"));
      } finally {
        setUploading(false);
        if (photoUploadInputRef.current) {
          photoUploadInputRef.current.value = "";
        }
      }
    },
    [onAfterUpload, photosLength, selectedApartment, t, user],
  );

  const handlePhotoUpload = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      if (!files) return;
      await uploadFiles(Array.from(files));
    },
    [uploadFiles],
  );

  const isFileEntry = (entry: FileSystemEntry): entry is FileSystemFileEntry =>
    entry.isFile;

  const isDirectoryEntry = (
    entry: FileSystemEntry,
  ): entry is FileSystemDirectoryEntry => entry.isDirectory;

  const readAllDirectoryEntries = useCallback(
    async (reader: FileSystemDirectoryReader) => {
      const result: FileSystemEntry[] = [];
      let shouldContinue = true;

      while (shouldContinue) {
        const batch = await new Promise<FileSystemEntry[]>(
          (resolve, reject) => {
            reader.readEntries(resolve, reject);
          },
        );

        if (batch.length === 0) {
          shouldContinue = false;
          continue;
        }
        result.push(...batch);
      }

      return result;
    },
    [],
  );

  const extractFilesFromEntry = useCallback(
    async (entry: FileSystemEntry): Promise<File[]> => {
      if (isFileEntry(entry)) {
        const file = await new Promise<File>((resolve, reject) => {
          entry.file(resolve, reject);
        });
        return [file];
      }

      if (!isDirectoryEntry(entry)) {
        return [];
      }

      const reader = entry.createReader();
      const entries = await readAllDirectoryEntries(reader);
      const nestedFiles = await Promise.all(
        entries.map((nestedEntry) => extractFilesFromEntry(nestedEntry)),
      );
      return nestedFiles.flat();
    },
    [readAllDirectoryEntries],
  );

  const handleUploadDrop = useCallback(
    async (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setIsDragOverUpload(false);
      if (!selectedApartment) return;

      const transferItems = Array.from(event.dataTransfer.items ?? []);
      const transferFiles = Array.from(event.dataTransfer.files ?? []);

      const uploadableFiles = transferFiles.filter((file) =>
        file.type.startsWith("image/"),
      );

      if (transferItems.length > 0) {
        const entryFilesNested = await Promise.all(
          transferItems.map(async (item) => {
            const entry = item.webkitGetAsEntry();

            if (entry) {
              return extractFilesFromEntry(entry);
            }

            const fallbackFile = item.getAsFile();
            return fallbackFile ? [fallbackFile] : [];
          }),
        );

        uploadableFiles.push(
          ...entryFilesNested
            .flat()
            .filter((file) => file.type.startsWith("image/")),
        );
      }

      const uniqueFiles = Array.from(
        new Map(
          uploadableFiles.map((file) => [
            `${file.name}-${file.size}-${file.lastModified}`,
            file,
          ]),
        ).values(),
      );

      if (uniqueFiles.length === 0) {
        toast.error(t("photosManager.uploadError"));
        return;
      }

      await uploadFiles(uniqueFiles);
    },
    [extractFilesFromEntry, selectedApartment, t, uploadFiles],
  );

  const handleUploadDragOver = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      if (!selectedApartment || uploading) return;
      setIsDragOverUpload(true);
    },
    [selectedApartment, uploading],
  );

  const handleUploadDragLeave = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setIsDragOverUpload(false);
    },
    [],
  );

  return {
    uploading,
    isDragOverUpload,
    photoUploadInputRef: photoUploadInputRef as RefObject<HTMLInputElement>,
    handlePhotoUpload,
    handleUploadDrop,
    handleUploadDragOver,
    handleUploadDragLeave,
  };
};
