import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Checkbox,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  FileDropzone,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  UnitsChessboard,
  UploadProgressCard,
} from "@gridix/ui";
import {
  Image as ImageIcon,
  SlidersHorizontal,
  Star,
  Trash2,
  Home,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@gridix/utils/api";
import {
  Apartment,
  normalizeApartmentData,
} from "@/entities/apartment/model/types";
import { deriveApartmentLayoutType } from "@/entities/apartment/model/resolveLayoutPhotos";
import { useAuth } from "@/contexts/AuthContext";
import { compressToWebP } from "@gridix/utils/lib";
import { useLanguage } from "@/contexts/LanguageContext";
import { LoadingProgress } from "@/shared/ui/LoadingProgress";
import {
  uploadLayoutPhoto,
  updateLayoutPhotoAssignment,
  type LayoutPhotoAssignment,
} from "@/features/projectEditor/api/projectEditorApi";

const MAX_CONCURRENT_UPLOADS = 3;

interface LayoutPhotosManagerProps {
  projectId: string;
  /** When set, loads apartments / layout rows for this building scope only. */
  subProjectId?: string;
  initialApartments?: Apartment[] | null;
}

interface LayoutPhoto {
  id: string;
  project_id: string;
  layout_type: string;
  image_url: string;
  description?: string | null;
  order_index: number;
  is_project_preview: boolean;
  apartment_ids: string[];
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

// ── Helpers ──

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

// ── Photo settings dialog ──

interface PhotoSettingsDialogProps {
  photo: LayoutPhoto;
  apartments: Apartment[];
  layoutType: string;
  onSaved: (photoId: string, updated: Partial<LayoutPhoto>) => void;
}

function PhotoSettingsDialog({
  photo,
  apartments,
  layoutType,
  onSaved,
}: PhotoSettingsDialogProps) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);

  // Persisted state
  const [isPreview, setIsPreview] = useState(photo.is_project_preview);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    new Set(photo.apartment_ids),
  );

  // UI-only area filter (never saved)
  const [areaMin, setAreaMin] = useState("");
  const [areaMax, setAreaMax] = useState("");

  const [saving, setSaving] = useState(false);

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      setIsPreview(photo.is_project_preview);
      setSelectedIds(new Set(photo.apartment_ids));
      setAreaMin("");
      setAreaMax("");
    }
    setOpen(nextOpen);
  };

  const compatibleApartments = useMemo(
    () => apartments.filter((a) => deriveApartmentLayoutType(a) === layoutType),
    [apartments, layoutType],
  );

  const uniqueAreas = useMemo(() => {
    const set = new Set(compatibleApartments.map((a) => a.area));
    return Array.from(set).sort((a, b) => a - b);
  }, [compatibleApartments]);

  // Apartments matching the current area filter
  const inAreaFilter = useCallback(
    (apt: Apartment) => {
      const min = areaMin !== "" ? parseFloat(areaMin) : null;
      const max = areaMax !== "" ? parseFloat(areaMax) : null;
      if (min === null && max === null) return false;
      if (min !== null && apt.area < min) return false;
      if (max !== null && apt.area > max) return false;
      return true;
    },
    [areaMin, areaMax],
  );

  const hasAreaFilter = areaMin !== "" || areaMax !== "";

  // Chessboard status: available = selected, booked = matches filter but not selected, sold = not selected
  const chessboardUnits = useMemo(
    () =>
      compatibleApartments.map((apt) => {
        const isSelected = selectedIds.has(apt.id);
        const matchesFilter = inAreaFilter(apt);
        const status = isSelected
          ? "available"
          : matchesFilter
            ? "booked"
            : "sold";
        return {
          id: apt.id,
          apartment_number: String(apt.apartment_number),
          floor_number: apt.floor_number,
          status,
        };
      }),
    [compatibleApartments, selectedIds, inAreaFilter],
  );

  const handleUnitClick = (unit: { id: string }) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(unit.id)) {
        next.delete(unit.id);
      } else {
        next.add(unit.id);
      }
      return next;
    });
  };

  const handleSelectAllInFilter = () => {
    const matching = compatibleApartments.filter(inAreaFilter).map((a) => a.id);
    setSelectedIds((prev) => {
      const next = new Set(prev);
      matching.forEach((id) => next.add(id));
      return next;
    });
  };

  const handleClearAll = () => {
    setSelectedIds(new Set());
  };

  const dirty =
    isPreview !== photo.is_project_preview ||
    selectedIds.size !== photo.apartment_ids.length ||
    [...selectedIds].some((id) => !photo.apartment_ids.includes(id));

  const handleSave = async () => {
    setSaving(true);
    try {
      const ids = Array.from(selectedIds);
      const assignment: LayoutPhotoAssignment = {
        is_project_preview: isPreview,
        apartment_ids: ids.length > 0 ? ids : null,
      };
      await updateLayoutPhotoAssignment(photo.id, assignment);
      onSaved(photo.id, {
        is_project_preview: isPreview,
        apartment_ids: ids,
      });
      toast.success(t("photosManager.assignmentSaved"));
      setOpen(false);
    } catch {
      toast.error(t("photosManager.assignmentSaveError"));
    } finally {
      setSaving(false);
    }
  };

  const matchingInFilter = hasAreaFilter
    ? compatibleApartments.filter(inAreaFilter).length
    : 0;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="secondary" size="sm" className="h-8 w-8 p-0">
          <SlidersHorizontal className="h-3.5 w-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{t("photosManager.assignmentTitle")}</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Preview toggle */}
          <div className="flex items-start gap-3 rounded-lg border bg-muted/40 p-3.5">
            <Checkbox
              id={`preview-${photo.id}`}
              checked={isPreview}
              onCheckedChange={(v) => setIsPreview(Boolean(v))}
              className="mt-0.5"
            />
            <div className="leading-tight">
              <label
                htmlFor={`preview-${photo.id}`}
                className="cursor-pointer font-medium"
              >
                {t("photosManager.roleProjectPreview")}
              </label>
              <p className="mt-1 text-xs text-muted-foreground">
                {t("photosManager.roleProjectPreviewHint")}
              </p>
            </div>
          </div>

          <Separator />

          {/* Apartment chessboard */}
          {compatibleApartments.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <Label>{t("photosManager.apartmentCoverageTitle")}</Label>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {t("photosManager.apartmentCoverageHint")}
                  </p>
                </div>
                {selectedIds.size > 0 && (
                  <button
                    type="button"
                    onClick={handleClearAll}
                    className="shrink-0 text-xs text-muted-foreground underline-offset-2 hover:underline"
                  >
                    {t("photosManager.clearAll")}
                  </button>
                )}
              </div>

              {/* Area filter — UI only */}
              <div className="space-y-2 rounded-lg border bg-muted/30 p-3">
                <p className="text-xs font-medium text-muted-foreground">
                  {t("photosManager.areaFilterLabel")}
                </p>
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <Label className="text-xs text-muted-foreground">
                      {t("photosManager.areaMin")}
                    </Label>
                    <Input
                      type="number"
                      step="0.1"
                      placeholder={t("photosManager.areaPlaceholder")}
                      value={areaMin}
                      onChange={(e) => setAreaMin(e.target.value)}
                      className="mt-1 h-8 text-sm"
                    />
                  </div>
                  <span className="pb-1.5 text-muted-foreground">—</span>
                  <div className="flex-1">
                    <Label className="text-xs text-muted-foreground">
                      {t("photosManager.areaMax")}
                    </Label>
                    <Input
                      type="number"
                      step="0.1"
                      placeholder={t("photosManager.areaPlaceholder")}
                      value={areaMax}
                      onChange={(e) => setAreaMax(e.target.value)}
                      className="mt-1 h-8 text-sm"
                    />
                  </div>
                  {hasAreaFilter && matchingInFilter > 0 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="mb-0.5 h-8 shrink-0 text-xs"
                      onClick={handleSelectAllInFilter}
                    >
                      {t("photosManager.selectMatching", {
                        count: matchingInFilter,
                      })}
                    </Button>
                  )}
                </div>
                {uniqueAreas.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {uniqueAreas.slice(0, 12).map((a) => (
                      <button
                        key={a}
                        type="button"
                        onClick={() => {
                          setAreaMin(String(a));
                          setAreaMax(String(a));
                        }}
                        className="rounded-md border bg-background px-2 py-0.5 text-xs transition-colors hover:bg-muted"
                      >
                        {a}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Chessboard */}
              <div className="max-h-60 overflow-y-auto rounded-xl">
                <UnitsChessboard
                  units={chessboardUnits}
                  labels={{ available: "", booked: "", sold: "" }}
                  showLegend={false}
                  onUnitClick={handleUnitClick}
                  getUnitStatusGroup={(status) =>
                    status === "available"
                      ? "available"
                      : status === "booked"
                        ? "booked"
                        : "sold"
                  }
                  renderUnitMeta={() => ""}
                />
              </div>

              {/* Legend */}
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                  {t("photosManager.legendSelected")} ({selectedIds.size})
                </span>
                {hasAreaFilter && (
                  <span className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                    {t("photosManager.legendInFilter")} ({matchingInFilter})
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
                  {t("photosManager.legendUnbound")}
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end border-t pt-4">
          <Button onClick={handleSave} disabled={!dirty || saving}>
            {saving ? "…" : t("photosManager.save")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Main component ──

const LayoutPhotosManager = ({
  projectId,
  subProjectId,
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
      let query = supabase
        .from("apartments")
        .select("*")
        .eq("project_id", projectId);
      if (subProjectId) query = query.eq("sub_project_id", subProjectId);
      const { data, error } = await query;

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
  }, [projectId, subProjectId]);

  const loadLayoutPhotos = useCallback(async () => {
    try {
      let lpQuery = supabase
        .from("layout_photos")
        .select(
          "id, project_id, layout_type, image_url, description, order_index, is_project_preview, apartment_ids",
        )
        .eq("project_id", projectId)
        .eq("layout_type", selectedLayoutType);
      if (subProjectId) lpQuery = lpQuery.eq("sub_project_id", subProjectId);
      const { data, error } = await lpQuery.order("order_index", {
        ascending: true,
      });

      if (error) throw error;

      setPhotos(
        (data || []).map((p) => ({
          ...p,
          is_project_preview: p.is_project_preview ?? false,
          apartment_ids: (p.apartment_ids as string[] | null) ?? [],
        })),
      );
    } catch (error) {
      console.error("Error loading layout photos:", error);
    }
  }, [projectId, selectedLayoutType, subProjectId]);

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
                  subProjectId,
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
      subProjectId,
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

  const handleAssignmentSaved = useCallback(
    (photoId: string, updated: Partial<LayoutPhoto>) => {
      setPhotos((prev) =>
        prev.map((p) => (p.id === photoId ? { ...p, ...updated } : p)),
      );
    },
    [],
  );

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
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {photos.map((photo) => (
                    <div key={photo.id} className="group relative">
                      <img
                        src={photo.image_url}
                        alt={
                          photo.description || t("photosManager.layoutPhotoAlt")
                        }
                        className="h-40 w-full rounded-xl object-cover"
                      />
                      {/* Badges */}
                      <div className="absolute left-2 top-2 flex flex-wrap gap-1">
                        {photo.is_project_preview && (
                          <Badge
                            variant="secondary"
                            className="gap-1 bg-yellow-100 text-xs text-yellow-800"
                          >
                            <Star className="h-3 w-3" />
                            {t("photosManager.roleProjectPreview")}
                          </Badge>
                        )}
                        {photo.apartment_ids.length > 0 && (
                          <Badge
                            variant="outline"
                            className="gap-1 bg-blue-50 text-xs text-blue-800"
                          >
                            <Users className="h-3 w-3" />
                            {photo.apartment_ids.length}
                          </Badge>
                        )}
                      </div>
                      {/* Action buttons */}
                      <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                        <PhotoSettingsDialog
                          photo={photo}
                          apartments={apartments}
                          layoutType={selectedLayoutType}
                          onSaved={handleAssignmentSaved}
                        />
                        <Button
                          variant="destructive"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() =>
                            handleDeletePhoto(photo.id, photo.image_url)
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
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
