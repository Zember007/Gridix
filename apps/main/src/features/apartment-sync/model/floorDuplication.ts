import type { Json } from "@gridix/types/database";
import { supabase } from "@/shared/api/supabase";
import type {
  FloorDuplicationCopyOption,
  FloorDuplicationLoadedData,
  FloorDuplicationPreview,
  FloorDuplicationSourceApartment,
} from "./floorDuplicationPreview";

interface LoadFloorDuplicationDataParams {
  projectId: string;
  targetFloorNumbers: number[];
}

interface ApplyFloorDuplicationPreviewParams {
  projectId: string;
  preview: FloorDuplicationPreview;
  sourceImageUrl: string;
  sourceApartments: FloorDuplicationSourceApartment[];
  selectedCopyOptions: FloorDuplicationCopyOption[];
  onProgress?: (payload: FloorDuplicationProgressPayload) => void;
}

export interface FloorDuplicationProgressPayload {
  completed: number;
  total: number;
  currentFloor: number | null;
  currentOperation: "floor_image" | "apartment_polygon" | null;
}

export interface FloorDuplicationApplyResult {
  updatedFloorPlans: number;
  updatedPolygons: number;
  skippedMatches: number;
  errors: string[];
}

interface FloorDuplicationTaskResult {
  error: string | null;
  operation: FloorDuplicationProgressPayload["currentOperation"];
  floorNumber: number;
  updatedFloorPlans?: number;
  updatedPolygons?: number;
}

export const loadFloorDuplicationData = async ({
  projectId,
  targetFloorNumbers,
}: LoadFloorDuplicationDataParams): Promise<FloorDuplicationLoadedData> => {
  if (targetFloorNumbers.length === 0) {
    return {
      targetApartmentsByFloor: {},
      floorPlansByFloor: {},
    };
  }

  const [apartmentsResult, floorPlansResult] = await Promise.all([
    supabase
      .from("apartments")
      .select("id, floor_number, apartment_number, rooms, area, type")
      .eq("project_id", projectId)
      .in("floor_number", targetFloorNumbers)
      .order("apartment_number"),
    supabase
      .from("floor_plans")
      .select("id, floor_number, image_url")
      .eq("project_id", projectId)
      .in("floor_number", targetFloorNumbers),
  ]);

  if (apartmentsResult.error) {
    throw apartmentsResult.error;
  }

  if (floorPlansResult.error) {
    throw floorPlansResult.error;
  }

  const targetApartmentsByFloor = targetFloorNumbers.reduce<
    FloorDuplicationLoadedData["targetApartmentsByFloor"]
  >((acc, floorNumber) => {
    acc[floorNumber] = [];
    return acc;
  }, {});

  (apartmentsResult.data ?? []).forEach((apartment) => {
    const floorNumber = Number(apartment.floor_number);

    if (!targetApartmentsByFloor[floorNumber]) {
      targetApartmentsByFloor[floorNumber] = [];
    }

    targetApartmentsByFloor[floorNumber].push({
      id: apartment.id,
      floor_number: floorNumber,
      apartment_number: apartment.apartment_number,
      rooms: apartment.rooms,
      area: Number(apartment.area),
      type:
        (apartment.type as "apartment" | "commercial" | "parking") ??
        "apartment",
    });
  });

  const floorPlansByFloor = targetFloorNumbers.reduce<
    FloorDuplicationLoadedData["floorPlansByFloor"]
  >((acc, floorNumber) => {
    acc[floorNumber] = null;
    return acc;
  }, {});

  (floorPlansResult.data ?? []).forEach((floorPlan) => {
    floorPlansByFloor[Number(floorPlan.floor_number)] = {
      id: floorPlan.id,
      floor_number: Number(floorPlan.floor_number),
      image_url: floorPlan.image_url,
    };
  });

  return {
    targetApartmentsByFloor,
    floorPlansByFloor,
  };
};

