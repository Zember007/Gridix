import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { toast } from "sonner";
import type { Shape } from "@/components/visualization/polygon-editor/GeometryShapes";
import type { PolygonAnnotatorRef } from "@/components/visualization/polygon-editor/PolygonAnnotatorLazy";
import type {
  InfrastructureZone,
  MasterplanArea,
} from "@/features/genplan/model/types";
import {
  deleteMasterplanArea,
  upsertMasterplan,
} from "@/features/genplan/api/genplanApi";
import type { GenplanEditorConfig } from "../model/types";
import { useShapeUndoRedo } from "./useShapeUndoRedo";

const COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#06b6d4",
  "#f97316",
  "#84cc16",
  "#ec4899",
  "#6366f1",
];

export type GenplanLinkedEntityType = "sub_project" | "infrastructure_zone";

function geometryPoints(area: MasterplanArea): Array<{ x: number; y: number }> {
  const g = area.geometry;
  return Array.isArray(g) ? (g as Array<{ x: number; y: number }>) : [];
}

function findAreaForEntity(
  areas: MasterplanArea[],
  entityType: GenplanLinkedEntityType,
  entityId: string,
): MasterplanArea | undefined {
  return areas.find(
    (a) =>
      a.linked_entity_type === entityType && a.linked_entity_id === entityId,
  );
}

function areaHasValidPolygon(area: MasterplanArea | undefined): boolean {
  if (!area) return false;
  return geometryPoints(area).length >= 3;
}

interface UseGenplanPolygonEditorParams {
  projectId: string;
  genplan: GenplanEditorConfig;
  infrastructureZones: InfrastructureZone[];
  masterplanImageUrl: string | null;
  uploadedUrlRef: React.MutableRefObject<string | null>;
  t: (key: string, params?: Record<string, unknown>) => string;
}

