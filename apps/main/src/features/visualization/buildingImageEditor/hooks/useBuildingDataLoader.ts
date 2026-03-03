import React, { useState, useCallback, useMemo, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useProjectInEditorScope } from "@/features/projectEditor/hooks/useProjectInEditorScope";
import { useLanguage } from "@gridix/utils/react";
import { trackUsertourEvent } from "@gridix/utils/integrations";
import type { Shape } from "@/components/visualization/polygon-editor/GeometryShapes";
import type {
  BuildingFloor,
  ProjectFacade,
  FacadeDisplaySettings,
  BuildingDataSnapshot,
} from "../model/types";
import * as api from "../api/buildingImageEditorApi";

const initialBuildingDataCache = new Map<string, BuildingDataSnapshot>();
const initialBuildingDataInFlight = new Map<
  string,
  Promise<BuildingDataSnapshot>
>();

interface UseBuildingDataLoaderParams {
  projectId: string;
  currentImageUrl?: string | null;
}

export function useBuildingDataLoader({
  projectId,
  currentImageUrl,
}: UseBuildingDataLoaderParams) {
  const [facades, setFacades] = useState<ProjectFacade[]>([]);
  const [selectedFacadeId, setSelectedFacadeId] = useState<string | null>(null);
  const [buildingImage, setBuildingImage] = useState<string | null>(
    currentImageUrl || null,
  );
  const [buildingFloors, setBuildingFloors] = useState<BuildingFloor[]>([]);
  const [floors, setFloors] = useState<number>(1);
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [apartmentNumbers, setApartmentNumbers] = useState<number[]>([]);
  const [facadeDisplaySettings, setFacadeDisplaySettings] =
    useState<FacadeDisplaySettings>({
      colors: { building: "#3b82f6" },
      opacity: { normal: 0.4, hover: 0.7 },
    });
  const initializedProjectIdRef = useRef<string | null>(null);

  const { user } = useAuth();
  const { project } = useProjectInEditorScope(projectId);
  const { t } = useLanguage();

  const isObjectProject = project?.project_type === "object";

  const activeFacade = useMemo(
    () => facades.find((f) => f.id === selectedFacadeId) ?? facades[0] ?? null,
    [facades, selectedFacadeId],
  );

  const facadeConfigured =
    !!buildingImage &&
    buildingFloors.some(
      (f) => Array.isArray(f.polygon) && f.polygon.length > 0,
    );

  React.useEffect(() => {
    if (!facadeConfigured) return;
    void trackUsertourEvent({
      eventName: "gridix_project_facade_configured",
      properties: { project_id: project?.id || projectId },
      onceKey: "gridix_project_facade_configured",
    });
  }, [facadeConfigured, project?.id, projectId]);

  const fetchBuildingDataSnapshot = useCallback(
    async (
      preferredFacadeId?: string | null,
    ): Promise<BuildingDataSnapshot> => {
      const pid = project?.id || projectId;
      const projectFloors = project?.floors || 1;

      const loadedFacades = await api.fetchFacades(pid);

      let nextSelectedFacadeId = preferredFacadeId ?? selectedFacadeId;
      if (!nextSelectedFacadeId) {
        nextSelectedFacadeId = loadedFacades[0]?.id ?? null;
      } else if (!loadedFacades.some((f) => f.id === nextSelectedFacadeId)) {
        nextSelectedFacadeId = loadedFacades[0]?.id ?? null;
      }

      const active =
        loadedFacades.find((f) => f.id === nextSelectedFacadeId) ??
        loadedFacades[0] ??
        null;
      const activeUrl =
        active?.image_url ??
        project?.building_image_url ??
        currentImageUrl ??
        null;

      let apartmentNumbersSnapshot: number[] = [];
      if (isObjectProject) {
        apartmentNumbersSnapshot = await api.fetchApartmentNumbers(pid);
      }

      let normalizedFloors: BuildingFloor[] = [];
      if (nextSelectedFacadeId) {
        normalizedFloors = await api.fetchBuildingFloors(
          pid,
          nextSelectedFacadeId,
        );
      }

      const floorShapes: Shape[] = normalizedFloors.map((floor) => ({
        id: floor.id,
        type: "polygon",
        points: floor.polygon,
        color: floor.color || "#3b82f6",
        isSelected: false,
      }));

      const nextFacadeDisplaySettings =
        await api.fetchFacadeDisplaySettings(pid);

      return {
        floors: projectFloors,
        facades: loadedFacades,
        selectedFacadeId: nextSelectedFacadeId,
        buildingImage: activeUrl,
        buildingFloors: normalizedFloors,
        shapes: floorShapes,
        apartmentNumbers: apartmentNumbersSnapshot,
        facadeDisplaySettings: nextFacadeDisplaySettings,
      };
    },
    [
      currentImageUrl,
      isObjectProject,
      project?.building_image_url,
      project?.floors,
      project?.id,
      projectId,
      selectedFacadeId,
    ],
  );

  const applyBuildingDataSnapshot = useCallback(
    (snapshot: BuildingDataSnapshot) => {
      setFloors(snapshot.floors);
      setFacades(snapshot.facades);
      setSelectedFacadeId(snapshot.selectedFacadeId);
      setBuildingImage(snapshot.buildingImage);
      setBuildingFloors(snapshot.buildingFloors);
      setShapes(snapshot.shapes);
      setApartmentNumbers(snapshot.apartmentNumbers);
      setFacadeDisplaySettings(snapshot.facadeDisplaySettings);
    },
    [],
  );

  const loadBuildingData = useCallback(
    async (preferredFacadeId?: string | null) => {
      try {
        const snapshot = await fetchBuildingDataSnapshot(preferredFacadeId);
        applyBuildingDataSnapshot(snapshot);
        initialBuildingDataCache.set(projectId, snapshot);
      } catch (error) {
        console.error("Error loading building data:", error);
      }
    },
    [applyBuildingDataSnapshot, fetchBuildingDataSnapshot, projectId],
  );

  // Initial data loading with cache / dedup
  React.useEffect(() => {
    if (!projectId || !project) return;
    if (initializedProjectIdRef.current === projectId) return;
    initializedProjectIdRef.current = projectId;

    const cached = initialBuildingDataCache.get(projectId);
    if (cached) {
      applyBuildingDataSnapshot(cached);
      return;
    }

    const inFlight = initialBuildingDataInFlight.get(projectId);
    if (inFlight) {
      void inFlight
        .then((snapshot) => {
          applyBuildingDataSnapshot(snapshot);
        })
        .catch((error) => {
          initializedProjectIdRef.current = null;
          console.error("Error loading building data:", error);
        });
      return;
    }

    const request = fetchBuildingDataSnapshot();
    initialBuildingDataInFlight.set(projectId, request);

    void request
      .then((snapshot) => {
        initialBuildingDataCache.set(projectId, snapshot);
        applyBuildingDataSnapshot(snapshot);
      })
      .catch((error) => {
        initializedProjectIdRef.current = null;
        console.error("Error loading building data:", error);
      })
      .finally(() => {
        initialBuildingDataInFlight.delete(projectId);
      });
  }, [
    applyBuildingDataSnapshot,
    fetchBuildingDataSnapshot,
    project,
    projectId,
  ]);

  // Keep local image in sync with parent legacy URL
  React.useEffect(() => {
    if (!activeFacade && currentImageUrl && currentImageUrl !== buildingImage) {
      setBuildingImage(currentImageUrl);
    }
  }, [currentImageUrl, buildingImage, activeFacade]);

  return {
    facades,
    setFacades,
    selectedFacadeId,
    setSelectedFacadeId,
    buildingImage,
    setBuildingImage,
    buildingFloors,
    setBuildingFloors,
    floors,
    shapes,
    setShapes,
    apartmentNumbers,
    facadeDisplaySettings,
    setFacadeDisplaySettings,

    activeFacade,
    isObjectProject,
    project,
    user,
    t,

    loadBuildingData,
  };
}