export const applyFloorDuplicationPreview = async ({
  projectId,
  preview,
  sourceImageUrl,
  sourceApartments,
  selectedCopyOptions,
  onProgress,
}: ApplyFloorDuplicationPreviewParams): Promise<FloorDuplicationApplyResult> => {
  const shouldCopyFloorImage =
    selectedCopyOptions.includes("floor_image") && Boolean(sourceImageUrl);
  const shouldCopyPolygons = selectedCopyOptions.includes("apartment_polygons");

  const sourceApartmentsById = new Map(
    sourceApartments.map((apartment) => [apartment.id, apartment]),
  );

  const totalOperations = preview.summary.totalOperations;
  let completedOperations = 0;
  let updatedFloorPlans = 0;
  let updatedPolygons = 0;
  const errors: string[] = [];

  const reportProgress = (
    currentFloor: number | null,
    currentOperation: FloorDuplicationProgressPayload["currentOperation"],
  ) => {
    onProgress?.({
      completed: completedOperations,
      total: totalOperations,
      currentFloor,
      currentOperation,
    });
  };

  if (totalOperations === 0) {
    reportProgress(null, null);
    return {
      updatedFloorPlans,
      updatedPolygons,
      skippedMatches: preview.summary.skippedMatches,
      errors,
    };
  }

  const tasks: Array<Promise<FloorDuplicationTaskResult>> = [];

  preview.floors.forEach((floorPreview) => {
    if (
      shouldCopyFloorImage &&
      (floorPreview.floorPlanAction === "create" ||
        floorPreview.floorPlanAction === "update")
    ) {
      tasks.push(
        (async (): Promise<FloorDuplicationTaskResult> => {
          try {
            if (floorPreview.floorPlanAction === "create") {
              const { error } = await supabase.from("floor_plans").insert({
                project_id: projectId,
                floor_number: floorPreview.floorNumber,
                image_url: sourceImageUrl,
              });

              if (error) {
                throw error;
              }
            } else {
              const { error } = await supabase
                .from("floor_plans")
                .update({ image_url: sourceImageUrl })
                .eq("project_id", projectId)
                .eq("floor_number", floorPreview.floorNumber);

              if (error) {
                throw error;
              }
            }

            return {
              error: null,
              operation: "floor_image",
              floorNumber: floorPreview.floorNumber,
              updatedFloorPlans: 1,
            };
          } catch (error) {
            return {
              error: `floor_image:${floorPreview.floorNumber}:${error instanceof Error ? error.message : "unknown_error"}`,
              operation: "floor_image",
              floorNumber: floorPreview.floorNumber,
            };
          }
        })().finally(() => {
          completedOperations += 1;
          reportProgress(floorPreview.floorNumber, "floor_image");
        }),
      );
    }

    if (!shouldCopyPolygons) {
      return;
    }

    floorPreview.polygonMatches.forEach((match) => {
      tasks.push(
        (async (): Promise<FloorDuplicationTaskResult> => {
          const sourceApartment = sourceApartmentsById.get(
            match.sourceApartmentId,
          );

          if (!sourceApartment) {
            return {
              error: `apartment_polygon:${floorPreview.floorNumber}:${match.sourceApartmentNumber}:source_not_found`,
              operation: "apartment_polygon",
              floorNumber: floorPreview.floorNumber,
            };
          }

          try {
            const { error } = await supabase
              .from("apartments")
              .update({
                polygon: sourceApartment.polygon as Json,
              })
              .eq("id", match.targetApartmentId);

            if (error) {
              throw error;
            }

            return {
              error: null,
              operation: "apartment_polygon",
              floorNumber: floorPreview.floorNumber,
              updatedPolygons: 1,
            };
          } catch (error) {
            return {
              error: `apartment_polygon:${floorPreview.floorNumber}:${match.targetApartmentNumber}:${error instanceof Error ? error.message : "unknown_error"}`,
              operation: "apartment_polygon",
              floorNumber: floorPreview.floorNumber,
            };
          }
        })().finally(() => {
          completedOperations += 1;
          reportProgress(floorPreview.floorNumber, "apartment_polygon");
        }),
      );
    });
  });

  const results = await Promise.all(tasks);

  results.forEach((result) => {
    if (result.error) {
      errors.push(result.error);
    }

    updatedFloorPlans += result.updatedFloorPlans ?? 0;
    updatedPolygons += result.updatedPolygons ?? 0;
  });

  return {
    updatedFloorPlans,
    updatedPolygons,
    skippedMatches: preview.summary.skippedMatches,
    errors,
  };
};
