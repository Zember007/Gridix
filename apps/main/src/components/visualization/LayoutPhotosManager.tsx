import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  FileDropzone,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  UploadProgressCard,
} from "@gridix/ui";
import { Image as ImageIcon, Trash2, Home } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@gridix/utils/api";
import {
  Apartment,
  normalizeApartmentData,
} from "@/entities/apartment/model/types";
import { useAuth } from "@/contexts/AuthContext";
import { compressToWebP } from "@gridix/utils/lib";
import { useLanguage } from "@/contexts/LanguageContext";
import { LoadingProgress } from "@/shared/ui/LoadingProgress";
import { uploadLayoutPhoto } from "@/features/projectEditor/api/projectEditorApi";

const MAX_CONCURRENT_UPLOADS = 3;

interface LayoutPhotosManagerProps {
  projectId: string;
  /** When provided, apartments are not fetched again (e.g. from project editor context). */
  initialApartments?: Apartment[] | null;
}

interface LayoutPhoto {
  id: string;
  project_id: string;
  layout_type: string;
  image_url: string;
  description?: string | null;
  order_index: number;
}

interface LayoutType {
  key: string;
  rooms: number;
  type: string;
  isFreeLayout?: boolean;
}

interface LayoutUploadProgressItem {
  id: string;
  fileName: string;
  fileSize: number;
  progress: number;
  status: "uploading" | "complete";
}

function deriveLayoutTypesFromApartments(
  normalizedApartments: Apartment[],
): LayoutType[] {
  const roomTypeMap = new Map<
    string,
    { rooms: number; type: string; isFreeLayout?: boolean }
  >();
  normalizedApartments.forEach((apt) => {
    const key = `${apt.rooms}-${apt.type}`;
    if (!roomTypeMap.has(key)) {
      const roomsValue = apt.rooms === "free_layout" ? -1 : Number(apt.rooms);
      roomTypeMap.set(key, {
        rooms: roomsValue,
        type: apt.type,
        isFreeLayout: apt.rooms === "free_layout",
      });
    }
  });
  const uniqueRoomCounts = Array.from(roomTypeMap.values());
  return uniqueRoomCounts.map((data) => {
    if (data.type === "apartment") {
      if ((data as { isFreeLayout?: boolean }).isFreeLayout) {
        return {
          key: "free_layout",
          rooms: -1,
          type: data.type,
          isFreeLayout: true,
        };
      } else if (data.rooms === 0) {
        return { key: "studio", rooms: 0, type: data.type };
      } else {
        return {
          key: `${data.rooms}-room`,
          rooms: data.rooms,
          type: data.type,
        };
      }
    } else {
      return {
        key: data.type,
        rooms: data.rooms,
        type: data.type,
      };
    }
  });
}

