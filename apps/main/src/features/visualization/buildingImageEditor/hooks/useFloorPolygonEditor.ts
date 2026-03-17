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
  const [selectedVertexIndex, setSelectedVertexIndex] = useState<number | null>(
    null,
  );
  const autoSaveTimerRef = useRef<number | null>(null);
  const autoSaveRequestRef = useRef<Promise<void>>(Promise.resolve());
  const lastSavedPointsRef = useRef<string>("");
  const buildingFloorsRef = useRef(buildingFloors);
  const editingFloorIdRef = useRef<string | null>(null);
  const isCreatingNewFloorRef = useRef(false);
  const preCancelShapeRef = useRef<{
    floorId: string;
    points: { x: number; y: number }[];
    color: string;
  } | null>(null);

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

  useEffect(() => {
    buildingFloorsRef.current = buildingFloors;
  }, [buildingFloors]);

  const startEditingFloor = useCallback(
    (floorId: string) => {
      const floor = buildingFloorsRef.current.find((f) => f.id === floorId);
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
        preCancelShapeRef.current = {
          floorId: floor.id,
          points: floor.polygon.map((point) => ({ ...point })),
          color: floor.color || "#3b82f6",
        };
        lastSavedPointsRef.current = JSON.stringify(editingShape.points);
        setSelectedVertexIndex(floor.polygon.length > 0 ? 0 : null);
        // Для этажей без полигона оставляем currentShape = null,
        // чтобы клик по изображению запускал инициализацию полигона.
        setCurrentShape(floor.polygon.length > 0 ? editingShape : null);
      }
    },
    [resetStacks, setCurrentShape],
  );

  const requestStartEditingFloor = useCallback(
    (floorId: string) => {
      if (editingFloorIdRef.current === floorId) return;
      startEditingFloor(floorId);
    },
    [startEditingFloor],
  );

  const startCreatingNewFloor = (targetFloor: number = selectedFloor) => {
    const existingFloor = buildingFloorsRef.current.find(
      (floor) => floor.floor_number === targetFloor,
    );
    if (existingFloor) {
      startEditingFloor(existingFloor.id);
      return;
    }

    setSelectedFloor(targetFloor);
    editingFloorIdRef.current = null;
    isCreatingNewFloorRef.current = true;
    setIsCreatingNewFloor(true);
    setIsEditing(true);
    setEditingFloorId(null);
    resetStacks();
    lastSavedPointsRef.current = "";
    preCancelShapeRef.current = null;
    setSelectedVertexIndex(null);
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
        const request = persistExistingPolygon(
          floorId,
          shape.points as { x: number; y: number }[],
          shape.color,
        ).catch((error) => {
          console.error("Error auto-saving polygon:", error);
        });
        autoSaveRequestRef.current = request;
      }, 400);
    },
    [clearAutoSaveTimer, persistExistingPolygon],
  );

  const handleCurrentShapeUpdate = useCallback(
    (shape: Shape | null) => {
      setSelectedVertexIndex((prev) => {
        if (shape === null) return null;
        if (prev === null) return shape.points.length > 0 ? 0 : null;
        return prev >= shape.points.length ? null : prev;
      });
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

  const saveCurrentPolygon = useCallback(
    async ({
      keepEditingState = false,
      silent = false,
      reloadData = true,
    }: {
      keepEditingState?: boolean;
      silent?: boolean;
      reloadData?: boolean;
    } = {}) => {
      if (!currentShape) return false;
      if (!activeFacade?.id) return false;

      try {
        let shapeToSave = currentShape;
        if (polygonAnnotatorRef.current) {
          const actualShape =
            await polygonAnnotatorRef.current.getCurrentShape();
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

          if (!silent) {
            toast.success(
              t("buildingImage.polygon.createSuccess", {
                floor: selectedFloor,
              }),
            );
          }
        } else if (editingFloorId) {
          clearAutoSaveTimer();
          await persistExistingPolygon(
            editingFloorId,
            shapeToSave.points as { x: number; y: number }[],
            shapeToSave.color,
          );

          if (!silent) {
            toast.success(
              t("buildingImage.polygon.saveSuccess", { floor: selectedFloor }),
            );
          }
        }

        editingFloorIdRef.current = null;
        isCreatingNewFloorRef.current = false;
        if (!keepEditingState) {
          setEditingFloorId(null);
          setIsCreatingNewFloor(false);
          setCurrentShape(null);
          setSelectedVertexIndex(null);
          setIsEditing(false);
          resetStacks();
          preCancelShapeRef.current = null;
        }
        clearAutoSaveTimer();

        if (reloadData) {
          await loadBuildingData();
        }
        return true;
      } catch (error) {
        console.error("Error saving polygon:", error);
        if (!silent) {
          toast.error(
            isCreatingNewFloor
              ? t("buildingImage.polygon.createError")
              : t("buildingImage.polygon.saveError"),
          );
        }
        return false;
      }
    },
    [
      activeFacade?.id,
      clearAutoSaveTimer,
      currentShape,
      editingFloorId,
      isCreatingNewFloor,
      loadBuildingData,
      persistExistingPolygon,
      project,
      projectId,
      resetStacks,
      selectedFloor,
      setCurrentShape,
      t,
    ],
  );

  const handlePolygonSave = useCallback(async () => {
    return await saveCurrentPolygon();
  }, [saveCurrentPolygon]);

  const persistCurrentPolygonBeforeFloorSwitch = useCallback(async () => {
    if (!isEditing || !currentShape) return true;

    if (isCreatingNewFloor && currentShape.points.length === 0) {
      return true;
    }

    return await saveCurrentPolygon({
      silent: true,
      keepEditingState: false,
      reloadData: true,
    });
  }, [currentShape, isCreatingNewFloor, isEditing, saveCurrentPolygon]);

  const pointCount = currentShape?.points.length ?? 0;
  const isPolygonCreationEnabled =
    isEditing &&
    ((isCreatingNewFloor && !currentShape) ||
      (!isCreatingNewFloor && (currentShape?.points.length ?? 0) === 0));
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
  const canSelectVertex = useCallback(() => pointCount > 0, [pointCount]);
  const selectPrevVertex = useCallback(() => {
    if (pointCount <= 0) return;
    setSelectedVertexIndex((prev) => {
      const current =
        prev !== null && prev >= 0 && prev < pointCount ? prev : pointCount - 1;
      return current === 0 ? pointCount - 1 : current - 1;
    });
  }, [pointCount]);
  const selectNextVertex = useCallback(() => {
    if (pointCount <= 0) return;
    setSelectedVertexIndex((prev) => {
      const current =
        prev !== null && prev >= 0 && prev < pointCount ? prev : pointCount - 1;
      return (current + 1) % pointCount;
    });
  }, [pointCount]);
  const handleDeletePoint = useCallback(async () => {
    let shapeToEdit = currentShape;
    if (polygonAnnotatorRef.current) {
      const actualShape = await polygonAnnotatorRef.current.getCurrentShape();
      if (actualShape) {
        shapeToEdit = actualShape;
      }
    }

    if (!shapeToEdit || shapeToEdit.points.length <= 3) return;
    if (normalizedSelectedVertexIndex === null) return;
    const deleteIndex = normalizedSelectedVertexIndex;
    const nextPoints = shapeToEdit.points.filter(
      (_, idx) => idx !== deleteIndex,
    );
    setSelectedVertexIndex(
      nextPoints.length > 0
        ? Math.min(deleteIndex, nextPoints.length - 1)
        : null,
    );
    handleCurrentShapeUpdate({
      ...shapeToEdit,
      points: nextPoints,
    });
  }, [currentShape, handleCurrentShapeUpdate, normalizedSelectedVertexIndex]);

  const discardCurrentPolygonChanges = useCallback(
    async ({
      keepEditingState = false,
      silent = false,
      reloadData = true,
    }: {
      keepEditingState?: boolean;
      silent?: boolean;
      reloadData?: boolean;
    } = {}) => {
      const cancelFloorId = editingFloorIdRef.current;
      const preCancelShape = preCancelShapeRef.current;

      clearAutoSaveTimer();

      if (!keepEditingState) {
        editingFloorIdRef.current = null;
        isCreatingNewFloorRef.current = false;
        setIsEditing(false);
        setEditingFloorId(null);
        setIsCreatingNewFloor(false);
        setCurrentShape(null);
        setSelectedVertexIndex(null);
        resetStacks();
        preCancelShapeRef.current = null;
      }

      try {
        await autoSaveRequestRef.current;

        if (
          cancelFloorId &&
          preCancelShape &&
          preCancelShape.floorId === cancelFloorId
        ) {
          await api.updateFloorPolygon(
            cancelFloorId,
            preCancelShape.points,
            preCancelShape.color,
          );
          lastSavedPointsRef.current = JSON.stringify(preCancelShape.points);
        }

        if (reloadData) {
          await loadBuildingData();
        }
        return true;
      } catch (error) {
        console.error("Error cancelling polygon changes:", error);
        if (!silent) {
          toast.error(t("buildingImage.polygon.saveError"));
        }
        return false;
      }
    },
    [clearAutoSaveTimer, loadBuildingData, resetStacks, setCurrentShape, t],
  );

  const handlePolygonCancel = async () => {
    await discardCurrentPolygonChanges();
  };

  const handleDeleteFloorPolygon = async (floorId: string) => {
    try {
      await api.deleteFloorPolygon(floorId);
      await loadBuildingData();
      toast.success(t("buildingImage.polygon.deleteSuccess"));
      return true;
    } catch (error) {
      console.error("Error deleting polygon:", error);
      toast.error(t("buildingImage.polygon.deleteError"));
      return false;
    }
  };

  const resetEditing = () => {
    clearAutoSaveTimer();
    editingFloorIdRef.current = null;
    isCreatingNewFloorRef.current = false;
    setCurrentShape(null);
    setSelectedVertexIndex(null);
    setIsEditing(false);
    setEditingFloorId(null);
    setIsCreatingNewFloor(false);
    preCancelShapeRef.current = null;
    resetStacks();
  };

  return {
    selectedFloor,
    setSelectedFloor,
    isEditing,
    editingFloorId,
    isCreatingNewFloor,
    isPolygonCreationEnabled,
    polygonAnnotatorRef,

    currentShape,
    handleCurrentShapeUpdate,
    handleUndo,
    handleRedo,
    canSelectVertex,
    pointCount,
    selectedVertexDisplayIndex,
    selectPrevVertex,
    selectNextVertex,
    handleDeletePoint,
    selectedVertexIndex,
    setSelectedVertexIndex,
    undoStackRef,
    redoStackRef,

    getStyleById,
    requestStartEditingFloor,
    startCreatingNewFloor,
    persistCurrentPolygonBeforeFloorSwitch,
    handlePolygonSave,
    handlePolygonCancel,
    handleDeleteFloorPolygon,
    resetEditing,
  };
}
