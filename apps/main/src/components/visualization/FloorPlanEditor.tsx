import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@gridix/ui";
import { FileDropzone, UploadProgressCard } from "@gridix/ui";
import { Input } from "@gridix/ui";
import { Label } from "@gridix/ui";
import { Card, CardContent, CardHeader, CardTitle } from "@gridix/ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@gridix/ui";
import { Badge } from "@gridix/ui";
import {
  ChevronLeft,
  ChevronRight,
  Upload,
  Plus,
  Trash2,
  SquarePen,
  Undo2,
  Redo2,
  X,
  Copy,
  RefreshCw,
  Image as ImageIcon,
  Save,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@gridix/utils/api";
import {
  uploadFloorPlan,
  removeFloorPlan,
  deleteApartmentPhoto,
} from "@/features/projectEditor/api/projectEditorApi";
import { useProjectEditorDataContext } from "@/features/projectEditor/context/ProjectEditorDataContext";
import { TooltipProvider } from "@gridix/ui";
import PolygonAnnotator, {
  PolygonAnnotatorRef,
} from "./polygon-editor/PolygonAnnotatorLazy";
import { Shape } from "./polygon-editor/GeometryShapes";
import ApartmentCustomFields from "@/entities/apartment/ui/ApartmentCustomFields";
import ApartmentSyncDialog from "@/features/apartment-sync/ui/ApartmentSyncDialog";
import { useApartmentPhotosUpload } from "@/features/apartment-photos-management/model/useApartmentPhotosUpload";
import { useAuth } from "@/contexts/AuthContext";
import { useProjectInEditorScope } from "@/features/projectEditor/hooks/useProjectInEditorScope";
import { useLanguage } from "@gridix/utils/react";
import { getCurrencySymbolSafe } from "@gridix/utils/lib";
import { Apartment as GlobalApartment } from "@/entities/apartment/model/types";
import type { Json, Tables } from "@gridix/types/database";
import { compressToWebP } from "@gridix/utils/lib";
import { trackUsertourEvent } from "@gridix/utils/integrations";

interface Point {
  x: number;
  y: number;
}

interface Apartment {
  id: string;
  apartment_number: string;
  rooms: number | string;
  area: number;
  price: number;
  status: "available" | "sold" | "reserved";
  polygon: Point[];
  custom_fields: Json | null;
}

interface PolygonSettings {
  colors?: {
    available: string;
    sold: string;
    reserved: string;
  };
  hoverEffects?: {
    scale: boolean;
    colorChange: boolean;
    opacityChange: boolean;
    glow: boolean;
  };
  display?: {
    showNumbers: boolean;
    showTooltip: boolean;
    showArea: boolean;
    showPrice: boolean;
  };
  opacity?: {
    normal: number;
    hover: number;
  };
}

interface FloorPlanEditorProps {
  projectId: string;
  floorNumber: number;
}

const FloorPlanEditor = ({ projectId, floorNumber }: FloorPlanEditorProps) => {
  const [imageUrl, setImageUrl] = useState<string>("");
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [editingApartment, setEditingApartment] = useState<string | null>(null);
  const [apartmentData, setApartmentData] = useState<{
    number: string;
    rooms: number | string;
    area: number;
    price: number;
    status: "available" | "sold" | "reserved";
  }>({
    number: "",
    rooms: 0,
    area: 0,
    price: 0,
    status: "available",
  });
  const [customFieldsData, setCustomFieldsData] = useState<
    Record<string, unknown>
  >({});
  const [loading, setLoading] = useState(false);
  const [polygonSettings, setPolygonSettings] =
    useState<PolygonSettings | null>(null);
  const [allFloors, setAllFloors] = useState<number[]>([]);
  const [apartmentPhotos, setApartmentPhotos] = useState<
    Tables<"apartment_photos">[]
  >([]);
  const [syncDialogOpen, setSyncDialogOpen] = useState(false);
  const [syncSourceApartment, setSyncSourceApartment] =
    useState<GlobalApartment | null>(null);
  const [syncTargetApartments, setSyncTargetApartments] = useState<
    GlobalApartment[]
  >([]);
  const [selectedApartmentId, setSelectedApartmentId] = useState<string | null>(
    null,
  );
  const [floorPlanUploadProgress, setFloorPlanUploadProgress] = useState<{
    fileName: string;
    fileSize: number;
    progress: number;
    status: "uploading" | "complete";
  } | null>(null);
  const [removingFloorPlan, setRemovingFloorPlan] = useState(false);

  // Новые состояния для работы с PolygonAnnotator
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [currentShape, setCurrentShape] = useState<Shape | null>(null);
  const [selectedVertexIndex, setSelectedVertexIndex] = useState<number | null>(
    null,
  );
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const polygonAnnotatorRef = useRef<PolygonAnnotatorRef>(null);
  const floorImageInputRef = useRef<HTMLInputElement | null>(null);
  const floorPlanUploadAbortControllerRef = useRef<AbortController | null>(
    null,
  );
  const floorPlanUploadRequestIdRef = useRef(0);
  const undoStackRef = useRef<Shape[]>([]);
  const redoStackRef = useRef<Shape[]>([]);
  const isApplyingHistoryRef = useRef(false);
  const historyGestureActiveRef = useRef(false);
  const historyGestureTimerRef = useRef<number | null>(null);
  const isApartmentFormOpen = editingApartment !== null;
  const activePolygonApartmentId =
    editingApartment && editingApartment !== "new"
      ? editingApartment
      : selectedApartmentId;
  const canStartDrawingFromImage =
    (isCreatingNew && isApartmentFormOpen && !currentShape) ||
    (!!activePolygonApartmentId && (currentShape?.points.length ?? 0) === 0);

  const cloneShape = useCallback((shape: Shape): Shape => {
    return {
      ...shape,
      points: shape.points.map((point) => ({ ...point })),
    };
  }, []);

  const ensureFloorSelected = useCallback(() => {
    const floorIsNumber = Number.isInteger(floorNumber);
    const hasFloorInProject =
      allFloors.length === 0 || allFloors.includes(floorNumber);

    if (floorIsNumber && hasFloorInProject) {
      return true;
    }

    toast.error("Сначала выберите этаж");
    return false;
  }, [allFloors, floorNumber]);

  const resetHistoryGesture = useCallback(() => {
    historyGestureActiveRef.current = false;
    if (historyGestureTimerRef.current !== null) {
      window.clearTimeout(historyGestureTimerRef.current);
      historyGestureTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      if (historyGestureTimerRef.current !== null) {
        window.clearTimeout(historyGestureTimerRef.current);
      }
      floorPlanUploadAbortControllerRef.current?.abort();
    };
  }, []);

  const { user } = useAuth();
  const { project } = useProjectInEditorScope(projectId);
  const editorData = useProjectEditorDataContext();
  const { t } = useLanguage();
  const currencySymbol = getCurrencySymbolSafe(project?.currency ?? "USD");
  const selectedApartmentForPhotos =
    editingApartment && editingApartment !== "new" ? editingApartment : "";
  const {
    uploading: uploadingApartmentPhotos,
    uploadProgresses: apartmentPhotoUploadProgresses,
    handleCancelUpload: handleCancelApartmentPhotoUpload,
    handleFilesSelected: handleApartmentPhotoFilesSelected,
    resolveDroppedFiles: resolveApartmentPhotoDroppedFiles,
  } = useApartmentPhotosUpload({
    selectedApartment: selectedApartmentForPhotos,
    photosLength: apartmentPhotos.length,
    onAfterUpload: async () => {
      if (selectedApartmentForPhotos) {
        await loadApartmentPhotos(selectedApartmentForPhotos);
      }
    },
  });

  useEffect(() => {
    if (editorData) {
      if (editorData.loading) {
        return;
      }
      if (!editorData.data) {
        setImageUrl("");
        setApartments([]);
        setShapes([]);
        return;
      }
      const floorPlan = editorData.data.floorPlans.find(
        (p) => p.floor_number === floorNumber,
      );
      setImageUrl(floorPlan?.image_url ?? "");

      const floorApartments = editorData.data.apartments.filter(
        (a) => a.floor_number === floorNumber,
      );
      const transformedApartments: Apartment[] = floorApartments.map((apt) => ({
        id: apt.id,
        apartment_number: apt.apartment_number,
        rooms: apt.rooms,
        area: Number(apt.area),
        price: Number(apt.price) || 0,
        status: apt.status as "available" | "sold" | "reserved",
        polygon: Array.isArray(apt.polygon)
          ? (apt.polygon as unknown as Point[])
          : [],
        custom_fields: apt.custom_fields as Json | null,
      }));
      setApartments(transformedApartments);
      const apartmentShapes: Shape[] = transformedApartments.map((apt) => ({
        id: apt.id,
        type: "polygon" as const,
        points: apt.polygon,
        color: getStatusColor(apt.status),
        isSelected: false,
      }));
      setShapes(apartmentShapes);
    } else {
      loadFloorPlan();
      loadApartments();
    }
    loadPolygonSettings();
    loadProjectFloors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, floorNumber, project, editorData?.data]);

  const loadProjectFloors = async () => {
    try {
      // Get floors from building_floors table to include all existing floors
      const { data: buildingFloorsData } = await supabase
        .from("building_floors")
        .select("floor_number")
        .eq("project_id", project?.id || projectId)
        .order("floor_number");

      if (buildingFloorsData && buildingFloorsData.length > 0) {
        const existingFloors = Array.from(
          new Set(buildingFloorsData.map((f) => f.floor_number)),
        ).sort((a, b) => a - b);
        setAllFloors(existingFloors);
      } else if (project) {
        // Fallback to project.floors if no building floors exist
        const floors = Array.from({ length: project.floors }, (_, i) => i + 1);
        setAllFloors(floors);
      }
    } catch (error) {
      console.error("Error loading project floors:", error);
    }
  };

  const loadFloorPlan = async () => {
    try {
      const { data, error } = await supabase
        .from("floor_plans")
        .select("image_url")
        .eq("project_id", project?.id || projectId)
        .eq("floor_number", floorNumber)
        .maybeSingle();

      if (error && error.code !== "PGRST116") throw error;

      if (data?.image_url) {
        setImageUrl(data.image_url);
      } else {
        setImageUrl("");
      }
    } catch (error) {
      console.error("Error loading floor plan:", error);
      toast.error(t("floorPlan.loading.error"));
    }
  };

  const loadApartments = async () => {
    try {
      const { data, error } = await supabase
        .from("apartments")
        .select("*")
        .eq("project_id", project?.id || projectId)
        .eq("floor_number", floorNumber);

      if (error) throw error;

      const transformedApartments: Apartment[] = (data || []).map((apt) => ({
        id: apt.id,
        apartment_number: apt.apartment_number,
        rooms: apt.rooms,
        area: Number(apt.area),
        price: Number(apt.price) || 0,
        status: apt.status as "available" | "sold" | "reserved",
        polygon: Array.isArray(apt.polygon)
          ? (apt.polygon as unknown as Point[])
          : [],
        custom_fields: apt.custom_fields as Json | null,
      }));

      setApartments(transformedApartments);

      // Конвертируем apartments в shapes для отображения
      const apartmentShapes: Shape[] = transformedApartments.map((apt) => ({
        id: apt.id,
        type: "polygon" as const,
        points: apt.polygon,
        color: getStatusColor(apt.status),
        isSelected: false,
      }));

      setShapes(apartmentShapes);
    } catch (error) {
      console.error("Error loading apartments:", error);
      toast.error(t("floorPlan.apartments.loading.error"));
    }
  };

  const loadPolygonSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("projects")
        .select("polygon_settings_floor")
        .eq("id", project?.id || projectId)
        .single();

      if (error) throw error;

      type ProjectsSettingsRow = { polygon_settings_floor?: unknown };
      const row = data as unknown as ProjectsSettingsRow;
      if (row?.polygon_settings_floor) {
        setPolygonSettings(
          row.polygon_settings_floor as unknown as PolygonSettings,
        );
      } else {
        const defaultSettings: PolygonSettings = {
          colors: {
            available: "#22c55e",
            sold: "#ef4444",
            reserved: "#f59e0b",
          },
          hoverEffects: {
            scale: false,
            colorChange: true,
            opacityChange: true,
            glow: true,
          },
          display: {
            showNumbers: true,
            showTooltip: true,
            showArea: false,
            showPrice: false,
          },
          opacity: {
            normal: 0.4,
            hover: 0.7,
          },
        };
        setPolygonSettings(defaultSettings);
      }
    } catch (error) {
      console.error("Error loading polygon settings:", error);
    }
  };

  const handleCancelFloorPlanUpload = useCallback(() => {
    floorPlanUploadAbortControllerRef.current?.abort();
  }, []);

  const handleRemoveFloorPlan = useCallback(async () => {
    if (!imageUrl || loading || removingFloorPlan) {
      return;
    }

    const previousImageUrl = imageUrl;
    setRemovingFloorPlan(true);
    setImageUrl("");

    try {
      await removeFloorPlan(project?.id || projectId, floorNumber, imageUrl);
      toast.success(t("floorPlan.upload.removeSuccess"));
    } catch (error) {
      setImageUrl(previousImageUrl);
      console.error("Error removing floor plan:", error);
      toast.error(t("floorPlan.upload.removeError"));
    } finally {
      setRemovingFloorPlan(false);
    }
  }, [
    floorNumber,
    imageUrl,
    loading,
    project?.id,
    projectId,
    removingFloorPlan,
    t,
  ]);

  const uploadImage = async (file_get: File) => {
    if (!user) {
      toast.error(t("floorPlan.upload.authRequired"));
      return;
    }
    if (!file_get.type.startsWith("image/")) {
      toast.error(t("floorPlan.upload.invalidFileType"));
      return;
    }

    const requestId = floorPlanUploadRequestIdRef.current + 1;
    floorPlanUploadRequestIdRef.current = requestId;
    const abortController = new AbortController();
    floorPlanUploadAbortControllerRef.current = abortController;

    setLoading(true);
    setFloorPlanUploadProgress({
      fileName: file_get.name,
      fileSize: file_get.size,
      progress: 0,
      status: "uploading",
    });

    try {
      const blob = await compressToWebP(file_get);
      const file = new File([blob], `floor-${floorNumber}.webp`, {
        type: "image/webp",
      });
      const pid = project?.id || projectId;
      const { publicUrl: newImageUrl } = await uploadFloorPlan(
        pid,
        floorNumber,
        file,
        {
          signal: abortController.signal,
          onProgress: (progress) => {
            if (floorPlanUploadRequestIdRef.current !== requestId) return;

            setFloorPlanUploadProgress((prev) =>
              prev
                ? {
                    ...prev,
                    progress,
                    status: "uploading",
                  }
                : null,
            );
          },
        },
      );

      if (
        floorPlanUploadRequestIdRef.current !== requestId ||
        abortController.signal.aborted
      ) {
        return;
      }

      setFloorPlanUploadProgress((prev) =>
        prev
          ? {
              ...prev,
              progress: 100,
              status: "complete",
            }
          : null,
      );

      await new Promise((resolve) => setTimeout(resolve, 450));

      if (
        floorPlanUploadRequestIdRef.current !== requestId ||
        abortController.signal.aborted
      ) {
        return;
      }

      setImageUrl(newImageUrl);
      toast.success(t("floorPlan.upload.success"));
      void trackUsertourEvent({
        eventName: "gridix_project_floorplan_uploaded",
        properties: { project_id: pid, floor_number: floorNumber },
        onceKey: "gridix_project_floorplan_uploaded",
      });
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return;
      }
      console.error("Error uploading floor plan:", error);
      toast.error(t("floorPlan.upload.error"));
    } finally {
      if (floorPlanUploadRequestIdRef.current === requestId) {
        if (floorPlanUploadAbortControllerRef.current === abortController) {
          floorPlanUploadAbortControllerRef.current = null;
        }
        setFloorPlanUploadProgress(null);
        setLoading(false);
      }
    }
  };

  const loadApartmentPhotos = async (apartmentId: string) => {
    try {
      const { data, error } = await supabase
        .from("apartment_photos")
        .select("*")
        .eq("apartment_id", apartmentId)
        .order("order_index", { ascending: true });

      if (error) throw error;

      setApartmentPhotos(data || []);
    } catch (error) {
      console.error("Error loading apartment photos:", error);
    }
  };

  const handleDeleteApartmentPhoto = async (
    photoId: string,
    imageUrl: string,
  ) => {
    try {
      await deleteApartmentPhoto(photoId, imageUrl);
      toast.success(t("floorPlan.apartments.photoDeleteSuccess"));
      if (editingApartment && editingApartment !== "new") {
        loadApartmentPhotos(editingApartment);
      }
    } catch (error) {
      console.error("Error deleting apartment photo:", error);
      toast.error(t("floorPlan.apartments.photoDeleteError"));
    }
  };

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    await uploadImage(file);
    event.currentTarget.value = "";
  };

  const duplicateToAllFloors = async () => {
    if (!imageUrl && apartments.length === 0) {
      toast.error(t("floorPlan.duplicate.noData"));
      return;
    }

    setLoading(true);
    try {
      const floorsToUpdate = allFloors.filter((f) => f !== floorNumber);

      for (const targetFloor of floorsToUpdate) {
        if (imageUrl) {
          const { data: existingPlan } = await supabase
            .from("floor_plans")
            .select("id")
            .eq("project_id", project?.id || projectId)
            .eq("floor_number", targetFloor)
            .maybeSingle();

          if (existingPlan) {
            await supabase
              .from("floor_plans")
              .update({
                image_url: imageUrl,
              })
              .eq("id", existingPlan.id);
          } else {
            await supabase.from("floor_plans").insert({
              project_id: project?.id || projectId,
              floor_number: targetFloor,
              image_url: imageUrl,
            });
          }
        }

        if (apartments.length > 0) {
          // Получаем существующие апартаменты на целевом этаже
          const { data: existingApartments } = await supabase
            .from("apartments")
            .select("id, apartment_number, area, rooms")
            .eq("project_id", project?.id || projectId)
            .eq("floor_number", targetFloor)
            .order("apartment_number");

          // Группируем исходные квартиры по площади и количеству комнат
          const sourceApartmentsByKey = new Map<string, Apartment[]>();
          apartments.forEach((apt) => {
            const area = Math.round(apt.area * 100) / 100;
            const key = `${area}_${apt.rooms}`;
            if (!sourceApartmentsByKey.has(key)) {
              sourceApartmentsByKey.set(key, []);
            }
            sourceApartmentsByKey.get(key)!.push(apt);
          });

          // Группируем целевые квартиры по площади и количеству комнат
          const targetApartmentsByKey = new Map<
            string,
            Array<{ id: string; apartment_number: string }>
          >();
          existingApartments?.forEach((apt) => {
            const area = Math.round(apt.area * 100) / 100;
            const key = `${area}_${apt.rooms}`;
            if (!targetApartmentsByKey.has(key)) {
              targetApartmentsByKey.set(key, []);
            }
            targetApartmentsByKey.get(key)!.push({
              id: apt.id,
              apartment_number: apt.apartment_number,
            });
          });

          // Обрабатываем каждую группу
          for (const [key, sourceApts] of sourceApartmentsByKey.entries()) {
            const targetApts = targetApartmentsByKey.get(key);

            if (!targetApts || targetApts.length === 0) {
              continue;
            }

            // Сопоставляем 1-к-1 по индексу
            const minLength = Math.min(sourceApts.length, targetApts.length);

            for (let i = 0; i < minLength; i++) {
              const sourceApt = sourceApts[i];
              const targetApt = targetApts[i];

              if (!sourceApt || !targetApt) continue;

              try {
                await supabase
                  .from("apartments")
                  .update({
                    polygon: sourceApt.polygon as { x: number; y: number }[],
                  })
                  .eq("id", targetApt.id);
              } catch (error) {
                console.error("Error updating apartment polygon:", error, {
                  apartmentId: targetApt.id,
                  apartmentNumber: targetApt.apartment_number,
                  sourceApartmentNumber: sourceApt.apartment_number,
                  key,
                  targetFloor,
                });
              }
            }

            // Предупреждение если количество не совпадает
            if (sourceApts.length !== targetApts.length) {
              console.warn(
                `Mismatch in apartment count for ${key} on floor ${targetFloor}: source has ${sourceApts.length}, target has ${targetApts.length}`,
              );
            }
          }
        }
      }

      toast.success(t("floorPlan.duplicate.success"));
    } catch (error) {
      console.error("Error duplicating to all floors:", error);
      toast.error(t("floorPlan.duplicate.error"));
    } finally {
      setLoading(false);
    }
  };

  const getActualCurrentShape = async (fallback: Shape) => {
    if (!polygonAnnotatorRef.current) return fallback;
    const actualShape = await polygonAnnotatorRef.current.getCurrentShape();
    return actualShape ?? fallback;
  };

  const persistCurrentPolygonBeforeApartmentSwitch = async () => {
    const polygonApartmentId =
      editingApartment && editingApartment !== "new"
        ? editingApartment
        : selectedApartmentId;

    if (!polygonApartmentId || !currentShape) {
      return true;
    }

    const shapeToSave = await getActualCurrentShape(currentShape);

    if (shapeToSave.points.length < 3) {
      return true;
    }

    try {
      const { error } = await supabase
        .from("apartments")
        .update({
          polygon: shapeToSave.points as unknown as Json,
        })
        .eq("id", polygonApartmentId);

      if (error) throw error;

      setApartments((prev) =>
        prev.map((apt) =>
          apt.id === polygonApartmentId
            ? { ...apt, polygon: shapeToSave.points as Point[] }
            : apt,
        ),
      );

      setShapes((prev) =>
        prev.map((shape) =>
          shape.id === polygonApartmentId
            ? {
                ...shape,
                points: shapeToSave.points,
              }
            : shape,
        ),
      );

      return true;
    } catch (error) {
      console.error(
        "Error auto-saving apartment polygon before switch:",
        error,
      );
      toast.error(t("floorPlan.apartments.saveError"));
      return false;
    }
  };

  const startEditingApartment = async (apartmentId: string | null) => {
    if (!ensureFloorSelected()) {
      return false;
    }

    if (editingApartment !== apartmentId) {
      const persisted = await persistCurrentPolygonBeforeApartmentSwitch();
      if (!persisted) return false;
    }

    if (apartmentId === "new") {
      setIsCreatingNew(true);
      setEditingApartment("new");
      setApartmentData({
        number: "",
        rooms: 1,
        area: 0,
        price: 0,
        status: "available",
      });
      setCustomFieldsData({});

      // Для controlled-режима стартуем с null: первый клик создаст базовый полигон
      setCurrentShape(null);
      undoStackRef.current = [];
      redoStackRef.current = [];
      resetHistoryGesture();
      setSelectedVertexIndex(null);
      return true;
    } else if (apartmentId) {
      const apartment = apartments.find((apt) => apt.id === apartmentId);
      if (apartment) {
        setIsCreatingNew(false);
        setEditingApartment(apartmentId);
        setSelectedApartmentId(apartmentId);
        setApartmentData({
          number: apartment.apartment_number,
          rooms: apartment.rooms,
          area: apartment.area,
          price: apartment.price,
          status: apartment.status,
        });

        // Загружаем кастомные поля
        if (
          apartment.custom_fields &&
          typeof apartment.custom_fields === "object" &&
          !Array.isArray(apartment.custom_fields)
        ) {
          setCustomFieldsData(
            apartment.custom_fields as Record<string, unknown>,
          );
        } else {
          setCustomFieldsData({});
        }

        // Загружаем фото апартамента
        loadApartmentPhotos(apartmentId);

        // Устанавливаем текущий shape для редактирования
        const editingShape: Shape = {
          id: apartment.id,
          type: "polygon",
          points: apartment.polygon,
          color: getStatusColor(apartment.status),
          isSelected: true,
        };
        // Для квартиры без полигона оставляем currentShape = null,
        // чтобы первый клик по изображению запустил создание полигона.
        setCurrentShape(apartment.polygon.length > 0 ? editingShape : null);
        undoStackRef.current = [];
        redoStackRef.current = [];
        resetHistoryGesture();
        setSelectedVertexIndex(apartment.polygon.length > 0 ? 0 : null);
        return true;
      }
    }
    return false;
  };

  const activateApartmentPolygon = async (apartmentId: string) => {
    if (!ensureFloorSelected()) {
      return false;
    }

    if (activePolygonApartmentId !== apartmentId) {
      const persisted = await persistCurrentPolygonBeforeApartmentSwitch();
      if (!persisted) return false;
    }

    const apartment = apartments.find((apt) => apt.id === apartmentId);
    if (!apartment) {
      return false;
    }

    const polygonShape: Shape = {
      id: apartment.id,
      type: "polygon",
      points: apartment.polygon,
      color: getStatusColor(apartment.status),
      isSelected: true,
    };

    setSelectedApartmentId(apartmentId);
    setCurrentShape(apartment.polygon.length > 0 ? polygonShape : null);
    undoStackRef.current = [];
    redoStackRef.current = [];
    resetHistoryGesture();
    setSelectedVertexIndex(apartment.polygon.length > 0 ? 0 : null);

    return true;
  };

  const handlePolygonSave = async () => {
    if (!ensureFloorSelected()) {
      return;
    }

    if (!apartmentData.number) {
      toast.error(t("floorPlan.apartments.fillAllFields"));
      return;
    }

    try {
      // Разрешаем сохранение квартиры без полигона.
      // Если shape неполный (<3 точек), сохраняем как пустой полигон.
      let points: Point[] = [];
      if (currentShape) {
        const shapeToSave = await getActualCurrentShape(currentShape);
        points = shapeToSave.points.length >= 3 ? shapeToSave.points : [];
      }

      if (isCreatingNew) {
        const { data, error } = await supabase
          .from("apartments")
          .insert({
            project_id: project?.id || projectId,
            floor_number: floorNumber,
            apartment_number: apartmentData.number,
            rooms:
              typeof apartmentData.rooms === "string"
                ? apartmentData.rooms
                : apartmentData.rooms.toString(),
            area: apartmentData.area,
            price: apartmentData.price,
            status: apartmentData.status,
            polygon: points as unknown as Json,
            custom_fields: customFieldsData as Json,
          })
          .select()
          .single();

        if (error) throw error;

        toast.success(t("floorPlan.apartments.saveSuccess"));
      } else {
        const existingApartment = apartments.find(
          (apt) => apt.id === editingApartment,
        );
        if (!existingApartment) return;

        const { error } = await supabase
          .from("apartments")
          .update({
            apartment_number: apartmentData.number,
            rooms:
              typeof apartmentData.rooms === "string"
                ? apartmentData.rooms
                : apartmentData.rooms.toString(),
            area: apartmentData.area,
            price: apartmentData.price,
            status: apartmentData.status,
            polygon: points as unknown as Json,
            custom_fields: customFieldsData as Json,
          })
          .eq("id", existingApartment.id);

        if (error) throw error;
        toast.success(t("floorPlan.apartments.saveSuccess"));
      }

      // Перезагружаем данные из БД
      await loadApartments();
      resetEditing();
    } catch (error) {
      console.error("Error saving apartment:", error);
      toast.error(t("floorPlan.apartments.saveError"));
    }
  };

  const handleCurrentShapeUpdate = (shape: Shape | null) => {
    setCurrentShape((prevShape) => {
      const prevPoints = prevShape ? JSON.stringify(prevShape.points) : "";
      const nextPoints = shape ? JSON.stringify(shape.points) : "";

      if (
        !isApplyingHistoryRef.current &&
        prevShape &&
        shape &&
        prevShape.id === shape.id &&
        prevPoints !== nextPoints
      ) {
        if (!historyGestureActiveRef.current) {
          undoStackRef.current.push(cloneShape(prevShape));
        }
        redoStackRef.current = [];
        historyGestureActiveRef.current = true;
        if (historyGestureTimerRef.current !== null) {
          window.clearTimeout(historyGestureTimerRef.current);
        }
        historyGestureTimerRef.current = window.setTimeout(() => {
          historyGestureActiveRef.current = false;
          historyGestureTimerRef.current = null;
        }, 180);
      }
      return shape;
    });

    setSelectedVertexIndex((prev) => {
      if (!shape || shape.points.length === 0) return null;
      if (prev === null) return 0;
      return prev >= shape.points.length ? shape.points.length - 1 : prev;
    });
  };

  const applyHistoryShape = (shape: Shape | null) => {
    isApplyingHistoryRef.current = true;
    setCurrentShape(shape);
    setSelectedVertexIndex((prev) => {
      if (!shape || shape.points.length === 0) return null;
      if (prev === null) return 0;
      return prev >= shape.points.length ? shape.points.length - 1 : prev;
    });
    queueMicrotask(() => {
      isApplyingHistoryRef.current = false;
    });
  };

  const handleUndo = () => {
    const previous = undoStackRef.current.pop();
    if (!previous) return;
    resetHistoryGesture();
    if (currentShape) {
      redoStackRef.current.push(cloneShape(currentShape));
    }
    applyHistoryShape(cloneShape(previous));
  };

  const handleRedo = () => {
    const next = redoStackRef.current.pop();
    if (!next) return;
    resetHistoryGesture();
    if (currentShape) {
      undoStackRef.current.push(cloneShape(currentShape));
    }
    applyHistoryShape(cloneShape(next));
  };

  const handleDeletePoint = async () => {
    if (selectedVertexIndex === null || !currentShape) return;

    const shapeToEdit = await getActualCurrentShape(currentShape);

    if (shapeToEdit.points.length <= 3) return;

    const nextPoints = shapeToEdit.points.filter(
      (_, index) => index !== selectedVertexIndex,
    );

    setSelectedVertexIndex(
      nextPoints.length > 0
        ? Math.min(selectedVertexIndex, nextPoints.length - 1)
        : null,
    );

    handleCurrentShapeUpdate({
      ...shapeToEdit,
      points: nextPoints,
    });
  };

  const handlePolygonCancel = () => {
    resetEditing();
  };

  const handleDeletePolygon = () => {
    if (!activePolygonApartmentId) return;
    setCurrentShape(null);
    setSelectedVertexIndex(null);
    setShapes((prev) =>
      prev.map((shape) =>
        shape.id === activePolygonApartmentId
          ? { ...shape, points: [] }
          : shape,
      ),
    );
    setApartments((prev) =>
      prev.map((apt) =>
        apt.id === activePolygonApartmentId ? { ...apt, polygon: [] } : apt,
      ),
    );
  };

  const pointCount = currentShape?.points.length ?? 0;
  const normalizedSelectedVertexIndex =
    selectedVertexIndex !== null &&
    selectedVertexIndex >= 0 &&
    selectedVertexIndex < pointCount
      ? selectedVertexIndex
      : pointCount > 0
        ? pointCount - 1
        : null;
  const selectedVertexDisplayIndex =
    normalizedSelectedVertexIndex !== null
      ? normalizedSelectedVertexIndex + 1
      : 0;
  const canSelectVertex = pointCount > 0;

  const selectPrevVertex = () => {
    if (!canSelectVertex) return;
    setSelectedVertexIndex((prev) => {
      const current =
        prev !== null && prev >= 0 && prev < pointCount ? prev : pointCount - 1;
      return current === 0 ? pointCount - 1 : current - 1;
    });
  };

  const selectNextVertex = () => {
    if (!canSelectVertex) return;
    setSelectedVertexIndex((prev) => {
      const current =
        prev !== null && prev >= 0 && prev < pointCount ? prev : pointCount - 1;
      return (current + 1) % pointCount;
    });
  };

  const handlePolygonAnnotationClick = (id: string) => {
    if (editingApartment) {
      if (editingApartment !== id) {
        void (async () => {
          await startEditingApartment(id);
        })();
      }
      return;
    }
    void (async () => {
      await activateApartmentPolygon(id);
    })();
  };

  const deleteApartment = async (apartmentId: string) => {
    try {
      const { error } = await supabase
        .from("apartments")
        .delete()
        .eq("id", apartmentId);

      if (error) throw error;

      setApartments((prev) => prev.filter((apt) => apt.id !== apartmentId));
      toast.success(t("floorPlan.apartments.deleteSuccess"));
    } catch (error) {
      console.error("Error deleting apartment:", error);
      toast.error(t("floorPlan.apartments.deleteError"));
    }
  };

  const resetEditing = () => {
    setEditingApartment(null);
    setSelectedApartmentId(null);
    setIsCreatingNew(false);
    setCurrentShape(null);
    undoStackRef.current = [];
    redoStackRef.current = [];
    resetHistoryGesture();
    setSelectedVertexIndex(null);
    setApartmentData({
      number: "",
      rooms: 1,
      area: 0,
      price: 0,
      status: "available",
    });
    setCustomFieldsData({});
    setApartmentPhotos([]);
  };

  const getStatusColor = (status: string) => {
    if (polygonSettings?.colors) {
      switch (status) {
        case "available":
          return polygonSettings.colors.available;
        case "sold":
          return polygonSettings.colors.sold;
        case "reserved":
          return polygonSettings.colors.reserved;
        default:
          return polygonSettings.colors.available;
      }
    }

    switch (status) {
      case "available":
        return "#22c55e";
      case "sold":
        return "#ef4444";
      case "reserved":
        return "#f59e0b";
      default:
        return "#22c55e";
    }
  };

  const openSyncDialog = (sourceApartment: Apartment) => {
    // Найти все квартиры с такой же площадью и количеством комнат
    const targetApartments = apartments.filter(
      (apt) =>
        apt.id !== sourceApartment.id &&
        apt.area === sourceApartment.area &&
        apt.rooms === sourceApartment.rooms,
    );

    if (targetApartments.length === 0) {
      toast.error(t("apartmentsManager.syncError"));
      return;
    }

    // Преобразовать в глобальный тип для диалога
    const globalSourceApartment: GlobalApartment = {
      ...sourceApartment,
      floor_number: floorNumber,
      type: "apartment" as const,
      project_id: projectId,
      created_at: "",
      updated_at: "",
      floor_plan_id: null,
    };

    const globalTargetApartments: GlobalApartment[] = targetApartments.map(
      (apt) => ({
        ...apt,
        floor_number: floorNumber,
        type: "apartment" as const,
        project_id: projectId,
        created_at: "",
        updated_at: "",
        floor_plan_id: null,
      }),
    );

    setSyncSourceApartment(globalSourceApartment);
    setSyncTargetApartments(globalTargetApartments);
    setSyncDialogOpen(true);
  };

  const handleSyncComplete = (updatedApartments: GlobalApartment[]) => {
    // Обновить локальное состояние
    setApartments((prev) =>
      prev.map((apt) => {
        const updated = updatedApartments.find(
          (updApt) => updApt.id === apt.id,
        );
        if (updated) {
          return {
            id: updated.id,
            apartment_number: updated.apartment_number,
            rooms: updated.rooms,
            area: updated.area,
            price: updated.price || 0,
            status: updated.status,
            polygon: updated.polygon,
            custom_fields: updated.custom_fields,
          };
        }
        return apt;
      }),
    );

    // Сбросить состояние диалога
    setSyncSourceApartment(null);
    setSyncTargetApartments([]);
  };

  const handleDuplicateApartment = async (apartment: Apartment) => {
    try {
      // Генерируем новый номер квартиры с префиксом "Copy"
      const duplicateNumber = `Copy ${apartment.apartment_number}`;

      // Проверяем, существует ли уже квартира с таким номером
      let finalNumber = duplicateNumber;
      let counter = 1;
      while (apartments.some((apt) => apt.apartment_number === finalNumber)) {
        finalNumber = `${duplicateNumber} (${counter})`;
        counter++;
      }

      const { data, error } = await supabase
        .from("apartments")
        .insert({
          project_id: projectId,
          floor_number: floorNumber,
          apartment_number: finalNumber,
          rooms:
            typeof apartment.rooms === "string"
              ? apartment.rooms
              : apartment.rooms.toString(),
          area: apartment.area,
          price: apartment.price,
          status: apartment.status,
          polygon: apartment.polygon as unknown as Json,
          custom_fields: apartment.custom_fields as Json,
        })
        .select()
        .single();

      if (error) throw error;

      // Добавляем новую квартиру в локальное состояние
      const newApartment: Apartment = {
        id: data.id,
        apartment_number: data.apartment_number,
        rooms: data.rooms,
        area: Number(data.area),
        price: Number(data.price),
        status: data.status as "available" | "sold" | "reserved",
        polygon: data.polygon as unknown as Point[],
        custom_fields: data.custom_fields as Json | null,
      };

      setApartments((prev) => [...prev, newApartment]);
      toast.success(`Квартира продублирована как "${finalNumber}"`);
    } catch (error) {
      console.error("Error duplicating apartment:", error);
      toast.error("Ошибка при дублировании квартиры");
    }
  };

  const getStatusColorClass = (status: string) => {
    switch (status) {
      case "sold":
        return "bg-red-100 text-red-800";
      case "reserved":
        return "bg-yellow-100 text-yellow-800";
      case "available":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "sold":
        return t("floorPlan.apartments.sold");
      case "reserved":
        return t("floorPlan.apartments.reserved");
      case "available":
        return t("floorPlan.apartments.available");
      default:
        return status;
    }
  };

  return (
    <TooltipProvider>
      <div className="space-y-4">
        <Input
          ref={floorImageInputRef}
          id="floor-image"
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          disabled={loading}
          className="hidden"
        />

        <div className="flex flex-col items-start justify-between gap-4 lg:flex-row lg:items-center">
          <div className="flex w-full items-center gap-4">
            <h2 className="text-lg font-semibold">{t("floorPlan.title")}</h2>
            <Badge variant="outline">
              {t("projectEditor.floor")} {floorNumber}
            </Badge>
          </div>
          <div className="flex w-full gap-2 lg:w-auto">
            {imageUrl && !floorPlanUploadProgress ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  onClick={() => floorImageInputRef.current?.click()}
                  disabled={loading || removingFloorPlan}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {t("floorPlan.upload.changeImage")}
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  type="button"
                  onClick={() => {
                    void handleRemoveFloorPlan();
                  }}
                  disabled={loading || removingFloorPlan}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {t("floorPlan.upload.removeImage")}
                </Button>
              </>
            ) : null}
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={duplicateToAllFloors}
              disabled={
                loading ||
                removingFloorPlan ||
                (!imageUrl && apartments.length === 0)
              }
            >
              <Copy className="mr-2 h-4 w-4" />
              {t("floorPlan.duplicateToAllFloors")}
            </Button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-md">
                {t("floorPlan.apartments.title")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button
                  onClick={() => {
                    void (async () => {
                      await startEditingApartment("new");
                    })();
                  }}
                  disabled={isApartmentFormOpen}
                  size="sm"
                  className="w-full"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {t("floorPlan.apartments.add")}
                </Button>

                <div className="max-h-[500px] space-y-2 overflow-y-auto">
                  {apartments.map((apartment) => (
                    <div
                      key={apartment.id}
                      className={
                        editingApartment === apartment.id ||
                        selectedApartmentId === apartment.id
                          ? "cursor-pointer rounded border border-primary bg-primary/10 p-2 transition-colors hover:bg-muted/50"
                          : "cursor-pointer rounded border p-2 transition-colors hover:bg-muted/50"
                      }
                      onClick={() => {
                        void activateApartmentPolygon(apartment.id);
                      }}
                    >
                      <div className="mb-1 flex items-center justify-between">
                        <span className="text-sm font-medium">
                          #{apartment.apartment_number}
                        </span>
                        <Badge
                          variant={
                            apartment.status === "available"
                              ? "default"
                              : apartment.status === "sold"
                                ? "destructive"
                                : "secondary"
                          }
                          className="text-xs"
                        >
                          {apartment.status === "available"
                            ? t("floorPlan.apartments.available")
                            : apartment.status === "sold"
                              ? t("floorPlan.apartments.sold")
                              : t("floorPlan.apartments.reserved")}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {apartment.rooms} {t("floorPlan.apartments.roomsShort")}
                        , {apartment.area} m2
                      </div>
                      <div className="mt-2 flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            void (async () => {
                              setSelectedApartmentId(apartment.id);
                              await startEditingApartment(apartment.id);
                            })();
                          }}
                          className="h-6 px-2"
                          title={t("floorPlan.apartments.editAction") || "Edit"}
                        >
                          <SquarePen className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDuplicateApartment(apartment);
                          }}
                          disabled={isApartmentFormOpen}
                          className="h-6 px-2"
                          title="Duplicate"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            openSyncDialog(apartment);
                          }}
                          disabled={isApartmentFormOpen}
                          className="h-6 px-2"
                          title={t("floorPlan.apartments.syncAction") || "Sync"}
                        >
                          <RefreshCw className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteApartment(apartment.id);
                          }}
                          disabled={isApartmentFormOpen}
                          className="h-6 px-2"
                          title="Delete"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4 lg:col-span-2">
            {isApartmentFormOpen ? (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-md">
                      {t("floorPlan.apartments.parameters")}
                    </CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        resetEditing();
                      }}
                    >
                      Back
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="apt-number-edit">
                      {t("floorPlan.apartments.number")}
                    </Label>
                    <Input
                      id="apt-number-edit"
                      value={apartmentData.number}
                      onChange={(e) =>
                        setApartmentData((prev) => ({
                          ...prev,
                          number: e.target.value,
                        }))
                      }
                      placeholder={t("floorPlan.apartments.numberPlaceholder")}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="apt-rooms-edit">
                      {t("floorPlan.apartments.rooms")}
                    </Label>
                    <Select
                      value={apartmentData.rooms.toString()}
                      onValueChange={(value) =>
                        setApartmentData((prev) => ({ ...prev, rooms: value }))
                      }
                    >
                      <SelectTrigger id="apt-rooms-edit" className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">
                          {t("apartment.studio")}
                        </SelectItem>
                        {[1, 2, 3, 4, 5].map((num) => (
                          <SelectItem key={num} value={num.toString()}>
                            {num}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="apt-area-edit">
                      {t("floorPlan.apartments.area")}
                    </Label>
                    <Input
                      id="apt-area-edit"
                      type="number"
                      value={apartmentData.area}
                      onChange={(e) =>
                        setApartmentData((prev) => ({
                          ...prev,
                          area: parseFloat(e.target.value) || 0,
                        }))
                      }
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="apt-price-edit">
                      {t("floorPlan.apartments.price")}
                    </Label>
                    <Input
                      id="apt-price-edit"
                      type="number"
                      value={apartmentData.price}
                      onChange={(e) =>
                        setApartmentData((prev) => ({
                          ...prev,
                          price: parseFloat(e.target.value) || 0,
                        }))
                      }
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="apt-status-edit">
                      {t("floorPlan.apartments.status")}
                    </Label>
                    <Select
                      value={apartmentData.status}
                      onValueChange={(
                        value: "available" | "sold" | "reserved",
                      ) =>
                        setApartmentData((prev) => ({ ...prev, status: value }))
                      }
                    >
                      <SelectTrigger id="apt-status-edit" className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="available">
                          {t("floorPlan.apartments.available")}
                        </SelectItem>
                        <SelectItem value="reserved">
                          {t("floorPlan.apartments.reserved")}
                        </SelectItem>
                        <SelectItem value="sold">
                          {t("floorPlan.apartments.sold")}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <ApartmentCustomFields
                    {...(editingApartment !== "new" && editingApartment
                      ? { apartmentId: editingApartment }
                      : {})}
                    projectId={projectId}
                    customFieldsData={customFieldsData}
                    onCustomFieldsChange={setCustomFieldsData}
                  />

                  {editingApartment && editingApartment !== "new" && (
                    <div className="space-y-2 border-t pt-4">
                      <div className="flex items-center gap-2">
                        <ImageIcon className="h-4 w-4" />
                        <Label className="text-sm font-medium">
                          {t("floorPlan.apartments.photos")}
                        </Label>
                      </div>
                      <div className="overflow-hidden rounded-xl border-2 border-dashed border-muted-foreground/25">
                        {apartmentPhotoUploadProgresses.length > 0 ? (
                          <div className="space-y-3 p-4">
                            {apartmentPhotoUploadProgresses.map(
                              (uploadProgress) => (
                                <UploadProgressCard
                                  key={uploadProgress.id}
                                  fileName={uploadProgress.fileName}
                                  fileSize={uploadProgress.fileSize}
                                  progress={uploadProgress.progress}
                                  status={uploadProgress.status}
                                  icon={
                                    <ImageIcon className="h-8 w-8 text-sky-600" />
                                  }
                                  onCancel={() =>
                                    handleCancelApartmentPhotoUpload(
                                      uploadProgress.id,
                                    )
                                  }
                                />
                              ),
                            )}
                          </div>
                        ) : null}

                        {!uploadingApartmentPhotos && (
                          <FileDropzone
                            accept="image/*"
                            multiple
                            heading={t("photosManager.uploadPhotos")}
                            description={t("photosManager.uploadMultiple")}
                            idleLabel={t("projectEditor.clickOrDrop")}
                            dropLabel={t("projectEditor.clickOrDrop")}
                            resolveDroppedFiles={
                              resolveApartmentPhotoDroppedFiles
                            }
                            onFilesSelected={handleApartmentPhotoFilesSelected}
                          />
                        )}
                      </div>
                      {apartmentPhotos.length > 0 && (
                        <div className="grid grid-cols-2 gap-2">
                          {apartmentPhotos.map((photo, index) => (
                            <div key={photo.id} className="group relative">
                              <div className="aspect-[4/3] overflow-hidden rounded-md bg-muted">
                                <img
                                  src={photo.image_url}
                                  alt={`Apartment photo ${index + 1}`}
                                  loading="lazy"
                                  decoding="async"
                                  className="h-full w-full object-cover transition duration-200 group-hover:scale-[1.03]"
                                />
                              </div>
                              <div className="pointer-events-none absolute inset-x-0 bottom-0 rounded-b-md bg-gradient-to-t from-black/65 via-black/20 to-transparent px-3 pb-2 pt-8 text-xs font-medium text-white">
                                Photo {index + 1}
                              </div>
                              <Button
                                variant="destructive"
                                size="sm"
                                type="button"
                                className="absolute right-2 top-2 h-8 w-8 rounded-full p-0 opacity-100 shadow-sm transition md:opacity-0 md:group-hover:opacity-100"
                                onClick={() =>
                                  handleDeleteApartmentPhoto(
                                    photo.id,
                                    photo.image_url,
                                  )
                                }
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-2 border-t pt-4">
                    <Button
                      onClick={handlePolygonSave}
                      size="sm"
                      disabled={
                        isCreatingNew && currentShape?.points.length === 0
                      }
                    >
                      <Save className="mr-1 h-3 w-3" />
                      {t("buildingImage.polygon.save")}
                    </Button>
                    <Button
                      onClick={handlePolygonCancel}
                      variant="outline"
                      size="sm"
                    >
                      <X className="mr-1 h-3 w-3" />
                      {t("buildingImage.polygon.cancel")}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex flex-col gap-3">
                    <CardTitle className="text-md">
                      {isCreatingNew
                        ? t("floorPlan.apartments.newApartment")
                        : editingApartment
                          ? t("floorPlan.apartments.editApartment", {
                              number: apartmentData.number,
                            })
                          : t("floorPlan.title")}
                    </CardTitle>
                    {(editingApartment || currentShape) && (
                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          onClick={handleUndo}
                          variant="outline"
                          size="sm"
                          disabled={undoStackRef.current.length === 0}
                          title="Undo (Ctrl+Z)"
                        >
                          <Undo2 className="h-3.5 w-3.5" />
                          <span className="ml-1">Undo</span>
                        </Button>
                        <Button
                          onClick={handleRedo}
                          variant="outline"
                          size="sm"
                          disabled={redoStackRef.current.length === 0}
                          title="Redo (Ctrl+Shift+Z)"
                        >
                          <Redo2 className="h-3.5 w-3.5" />
                          <span className="ml-1">Redo</span>
                        </Button>
                        <Button
                          onClick={selectPrevVertex}
                          variant="outline"
                          size="sm"
                          disabled={!canSelectVertex}
                        >
                          <ChevronLeft className="h-3.5 w-3.5" />
                        </Button>
                        <span className="min-w-[56px] text-center text-xs text-muted-foreground">
                          {selectedVertexDisplayIndex}/{pointCount}
                        </span>
                        <Button
                          onClick={selectNextVertex}
                          variant="outline"
                          size="sm"
                          disabled={!canSelectVertex}
                        >
                          <ChevronRight className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          onClick={() => {
                            void handleDeletePoint();
                          }}
                          variant="outline"
                          size="sm"
                          disabled={
                            !currentShape ||
                            selectedVertexIndex === null ||
                            currentShape.points.length <= 3
                          }
                          title={t("floorPlan.apartments.deletePoint")}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span className="ml-1">
                            {t("floorPlan.apartments.deletePoint")}
                          </span>
                        </Button>
                        <Button
                          onClick={handleDeletePolygon}
                          variant="outline"
                          size="sm"
                          disabled={!currentShape || pointCount === 0}
                          title={t("floorPlan.apartments.deletePolygon")}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span className="ml-1">
                            {t("floorPlan.apartments.deletePolygon")}
                          </span>
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-2">
                  {floorPlanUploadProgress ? (
                    <div className="flex h-[600px] items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-muted p-6">
                      <div className="w-full max-w-md">
                        <UploadProgressCard
                          fileName={floorPlanUploadProgress.fileName}
                          fileSize={floorPlanUploadProgress.fileSize}
                          progress={floorPlanUploadProgress.progress}
                          status={floorPlanUploadProgress.status}
                          icon={<ImageIcon className="h-8 w-8 text-sky-600" />}
                          onCancel={handleCancelFloorPlanUpload}
                        />
                      </div>
                    </div>
                  ) : imageUrl ? (
                    <PolygonAnnotator
                      ref={polygonAnnotatorRef}
                      engine="controlled"
                      imageUrl={imageUrl}
                      shapes={shapes}
                      currentShape={currentShape}
                      selectedVertexIndex={selectedVertexIndex}
                      onSelectVertexIndex={setSelectedVertexIndex}
                      onCurrentShapeUpdate={handleCurrentShapeUpdate}
                      onClickAnnotationId={handlePolygonAnnotationClick}
                      drawingEnabled={canStartDrawingFromImage}
                    />
                  ) : (
                    <div className="overflow-hidden rounded-xl border-2 border-dashed border-muted">
                      <FileDropzone
                        accept="image/*"
                        multiple={false}
                        heading={t("floorPlan.upload.title")}
                        description={t("floorPlan.upload.dragDrop")}
                        idleLabel={t("projectEditor.clickOrDrop")}
                        dropLabel={t("projectEditor.clickOrDrop")}
                        onFilesSelected={async (files) => {
                          const file = files[0];
                          if (!file) return;
                          await uploadImage(file);
                        }}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Диалог синхронизации */}
      <ApartmentSyncDialog
        open={syncDialogOpen}
        onOpenChange={setSyncDialogOpen}
        sourceApartment={syncSourceApartment}
        targetApartments={syncTargetApartments}
        onSyncComplete={handleSyncComplete}
        currencySymbol={currencySymbol}
        getStatusColor={getStatusColorClass}
        getStatusLabel={getStatusLabel}
      />
    </TooltipProvider>
  );
};

export default FloorPlanEditor;
