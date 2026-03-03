import { useState, useRef, useCallback, useEffect } from "react";
import { toast } from "sonner";
import type { Shape } from "@/components/visualization/polygon-editor/GeometryShapes";
import type { PolygonAnnotatorRef } from "@/components/visualization/polygon-editor/PolygonAnnotator";
import type {
  BuildingFloor,
  ProjectFacade,
  FacadeDisplaySettings,
} from "../model/types";
import { useShapeUndoRedo } from "./useShapeUndoRedo";
import * as api from "../api/buildingImageEditorApi";

interface UseFloorPolygonEditorParams {
  buildingFloors: BuildingFloor[];
  activeFacade: ProjectFacade | null;
  facadeDisplaySettings: FacadeDisplaySettings;
  loadBuildingData: () => Promise<void>;
  projectId: string;
  project: { id?: string; floors?: number } | null;
  t: (key: string, params?: Record<string, unknown>) => string;
}

export function useFloorPolygonEditor({
  buildingFloors,
  activeFacade,
  facadeDisplaySettings,
  loadBuildingData,
  projectId,
  project,
  t,
}: UseFloorPolygonEditorParams) {
  const [selectedFloor, setSelectedFloor] = useState<number>(1);
  const [isEditing, setIsEditing] = useState(false);
  const [editingFloorId, setEditingFloorId] = useState<string | null>(null);
  const [isCreatingNewFloor, setIsCreatingNewFloor] = useState(false);
  const autoSaveTimerRef = useRef<number | null>(null);
  const lastSavedPointsRef = useRef<string>("");
  const editingFloorIdRef = useRef<string | null>(null);
  const isCreatingNewFloorRef = useRef(false);

  const polygonAnnotatorRef = useRef<PolygonAnnotatorRef>(null);

  const {
    currentShape,
    setCurrentShape,
    handleCurrentShapeUpdate: handleCurrentShapeUpdateBase,
    handleUndo,
    handleRedo,
    resetStacks,
    undoStackRef,
    redoStackRef,
  } = useShapeUndoRedo(isEditing);

  const getStyleById = useCallback(
    (_id: string) => ({
      fill: facadeDisplaySettings.colors.building,
      fillOpacity: facadeDisplaySettings.opacity.normal,
      stroke: facadeDisplaySettings.colors.building,
      strokeOpacity: 1,
      strokeWidth: 2,
    }),
    [facadeDisplaySettings],
  );

  const startEditingFloor = (floorId: string) => {
    const floor = buildingFloors.find((f) => f.id === floorId);
    if (floor) {
      editingFloorIdRef.current = floorId;
      isCreatingNewFloorRef.current = false;
      setEditingFloorId(floorId);
      setSelectedFloor(floor.floor_number);
      setIsEditing(true);
      setIsCreatingNewFloor(false);
      resetStacks();

      const editingShape: Shape = {
        id: floor.id,
        type: "polygon",
        points: floor.polygon,
        color: floor.color || "#3b82f6",
        isSelected: true,
      };
      lastSavedPointsRef.current = JSON.stringify(editingShape.points);
      setCurrentShape(editingShape);
    }
  };

  const startCreatingNewFloor = () => {
    editingFloorIdRef.current = null;
    isCreatingNewFloorRef.current = true;
    setIsCreatingNewFloor(true);
    setIsEditing(true);
    setEditingFloorId(null);
    resetStacks();
    lastSavedPointsRef.current = "";
    setCurrentShape(null);
  };

  const clearAutoSaveTimer = useCallback(() => {
    if (autoSaveTimerRef.current !== null) {
      window.clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = null;
    }
  }, []);

  const persistExistingPolygon = useCallback(
    async (
      floorId: string,
      points: { x: number; y: number }[],
      color: string,
    ) => {
      const pointsSignature = JSON.stringify(points);
      if (pointsSignature === lastSavedPointsRef.current) return;

      await api.updateFloorPolygon(floorId, points, color);
      lastSavedPointsRef.current = pointsSignature;
    },
    [],
  );

  useEffect(() => {
    return () => {
      if (autoSaveTimerRef.current !== null) {
        window.clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, []);

  const scheduleAutoSave = useCallback(
    (shape: Shape) => {
      const floorId = editingFloorIdRef.current;
      if (!floorId || isCreatingNewFloorRef.current) return;

      const pointsSignature = JSON.stringify(shape.points);
      if (pointsSignature === lastSavedPointsRef.current) return;

      clearAutoSaveTimer();
      autoSaveTimerRef.current = window.setTimeout(() => {
        void persistExistingPolygon(
          floorId,
          shape.points as { x: number; y: number }[],
          shape.color,
        ).catch((error) => {
          console.error("Error auto-saving polygon:", error);
        });
      }, 400);
    },
    [clearAutoSaveTimer, persistExistingPolygon],
  );

  const handleCurrentShapeUpdate = useCallback(
    (shape: Shape | null) => {
      handleCurrentShapeUpdateBase(shape);
      if (shape && editingFloorIdRef.current) {
        scheduleAutoSave(shape);
      }
    },
    [handleCurrentShapeUpdateBase, scheduleAutoSave],
  );

  // Backup: also watch currentShape via useEffect for cases where
  // the callback wrapper doesn't fire (e.g. undo/redo).
  useEffect(() => {
    if (!isEditing || isCreatingNewFloor || !editingFloorId || !currentShape)
      return;
    scheduleAutoSave(currentShape);
  }, [
    currentShape,
    editingFloorId,
    isCreatingNewFloor,
    isEditing,
    scheduleAutoSave,
  ]);

  const handlePolygonSave = async () => {
    if (!currentShape) return;
    if (!activeFacade?.id) return;

    try {
      let shapeToSave = currentShape;
      if (polygonAnnotatorRef.current) {
        const actualShape = await polygonAnnotatorRef.current.getCurrentShape();
        if (actualShape) {
          shapeToSave = actualShape;
        }
      }

      if (isCreatingNewFloor) {
        await api.upsertFloorPolygon({
          projectId: project?.id || projectId,
          facadeId: activeFacade.id,
          floorNumber: selectedFloor,
          polygon: shapeToSave.points as { x: number; y: number }[],
          color: shapeToSave.color,
        });

        if (project && selectedFloor > (project.floors ?? 0)) {
          await api.updateProjectFloors(
            project?.id || projectId,
            selectedFloor,
          );
        }

        toast.success(
          t("buildingImage.polygon.createSuccess", { floor: selectedFloor }),
        );
      } else if (editingFloorId) {
        clearAutoSaveTimer();
        await persistExistingPolygon(
          editingFloorId,
          shapeToSave.points as { x: number; y: number }[],
          shapeToSave.color,
        );

        toast.success(
          t("buildingImage.polygon.saveSuccess", { floor: selectedFloor }),
        );
      }

      editingFloorIdRef.current = null;
      isCreatingNewFloorRef.current = false;
      setEditingFloorId(null);
      setIsCreatingNewFloor(false);
      setCurrentShape(null);
      setIsEditing(false);
      resetStacks();
      clearAutoSaveTimer();

      await loadBuildingData();
    } catch (error) {
      console.error("Error saving polygon:", error);
      toast.error(
        isCreatingNewFloor
          ? t("buildingImage.polygon.createError")
          : t("buildingImage.polygon.saveError"),
      );
    }
  };

  const handlePolygonCancel = () => {
    clearAutoSaveTimer();
    editingFloorIdRef.current = null;
    isCreatingNewFloorRef.current = false;
    setIsEditing(false);
    setEditingFloorId(null);
    setIsCreatingNewFloor(false);
    setCurrentShape(null);
    resetStacks();
    loadBuildingData();
  };

  const handleDeleteFloorPolygon = async (floorId: string) => {
    try {
      await api.deleteFloorPolygon(floorId);
      await loadBuildingData();
      toast.success(t("buildingImage.polygon.deleteSuccess"));
    } catch (error) {
      console.error("Error deleting polygon:", error);
      toast.error(t("buildingImage.polygon.deleteError"));
    }
  };

  const resetEditing = () => {
    clearAutoSaveTimer();
    editingFloorIdRef.current = null;
    isCreatingNewFloorRef.current = false;
    setCurrentShape(null);
    setIsEditing(false);
    setEditingFloorId(null);
    setIsCreatingNewFloor(false);
    resetStacks();
  };

  return {
    selectedFloor,
    setSelectedFloor,
    isEditing,
    editingFloorId,
    isCreatingNewFloor,
    polygonAnnotatorRef,

    currentShape,
    handleCurrentShapeUpdate,
    handleUndo,
    handleRedo,
    undoStackRef,
    redoStackRef,

    getStyleById,
    startEditingFloor,
    startCreatingNewFloor,
    handlePolygonSave,
    handlePolygonCancel,
    handleDeleteFloorPolygon,
    resetEditing,
  };
}