const LayoutPhotosManager = ({
  projectId,
  initialApartments = null,
}: LayoutPhotosManagerProps) => {
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [layoutTypes, setLayoutTypes] = useState<LayoutType[]>([]);
  const [selectedLayoutType, setSelectedLayoutType] = useState<string>("");
  const [photos, setPhotos] = useState<LayoutPhoto[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgresses, setUploadProgresses] = useState<
    LayoutUploadProgressItem[]
  >([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { t } = useLanguage();
  const uploadAbortControllersRef = useRef(new Map<string, AbortController>());
  const canceledUploadIdsRef = useRef(new Set<string>());
  const uploadRequestIdRef = useRef(0);

  const loadApartments = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("apartments")
        .select("*")
        .eq("project_id", projectId);

      if (error) throw error;

      const normalizedApartments = (data || []).map(normalizeApartmentData);
      const derivedLayoutTypes =
        deriveLayoutTypesFromApartments(normalizedApartments);

      setApartments(normalizedApartments);
      setLayoutTypes(derivedLayoutTypes);

      if (derivedLayoutTypes.length > 0) {
        const first = derivedLayoutTypes[0];
        if (first) setSelectedLayoutType(first.key);
      }
    } catch (error) {
      console.error("Error loading apartments:", error);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  const loadLayoutPhotos = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("layout_photos")
        .select("*")
        .eq("project_id", projectId)
        .eq("layout_type", selectedLayoutType)
        .order("order_index", { ascending: true });

      if (error) throw error;

      setPhotos(data || []);
    } catch (error) {
      console.error("Error loading layout photos:", error);
    }
  }, [projectId, selectedLayoutType]);

  useEffect(() => {
    if (initialApartments != null && Array.isArray(initialApartments)) {
      setApartments(initialApartments);
      const derivedLayoutTypes =
        deriveLayoutTypesFromApartments(initialApartments);
      setLayoutTypes(derivedLayoutTypes);
      if (derivedLayoutTypes.length > 0) {
        const first = derivedLayoutTypes[0];
        if (first) setSelectedLayoutType(first.key);
      }
      setLoading(false);
      return;
    }
    loadApartments();
  }, [loadApartments, initialApartments]);

  useEffect(() => {
    if (selectedLayoutType) {
      loadLayoutPhotos();
    }
  }, [selectedLayoutType, loadLayoutPhotos]);

  useEffect(() => {
    const uploadAbortControllers = uploadAbortControllersRef.current;
    const canceledUploadIds = canceledUploadIdsRef.current;

    return () => {
      uploadRequestIdRef.current += 1;
      uploadAbortControllers.forEach((controller) => controller.abort());
      uploadAbortControllers.clear();
      canceledUploadIds.clear();
    };
  }, []);

  useEffect(() => {
    setUploadProgresses([]);
    setUploading(false);
  }, [selectedLayoutType]);

  const removeUploadItem = useCallback((uploadId: string) => {
    setUploadProgresses((prev) => prev.filter((item) => item.id !== uploadId));
  }, []);

  const updateUploadItem = useCallback(
    (
      uploadId: string,
      updater: (
        item: LayoutUploadProgressItem,
      ) => LayoutUploadProgressItem | null,
    ) => {
      setUploadProgresses((prev) =>
        prev.flatMap((item) => {
          if (item.id !== uploadId) return [item];
          const next = updater(item);
          return next ? [next] : [];
        }),
      );
    },
    [],
  );

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

  const handlePhotoUpload = useCallback(
    async (files: File[]) => {
      if (files.length === 0 || !selectedLayoutType) return;

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
        orderIndex: photos.length + index,
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

              const file = new File(
                [blob],
                `${projectId}-${selectedLayoutType}-${task.orderIndex}.webp`,
                {
                  type: "image/webp",
                },
              );
              const abortController = new AbortController();
              uploadAbortControllersRef.current.set(task.id, abortController);

              await uploadLayoutPhoto(
                projectId,
                selectedLayoutType,
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
              console.error("Error uploading layout photo:", error);
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
          toast.success(t("photosManager.layoutUploadSuccess"));
          await loadLayoutPhotos();
          await new Promise((resolve) => setTimeout(resolve, 450));
        }

        if (failedUploads > 0 && successfulUploads === 0) {
          toast.error(t("photosManager.layoutUploadError"));
        } else if (failedUploads > 0) {
          toast.error(t("photosManager.partialUploadError"));
        }
      } finally {
        if (uploadRequestIdRef.current === requestId) {
          uploadAbortControllersRef.current.forEach((controller) =>
            controller.abort(),
          );
          uploadAbortControllersRef.current.clear();
          canceledUploadIdsRef.current.clear();
          setUploadProgresses((prev) =>
            prev.filter((item) => item.status !== "complete"),
          );
          setUploading(false);
        }
      }
    },
    [
      loadLayoutPhotos,
      photos.length,
      projectId,
      removeUploadItem,
      selectedLayoutType,
      t,
      updateUploadItem,
      user,
    ],
  );

  const handleDeletePhoto = async (photoId: string, imageUrl: string) => {
    try {
      const { error: dbError } = await supabase
        .from("layout_photos")
        .delete()
        .eq("id", photoId);

      if (dbError) throw dbError;

      const fileName = imageUrl.split("/").pop();
      if (fileName) {
        await supabase.storage
          .from("project-images")
          .remove([`layouts/${fileName}`]);
      }

      toast.success(t("photosManager.layoutDeleteSuccess"));
      loadLayoutPhotos();
    } catch (error) {
      console.error("Error deleting layout photo:", error);
      toast.error(t("photosManager.layoutDeleteError"));
    }
  };

  const getApartmentCountForLayout = (layoutKey: string) => {
    const layoutType = layoutTypes.find((lt) => lt.key === layoutKey);
    if (!layoutType) return 0;

    if (layoutKey === "commercial" || layoutKey === "parking") {
      return apartments.filter((apt) => apt.type === layoutKey).length;
    }

    if (layoutKey === "free_layout") {
      return apartments.filter(
        (apt) => apt.type === "apartment" && apt.rooms === "free_layout",
      ).length;
    }

    return apartments.filter(
      (apt) => apt.type === "apartment" && apt.rooms === layoutType.rooms,
    ).length;
  };

  const getLayoutTypeLabel = useCallback(
    (layoutType: LayoutType): string => {
      if (layoutType.type === "apartment") {
        if (layoutType.isFreeLayout || layoutType.key === "free_layout") {
          return t("photosManager.layoutType.freeLayout");
        }
        if (layoutType.rooms === 0 || layoutType.key === "studio") {
          return t("photosManager.layoutType.studio");
        }
        return t("photosManager.layoutType.room", { count: layoutType.rooms });
      }

      if (layoutType.type === "commercial") {
        return t("photosManager.layoutType.commercial");
      }
      if (layoutType.type === "parking") {
        return t("photosManager.layoutType.parking");
      }
      return layoutType.type;
    },
    [t],
  );

  const selectedLayoutLabel = useMemo(() => {
    const currentLayoutType = layoutTypes.find(
      (layoutType) => layoutType.key === selectedLayoutType,
    );
    return currentLayoutType ? getLayoutTypeLabel(currentLayoutType) : "";
  }, [layoutTypes, selectedLayoutType, getLayoutTypeLabel]);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex h-32 items-center justify-center">
          <LoadingProgress />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t("photosManager.layoutTitle")}</CardTitle>
          <CardDescription>
            {t("photosManager.layoutDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="layout-select">
              {t("photosManager.selectLayoutType")}
            </Label>
            <Select
              value={selectedLayoutType}
              onValueChange={setSelectedLayoutType}
              disabled={uploading}
            >
              <SelectTrigger className="mt-1">
                <SelectValue
                  placeholder={t("photosManager.selectLayoutTypePlaceholder")}
                />
              </SelectTrigger>
              <SelectContent>
                {layoutTypes.map((layoutType) => (
                  <SelectItem key={layoutType.key} value={layoutType.key}>
                    <div className="flex items-center gap-2">
                      <Home className="h-4 w-4" />
                      {getLayoutTypeLabel(layoutType)} (
                      {getApartmentCountForLayout(layoutType.key)})
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedLayoutType && (
            <div className="space-y-4">
              <div>
                <Label>{t("photosManager.uploadLayoutPhotos")}</Label>
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
                          onCancel={() => handleCancelUpload(uploadProgress.id)}
                        />
                      ))}
                    </div>
                  ) : null}

                  {!uploading && (
                    <FileDropzone
                      accept="image/*"
                      multiple
                      heading={t("photosManager.uploadLayoutPhotos")}
                      description={t("photosManager.uploadMultiple")}
                      idleLabel={t("projectEditor.clickOrDrop")}
                      dropLabel={t("projectEditor.clickOrDrop")}
                      onFilesSelected={handlePhotoUpload}
                    />
                  )}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t("photosManager.layoutTypeInfo", {
                    type: selectedLayoutLabel,
                  })}
                </p>
              </div>

              {photos.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  <ImageIcon className="mx-auto mb-2 h-12 w-12" />
                  <p>{t("photosManager.layoutNoPhotos")}</p>
                  <p className="text-sm">
                    {t("photosManager.layoutNoPhotosDesc")}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                  {photos.map((photo) => (
                    <div key={photo.id} className="group relative">
                      <img
                        src={photo.image_url}
                        alt={
                          photo.description || t("photosManager.layoutPhotoAlt")
                        }
                        className="h-32 w-full rounded-lg object-cover"
                      />
                      <Button
                        variant="destructive"
                        size="sm"
                        className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100"
                        onClick={() =>
                          handleDeletePhoto(photo.id, photo.image_url)
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LayoutPhotosManager;
