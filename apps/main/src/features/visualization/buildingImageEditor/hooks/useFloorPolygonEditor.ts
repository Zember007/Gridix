import { useState, useRef, useCallback } from "react";
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

  const polygonAnnotatorRef = useRef<PolygonAnnotatorRef>(null);

  const {
    currentShape,
    setCurrentShape,
    handleCurrentShapeUpdate,
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
      setCurrentShape(editingShape);
    }
  };

  const startCreatingNewFloor = () => {
    setIsCreatingNewFloor(true);
    setIsEditing(true);
    setEditingFloorId(null);
    resetStacks();
    // Do NOT set a placeholder currentShape with a non-existent annotation ID.
    // Let the annotator create a real annotation via drawing; then createAnnotation
    // event will populate currentShape with the correct id + points.
    setCurrentShape(null);
  };

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
        await api.updateFloorPolygon(
          editingFloorId,
          shapeToSave.points as { x: number; y: number }[],
          shapeToSave.color,
        );

        toast.success(
          t("buildingImage.polygon.saveSuccess", { floor: selectedFloor }),
        );
      }

      await loadBuildingData();

      setEditingFloorId(null);
      setIsCreatingNewFloor(false);
      setCurrentShape(null);
      setIsEditing(false);
      resetStacks();
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