export function useGenplanPolygonEditor({
  projectId,
  genplan,
  infrastructureZones,
  masterplanImageUrl,
  uploadedUrlRef,
  t,
}: UseGenplanPolygonEditorParams) {
  const areasRef = useRef(genplan.areas);
  useEffect(() => {
    areasRef.current = genplan.areas;
  }, [genplan.areas]);

  const [selectedEntityType, setSelectedEntityType] =
    useState<GenplanLinkedEntityType | null>(null);
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [editingAreaId, setEditingAreaId] = useState<string | null>(null);
  const [isCreatingNewArea, setIsCreatingNewArea] = useState(false);
  const [selectedVertexIndex, setSelectedVertexIndex] = useState<number | null>(
    null,
  );

  const autoSaveTimerRef = useRef<number | null>(null);
  const autoSaveRequestRef = useRef<Promise<void>>(Promise.resolve());
  const lastSavedPointsRef = useRef<string>("");
  const editingAreaIdRef = useRef<string | null>(null);
  const isCreatingNewAreaRef = useRef(false);
  const selectedEntityTypeRef = useRef<GenplanLinkedEntityType | null>(null);
  const selectedEntityIdRef = useRef<string | null>(null);
  const preCancelShapeRef = useRef<{
    areaId: string;
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

  useEffect(() => {
    selectedEntityTypeRef.current = selectedEntityType;
    selectedEntityIdRef.current = selectedEntityId;
  }, [selectedEntityType, selectedEntityId]);

  const labelMap = useMemo(() => {
    const map: Record<string, string> = {};
    genplan.areas.forEach((area) => {
      if (area.linked_entity_type === "sub_project") {
        const sp = genplan.subProjects.find(
          (s) => s.id === area.linked_entity_id,
        );
        if (sp) map[area.id] = sp.name;
      } else if (area.linked_entity_type === "infrastructure_zone") {
        const iz = infrastructureZones.find(
          (z) => z.id === area.linked_entity_id,
        );
        if (iz) map[area.id] = iz.name;
      }
    });
    return map;
  }, [genplan.areas, genplan.subProjects, infrastructureZones]);

  const shapes = useMemo(
    () =>
      genplan.areas.map((a, i) => ({
        id: a.id,
        type: "polygon" as const,
        points: geometryPoints(a),
        color: COLORS[i % COLORS.length] ?? "#3b82f6",
        isSelected: false,
      })),
    [genplan.areas],
  );

  const colorForAreaId = useCallback(
    (areaId: string) => {
      const idx = genplan.areas.findIndex((a) => a.id === areaId);
      return COLORS[(idx >= 0 ? idx : 0) % COLORS.length] ?? "#3b82f6";
    },
    [genplan.areas],
  );

  const getStyleById = useCallback((_id: string) => {
    return {
      fill: "#3b82f6",
      fillOpacity: 0.35,
      stroke: "#3b82f6",
      strokeOpacity: 1,
      strokeWidth: 2,
    };
  }, []);

  const getBackgroundUrlForUpsert = useCallback(
    () => uploadedUrlRef.current ?? masterplanImageUrl ?? null,
    [masterplanImageUrl, uploadedUrlRef],
  );

  const clearAutoSaveTimer = useCallback(() => {
    if (autoSaveTimerRef.current !== null) {
      window.clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = null;
    }
  }, []);

  const persistExistingAreaPolygon = useCallback(
    async (
      areaId: string,
      points: { x: number; y: number }[],
      color: string,
    ) => {
      const pointsSignature = JSON.stringify(points);
      if (pointsSignature === lastSavedPointsRef.current) return;

      const area = areasRef.current.find((a) => a.id === areaId);
      if (!area || !genplan.masterplanId) return;

      await upsertMasterplan(
        projectId,
        {
          id: genplan.masterplanId,
          name: "Site plan",
          is_default: true,
          background_asset_url: getBackgroundUrlForUpsert(),
        },
        [
          {
            id: area.id,
            area_type: area.area_type,
            linked_entity_type: area.linked_entity_type,
            linked_entity_id: area.linked_entity_id,
            geometry_type: area.geometry_type || "polygon",
            geometry: points,
            label: area.label,
            short_label: area.short_label,
            sort_order: area.sort_order,
            z_index: area.z_index,
            is_clickable: area.is_clickable,
            status: area.status,
          },
        ],
      );
      lastSavedPointsRef.current = pointsSignature;
    },
    [genplan.masterplanId, getBackgroundUrlForUpsert, projectId],
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
      const areaId = editingAreaIdRef.current;
      if (!areaId || isCreatingNewAreaRef.current) return;

      const pointsSignature = JSON.stringify(shape.points);
      if (pointsSignature === lastSavedPointsRef.current) return;

      clearAutoSaveTimer();
      autoSaveTimerRef.current = window.setTimeout(() => {
        const request = persistExistingAreaPolygon(
          areaId,
          shape.points as { x: number; y: number }[],
          shape.color,
        ).catch((error) => {
          console.error("Genplan auto-save error:", error);
        });
        autoSaveRequestRef.current = request;
      }, 400);
    },
    [clearAutoSaveTimer, persistExistingAreaPolygon],
  );

  const reloadAreas = useCallback(async () => {
    genplan.onMasterplanUpdated();
  }, [genplan]);

  const startEditingArea = useCallback(
    (areaId: string) => {
      const area = areasRef.current.find((a) => a.id === areaId);
      if (!area) return;

      if (
        area.linked_entity_type === "sub_project" ||
        area.linked_entity_type === "infrastructure_zone"
      ) {
        const lt = area.linked_entity_type as GenplanLinkedEntityType;
        const lid = area.linked_entity_id;
        if (lid) {
          setSelectedEntityType(lt);
          setSelectedEntityId(lid);
          selectedEntityTypeRef.current = lt;
          selectedEntityIdRef.current = lid;
        }
      }

      editingAreaIdRef.current = areaId;
      isCreatingNewAreaRef.current = false;
      setEditingAreaId(areaId);
      setIsEditing(true);
      setIsCreatingNewArea(false);
      resetStacks();

      const pts = geometryPoints(area);
      const color = colorForAreaId(areaId);
      const editingShape: Shape = {
        id: area.id,
        type: "polygon",
        points: pts,
        color,
        isSelected: true,
      };
      preCancelShapeRef.current = {
        areaId: area.id,
        points: pts.map((p) => ({ ...p })),
        color,
      };
      lastSavedPointsRef.current = JSON.stringify(editingShape.points);
      setSelectedVertexIndex(pts.length > 0 ? 0 : null);
      setCurrentShape(pts.length > 0 ? editingShape : null);
    },
    [colorForAreaId, resetStacks, setCurrentShape],
  );

  const requestStartEditingArea = useCallback(
    (areaId: string) => {
      if (editingAreaIdRef.current === areaId) return;
      startEditingArea(areaId);
    },
    [startEditingArea],
  );

  const startCreatingNewArea = useCallback(
    (entityType: GenplanLinkedEntityType, entityId: string) => {
      const existing = findAreaForEntity(
        areasRef.current,
        entityType,
        entityId,
      );
      if (existing) {
        startEditingArea(existing.id);
        return;
      }

      setSelectedEntityType(entityType);
      setSelectedEntityId(entityId);
      selectedEntityTypeRef.current = entityType;
      selectedEntityIdRef.current = entityId;

      editingAreaIdRef.current = null;
      isCreatingNewAreaRef.current = true;
      setIsCreatingNewArea(true);
      setIsEditing(true);
      setEditingAreaId(null);
      resetStacks();
      lastSavedPointsRef.current = "";
      preCancelShapeRef.current = null;
      setSelectedVertexIndex(null);
      setCurrentShape(null);
    },
    [resetStacks, setCurrentShape, startEditingArea],
  );

  const handleCurrentShapeUpdate = useCallback(
    (shape: Shape | null) => {
      setSelectedVertexIndex((prev) => {
        if (shape === null) return null;
        if (prev === null) return shape.points.length > 0 ? 0 : null;
        return prev >= shape.points.length ? null : prev;
      });
      handleCurrentShapeUpdateBase(shape);
      if (shape && editingAreaIdRef.current) {
        scheduleAutoSave(shape);
      }
    },
    [handleCurrentShapeUpdateBase, scheduleAutoSave],
  );

  useEffect(() => {
    if (!isEditing || isCreatingNewArea || !editingAreaId || !currentShape)
      return;
    scheduleAutoSave(currentShape);
  }, [
    currentShape,
    editingAreaId,
    isCreatingNewArea,
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
      if (!genplan.masterplanId) {
        if (!silent) toast.error(t("genplan.editor.saveMasterplanFirst"));
        return false;
      }

      const entityType = selectedEntityTypeRef.current;
      const entityId = selectedEntityIdRef.current;
      if (isCreatingNewAreaRef.current && (!entityType || !entityId)) {
        if (!silent) toast.error(t("genplan.infraZones.selectEntityFirst"));
        return false;
      }

      try {
        let shapeToSave = currentShape;
        if (polygonAnnotatorRef.current) {
          const actualShape =
            await polygonAnnotatorRef.current.getCurrentShape();
          if (actualShape) {
            shapeToSave = actualShape;
          }
        }

        const bgUrl = uploadedUrlRef.current ?? masterplanImageUrl ?? null;

        if (isCreatingNewAreaRef.current && entityType && entityId) {
          await upsertMasterplan(
            projectId,
            {
              id: genplan.masterplanId,
              name: "Site plan",
              is_default: true,
              background_asset_url: bgUrl,
            },
            [
              {
                area_type:
                  entityType === "infrastructure_zone"
                    ? "infrastructure"
                    : "building",
                linked_entity_type: entityType,
                linked_entity_id: entityId,
                geometry_type: "polygon",
                geometry: shapeToSave.points as { x: number; y: number }[],
                is_clickable: true,
                status: "active",
              },
            ],
          );

          if (!silent) {
            const name =
              entityType === "sub_project"
                ? (genplan.subProjects.find((s) => s.id === entityId)?.name ??
                  "")
                : (infrastructureZones.find((z) => z.id === entityId)?.name ??
                  "");
            toast.success(
              t("buildingImage.genplan.polygon.createSuccess", { name }),
            );
          }
        } else if (editingAreaIdRef.current) {
          clearAutoSaveTimer();
          const area = areasRef.current.find(
            (a) => a.id === editingAreaIdRef.current,
          );
          if (!area) return false;
          await upsertMasterplan(
            projectId,
            {
              id: genplan.masterplanId,
              name: "Site plan",
              is_default: true,
              background_asset_url: bgUrl,
            },
            [
              {
                id: area.id,
                area_type: area.area_type,
                linked_entity_type: area.linked_entity_type,
                linked_entity_id: area.linked_entity_id,
                geometry_type: area.geometry_type || "polygon",
                geometry: shapeToSave.points as { x: number; y: number }[],
                label: area.label,
                short_label: area.short_label,
                sort_order: area.sort_order,
                z_index: area.z_index,
                is_clickable: area.is_clickable,
                status: area.status,
              },
            ],
          );
          lastSavedPointsRef.current = JSON.stringify(shapeToSave.points);

          if (!silent) {
            const name = labelMap[area.id] ?? "";
            toast.success(
              t("buildingImage.genplan.polygon.saveSuccess", { name }),
            );
          }
        }

        editingAreaIdRef.current = null;
        isCreatingNewAreaRef.current = false;
        if (!keepEditingState) {
          setEditingAreaId(null);
          setIsCreatingNewArea(false);
          setCurrentShape(null);
          setSelectedVertexIndex(null);
          setIsEditing(false);
          resetStacks();
          preCancelShapeRef.current = null;
        }
        clearAutoSaveTimer();

        if (reloadData) {
          await reloadAreas();
        }
        return true;
      } catch (error) {
        console.error("Genplan polygon save error:", error);
        if (!silent) {
          toast.error(
            isCreatingNewAreaRef.current
              ? t("buildingImage.polygon.createError")
              : t("buildingImage.polygon.saveError"),
          );
        }
        return false;
      }
    },
    [
      clearAutoSaveTimer,
      currentShape,
      genplan.masterplanId,
      genplan.subProjects,
      infrastructureZones,
      labelMap,
      masterplanImageUrl,
      projectId,
      reloadAreas,
      resetStacks,
      setCurrentShape,
      t,
      uploadedUrlRef,
    ],
  );

  const handlePolygonSave = useCallback(async () => {
    return await saveCurrentPolygon();
  }, [saveCurrentPolygon]);

  const persistCurrentPolygonBeforeEntitySwitch = useCallback(async () => {
    if (!isEditing || !currentShape) return true;

    if (isCreatingNewArea && currentShape.points.length === 0) {
      return true;
    }

    return await saveCurrentPolygon({
      silent: true,
      keepEditingState: false,
      reloadData: true,
    });
  }, [currentShape, isCreatingNewArea, isEditing, saveCurrentPolygon]);

  const pointCount = currentShape?.points.length ?? 0;
  const isPolygonCreationEnabled =
    isEditing &&
    ((isCreatingNewArea && !currentShape) ||
      (!isCreatingNewArea && (currentShape?.points.length ?? 0) === 0));

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
      const cancelAreaId = editingAreaIdRef.current;
      const preCancelShape = preCancelShapeRef.current;

      clearAutoSaveTimer();

      if (!keepEditingState) {
        editingAreaIdRef.current = null;
        isCreatingNewAreaRef.current = false;
        setIsEditing(false);
        setEditingAreaId(null);
        setIsCreatingNewArea(false);
        setCurrentShape(null);
        setSelectedVertexIndex(null);
        resetStacks();
        preCancelShapeRef.current = null;
      }

      try {
        await autoSaveRequestRef.current;

        if (
          cancelAreaId &&
          preCancelShape &&
          preCancelShape.areaId === cancelAreaId &&
          genplan.masterplanId
        ) {
          const row = areasRef.current.find((a) => a.id === cancelAreaId);
          if (row) {
            await upsertMasterplan(
              projectId,
              {
                id: genplan.masterplanId,
                name: "Site plan",
                is_default: true,
                background_asset_url: getBackgroundUrlForUpsert(),
              },
              [
                {
                  id: row.id,
                  area_type: row.area_type,
                  linked_entity_type: row.linked_entity_type,
                  linked_entity_id: row.linked_entity_id,
                  geometry_type: row.geometry_type || "polygon",
                  geometry: preCancelShape.points,
                  label: row.label,
                  short_label: row.short_label,
                  sort_order: row.sort_order,
                  z_index: row.z_index,
                  is_clickable: row.is_clickable,
                  status: row.status,
                },
              ],
            );
            lastSavedPointsRef.current = JSON.stringify(preCancelShape.points);
          }
        }

        if (reloadData) {
          await reloadAreas();
        }
        return true;
      } catch (error) {
        console.error("Genplan cancel error:", error);
        if (!silent) {
          toast.error(t("buildingImage.polygon.saveError"));
        }
        return false;
      }
    },
    [
      clearAutoSaveTimer,
      genplan.masterplanId,
      getBackgroundUrlForUpsert,
      projectId,
      reloadAreas,
      resetStacks,
      setCurrentShape,
      t,
    ],
  );

  const handlePolygonCancel = async () => {
    await discardCurrentPolygonChanges();
  };

  const handleDeleteAreaPolygon = async (areaId: string) => {
    try {
      await deleteMasterplanArea(areaId);
      await reloadAreas();
      toast.success(t("buildingImage.genplan.polygon.deleteSuccess"));
      return true;
    } catch (error) {
      console.error("Genplan delete area error:", error);
      toast.error(t("buildingImage.polygon.deleteError"));
      return false;
    }
  };

  const resetEditing = () => {
    clearAutoSaveTimer();
    editingAreaIdRef.current = null;
    isCreatingNewAreaRef.current = false;
    setCurrentShape(null);
    setSelectedVertexIndex(null);
    setIsEditing(false);
    setEditingAreaId(null);
    setIsCreatingNewArea(false);
    preCancelShapeRef.current = null;
    resetStacks();
  };

  const setSelectedEntity = useCallback(
    (entityType: GenplanLinkedEntityType | null, entityId: string | null) => {
      setSelectedEntityType(entityType);
      setSelectedEntityId(entityId);
      selectedEntityTypeRef.current = entityType;
      selectedEntityIdRef.current = entityId;
    },
    [],
  );

  const selectEntity = useCallback(
    async (entityType: GenplanLinkedEntityType, entityId: string) => {
      const existing = findAreaForEntity(
        areasRef.current,
        entityType,
        entityId,
      );

      if (
        existing &&
        existing.id === editingAreaIdRef.current &&
        !isCreatingNewAreaRef.current
      ) {
        return;
      }

      if (
        !existing &&
        selectedEntityTypeRef.current === entityType &&
        selectedEntityIdRef.current === entityId &&
        isCreatingNewAreaRef.current
      ) {
        return;
      }

      const persisted = await persistCurrentPolygonBeforeEntitySwitch();
      if (!persisted) return;

      setSelectedEntity(entityType, entityId);

      if (existing) {
        requestStartEditingArea(existing.id);
        return;
      }

      startCreatingNewArea(entityType, entityId);
    },
    [
      persistCurrentPolygonBeforeEntitySwitch,
      requestStartEditingArea,
      setSelectedEntity,
      startCreatingNewArea,
    ],
  );

  const entityDisplayName = useCallback(
    (entityType: GenplanLinkedEntityType, entityId: string) => {
      if (entityType === "sub_project") {
        return genplan.subProjects.find((s) => s.id === entityId)?.name ?? "";
      }
      return infrastructureZones.find((z) => z.id === entityId)?.name ?? "";
    },
    [genplan.subProjects, infrastructureZones],
  );

  const subProjectCoverage = useMemo(() => {
    return genplan.subProjects.map((sp) => {
      const area = findAreaForEntity(genplan.areas, "sub_project", sp.id);
      return {
        subProject: sp,
        area,
        hasPolygon: areaHasValidPolygon(area),
      };
    });
  }, [genplan.areas, genplan.subProjects]);

  const missingSubProjects = useMemo(
    () =>
      subProjectCoverage
        .filter((row) => !row.hasPolygon)
        .map((r) => r.subProject),
    [subProjectCoverage],
  );

  const configuredSubProjectCount = useMemo(
    () => subProjectCoverage.filter((r) => r.hasPolygon).length,
    [subProjectCoverage],
  );

  const totalSubProjectsCount = genplan.subProjects.length;
  const hasCompletedAllSubProjects =
    totalSubProjectsCount > 0 && missingSubProjects.length === 0;

  return {
    selectedEntityType,
    selectedEntityId,
    setSelectedEntity,
    selectEntity,
    entityDisplayName,

    isEditing,
    editingAreaId,
    isCreatingNewArea,
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
    requestStartEditingArea,
    startCreatingNewArea,
    persistCurrentPolygonBeforeEntitySwitch,
    handlePolygonSave,
    handlePolygonCancel,
    handleDeleteAreaPolygon,
    resetEditing,

    shapes,
    labelMap,

    subProjectCoverage,
    missingSubProjects,
    configuredSubProjectCount,
    totalSubProjectsCount,
    hasCompletedAllSubProjects,
  };
}
