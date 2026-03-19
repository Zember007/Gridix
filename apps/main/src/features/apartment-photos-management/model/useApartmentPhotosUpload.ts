import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { uploadApartmentPhoto } from "@/features/projectEditor/api/projectEditorApi";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@gridix/utils/react";
import { compressToWebP } from "@gridix/utils/lib";

const MAX_CONCURRENT_UPLOADS = 3;

export interface PhotoUploadProgressItem {
  id: string;
  fileName: string;
  fileSize: number;
  progress: number;
  status: "uploading" | "complete";
}

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
  const [uploadProgresses, setUploadProgresses] = useState<
    PhotoUploadProgressItem[]
  >([]);
  const uploadAbortControllersRef = useRef(new Map<string, AbortController>());
  const canceledUploadIdsRef = useRef(new Set<string>());
  const uploadRequestIdRef = useRef(0);

  const clearActiveUploads = useCallback(() => {
    uploadAbortControllersRef.current.forEach((controller) =>
      controller.abort(),
    );
    uploadAbortControllersRef.current.clear();
    canceledUploadIdsRef.current.clear();
  }, []);

  useEffect(() => {
    return () => {
      uploadRequestIdRef.current += 1;
      clearActiveUploads();
    };
  }, [clearActiveUploads, selectedApartment]);

  useEffect(() => {
    setUploadProgresses([]);
    setUploading(false);
  }, [selectedApartment]);

  const updateUploadItem = useCallback(
    (
      id: string,
      updater: (
        item: PhotoUploadProgressItem,
      ) => PhotoUploadProgressItem | null,
    ) => {
      setUploadProgresses((prev) =>
        prev.flatMap((item) => {
          if (item.id !== id) return [item];
          const next = updater(item);
          return next ? [next] : [];
        }),
      );
    },
    [],
  );

  const removeUploadItem = useCallback((id: string) => {
    setUploadProgresses((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const handleCancelUpload = useCallback(
    (uploadId: string) => {
      canceledUploadIdsRef.current.add(uploadId);
      const controller = uploadAbortControllersRef.current.get(uploadId);
      if (controller) {
        controller.abort();
        uploadAbortControllersRef.current.delete(uploadId);
      }
      removeUploadItem(uploadId);
    },
    [removeUploadItem],
  );

  const uploadFiles = useCallback(
    async (files: File[]) => {
      if (files.length === 0 || !selectedApartment) return;
      if (!user) {
        toast.error(t("photosManager.authRequired"));
        return;
      }

      const requestId = uploadRequestIdRef.current + 1;
      uploadRequestIdRef.current = requestId;
      canceledUploadIdsRef.current.clear();

      const uploadItems = files.map((file, index) => ({
        id: `${requestId}-${index}-${file.name}-${file.lastModified}`,
        file,
        orderIndex: photosLength + index,
      }));

      setUploading(true);
      setUploadProgresses(
        uploadItems.map((item) => ({
          id: item.id,
          fileName: item.file.name,
          fileSize: item.file.size,
          progress: 0,
          status: "uploading",
        })),
      );

      try {
        let nextTaskIndex = 0;
        let successfulUploads = 0;
        let failedUploads = 0;

        const worker = async () => {
          while (nextTaskIndex < uploadItems.length) {
            const task = uploadItems[nextTaskIndex];
            nextTaskIndex += 1;

            if (!task) return;
            if (canceledUploadIdsRef.current.has(task.id)) {
              continue;
            }

            try {
              const blob = await compressToWebP(task.file);

              if (
                uploadRequestIdRef.current !== requestId ||
                canceledUploadIdsRef.current.has(task.id)
              ) {
                removeUploadItem(task.id);
                continue;
              }

              const file = new File([blob], `photo-${task.orderIndex}.webp`, {
                type: "image/webp",
              });
              const abortController = new AbortController();
              uploadAbortControllersRef.current.set(task.id, abortController);

              await uploadApartmentPhoto(
                selectedApartment,
                task.orderIndex,
                file,
                {
                  signal: abortController.signal,
                  onProgress: (progress) => {
                    if (
                      uploadRequestIdRef.current !== requestId ||
                      canceledUploadIdsRef.current.has(task.id)
                    ) {
                      return;
                    }

                    updateUploadItem(task.id, (item) => ({
                      ...item,
                      progress: progress >= 100 ? 99 : progress,
                      status: "uploading",
                    }));
                  },
                },
              );

              uploadAbortControllersRef.current.delete(task.id);

              if (
                uploadRequestIdRef.current !== requestId ||
                canceledUploadIdsRef.current.has(task.id)
              ) {
                removeUploadItem(task.id);
                continue;
              }

              successfulUploads += 1;
              updateUploadItem(task.id, (item) => ({
                ...item,
                progress: 100,
                status: "complete",
              }));
            } catch (error) {
              uploadAbortControllersRef.current.delete(task.id);

              if (error instanceof Error && error.name === "AbortError") {
                removeUploadItem(task.id);
                continue;
              }

              failedUploads += 1;
              removeUploadItem(task.id);
              console.error("Error uploading photo:", error);
            }
          }
        };

        await Promise.all(
          Array.from(
            { length: Math.min(MAX_CONCURRENT_UPLOADS, uploadItems.length) },
            () => worker(),
          ),
        );

        if (uploadRequestIdRef.current !== requestId) {
          return;
        }

        if (successfulUploads > 0) {
          toast.success(t("photosManager.uploadSuccess"));
          await onAfterUpload();
          await new Promise((resolve) => setTimeout(resolve, 450));
        }

        if (failedUploads > 0 && successfulUploads === 0) {
          toast.error(t("photosManager.uploadError"));
        } else if (failedUploads > 0) {
          toast.error(t("photosManager.partialUploadError"));
        }
      } finally {
        if (uploadRequestIdRef.current === requestId) {
          clearActiveUploads();
          setUploadProgresses((prev) =>
            prev.filter((item) => item.status !== "complete"),
          );
          setUploading(false);
        }
      }
    },
    [
      clearActiveUploads,
      onAfterUpload,
      photosLength,
      removeUploadItem,
      selectedApartment,
      t,
      updateUploadItem,
      user,
    ],
  );

  const handleFilesSelected = useCallback(
    async (files: File[]) => {
      await uploadFiles(files);
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

  const resolveDroppedFiles = useCallback(
    async (dataTransfer: DataTransfer) => {
      if (!selectedApartment) return [];

      const transferItems = Array.from(dataTransfer.items ?? []);
      const transferFiles = Array.from(dataTransfer.files ?? []);

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
        return [];
      }

      return uniqueFiles;
    },
    [extractFilesFromEntry, selectedApartment, t],
  );

  return {
    uploading,
    uploadProgresses,
    handleCancelUpload,
    handleFilesSelected,
    resolveDroppedFiles,
  };
};
