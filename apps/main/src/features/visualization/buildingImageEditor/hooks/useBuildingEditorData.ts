import { useCallback } from "react";
import type { BuildingImageEditorProps } from "../model/types";
import { useBuildingDataLoader } from "./useBuildingDataLoader";
import { useFacadeCrud } from "./useFacadeCrud";
import { useFloorPolygonEditor } from "./useFloorPolygonEditor";

export function useBuildingEditorData({
  projectId,
  subProjectId,
  initialFloors,
  subProjectType,
  currentImageUrl,
  onImageUpdate,
}: BuildingImageEditorProps) {
  const loader = useBuildingDataLoader({
    projectId,
    subProjectId,
    initialFloors,
    subProjectType: subProjectType === "genplan" ? undefined : subProjectType,
    currentImageUrl,
  });

  const facade = useFacadeCrud({
    facades: loader.facades,
    setFacades: loader.setFacades,
    setSelectedFacadeId: loader.setSelectedFacadeId,
    setBuildingImage: loader.setBuildingImage,
    setBuildingFloors: loader.setBuildingFloors,
    setShapes: loader.setShapes,
    activeFacade: loader.activeFacade,
    loadBuildingData: loader.loadBuildingData,
    projectId,
    subProjectId,
    project: loader.project,
    user: loader.user,
    t: loader.t,
    onImageUpdate,
  });

  const floor = useFloorPolygonEditor({
    buildingFloors: loader.buildingFloors,
    activeFacade: loader.activeFacade,
    facadeDisplaySettings: loader.facadeDisplaySettings,
    loadBuildingData: loader.loadBuildingData,
    projectId,
    subProjectId,
    project: loader.project,
    t: loader.t,
  });

  const selectFacade = useCallback(
    async (facadeId: string, imageUrl: string | null) => {
      if (floor.isEditing) return;
      loader.setSelectedFacadeId(facadeId);
      loader.setBuildingImage(imageUrl);
      loader.setBuildingFloors([]);
      loader.setShapes([]);
      floor.resetEditing();
      await loader.loadBuildingData(facadeId);
    },
    [floor, loader],
  );

  return { loader, facade, floor, selectFacade };
}
